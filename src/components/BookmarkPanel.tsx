import { useState } from 'react';
import { Bookmark, Highlight } from '@/types/book';
import { X, BookmarkIcon, Highlighter, Trash2, ArrowUpDown } from 'lucide-react';

interface BookmarkPanelProps {
  bookmarks: Bookmark[];
  highlights: Highlight[];
  onGoTo: (paragraphIndex: number) => void;
  onClose: () => void;
  onRemoveBookmark: (id: string) => void;
  onRemoveHighlight: (id: string) => void;
}

type SortMode = 'position' | 'color';

const colorOrder: Record<string, number> = { yellow: 0, blue: 1, pink: 2, green: 3 };

const BookmarkPanel = ({ bookmarks, highlights, onGoTo, onClose, onRemoveBookmark, onRemoveHighlight }: BookmarkPanelProps) => {
  const [sortMode, setSortMode] = useState<SortMode>('position');

  const sortedHighlights = [...highlights].sort((a, b) => {
    if (sortMode === 'color') {
      const ca = colorOrder[a.color] ?? 99;
      const cb = colorOrder[b.color] ?? 99;
      if (ca !== cb) return ca - cb;
    }
    return a.paragraphIndex - b.paragraphIndex;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-foreground/20 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md max-h-[70vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-card p-5 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-foreground">Notes & Bookmarks</h3>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-secondary">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Bookmarks */}
        {bookmarks.length > 0 && (
          <div className="mb-5">
            <h4 className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              <BookmarkIcon className="h-3.5 w-3.5" /> Bookmarks
            </h4>
            <div className="space-y-1">
              {bookmarks.sort((a, b) => a.paragraphIndex - b.paragraphIndex).map(bm => (
                <div key={bm.id} className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-secondary">
                  <button onClick={() => onGoTo(bm.paragraphIndex)} className="text-sm text-foreground text-left flex-1">
                    {bm.label}
                  </button>
                  <button onClick={() => onRemoveBookmark(bm.id)} className="p-1 rounded hover:bg-destructive/10">
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Highlights */}
        {highlights.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <Highlighter className="h-3.5 w-3.5" /> Highlights
              </h4>
              <button
                onClick={() => setSortMode(s => s === 'position' ? 'color' : 'position')}
                className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                title={`Sort by ${sortMode === 'position' ? 'color' : 'position'}`}
              >
                <ArrowUpDown className="h-3 w-3" />
                {sortMode === 'position' ? 'By color' : 'By position'}
              </button>
            </div>
            <div className="space-y-1">
              {sortedHighlights.map(h => (
                <div key={h.id} className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-secondary">
                  <div className={`h-3 w-3 rounded-full flex-shrink-0 highlight-${h.color}`} />
                  <button onClick={() => onGoTo(h.paragraphIndex)} className="text-sm text-foreground text-left flex-1 line-clamp-2">
                    "{h.text}"
                  </button>
                  <button onClick={() => onRemoveHighlight(h.id)} className="p-1 rounded hover:bg-destructive/10">
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {bookmarks.length === 0 && highlights.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            No bookmarks or highlights yet. Select text to highlight, or tap the bookmark icon to save your place.
          </p>
        )}
      </div>
    </div>
  );
};

export default BookmarkPanel;
