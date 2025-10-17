# 🎨 How to Add Your App Logo (Favicon)

## The Problem
Your app currently shows a missing icon (404 error) because the required logo files are not in the `/public` folder.

## The Quick Fix (3 Steps)

### Step 1: Get Your Logo Ready
- You need your company logo/brand image
- Recommended: PNG format with transparent background
- Square shape works best

### Step 2: Create Two Sizes
Create these exact files:
- **icon-192.png** → 192 x 192 pixels
- **icon-512.png** → 512 x 512 pixels

### Step 3: Upload to Public Folder
- Place both files in the `/public` folder
- File names must match exactly: `icon-192.png` and `icon-512.png`

## Where to Create These Icons

### Option 1: Use Favicon.io (Easiest - Free)
1. Go to https://favicon.io/favicon-converter/
2. Upload your logo image
3. Click "Download" 
4. You'll get multiple sizes - find and rename:
   - `android-chrome-192x192.png` → rename to `icon-192.png`
   - `android-chrome-512x512.png` → rename to `icon-512.png`
5. Upload both to `/public` folder in this project

### Option 2: Use Canva (Free)
1. Go to https://www.canva.com/
2. Create new design: Custom size 512x512px
3. Add your logo to the center
4. Download as PNG
5. Save as `icon-512.png`
6. Resize a copy to 192x192px and save as `icon-192.png`
7. Upload both to `/public` folder

### Option 3: Text-Based Icon (No Logo Yet?)
1. Go to https://favicon.io/favicon-generator/
2. Type your company initials (e.g., "W" for WMart)
3. Choose colors:
   - Background: Your brand color
   - Text: Contrasting color
4. Pick a bold font
5. Download and rename files as described in Option 1
6. Upload to `/public` folder

## Current Setup

Your app is already configured to use these icons in:

**Browser Tab Icon:**
```typescript
// File: src/app/layout.tsx
icons: {
  icon: '/icon-192.png',
  apple: '/icon-192.png',
}
```

**Mobile App Icon:**
```json
// File: public/manifest.json
"icons": [
  { "src": "/icon-192.png", "sizes": "192x192" },
  { "src": "/icon-512.png", "sizes": "512x512" }
]
```

## After Adding Icons

1. **Refresh your browser** (Ctrl+Shift+R or Cmd+Shift+R)
2. **Check the browser tab** - your icon should appear
3. **Test on mobile** - install the app to home screen to see your icon

## File Upload Instructions

### In Replit:
1. Open the file explorer on the left
2. Navigate to the `public` folder
3. Click the three dots (⋮) or right-click
4. Select "Upload file"
5. Upload `icon-192.png`
6. Repeat for `icon-512.png`

### Via Files Panel:
1. Drag and drop both PNG files into the `public` folder
2. Make sure they're named exactly: `icon-192.png` and `icon-512.png`

---

**Need help?** Check the detailed `FAVICON_GUIDE.md` for more information and troubleshooting tips.
