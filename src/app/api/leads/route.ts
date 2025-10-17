import { NextResponse } from 'next/server';
import { getCollections } from '@/lib/mongodb';
import { z } from 'zod';
import { assertAllowedOrigin, rateLimit } from '@/lib/security';
import { requireAuth, getTenantFilter } from '@/lib/auth-middleware';
import { findCustomerByContact } from '@/lib/conversation-storage';

export async function GET(request: Request) {
  try {
    const blocked = assertAllowedOrigin(request);
    if (blocked) return blocked;
    const limited = rateLimit(request, 'leads_get', 60, 60_000);
    if (limited) return limited;

    // Require authentication and get tenant filter
    const session = await requireAuth();
    if (session instanceof NextResponse) return session;

    const url = new URL(request.url);
    const requestedTenantId = url.searchParams.get('tenantId') || undefined;
    const query = getTenantFilter(session, requestedTenantId);

    const { leads } = await getCollections();
    
    const all = await leads
      .find(query)
      .sort({ date: -1 })
      .limit(1000)
      .project({ _id: 0 }) // Exclude MongoDB _id for smaller payload
      .toArray();
    return NextResponse.json({ leads: all });
  } catch (e) {
    console.error('[API /api/leads GET] Error', e);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const blocked = assertAllowedOrigin(request);
    if (blocked) return blocked;
    const limited = rateLimit(request, 'leads_post', 20, 60_000);
    if (limited) return limited;

    const body = await request.json();
    const LeadSchema = z.object({
      id: z.string().optional(),
      tenantId: z.string(),
      customerInfo: z.string().min(1),
      customerName: z.string().optional(),
      customerEmail: z.string().optional(),
      customerPhone: z.string().optional(),
      date: z.string().optional(),
      status: z.string().optional(),
      reference: z.string().optional(),
      websiteContext: z.string().optional().nullable(),
      summary: z.string().optional().nullable(),
      summaryData: z.object({
        problemsDiscussed: z.array(z.string()).optional(),
        solutionsProvided: z.array(z.string()).optional(),
        suggestionsGiven: z.array(z.string()).optional(),
        customerName: z.string().nullish(),
        customerEmail: z.string().nullish(),
        customerPhone: z.string().nullish(),
      }).optional(),
      history: z.any().optional(),
      imageUrl: z.string().optional().nullable(),
      sessionId: z.string().optional(),
      customerId: z.string().optional().nullable(),
      isReturningCustomer: z.boolean().optional(),
      totalCustomerSessions: z.number().optional(),
      isAnonymous: z.boolean().optional(),
      ipAddress: z.string().optional().nullable(),
    });
    const newLead = LeadSchema.parse(body) as any;
    const { leads } = await getCollections();
    // Normalize date and compute monthly period key (UTC YYYY-MM)
    const createdAt = new Date();
    const leadDate = newLead.date ? new Date(newLead.date) : createdAt;
    const periodMonth = `${leadDate.getUTCFullYear()}-${String(leadDate.getUTCMonth() + 1).padStart(2, '0')}`;
    Object.assign(newLead, { createdAt, date: leadDate.toISOString(), periodMonth });

    // Enhanced de-duplication logic for same customer per month
    let upsertFilter: any = null;
    let normalizedIdentifier = null;
    
    // Extract and normalize email
    const emailMatch = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.exec(newLead.customerInfo || '')?.[0]?.toLowerCase();
    
    // Extract and normalize phone (remove all non-digits except +)
    const phoneMatch = newLead.customerInfo?.replace(/[^0-9+]/g, '') || '';
    
    // Extract potential name (first part before email/phone or comma)
    const nameParts = newLead.customerInfo?.split(/[,@]|phone|tel|mobile/i)[0]?.trim().toLowerCase() || '';
    const normalizedName = nameParts.replace(/[^a-z\s]/g, '').trim();
    
    console.log('[DEBUG] Lead deduplication analysis:', {
      customerInfo: newLead.customerInfo,
      emailMatch,
      phoneMatch,
      normalizedName,
      tenantId: newLead.tenantId,
      periodMonth
    });

    // Prioritize unique index fields (email, phone, name) over sessionId to avoid conflicts
    if (emailMatch) {
      // Primary: dedupe by email
      upsertFilter = { tenantId: newLead.tenantId, periodMonth, normalizedEmail: emailMatch };
      newLead.normalizedEmail = emailMatch;
      normalizedIdentifier = `email:${emailMatch}`;
    } else if (phoneMatch.length >= 6) {
      // Secondary: dedupe by phone
      upsertFilter = { tenantId: newLead.tenantId, periodMonth, normalizedPhone: phoneMatch };
      newLead.normalizedPhone = phoneMatch;
      normalizedIdentifier = `phone:${phoneMatch}`;
    } else if (normalizedName.length >= 3) {
      // Tertiary: dedupe by normalized name (for cases without email/phone)
      upsertFilter = { tenantId: newLead.tenantId, periodMonth, normalizedName };
      newLead.normalizedName = normalizedName;
      normalizedIdentifier = `name:${normalizedName}`;
    } else if (newLead.sessionId) {
      // Fallback: dedupe by sessionId when no contact info available (anonymous conversations)
      upsertFilter = { tenantId: newLead.tenantId, periodMonth, sessionId: newLead.sessionId };
      normalizedIdentifier = `session:${newLead.sessionId}`;
    }

    console.log('[DEBUG] Using deduplication filter:', { upsertFilter, normalizedIdentifier });

    const existingCustomer = await findCustomerByContact(
      newLead.tenantId,
      emailMatch || null,
      phoneMatch || null,
      normalizedName || null
    );

    let isReturningCustomer = false;
    let totalCustomerSessions = 1;
    let customerId = null;

    if (existingCustomer) {
      isReturningCustomer = existingCustomer.sessions.length > 1 || existingCustomer.isReturning || false;
      totalCustomerSessions = existingCustomer.sessions.length;
      customerId = existingCustomer.id;
      
      console.log('[Leads API] ✓ RETURNING CUSTOMER identified for lead:', {
        customerId: existingCustomer.id,
        totalSessions: totalCustomerSessions,
        firstSeen: existingCustomer.firstSeen,
        lastSeen: existingCustomer.lastSeen
      });
    }

    let finalLead = { 
      ...newLead,
      customerId,
      isReturningCustomer,
      totalCustomerSessions,
      lastUpdated: new Date()
    };
    
    if (upsertFilter) {
      const existingLead = await leads.findOne(upsertFilter);
      if (existingLead) {
        console.log('[Leads API] Found existing lead, merging with new data');
        
        // Only preserve old image if new lead explicitly doesn't provide one (undefined)
        // If newLead.imageUrl is null, it means user intentionally sent no image in this conversation
        if (newLead.imageUrl === undefined && existingLead.imageUrl) {
          finalLead.imageUrl = existingLead.imageUrl;
        } else {
          finalLead.imageUrl = newLead.imageUrl || null;
        }
        
        if (newLead.history) {
          finalLead.history = newLead.history;
        } else if (existingLead.history) {
          finalLead.history = existingLead.history;
        }
        
        finalLead.summary = newLead.summary || existingLead.summary;
        finalLead.summaryData = newLead.summaryData || existingLead.summaryData;
        
        // Auto-update status and isAnonymous flag based on contact info presence
        const hasContactInfo = finalLead.customerName || finalLead.customerEmail || finalLead.customerPhone || 
                               emailMatch || phoneMatch || (normalizedName && normalizedName.length >= 3);
        
        if (newLead.status) {
          finalLead.status = newLead.status;
        } else if (hasContactInfo && existingLead.status === 'Anonymous') {
          // Upgrade from Anonymous to Follow-up needed when contact info is added
          finalLead.status = 'Follow-up needed';
          console.log('[Leads API] Status upgraded from Anonymous to Follow-up needed (contact info added)');
        } else {
          finalLead.status = existingLead.status;
        }
        
        // Update isAnonymous flag based on actual contact info
        if (hasContactInfo) {
          finalLead.isAnonymous = false;
        } else if (newLead.isAnonymous !== undefined) {
          finalLead.isAnonymous = newLead.isAnonymous;
        } else if (existingLead.isAnonymous !== undefined) {
          finalLead.isAnonymous = existingLead.isAnonymous;
        }
        
        finalLead.id = existingLead.id;
        finalLead.createdAt = existingLead.createdAt;
        
        if (existingCustomer && existingLead.customerId !== customerId) {
          console.log('[Leads API] Linking lead to returning customer');
          finalLead.customerId = customerId;
          finalLead.isReturningCustomer = isReturningCustomer;
          finalLead.totalCustomerSessions = totalCustomerSessions;
        }
      }
    }

    // Use finalLead.id (which may be existingLead.id after merge) instead of newLead.id
    if (finalLead.id) {
      // When updating by ID, exclude id and createdAt from $set to avoid duplicate key errors
      const { id, createdAt, ...leadDataForUpdate } = finalLead;
      await leads.updateOne(
        { id: finalLead.id }, 
        { 
          $setOnInsert: { 
            id: finalLead.id,
            createdAt: createdAt || new Date()
          },
          $set: leadDataForUpdate 
        }, 
        { upsert: true }
      );
    } else if (upsertFilter) {
      // Remove id and createdAt from finalLead to avoid conflict, will be set only on insert
      const { id, createdAt, ...leadDataForUpdate } = finalLead;
      await leads.updateOne(
        upsertFilter, 
        { 
          $setOnInsert: { 
            id: finalLead.id || `lead_${Date.now()}`,
            createdAt: createdAt || new Date()
          }, 
          $set: leadDataForUpdate 
        }, 
        { upsert: true }
      );
    } else {
      // No deduplication possible, insert as new
      console.log('[DEBUG] No deduplication criteria found, inserting as new lead');
      if (!finalLead.id) {
        finalLead.id = `lead_${Date.now()}`;
      }
      await leads.insertOne(finalLead);
    }
    return NextResponse.json({ lead: finalLead }, { status: 201 });
  } catch (e) {
    console.error('[API /api/leads POST] Error', e);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}


