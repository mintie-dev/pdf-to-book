import { Book, ReadingStatus } from '@/types/book';
import { MoreVertical, BookOpen, BookMarked, BookCheck } from 'lucide-react';
import { useState } from 'react';

interface BookCardProps {
  book: Book;
  onRead: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange?: (status: ReadingStatus) => void;
}

const statusLabels: Record<ReadingStatus, { label: string; icon: React.ReactNode }> = {
  'want-to-read': { label: 'Want to Read', icon: <BookMarked className="h-3.5 w-3.5" /> },
  'reading': { label: 'Reading', icon: <BookOpen className="h-3.5 w-3.5" /> },
  'read': { label: 'Read', icon: <BookCheck className="h-3.5 w-3.5" /> },
};

const BookCard = ({ book, onRead, onEdit, onDelete, onStatusChange }: BookCardProps) => {
  const [showMenu, setShowMenu] = useState(false);
  const progress = book.totalParagraphs > 0
    ? Math.round((book.lastReadParagraph / book.totalParagraphs) * 100)
    : 0;

  const status = book.readingStatus || 'want-to-read';

  return (
    <div className="group relative flex flex-col">
      <button
        onClick={onRead}
        className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-secondary shadow-md transition-all hover:shadow-xl active:scale-[0.98]"
      >
        {book.coverUrl ? (
          <img src={book.coverUrl} alt={book.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-primary/10 to-primary/5 p-4">
            <BookOpen className="h-8 w-8 text-primary/40" />
            <span className="text-xs font-medium text-primary/60 text-center leading-tight line-clamp-3">
              {book.title}
            </span>
          </div>
        )}
        {progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted/50">
            <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
          </div>
        )}
      </button>

      <div className="mt-2 px-0.5">
        <h3 className="text-sm font-medium text-foreground line-clamp-1">{book.title}</h3>
        <p className="text-xs text-muted-foreground line-clamp-1">{book.author}</p>
        {/* Status badge */}
        <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          {statusLabels[status].icon}
          {statusLabels[status].label}
        </span>
      </div>

      <div className="absolute right-1 top-1">
        <button
          onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
          className="rounded-full bg-card/80 p-1.5 opacity-0 shadow backdrop-blur transition-opacity group-hover:opacity-100"
        >
          <MoreVertical className="h-3.5 w-3.5 text-foreground" />
        </button>
        {showMenu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
            <div className="absolute right-0 top-8 z-20 w-40 rounded-lg border border-border bg-card py-1 shadow-lg">
              <button onClick={() => { onEdit(); setShowMenu(false); }} className="w-full px-3 py-2 text-left text-sm text-foreground hover:bg-secondary">
                Edit details
              </button>
              <div className="mx-2 my-1 h-px bg-border" />
              {(Object.keys(statusLabels) as ReadingStatus[]).map(s => (
                <button
                  key={s}
                  onClick={() => { onStatusChange?.(s); setShowMenu(false); }}
                  className={`w-full px-3 py-1.5 text-left text-xs hover:bg-secondary flex items-center gap-1.5 ${
                    status === s ? 'text-primary font-medium' : 'text-foreground'
                  }`}
                >
                  {statusLabels[s].icon}
                  {statusLabels[s].label}
                </button>
              ))}
              <div className="mx-2 my-1 h-px bg-border" />
              <button onClick={() => { onDelete(); setShowMenu(false); }} className="w-full px-3 py-2 text-left text-sm text-destructive hover:bg-secondary">
                Delete
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BookCard;
