import * as cheerio from 'cheerio';

/**
 * Process SVG to adjust dimensions based on line count.
 * Adapted from SeardnaSchmid/markdown-inline-editor-vscode.
 */
export function processSvg(svgString: string, height: number): string {
  const $ = cheerio.load(svgString, { xmlMode: true });
  const svgNode = $('svg').first();

  if (svgNode.length === 0) {
    return svgString;
  }

  // Get original dimensions from height attribute or viewBox
  const widthAttr = svgNode.attr('width') || '0';
  let originalHeight = parseFloat(svgNode.attr('height') || '0');
  let originalWidth = widthAttr === '100%' ? 0 : parseFloat(widthAttr) || 0;

  // If height/width not in attributes, try viewBox
  if ((originalHeight === 0 || originalWidth === 0) && svgNode.attr('viewBox')) {
    const viewBox = svgNode.attr('viewBox')!.split(/\s+/);
    if (viewBox.length >= 4) {
      const viewBoxWidth = parseFloat(viewBox[2]) || 0;
      const viewBoxHeight = parseFloat(viewBox[3]) || 0;
      if (originalWidth === 0 && viewBoxWidth > 0) {
        originalWidth = viewBoxWidth;
      }
      if (originalHeight === 0 && viewBoxHeight > 0) {
        originalHeight = viewBoxHeight;
      }
    }
  }

  // Fix invalid viewBox with zero width (bug in Mermaid gantt charts)
  const currentViewBox = svgNode.attr('viewBox');
  if (currentViewBox) {
    const viewBoxParts = currentViewBox.split(/\s+/);
    if (viewBoxParts.length >= 4) {
      const viewBoxMinX = parseFloat(viewBoxParts[0]) || 0;
      const viewBoxMinY = parseFloat(viewBoxParts[1]) || 0;
      const viewBoxWidth = parseFloat(viewBoxParts[2]) || 0;
      const viewBoxHeight = parseFloat(viewBoxParts[3]) || 0;

      if (viewBoxWidth === 0 && viewBoxHeight > 0) {
        let fixedWidth = originalWidth;
        if (fixedWidth === 0) {
          fixedWidth = Math.max(600, viewBoxHeight * 3);
        }
        const fixedViewBox = `${viewBoxMinX} ${viewBoxMinY} ${fixedWidth} ${viewBoxHeight}`;
        svgNode.attr('viewBox', fixedViewBox);
        originalWidth = fixedWidth;
        svgNode.attr('width', `${fixedWidth}`);
      }
    }
  }

  // Calculate width from aspect ratio
  let calculatedWidth: number | undefined;
  let aspectRatio: number | undefined;

  const finalViewBox = svgNode.attr('viewBox');
  if (finalViewBox) {
    const viewBoxParts = finalViewBox.split(/\s+/);
    if (viewBoxParts.length >= 4) {
      const viewBoxWidth = parseFloat(viewBoxParts[2]) || 0;
      const viewBoxHeight = parseFloat(viewBoxParts[3]) || 0;
      if (viewBoxWidth > 0 && viewBoxHeight > 0) {
        aspectRatio = viewBoxWidth / viewBoxHeight;
        calculatedWidth = aspectRatio * height;
        if (originalWidth === 0 || originalWidth !== viewBoxWidth) {
          originalWidth = viewBoxWidth;
        }
      }
    }
  }

  if (!calculatedWidth && originalWidth > 0 && originalHeight > 0) {
    aspectRatio = originalWidth / originalHeight;
    calculatedWidth = aspectRatio * height;
  }

  if (!calculatedWidth || calculatedWidth <= 0) {
    calculatedWidth = Math.max(400, height * 2);
  }

  svgNode.css('max-width', '');
  svgNode.attr('width', `${calculatedWidth}px`);
  svgNode.attr('height', `${height}px`);

  if (!svgNode.attr('preserveAspectRatio')) {
    svgNode.attr('preserveAspectRatio', 'xMinYMin meet');
  }

  const processedSvg = svgNode.toString();
  return processedSvg;
}

