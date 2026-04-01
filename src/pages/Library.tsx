import { useState, useRef } from 'react';
import { Plus, BookOpen, BookMarked, BookCheck, Library as LibraryIcon, Search, Upload } from 'lucide-react';
import { Book, ReadingStatus } from '@/types/book';
import { getAllBooks, saveBook, deleteBook } from '@/lib/bookStorage';
import { extractTextFromPdf } from '@/lib/pdfParser';
import { useNavigate } from 'react-router-dom';
import BookCard from '@/components/BookCard';
import EditBookDialog from '@/components/EditBookDialog';
import BookDiscovery from '@/components/BookDiscovery';
import GoodreadsImport from '@/components/GoodreadsImport';
import { useToast } from '@/hooks/use-toast';

const tabs: { key: ReadingStatus | 'all'; label: string; icon: React.ReactNode }[] = [
  { key: 'all', label: 'All', icon: <LibraryIcon className="h-4 w-4" /> },
  { key: 'want-to-read', label: 'Want to Read', icon: <BookMarked className="h-4 w-4" /> },
  { key: 'reading', label: 'Reading', icon: <BookOpen className="h-4 w-4" /> },
  { key: 'read', label: 'Read', icon: <BookCheck className="h-4 w-4" /> },
];

type ViewMode = 'library' | 'discover' | 'import';

const Library = () => {
  const [books, setBooks] = useState<Book[]>(() => getAllBooks());
  const [loading, setLoading] = useState(false);
  const [editBook, setEditBook] = useState<Book | null>(null);
  const [activeTab, setActiveTab] = useState<ReadingStatus | 'all'>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('library');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      toast({ title: 'Invalid file', description: 'Please upload a PDF file', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const { title, paragraphs, formattedParagraphs } = await extractTextFromPdf(file);
      const book: Book = {
        id: crypto.randomUUID(),
        title,
        author: 'Unknown Author',
        coverUrl: null,
        content: paragraphs,
        paragraphFormats: formattedParagraphs.map(p => ({ format: p.format })),
        highlights: [],
        bookmarks: [],
        lastReadParagraph: 0,
        lastReadAt: Date.now(),
        addedAt: Date.now(),
        totalParagraphs: paragraphs.length,
        readingStatus: 'want-to-read',
      };
      saveBook(book);
      setBooks(getAllBooks());
      toast({ title: 'Book added!', description: `"${title}" has been added to your library` });
    } catch {
      toast({ title: 'Error', description: 'Failed to process PDF file', variant: 'destructive' });
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = (id: string) => {
    deleteBook(id);
    setBooks(getAllBooks());
    toast({ title: 'Book removed' });
  };

  const handleEditSave = () => {
    setBooks(getAllBooks());
    setEditBook(null);
  };

  const handleStatusChange = (bookId: string, status: ReadingStatus) => {
    const b = books.find(x => x.id === bookId);
    if (b) {
      b.readingStatus = status;
      saveBook(b);
      setBooks(getAllBooks());
    }
  };

  const handleImportFromOpenLibrary = (title: string, author: string, coverUrl: string | null) => {
    const book: Book = {
      id: crypto.randomUUID(),
      title,
      author,
      coverUrl,
      content: [],
      highlights: [],
      bookmarks: [],
      lastReadParagraph: 0,
      lastReadAt: Date.now(),
      addedAt: Date.now(),
      totalParagraphs: 0,
      readingStatus: 'want-to-read',
    };
    saveBook(book);
    setBooks(getAllBooks());
    toast({ title: 'Book added!', description: `"${title}" added to your library` });
  };

  const handleGoodreadsImport = (entries: { title: string; author: string; readingStatus: ReadingStatus }[]) => {
    let added = 0;
    for (const entry of entries) {
      // Skip duplicates
      if (books.some(b => b.title.toLowerCase() === entry.title.toLowerCase())) continue;
      const book: Book = {
        id: crypto.randomUUID(),
        title: entry.title,
        author: entry.author,
        coverUrl: null,
        content: [],
        highlights: [],
        bookmarks: [],
        lastReadParagraph: 0,
        lastReadAt: Date.now(),
        addedAt: Date.now(),
        totalParagraphs: 0,
        readingStatus: entry.readingStatus,
      };
      saveBook(book);
      added++;
    }
    setBooks(getAllBooks());
    toast({ title: 'Import complete!', description: `${added} books imported (${entries.length - added} duplicates skipped)` });
    setViewMode('library');
  };

  const filteredBooks = activeTab === 'all'
    ? books
    : books.filter(b => b.readingStatus === activeTab);

  const sortedBooks = [...filteredBooks].sort((a, b) => b.lastReadAt - a.lastReadAt);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-card/80 backdrop-blur-lg">
        <div className="mx-auto max-w-4xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-semibold text-foreground">My Library</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode(viewMode === 'discover' ? 'library' : 'discover')}
              className={`rounded-full p-2 transition-colors ${viewMode === 'discover' ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary text-muted-foreground'}`}
              title="Discover books"
            >
              <Search className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode(viewMode === 'import' ? 'library' : 'import')}
              className={`rounded-full p-2 transition-colors ${viewMode === 'import' ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary text-muted-foreground'}`}
              title="Import from Goodreads"
            >
              <Upload className="h-4 w-4" />
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-md transition-all hover:shadow-lg active:scale-95 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              {loading ? 'Processing...' : 'Add PDF'}
            </button>
          </div>
          <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={handleFileUpload} />
        </div>
        {viewMode === 'library' && (
          <div className="mx-auto max-w-4xl px-4 pb-2 flex gap-1 overflow-x-auto scrollbar-none">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">
        {viewMode === 'discover' && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-3">Discover Books</h2>
            <p className="text-sm text-muted-foreground mb-4">Search Open Library for free public domain books and add them to your library.</p>
            <BookDiscovery onImportBook={handleImportFromOpenLibrary} />
          </div>
        )}

        {viewMode === 'import' && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-3">Import from Goodreads</h2>
            <p className="text-sm text-muted-foreground mb-4">Export your Goodreads library as CSV and import book metadata & reading status.</p>
            <GoodreadsImport onImport={handleGoodreadsImport} />
          </div>
        )}

        {viewMode === 'library' && (
          <>
            {sortedBooks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="mb-4 rounded-full bg-secondary p-6">
                  <BookOpen className="h-12 w-12 text-muted-foreground" />
                </div>
                <h2 className="text-lg font-medium text-foreground mb-2">
                  {activeTab === 'all' ? 'Your library is empty' : `No books in "${tabs.find(t => t.key === activeTab)?.label}"`}
                </h2>
                <p className="text-sm text-muted-foreground mb-6 max-w-xs">
                  Upload a PDF, search Open Library, or import from Goodreads to get started.
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-md"
                >
                  Upload your first book
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {sortedBooks.map(book => (
                  <BookCard
                    key={book.id}
                    book={book}
                    onRead={() => navigate(`/read/${book.id}`)}
                    onEdit={() => setEditBook(book)}
                    onDelete={() => handleDelete(book.id)}
                    onStatusChange={(status) => handleStatusChange(book.id, status)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {editBook && (
        <EditBookDialog book={editBook} onClose={() => setEditBook(null)} onSave={handleEditSave} />
      )}
    </div>
  );
};

export default Library;
