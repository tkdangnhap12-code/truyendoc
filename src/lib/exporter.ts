import JSZip from 'jszip';
import { Story } from '../types';

// Helper to trigger browser download
const downloadFile = (content: string | Blob, fileName: string, contentType: string) => {
  const blob = typeof content === 'string' ? new Blob([content], { type: contentType }) : content;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Automatically cleans up strange symbols, markdown artifacts, code residues,
 * AI tokens, control characters, and formats text into clean, professional novel paragraphs.
 */
export const cleanNovelText = (rawText: string): string => {
  if (!rawText) return '';

  let cleaned = rawText;

  // 1. Remove zero-width spaces, byte order marks, special control characters & non-printable ASCII
  cleaned = cleaned.replace(/[\u200B-\u200D\uFEFF\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '');

  // 2. Remove code blocks ``` or `
  cleaned = cleaned.replace(/```[\s\S]*?```/g, '');
  cleaned = cleaned.replace(/`/g, '');

  // 3. Remove horizontal divider lines (---, ***, ___)
  cleaned = cleaned.replace(/^[\s\t]*[-*_]{3,}[\s\t]*$/gm, '');

  // 4. Remove Markdown headers (#, ##, ###) at line start
  cleaned = cleaned.replace(/^[\s\t]*#{1,6}\s+/gm, '');

  // 5. Remove Markdown bold/italic tags (**text** -> text, *text* -> text, __text__ -> text, _text_ -> text)
  cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, '$1');
  cleaned = cleaned.replace(/\*([^*]+)\*/g, '$1');
  cleaned = cleaned.replace(/__([^_]+)__/g, '$1');
  cleaned = cleaned.replace(/_([^_]+)_/g, '$1');

  // 6. Remove raw HTML tags
  cleaned = cleaned.replace(/<\/?[^>]+(>|$)/g, '');

  // 7. Remove bullet markers at line start (* or +)
  cleaned = cleaned.replace(/^[\s\t]*[*+]\s+/gm, '');

  // 8. Strip system prompt residues, AI notes, and author notes like [Lời tác giả: ...], [Ghi chú: ...], [Chương ...], (Còn tiếp)
  cleaned = cleaned.replace(/\[\s*(lời tác giả|ghi chú|note|tóm tắt|hết chương|xem thêm|dàn ý|bộ nhớ)[^\]]*\]/gi, '');
  cleaned = cleaned.replace(/\(\s*(còn tiếp|hết|to be continued)[^)]*\)/gi, '');

  // 9. Process lines, normalize dialogue dashes and paragraph formatting
  const lines = cleaned.split(/\r?\n/);
  const formattedLines: string[] = [];

  for (let line of lines) {
    let trimmed = line.trim();

    // Replace multiple consecutive spaces or tabs
    trimmed = trimmed.replace(/[ \t]+/g, ' ');

    if (!trimmed) continue;

    // Convert standard hyphens or bullet dashes at start of line to standard em-dash for professional Vietnamese dialogue
    if (/^[-–]\s*/.test(trimmed)) {
      trimmed = trimmed.replace(/^[-–]\s*/, '— ');
    }

    formattedLines.push(trimmed);
  }

  return formattedLines.join('\n\n');
};

export const cleanTitle = (rawTitle: string): string => {
  if (!rawTitle) return '';
  let cleaned = rawTitle
    .replace(/^[\s\t]*#{1,6}\s+/, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/[`_]/g, '')
    .trim();

  if (cleaned.toLowerCase().includes('diễn biến kịch tính')) {
    cleaned = cleaned.replace(/[:\s\-]*diễn biến kịch tính.*/i, '').trim();
  }
  return cleaned;
};

export const getCleanParagraphs = (rawText: string): string[] => {
  const cleaned = cleanNovelText(rawText);
  return cleaned.split('\n\n').filter((p) => p.trim().length > 0);
};

export const exportToTXT = (story: Story) => {
  const title = cleanTitle(story.title);
  const author = cleanTitle(story.author || 'Văn Nhân AI');
  const pitch = cleanNovelText(story.pitch);

  let text = `==================================================\n`;
  text += `${title.toUpperCase()}\n`;
  text += `Tác giả: ${author}\n`;
  text += `Thể loại: ${story.genres.join(', ')}\n`;
  text += `==================================================\n\n`;
  if (pitch) {
    text += `TÓM TẮT:\n${pitch}\n\n`;
  }
  text += `MỤC LỤC:\n`;
  story.chapters.forEach((ch, idx) => {
    const chTitle = cleanTitle(ch.title);
    text += `${idx + 1}. ${chTitle}\n`;
  });
  text += `\n==================================================\n\n`;

  story.chapters.forEach((ch, idx) => {
    const chTitle = cleanTitle(ch.title);
    const paragraphs = getCleanParagraphs(ch.content);
    text += `\n\n--- CHƯƠNG ${idx + 1}: ${chTitle.toUpperCase()} ---\n\n`;
    text += paragraphs.join('\n\n');
    text += `\n\n`;
  });

  downloadFile(text, `${sanitizeFileName(title)}.txt`, 'text/plain;charset=utf-8');
};

export const exportToMarkdown = (story: Story) => {
  const title = cleanTitle(story.title);
  const author = cleanTitle(story.author || 'Văn Nhân AI');
  const pitch = cleanNovelText(story.pitch);

  let md = `# ${title}\n\n`;
  md += `**Tác giả:** ${author}  \n`;
  md += `**Thể loại:** ${story.genres.join(', ')}  \n`;
  if (story.targetTone) {
    md += `**Tông giọng:** ${story.targetTone}  \n`;
  }
  md += `\n> **Tóm tắt cốt truyện:**  \n> ${pitch.replace(/\n\n/g, '\n> ')}\n\n`;
  md += `---\n\n## Mục Lục\n\n`;
  story.chapters.forEach((ch, idx) => {
    const chTitle = cleanTitle(ch.title);
    md += `- [Chương ${idx + 1}: ${chTitle}](#chuong-${idx + 1})\n`;
  });
  md += `\n---\n\n`;

  story.chapters.forEach((ch, idx) => {
    const chTitle = cleanTitle(ch.title);
    const paragraphs = getCleanParagraphs(ch.content);

    md += `<a id="chuong-${idx + 1}"></a>\n\n`;
    md += `## Chương ${idx + 1}: ${chTitle}\n\n`;
    md += `${paragraphs.join('\n\n')}\n\n`;
    md += `---\n\n`;
  });

  downloadFile(md, `${sanitizeFileName(title)}.md`, 'text/markdown;charset=utf-8');
};

export const exportToDOCX = (story: Story) => {
  const title = cleanTitle(story.title);
  const author = cleanTitle(story.author || 'Văn Nhân AI');
  const pitch = cleanNovelText(story.pitch);

  const chaptersHtml = story.chapters
    .map((ch, idx) => {
      const chTitle = cleanTitle(ch.title);
      const paragraphs = getCleanParagraphs(ch.content);

      return `
      <div style="page-break-before: always; margin-top: 40px;">
        <h2 style="color: #0f172a; font-family: 'Times New Roman', serif; font-size: 18pt; border-bottom: 2px solid #10b981; padding-bottom: 8px; margin-bottom: 24px;">
          Chương ${idx + 1}: ${escapeHtml(chTitle)}
        </h2>
        <div style="font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.8; text-align: justify; color: #1e293b;">
          ${paragraphs
            .map((p) => `<p style="text-indent: 2em; margin-bottom: 14px; text-align: justify;">${escapeHtml(p)}</p>`)
            .join('')}
        </div>
      </div>
    `;
    })
    .join('');

  const docxContent = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset="utf-8">
      <title>${escapeHtml(title)}</title>
      <style>
        body { font-family: 'Times New Roman', serif; margin: 1in; color: #1e293b; }
        h1 { font-size: 28pt; text-align: center; margin-top: 100px; color: #0f172a; }
        .author { text-align: center; font-size: 16pt; color: #64748b; margin-top: 20px; }
        .pitch { margin: 40px auto; width: 85%; font-style: italic; background: #f8fafc; padding: 20px; border-left: 4px solid #10b981; line-height: 1.6; }
        .toc { margin-top: 60px; font-size: 12pt; }
        .toc-item { margin-bottom: 8px; border-bottom: 1px dotted #cbd5e1; }
      </style>
    </head>
    <body>
      <div style="text-align: center; page-break-after: always;">
        <h1 style="font-size: 32pt; margin-top: 150px;">${escapeHtml(title)}</h1>
        <p class="author">Tác giả: ${escapeHtml(author)}</p>
        <p style="color: #475569; font-size: 12pt;">Thể loại: ${escapeHtml(story.genres.join(', '))}</p>
        ${
          pitch
            ? `<div class="pitch">
          <strong>Tóm tắt tác phẩm:</strong><br/>
          ${escapeHtml(pitch)}
        </div>`
            : ''
        }
      </div>

      <div style="page-break-after: always;">
        <h2 style="font-size: 18pt; border-bottom: 2px solid #000; padding-bottom: 5px;">MỤC LỤC</h2>
        <div class="toc">
          ${story.chapters
            .map((ch, idx) => {
              const chTitle = cleanTitle(ch.title);
              return `
            <div class="toc-item">
              <span>Chương ${idx + 1}: ${escapeHtml(chTitle)}</span>
            </div>
          `;
            })
            .join('')}
        </div>
      </div>

      ${chaptersHtml}
    </body>
    </html>
  `;

  downloadFile(docxContent, `${sanitizeFileName(title)}.docx`, 'application/msword');
};

export const exportToEPUB = async (story: Story) => {
  try {
    const zip = new JSZip();
    const title = cleanTitle(story.title || 'Tác Phẩm Chưa Đặt Tên');
    const author = cleanTitle(story.author || 'Văn Nhân AI');
    const pitch = cleanNovelText(story.pitch);

    // Helper for XML escaping and control char stripping
    const escapeXml = (str: string) => {
      if (!str) return '';
      const sanitized = str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F]/g, '');
      return sanitized
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    };

    // Ensure at least 1 chapter exists
    const chaptersToExport = story.chapters && story.chapters.length > 0 ? story.chapters : [
      {
        id: 'default-ch-1',
        chapterNumber: 1,
        title: 'Chương 1',
        content: 'Nội dung truyện đang được sáng tác...',
        wordCount: 6,
        createdAt: new Date().toISOString(),
      }
    ];

    // 1. mimetype file (MUST be uncompressed)
    zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });

    // 2. META-INF/container.xml
    const containerXml = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;
    zip.folder('META-INF')?.file('container.xml', containerXml);

    const oebps = zip.folder('OEBPS');
    if (!oebps) throw new Error('Không thể khởi tạo thư mục OEBPS trong file EPUB.');

    const rawId = (story.id || 'epub-' + Date.now()).replace(/[^a-zA-Z0-9_-]/g, '');
    const bookUuid = `urn:uuid:${rawId}`;
    const isoDate = new Date().toISOString().replace(/\.\d+Z$/, 'Z');

    // 3. OEBPS/style.css
    const cssContent = `
body {
  font-family: Georgia, "Times New Roman", serif;
  line-height: 1.8;
  color: #1a1a1a;
  margin: 1.2em;
}
h1, h2, h3 {
  font-family: serif;
  color: #0f172a;
  text-align: center;
}
h1.title {
  margin-top: 2.5em;
  font-size: 2.2em;
}
p.author {
  text-align: center;
  font-style: italic;
  color: #475569;
  font-size: 1.1em;
}
p.meta {
  text-align: center;
  font-size: 0.9em;
  color: #64748b;
}
.cover-page {
  text-align: center;
}
.summary {
  margin-top: 2em;
  text-align: justify;
  background-color: #f8fafc;
  padding: 1.2em;
  border-left: 4px solid #10b981;
}
p {
  text-indent: 1.8em;
  margin-bottom: 0.8em;
  text-align: justify;
}
`;
    oebps.file('style.css', cssContent);

    // 4. OEBPS/cover.xhtml
    const coverXhtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="vi" xml:lang="vi">
<head>
  <title>${escapeXml(title)}</title>
  <link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body>
  <div class="cover-page">
    <h1 class="title">${escapeXml(title)}</h1>
    <p class="author">Tác giả: ${escapeXml(author)}</p>
    <p class="meta">Thể loại: ${escapeXml((story.genres || []).join(', '))}</p>
    <hr/>
    ${
      pitch
        ? `<div class="summary">
      <h3>Tóm tắt tác phẩm</h3>
      <p>${escapeXml(pitch)}</p>
    </div>`
        : ''
    }
  </div>
</body>
</html>`;
    oebps.file('cover.xhtml', coverXhtml);

    // 5. OEBPS/toc.xhtml (EPUB 3 navigation document)
    const tocXhtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="vi" xml:lang="vi">
<head>
  <title>Mục Lục</title>
  <link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body>
  <nav epub:type="toc" id="toc">
    <h1>MỤC LỤC</h1>
    <ol>
      <li><a href="cover.xhtml">Giới thiệu tác phẩm</a></li>
      ${chaptersToExport
        .map((ch, i) => {
          const chTitle = cleanTitle(ch.title || `Chương ${i + 1}`);
          return `<li><a href="chapter_${i + 1}.xhtml">Chương ${i + 1}: ${escapeXml(chTitle)}</a></li>`;
        })
        .join('\n      ')}
    </ol>
  </nav>
</body>
</html>`;
    oebps.file('toc.xhtml', tocXhtml);

    // 6. OEBPS/toc.ncx (EPUB 2 compatibility)
    const tocNcx = `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="${escapeXml(bookUuid)}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle>
    <text>${escapeXml(title)}</text>
  </docTitle>
  <navMap>
    <navPoint id="navPoint-cover" playOrder="1">
      <navLabel><text>Giới thiệu tác phẩm</text></navLabel>
      <content src="cover.xhtml"/>
    </navPoint>
    <navPoint id="navPoint-toc" playOrder="2">
      <navLabel><text>Mục Lục</text></navLabel>
      <content src="toc.xhtml"/>
    </navPoint>
    ${chaptersToExport
      .map((ch, i) => {
        const chTitle = cleanTitle(ch.title || `Chương ${i + 1}`);
        return `
    <navPoint id="navPoint-${i + 1}" playOrder="${i + 3}">
      <navLabel><text>Chương ${i + 1}: ${escapeXml(chTitle)}</text></navLabel>
      <content src="chapter_${i + 1}.xhtml"/>
    </navPoint>`;
      })
      .join('')}
  </navMap>
</ncx>`;
    oebps.file('toc.ncx', tocNcx);

    // 7. Chapters (OEBPS/chapter_1.xhtml, etc.)
    chaptersToExport.forEach((ch, idx) => {
      const chTitle = cleanTitle(ch.title || `Chương ${idx + 1}`);
      const paragraphs = getCleanParagraphs(ch.content || '');

      const chapterContentHtml = paragraphs.length > 0
        ? paragraphs.map((p) => `<p>${escapeXml(p)}</p>`).join('\n      ')
        : '<p><em>Chưa có nội dung cho chương này.</em></p>';

      const chapterXhtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="vi" xml:lang="vi">
<head>
  <title>Chương ${idx + 1}: ${escapeXml(chTitle)}</title>
  <link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body>
  <section class="chapter">
    <h2>Chương ${idx + 1}: ${escapeXml(chTitle)}</h2>
    ${chapterContentHtml}
  </section>
</body>
</html>`;
      oebps.file(`chapter_${idx + 1}.xhtml`, chapterXhtml);
    });

    // 8. OEBPS/content.opf
    const manifestItems = [
      `<item id="toc" href="toc.xhtml" media-type="application/xhtml+xml" properties="nav"/>`,
      `<item id="cover" href="cover.xhtml" media-type="application/xhtml+xml"/>`,
      `<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>`,
      `<item id="style" href="style.css" media-type="text/css"/>`,
      ...chaptersToExport.map(
        (_, i) => `<item id="ch_${i + 1}" href="chapter_${i + 1}.xhtml" media-type="application/xhtml+xml"/>`
      ),
    ];

    const spineItems = [
      `<itemref idref="cover"/>`,
      `<itemref idref="toc"/>`,
      ...chaptersToExport.map((_, i) => `<itemref idref="ch_${i + 1}"/>`),
    ];

    const contentOpf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>${escapeXml(title)}</dc:title>
    <dc:creator>${escapeXml(author)}</dc:creator>
    <dc:language>vi</dc:language>
    <dc:identifier id="BookId">${escapeXml(bookUuid)}</dc:identifier>
    <dc:description>${escapeXml(pitch)}</dc:description>
    <meta property="dcterms:modified">${isoDate}</meta>
  </metadata>
  <manifest>
    ${manifestItems.join('\n    ')}
  </manifest>
  <spine toc="ncx">
    ${spineItems.join('\n    ')}
  </spine>
</package>`;
    oebps.file('content.opf', contentOpf);

    // Generate zip blob and download
    const blob = await zip.generateAsync({
      type: 'blob',
      mimeType: 'application/epub+zip',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });
    downloadFile(blob, `${sanitizeFileName(title)}.epub`, 'application/epub+zip');
  } catch (err: any) {
    console.error('Lỗi khi tạo file EPUB:', err);
    alert(`Có lỗi xảy ra khi tạo file EPUB: ${err?.message || 'Lỗi hệ thống'}`);
  }
};

export const exportToPDFPrint = (story: Story) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const title = cleanTitle(story.title);
  const author = cleanTitle(story.author || 'Văn Nhân AI');
  const pitch = cleanNovelText(story.pitch);

  const pdfHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${escapeHtml(title)}</title>
      <style>
        @media print {
          @page { size: A4; margin: 20mm; }
          .page-break { page-break-before: always; }
        }
        body { font-family: 'Times New Roman', Georgia, serif; line-height: 1.8; color: #111827; margin: 0; padding: 40px; }
        .cover { text-align: center; margin-top: 120px; page-break-after: always; }
        .cover h1 { font-size: 32pt; margin-bottom: 20px; }
        .cover .author { font-size: 16pt; color: #4b5563; }
        .cover .pitch { margin: 40px auto; max-width: 600px; text-align: justify; font-style: italic; background: #f3f4f6; padding: 20px; border-radius: 8px; line-height: 1.6; }
        .toc { page-break-after: always; }
        .toc h2 { border-bottom: 2px solid #111827; padding-bottom: 8px; }
        .chapter { page-break-before: always; }
        .chapter h2 { font-size: 20pt; border-bottom: 1px solid #d1d5db; padding-bottom: 8px; margin-top: 40px; }
        p { text-indent: 2em; margin-bottom: 12px; text-align: justify; }
      </style>
    </head>
    <body>
      <div class="cover">
        <h1>${escapeHtml(title)}</h1>
        <div class="author">Tác giả: ${escapeHtml(author)}</div>
        <p style="color: #6b7280;">Thể loại: ${escapeHtml(story.genres.join(', '))}</p>
        ${
          pitch
            ? `<div class="pitch">
          <strong>Tóm tắt tác phẩm:</strong><br/>
          ${escapeHtml(pitch)}
        </div>`
            : ''
        }
      </div>

      <div class="toc">
        <h2>MỤC LỤC</h2>
        <ol style="font-size: 13pt; line-height: 2;">
          ${story.chapters
            .map((ch) => {
              const chTitle = cleanTitle(ch.title);
              return `<li>${escapeHtml(chTitle)}</li>`;
            })
            .join('')}
        </ol>
      </div>

      ${story.chapters
        .map((ch, idx) => {
          const chTitle = cleanTitle(ch.title);
          const paragraphs = getCleanParagraphs(ch.content);

          return `
        <div class="chapter">
          <h2>Chương ${idx + 1}: ${escapeHtml(chTitle)}</h2>
          ${paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join('')}
        </div>
      `;
        })
        .join('')}

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 500);
        }
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(pdfHtml);
  printWindow.document.close();
};

export const exportProjectJSON = (story: Story) => {
  const jsonContent = JSON.stringify(story, null, 2);
  downloadFile(jsonContent, `${sanitizeFileName(cleanTitle(story.title))}_Project.json`, 'application/json;charset=utf-8');
};

export const exportAllProjectsJSON = (stories: Story[]) => {
  const jsonContent = JSON.stringify(stories, null, 2);
  downloadFile(jsonContent, `Tat_Ca_Du_An_Truyen_Backup.json`, 'application/json;charset=utf-8');
};

export const readProjectJSONFile = (file: File): Promise<Story[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        let text = (e.target?.result as string) || '';
        // 1. Clean UTF-8 BOM and whitespace
        text = text.replace(/^\uFEFF/, '').trim();

        // 2. Strip Markdown code blocks if present (e.g. ```json ... ```)
        if (text.startsWith('```')) {
          text = text.replace(/^```[a-zA-Z]*\r?\n?/, '').replace(/\r?\n?```$/, '').trim();
        }

        let importedStories: any[] = [];
        let parseSuccess = false;

        try {
          const parsed = JSON.parse(text);
          parseSuccess = true;

          if (Array.isArray(parsed)) {
            importedStories = parsed;
          } else if (parsed && typeof parsed === 'object') {
            if (Array.isArray(parsed.stories)) {
              importedStories = parsed.stories;
            } else if (Array.isArray(parsed.projects)) {
              importedStories = parsed.projects;
            } else if (Array.isArray(parsed.data)) {
              importedStories = parsed.data;
            } else if (parsed.story && typeof parsed.story === 'object') {
              importedStories = [parsed.story];
            } else if (parsed.project && typeof parsed.project === 'object') {
              importedStories = [parsed.project];
            } else if (parsed.data && typeof parsed.data === 'object' && !Array.isArray(parsed.data)) {
              importedStories = [parsed.data];
            } else {
              // Standard single story object
              importedStories = [parsed];
            }
          }
        } catch (jsonErr) {
          parseSuccess = false;
        }

        // If JSON parsing failed or yielded empty list, treat as text/markdown story file
        if (!parseSuccess || importedStories.length === 0) {
          if (text.length > 0) {
            const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
            const fallbackStory: Story = {
              id: `story-imported-${Date.now()}`,
              title: fileNameWithoutExt || 'Tác Phẩm Mới Nhập',
              author: 'Tác giả',
              pitch: 'Tác phẩm được nhập từ file văn bản.',
              genres: ['Tự do'],
              targetTone: 'Kịch tính',
              lengthOption: 'Trung bình',
              worldRules: { setting: '', magicOrTech: '', historyAndFactions: '' },
              characters: [],
              relationships: [],
              outlineNodes: [],
              timeline: [],
              chapters: [
                {
                  id: `ch-imp-${Date.now()}`,
                  chapterNumber: 1,
                  title: 'Chương 1',
                  content: text,
                  summary: '',
                  wordCount: text.trim() ? text.trim().split(/\s+/).length : 0,
                  createdAt: new Date().toISOString(),
                },
              ],
              status: 'ongoing',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            resolve([fallbackStory]);
            return;
          } else {
            reject(new Error('File rỗng, không thể đọc nội dung.'));
            return;
          }
        }

        const sanitized: Story[] = importedStories.map((s, idx) => {
          const now = new Date().toISOString();
          const cleanTitleName = s.title || s.name || s.projectTitle || s.storyTitle || file.name.replace(/\.[^/.]+$/, '') || `Dự Án ${idx + 1}`;
          
          let chapters = Array.isArray(s.chapters)
            ? s.chapters.map((c: any, cIdx: number) => ({
                id: c.id || `ch-${Date.now()}-${cIdx}`,
                chapterNumber: c.chapterNumber || cIdx + 1,
                title: c.title || `Chương ${cIdx + 1}`,
                content: c.content || c.text || '',
                summary: c.summary || '',
                wordCount: typeof c.wordCount === 'number' ? c.wordCount : ((c.content || c.text || '').trim() ? (c.content || c.text || '').trim().split(/\s+/).length : 0),
                createdAt: c.createdAt || now,
              }))
            : [];

          if (chapters.length === 0 && (s.content || s.text)) {
            chapters = [
              {
                id: `ch-${Date.now()}-${idx}`,
                chapterNumber: 1,
                title: 'Chương 1',
                content: s.content || s.text || '',
                summary: '',
                wordCount: (s.content || s.text || '').trim() ? (s.content || s.text || '').trim().split(/\s+/).length : 0,
                createdAt: now,
              },
            ];
          }

          return {
            id: s.id || `story-imported-${Date.now()}-${idx}`,
            title: cleanTitleName,
            author: s.author || s.writer || '',
            pitch: s.pitch || s.summary || s.description || '',
            genres: Array.isArray(s.genres) ? s.genres : (typeof s.genres === 'string' ? [s.genres] : ['Tự do']),
            targetTone: s.targetTone || s.tone || 'Kịch tính',
            lengthOption: s.lengthOption || 'Trung bình',
            worldRules: s.worldRules || {
              setting: s.setting || '',
              magicOrTech: s.magicOrTech || '',
              historyAndFactions: s.history || '',
            },
            characters: Array.isArray(s.characters) ? s.characters : [],
            relationships: Array.isArray(s.relationships) ? s.relationships : [],
            outlineNodes: Array.isArray(s.outlineNodes) ? s.outlineNodes : (Array.isArray(s.outline) ? s.outline : []),
            timeline: Array.isArray(s.timeline) ? s.timeline : [],
            chapters: chapters,
            status: s.status === 'completed' ? 'completed' : 'ongoing',
            createdAt: s.createdAt || now,
            updatedAt: now,
          };
        });

        resolve(sanitized);
      } catch (err: any) {
        reject(new Error(`Lỗi khi xử lý file: ${err?.message || 'File không đúng định dạng.'}`));
      }
    };
    reader.onerror = () => reject(new Error('Không thể đọc file từ thiết bị.'));
    reader.readAsText(file);
  });
};

const sanitizeFileName = (name: string) => {
  return name.replace(/[^a-zA-Z0-9_a-zA-Z0-9ÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂẾỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪỬỮỰỲỴÝỶỸửữựỳỵỷỹ\s-]/g, '').trim().replace(/\s+/g, '_');
};

const escapeHtml = (str: string) => {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};