/**
 * Reduce number precision in attribute values
 */
function reduceNumberPrecision(value: string): string {
  return value.replace(/(-?\d+\.\d{3,})/g, (match) => {
    const num = parseFloat(match);
    if (isNaN(num)) return match;
    const rounded = Math.round(num * 100) / 100;
    if (rounded % 1 === 0) {
      return Math.round(rounded).toString();
    }
    return rounded.toString().replace(/\.?0+$/, '');
  });
}

/**
 * Simplify SVG path data by reducing precision
 */
function simplifyPathData(pathData: string): string {
  return pathData.replace(/(-?\d+\.\d{3,})/g, (match) => {
    const num = parseFloat(match);
    if (isNaN(num)) return match;
    const rounded = Math.round(num * 10) / 10;
    return rounded.toString().replace(/\.?0+$/, '');
  });
}

/**
 * Aggressively optimize SVG by removing unnecessary content and reducing precision
 */
function optimizeSvg(svgString: string): string {
  const $ = cheerio.load(svgString, { xmlMode: true });
  const svgNode = $('svg').first();

  if (svgNode.length === 0) {
    return svgString;
  }

  // Remove XML comments
  $('*')
    .contents()
    .filter(function () {
      return this.nodeType === 8;
    })
    .remove();

  // Remove empty groups
  $('g').each(function () {
    const $group = $(this);
    if ($group.children().length === 0 && !$group.attr('id') && !$group.attr('class')) {
      $group.remove();
    }
  });

  // Optimize all elements
  svgNode.find('*').each(function () {
    const $elem = $(this);

    const d = $elem.attr('d');
    if (d) {
      $elem.attr('d', simplifyPathData(d));
    }

    const numericAttrs = [
      'x',
      'y',
      'width',
      'height',
      'cx',
      'cy',
      'r',
      'rx',
      'ry',
      'x1',
      'y1',
      'x2',
      'y2',
      'transform',
      'viewBox',
    ];
    for (const attr of numericAttrs) {
      const value = $elem.attr(attr);
      if (value && typeof value === 'string') {
        const optimized = reduceNumberPrecision(value);
        if (optimized !== value) {
          $elem.attr(attr, optimized);
        }
      }
    }
  });

  const viewBox = svgNode.attr('viewBox');
  if (viewBox) {
    svgNode.attr('viewBox', reduceNumberPrecision(viewBox));
  }

  let optimized = svgNode.toString();
  optimized = optimized.replace(/>\s+</g, '><');
  optimized = optimized.trim();

  return optimized;
}

/**
 * Ensure SVG has explicit width and height attributes for proper display
 */
export function ensureSvgDimensions(svgString: string, width: number, height: number): string {
  const $ = cheerio.load(svgString, { xmlMode: true });
  const svgNode = $('svg').first();

  if (svgNode.length === 0) {
    return svgString;
  }

  svgNode.attr('width', `${width}px`);
  svgNode.attr('height', `${height}px`);

  if (!svgNode.attr('viewBox')) {
    svgNode.attr('viewBox', `0 0 ${width} ${height}`);
  }

  const currentWidth = svgNode.attr('width');
  if (currentWidth && currentWidth.includes('%')) {
    svgNode.attr('width', `${width}px`);
  }

  const result = svgNode.toString();
  return optimizeSvg(result);
}

/**
 * Convert SVG string to data URI using URL encoding
 */
export function svgToDataUri(svg: string): string {
  const encoded = encodeURIComponent(svg);
  return `data:image/svg+xml;charset=utf-8,${encoded}`;
}

/**
 * Convert SVG string to data URI using Base64 encoding
 */
export function svgToDataUriBase64(svg: string): string {
  const encoded = Buffer.from(svg, 'utf8').toString('base64');
  return `data:image/svg+xml;base64,${encoded}`;
}
