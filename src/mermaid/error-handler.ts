/**
 * Error handling utilities for Mermaid rendering
 */

/**
 * Escape XML special characters for use in SVG text
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Create an error SVG to display when Mermaid rendering fails
 */
export function createErrorSvg(
  errorMessage: string,
  width: number,
  height: number,
  isDark: boolean
): string {
  const bgColor = isDark ? '#2d2d2d' : '#f5f5f5';
  const textColor = isDark ? '#ff6b6b' : '#d32f2f';
  const borderColor = isDark ? '#ff6b6b' : '#d32f2f';
  const secondaryTextColor = isDark ? '#cccccc' : '#666666';

  // Split into lines that fit within the SVG width
  const maxLineLength = Math.floor((width - 80) / 7);
  const words = errorMessage.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? currentLine + ' ' + word : word;
    if (testLine.length > maxLineLength && currentLine.length > 0) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }

  // Limit to reasonable number of lines to fit in height
  const maxLines = Math.floor((height - 100) / 18);
  const displayLines = lines.slice(0, Math.max(maxLines, 1));
  if (lines.length > maxLines) {
    displayLines.push('... (error message truncated)');
  }

  const lineHeight = 18;
  const padding = 20;
  const iconSize = 40;
  const titleY = padding + iconSize + 15;
  const messageStartY = titleY + 25;

  const textLines = displayLines
    .map(
      (line, i) =>
        `<tspan x="${padding}" dy="${i === 0 ? 0 : lineHeight}">${escapeXml(line)}</tspan>`
    )
    .join('');

  const contentHeight = Math.max(
    height,
    padding * 2 + iconSize + 25 + displayLines.length * lineHeight
  );

  return `<svg width="${width}" height="${contentHeight}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${contentHeight}" fill="${bgColor}" stroke="${borderColor}" stroke-width="2" rx="4"/>
  <circle cx="${padding + iconSize / 2}" cy="${padding + iconSize / 2}" r="${iconSize / 2}" fill="${borderColor}" opacity="0.2"/>
  <text x="${padding + iconSize / 2}" y="${padding + iconSize / 2 + 5}" font-family="Arial, sans-serif" font-size="24" fill="${borderColor}" text-anchor="middle" font-weight="bold">&#9888;</text>
  <text x="${padding + iconSize + 15}" y="${titleY}" font-family="Arial, sans-serif" font-size="14" fill="${textColor}" font-weight="bold">Mermaid Rendering Error</text>
  <text x="${padding}" y="${messageStartY}" font-family="monospace, Arial, sans-serif" font-size="11" fill="${secondaryTextColor}">
    ${textLines}
  </text>
</svg>`;
}

/**
 * Extract error message from error SVG
 */
export function extractErrorMessage(errorSvg: string): string | null {
  const match = errorSvg.match(/<tspan[^>]*>([^<]+)<\/tspan>/g);
  if (match && match.length > 0) {
    const messageLines = match.map((line) => {
      const contentMatch = line.match(/>([^<]+)</);
      return contentMatch ? contentMatch[1] : '';
    });
    return messageLines.join(' ').trim() || null;
  }
  return null;
}
