# 🔧 Build Instructions - VideoPlayer MuseScore

## 📋 Vue d'Ensemble

Ce projet génère des **packages MuseScore portables** contenant le plugin + lecteur vidéo, prêts à distribuer aux utilisateurs finaux.

## 🏗️ Architecture du Build

### **Composants Générés :**
1. **Plugin MuseScore** (`VideoPlayer.qml` + `logo.png`)
2. **Lecteur vidéo Tauri** (portable, multi-plateforme)
3. **Serveur WebRTC** (Node.js + FFmpeg intégré)
4. **Package tout-en-un** (ZIP portable par plateforme)

### **Différence avec projets classiques :**
❌ **Pas de builds "application"** classiques (.exe, .dmg isolés)  
✅ **Packages MuseScore** (plugin + lecteur dans un ZIP)

## 🚀 Workflows GitHub Actions

### **🎯 Workflow Principal (Recommandé)**
- **`package-all-platforms.yml`** - Génère tous les packages MuseScore
- **Déclenchement :** Manuel uniquement (`workflow_dispatch`)
- **Plateformes :** Windows x64/ARM64, macOS x64/ARM64, Linux x64
- **Résultat :** 5 ZIP versionnés

### **⚡ Workflows Individuels (Pour tests)**
- **`package-windows-x64.yml`** - Windows 64-bit uniquement
- **`package-windows-arm64.yml`** - Windows ARM64 uniquement  
- **`package-macos-x64.yml`** - macOS Intel uniquement
- **`package-macos-arm64.yml`** - macOS Apple Silicon uniquement
- **`package-linux-x64.yml`** - Linux 64-bit uniquement

## 🎯 Comment Générer un Build

### **Option A - Tous les Packages (Recommandé)**
```bash
# 1. Sur GitHub → Actions → "📦 Package All Platforms for MuseScore"
# 2. "Run workflow" → "Run workflow" 
# 3. Attendre ~5-10 minutes
# 4. Récupérer 5 ZIP versionnés dans Artifacts
```

### **Option B - Package Spécifique**
```bash
# Exemple pour Windows x64 :
# 1. Actions → "📦 Package Windows x64 MuseScore" 
# 2. "Run workflow" → ~2-3 minutes
# 3. Récupérer ZIP Windows dans Artifacts
```

## 📦 Structure des Artefacts Générés

### **Nom des ZIP (versionnés automatiquement) :**
```
VideoPlayer-MuseScore-Windows-x64-v1.0.0.zip
VideoPlayer-MuseScore-Windows-ARM64-v1.0.0.zip
VideoPlayer-MuseScore-macOS-x64-v1.0.0.zip
VideoPlayer-MuseScore-macOS-ARM64-v1.0.0.zip
VideoPlayer-MuseScore-Linux-x64-v1.0.0.zip
```

### **Contenu de chaque ZIP :**
```
VideoPlayer-MuseScore-[Platform]-v[Version]/
├── VideoPlayer.qml          # Plugin MuseScore
├── logo.png                 # Logo du plugin
├── README.md                 # Instructions installation
├── VideoPlayer.exe/.app     # Lecteur vidéo portable
└── webrtc/                  # Serveur WebRTC + FFmpeg
    ├── webrtc-server.js     # Serveur principal
    ├── package.json         # Dépendances
    └── node_modules/        # FFmpeg statique inclus
```

## 🔄 Gestion des Versions

### **Source unique de vérité :** `src-tauri/tauri.conf.json`

```bash
# 1. Modifier la version maître
vim src-tauri/tauri.conf.json
# "version": "1.0.1"

# 2. Synchroniser toutes les autres versions
npm run sync-version

# 3. Commit et push
git add . && git commit -m "Bump to v1.0.1" && git push

# 4. Lancer workflow → Résultat : ZIP avec v1.0.1 dans le nom
```

### **Fichiers synchronisés automatiquement :**
- `package.json` (projet principal)
- `webrtc/package.json` (serveur WebRTC)
- `plugins/VideoPlayer.qml` (plugin MuseScore)
- `public/index.html` (interface debug)

## ⚙️ Build Local (Développement)

### **Prérequis :**
```bash
# Node.js 18+ & Rust & Tauri CLI
npm install
```

### **Build complet local :**
```bash
# Synchroniser versions
npm run sync-version

# Build Tauri
npm run tauri:build

# Résultat dans src-tauri/target/release/bundle/
```

### **Test local :**
```bash
# Copier webrtc dans le bundle pour test
cp -r webrtc src-tauri/target/release/bundle/macos/VideoPlayer.app/Contents/Resources/

# Lancer l'app
./src-tauri/target/release/bundle/macos/VideoPlayer.app/Contents/MacOS/VideoPlayer
```

## 🎯 Targets Supportés

### **Plateformes de Build :**
- **Windows** : `runners-latest` (Windows Server)
- **macOS** : `macos-latest` (macOS arm64 + cross-compilation x64)
- **Linux** : `ubuntu-20.04` (compatibilité maximale)

### **Architectures Générées :**
- **Windows :** x64 (`x86_64-pc-windows-msvc`) + ARM64 (`aarch64-pc-windows-msvc`)
- **macOS :** x64 (`x86_64-apple-darwin`) + ARM64 (`aarch64-apple-darwin`)
- **Linux :** x64 (`x86_64-unknown-linux-gnu`)

## 🔧 Résolution de Problèmes

### **Build échoue :**
```bash
# 1. Vérifier que les versions sont synchronisées
npm run sync-version

# 2. Vérifier les logs GitHub Actions détaillés
# 3. Tester en local d'abord
npm run tauri:build
```

### **Artefacts manquants :**
- ⏱️ Attendre la fin complète (badge 🟢)
- 📍 Scroll en bas de la page du workflow
- 📂 Section "Artifacts" apparaît après succès

### **Version incorrecte dans ZIP :**
```bash
# Le nom vient de package.json, pas tauri.conf.json
npm run sync-version
git add . && git commit -m "Sync versions" && git push
# Relancer le workflow
```

### **WebRTC manquant dans build :**
```bash
# Workflows copient automatiquement webrtc/
# Si problème local, copier manuellement :
cp -r webrtc src-tauri/target/release/bundle/.../Resources/
```

## 🚀 Spécificités MuseScore

### **Différences importantes :**
- ❌ **Pas d'installateurs** (.msi, .dmg) - bloquent certains utilisateurs
- ✅ **ZIP portables** - extraction simple dans dossier Plugins
- ✅ **Plugin + lecteur** dans même package - expérience unifiée
- ✅ **FFmpeg intégré** - pas de dépendances externes

### **Chemin d'installation utilisateur :**
```
Windows: Documents\MuseScore4\Plugins\VideoPlayer\
macOS:   ~/Documents/MuseScore4/Plugins/VideoPlayer/
Linux:   ~/Documents/MuseScore4/Plugins/VideoPlayer/
```

### **Activation dans MuseScore :**
1. Plugins → Plugin Manager → VideoPlayer ✅
2. Plugins → VideoPlayer (utilisation)

## ✅ Avantages Architecture Actuelle

- 🎯 **Spécialisé MuseScore** - pas d'app générique
- 📦 **Distribution simple** - un ZIP par plateforme
- 🔄 **Versioning automatique** - nom de fichier = version
- 🌐 **Multi-plateformes** - 5 variants générés
- ⚡ **Builds rapides** - workflows séparés pour tests
- 🛡️ **Portable** - pas d'installation système requise