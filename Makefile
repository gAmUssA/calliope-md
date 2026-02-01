.PHONY: all build watch clean package install icon publish help

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

# Publish to VS Code Marketplace (requires VSCE_PAT or login)
publish: build icon
	@if ! command -v vsce >/dev/null 2>&1; then \
		echo "Installing vsce..."; \
		npm install -g @vscode/vsce; \
	fi
	vsce publish

# Publish with specific version bump
publish-patch: build icon
	vsce publish patch

publish-minor: build icon
	vsce publish minor

publish-major: build icon
	vsce publish major

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

# Show help
help:
	@echo "Calliope Markdown Extension - Build Commands"
	@echo ""
	@echo "Development:"
	@echo "  make install    - Install npm dependencies"
	@echo "  make build      - Compile TypeScript"
	@echo "  make watch      - Watch mode for development"
	@echo "  make run        - Launch VS Code with extension"
	@echo "  make lint       - Type-check without emitting"
	@echo "  make clean      - Remove build artifacts"
	@echo ""
	@echo "Publishing:"
	@echo "  make icon       - Generate PNG icon from SVG"
	@echo "  make package    - Create .vsix package"
	@echo "  make publish    - Publish to VS Code Marketplace"
	@echo "  make publish-patch/minor/major - Publish with version bump"
	@echo ""
	@echo "Requirements for icon generation (one of):"
	@echo "  brew install librsvg    # rsvg-convert"
	@echo "  brew install inkscape   # inkscape"
	@echo "  brew install imagemagick # convert"
