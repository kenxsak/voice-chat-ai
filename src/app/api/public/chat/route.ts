import { NextResponse } from 'next/server';
import { getCollections, getDb } from '@/lib/mongodb';
import { rateLimit } from '@/lib/security';
import {
  getOrCreateConversation,
  getConversationMessages,
  saveMessage,
  findCustomerByContact,
  createOrUpdateCustomer,
  updateConversationSummary,
} from '@/lib/conversation-storage';
import { generateAgentResponse } from '@/ai/flows/generate-agent-response';
import { generateConversationSummary } from '@/ai/flows/generate-conversation-summary';
import { estimateContentTokens } from '@/lib/token-counter';
import { checkTokenLimit, incrementTokenUsage } from '@/lib/token-enforcement';
import { getClientIp } from '@/lib/ip-utils';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: Request) {
  try {
    const limited = rateLimit(request, 'public_chat_post', 60, 60_000);
    if (limited) return limited;

    const body = await request.json();
    const {
      tenantId,
      sessionId,
      query,
      agentName,
      agentDescription,
      agentVoice,
      languageCode,
      knowledgeContexts,
      history,
      leadWebhookUrl,
      imageDataUri,
      agentTone,
      agentResponseStyle,
      agentExpertiseLevel,
      agentCustomInstructions,
    } = body;

    if (!tenantId || !sessionId || !query) {
      return NextResponse.json(
        { message: 'Missing required fields: tenantId, sessionId, query' },
        { status: 400, headers: corsHeaders }
      );
    }

    const { tenants } = await getCollections();
    const tenant: any = await tenants.findOne({ id: tenantId });
    if (!tenant) {
      return NextResponse.json(
        { message: 'Tenant not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    const tokenLimitCheck = await checkTokenLimit(tenantId);
    if (!tokenLimitCheck.allowed) {
      console.log('[Chat API] Token limit exceeded for tenant:', tenantId, tokenLimitCheck);
      return NextResponse.json(
        { 
          message: tokenLimitCheck.message,
          tokenLimitExceeded: true,
          percentUsed: tokenLimitCheck.percentUsed,
          limit: tokenLimitCheck.limit,
          planName: tokenLimitCheck.planName
        },
        { status: 429, headers: corsHeaders }
      );
    }

    if (tokenLimitCheck.message && tokenLimitCheck.percentUsed && tokenLimitCheck.percentUsed >= 80) {
      console.log('[Chat API] Token usage warning for tenant:', tenantId, `${tokenLimitCheck.percentUsed}% used`);
    }

    const agentId = agentName || tenant.name || 'Assistant';
    const clientIp = getClientIp(request);
    
    let conversation = await getOrCreateConversation(tenantId, sessionId, agentId, null, clientIp);
    
    console.log('[Chat API] Processing chat request:', {
      tenantId,
      sessionId,
      agentId,
      conversationId: conversation.id,
      existingCustomerId: conversation.customerId,
      clientIp
    });
    
    const existingMessages = await getConversationMessages(conversation.id);
    const dbHistory = existingMessages.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));

    const effectiveHistory = dbHistory.length > 0 ? dbHistory : (history || []);

    // Prepare user message content (but don't save yet - wait for AI success)
    let userMessageContent: string | any[] = query;
    if (imageDataUri) {
      userMessageContent = [
        { text: query },
        { media: { url: imageDataUri } }
      ];
    }
    
    // Calculate token count for user message
    const userTokenCount = estimateContentTokens(userMessageContent);
    
    // Optimize knowledge contexts: Use only pre-scraped content, remove websiteUrl to prevent live scraping
    const optimizedKnowledgeContexts = (knowledgeContexts || tenant.trainingContexts || []).map((ctx: any) => ({
      uploadedDocContent: ctx.uploadedDocContent || ctx.extractedText || '',
      documentInfo: ctx.sourceInfo || ctx.docInfo || 'Training Data',
      // Remove websiteUrl to prevent getWebsiteContextTool from triggering
    })).filter((ctx: any) => ctx.uploadedDocContent && ctx.uploadedDocContent.trim().length > 0);
    
    console.log('[Chat API] Using optimized knowledge contexts:', {
      originalCount: (knowledgeContexts || tenant.trainingContexts || []).length,
      optimizedCount: optimizedKnowledgeContexts.length,
      totalChars: optimizedKnowledgeContexts.reduce((sum: number, ctx: any) => sum + ctx.uploadedDocContent.length, 0)
    });

    let aiResponse;
    try {
      aiResponse = await generateAgentResponse({
        query,
        agentName: agentName || tenant.name || 'Assistant',
        agentDescription: agentDescription || tenant.companyDetails || 'I am here to help you.',
        agentVoice,
        languageCode: languageCode || 'en-US',
        knowledgeContexts: optimizedKnowledgeContexts,
        history: effectiveHistory,
        leadWebhookUrl,
        imageDataUri,
        agentTone,
        agentResponseStyle,
        agentExpertiseLevel,
        agentCustomInstructions,
      });
    } catch (aiError: any) {
      console.error('[Chat API] AI generation failed:', aiError.message);
      
      // Return graceful fallback response instead of 500 error
      return NextResponse.json(
        {
          response: "I apologize for the delay. I'm experiencing some technical difficulties right now. Could you please rephrase your question or try again in a moment?",
          conversationId: conversation.id,
          customerId: conversation.customerId || null,
          isReturningCustomer: false,
          conversationSummary: "AI generation failed - fallback response provided",
          leadName: null,
          leadEmail: null,
          leadPhone: null,
          knowledgeGapQuery: null,
          knowledgeGapCategory: null,
        },
        { status: 200, headers: corsHeaders }
      );
    }

    // Only save messages AFTER AI response succeeds (prevents duplicate entries on retry)
    await saveMessage(conversation.id, tenantId, 'user', userMessageContent, userTokenCount, imageDataUri);
    
    // Calculate token count for agent response
    const agentTokenCount = estimateContentTokens(aiResponse.response);
    await saveMessage(conversation.id, tenantId, 'agent', aiResponse.response, agentTokenCount);

    const totalTokensUsed = userTokenCount + agentTokenCount;
    await incrementTokenUsage(tenantId, totalTokensUsed);
    console.log('[Chat API] Token usage updated:', {
      tenantId,
      userTokens: userTokenCount,
      agentTokens: agentTokenCount,
      totalUsed: totalTokensUsed
    });

    if (aiResponse.conversationSummary) {
      await updateConversationSummary(conversation.id, aiResponse.conversationSummary);
    }

    let customerId = conversation.customerId;
    let customer = null;
    let isReturningCustomer = false;
    let totalCustomerSessions = 1;
    
    if (aiResponse.leadEmail || aiResponse.leadPhone || aiResponse.leadName) {
      console.log('[Chat API] Contact information detected, checking for existing customer');
      
      const existingCustomer = await findCustomerByContact(
        tenantId,
        aiResponse.leadEmail,
        aiResponse.leadPhone,
        aiResponse.leadName
      );

      if (existingCustomer) {
        console.log('[Chat API] ✓ Found existing customer:', {
          customerId: existingCustomer.id,
          name: existingCustomer.name,
          email: existingCustomer.email,
          phone: existingCustomer.phone,
          totalSessions: existingCustomer.sessions.length
        });
        customer = existingCustomer;
      }

      if (!customer) {
        customer = await createOrUpdateCustomer(
          tenantId,
          sessionId,
          aiResponse.leadEmail,
          aiResponse.leadPhone,
          aiResponse.leadName,
          clientIp
        );
      } else if (!customer.sessions.includes(sessionId)) {
        const db = await getDb();
        const customersCollection = db.collection('customers');
        const updateOps: any = { 
          $addToSet: { sessions: sessionId },
          $set: { lastSeen: new Date() }
        };
        if (clientIp) {
          updateOps.$addToSet.ipAddresses = clientIp;
        }
        await customersCollection.updateOne(
          { id: customer.id },
          updateOps
        );
        customer.sessions.push(sessionId);
        if (clientIp && (!customer.ipAddresses || !customer.ipAddresses.includes(clientIp))) {
          customer.ipAddresses = [...(customer.ipAddresses || []), clientIp];
        }
      }

      if (customer) {
        customerId = customer.id;
        isReturningCustomer = customer.sessions.length > 1 || customer.isReturning || false;
        totalCustomerSessions = customer.sessions.length;
        
        console.log('[Chat API] Customer processed:', {
          customerId: customer.id,
          isReturning: isReturningCustomer,
          totalSessions: totalCustomerSessions
        });

        if (customerId && customerId !== conversation.customerId) {
          console.log('[Chat API] Linking conversation to customer');
          conversation = await getOrCreateConversation(tenantId, sessionId, agentId, customerId, clientIp);
        }
      }
    }

    if (customer) {
      console.log('[Chat API] ✓ Lead qualified - contact information captured:', {
        hasName: !!customer.name,
        hasEmail: !!customer.email,
        hasPhone: !!customer.phone,
        customerId: customer.id,
      });
    } else if (aiResponse.leadEmail || aiResponse.leadPhone || aiResponse.leadName) {
      console.log('[Chat API] ⚠ Partial contact info detected but customer not created');
    } else {
      console.log('[Chat API] → Conversation ongoing - no contact information captured yet');
    }

    return NextResponse.json(
      {
        response: aiResponse.response,
        conversationId: conversation.id,
        customerId: customerId || null,
        isReturningCustomer,
        conversationSummary: aiResponse.conversationSummary,
        leadName: aiResponse.leadName,
        leadEmail: aiResponse.leadEmail,
        leadPhone: aiResponse.leadPhone,
        knowledgeGapQuery: aiResponse.knowledgeGapQuery,
        knowledgeGapCategory: aiResponse.knowledgeGapCategory,
      },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('[API /api/public/chat POST] Error:', error);
    return NextResponse.json(
      { message: 'Server error', error: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}
