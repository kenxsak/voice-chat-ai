import { MongoClient, Db } from 'mongodb';

const uri = process.env.MONGODB_URI as string;
if (!uri) {
  throw new Error('MONGODB_URI is not set in environment variables');
}

let client: MongoClient | null = null;
let db: Db | null = null;
let indexesEnsured = false;

export async function getDb(): Promise<Db> {
  if (db) return db;
  if (!client) {
    client = new MongoClient(uri);
  }
  try {
    // Test the connection by running a simple admin command
    await client.db('admin').command({ ping: 1 });
  } catch (error) {
    // If ping fails, the client is not connected, so connect
    await client.connect();
  }
  db = client.db(process.env.MONGODB_DB || 'voicechatai');

  // Ensure collection indexes once per process
  if (!indexesEnsured) {
    try {
      await ensureIndexes(db);
      indexesEnsured = true;
    } catch (e) {
      console.warn('[MongoDB] Failed to ensure indexes:', e);
      // Reset flag to try again on next connection
      indexesEnsured = false;
    }
  }
  return db;
}

export type Collections = {
  users: ReturnType<Db['collection']>;
  tenants: ReturnType<Db['collection']>;
  plans: ReturnType<Db['collection']>;
  leads: ReturnType<Db['collection']>;
  gaps: ReturnType<Db['collection']>;
  conversations: ReturnType<Db['collection']>;
  messages: ReturnType<Db['collection']>;
  customers: ReturnType<Db['collection']>;
  platformSettings: ReturnType<Db['collection']>;
};

export async function getCollections(): Promise<Collections> {
  const database = await getDb();
  return {
    users: database.collection('users'),
    tenants: database.collection('tenants'),
    plans: database.collection('plans'),
    leads: database.collection('leads'),
    gaps: database.collection('gaps'),
    conversations: database.collection('conversations'),
    messages: database.collection('messages'),
    customers: database.collection('customers'),
    platformSettings: database.collection('platform_settings'),
  } as const;
}

async function cleanupDuplicateLeads(database: Db) {
  const leads = database.collection('leads');
  
  console.log('[MongoDB] Starting duplicate leads cleanup...');
  
  const duplicates = await leads.aggregate([
    {
      $match: { sessionId: { $exists: true, $ne: null, $type: "string", $gt: "" } }
    },
    {
      $group: {
        _id: {
          tenantId: '$tenantId',
          periodMonth: '$periodMonth',
          sessionId: '$sessionId'
        },
        count: { $sum: 1 },
        docs: { $push: { _id: '$_id', createdAt: '$createdAt' } }
      }
    },
    {
      $match: { count: { $gt: 1 } }
    }
  ]).toArray();

  if (duplicates.length === 0) {
    console.log('[MongoDB] No duplicate leads found');
    return 0;
  }

  console.log(`[MongoDB] Found ${duplicates.length} groups of duplicate leads`);
  
  let deletedCount = 0;
  for (const dup of duplicates) {
    const sortedDocs = dup.docs.sort((a: any, b: any) => 
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
    
    const toDelete = sortedDocs.slice(1).map((doc: any) => doc._id);
    
    if (toDelete.length > 0) {
      const result = await leads.deleteMany({ _id: { $in: toDelete } });
      deletedCount += result.deletedCount || 0;
    }
  }

  console.log(`[MongoDB] Cleanup complete: deleted ${deletedCount} duplicate leads`);
  return deletedCount;
}

async function ensureIndexes(database: Db) {
  try {
    await database.collection('conversations').dropIndex('conversations_tenant_session');
    console.log('[MongoDB] Dropped old index: conversations_tenant_session');
  } catch (err: any) {
    if (err.code !== 27 && err.codeName !== 'IndexNotFound') {
      console.warn('[MongoDB] Warning dropping old index:', err.message);
    }
  }
  
  try {
    await cleanupDuplicateLeads(database);
  } catch (err: any) {
    console.error('[MongoDB] Error during duplicate cleanup:', err);
  }
  
  await Promise.all([
    database.collection('users').createIndex({ email: 1 }, { unique: true, sparse: true, name: 'users_email_unique' }),
    database.collection('tenants').createIndex({ id: 1 }, { unique: true, name: 'tenants_id_unique' }),
    database.collection('plans').createIndex({ id: 1 }, { unique: true, name: 'plans_id_unique' }),
    database.collection('leads').createIndex({ id: 1 }, { unique: true, name: 'leads_id_unique' }),
    // Monthly de-dupe keys - using partial filters to handle null values properly
    database.collection('leads').createIndex(
      { tenantId: 1, periodMonth: 1, normalizedEmail: 1 }, 
      { 
        unique: true, 
        name: 'leads_tenant_month_email_unique',
        partialFilterExpression: { 
          normalizedEmail: { $exists: true, $type: "string", $gt: "" }
        }
      }
    ),
    database.collection('leads').createIndex(
      { tenantId: 1, periodMonth: 1, normalizedPhone: 1 }, 
      { 
        unique: true, 
        name: 'leads_tenant_month_phone_unique',
        partialFilterExpression: { 
          normalizedPhone: { $exists: true, $type: "string", $gt: "" }
        }
      }
    ),
    database.collection('leads').createIndex(
      { tenantId: 1, periodMonth: 1, normalizedName: 1 }, 
      { 
        unique: true, 
        name: 'leads_tenant_month_name_unique',
        partialFilterExpression: { 
          normalizedName: { $exists: true, $type: "string", $gt: "" }
        }
      }
    ),
    database.collection('leads').createIndex(
      { tenantId: 1, periodMonth: 1, sessionId: 1 }, 
      { 
        unique: true, 
        name: 'leads_tenant_month_session_unique',
        partialFilterExpression: { 
          sessionId: { $exists: true, $type: "string", $gt: "" }
        }
      }
    ),
    database.collection('leads').createIndex({ tenantId: 1, date: -1 }, { name: 'leads_tenant_date' }),
    database.collection('gaps').createIndex({ id: 1 }, { unique: true, name: 'gaps_id_unique' }),
    database.collection('gaps').createIndex({ tenantId: 1, date: -1 }, { name: 'gaps_tenant_date' }),
    
    // Conversations indexes
    database.collection('conversations').createIndex({ id: 1 }, { unique: true, name: 'conversations_id_unique' }),
    database.collection('conversations').createIndex({ tenantId: 1, sessionId: 1, agentId: 1 }, { unique: true, name: 'conversations_tenant_session_agent' }),
    database.collection('conversations').createIndex({ tenantId: 1, customerId: 1 }, { name: 'conversations_tenant_customer' }),
    database.collection('conversations').createIndex({ tenantId: 1, createdAt: -1 }, { name: 'conversations_tenant_date' }),
    
    // Messages indexes
    database.collection('messages').createIndex({ id: 1 }, { unique: true, name: 'messages_id_unique' }),
    database.collection('messages').createIndex({ conversationId: 1, timestamp: 1 }, { name: 'messages_conversation_timestamp' }),
    
    // Customers indexes
    database.collection('customers').createIndex({ id: 1 }, { unique: true, name: 'customers_id_unique' }),
    database.collection('customers').createIndex(
      { tenantId: 1, email: 1 }, 
      { 
        name: 'customers_tenant_email',
        partialFilterExpression: { 
          email: { $exists: true, $type: "string", $gt: "" }
        }
      }
    ),
    database.collection('customers').createIndex(
      { tenantId: 1, phone: 1 }, 
      { 
        name: 'customers_tenant_phone',
        partialFilterExpression: { 
          phone: { $exists: true, $type: "string", $gt: "" }
        }
      }
    ),
  ]);
}


