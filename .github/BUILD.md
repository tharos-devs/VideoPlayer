# Build Instructions

## GitHub Actions Workflows

Ce projet contient plusieurs workflows GitHub Actions pour générer des builds sur différentes plateformes :

### 1. `build.yml` - Build multi-plateforme
- **Déclenchement :** Push/PR sur `main`
- **Plateformes :** macOS, Ubuntu, Windows
- **Configuration :** `fail-fast: false` pour éviter l'annulation si une plateforme échoue

### 2. `build-windows.yml` - Build Windows x64 uniquement
- **Déclenchement :** Push/PR sur `main` + déclenchement manuel
- **Plateforme :** Windows x64 uniquement
- **Target :** `x86_64-pc-windows-msvc`
- **Artefacts :** `.msi` et `.exe` files

### 3. `build-macos-arm.yml` - Build macOS ARM64 uniquement
- **Déclenchement :** Push/PR sur `main` + déclenchement manuel
- **Plateforme :** macOS ARM64 (Apple Silicon)
- **Target :** `aarch64-apple-darwin`
- **Artefacts :** `.dmg` et `.app` files

## Utilisation

### Pour générer un build Windows depuis votre Mac ARM :

1. **Option A - Déclenchement automatique :**
   - Push votre code sur la branche `main`
   - Le workflow `build-windows.yml` se lancera automatiquement

2. **Option B - Déclenchement manuel :**
   - Allez sur GitHub → Actions → "Build Windows x64"
   - Cliquez sur "Run workflow" → "Run workflow"

### Récupérer les artefacts :

1. Allez sur GitHub → Actions
2. Cliquez sur le run de build
3. Descendez à la section "Artifacts"
4. Téléchargez `videoplayer-windows-x64`

## Résolution des problèmes

### Erreur "strategy configuration was canceled"
- **Cause :** `fail-fast: true` par défaut dans les matrix builds
- **Solution :** Utilisez `fail-fast: false` ou les workflows spécifiques par plateforme

### Build macOS échoue
- Utilisez `build-macos-arm.yml` pour les targets ARM64 spécifiques

### Dépendances manquantes
- Les workflows installent automatiquement toutes les dépendances
- Pour Ubuntu : WebKit, GTK, AppIndicator
- Pour Windows : WebView2, MSVC Build Tools
- Pour macOS : Xcode Command Line Tools

## Configuration des secrets

Aucun secret supplémentaire n'est requis. Les workflows utilisent automatiquement :
- `GITHUB_TOKEN` : Fourni automatiquement par GitHub Actions

## Targets supportés

- **Windows :** `x86_64-pc-windows-msvc`
- **macOS Intel :** `x86_64-apple-darwin`  
- **macOS ARM :** `aarch64-apple-darwin`
- **Linux :** `x86_64-unknown-linux-gnu`