import { Book, Highlight, Bookmark } from '@/types/book';

const BOOKS_KEY = 'ebook-reader-books';

export function getAllBooks(): Book[] {
  const data = localStorage.getItem(BOOKS_KEY);
  return data ? JSON.parse(data) : [];
}

export function getBook(id: string): Book | undefined {
  return getAllBooks().find(b => b.id === id);
}

export function saveBook(book: Book): void {
  const books = getAllBooks();
  const idx = books.findIndex(b => b.id === book.id);
  if (idx >= 0) books[idx] = book;
  else books.push(book);
  localStorage.setItem(BOOKS_KEY, JSON.stringify(books));
}

export function deleteBook(id: string): void {
  const books = getAllBooks().filter(b => b.id !== id);
  localStorage.setItem(BOOKS_KEY, JSON.stringify(books));
}

export function updateReadingPosition(id: string, paragraphIndex: number): void {
  const book = getBook(id);
  if (book) {
    book.lastReadParagraph = paragraphIndex;
    book.lastReadAt = Date.now();
    saveBook(book);
  }
}

export function addHighlight(bookId: string, highlight: Highlight): void {
  const book = getBook(bookId);
  if (book) {
    book.highlights.push(highlight);
    saveBook(book);
  }
}

export function removeHighlight(bookId: string, highlightId: string): void {
  const book = getBook(bookId);
  if (book) {
    book.highlights = book.highlights.filter(h => h.id !== highlightId);
    saveBook(book);
  }
}

export function addBookmark(bookId: string, bookmark: Bookmark): void {
  const book = getBook(bookId);
  if (book) {
    book.bookmarks.push(bookmark);
    saveBook(book);
  }
}

export function removeBookmark(bookId: string, bookmarkId: string): void {
  const book = getBook(bookId);
  if (book) {
    book.bookmarks = book.bookmarks.filter(b => b.id !== bookmarkId);
    saveBook(book);
  }
}

export function updateBookMeta(id: string, meta: { title?: string; author?: string; coverUrl?: string | null }): void {
  const book = getBook(id);
  if (book) {
    if (meta.title !== undefined) book.title = meta.title;
    if (meta.author !== undefined) book.author = meta.author;
    if (meta.coverUrl !== undefined) book.coverUrl = meta.coverUrl;
    saveBook(book);
  }
}
