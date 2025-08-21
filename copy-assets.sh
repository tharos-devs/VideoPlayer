#!/bin/bash
set -e

echo "🔧 Post-build: Copying web assets to VideoPlayer.app bundle..."

# Chemins
APP_PATH="/Users/tharos/VideoPlayer/src-tauri/target/release/bundle/macos/VideoPlayer.app"
RESOURCES_PATH="$APP_PATH/Contents/Resources"
PUBLIC_PATH="/Users/tharos/VideoPlayer/public"
WEBRTC_PATH="/Users/tharos/VideoPlayer/webrtc"

# Vérifier que l'app bundle existe
if [ ! -d "$APP_PATH" ]; then
    echo "❌ VideoPlayer.app bundle not found at: $APP_PATH"
    exit 1
fi

# Vérifier que le dossier public existe
if [ ! -d "$PUBLIC_PATH" ]; then
    echo "❌ Public folder not found at: $PUBLIC_PATH"
    exit 1
fi

# Vérifier que le dossier webrtc existe
if [ ! -d "$WEBRTC_PATH" ]; then
    echo "❌ WebRTC folder not found at: $WEBRTC_PATH"
    exit 1
fi

# Copier tous les assets web directement dans Resources
echo "📁 Copying $PUBLIC_PATH/* to $RESOURCES_PATH/"
cp -r "$PUBLIC_PATH"/* "$RESOURCES_PATH/"

# Copier le serveur WebRTC dans Resources
echo "📁 Copying WebRTC server to $RESOURCES_PATH/webrtc/"
mkdir -p "$RESOURCES_PATH/webrtc"
cp -r "$WEBRTC_PATH"/* "$RESOURCES_PATH/webrtc/"

# Vérifier que les fichiers ont été copiés
if [ -f "$RESOURCES_PATH/index.html" ] && [ -f "$RESOURCES_PATH/webrtc/webrtc-server.js" ]; then
    echo "✅ Web assets and WebRTC server successfully copied to VideoPlayer.app bundle"
    echo "📄 Files in bundle:"
    ls -la "$RESOURCES_PATH/"
    echo "📄 WebRTC files:"
    ls -la "$RESOURCES_PATH/webrtc/"
else
    echo "❌ Failed to copy assets or WebRTC server"
    exit 1
fi

echo "🎉 Post-build asset copying completed!"