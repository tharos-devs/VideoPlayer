# 🚀 Guide des Workflows GitHub Actions

## 📋 Workflows Disponibles (SIMPLIFIÉ)

### **1. Build Principal** 
- **`build.yml`** : **Windows x64**, **macOS ARM64**, **Linux x64**
  - Déclenchement : Push/PR sur `main` + Manuel
  - Artifacts : 3 builds séparés

### **2. Release Officielle**
- **`manual-release.yml`** : Release complète avec toutes plateformes
  - Déclenchement : Manuel uniquement
  - Résultat : GitHub Release avec téléchargements

## 🎯 Comment Récupérer tes Builds

### **Option 1 : Artifacts (Plus Simple)**

1. **Push ton code** :
   ```bash
   git add .
   git commit -m "Mes changements"
   git push origin main
   ```

2. **Va sur GitHub** :
   - Actions → Clique sur le dernier build
   - Scroll vers le bas → Section "Artifacts"
   - Télécharge `videoplayer-windows-x64` (ou autre plateforme)

3. **Décompresse et utilise** le fichier `.exe` ou `.app`

### **Option 2 : Release Manuelle**

1. **Va sur GitHub Actions**
2. **Clique sur "Manual Release"**
3. **"Run workflow"**
4. **Entre version** (ex: v1.0.0)
5. **Laisse "all"** pour toutes les plateformes
6. **"Run workflow"**

Une fois terminé → **Releases** → Télécharge les fichiers

## 🎁 Ce que tu obtiens

### **3 Artifacts séparés :**
- **`videoplayer-windows-x64`** : `.msi` + `.exe` installateurs
- **`videoplayer-macos-arm64`** : `.app` + `.dmg` pour Apple Silicon  
- **`videoplayer-linux-x64`** : `.deb` + `.AppImage` pour Linux

## ✅ Tous les builds incluent :

- ✅ **FFmpeg intégré** (pas d'installation requise)
- ✅ **WebRTC server** 
- ✅ **Interface complète**
- ✅ **Prêt à distribuer**

## 🔧 Dépannage

### Si le build échoue :
1. Vérifie les **logs** dans Actions
2. **Re-push** souvent résout les problèmes temporaires
3. Les **permissions** sont déjà configurées

### Si pas d'artifacts :
- Le build a peut-être échoué
- Attends la fin complète (🟢 ou ❌)
- Les artifacts apparaissent en bas de la page

## 🎯 Recommandation

**Pour développement** : Utilise les **artifacts** (plus rapide)
**Pour distribution** : Utilise **Manual Release** (plus propre)