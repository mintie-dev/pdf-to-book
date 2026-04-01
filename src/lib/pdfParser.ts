import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

export async function extractTextFromPdf(file: File): Promise<{ title: string; paragraphs: string[] }> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  const paragraphs: string[] = [];
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    
    let pageText = '';
    let lastY: number | null = null;
    
    for (const item of textContent.items) {
      if ('str' in item) {
        const y = (item as any).transform[5];
        if (lastY !== null && Math.abs(y - lastY) > 5) {
          // New line
          if (pageText.trim()) {
            pageText += '\n';
          }
        }
        pageText += item.str;
        lastY = y;
      }
    }
    
    // Split page text into paragraphs (by double newlines or significant gaps)
    const pageParagraphs = pageText
      .split(/\n\s*\n/)
      .map(p => p.replace(/\n/g, ' ').trim())
      .filter(p => p.length > 0);
    
    paragraphs.push(...pageParagraphs);
  }
  
  // Try to extract title from filename
  const title = file.name.replace(/\.pdf$/i, '').replace(/[_-]/g, ' ');
  
  return { title, paragraphs };
}
