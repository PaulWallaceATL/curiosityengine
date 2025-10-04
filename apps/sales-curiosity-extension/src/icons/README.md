# Extension Icons

## Quick Setup

You need three PNG icon files for Chrome Web Store submission:
- `icon16.png` (16x16 pixels)
- `icon48.png` (48x48 pixels)  
- `icon128.png` (128x128 pixels)

## Option 1: Use Online Converter (Easiest)

1. Go to https://cloudconvert.com/svg-to-png
2. Upload `icon.svg` from this folder
3. Download as PNG in these sizes: 16x16, 48x48, and 128x128
4. Name them `icon16.png`, `icon48.png`, `icon128.png`
5. Place them in this folder

## Option 2: Use Figma/Photoshop

1. Open `icon.svg` in Figma or Photoshop
2. Export in three sizes: 16x16, 48x48, 128x128
3. Save as PNG with the correct names

## Option 3: Use Command Line (if you have ImageMagick)

```bash
brew install imagemagick librsvg
convert -background none -resize 16x16 icon.svg icon16.png
convert -background none -resize 48x48 icon.svg icon48.png
convert -background none -resize 128x128 icon.svg icon128.png
```

After creating the icons, rebuild the extension:
```bash
npm run build -w @sales-curiosity/extension
```

