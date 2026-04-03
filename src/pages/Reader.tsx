import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Bookmark, BookmarkCheck, List, Type, Minus, Plus, Search, Sun, Moon, Flower2, AlignLeft, AlignJustify } from 'lucide-react';
import { Book, Highlight, Bookmark as BookmarkType, ReaderTheme } from '@/types/book';
import { getBook, updateReadingPosition, addHighlight, removeHighlight, addBookmark, removeBookmark, saveBook } from '@/lib/bookStorage';
import { lookupWord, DictionaryResult } from '@/lib/dictionary';
import { useTheme } from '@/hooks/useTheme';
import { logPagesRead, getTodayPages, getReadingGoal } from '@/lib/readingLog';
import { toast } from 'sonner';
import HighlightToolbar from '@/components/HighlightToolbar';
import DictionaryPopup from '@/components/DictionaryPopup';
import BookmarkPanel from '@/components/BookmarkPanel';
import SearchBar from '@/components/SearchBar';

const themeIcons: Record<ReaderTheme, React.ReactNode> = {
  light: <Sun className="h-5 w-5" />,
  dark: <Moon className="h-5 w-5" />,
  'warm-blush': <Flower2 className="h-5 w-5" />,
};

const fontFamilies = [
  { key: 'sans', label: 'Sans', style: 'ui-sans-serif, system-ui, sans-serif' },
  { key: 'serif', label: 'Serif', style: 'Georgia, Cambria, "Times New Roman", serif' },
  { key: 'mono', label: 'Mono', style: 'ui-monospace, "Courier New", monospace' },
];

const SETTINGS_KEY = 'ebook-reader-settings';

interface ReaderSettings {
  fontSize: number;
  fontFamily: string;
  textAlign: 'left' | 'justify';
}

function loadSettings(bookId: string): ReaderSettings {
  try {
    const data = localStorage.getItem(`${SETTINGS_KEY}-${bookId}`);
    if (data) return JSON.parse(data);
  } catch {}
  return { fontSize: 18, fontFamily: 'sans', textAlign: 'left' };
}

function persistSettings(bookId: string, settings: ReaderSettings) {
  localStorage.setItem(`${SETTINGS_KEY}-${bookId}`, JSON.stringify(settings));
}

