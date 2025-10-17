import { getDb } from './mongodb';
import { ObjectId } from 'mongodb';
import { generateConversationSummary } from '@/ai/flows/generate-conversation-summary';

export interface Conversation {
  _id?: ObjectId;
  id: string;
  tenantId: string;
  sessionId: string;
  agentId: string;
  customerId: string | null;
  status: 'active' | 'closing' | 'closed';
  summary: string;
  closedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  ipAddress?: string | null;
}

export interface Message {
  _id?: ObjectId;
  id: string;
  conversationId: string;
  tenantId: string;
  role: 'user' | 'agent';
  content: string | any[];
  timestamp: Date;
  tokenCount?: number;
  inputTokenCount?: number;
  outputTokenCount?: number;
  imageDataUri?: string;
}

export interface Customer {
  _id?: ObjectId;
  id: string;
  tenantId: string;
  email: string | null;
  phone: string | null;
  normalizedEmail?: string | null;
  normalizedPhone?: string | null;
  name: string | null;
  sessions: string[];
  firstSeen: Date;
  lastSeen: Date;
  isReturning?: boolean;
  totalSessions?: number;
  ipAddresses?: string[];
}

function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  
  const cleaned = phone.replace(/[\s\-\(\)\.\+]/g, '');
  
  if (cleaned.length < 6) return null;
  
  if (cleaned.startsWith('1') && cleaned.length === 11) {
    return cleaned.substring(1);
  }
  
  return cleaned;
}

function normalizeEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  return email.toLowerCase().trim();
}

export async function getOrCreateConversation(
  tenantId: string,
  sessionId: string,
  agentId: string,
  customerId?: string | null,
  ipAddress?: string | null
): Promise<Conversation> {
  const db = await getDb();
  const conversationsCollection = db.collection<Conversation>('conversations');

  const now = new Date();
  
  const existingWithSameAgent = await conversationsCollection.findOne({
    tenantId,
    sessionId,
    agentId,
    status: { $ne: 'closed' },
  });

  if (existingWithSameAgent) {
    const updateData: any = { updatedAt: now };
    if (customerId && existingWithSameAgent.customerId !== customerId) {
      updateData.customerId = customerId;
    }
    if (ipAddress && !existingWithSameAgent.ipAddress) {
      updateData.ipAddress = ipAddress;
    }
    
    await conversationsCollection.updateOne(
      { _id: existingWithSameAgent._id },
      { $set: updateData }
    );
    
    return { ...existingWithSameAgent, ...updateData };
  }

  const existingWithDifferentAgent = await conversationsCollection.findOne({
    tenantId,
    sessionId,
    status: { $ne: 'closed' },
  });

  if (existingWithDifferentAgent) {
    console.log('[Conversation Storage] Agent switched in same session, updating conversation');
    const updateData: any = { 
      agentId,
      updatedAt: now 
    };
    if (customerId && existingWithDifferentAgent.customerId !== customerId) {
      updateData.customerId = customerId;
    }
    if (ipAddress && !existingWithDifferentAgent.ipAddress) {
      updateData.ipAddress = ipAddress;
    }
    
    await conversationsCollection.updateOne(
      { _id: existingWithDifferentAgent._id },
      { $set: updateData }
    );
    
    return { ...existingWithDifferentAgent, ...updateData };
  }
  
  const maxRetries = 5;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newConversation: Conversation = {
        id: conversationId,
        tenantId,
        sessionId,
        agentId,
        customerId: customerId ?? null,
        status: 'active',
        summary: '',
        closedAt: null,
        createdAt: now,
        updatedAt: now,
        ipAddress: ipAddress ?? null,
      };

      await conversationsCollection.insertOne(newConversation);
      console.log('[Conversation Storage] Created new conversation:', conversationId);
      return newConversation;
    } catch (error: any) {
      if (error.code === 11000) {
        console.log(`[Conversation Storage] Duplicate key detected, attempt ${attempt + 1}/${maxRetries}`);
        
        await new Promise(resolve => setTimeout(resolve, 100 * (attempt + 1)));
        
        const existingConv = await conversationsCollection.findOne({
          tenantId,
          sessionId,
          agentId,
        });
        
        if (existingConv) {
          console.log('[Conversation Storage] Found existing conversation (possibly closed), reopening it');
          
          const updateData: any = { 
            updatedAt: now,
            status: 'active',
            closedAt: null
          };
          
          if (customerId && existingConv.customerId !== customerId) {
            updateData.customerId = customerId;
          }
          
          await conversationsCollection.updateOne(
            { _id: existingConv._id },
            { $set: updateData }
          );
          
          return { ...existingConv, ...updateData };
        }
        
        if (attempt < maxRetries - 1) {
          continue;
        }
      }
      
      console.error('[Conversation Storage] Error creating conversation:', error);
      throw error;
    }
  }
  
  throw new Error('Failed to create or retrieve conversation after retries');
}

