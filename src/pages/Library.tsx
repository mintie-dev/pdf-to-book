import { useState, useRef } from 'react';
import { Plus, BookOpen, BookMarked, BookCheck, Library as LibraryIcon, Search, Upload, Menu } from 'lucide-react';
import { Book, ReadingStatus } from '@/types/book';
import { getAllBooks, saveBook, deleteBook } from '@/lib/bookStorage';
import { extractTextFromPdf } from '@/lib/pdfParser';
import { useNavigate } from 'react-router-dom';
import BookCard from '@/components/BookCard';
import EditBookDialog from '@/components/EditBookDialog';
import BookDiscovery from '@/components/BookDiscovery';
import GoodreadsImport from '@/components/GoodreadsImport';
import LibraryMenu from '@/components/LibraryMenu';
import { toast } from 'sonner';

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
  const [menuOpen, setMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file');
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
      toast.success(`"${title}" added to your library`, { duration: 3000 });
    } catch {
      toast.error('Failed to process PDF file');
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = (id: string) => {
    deleteBook(id);
    setBooks(getAllBooks());
    toast('Book removed', { duration: 3000 });
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

  const handleTogglePin = (bookId: string) => {
    const b = books.find(x => x.id === bookId);
    if (!b) return;
    const pinnedCount = books.filter(x => x.pinned && x.id !== bookId).length;
    if (!b.pinned && pinnedCount >= 3) {
      toast.error('You can pin up to 3 books', { duration: 3000 });
      return;
    }
    b.pinned = !b.pinned;
    saveBook(b);
    setBooks(getAllBooks());
  };

  const handleImportFromOpenLibrary = (title: string, author: string, coverUrl: string | null, content?: string[]) => {
    const book: Book = {
      id: crypto.randomUUID(),
      title,
      author,
      coverUrl,
      content: content || [],
      highlights: [],
      bookmarks: [],
      lastReadParagraph: 0,
      lastReadAt: Date.now(),
      addedAt: Date.now(),
      totalParagraphs: content?.length || 0,
      readingStatus: 'want-to-read',
    };
    saveBook(book);
    setBooks(getAllBooks());
  };

  const handleGoodreadsImport = (entries: { title: string; author: string; readingStatus: ReadingStatus }[]) => {
    let added = 0;
    for (const entry of entries) {
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
    toast.success(`${added} books imported (${entries.length - added} duplicates skipped)`, { duration: 3000 });
    setViewMode('library');
  };

  const filteredBooks = activeTab === 'all'
    ? books
    : books.filter(b => b.readingStatus === activeTab);

  const pinnedCount = books.filter(b => b.pinned).length;

  const sortedBooks = [...filteredBooks].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return b.lastReadAt - a.lastReadAt;
  });

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      <header className="sticky top-0 z-10 border-b border-border bg-card/80 backdrop-blur-lg transition-colors duration-300">
        <div className="mx-auto max-w-4xl px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => setViewMode('library')}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity active:scale-95"
          >
            <BookOpen className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-semibold text-foreground">My Library</h1>
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={cycleTheme}
              className="rounded-full p-2 hover:bg-secondary text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-105"
              title={`Theme: ${theme}`}
            >
              {themeIcons[theme]}
            </button>
            <button
              onClick={() => setViewMode(viewMode === 'discover' ? 'library' : 'discover')}
              className={`rounded-full p-2 transition-all duration-200 ${viewMode === 'discover' ? 'bg-primary text-primary-foreground scale-110' : 'hover:bg-secondary text-muted-foreground hover:scale-105'}`}
              title="Discover books"
            >
              <Search className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode(viewMode === 'import' ? 'library' : 'import')}
              className={`rounded-full p-2 transition-all duration-200 ${viewMode === 'import' ? 'bg-primary text-primary-foreground scale-110' : 'hover:bg-secondary text-muted-foreground hover:scale-105'}`}
              title="Import from Goodreads"
            >
              <Upload className="h-4 w-4" />
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
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                  activeTab === tab.key
                    ? 'bg-primary text-primary-foreground scale-105'
                    : 'bg-secondary text-muted-foreground hover:text-foreground hover:scale-105'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 pb-24">
        {viewMode === 'discover' && (
          <div className="mb-6 animate-[fade-in_0.3s_ease-out]">
            <h2 className="text-lg font-semibold text-foreground mb-3">Discover Books</h2>
            <p className="text-sm text-muted-foreground mb-2">Search Open Library for free public domain books and add them to your library.</p>
            <p className="text-xs text-muted-foreground/70 mb-4 italic">⚠️ Not all books have free content available. Books without content will be added to "Want to Read" — you can upload a PDF later.</p>
            <BookDiscovery onImportBook={handleImportFromOpenLibrary} />
          </div>
        )}

        {viewMode === 'import' && (
          <div className="mb-6 animate-[fade-in_0.3s_ease-out]">
            <h2 className="text-lg font-semibold text-foreground mb-3">Import from Goodreads</h2>
            <p className="text-sm text-muted-foreground mb-4">Export your Goodreads library as CSV and import book metadata & reading status.</p>
            <GoodreadsImport onImport={handleGoodreadsImport} />
          </div>
        )}

        {viewMode === 'library' && (
          <>
            {sortedBooks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center animate-[fade-in_0.4s_ease-out]">
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
                  className="rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-md transition-all hover:shadow-lg hover:scale-105 active:scale-95"
                >
                  Upload your first book
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {sortedBooks.map((book, i) => (
                  <div
                    key={book.id}
                    className="animate-[fade-in_0.3s_ease-out]"
                    style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'both' }}
                  >
                    <BookCard
                      book={book}
                      onRead={() => navigate(`/read/${book.id}`)}
                      onEdit={() => setEditBook(book)}
                      onDelete={() => handleDelete(book.id)}
                      onStatusChange={(status) => handleStatusChange(book.id, status)}
                      onTogglePin={() => handleTogglePin(book.id)}
                      canPin={book.pinned || pinnedCount < 3}
                      onBookUpdated={() => setBooks(getAllBooks())}
                    />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-20">
        <button
          onClick={() => {
            if (fabExpanded) {
              fileInputRef.current?.click();
            }
            setFabExpanded(!fabExpanded);
          }}
          onMouseEnter={() => setFabExpanded(true)}
          onMouseLeave={() => setFabExpanded(false)}
          disabled={loading}
          className={`flex items-center gap-2 rounded-full bg-primary text-primary-foreground shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 active:scale-95 disabled:opacity-50 ${
            fabExpanded ? 'px-5 py-3.5' : 'p-3.5'
          }`}
        >
          <Plus className={`h-5 w-5 transition-transform duration-300 ${fabExpanded ? 'rotate-0' : 'rotate-0'}`} />
          <span className={`text-sm font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ${fabExpanded ? 'max-w-[100px] opacity-100' : 'max-w-0 opacity-0'}`}>
            {loading ? 'Processing...' : 'Add PDF'}
          </span>
        </button>
      </div>

      {editBook && (
        <EditBookDialog book={editBook} onClose={() => setEditBook(null)} onSave={handleEditSave} />
      )}
    </div>
  );
};

export default Library;
