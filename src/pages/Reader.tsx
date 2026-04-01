import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Bookmark, BookmarkCheck, List, Type, Minus, Plus, Search, Sun, Moon, Flower2 } from 'lucide-react';
import { Book, Highlight, Bookmark as BookmarkType, ReaderTheme } from '@/types/book';
import { getBook, updateReadingPosition, addHighlight, removeHighlight, addBookmark, removeBookmark, saveBook } from '@/lib/bookStorage';
import { lookupWord, DictionaryResult } from '@/lib/dictionary';
import HighlightToolbar from '@/components/HighlightToolbar';
import DictionaryPopup from '@/components/DictionaryPopup';
import BookmarkPanel from '@/components/BookmarkPanel';
import SearchBar from '@/components/SearchBar';

const themeIcons: Record<ReaderTheme, React.ReactNode> = {
  light: <Sun className="h-5 w-5" />,
  dark: <Moon className="h-5 w-5" />,
  'warm-blush': <Flower2 className="h-5 w-5" />,
};
const themeOrder: ReaderTheme[] = ['light', 'dark', 'warm-blush'];

const Reader = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [book, setBook] = useState<Book | null>(null);
  const [fontSize, setFontSize] = useState(18);
  const [showToolbar, setShowToolbar] = useState(true);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [theme, setTheme] = useState<ReaderTheme>(() =>
    (localStorage.getItem('reader-theme') as ReaderTheme) || 'light'
  );
  const [selectedText, setSelectedText] = useState('');
  const [selectionRange, setSelectionRange] = useState<{ paragraphIndex: number; startOffset: number; endOffset: number; text: string } | null>(null);
  const [dictResult, setDictResult] = useState<DictionaryResult | null>(null);
  const [dictLoading, setDictLoading] = useState(false);
  const [showDict, setShowDict] = useState(false);
  const [toolbarPos, setToolbarPos] = useState<{ x: number; y: number } | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const visibleParagraphs = useRef<Set<number>>(new Set());

  // Apply theme class to document root so CSS variables cascade everywhere
  useEffect(() => {
    localStorage.setItem('reader-theme', theme);
    const root = document.documentElement;
    root.classList.remove('dark', 'warm-blush');
    if (theme !== 'light') root.classList.add(theme);
    return () => {
      root.classList.remove('dark', 'warm-blush');
    };
  }, [theme]);

  const cycleTheme = () => {
    const idx = themeOrder.indexOf(theme);
    setTheme(themeOrder[(idx + 1) % themeOrder.length]);
  };

  useEffect(() => {
    if (!id) return;
    const b = getBook(id);
    if (!b) { navigate('/'); return; }
    if (b.readingStatus === 'want-to-read') {
      b.readingStatus = 'reading';
      saveBook(b);
    }
    setBook(b);
  }, [id, navigate]);

  useEffect(() => {
    if (!book || !contentRef.current) return;
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          const idx = parseInt(entry.target.getAttribute('data-idx') || '0');
          if (entry.isIntersecting) visibleParagraphs.current.add(idx);
          else visibleParagraphs.current.delete(idx);
        });
        const visible = Array.from(visibleParagraphs.current);
        if (visible.length > 0) {
          const minIdx = Math.min(...visible);
          updateReadingPosition(book.id, minIdx);
          // Auto mark as "read" when reaching the end
          if (minIdx >= book.totalParagraphs - 3 && book.readingStatus !== 'read') {
            const updated = getBook(book.id);
            if (updated) {
              updated.readingStatus = 'read';
              saveBook(updated);
              setBook({ ...book, readingStatus: 'read' });
            }
          }
        }
      },
      { threshold: 0.5 }
    );
    const paragraphs = contentRef.current.querySelectorAll('[data-idx]');
    paragraphs.forEach(p => observerRef.current?.observe(p));
    return () => observerRef.current?.disconnect();
  }, [book]);

  useEffect(() => {
    if (!book || !contentRef.current) return;
    const el = contentRef.current.querySelector(`[data-idx="${book.lastReadParagraph}"]`);
    if (el && book.lastReadParagraph > 0) {
      setTimeout(() => el.scrollIntoView({ behavior: 'auto', block: 'start' }), 100);
    }
  }, [book?.id]);

  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.toString().trim()) {
      setToolbarPos(null);
      setSelectedText('');
      return;
    }
    const text = selection.toString().trim();
    setSelectedText(text);

    const anchorNode = selection.anchorNode;
    const paragraphEl = anchorNode?.parentElement?.closest('[data-idx]');
    if (paragraphEl) {
      const paragraphIndex = parseInt(paragraphEl.getAttribute('data-idx') || '0');
      const paragraphText = paragraphEl.textContent || '';
      const startOffset = paragraphText.indexOf(text);
      const endOffset = startOffset >= 0 ? startOffset + text.length : 0;
      setSelectionRange({
        paragraphIndex,
        startOffset: startOffset >= 0 ? startOffset : selection.anchorOffset,
        endOffset: endOffset > 0 ? endOffset : selection.focusOffset,
        text,
      });
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    setToolbarPos({ x: rect.left + rect.width / 2, y: rect.top - 10 });
  }, []);

  useEffect(() => {
    document.addEventListener('selectionchange', handleTextSelection);
    return () => document.removeEventListener('selectionchange', handleTextSelection);
  }, [handleTextSelection]);

  const handleHighlight = (color: 'yellow' | 'blue' | 'pink' | 'green') => {
    if (!book || !selectedText || !selectionRange) return;
    const highlight: Highlight = {
      id: crypto.randomUUID(),
      text: selectionRange.text,
      color,
      paragraphIndex: selectionRange.paragraphIndex,
      startOffset: selectionRange.startOffset,
      endOffset: selectionRange.endOffset,
      createdAt: Date.now(),
    };
    addHighlight(book.id, highlight);
    setBook(getBook(book.id) || null);
    window.getSelection()?.removeAllRanges();
    setToolbarPos(null);
  };

  const handleLookup = async () => {
    if (!selectedText) return;
    const word = selectedText.split(/\s+/)[0];
    setDictLoading(true);
    setShowDict(true);
    const result = await lookupWord(word);
    setDictResult(result);
    setDictLoading(false);
    setToolbarPos(null);
  };

  const handleToggleBookmark = () => {
    if (!book) return;
    const visible = Array.from(visibleParagraphs.current);
    const currentParagraph = visible.length > 0 ? Math.min(...visible) : 0;
    const existing = book.bookmarks.find(b => b.paragraphIndex === currentParagraph);
    if (existing) {
      removeBookmark(book.id, existing.id);
    } else {
      const bm: BookmarkType = {
        id: crypto.randomUUID(),
        paragraphIndex: currentParagraph,
        label: `Page ${currentParagraph + 1}`,
        createdAt: Date.now(),
      };
      addBookmark(book.id, bm);
    }
    setBook(getBook(book.id) || null);
  };

  const scrollToParagraph = (idx: number) => {
    const el = contentRef.current?.querySelector(`[data-idx="${idx}"]`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setShowBookmarks(false);
  };

  const isCurrentBookmarked = () => {
    if (!book) return false;
    const visible = Array.from(visibleParagraphs.current);
    const currentParagraph = visible.length > 0 ? Math.min(...visible) : 0;
    return book.bookmarks.some(b => b.paragraphIndex === currentParagraph);
  };

  const progress = book ? Math.round((book.lastReadParagraph / Math.max(book.totalParagraphs, 1)) * 100) : 0;

  const renderParagraph = (text: string, idx: number) => {
    if (!book) return text;
    const highlights = book.highlights.filter(h => h.paragraphIndex === idx);
    if (highlights.length === 0) return text;

    const sorted = [...highlights].sort((a, b) => a.startOffset - b.startOffset);
    type Segment = { text: string; highlight: Highlight | null };
    const result: Segment[] = [];
    let remaining = text;
    let offset = 0;

    for (const hl of sorted) {
      const start = hl.startOffset - offset;
      const end = hl.endOffset - offset;
      if (start < 0 || start >= remaining.length) continue;
      if (start > 0) result.push({ text: remaining.slice(0, start), highlight: null });
      result.push({ text: remaining.slice(start, Math.min(end, remaining.length)), highlight: hl });
      const consumed = Math.min(end, remaining.length);
      remaining = remaining.slice(consumed);
      offset += consumed;
    }
    if (remaining) result.push({ text: remaining, highlight: null });

    return (
      <>
        {result.map((seg, i) =>
          seg.highlight ? (
            <span
              key={i}
              className={`highlight-${seg.highlight.color} rounded px-0.5 cursor-pointer`}
              onClick={(e) => {
                e.stopPropagation();
                removeHighlight(book.id, seg.highlight!.id);
                setBook(getBook(book.id) || null);
              }}
            >
              {seg.text}
            </span>
          ) : (
            <span key={i}>{seg.text}</span>
          )
        )}
      </>
    );
  };

  const getFormatClasses = (idx: number) => {
    const fmt = book?.paragraphFormats?.[idx]?.format;
    if (!fmt) return '';
    switch (fmt) {
      case 'centered': return 'text-centered';
      case 'large': return 'text-large';
      case 'medium': return 'text-medium';
      case 'spacer': return 'spacer-paragraph';
      default: return '';
    }
  };

  if (!book) return null;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
      {showToolbar && (
        <header className="sticky top-0 z-20 border-b border-border bg-card/90 backdrop-blur-lg transition-colors duration-300">
          <div className="flex items-center justify-between px-4 py-3">
            <button onClick={() => navigate('/')} className="rounded-full p-2 hover:opacity-70 active:scale-95">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h2 className="text-sm font-medium line-clamp-1 max-w-[35%] text-center">
              {book.title}
            </h2>
            <div className="flex items-center gap-1">
              <button onClick={cycleTheme} className="rounded-full p-2 hover:opacity-70" title={`Theme: ${theme}`}>
                {themeIcons[theme]}
              </button>
              <button onClick={() => setShowSearch(s => !s)} className="rounded-full p-2 hover:opacity-70">
                <Search className="h-5 w-5" />
              </button>
              <button onClick={handleToggleBookmark} className="rounded-full p-2 hover:opacity-70">
                {isCurrentBookmarked() ? (
                  <BookmarkCheck className="h-5 w-5" style={{ color: 'hsl(var(--primary))' }} />
                ) : (
                  <Bookmark className="h-5 w-5 opacity-60" />
                )}
              </button>
              <button onClick={() => setShowBookmarks(!showBookmarks)} className="rounded-full p-2 hover:opacity-70">
                <List className="h-5 w-5 opacity-60" />
              </button>
            </div>
          </div>
          <div className="h-0.5" style={{ backgroundColor: 'hsl(var(--muted))' }}>
            <div className="h-full transition-all duration-300" style={{ width: `${progress}%`, backgroundColor: 'hsl(var(--primary))' }} />
          </div>
        </header>
      )}

      {showSearch && (
        <SearchBar content={book.content} onNavigateToMatch={scrollToParagraph} onClose={() => setShowSearch(false)} />
      )}

      <main
        ref={contentRef}
        className="flex-1 mx-auto w-full max-w-2xl px-5 sm:px-8 py-8"
        onClick={() => setShowToolbar(prev => !prev)}
      >
        {book.content.map((para, idx) => {
          const fmt = getFormatClasses(idx);
          if (book.paragraphFormats?.[idx]?.format === 'spacer') {
            return <div key={idx} data-idx={idx} className="h-6" />;
          }
          return (
            <p
              key={idx}
              data-idx={idx}
              className={`reader-text mb-4 leading-relaxed ${fmt}`}
              style={{ fontSize: `${fontSize}px` }}
            >
              {renderParagraph(para, idx)}
            </p>
          );
        })}
        <div className="h-32" />
      </main>

      {showToolbar && (
        <div className="sticky bottom-0 border-t" style={{ borderColor: 'hsl(var(--border))', backgroundColor: 'hsl(var(--card) / 0.9)', backdropFilter: 'blur(12px)' }}>
          <div className="flex items-center justify-center gap-4 px-4 py-3">
            <button onClick={(e) => { e.stopPropagation(); setFontSize(s => Math.max(12, s - 2)); }} className="rounded-full p-2 hover:opacity-70">
              <Minus className="h-4 w-4 opacity-60" />
            </button>
            <div className="flex items-center gap-1.5">
              <Type className="h-4 w-4 opacity-60" />
              <span className="text-sm opacity-60 w-8 text-center">{fontSize}</span>
            </div>
            <button onClick={(e) => { e.stopPropagation(); setFontSize(s => Math.min(32, s + 2)); }} className="rounded-full p-2 hover:opacity-70">
              <Plus className="h-4 w-4 opacity-60" />
            </button>
            <span className="text-xs opacity-60 ml-4">{progress}%</span>
          </div>
        </div>
      )}

      {toolbarPos && selectedText && (
        <HighlightToolbar position={toolbarPos} onHighlight={handleHighlight} onLookup={handleLookup} />
      )}

      {showDict && (
        <DictionaryPopup result={dictResult} loading={dictLoading} onClose={() => { setShowDict(false); setDictResult(null); }} />
      )}

      {showBookmarks && (
        <BookmarkPanel
          bookmarks={book.bookmarks}
          highlights={book.highlights}
          onGoTo={scrollToParagraph}
          onClose={() => setShowBookmarks(false)}
          onRemoveBookmark={(bmId) => { removeBookmark(book.id, bmId); setBook(getBook(book.id) || null); }}
          onRemoveHighlight={(hId) => { removeHighlight(book.id, hId); setBook(getBook(book.id) || null); }}
        />
      )}
    </div>
  );
};

export default Reader;
