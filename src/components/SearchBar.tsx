import { useState, useEffect, useRef } from 'react';
import { Search, X, ChevronUp, ChevronDown } from 'lucide-react';

interface SearchBarProps {
  content: string[];
  onNavigateToMatch: (paragraphIndex: number) => void;
  onClose: () => void;
}

interface SearchMatch {
  paragraphIndex: number;
  text: string;
}

const SearchBar = ({ content, onNavigateToMatch, onClose }: SearchBarProps) => {
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState<SearchMatch[]>([]);
  const [currentMatch, setCurrentMatch] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setMatches([]);
      setCurrentMatch(0);
      return;
    }
    const q = query.toLowerCase();
    const found: SearchMatch[] = [];
    content.forEach((para, idx) => {
      if (para.toLowerCase().includes(q)) {
        found.push({ paragraphIndex: idx, text: para });
      }
    });
    setMatches(found);
    setCurrentMatch(0);
    if (found.length > 0) {
      onNavigateToMatch(found[0].paragraphIndex);
    }
  }, [query, content]);

  const goToMatch = (dir: 1 | -1) => {
    if (matches.length === 0) return;
    const next = (currentMatch + dir + matches.length) % matches.length;
    setCurrentMatch(next);
    onNavigateToMatch(matches[next].paragraphIndex);
  };

  return (
    <div className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur-lg px-4 py-2 flex items-center gap-2">
      <Search className="h-4 w-4 text-muted-foreground shrink-0" />
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search in book..."
        className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
        onKeyDown={(e) => {
          if (e.key === 'Enter') goToMatch(e.shiftKey ? -1 : 1);
          if (e.key === 'Escape') onClose();
        }}
      />
      {matches.length > 0 && (
        <span className="text-xs text-muted-foreground shrink-0">
          {currentMatch + 1}/{matches.length}
        </span>
      )}
      {query && matches.length === 0 && (
        <span className="text-xs text-muted-foreground shrink-0">No results</span>
      )}
      <button onClick={() => goToMatch(-1)} className="p-1 rounded hover:bg-secondary" disabled={matches.length === 0}>
        <ChevronUp className="h-4 w-4 text-muted-foreground" />
      </button>
      <button onClick={() => goToMatch(1)} className="p-1 rounded hover:bg-secondary" disabled={matches.length === 0}>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </button>
      <button onClick={onClose} className="p-1 rounded hover:bg-secondary">
        <X className="h-4 w-4 text-muted-foreground" />
      </button>
    </div>
  );
};

export default SearchBar;
