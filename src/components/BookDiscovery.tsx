import { useState } from 'react';
import { Search, Loader2, ExternalLink, BookOpen, Download } from 'lucide-react';
import { toast } from 'sonner';

interface OpenLibraryBook {
  key: string;
  title: string;
  author_name?: string[];
  cover_i?: number;
  first_publish_year?: number;
  ia?: string[];
}

interface BookDiscoveryProps {
  onImportBook?: (title: string, author: string, coverUrl: string | null, content?: string[]) => void;
}

const BookDiscovery = ({ onImportBook }: BookDiscoveryProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<OpenLibraryBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=20`);
      const data = await res.json();
      setResults(data.docs || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const getCoverUrl = (coverId?: number) =>
    coverId ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg` : null;

  const getReadUrl = (book: OpenLibraryBook) => {
    if (book.ia && book.ia.length > 0) {
      return `https://archive.org/details/${book.ia[0]}`;
    }
    return `https://openlibrary.org${book.key}`;
  };

  const fetchBookContent = async (book: OpenLibraryBook): Promise<string[]> => {
    // Try to get full text from Internet Archive
    if (book.ia && book.ia.length > 0) {
      try {
        const txtUrl = `https://archive.org/download/${book.ia[0]}/${book.ia[0]}_djvu.txt`;
        const res = await fetch(txtUrl);
        if (res.ok) {
          const text = await res.text();
          // Split into paragraphs by double newlines
          const paragraphs = text
            .split(/\n\s*\n/)
            .map(p => p.replace(/\n/g, ' ').trim())
            .filter(p => p.length > 0);
          if (paragraphs.length > 0) return paragraphs;
        }
      } catch {
        // Fall through to next method
      }
    }

    // Try to get plaintext from Open Library
    try {
      const workId = book.key.replace('/works/', '');
      const editionsRes = await fetch(`https://openlibrary.org/works/${workId}/editions.json?limit=5`);
      const editionsData = await editionsRes.json();
      for (const edition of editionsData.entries || []) {
        if (edition.ocaid) {
          try {
            const txtUrl = `https://archive.org/download/${edition.ocaid}/${edition.ocaid}_djvu.txt`;
            const res = await fetch(txtUrl);
            if (res.ok) {
              const text = await res.text();
              const paragraphs = text
                .split(/\n\s*\n/)
                .map(p => p.replace(/\n/g, ' ').trim())
                .filter(p => p.length > 0);
              if (paragraphs.length > 0) return paragraphs;
            }
          } catch {
            continue;
          }
        }
      }
    } catch {
      // No content available
    }

    return [];
  };

  const handleImport = async (book: OpenLibraryBook) => {
    if (!onImportBook) return;
    setImporting(book.key);

    try {
      const content = await fetchBookContent(book);
      onImportBook(
        book.title,
        book.author_name?.[0] || 'Unknown Author',
        getCoverUrl(book.cover_i),
        content
      );
      if (content.length > 0) {
        toast.success(`"${book.title}" imported with full text`, { duration: 3000 });
      } else {
        toast.success(`"${book.title}" added (no free text available)`, { duration: 3000 });
      }
    } catch {
      toast.error('Failed to import book');
    } finally {
      setImporting(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search Open Library for books..."
            className="w-full rounded-lg border border-border bg-card pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={loading}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
        </button>
      </div>

      {results.length > 0 && (
        <div className="space-y-2 max-h-96 overflow-y-auto rounded-lg border border-border">
          {results.map((book) => (
            <div key={book.key} className="flex items-start gap-3 p-3 border-b border-border last:border-0 hover:bg-secondary/50 transition-colors">
              {getCoverUrl(book.cover_i) ? (
                <img src={getCoverUrl(book.cover_i)!} alt={book.title} className="w-10 h-14 rounded object-cover shrink-0" />
              ) : (
                <div className="w-10 h-14 rounded bg-secondary flex items-center justify-center shrink-0">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-foreground line-clamp-1">{book.title}</h4>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {book.author_name?.join(', ') || 'Unknown Author'}
                  {book.first_publish_year && ` · ${book.first_publish_year}`}
                </p>
                <div className="flex gap-2 mt-1.5">
                  <a
                    href={getReadUrl(book)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    {book.ia ? 'Read free' : 'View on Open Library'}
                  </a>
                  {onImportBook && (
                    <button
                      onClick={() => handleImport(book)}
                      disabled={importing === book.key}
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
                    >
                      {importing === book.key ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Download className="h-3 w-3" />
                      )}
                      {importing === book.key ? 'Importing...' : 'Add to library'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && results.length === 0 && query && (
        <p className="text-sm text-muted-foreground text-center py-4">No results found. Try a different search term.</p>
      )}
    </div>
  );
};

export default BookDiscovery;
