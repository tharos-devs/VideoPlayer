# ⚡ Quick Build Guide

## 🎯 Workflows Disponibles (TOUS MANUELS)

### **🚀 Multi-plateformes :**
- **`🚀 Build All Platforms`** - Windows + macOS + Linux (10-15 min)

### **⚡ Plateformes individuelles (RAPIDE) :**
- **`🪟 Windows x64 Only`** - Windows x64 (~3-5 min)
- **`🪟 Windows ARM64 Only`** - Windows ARM64 (~3-5 min)
- **`🍎 macOS ARM64 Only`** - macOS Apple Silicon (~3-5 min)  
- **`🍎 macOS Intel Only`** - macOS Intel x64 (~3-5 min)
- **`🐧 Linux x64 Only`** - Linux x64 (~3-5 min)

## 🚀 Comment lancer un build rapide

### **Pour Windows (ton cas) :**

1. **Va sur GitHub** → ton repo `VideoPlayer`
2. **Clique sur "Actions"**
3. **Dans la liste de gauche**, clique sur **"🪟 Windows x64 Only"**
4. **Clique sur "Run workflow"** (bouton bleu à droite)
5. **Clique sur "Run workflow"** (dans la popup)

### **⏱️ Résultat :**
- **Temps** : ~3-5 minutes (au lieu de 10-15 min)
- **Artifact** : `videoplayer-windows-x64-only`
- **Contenu** : `.msi` + `.exe` pour Windows

## 📱 Interface GitHub Actions

```
Actions (TOUS MANUELS)
├── 🚀 Build All Platforms       ← Multi-plateformes complet
├── 🪟 Windows x64 Only          ← CLIQUE ICI pour Windows x64 rapide
├── 🪟 Windows ARM64 Only        ← Windows ARM (Surface Pro X, etc.)
├── 🍎 macOS ARM64 Only          ← Apple Silicon (M1/M2/M3)
├── 🍎 macOS Intel Only          ← Intel Macs
├── 🐧 Linux x64 Only            ← Linux AMD64/Intel
└── 🎁 Manual Release            ← Release officielle
```

## 🎯 Utilisation pratique

### **Développement quotidien :**
```bash
# Push code → AUCUN build automatique (par choix)
git push origin main
# Puis lancer manuellement le build souhaité
```

### **Test rapide Windows :**
1. GitHub → Actions → "🪟 Windows x64 Only" → Run workflow
2. Attendre 3-5 min
3. Télécharger `videoplayer-windows-x64-only`

### **Test rapide macOS :**
1. GitHub → Actions → "🍎 macOS ARM64 Only" → Run workflow

### **Test rapide Linux :**
1. GitHub → Actions → "🐧 Linux x64 Only" → Run workflow

## ✅ Avantages (TOUS MANUELS)

- ✅ **Contrôle total** - Aucun build surprise sur push
- ✅ **Plus de queue** - Un seul runner par build choisi
- ✅ **Économie resources** - Build seulement ce dont tu as besoin
- ✅ **Flexibilité maximale** - Choix précis de la plateforme
- ✅ **Débug facile** - Erreurs isolées par plateforme

## 🚀 Options de build

### **Rapide (1 plateforme) :**
- **`🪟 Windows x64 Only`** etc. → 3-5 min

### **Complet (toutes plateformes) :**
- **`🚀 Build All Platforms`** → 10-15 min

### **Release officielle :**
- **`🎁 Manual Release`** → GitHub Release