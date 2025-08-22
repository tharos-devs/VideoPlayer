# ⚡ Quick Build Guide - VideoPlayer MuseScore

## 🎯 Workflows Disponibles (TOUS MANUELS)

### **🚀 Recommandé - Tous les Packages :**
- **`📦 Package All Platforms for MuseScore`** - 5 ZIP portables (5-10 min)

### **⚡ Plateformes individuelles (POUR TESTS) :**
- **`📦 Package Windows x64 MuseScore`** - Windows 64-bit (~2-3 min)
- **`📦 Package Windows ARM64 MuseScore`** - Windows ARM64 (~2-3 min)
- **`📦 Package macOS ARM64 MuseScore`** - Apple Silicon M1/M2/M3/M4 (~2-3 min)  
- **`📦 Package macOS x64 MuseScore`** - Intel Macs (~2-3 min)
- **`📦 Package Linux x64 MuseScore`** - Linux 64-bit (~2-3 min)

## 🚀 Comment Générer un Package Rapidement

### **Pour Toutes les Plateformes (Recommandé) :**

1. **Va sur GitHub** → ton repo `VideoPlayer`
2. **Clique sur "Actions"**
3. **Dans la liste de gauche**, clique sur **"📦 Package All Platforms for MuseScore"**
4. **Clique sur "Run workflow"** (bouton bleu à droite)
5. **Clique sur "Run workflow"** (confirmer)

### **⏱️ Résultat :**
- **Temps** : ~5-10 minutes
- **Artifacts** : 5 ZIP versionnés
  - `VideoPlayer-MuseScore-Windows-x64-v1.0.0`
  - `VideoPlayer-MuseScore-Windows-ARM64-v1.0.0`
  - `VideoPlayer-MuseScore-macOS-x64-v1.0.0`
  - `VideoPlayer-MuseScore-macOS-ARM64-v1.0.0`
  - `VideoPlayer-MuseScore-Linux-x64-v1.0.0`

### **Pour Une Seule Plateforme (Tests) :**

**Exemple Windows x64 :**
1. **Actions** → **"📦 Package Windows x64 MuseScore"** → **"Run workflow"**
2. **Attendre** ~2-3 min  
3. **Télécharger** `VideoPlayer-MuseScore-Windows-x64-v1.0.0`

## 📱 Interface GitHub Actions

```
Actions (TOUS MANUELS - AUCUN BUILD AUTOMATIQUE)
├── 📦 Package All Platforms for MuseScore    ← RECOMMANDÉ
├── 📦 Package Windows x64 MuseScore          ← Test Windows 64-bit
├── 📦 Package Windows ARM64 MuseScore        ← Test Windows ARM
├── 📦 Package macOS ARM64 MuseScore          ← Test Apple Silicon
├── 📦 Package macOS x64 MuseScore            ← Test Intel Macs  
└── 📦 Package Linux x64 MuseScore            ← Test Linux
```

## 🎯 Utilisation Pratique

### **Développement quotidien :**
```bash
# 1. Changer version si nécessaire (tauri.conf.json)
# 2. Synchroniser versions
npm run sync-version

# 3. Push code → AUCUN build automatique
git push origin main

# 4. Lancer workflow manuellement selon besoin
```

### **Scénarios Courants :**

**🔧 Je développe et veux tester sur une plateforme :**
→ Utilise un workflow individuel (~2-3 min)

**📦 Je veux distribuer/livrer :**
→ Utilise `Package All Platforms` (~5-10 min)

**🐛 Debug problème spécifique plateforme :**
→ Utilise le workflow de cette plateforme uniquement

## 📦 Ce que Contient Chaque ZIP

```
VideoPlayer-MuseScore-[Platform]-v[Version]/
├── VideoPlayer.qml          # Plugin MuseScore
├── logo.png                 # Logo du plugin  
├── README.md                 # Instructions utilisateur
├── VideoPlayer.exe/.app     # Lecteur vidéo portable
└── webrtc/                  # Serveur WebRTC (tout inclus)
```

## ✅ Avantages du Système Actuel

- ✅ **Contrôle total** - Builds uniquement à la demande
- ✅ **ZIP portables** - Pas d'installateurs (.msi/.dmg)
- ✅ **Versioning automatique** - Noms de fichiers avec version
- ✅ **Multi-plateformes** - Windows, macOS, Linux
- ✅ **Architecture multiple** - x64 + ARM64
- ✅ **Prêt MuseScore** - Plugin + lecteur dans le même ZIP
- ✅ **Économie ressources** - Build seulement ce que tu veux

## 🎵 Après le Build - Distribution MuseScore

### **Pour tes Utilisateurs :**
1. **Téléchargent** le ZIP de leur plateforme
2. **Décompressent** dans `~/Documents/MuseScore4/Plugins/VideoPlayer/`
3. **Redémarrent** MuseScore  
4. **Activent** : Plugins → Plugin Manager → VideoPlayer ✅
5. **Utilisent** : Plugins → VideoPlayer

### **Plateformes Supportées :**
- **Windows** : x64 + ARM64 (Surface Pro X, etc.)
- **macOS** : Intel + Apple Silicon (M1/M2/M3/M4)
- **Linux** : x64

## 🔄 Workflow de Version

```bash
# 1. Modifier version (source unique)
# vim src-tauri/tauri.conf.json → "version": "1.0.1"

# 2. Synchroniser partout
npm run sync-version

# 3. Commit
git add . && git commit -m "Bump to v1.0.1"

# 4. Lancer Package All Platforms
# Résultat : VideoPlayer-MuseScore-[Platform]-v1.0.1.zip
```

## 🚀 Recommandations

**🎯 Usage Normal :** `Package All Platforms` (une fois, 5 plateformes)
**🔧 Debug/Test :** Workflows individuels (rapide, ciblé)
**📦 Distribution :** ZIP portables (pas d'installateurs)
**🔄 Versioning :** Toujours `npm run sync-version` avant build