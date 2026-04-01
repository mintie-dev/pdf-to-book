import { useState, useRef } from 'react';
import { Plus, BookOpen, Clock } from 'lucide-react';
import { Book } from '@/types/book';
import { getAllBooks, saveBook, deleteBook } from '@/lib/bookStorage';
import { extractTextFromPdf } from '@/lib/pdfParser';
import { useNavigate } from 'react-router-dom';
import BookCard from '@/components/BookCard';
import EditBookDialog from '@/components/EditBookDialog';
import { useToast } from '@/hooks/use-toast';

const Library = () => {
  const [books, setBooks] = useState<Book[]>(() => getAllBooks());
  const [loading, setLoading] = useState(false);
  const [editBook, setEditBook] = useState<Book | null>(null);
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
      const { title, paragraphs } = await extractTextFromPdf(file);
      const book: Book = {
        id: crypto.randomUUID(),
        title,
        author: 'Unknown Author',
        coverUrl: null,
        content: paragraphs,
        highlights: [],
        bookmarks: [],
        lastReadParagraph: 0,
        lastReadAt: Date.now(),
        addedAt: Date.now(),
        totalParagraphs: paragraphs.length,
      };
      saveBook(book);
      setBooks(getAllBooks());
      toast({ title: 'Book added!', description: `"${title}" has been added to your library` });
    } catch (err) {
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

  const sortedBooks = [...books].sort((a, b) => b.lastReadAt - a.lastReadAt);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-card/80 backdrop-blur-lg">
        <div className="mx-auto max-w-4xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-semibold text-foreground">My Library</h1>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-md transition-all hover:shadow-lg active:scale-95 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            {loading ? 'Processing...' : 'Add Book'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-4xl px-4 py-6">
        {sortedBooks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-4 rounded-full bg-secondary p-6">
              <BookOpen className="h-12 w-12 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-medium text-foreground mb-2">Your library is empty</h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs">
              Upload a PDF to start reading. Your books and progress will be saved automatically.
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
              />
            ))}
          </div>
        )}
      </main>

      {editBook && (
        <EditBookDialog
          book={editBook}
          onClose={() => setEditBook(null)}
          onSave={handleEditSave}
        />
      )}
    </div>
  );
};

export default Library;
