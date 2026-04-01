import { Book } from '@/types/book';
import { MoreVertical, BookOpen } from 'lucide-react';
import { useState } from 'react';

interface BookCardProps {
  book: Book;
  onRead: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const BookCard = ({ book, onRead, onEdit, onDelete }: BookCardProps) => {
  const [showMenu, setShowMenu] = useState(false);
  const progress = book.totalParagraphs > 0
    ? Math.round((book.lastReadParagraph / book.totalParagraphs) * 100)
    : 0;

  return (
    <div className="group relative flex flex-col">
      {/* Cover */}
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
        {/* Progress bar */}
        {progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted/50">
            <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
          </div>
        )}
      </button>

      {/* Info */}
      <div className="mt-2 px-0.5">
        <h3 className="text-sm font-medium text-foreground line-clamp-1">{book.title}</h3>
        <p className="text-xs text-muted-foreground line-clamp-1">{book.author}</p>
      </div>

      {/* Menu button */}
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
            <div className="absolute right-0 top-8 z-20 w-32 rounded-lg border border-border bg-card py-1 shadow-lg">
              <button onClick={() => { onEdit(); setShowMenu(false); }} className="w-full px-3 py-2 text-left text-sm text-foreground hover:bg-secondary">
                Edit details
              </button>
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
