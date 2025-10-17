# How to Change Your App Logo & Favicon

## Quick Overview
Your app logo appears in three places:
1. **Browser tab** (favicon)
2. **Mobile home screen** when users install your app
3. **App splash screen** on mobile devices

## What You Need

### Image Files Required:
- **icon-192.png** - 192x192 pixels (small icon)
- **icon-512.png** - 512x512 pixels (large icon)

### Image Requirements:
- **Format**: PNG with transparent background (recommended) or JPG
- **Design**: Simple, recognizable logo that works at small sizes
- **Colors**: Use your brand colors

## Step-by-Step Guide

### Option 1: Use Your Existing Logo (Recommended)

1. **Prepare your logo image**
   - Open your logo in any image editor (Photoshop, Canva, GIMP, etc.)
   - Export it as PNG with transparent background

2. **Create the required sizes**
   - Resize to **192x192 pixels** and save as `icon-192.png`
   - Resize to **512x512 pixels** and save as `icon-512.png`

3. **Add to your project**
   - Upload both files to the `/public` folder in your project
   - The files must be named exactly: `icon-192.png` and `icon-512.png`

4. **That's it!** The app will automatically use these icons

### Option 2: Create Icons Online (Free Tools)

If you don't have image editing software, use these free online tools:

1. **Favicon Generator** - https://favicon.io/
   - Upload your logo
   - Download the generated icons
   - Rename them to `icon-192.png` and `icon-512.png`

2. **Real Favicon Generator** - https://realfavicongenerator.net/
   - Upload your logo
   - Customize for different platforms
   - Download the icons

3. **Canva** - https://www.canva.com/
   - Create a 512x512px design with your logo
   - Export as PNG
   - Resize a copy to 192x192px

### Option 3: Use Simple Initials/Letters

If you don't have a logo yet, create a simple text-based icon:

1. Go to https://favicon.io/favicon-generator/
2. Choose:
   - Text: Your company initials (e.g., "WM" for WMart)
   - Font: Choose a bold, readable font
   - Background color: Your brand color
   - Text color: Contrasting color
3. Download and use the generated icons

## Current Configuration Files

Your favicon is configured in these files:

### 1. `/src/app/layout.tsx` (Browser favicon)
```typescript
icons: {
  icon: '/icon-192.png',
  apple: '/icon-192.png',
}
```

### 2. `/public/manifest.json` (Mobile app icon)
```json
"icons": [
  {
    "src": "/icon-192.png",
    "sizes": "192x192",
    "type": "image/png"
  },
  {
    "src": "/icon-512.png",
    "sizes": "512x512",
    "type": "image/png"
  }
]
```

## Testing Your Icons

After adding the icons:

1. **Clear browser cache** (Ctrl+Shift+Delete or Cmd+Shift+Delete)
2. **Hard reload** the page (Ctrl+Shift+R or Cmd+Shift+R)
3. **Check the browser tab** - your icon should appear
4. **Test mobile installation**:
   - Open the app on your phone
   - Add to home screen
   - Check if your icon appears on the home screen

## Troubleshooting

### Icon not showing?
- Make sure files are exactly named `icon-192.png` and `icon-512.png`
- Check files are in the `/public` folder (not in any subfolder)
- Clear browser cache completely
- Hard reload the page

### Icon looks blurry?
- Ensure you're using the exact sizes: 192x192 and 512x512
- Use PNG format for better quality
- Don't upscale a small image - start with high resolution

### Icon has white background on mobile?
- Use PNG format with transparent background
- Avoid JPG which doesn't support transparency

## Quick Checklist

- [ ] Create or get your logo image
- [ ] Resize to 192x192 pixels → save as `icon-192.png`
- [ ] Resize to 512x512 pixels → save as `icon-512.png`
- [ ] Upload both files to `/public` folder
- [ ] Clear browser cache
- [ ] Hard reload to see changes
- [ ] Test on mobile device

---

**Note**: After uploading the icons, the app will automatically detect and use them. No code changes needed!
