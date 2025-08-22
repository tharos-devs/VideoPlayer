# VideoPlayer Plugin for MuseScore

## 📋 Description
This plugin allows you to sync video playback with MuseScore scores. Perfect for musicians who want to play along with video tutorials, performances, or backing tracks.

## 🚀 Installation

### Windows:
1. Download `VideoPlayer-MuseScore-Windows-x64.zip`
2. Extract to: `C:\Users\[YourName]\Documents\MuseScore3\Plugins\VideoPlayer\`
3. Restart MuseScore
4. Go to `Plugins → Plugin Manager` and enable "VideoPlayer"

### macOS:
1. Download `VideoPlayer-MuseScore-macOS-ARM64.zip` (Apple Silicon) or `VideoPlayer-MuseScore-macOS-x64.zip` (Intel)
2. Extract to: `~/Documents/MuseScore3/Plugins/VideoPlayer/`
3. Restart MuseScore
4. Go to `Plugins → Plugin Manager` and enable "VideoPlayer"

### Linux:
1. Download `VideoPlayer-MuseScore-Linux-x64.zip`
2. Extract to: `~/Documents/MuseScore3/Plugins/VideoPlayer/`
3. Restart MuseScore
4. Go to `Plugins → Plugin Manager` and enable "VideoPlayer"

## 🎵 Usage

1. **Load Plugin**: `Plugins → VideoPlayer`
2. **Select Video**: Click "Select Video" and choose your video file
3. **Play Music**: Use MuseScore's spacebar to play/pause both score and video
4. **Manual Control**: Use "Test Play/Pause" buttons for video-only control

## 🔧 Features

- ✅ **Auto-sync**: Video follows MuseScore playback
- ✅ **Portable**: No system installation required
- ✅ **Cross-platform**: Windows, macOS, Linux
- ✅ **Multiple formats**: MP4, AVI, MOV, MKV, WebM
- ✅ **Low latency**: WebRTC-based streaming
- ✅ **Embedded FFmpeg**: No additional software needed

## 🛠️ Troubleshooting

### Plugin doesn't appear:
- Check plugin is in correct Plugins folder
- Restart MuseScore completely
- Enable in Plugin Manager

### Video doesn't load:
- Ensure video file format is supported
- Check VideoPlayer.exe/app has permissions to run
- Look for errors in MuseScore console

### Connection issues:
- VideoPlayer uses port 5173
- Ensure no firewall blocking
- Close other instances of VideoPlayer

## 📁 Folder Structure
```
VideoPlayer/
├── VideoPlayer.qml           ← Plugin script
├── VideoPlayer.exe           ← Video player (Windows)
├── VideoPlayer.app/          ← Video player (macOS)
├── webrtc/                   ← Streaming server
└── README.md                 ← This file
```

## 🔄 Updates
Download the latest version and replace the entire VideoPlayer folder in your Plugins directory.

## 🐛 Support
For issues and updates, visit: [GitHub Repository URL]