# 🎵 VideoPlayer for MuseScore

**Lecteur vidéo synchronisé avec MuseScore** - Plugin + lecteur vidéo portable pour jouer en rythme avec vos partitions.

[![Platforms](https://img.shields.io/badge/Platforms-Windows%20%7C%20macOS%20%7C%20Linux-blue)](#-supported-platforms)
[![License](https://img.shields.io/badge/License-MIT-green)](#)
[![MuseScore](https://img.shields.io/badge/MuseScore-4%2B-orange)](#)

## 🎯 Qu'est-ce que c'est ?

VideoPlayer synchronise la lecture vidéo avec MuseScore :
- ⏯️ **Spacebar** dans MuseScore = Play/Pause vidéo
- 🎵 **Position synchronisée** - curseur MuseScore = position vidéo  
- 🎬 **Lecteur portable** - pas d'installation complexe
- 🌍 **Multi-plateforme** - Windows, macOS, Linux

## 📦 Installation Rapide

### **Utilisateurs MuseScore :**

1. **Télécharge** le ZIP de ta plateforme depuis [GitHub Actions](../../actions)
2. **Décompresse** le ZIP - un dossier `VideoPlayer-MuseScore-[Platform]-v[Version]/` sera créé
3. **Va dans** le dossier décompressé et **copie** le dossier `VideoPlayer/` dans ton dossier Plugins MuseScore :
   ```
   Windows: Documents\MuseScore4\Plugins\
   macOS:   ~/Documents/MuseScore4/Plugins/
   Linux:   ~/Documents/MuseScore4/Plugins/
   ```
4. **Redémarre** MuseScore
5. **Active** : Plugins → Plugin Manager → VideoPlayer ✅
6. **Utilise** : Plugins → VideoPlayer

### **Packages Disponibles :**
- `VideoPlayer-MuseScore-Windows-x64-v1.0.0.zip`
- `VideoPlayer-MuseScore-Windows-ARM64-v1.0.0.zip`  
- `VideoPlayer-MuseScore-macOS-x64-v1.0.0.zip` (Intel Macs)
- `VideoPlayer-MuseScore-macOS-ARM64-v1.0.0.zip` (Apple Silicon)
- `VideoPlayer-MuseScore-Linux-x64-v1.0.0.zip`

## 🚀 Génération des Packages (Développeurs)

### **Option 1 : Tous les Packages (Recommandé)**
1. GitHub → **Actions** → **"📦 Package All Platforms for MuseScore"**
2. **"Run workflow"** → Attendre ~5-10 minutes
3. **Télécharger** les 5 ZIP depuis "Artifacts"

### **Option 2 : Package Spécifique**
Utilise les workflows individuels pour des tests rapides (~2-3 min par plateforme)

📖 **Guide détaillé :** [`.github/WORKFLOWS.md`](.github/WORKFLOWS.md)

## 🔄 Gestion des Versions

```bash
# 1. Modifier la version maître
vim src-tauri/tauri.conf.json  # "version": "1.0.1"

# 2. Synchroniser toutes les versions
npm run sync-version

# 3. Lancer les workflows → ZIP avec v1.0.1 dans le nom
```

## ✨ Fonctionnalités

- 🎵 **Synchronisation MuseScore** - Plugin natif MuseScore 4+
- 🎬 **Lecteur vidéo** - Interface moderne avec debug panel  
- ⚡ **Ultra-faible latence** - WebSocket temps réel + keep-alive FFmpeg
- 📦 **Portable** - ZIP à décompresser, pas d'installateur
- 🛠️ **FFmpeg intégré** - aucune dépendance externe
- 🌍 **Multi-plateforme** - Windows (x64/ARM64), macOS (Intel/ARM), Linux

## 🏗️ Architecture

```
📦 VideoPlayer-MuseScore-[Platform]-v[Version].zip
└── VideoPlayer-MuseScore-[Platform]-v[Version]/  # Dossier décompressé
    └── VideoPlayer/                              # Dossier à copier dans Plugins MuseScore
        ├── VideoPlayer.qml      # Plugin MuseScore (Qt/QML)
        ├── logo.png             # Logo du plugin
        ├── README.md            # Instructions utilisateur
        ├── VideoPlayer.exe/.app # Lecteur vidéo (Tauri + Rust)
        └── webrtc/              # Serveur WebRTC (Node.js + FFmpeg)
```

**Communication :** MuseScore → HTTP endpoints → WebRTC Server → WebSocket → VideoPlayer UI

## 💻 Plateformes Supportées

| Plateforme | Architecture | Testé |
|-----------|-------------|-------|
| **Windows 10/11** | x64 (Intel/AMD) | ✅ |
| **Windows 10/11** | ARM64 (Surface Pro X) | ⚠️ |  
| **macOS 10.15+** | Intel x64 | ✅ |
| **macOS 11+** | Apple Silicon (M1/M2/M3/M4) | ✅ |
| **Linux** | x64 (Ubuntu, Fedora, etc.) | ✅ |

## 🔧 Développement

### **Prérequis :**
- Node.js 18+
- Rust + Tauri CLI
- MuseScore 4+

### **Setup local :**
```bash
git clone <repo>
cd VideoPlayer

# Install dependencies  
npm install
cd webrtc && npm install && cd ..

# Sync versions
npm run sync-version

# Local build
npm run tauri:build
```

### **Tests locaux :**
```bash
# Copier webrtc dans le bundle
cp -r webrtc src-tauri/target/release/bundle/macos/VideoPlayer.app/Contents/Resources/

# Lancer l'app
./src-tauri/target/release/bundle/macos/VideoPlayer.app/Contents/MacOS/VideoPlayer
```

### **Debug et logs :**
Par défaut, les logs détaillés sont désactivés pour optimiser les performances. Pour activer les logs de debug :

1. **Éditer** `webrtc/webrtc-server.js`
2. **Changer** la ligne 12 :
   ```javascript
   const ENABLE_DEBUG_LOGS = true;  // au lieu de false
   ```
3. **Relancer** le VideoPlayer

**Types de logs activés :**
- `ENDPOINT: /play`, `/pause`, `/seek` - endpoints HTTP
- `DEBUG: setVideo`, `Pre-starting FFmpeg` - opérations FFmpeg 
- `PLAY: Resuming`, `SEEK: FFmpeg restarted` - état interne
- `WEBSOCKET: /play`, `/seek` - messages WebSocket temps réel

## 📖 Documentation

- **[Guide Workflows](.github/WORKFLOWS.md)** - GitHub Actions et packages
- **[Build rapide](.github/QUICK-BUILD.md)** - Instructions build détaillées  
- **[Documentation technique](.github/BUILD.md)** - Architecture et troubleshooting
- **[Plugin MuseScore](musescore-plugin/README.md)** - Installation utilisateur

## 🐛 Support & Bugs

- **Issues** : [GitHub Issues](../../issues)
- **Workflows** : [GitHub Actions](../../actions) 
- **Debug** : Clic droit dans VideoPlayer → Panel debug

## 📝 License

MIT License - Voir LICENSE file

---

**🎵 VideoPlayer for MuseScore** - Synchronisez vos vidéos avec vos partitions !