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

export interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl: string | null;
  content: string[];  // paragraphs
  highlights: Highlight[];
  bookmarks: Bookmark[];
  lastReadParagraph: number;
  lastReadAt: number;
  addedAt: number;
  totalParagraphs: number;
}
