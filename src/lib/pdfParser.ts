import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

export interface ParsedParagraph {
  text: string;
  format?: 'centered' | 'large' | 'medium' | 'spacer';
}

export async function extractTextFromPdf(file: File): Promise<{ title: string; paragraphs: string[]; formattedParagraphs: ParsedParagraph[]; pageCount: number }> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const formattedParagraphs: ParsedParagraph[] = [];
  const totalPages = pdf.numPages;

  for (let i = 1; i <= totalPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const viewport = page.getViewport({ scale: 1 });
    const pageWidth = viewport.width;

    // Group items by Y position (lines)
    const lines: { y: number; items: any[]; text: string }[] = [];
    let currentLine: { y: number; items: any[]; text: string } | null = null;

    for (const item of textContent.items) {
      if (!('str' in item) || !item.str.trim()) continue;
      const y = Math.round((item as any).transform[5]);
      const fontSize = Math.abs((item as any).transform[0]);

      if (!currentLine || Math.abs(y - currentLine.y) > 3) {
        if (currentLine && currentLine.text.trim()) {
          lines.push(currentLine);
        }
        currentLine = { y, items: [{ ...item, fontSize }], text: item.str };
      } else {
        currentLine.items.push({ ...item, fontSize });
        currentLine.text += item.str;
      }
    }
    if (currentLine && currentLine.text.trim()) {
      lines.push(currentLine);
    }

    // Detect formatting for first few pages (title pages)
    const isEarlyPage = i <= 5;

    // Group lines into paragraphs (gap between lines > threshold)
    let paraLines: typeof lines = [];
    let lastY: number | null = null;

    const flushParagraph = () => {
      if (paraLines.length === 0) return;
      const text = paraLines.map(l => l.text).join(' ').trim();
      if (!text) {
        formattedParagraphs.push({ text: '', format: 'spacer' });
        paraLines = [];
        return;
      }

      let format: ParsedParagraph['format'] = undefined;

      if (isEarlyPage) {
        // Check if text is centered (average x position near middle)
        const avgFontSize = paraLines.reduce((sum, l) =>
          sum + l.items.reduce((s, it) => s + (it.fontSize || 12), 0) / l.items.length, 0
        ) / paraLines.length;

        // Check centering by looking at the first item x position
        const firstItem = paraLines[0].items[0];
        const x = (firstItem as any).transform?.[4] || 0;
        const textWidth = paraLines[0].items.reduce((w: number, it: any) => w + (it.width || 0), 0);
        const leftMargin = x;
        const rightMargin = pageWidth - (x + textWidth);
        const isCentered = Math.abs(leftMargin - rightMargin) < pageWidth * 0.15 && leftMargin > pageWidth * 0.15;

        if (avgFontSize > 16) format = 'large';
        else if (avgFontSize > 13) format = 'medium';

        if (isCentered && !format) format = 'centered';
        else if (isCentered && format) format = format; // keep large/medium
      }

      formattedParagraphs.push({ text, format });
      paraLines = [];
    };

    for (const line of lines) {
      if (lastY !== null && Math.abs(line.y - lastY) > 20) {
        flushParagraph();
        // Add spacer for large gaps
        if (Math.abs(line.y - lastY) > 40) {
          formattedParagraphs.push({ text: '', format: 'spacer' });
        }
      }
      paraLines.push(line);
      lastY = line.y;
    }
    flushParagraph();

    // Page break spacer
    if (i < totalPages) {
      formattedParagraphs.push({ text: '', format: 'spacer' });
    }
  }

  const title = file.name.replace(/\.pdf$/i, '').replace(/[_-]/g, ' ');
  const paragraphs = formattedParagraphs.map(p => p.text);

  return { title, paragraphs, formattedParagraphs };
}
