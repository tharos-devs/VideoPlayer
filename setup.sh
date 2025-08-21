#!/bin/bash

# VideoPlayer Development Environment Setup Script
# For macOS and Linux

set -e

echo "🚀 Setting up VideoPlayer development environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Detect OS
OS="$(uname -s)"
case "${OS}" in
    Linux*)     MACHINE=Linux;;
    Darwin*)    MACHINE=Mac;;
    *)          MACHINE="UNKNOWN:${OS}"
esac

print_status "Detected OS: $MACHINE"

# Check if running on supported OS
if [[ "$MACHINE" != "Linux" && "$MACHINE" != "Mac" ]]; then
    print_error "Unsupported operating system: $MACHINE"
    exit 1
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Install Node.js if not present
if ! command_exists node; then
    print_warning "Node.js not found. Installing..."
    
    if [[ "$MACHINE" == "Mac" ]]; then
        # Check if Homebrew is installed
        if ! command_exists brew; then
            print_status "Installing Homebrew..."
            /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        fi
        print_status "Installing Node.js via Homebrew..."
        brew install node
    elif [[ "$MACHINE" == "Linux" ]]; then
        # Install Node.js via package manager
        if command_exists apt-get; then
            print_status "Installing Node.js via apt..."
            curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
            sudo apt-get install -y nodejs
        elif command_exists yum; then
            print_status "Installing Node.js via yum..."
            curl -fsSL https://rpm.nodesource.com/setup_lts.x | sudo bash -
            sudo yum install -y nodejs
        elif command_exists pacman; then
            print_status "Installing Node.js via pacman..."
            sudo pacman -S nodejs npm
        else
            print_error "Package manager not supported. Please install Node.js manually."
            exit 1
        fi
    fi
else
    print_status "Node.js is already installed: $(node --version)"
fi

# Install Rust if not present
if ! command_exists rustc; then
    print_warning "Rust not found. Installing..."
    print_status "Installing Rust via rustup..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source "$HOME/.cargo/env"
else
    print_status "Rust is already installed: $(rustc --version)"
fi

# Ensure cargo is in PATH
if ! command_exists cargo; then
    print_status "Adding cargo to PATH..."
    source "$HOME/.cargo/env"
fi

# FFmpeg is now bundled via ffmpeg-static npm package
print_status "FFmpeg will be bundled automatically with the application"

# Install system dependencies
if [[ "$MACHINE" == "Linux" ]]; then
    print_status "Installing additional system dependencies for Linux..."
    
    if command_exists apt-get; then
        sudo apt-get install -y \
            libwebkit2gtk-4.0-dev \
            build-essential \
            curl \
            wget \
            libssl-dev \
            libgtk-3-dev \
            libayatana-appindicator3-dev \
            librsvg2-dev \
            pkg-config
    elif command_exists yum; then
        sudo yum install -y \
            webkit2gtk4.0-devel \
            openssl-devel \
            curl \
            wget \
            libappindicator-gtk3 \
            librsvg2-devel \
            gcc \
            gcc-c++ \
            make
    elif command_exists pacman; then
        sudo pacman -S --needed \
            webkit2gtk \
            base-devel \
            curl \
            wget \
            openssl \
            libappindicator-gtk3 \
            librsvg \
            pkg-config
    fi
    
elif [[ "$MACHINE" == "Mac" ]]; then
    print_status "Installing system dependencies for macOS..."
    
    # Install Xcode Command Line Tools if not present
    if ! xcode-select -p &> /dev/null; then
        print_status "Installing Xcode Command Line Tools..."
        xcode-select --install
        print_warning "Please complete the Xcode Command Line Tools installation and re-run this script."
        exit 1
    fi
fi

# Install Tauri CLI
print_status "Installing Tauri CLI..."
if ! command_exists tauri; then
    cargo install tauri-cli
else
    print_status "Tauri CLI is already installed"
fi

# Install npm dependencies
print_status "Installing npm dependencies..."
npm install

# Create copy-assets.sh if it doesn't exist
if [[ ! -f "copy-assets.sh" ]]; then
    print_status "Creating copy-assets.sh script..."
    cat > copy-assets.sh << 'EOF'
#!/bin/bash
# Copy assets script
echo "Copying assets..."
# Add your asset copying logic here
EOF
    chmod +x copy-assets.sh
fi

# Verify installation
print_status "Verifying installation..."

if command_exists node; then
    print_status "✅ Node.js: $(node --version)"
else
    print_error "❌ Node.js installation failed"
fi

if command_exists npm; then
    print_status "✅ npm: $(npm --version)"
else
    print_error "❌ npm installation failed"
fi

if command_exists rustc; then
    print_status "✅ Rust: $(rustc --version)"
else
    print_error "❌ Rust installation failed"
fi

if command_exists cargo; then
    print_status "✅ Cargo: $(cargo --version)"
else
    print_error "❌ Cargo installation failed"
fi

if command_exists tauri; then
    print_status "✅ Tauri CLI: $(tauri --version)"
else
    print_error "❌ Tauri CLI installation failed"
fi

print_status "✅ FFmpeg: Bundled automatically with the application"

print_status "🎉 Setup complete! You can now run:"
echo "  npm run tauri:dev    - Start development server"
echo "  npm run tauri:build  - Build the application"

print_warning "Note: You may need to restart your terminal or run 'source ~/.bashrc' (or ~/.zshrc) to update your PATH."