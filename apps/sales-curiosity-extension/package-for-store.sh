#!/bin/bash

# Sales Curiosity Chrome Extension - Packaging Script
# This creates a ZIP file ready for Chrome Web Store submission

echo "📦 Packaging Sales Curiosity Extension for Chrome Web Store..."
echo ""

# Build the extension
echo "🔨 Building extension..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

# Create package directory if it doesn't exist
mkdir -p packages

# Get version from manifest
VERSION=$(grep '"version"' dist/manifest.json | sed 's/.*: "\(.*\)",/\1/')
PACKAGE_NAME="sales-curiosity-v${VERSION}.zip"

# Remove old package if exists
rm -f "packages/${PACKAGE_NAME}"

# Create ZIP file
echo "📦 Creating package: ${PACKAGE_NAME}..."
cd dist
zip -r "../packages/${PACKAGE_NAME}" . -x "*.map"
cd ..

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Package created successfully!"
    echo ""
    echo "📍 Location: packages/${PACKAGE_NAME}"
    echo "📊 Size: $(du -h "packages/${PACKAGE_NAME}" | cut -f1)"
    echo ""
    echo "🚀 Next steps:"
    echo "   1. Go to https://chrome.google.com/webstore/devconsole"
    echo "   2. Click 'New Item'"
    echo "   3. Upload packages/${PACKAGE_NAME}"
    echo "   4. Fill in store listing details"
    echo "   5. Submit for review"
    echo ""
    echo "📖 See CHROME_WEB_STORE_DEPLOYMENT.md for complete guide"
else
    echo "❌ Failed to create package"
    exit 1
fi

