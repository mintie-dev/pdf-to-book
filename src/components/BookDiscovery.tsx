import { useState } from 'react';
import { Search, Loader2, ExternalLink, BookOpen } from 'lucide-react';

interface OpenLibraryBook {
  key: string;
  title: string;
  author_name?: string[];
  cover_i?: number;
  first_publish_year?: number;
  ia?: string[]; // Internet Archive identifiers for free downloads
}

interface BookDiscoveryProps {
  onImportBook?: (title: string, author: string, coverUrl: string | null) => void;
}

const BookDiscovery = ({ onImportBook }: BookDiscoveryProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<OpenLibraryBook[]>([]);
  const [loading, setLoading] = useState(false);

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
            <div key={book.key} className="flex items-start gap-3 p-3 border-b border-border last:border-0 hover:bg-secondary/50">
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
                      onClick={() => onImportBook(
                        book.title,
                        book.author_name?.[0] || 'Unknown Author',
                        getCoverUrl(book.cover_i)
                      )}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Add to library
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
