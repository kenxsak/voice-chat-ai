import { NextResponse } from 'next/server';
import { getCollections } from '@/lib/mongodb';
import { rateLimit } from '@/lib/security';
import { closeConversationWithSummary } from '@/lib/conversation-storage';
import { lookup } from 'dns/promises';
import { isIP } from 'net';
import ipaddr from 'ipaddr.js';
import { getClientIp } from '@/lib/ip-utils';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

async function isValidWebhookUrl(url: string): Promise<boolean> {
  try {
    const parsed = new URL(url);
    
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false;
    }
    
    const hostname = parsed.hostname.toLowerCase();
    
    // Function to check if an IP is private/internal using ipaddr.js
    function isPrivateIP(ip: string): boolean {
      try {
        const addr = ipaddr.parse(ip);
        
        // Check if it's a private/internal range
        // range() returns one of: 'unicast', 'private', 'loopback', 'linkLocal', etc.
        const range = addr.range();
        
        // Block private, loopback, linkLocal, and other non-public ranges
        if (range === 'private' || range === 'loopback' || range === 'linkLocal' || 
            range === 'broadcast' || range === 'reserved' || range === 'unspecified') {
          return true;
        }
        
        return false;
      } catch {
        // If parsing fails, reject for safety
        return true;
      }
    }
    
    // Only check isPrivateIP if hostname is actually an IP
    if (isIP(hostname) && isPrivateIP(hostname)) {
      console.log(`[Webhook] Rejected ${url} - hostname is private IP`);
      return false;
    }
    
    // Resolve DNS for hostnames and check all returned addresses
    if (!isIP(hostname)) {
      try {
        const addresses = await lookup(hostname, { all: true });
        
        // Check if ANY of the resolved addresses is private
        for (const { address } of addresses) {
          if (isPrivateIP(address)) {
            console.log(`[Webhook] Rejected ${url} - resolves to private IP ${address}`);
            return false;
          }
        }
      } catch (dnsError) {
        console.log(`[Webhook] DNS lookup failed for ${hostname}`);
        return false;
      }
    }
    
    return true;
  } catch {
    return false;
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: Request) {
  try {
    const limited = rateLimit(request, 'close_conversation_post', 30, 60_000);
    if (limited) return limited;

    const body = await request.json();
    const { conversationId, tenantId, sessionId, agentName, businessContext, websiteContext, reference, agentAvatarUrl } = body;

    if (!conversationId || !tenantId) {
      return NextResponse.json(
        { message: 'Missing required fields: conversationId, tenantId' },
        { status: 400, headers: corsHeaders }
      );
    }
    
    const clientIp = getClientIp(request);

    console.log('[Close Conversation API] Closing conversation:', { conversationId, tenantId, clientIp });

    // Fetch tenant from database to get fresh training contexts
    const { tenants } = await getCollections();
    const tenant = await tenants.findOne({ id: tenantId });
    
    if (!tenant) {
      return NextResponse.json(
        { message: 'Tenant not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Find the matching agent by name to get current training contexts
    const matchingAgent = tenant.agents?.find((agent: any) => agent.name === agentName);
    
    // Build websiteContext from current agent or tenant training contexts
    let freshWebsiteContext = 'N/A';
    const currentTrainingContexts = matchingAgent?.trainingContexts || tenant.trainingContexts || [];
    
    if (currentTrainingContexts.length > 0) {
      const contextSources = currentTrainingContexts.map((c: any) => {
        if (c.websiteUrl) return c.websiteUrl;
        if (c.sourceInfo) return c.sourceInfo;
        if (c.docInfo) return c.docInfo;
        return null;
      }).filter(Boolean);
      
      freshWebsiteContext = contextSources.length > 0 ? contextSources.join(', ') : 'N/A';
    }
    
    console.log('[Close Conversation API] Using fresh website context:', freshWebsiteContext);

    // closeConversationWithSummary includes atomic check to prevent race conditions
    const contactInfo = await closeConversationWithSummary(
      conversationId,
      agentName,
      businessContext
    );
    
    // Check if conversation was already closed by another request
    if (contactInfo.alreadyClosed) {
      console.log('[Close Conversation API] Conversation already closed, skipping duplicate lead creation');
      return NextResponse.json(
        {
          success: true,
          conversationClosed: false,
          message: 'Conversation was already closed',
          alreadyClosed: true
        },
        { headers: corsHeaders }
      );
    }

    console.log('[Close Conversation API] Conversation closed, contact info:', {
      hasName: !!contactInfo.customerName,
      hasEmail: !!contactInfo.customerEmail,
      hasPhone: !!contactInfo.customerPhone,
    });

    if (contactInfo.customerName || contactInfo.customerEmail || contactInfo.customerPhone) {
      console.log('[Close Conversation API] Creating lead with extracted contact info');
      
      const { leads, messages } = await getCollections();
      const leadId = `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const customerInfoParts = [
        contactInfo.customerName,
        contactInfo.customerEmail,
        contactInfo.customerPhone
      ].filter(Boolean);
      const customerInfo = customerInfoParts.join(', ');
      
      const emailMatch = contactInfo.customerEmail?.toLowerCase() || null;
      const phoneMatch = contactInfo.customerPhone?.replace(/[^0-9+]/g, '') || null;
      const normalizedName = contactInfo.customerName?.toLowerCase().replace(/[^a-z\s]/g, '').trim() || null;
      
      const leadDate = new Date();
      const periodMonth = `${leadDate.getUTCFullYear()}-${String(leadDate.getUTCMonth() + 1).padStart(2, '0')}`;
      
      // Fetch conversation history to save with lead
      const conversationMessages = await messages
        .find({ conversationId })
        .sort({ timestamp: 1 })
        .toArray();
      
      // Extract imageUrl from messages if present
      const imageMessage = conversationMessages.find(m => m.imageDataUri);
      const imageUrl = imageMessage?.imageDataUri || null;
      
      const fullHistory = conversationMessages.map(m => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp
      }));
      
      // Calculate total tokens used in conversation
      const totalTokens = conversationMessages.reduce((sum, m) => sum + (m.tokenCount || 0), 0);
      
      // Calculate separate input/output tokens for cost tracking
      const inputTokens = conversationMessages
        .filter(m => m.role === 'user')
        .reduce((sum, m) => sum + (m.inputTokenCount || m.tokenCount || 0), 0);
      
      const outputTokens = conversationMessages
        .filter(m => m.role === 'agent')
        .reduce((sum, m) => sum + (m.outputTokenCount || m.tokenCount || 0), 0);
      
      const leadDocument = {
        id: leadId,
        tenantId,
        sessionId: sessionId || conversationId,
        customerId: null,
        customerInfo,
        customerName: contactInfo.customerName,
        customerEmail: contactInfo.customerEmail,
        customerPhone: contactInfo.customerPhone,
        normalizedEmail: emailMatch || undefined,
        normalizedPhone: phoneMatch || undefined,
        normalizedName: normalizedName || undefined,
        summary: contactInfo.summary,
        summaryData: {
          customerName: contactInfo.customerName,
          customerEmail: contactInfo.customerEmail,
          customerPhone: contactInfo.customerPhone,
        },
        history: fullHistory,
        totalTokens: totalTokens,
        inputTokens: inputTokens,
        outputTokens: outputTokens,
        imageUrl: imageUrl,
        websiteContext: freshWebsiteContext,
        reference: reference || `Chat with ${agentName || 'Support AI Agent'}`,
        agentAvatarUrl: agentAvatarUrl || null,
        ipAddress: clientIp || null,
        status: 'Follow-up needed',
        date: leadDate.toISOString(),
        createdAt: leadDate,
        lastUpdated: leadDate,
        periodMonth,
      };

      let upsertFilter: any = null;
      // CRITICAL FIX: Prioritize sessionId as PRIMARY deduplication key to prevent duplicate recent interactions
      // This ensures one lead per conversation session, solving the duplicate data issue
      if (sessionId) {
        upsertFilter = { tenantId, periodMonth, sessionId };
      } else if (emailMatch) {
        upsertFilter = { tenantId, periodMonth, normalizedEmail: emailMatch };
      } else if (phoneMatch && phoneMatch.length >= 6) {
        upsertFilter = { tenantId, periodMonth, normalizedPhone: phoneMatch };
      } else if (normalizedName && normalizedName.length >= 3) {
        upsertFilter = { tenantId, periodMonth, normalizedName };
      }

      if (upsertFilter) {
        console.log('[Close Conversation API] Using upsert with filter:', upsertFilter);
        const { id, createdAt, ...leadDataForUpdate } = leadDocument;
        const upsertResult = await leads.updateOne(
          upsertFilter,
          {
            $setOnInsert: { id: leadId, createdAt: createdAt || new Date() },
            $set: leadDataForUpdate
          },
          { upsert: true }
        );
        
        if (upsertResult.upsertedCount > 0) {
          console.log('[Close Conversation API] New lead created via upsert:', leadId);
        } else if (upsertResult.modifiedCount > 0) {
          console.log('[Close Conversation API] Existing lead updated:', upsertFilter);
        } else {
          console.log('[Close Conversation API] Lead matched but no changes needed');
        }
      } else {
        console.log('[Close Conversation API] Inserting new lead (no upsert filter)');
        await leads.insertOne(leadDocument);
        console.log('[Close Conversation API] Lead inserted successfully:', leadId);
      }

      // Send webhook notification if configured
      try {
        if (tenant?.leadWebhookUrl) {
          const isValid = await isValidWebhookUrl(tenant.leadWebhookUrl);
          if (isValid) {
            console.log('[Close Conversation API] Sending lead webhook notification');
          
          // Send webhook with same format as generate-agent-response
          try {
            const webhookPromise = fetch(tenant.leadWebhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                leadName: contactInfo.customerName,
                leadEmail: contactInfo.customerEmail,
                leadPhone: contactInfo.customerPhone,
                conversationSummary: contactInfo.summary,
                fullHistory,
                capturedAt: new Date().toISOString(),
                agent: {
                  name: agentName || 'AI Agent',
                  description: businessContext || '',
                },
                sourceWebsite: '',
              })
            });
            
            // Race with 5s timeout to prevent blocking
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Webhook timeout')), 5000)
            );
            
            const response = await Promise.race([webhookPromise, timeoutPromise]) as Response;
            
            if (response.ok) {
              console.log('[Close Conversation API] Webhook sent successfully');
            } else {
              console.error('[Close Conversation API] Webhook failed:', response.status);
            }
          } catch (error) {
            console.error('[Close Conversation API] Webhook error:', error);
          }
          } else {
            console.log('[Close Conversation API] Invalid webhook URL, skipping');
          }
        } else {
          console.log('[Close Conversation API] No webhook URL configured for tenant');
        }
      } catch (webhookError: any) {
        // Don't fail the request if webhook fails
        console.error('[Close Conversation API] Webhook notification error:', webhookError.message);
      }

      return NextResponse.json(
        {
          success: true,
          conversationClosed: true,
          leadCreated: true,
          leadId,
          contactInfo,
        },
        { headers: corsHeaders }
      );
    } else {
      console.log('[Close Conversation API] No contact info extracted, creating anonymous conversation lead');
      
      const { leads, messages } = await getCollections();
      const leadId = `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const leadDate = new Date();
      const periodMonth = `${leadDate.getUTCFullYear()}-${String(leadDate.getUTCMonth() + 1).padStart(2, '0')}`;
      
      // Fetch conversation history for anonymous conversation
      const conversationMessages = await messages
        .find({ conversationId })
        .sort({ timestamp: 1 })
        .toArray();
      
      // Extract imageUrl from messages if present
      const imageMessage = conversationMessages.find(m => m.imageDataUri);
      const imageUrl = imageMessage?.imageDataUri || null;
      
      const fullHistory = conversationMessages.map(m => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp
      }));
      
      // Calculate total tokens for anonymous conversation
      const totalTokens = conversationMessages.reduce((sum, m) => sum + (m.tokenCount || 0), 0);
      
      // Calculate separate input/output tokens for cost tracking
      const inputTokens = conversationMessages
        .filter(m => m.role === 'user')
        .reduce((sum, m) => sum + (m.inputTokenCount || m.tokenCount || 0), 0);
      
      const outputTokens = conversationMessages
        .filter(m => m.role === 'agent')
        .reduce((sum, m) => sum + (m.outputTokenCount || m.tokenCount || 0), 0);
      
      const anonymousLeadDocument = {
        id: leadId,
        tenantId,
        sessionId: sessionId || conversationId,
        customerId: null,
        customerInfo: 'Anonymous User',
        customerName: null,
        customerEmail: null,
        customerPhone: null,
        summary: contactInfo.summary || 'Anonymous conversation',
        summaryData: {},
        history: fullHistory,
        totalTokens: totalTokens,
        inputTokens: inputTokens,
        outputTokens: outputTokens,
        imageUrl: imageUrl,
        websiteContext: freshWebsiteContext,
        reference: reference || `Chat with ${agentName || 'Support AI Agent'}`,
        agentAvatarUrl: agentAvatarUrl || null,
        ipAddress: clientIp || null,
        isAnonymous: true,
        status: 'Anonymous',
        date: leadDate.toISOString(),
        createdAt: leadDate,
        lastUpdated: leadDate,
        periodMonth,
      };
      
      // Use sessionId for deduplication of anonymous conversations
      const upsertFilter = sessionId ? { tenantId, periodMonth, sessionId } : null;
      
      if (upsertFilter) {
        const { id, createdAt, ...leadDataForUpdate } = anonymousLeadDocument;
        await leads.updateOne(
          upsertFilter,
          {
            $setOnInsert: { id: leadId, createdAt: createdAt || new Date() },
            $set: leadDataForUpdate
          },
          { upsert: true }
        );
      } else {
        await leads.insertOne(anonymousLeadDocument);
      }
      
      console.log('[Close Conversation API] Anonymous conversation lead created:', leadId);
      
      return NextResponse.json(
        {
          success: true,
          conversationClosed: true,
          leadCreated: true,
          isAnonymous: true,
          leadId,
          contactInfo,
        },
        { headers: corsHeaders }
      );
    }
  } catch (error: any) {
    console.error('[API /api/conversations/close POST] Error:', error);
    return NextResponse.json(
      { message: 'Server error', error: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}
