# Training Data Context Types - Documentation & Fix

## Issue Identified

**Problem**: Agent training data shows "3 contexts" in count but only 2 are viewable/editable

**Root Cause**: The display logic in `src/app/dashboard/page.tsx` (lines 4341-4344) filters out old-format contexts that only have documents without websites:

```typescript
// Skip temporary/incomplete contexts
if (!isNewFormat && (!context.websiteUrl || context.websiteUrl.trim() === '')) {
  return null;  // This hides the context!
}
```

This logic assumes old-format contexts MUST have a `websiteUrl`, but some contexts have ONLY `docInfo` (uploaded documents) without a website URL.

## Training Context Formats

### Old Format (Legacy)
```typescript
{
  websiteUrl?: string;      // Optional website URL
  docInfo?: string;         // Optional document filename
  uploadedDocContent?: string;  // Document text content
}
```

**Problem**: A context with ONLY `docInfo` (no `websiteUrl`) gets filtered out!

### New Format (Current)
```typescript
{
  id: string;                    // Unique identifier
  sourceInfo: string;            // Display name (e.g., "Website: example.com" or "Document: file.pdf")
  extractedText?: string;        // Extracted content
  uploadedDocContent?: string;   // Same as extractedText
  wordCount?: number;            // Word count
  characterCount?: number;       // Character count
  createdAt: string;             // Timestamp
}
```

## Context Types

1. **Website Context**: Scraped website content
   - Old format: `{ websiteUrl: "https://example.com" }`
   - New format: `{ sourceInfo: "Website: https://example.com", ... }`

2. **Document Context**: Uploaded PDF/TXT file
   - Old format: `{ docInfo: "guide.pdf", uploadedDocContent: "..." }`
   - New format: `{ sourceInfo: "Document: guide.pdf", ... }`

3. **Website + Document** (Old format only)
   - Old format: `{ websiteUrl: "https://example.com", docInfo: "guide.pdf" }`

## The Bug Explained

**Scenario**:
- Agent has 3 training contexts:
  1. Website context (new format) ✅ Displayed
  2. Document context (new format) ✅ Displayed  
  3. Document context (old format with only `docInfo`) ❌ **HIDDEN!**

**Current Logic**:
```typescript
// This returns null for old format contexts without websiteUrl
if (!isNewFormat && (!context.websiteUrl || context.websiteUrl.trim() === '')) {
  return null;  // Hides context #3!
}
```

**Result**: Count shows 3, but only 2 are visible

## The Fix

### Option 1: Update Display Logic (Recommended)
```typescript
// Skip ONLY truly empty contexts
if (!isNewFormat && 
    (!context.websiteUrl || context.websiteUrl.trim() === '') && 
    (!context.docInfo || context.docInfo.trim() === '')) {
  return null;  // Only skip if BOTH are empty
}
```

### Option 2: Migrate Old Format to New Format
Run a migration script to convert all old format contexts to new format:

```typescript
async function migrateTrainingContexts() {
  const { tenants } = await getCollections();
  
  const allTenants = await tenants.find({}).toArray();
  
  for (const tenant of allTenants) {
    let needsUpdate = false;
    
    // Update tenant-level contexts
    if (tenant.trainingContexts) {
      tenant.trainingContexts = tenant.trainingContexts.map((ctx: any) => {
        if (!ctx.id) {
          needsUpdate = true;
          return {
            id: `training_${Date.now()}_${Math.random().toString(36).slice(2)}`,
            sourceInfo: ctx.websiteUrl 
              ? `Website: ${ctx.websiteUrl}${ctx.docInfo ? ` / Document: ${ctx.docInfo}` : ''}`
              : `Document: ${ctx.docInfo}`,
            uploadedDocContent: ctx.uploadedDocContent || '',
            extractedText: ctx.uploadedDocContent || '',
            wordCount: (ctx.uploadedDocContent || '').split(/\s+/).filter((w: string) => w.length > 0).length,
            characterCount: (ctx.uploadedDocContent || '').length,
            createdAt: new Date().toISOString()
          };
        }
        return ctx;
      });
    }
    
    // Update agent-level contexts
    if (tenant.agents) {
      tenant.agents = tenant.agents.map((agent: any) => {
        if (agent.trainingContexts) {
          agent.trainingContexts = agent.trainingContexts.map((ctx: any) => {
            if (!ctx.id) {
              needsUpdate = true;
              return {
                id: `training_${Date.now()}_${Math.random().toString(36).slice(2)}`,
                sourceInfo: ctx.websiteUrl 
                  ? `Website: ${ctx.websiteUrl}${ctx.docInfo ? ` / Document: ${ctx.docInfo}` : ''}`
                  : `Document: ${ctx.docInfo}`,
                uploadedDocContent: ctx.uploadedDocContent || '',
                extractedText: ctx.uploadedDocContent || '',
                wordCount: (ctx.uploadedDocContent || '').split(/\s+/).filter((w: string) => w.length > 0).length,
                characterCount: (ctx.uploadedDocContent || '').length,
                createdAt: new Date().toISOString()
              };
            }
            return ctx;
          });
        }
        return agent;
      });
    }
    
    if (needsUpdate) {
      await tenants.updateOne(
        { id: tenant.id },
        { $set: { trainingContexts: tenant.trainingContexts, agents: tenant.agents } }
      );
      console.log(`Migrated training contexts for tenant: ${tenant.id}`);
    }
  }
}
```

## Display Logic Types

### Current Display Types
1. **New Format - Website**: Has `sourceInfo` starting with "Website:"
2. **New Format - Document**: Has `sourceInfo` with "Document:" or "Text File:"
3. **Old Format - Website Only**: Has `websiteUrl` but no `docInfo`
4. **Old Format - Document Only**: Has `docInfo` but no `websiteUrl` ⚠️ **CURRENTLY HIDDEN**
5. **Old Format - Both**: Has both `websiteUrl` and `docInfo`

## Recommended Actions

### Immediate Fix (Quick)
1. Update display logic to check for BOTH `websiteUrl` AND `docInfo`
2. Display old format document-only contexts
3. Deploy fix

### Long-term Solution (Better)
1. Run migration script to convert all old format → new format
2. Remove old format handling code
3. Simplify UI logic

## Impact Analysis

### Who is affected?
- Users with training contexts created before the new format was introduced
- Specifically affects contexts that are document-only (no website)

### Data integrity
- No data is lost - contexts exist in database
- Only display/UI is affected
- Counts are correct, visibility is the issue

## Testing Checklist

After fix:
- [ ] Old format with only website → should display
- [ ] Old format with only document → should display ✅ **THIS WAS BROKEN**
- [ ] Old format with both → should display
- [ ] New format website → should display
- [ ] New format document → should display
- [ ] Count matches visible contexts
- [ ] Edit/Delete works for all types
- [ ] No blank/empty contexts displayed
