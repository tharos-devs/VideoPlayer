# 🚀 Guide des Workflows GitHub Actions - VideoPlayer MuseScore

## 📋 Workflows Disponibles

### **1. Workflow Principal (Recommandé)**
- **`package-all-platforms.yml`** : Génère tous les packages MuseScore en une fois
  - **Plateformes** : Windows x64/ARM64, macOS x64/ARM64, Linux x64
  - **Déclenchement** : Manuel uniquement (`workflow_dispatch`)
  - **Résultat** : 5 ZIP portables avec version automatique

### **2. Workflows Individuels (Pour tests spécifiques)**
- **`package-windows-x64.yml`** : Windows 64-bit uniquement
- **`package-windows-arm64.yml`** : Windows ARM64 uniquement
- **`package-macos-x64.yml`** : macOS Intel uniquement
- **`package-macos-arm64.yml`** : macOS Apple Silicon uniquement
- **`package-linux-x64.yml`** : Linux 64-bit uniquement

## 🎯 Comment Générer les Packages

### **Option 1 : Tous les Packages (Recommandé)**

1. **Va sur GitHub Actions**
2. **Clique sur "📦 Package All Platforms for MuseScore"**
3. **"Run workflow"** → **"Run workflow"**
4. **Attends ~5-10 minutes** ⏱️

### **Option 2 : Package Spécifique**

1. **Va sur GitHub Actions**  
2. **Choisis** le workflow de la plateforme voulue
3. **"Run workflow"** → **"Run workflow"**

## 📦 Ce que tu Obtiens

### **Archives ZIP Portables Versionnées :**
- `VideoPlayer-MuseScore-Windows-x64-v1.0.0.zip`
- `VideoPlayer-MuseScore-Windows-ARM64-v1.0.0.zip`
- `VideoPlayer-MuseScore-macOS-x64-v1.0.0.zip`
- `VideoPlayer-MuseScore-macOS-ARM64-v1.0.0.zip`
- `VideoPlayer-MuseScore-Linux-x64-v1.0.0.zip`

### **Contenu de chaque ZIP :**
```
VideoPlayer-MuseScore-[Platform]-v[Version].zip
└── VideoPlayer/             # Dossier prêt pour Plugins MuseScore
    ├── VideoPlayer.qml          # Plugin MuseScore
    ├── logo.png                 # Logo du plugin  
    ├── README.md                # Instructions d'installation
    ├── VideoPlayer.exe/.app     # Exécutable portable
    └── webrtc/                  # Serveur WebRTC intégré
```

## 🎵 Distribution MuseScore

### **Pour les Utilisateurs :**
1. **Télécharge** le ZIP de ta plateforme depuis GitHub Actions → Artifacts
2. **Décompresse** le ZIP - un dossier `VideoPlayer/` sera créé
3. **Copie** le dossier `VideoPlayer/` dans `~/Documents/MuseScore4/Plugins/`
3. **Redémarre** MuseScore
4. **Active** le plugin : Plugins → Plugin Manager → VideoPlayer ✅
5. **Utilise** : Plugins → VideoPlayer

### **Plateformes Supportées :**
- **Windows** : x64 (Intel/AMD) + ARM64
- **macOS** : x64 (Intel) + ARM64 (Apple Silicon M1/M2/M3/M4)
- **Linux** : x64 (Intel/AMD)

## 🔄 Gestion des Versions

### **Pour Changer de Version :**

1. **Modifie** `src-tauri/tauri.conf.json` :
   ```json
   "version": "1.0.1"
   ```

2. **Synchronise** toutes les versions :
   ```bash
   npm run sync-version
   ```

3. **Commit** et **lance** les workflows
4. **Nouveaux ZIP** : `VideoPlayer-MuseScore-[Platform]-v1.0.1.zip`

## ✅ Fonctionnalités Intégrées

- ✅ **FFmpeg statique** (pas d'installation requise)
- ✅ **Serveur WebRTC** intégré
- ✅ **HTTP polling** pour communication MuseScore
- ✅ **Interface de debug** (clic droit)
- ✅ **Packages portables** (pas d'installateur)
- ✅ **Multi-plateforme** 
- ✅ **Versioning automatique**

## 🔧 Dépannage

### **Si le workflow échoue :**
1. **Vérifie** les logs détaillés dans Actions
2. **Assure-toi** que `package.json` est synchronisé avec `tauri.conf.json`
3. **Re-lance** le workflow (les erreurs temporaires sont courantes)

### **Si pas d'artifacts :**
- ⏱️ **Attends** la fin complète (badge 🟢 ou ❌)
- 📍 **Scroll en bas** de la page du workflow
- 📂 **Section "Artifacts"** apparaît après succès

### **Test Local :**
```bash
# Tester localement avant les workflows
npm run tauri:build
npm run sync-version
```

## 🎯 Recommandations

- **Développement** : Utilise `package-all-platforms.yml` 
- **Tests spécifiques** : Utilise les workflows individuels
- **Distribution** : ZIP portables (pas de .msi/.dmg)
- **Versioning** : Toujours via `npm run sync-version`