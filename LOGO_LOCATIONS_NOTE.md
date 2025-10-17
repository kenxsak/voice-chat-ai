# Logo Display Locations - Complete Reference

## 📍 All Logo Locations in the Platform

This document tracks every location where `/icon-192.png` logo appears across the platform and notes which ones have the animated wrapper for the "alive and ready to talk" sound wave effect.

---

## ✅ Already Fixed with Animation Wrapper

### 1. Login Page
**File:** `src/app/login/page.tsx` (Line 106-117)
```tsx
<div className="logo-ready-talking w-24 h-24 flex items-center justify-center">
  <Image 
    src="/icon-192.png" 
    alt="Voice Chat AI" 
    width={96} 
    height={96} 
    className="w-full h-full object-contain drop-shadow-2xl" 
  />
</div>
```
**Status:** ✅ Has animated wrapper with sound wave ripples

### 2. Setup Page
**File:** `src/app/setup/page.tsx` (Line 131-139)
```tsx
<div className="logo-ready-talking w-24 h-24 flex items-center justify-center">
  <Image 
    src="/icon-192.png" 
    alt="Voice Chat AI" 
    width={96} 
    height={96} 
    className="w-full h-full object-contain drop-shadow-2xl" 
  />
</div>
```
**Status:** ✅ Has animated wrapper with sound wave ripples

---

## 🔄 Needs Animation Wrapper (Large Display)

### 3. Main Chat Page - Loading State
**File:** `src/app/page.tsx` (Line 1530)
```tsx
<Image src="/icon-192.png" alt="Voice Chat AI" width={48} height={48} className="animate-pulse drop-shadow-lg" />
```
**Status:** ⚠️ Needs wrapper for sound wave animation
**Location:** Chat widget loading screen
**Recommendation:** Wrap in animated div for consistency

---

## 📱 Small Avatar/Fallback Logos (Animation Optional)

### 4. Chat Message Avatar Fallback
**File:** `src/app/page.tsx` (Line 408)
```tsx
<AvatarFallback className="bg-transparent p-0.5">
  <Image src="/icon-192.png" alt="Agent" width={24} height={24} className="w-full h-full object-contain" />
</AvatarFallback>
```
**Status:** ℹ️ Small size (24x24), animation not critical
**Location:** Chat message when agent avatar fails to load

### 5. Chat Message Avatar Primary
**File:** `src/app/page.tsx` (Line 407)
```tsx
<AvatarImage src={agentAvatarUrl || '/icon-192.png'} alt={agentName || 'Agent'} />
```
**Status:** ℹ️ Used as fallback URL only

---

## ⚙️ Configuration/Metadata References (No Display)

### 6. PWA Manifest
**File:** `public/manifest.json` (Lines 12-15, 31)
```json
{
  "src": "/icon-192.png",
  "sizes": "192x192",
  "type": "image/png",
  "purpose": "any maskable"
}
```
**Status:** ✓ Configuration only - no visual display

### 7. HTML Metadata
**File:** `src/app/layout.tsx` (Lines 24-25)
```tsx
icons: {
  icon: '/icon-192.png',
  apple: '/icon-192.png',
}
```
**Status:** ✓ Configuration only - browser/PWA icons

### 8. Offline Page Icon
**File:** `public/offline.html` (Line 7)
```html
<link rel="icon" href="/icon-192.png">
```
**Status:** ✓ Configuration only - favicon

### 9. Service Worker
**File:** `public/sw.js` (Lines 5, 168-169)
- Cache: `/icon-192.png`
- Notifications: `icon: '/icon-192.png'`

**Status:** ✓ Configuration and notification icon

### 10. Setup API Default Avatar
**File:** `src/app/api/auth/setup/route.ts` (Line 106)
```tsx
avatarUrl: '/icon-192.png'
```
**Status:** ✓ Default data value - displays in chat as small avatar

---

## 📋 Action Items & Recommendations

### High Priority
1. ✅ **Login Page** - Fixed with wrapper
2. ✅ **Setup Page** - Fixed with wrapper
3. ⚠️ **Chat Loading State** - Needs wrapper for consistency

### Medium Priority
4. 💡 **Chat Avatar Fallback** - Consider wrapper if logo becomes focal point
5. 💡 **Typing Indicator Avatar** - Consider wrapper if logo becomes focal point

### No Action Needed
6. ✓ All configuration/metadata references work as-is

---

## 🎨 Animation Implementation Guide

### How to Add Animation Wrapper

**Before (Won't animate):**
```tsx
<Image src="/icon-192.png" alt="Logo" width={96} height={96} className="..." />
```

**After (With animation):**
```tsx
<div className="logo-ready-talking w-24 h-24 flex items-center justify-center">
  <Image 
    src="/icon-192.png" 
    alt="Logo" 
    width={96} 
    height={96} 
    className="w-full h-full object-contain drop-shadow-2xl" 
  />
</div>
```

### Why Wrapper is Needed
- Next.js `<Image>` component is a **replaced element**
- CSS `::before` and `::after` pseudo-elements don't work on replaced elements
- The wrapper `<div>` allows pseudo-elements to render the sound wave ripples
- Animation class `logo-ready-talking` must be on the wrapper, not the image

---

## 🔍 Quick Reference Checklist

| Location | File | Line | Size | Has Wrapper | Priority |
|----------|------|------|------|-------------|----------|
| Login Page | login/page.tsx | 106 | 96x96 | ✅ Yes | High |
| Setup Page | setup/page.tsx | 131 | 96x96 | ✅ Yes | High |
| Chat Loading | page.tsx | 1530 | 48x48 | ❌ No | Medium |
| Avatar Fallback | page.tsx | 408 | 24x24 | ❌ No | Low |
| Avatar Source | page.tsx | 407 | 28x28 | N/A | Low |
| Metadata | layout.tsx | 24 | - | N/A | N/A |
| Manifest | manifest.json | 12 | 192 | N/A | N/A |
| Offline | offline.html | 7 | - | N/A | N/A |
| Service Worker | sw.js | 5 | - | N/A | N/A |
| API Default | setup/route.ts | 106 | - | N/A | N/A |

---

## 📝 Notes

1. **Animation CSS** is defined in `src/app/globals.css` as `.logo-ready-talking`
2. **Sound wave effect** uses `::before` and `::after` pseudo-elements
3. **All large logo displays** (≥48px) should use the wrapper for consistency
4. **Small avatars** (≤32px) can skip animation as it's less visible
5. **Configuration references** never need animation as they're not displayed

---

*Last Updated: October 16, 2025*
*All logo locations documented and categorized for easy reference*