export async function getConversationMessages(conversationId: string): Promise<Message[]> {
  const db = await getDb();
  const messagesCollection = db.collection<Message>('messages');

  const messages = await messagesCollection
    .find({ conversationId })
    .sort({ timestamp: 1 })
    .toArray();

  return messages;
}

export async function saveMessage(
  conversationId: string,
  tenantId: string,
  role: 'user' | 'agent',
  content: string | any[],
  tokenCount?: number,
  imageDataUri?: string,
  inputTokenCount?: number,
  outputTokenCount?: number
): Promise<Message> {
  const db = await getDb();
  const messagesCollection = db.collection<Message>('messages');

  const newMessage: Message = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    conversationId,
    tenantId,
    role,
    content,
    timestamp: new Date(),
    tokenCount,
    inputTokenCount,
    outputTokenCount,
    imageDataUri,
  };

  await messagesCollection.insertOne(newMessage);

  const conversationsCollection = db.collection<Conversation>('conversations');
  await conversationsCollection.updateOne(
    { id: conversationId },
    { $set: { updatedAt: new Date() } }
  );

  return newMessage;
}

export async function findCustomerByContact(
  tenantId: string,
  email?: string | null,
  phone?: string | null,
  name?: string | null
): Promise<Customer | null> {
  if (!email && !phone && !name) {
    return null;
  }

  const db = await getDb();
  const customersCollection = db.collection<Customer>('customers');

  const normalizedEmail = normalizeEmail(email);
  const normalizedPhone = normalizePhone(phone);
  
  console.log('[Customer Matching] Attempting to find customer:', {
    tenantId,
    email: normalizedEmail ? `${normalizedEmail.substring(0, 3)}***` : null,
    phone: normalizedPhone ? `***${normalizedPhone.slice(-4)}` : null,
    name: name ? `${name.substring(0, 3)}***` : null
  });

  const query: any = { tenantId };
  const orConditions: any[] = [];

  if (normalizedEmail) {
    orConditions.push({ normalizedEmail });
    orConditions.push({ email: normalizedEmail });
  }
  
  if (normalizedPhone) {
    orConditions.push({ normalizedPhone });
    orConditions.push({ phone: normalizedPhone });
  }

  if (orConditions.length > 0) {
    query.$or = orConditions;
  }

  const customer = await customersCollection.findOne(query);
  
  if (customer) {
    const needsMigration = (normalizedEmail && !customer.normalizedEmail) || (normalizedPhone && !customer.normalizedPhone);
    
    if (needsMigration) {
      console.log('[Customer Matching] Migrating customer to use normalized fields');
      const migrationUpdate: any = {};
      
      if (normalizedEmail && !customer.normalizedEmail) {
        migrationUpdate.normalizedEmail = normalizedEmail;
      }
      if (normalizedPhone && !customer.normalizedPhone) {
        migrationUpdate.normalizedPhone = normalizedPhone;
      }
      
      await customersCollection.updateOne(
        { _id: customer._id },
        { $set: migrationUpdate }
      );
      
      Object.assign(customer, migrationUpdate);
    }
    
    console.log('[Customer Matching] ✓ RETURNING CUSTOMER DETECTED:', {
      customerId: customer.id,
      matchedBy: normalizedEmail ? 'email' : (normalizedPhone ? 'phone' : 'other'),
      sessions: customer.sessions.length,
      firstSeen: customer.firstSeen,
      lastSeen: customer.lastSeen
    });
  } else {
    console.log('[Customer Matching] No existing customer found - new customer');
  }
  
  return customer;
}

