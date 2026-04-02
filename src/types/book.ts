export interface Highlight {
  id: string;
  text: string;
  color: 'yellow' | 'blue' | 'pink' | 'green';
  paragraphIndex: number;
  startOffset: number;
  endOffset: number;
  createdAt: number;
}

export interface Bookmark {
  id: string;
  paragraphIndex: number;
  label: string;
  createdAt: number;
}

export type ReadingStatus = 'want-to-read' | 'reading' | 'read';

export type ReaderTheme = 'light' | 'dark' | 'warm-blush';

export interface ParagraphFormat {
  format?: 'centered' | 'large' | 'medium' | 'spacer';
}

export interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl: string | null;
  content: string[];  // paragraphs
  paragraphFormats?: ParagraphFormat[];
  highlights: Highlight[];
  bookmarks: Bookmark[];
  lastReadParagraph: number;
  lastReadAt: number;
  addedAt: number;
  totalParagraphs: number;
  totalPages?: number;  // actual PDF page count
  readingStatus: ReadingStatus;
  pinned?: boolean;
}