const Reader = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [book, setBook] = useState<Book | null>(null);
  const [fontSize, setFontSize] = useState(18);
  const [fontFamily, setFontFamily] = useState('sans');
  const [textAlign, setTextAlign] = useState<'left' | 'justify'>('left');
  const settingsLoaded = useRef(false);
  const [showToolbar, setShowToolbar] = useState(true);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const { theme, cycleTheme } = useTheme();
  const [selectedText, setSelectedText] = useState('');
  const [selectionRange, setSelectionRange] = useState<{ paragraphIndex: number; startOffset: number; endOffset: number; text: string } | null>(null);
  const [dictResult, setDictResult] = useState<DictionaryResult | null>(null);
  const [dictLoading, setDictLoading] = useState(false);
  const [showDict, setShowDict] = useState(false);
  const [toolbarPos, setToolbarPos] = useState<{ x: number; y: number } | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const visibleParagraphs = useRef<Set<number>>(new Set());
  const maxReadParagraph = useRef<number>(0);
  const goalNotified = useRef(false);

  useEffect(() => {
    if (!id) return;
    const b = getBook(id);
    if (!b) { navigate('/'); return; }
    if (b.readingStatus === 'want-to-read') {
      b.readingStatus = 'reading';
      saveBook(b);
    }
    setBook(b);
    // Load persisted reader settings
    if (!settingsLoaded.current) {
      const saved = loadSettings(id);
      setFontSize(saved.fontSize);
      setFontFamily(saved.fontFamily);
      setTextAlign(saved.textAlign);
      settingsLoaded.current = true;
    }
  }, [id, navigate]);

  // Persist settings when they change
  useEffect(() => {
    if (!id || !settingsLoaded.current) return;
    persistSettings(id, { fontSize, fontFamily, textAlign });
  }, [id, fontSize, fontFamily, textAlign]);

  useEffect(() => {
    if (!book || !contentRef.current) return;
    maxReadParagraph.current = book.lastReadParagraph || 0;
    goalNotified.current = false;
    
    const paragraphsPerPage = book.totalPages && book.totalPages > 0
      ? book.totalParagraphs / book.totalPages
      : 1;
    
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          const idx = parseInt(entry.target.getAttribute('data-idx') || '0');
          if (entry.isIntersecting) visibleParagraphs.current.add(idx);
          else visibleParagraphs.current.delete(idx);
        });
        const visible = Array.from(visibleParagraphs.current);
        if (visible.length > 0) {
          const maxVisible = Math.max(...visible);
          const minIdx = Math.min(...visible);
          
          if (maxVisible > maxReadParagraph.current) {
            const newParagraphs = maxVisible - maxReadParagraph.current;
            const newPages = Math.max(1, Math.round(newParagraphs / paragraphsPerPage));
            logPagesRead(newPages);
            maxReadParagraph.current = maxVisible;
            
            if (!goalNotified.current) {
              const goal = getReadingGoal();
              const todayTotal = getTodayPages();
              if (todayTotal >= goal.pagesPerDay) {
                goalNotified.current = true;
                toast('🎉 Daily reading goal complete!', { duration: 4000 });
              }
            }
          }
          
          updateReadingPosition(book.id, minIdx);
          setBook(prev => prev ? { ...prev, lastReadParagraph: minIdx } : null);
          
          if (minIdx >= book.totalParagraphs - 3 && book.readingStatus !== 'read') {
            const updated = getBook(book.id);
            if (updated) {
              updated.readingStatus = 'read';
              saveBook(updated);
              setBook(prev => prev ? { ...prev, readingStatus: 'read' } : null);
            }
          }
        }
      },
      { threshold: 0.5 }
    );
    const paragraphs = contentRef.current.querySelectorAll('[data-idx]');
    paragraphs.forEach(p => observerRef.current?.observe(p));
    return () => observerRef.current?.disconnect();
  }, [book?.id]);

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

    const range = selection.getRangeAt(0);
    const anchorNode = selection.anchorNode;
    const paragraphEl = anchorNode?.parentElement?.closest('[data-idx]');
    if (paragraphEl) {
      const paragraphIndex = parseInt(paragraphEl.getAttribute('data-idx') || '0');
      
      // Use a temporary range to calculate the true offset within the paragraph
      const preRange = document.createRange();
      preRange.selectNodeContents(paragraphEl);
      preRange.setEnd(range.startContainer, range.startOffset);
      const startOffset = preRange.toString().length;
      const endOffset = startOffset + text.length;
      
      setSelectionRange({
        paragraphIndex,
        startOffset,
        endOffset,
        text,
      });
    }

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
  const currentPage = book && book.totalPages ? Math.min(book.totalPages, Math.round((book.lastReadParagraph / Math.max(book.totalParagraphs, 1)) * book.totalPages) + 1) : null;

  const renderParagraph = (text: string, idx: number) => {
    if (!book) return text;
    const highlights = book.highlights.filter(h => h.paragraphIndex === idx);
    if (highlights.length === 0) return text;

    const sorted = [...highlights].sort((a, b) => a.startOffset - b.startOffset);
    type Segment = { text: string; highlight: Highlight | null };
    const result: Segment[] = [];
    let pos = 0;

    for (const hl of sorted) {
      if (hl.startOffset < pos) continue; // skip overlapping
      if (hl.startOffset > pos) {
        result.push({ text: text.slice(pos, hl.startOffset), highlight: null });
      }
      result.push({ text: text.slice(hl.startOffset, hl.endOffset), highlight: hl });
      pos = hl.endOffset;
    }
    if (pos < text.length) {
      result.push({ text: text.slice(pos), highlight: null });
    }

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

  const currentFontStyle = fontFamilies.find(f => f.key === fontFamily)?.style || fontFamilies[0].style;

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
                  <BookmarkCheck className="h-5 w-5 text-primary" />
                ) : (
                  <Bookmark className="h-5 w-5 opacity-60" />
                )}
              </button>
              <button onClick={() => setShowBookmarks(!showBookmarks)} className="rounded-full p-2 hover:opacity-70">
                <List className="h-5 w-5 opacity-60" />
              </button>
            </div>
          </div>
          <div className="h-0.5 bg-muted">
            <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </header>
      )}

      {showSearch && (
        <SearchBar content={book.content} onNavigateToMatch={scrollToParagraph} onClose={() => setShowSearch(false)} />
      )}

      <main
        ref={contentRef}
        className="flex-1 mx-auto w-full max-w-2xl px-5 sm:px-8 py-8"
        style={{ textAlign, fontFamily: currentFontStyle }}
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
        <div className="sticky bottom-0 border-t border-border bg-card/90 backdrop-blur-lg transition-colors duration-300">
          <div className="flex items-center justify-center gap-3 px-4 py-3 flex-wrap">
            {/* Font size controls */}
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

            {/* Divider */}
            <div className="w-px h-5 bg-border mx-1" />

            {/* Font family */}
            <div className="flex gap-0.5">
              {fontFamilies.map(f => (
                <button
                  key={f.key}
                  onClick={(e) => { e.stopPropagation(); setFontFamily(f.key); }}
                  className={`text-[10px] px-2 py-1 rounded transition-colors ${fontFamily === f.key ? 'bg-primary text-primary-foreground' : 'opacity-50 hover:opacity-80'}`}
                  style={{ fontFamily: f.style }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Divider */}
            <div className="w-px h-5 bg-border mx-1" />

            {/* Text alignment */}
            <button
              onClick={(e) => { e.stopPropagation(); setTextAlign(a => a === 'left' ? 'justify' : 'left'); }}
              className="rounded-full p-2 hover:opacity-70"
              title={textAlign === 'left' ? 'Justify text' : 'Align left'}
            >
              {textAlign === 'left' ? <AlignLeft className="h-4 w-4 opacity-60" /> : <AlignJustify className="h-4 w-4 opacity-60" />}
            </button>

            {/* Divider */}
            <div className="w-px h-5 bg-border mx-1" />

            {/* Progress */}
            <span className="text-xs opacity-60">
              {progress}%{currentPage && book?.totalPages ? ` · ${currentPage}/${book.totalPages}` : ''}
            </span>
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
