# VideoPlayer - Guide de compilation

Ce guide vous aide à compiler VideoPlayer sur Windows, Linux et macOS, avec la possibilité de cross-compiler depuis macOS.

## 📋 Prérequis généraux

### Rust et Tauri
```bash
# Installer Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# Installer Tauri CLI
cargo install tauri-cli
```

### Node.js et dependencies
```bash
# Installer Node.js (version 18+ recommandée)
# Télécharger depuis https://nodejs.org/ ou utiliser un gestionnaire de versions

# Installer les dépendances WebRTC
cd webrtc
npm install
```

---

## 🖥️ Compilation sur chaque plateforme

### macOS

#### Prérequis macOS
```bash
# Xcode Command Line Tools
xcode-select --install

# FFmpeg (pour le streaming vidéo)
brew install ffmpeg
```

#### Compilation
```bash
# Depuis le dossier racine
cd src-tauri
cargo tauri build

# Pour le développement
cargo tauri dev
```

---

### Windows

#### Prérequis Windows
```powershell
# Visual Studio Build Tools 2019/2022
# Télécharger depuis https://visualstudio.microsoft.com/downloads/
# Installer "C++ build tools" workload

# FFmpeg pour Windows
# Option 1: Chocolatey
choco install ffmpeg

# Option 2: Manual
# Télécharger depuis https://ffmpeg.org/download.html#build-windows
# Ajouter ffmpeg/bin au PATH système
```

#### WebKit2GTK (si nécessaire)
```powershell
# WebView2 (généralement préinstallé sur Windows 10/11)
# Si manquant, télécharger depuis:
# https://developer.microsoft.com/en-us/microsoft-edge/webview2/
```

#### Compilation
```cmd
:: Depuis le dossier racine
cd src-tauri
cargo tauri build

:: Pour le développement
cargo tauri dev
```

---

### Linux (Ubuntu/Debian)

#### Prérequis Linux
```bash
# Dépendances système essentielles
sudo apt update
sudo apt install -y build-essential curl wget file

# WebKit et dépendances graphiques
sudo apt install -y libwebkit2gtk-4.0-dev \
    libssl-dev \
    libgtk-3-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev

# FFmpeg
sudo apt install -y ffmpeg

# Pour les systèmes basés sur RPM (Fedora, CentOS, RHEL)
# sudo dnf install webkit2gtk4.0-devel openssl-devel gtk3-devel libappindicator-gtk3-devel librsvg2-devel ffmpeg
```

#### Compilation
```bash
# Depuis le dossier racine
cd src-tauri
cargo tauri build

# Pour le développement
cargo tauri dev
```

---

## 🔄 Cross-compilation depuis macOS

Vous pouvez compiler pour Windows et Linux directement depuis macOS.

### Configuration initiale

```bash
# Ajouter les targets Rust
rustup target add x86_64-pc-windows-msvc
rustup target add x86_64-unknown-linux-gnu

# Installer les linkers
brew install mingw-w64
brew tap SergioBenitez/osxct
brew install x86_64-unknown-linux-gnu
```

### Cross-compilation pour Windows

```bash
# Installer xwin pour les libraries Windows
cargo install xwin

# Télécharger les SDK Windows
xwin --accept-license splat --output ~/.xwin

# Configuration dans ~/.cargo/config.toml
mkdir -p ~/.cargo
cat >> ~/.cargo/config.toml << 'EOF'
[target.x86_64-pc-windows-msvc]
linker = "lld"
rustflags = [
  "-Lnative=/Users/$(whoami)/.xwin/crt/lib/x86_64",
  "-Lnative=/Users/$(whoami)/.xwin/sdk/lib/um/x86_64",
  "-Lnative=/Users/$(whoami)/.xwin/sdk/lib/ucrt/x86_64"
]
EOF

# Compiler pour Windows
cd src-tauri
cargo tauri build --target x86_64-pc-windows-msvc
```

### Cross-compilation pour Linux

```bash
# Configuration pour Linux dans ~/.cargo/config.toml
cat >> ~/.cargo/config.toml << 'EOF'
[target.x86_64-unknown-linux-gnu]
linker = "x86_64-unknown-linux-gnu-gcc"
EOF

# Installer les dépendances Linux via Docker (méthode recommandée)
# Créer un Dockerfile pour l'environnement de build
cat > Dockerfile.linux-build << 'EOF'
FROM ubuntu:22.04
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    libwebkit2gtk-4.0-dev \
    libssl-dev \
    libgtk-3-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev \
    pkg-config
EOF

# Alternative: utiliser cross
cargo install cross
cd src-tauri
cross build --target x86_64-unknown-linux-gnu --release
```

---

## 🚀 Commandes de build rapides

### Développement local
```bash
# Démarrer en mode développement
npm run tauri dev

# Ou depuis src-tauri/
cargo tauri dev
```

### Build de production
```bash
# Build pour la plateforme actuelle
npm run tauri build

# Ou depuis src-tauri/
cargo tauri build
```

### Build multi-plateformes (depuis macOS)
```bash
# Windows
cargo tauri build --target x86_64-pc-windows-msvc

# Linux  
cross build --target x86_64-unknown-linux-gnu --release

# macOS (natif)
cargo tauri build
```

---

## 📁 Fichiers de sortie

Les exécutables compilés se trouvent dans :
```
src-tauri/target/release/
src-tauri/target/[target-triple]/release/
```

Les installateurs se trouvent dans :
```
src-tauri/target/release/bundle/
```

### Formats par plateforme
- **macOS**: `.app`, `.dmg`
- **Windows**: `.exe`, `.msi`  
- **Linux**: `.deb`, `.AppImage`

---

## 🐛 Résolution de problèmes

### Erreur FFmpeg introuvable
```bash
# Vérifier l'installation
ffmpeg -version

# Ajouter au PATH si nécessaire (Windows)
setx PATH "%PATH%;C:\ffmpeg\bin"
```

### Erreur WebKit sur Linux
```bash
# Réinstaller les dépendances
sudo apt install --reinstall libwebkit2gtk-4.0-dev
```

### Erreur de linking sur macOS
```bash
# Réinstaller Xcode Command Line Tools
sudo xcode-select --reset
xcode-select --install
```

### Cross-compilation échoue
```bash
# Nettoyer et reconstruire
cargo clean
cargo tauri build --target [target-triple]
```

---

## 📝 Notes importantes

1. **FFmpeg** : Obligatoire sur toutes les plateformes pour le streaming vidéo
2. **WebView** : Automatiquement géré par Tauri
3. **Ports** : Le serveur WebRTC utilise le port 5173
4. **Permissions** : Peut nécessiter des permissions spéciales sur macOS/Linux

## 🔗 Liens utiles

- [Tauri Documentation](https://tauri.app/)
- [Rust Installation](https://rustup.rs/)
- [FFmpeg Downloads](https://ffmpeg.org/download.html)
- [Cross-compilation Guide](https://tauri.app/v1/guides/building/cross-platform)