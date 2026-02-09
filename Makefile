.PHONY: all build watch clean package install icon publish publish-ovsx publish-all help bump-patch bump-minor bump-major

# Default target
all: build

# Install dependencies
install:
	npm install

# Build the extension
build:
	npm run compile

# Watch mode for development
watch:
	npm run watch

# Clean build artifacts
clean:
	rm -rf out/
	rm -rf media/
	rm -rf node_modules/
	rm -f *.vsix

# Generate PNG icon from SVG (tries multiple tools)
icon: images/icon.svg
	@mkdir -p images
	@if command -v rsvg-convert >/dev/null 2>&1; then \
		echo "Using rsvg-convert..."; \
		rsvg-convert -w 256 -h 256 images/icon.svg -o images/icon.png; \
	elif command -v inkscape >/dev/null 2>&1; then \
		echo "Using inkscape..."; \
		inkscape -w 256 -h 256 images/icon.svg -o images/icon.png; \
	elif command -v convert >/dev/null 2>&1; then \
		echo "Using ImageMagick convert..."; \
		convert -background none -size 256x256 images/icon.svg images/icon.png; \
	elif command -v magick >/dev/null 2>&1; then \
		echo "Using ImageMagick magick..."; \
		magick -background none -size 256x256 images/icon.svg images/icon.png; \
	else \
		echo "Error: No SVG converter found. Install one of:"; \
		echo "  - librsvg (brew install librsvg)"; \
		echo "  - inkscape (brew install inkscape)"; \
		echo "  - imagemagick (brew install imagemagick)"; \
		exit 1; \
	fi
	@echo "Icon generated: images/icon.png"

# Package the extension as .vsix
package: build icon
	@if ! command -v vsce >/dev/null 2>&1; then \
		echo "Installing vsce..."; \
		npm install -g @vscode/vsce; \
	fi
	vsce package

# Get the current .vsix filename
VSIX_FILE = $(shell ls -t *.vsix 2>/dev/null | head -1)

# ============================================
# Version Bumping
# ============================================

# Bump patch version (0.0.x)
bump-patch:
	npm version patch --no-git-tag-version
	@echo "Version bumped to $$(node -p "require('./package.json').version")"

# Bump minor version (0.x.0)
bump-minor:
	npm version minor --no-git-tag-version
	@echo "Version bumped to $$(node -p "require('./package.json').version")"

# Bump major version (x.0.0)
bump-major:
	npm version major --no-git-tag-version
	@echo "Version bumped to $$(node -p "require('./package.json').version")"

# ============================================
# VS Code Marketplace
# ============================================

# Publish to VS Code Marketplace (requires VSCE_PAT env var or prior login)
publish-vscode: package
	@if ! command -v vsce >/dev/null 2>&1; then \
		echo "Installing vsce..."; \
		npm install -g @vscode/vsce; \
	fi
	vsce publish

# Publish with specific version bump
publish-vscode-patch: build icon
	vsce publish patch

publish-vscode-minor: build icon
	vsce publish minor

publish-vscode-major: build icon
	vsce publish major

# ============================================
# Open VSX Registry
# ============================================

# Publish to Open VSX (requires OVSX_PAT env var)
publish-ovsx: package
	@if ! command -v ovsx >/dev/null 2>&1; then \
		echo "Installing ovsx..."; \
		npm install -g ovsx; \
	fi
	@if [ -z "$(OVSX_PAT)" ]; then \
		echo "Error: OVSX_PAT environment variable not set"; \
		echo "Get your token from: https://open-vsx.org/user-settings/tokens"; \
		echo "Then run: export OVSX_PAT=your_token"; \
		exit 1; \
	fi
	ovsx publish $(VSIX_FILE) -p $(OVSX_PAT)

# ============================================
# Publish to Both Marketplaces
# ============================================

# Publish to both VS Code Marketplace and Open VSX
publish-all: publish-vscode publish-ovsx
	@echo "Published to both VS Code Marketplace and Open VSX!"

# Alias for backwards compatibility
publish: publish-vscode

# ============================================
# Development
# ============================================

# Run extension in VS Code (opens new window)
run:
	code --extensionDevelopmentPath="$(PWD)"

# Lint TypeScript files
lint:
	@if command -v npx >/dev/null 2>&1; then \
		npx tsc --noEmit; \
	else \
		echo "npx not found"; \
	fi

# ============================================
# Help
# ============================================

help:
	@echo "Calliope Markdown Extension - Build Commands"
	@echo ""
	@echo "Development:"
	@echo "  make install       - Install npm dependencies"
	@echo "  make build         - Compile TypeScript"
	@echo "  make watch         - Watch mode for development"
	@echo "  make run           - Launch VS Code with extension"
	@echo "  make lint          - Type-check without emitting"
	@echo "  make clean         - Remove build artifacts"
	@echo ""
	@echo "Packaging:"
	@echo "  make icon          - Generate PNG icon from SVG"
	@echo "  make package       - Create .vsix package"
	@echo ""
	@echo "Version Bumping:"
	@echo "  make bump-patch    - Bump patch version (0.0.x)"
	@echo "  make bump-minor    - Bump minor version (0.x.0)"
	@echo "  make bump-major    - Bump major version (x.0.0)"
	@echo ""
	@echo "Publishing - VS Code Marketplace:"
	@echo "  make publish-vscode          - Publish to VS Code Marketplace"
	@echo "  make publish-vscode-patch    - Publish with patch version bump"
	@echo "  make publish-vscode-minor    - Publish with minor version bump"
	@echo "  make publish-vscode-major    - Publish with major version bump"
	@echo ""
	@echo "Publishing - Open VSX:"
	@echo "  make publish-ovsx            - Publish to Open VSX Registry"
	@echo "                                 (requires OVSX_PAT env var)"
	@echo ""
	@echo "Publishing - Both:"
	@echo "  make publish-all             - Publish to both marketplaces"
	@echo ""
	@echo "Environment Variables:"
	@echo "  VSCE_PAT  - VS Code Marketplace token (or use 'vsce login')"
	@echo "  OVSX_PAT  - Open VSX token (https://open-vsx.org/user-settings/tokens)"
	@echo ""
	@echo "Icon Generation (requires one of):"
	@echo "  brew install librsvg         # rsvg-convert"
	@echo "  brew install inkscape        # inkscape"
	@echo "  brew install imagemagick     # convert"
