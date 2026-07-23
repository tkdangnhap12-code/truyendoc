import JSZip from 'jszip';

/**
 * Extracts plain text content from an EPUB file (ArrayBuffer or File)
 */
export async function extractTextFromEpub(file: File | ArrayBuffer): Promise<string> {
  const zip = new JSZip();
  const loadedZip = await zip.loadAsync(file);

  // 1. Try finding container.xml to locate OPF manifest file
  let opfPath = '';
  const containerFile = loadedZip.file('META-INF/container.xml');
  if (containerFile) {
    const containerText = await containerFile.async('text');
    const match = containerText.match(/full-path="([^"]+)"/i);
    if (match && match[1]) {
      opfPath = match[1];
    }
  }

  const htmlContentParts: string[] = [];

  if (opfPath && loadedZip.file(opfPath)) {
    try {
      const opfText = await loadedZip.file(opfPath)!.async('text');
      const opfDir = opfPath.includes('/') ? opfPath.substring(0, opfPath.lastIndexOf('/') + 1) : '';

      // Parse manifest items: id -> href
      const manifestItems: Record<string, string> = {};
      const itemRegex = /<item\s+[^>]*id="([^"]+)"[^>]*href="([^"]+)"[^>]*>/gi;
      let match;
      while ((match = itemRegex.exec(opfText)) !== null) {
        manifestItems[match[1]] = match[2];
      }
      // Alternate attribute order regex
      const itemRegex2 = /<item\s+[^>]*href="([^"]+)"[^>]*id="([^"]+)"[^>]*>/gi;
      while ((match = itemRegex2.exec(opfText)) !== null) {
        manifestItems[match[2]] = match[1];
      }

      // Parse spine itemrefs in order
      const spineIdrefs: string[] = [];
      const spineRegex = /<itemref\s+[^>]*idref="([^"]+)"[^>]*>/gi;
      while ((match = spineRegex.exec(opfText)) !== null) {
        spineIdrefs.push(match[1]);
      }

      for (const idref of spineIdrefs) {
        const href = manifestItems[idref];
        if (href) {
          const fullHtmlPath = opfDir + href;
          // URL decode path
          const cleanPath = decodeURIComponent(fullHtmlPath);
          const zipFile = loadedZip.file(cleanPath) || loadedZip.file(fullHtmlPath);
          if (zipFile) {
            const htmlText = await zipFile.async('text');
            htmlContentParts.push(htmlText);
          }
        }
      }
    } catch (err) {
      console.warn('Failed parsing EPUB OPF spine, falling back to direct html extraction', err);
    }
  }

  // Fallback if OPF spine extraction produced no text parts
  if (htmlContentParts.length === 0) {
    const htmlFiles: string[] = [];
    loadedZip.forEach((relativePath) => {
      if (/\.(xhtml|html|htm)$/i.test(relativePath) && !relativePath.includes('toc.xhtml') && !relativePath.includes('nav.xhtml')) {
        htmlFiles.push(relativePath);
      }
    });

    htmlFiles.sort(); // Natural order

    for (const filePath of htmlFiles) {
      const zipFile = loadedZip.file(filePath);
      if (zipFile) {
        const htmlText = await zipFile.async('text');
        htmlContentParts.push(htmlText);
      }
    }
  }

  if (htmlContentParts.length === 0) {
    throw new Error('Không thể tìm thấy nội dung văn bản trong file EPUB này.');
  }

  // Convert HTML markup to clean plain text
  const fullRawHtml = htmlContentParts.join('\n\n');
  return stripHtmlToPlainText(fullRawHtml);
}

/**
 * Helper to strip HTML tags and decode common entities
 */
function stripHtmlToPlainText(html: string): string {
  // Remove script and style tags
  let text = html.replace(/<script\b[^<]*>([\s\S]*?)<\/script>/gi, '');
  text = text.replace(/<style\b[^<]*>([\s\S]*?)<\/style>/gi, '');

  // Replace block tags with newlines
  text = text.replace(/<\/(p|div|h1|h2|h3|h4|h5|h6|li|tr|blockquote|section|article)>/gi, '\n');
  text = text.replace(/<br\s*\/?>/gi, '\n');

  // Strip all remaining HTML tags
  text = text.replace(/<[^>]+>/g, '');

  // Decode common HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');

  // Clean up whitespace & line breaks
  text = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join('\n\n');

  return text;
}