export async function createOrUpdateCustomer(
  tenantId: string,
  sessionId: string,
  email?: string | null,
  phone?: string | null,
  name?: string | null,
  ipAddress?: string | null
): Promise<Customer | null> {
  if (!email && !phone && !name) {
    console.log('[Customer Update] No contact info provided, skipping customer creation');
    return null;
  }

  const db = await getDb();
  const customersCollection = db.collection<Customer>('customers');

  const normalizedEmail = normalizeEmail(email);
  const normalizedPhone = normalizePhone(phone);

  const existing = await findCustomerByContact(tenantId, email, phone, name);

  if (existing) {
    const isNewSession = !existing.sessions.includes(sessionId);
    const updatedSessions = isNewSession ? [...existing.sessions, sessionId] : existing.sessions;
    
    console.log('[Customer Update] ✓ Updating RETURNING customer:', {
      customerId: existing.id,
      isNewSession,
      totalSessions: updatedSessions.length,
      newSessionId: isNewSession ? sessionId : 'already tracked'
    });
    
    const updateFields: any = { 
      lastSeen: new Date(),
      isReturning: updatedSessions.length > 1,
      totalSessions: updatedSessions.length
    };
    
    const addToSetFields: any = {};

    if (name && !existing.name) {
      updateFields.name = name;
      console.log('[Customer Update] Adding name to existing customer');
    } else if (name && existing.name !== name) {
      updateFields.name = name;
      console.log('[Customer Update] Updating customer name');
    }
    
    if (email && !existing.email) {
      updateFields.email = email;
      console.log('[Customer Update] Adding email to existing customer');
    }
    
    if (phone && !existing.phone) {
      updateFields.phone = phone;
      console.log('[Customer Update] Adding phone to existing customer');
    }

    if (normalizedEmail && !existing.normalizedEmail) {
      updateFields.normalizedEmail = normalizedEmail;
      console.log('[Customer Update] Adding normalized email to existing customer');
    }
    
    if (normalizedPhone && !existing.normalizedPhone) {
      updateFields.normalizedPhone = normalizedPhone;
      console.log('[Customer Update] Adding normalized phone to existing customer');
    }

    if (isNewSession) {
      updateFields.sessions = updatedSessions;
    }
    
    if (ipAddress) {
      addToSetFields.ipAddresses = ipAddress;
    }

    const updateOperation: any = { $set: updateFields };
    if (Object.keys(addToSetFields).length > 0) {
      updateOperation.$addToSet = addToSetFields;
    }

    await customersCollection.updateOne(
      { _id: existing._id },
      updateOperation
    );

    const updatedIpAddresses = ipAddress && (!existing.ipAddresses || !existing.ipAddresses.includes(ipAddress))
      ? [...(existing.ipAddresses || []), ipAddress]
      : existing.ipAddresses;

    return {
      ...existing,
      ...updateFields,
      ipAddresses: updatedIpAddresses,
    };
  }

  console.log('[Customer Update] Creating NEW customer:', {
    email: email ? `${email.substring(0, 3)}***` : null,
    phone: phone ? `***${phone.slice(-4)}` : null,
    sessionId
  });

  const newCustomer: Customer = {
    id: `cust_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    tenantId,
    email: email || null,
    phone: phone || null,
    normalizedEmail,
    normalizedPhone,
    name: name || null,
    sessions: [sessionId],
    firstSeen: new Date(),
    lastSeen: new Date(),
    isReturning: false,
    totalSessions: 1,
    ipAddresses: ipAddress ? [ipAddress] : []
  };

  await customersCollection.insertOne(newCustomer);
  return newCustomer;
}

export async function updateConversationSummary(
  conversationId: string,
  summary: string
): Promise<void> {
  const db = await getDb();
  const conversationsCollection = db.collection<Conversation>('conversations');

  await conversationsCollection.updateOne(
    { id: conversationId },
    { 
      $set: { 
        summary, 
        updatedAt: new Date() 
      } 
    }
  );
}

export async function closeConversationWithSummary(
  conversationId: string,
  agentName?: string,
  businessContext?: string
): Promise<{
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  summary: string;
  alreadyClosed?: boolean;
}> {
  const db = await getDb();
  const conversationsCollection = db.collection<Conversation>('conversations');
  
  // First, atomically claim this conversation for closing
  // This prevents race conditions by ensuring only one request proceeds
  const claimedConversation = await conversationsCollection.findOneAndUpdate(
    { 
      id: conversationId,
      status: 'active' // Only update if still active (atomic check-and-set)
    },
    { 
      $set: { 
        status: 'closing', // Intermediate state to claim the conversation
        updatedAt: new Date()
      } 
    },
    { returnDocument: 'after' }
  );
  
  if (!claimedConversation) {
    // Conversation was already closed or claimed by another request
    console.log('[closeConversationWithSummary] Conversation already closed or being closed');
    const existing = await conversationsCollection.findOne({ id: conversationId });
    return {
      customerName: null,
      customerEmail: null,
      customerPhone: null,
      summary: existing?.summary || '',
      alreadyClosed: true,
    };
  }
  
  // Now that we've atomically claimed the conversation, generate the summary
  // Use try/finally to ensure we never leave conversation stranded in 'closing' status
  try {
    const messages = await getConversationMessages(conversationId);
    
    const conversationHistory = messages.map(msg => {
      // Convert content to string for summary generation
      let contentStr: string;
      if (typeof msg.content === 'string') {
        contentStr = msg.content;
      } else if (Array.isArray(msg.content)) {
        // Extract text parts from array content
        contentStr = msg.content
          .map(part => part.text || '')
          .filter(Boolean)
          .join(' ');
      } else {
        contentStr = '';
      }
      
      return {
        role: msg.role as 'user' | 'agent' | 'system',
        content: contentStr,
        timestamp: msg.timestamp.toISOString(),
      };
    });
    
    const summaryData = await generateConversationSummary({
      conversationHistory,
      agentName,
      businessContext,
    });
    
    const closedAt = new Date();
    
    // Final update: set to closed with summary
    await conversationsCollection.updateOne(
      { id: conversationId },
      { 
        $set: { 
          status: 'closed',
          summary: summaryData.conversationSummary,
          closedAt,
          updatedAt: closedAt
        } 
      }
    );
    
    return {
      customerName: summaryData.customerName,
      customerEmail: summaryData.customerEmail,
      customerPhone: summaryData.customerPhone,
      summary: summaryData.conversationSummary,
      alreadyClosed: false,
    };
  } catch (error) {
    // If anything fails, restore conversation to 'active' so it can be retried
    console.error('[closeConversationWithSummary] Error during close, restoring to active:', error);
    await conversationsCollection.updateOne(
      { id: conversationId },
      { 
        $set: { 
          status: 'active',
          updatedAt: new Date()
        } 
      }
    );
    throw error; // Re-throw to notify caller
  }
}

export async function closeConversation(conversationId: string): Promise<void> {
  const db = await getDb();
  const conversationsCollection = db.collection<Conversation>('conversations');

  await conversationsCollection.updateOne(
    { id: conversationId },
    { 
      $set: { 
        status: 'closed',
        closedAt: new Date(),
        updatedAt: new Date() 
      } 
    }
  );
}
