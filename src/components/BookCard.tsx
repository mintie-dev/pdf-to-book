import { Book, ReadingStatus } from '@/types/book';
import { MoreVertical, BookOpen, BookMarked, BookCheck, Pin, Upload } from 'lucide-react';
import { useState, useRef, DragEvent } from 'react';
import { extractTextFromPdf } from '@/lib/pdfParser';
import { saveBook } from '@/lib/bookStorage';
import { toast } from 'sonner';

interface BookCardProps {
  book: Book;
  onRead: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange?: (status: ReadingStatus) => void;
  onTogglePin?: () => void;
  canPin?: boolean;
  onBookUpdated?: () => void;
}

const statusLabels: Record<ReadingStatus, { label: string; icon: React.ReactNode }> = {
  'want-to-read': { label: 'Want to Read', icon: <BookMarked className="h-3.5 w-3.5" /> },
  'reading': { label: 'Reading', icon: <BookOpen className="h-3.5 w-3.5" /> },
  'read': { label: 'Read', icon: <BookCheck className="h-3.5 w-3.5" /> },
};

const BookCard = ({ book, onRead, onEdit, onDelete, onStatusChange, onTogglePin, canPin, onBookUpdated }: BookCardProps) => {
  const [showMenu, setShowMenu] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasContent = book.content && book.content.length > 0;
  const progress = book.totalParagraphs > 0
    ? Math.round((book.lastReadParagraph / book.totalParagraphs) * 100)
    : 0;

  const status = book.readingStatus || 'want-to-read';

  const handleUploadContent = async (file: File) => {
    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file');
      return;
    }
    setUploading(true);
    try {
      const { paragraphs, formattedParagraphs } = await extractTextFromPdf(file);
      book.content = paragraphs;
      book.totalParagraphs = paragraphs.length;
      book.paragraphFormats = formattedParagraphs.map(p => ({ format: p.format }));
      saveBook(book);
      onBookUpdated?.();
      toast.success(`Content added to "${book.title}"`, { duration: 3000 });
    } catch {
      toast.error('Failed to process PDF');
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUploadContent(file);
  };

  const onDragOver = (e: DragEvent) => { e.preventDefault(); setDragOver(true); };
  const onDragLeave = () => setDragOver(false);

  return (
    <div className="group relative flex flex-col">
      <div
        onDrop={!hasContent ? onDrop : undefined}
        onDragOver={!hasContent ? onDragOver : undefined}
        onDragLeave={!hasContent ? onDragLeave : undefined}
      >
        <button
          onClick={hasContent ? onRead : () => fileInputRef.current?.click()}
          className={`relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-secondary shadow-md transition-all duration-200 hover:shadow-xl hover:scale-[1.03] active:scale-[0.98] ${dragOver ? 'ring-2 ring-primary scale-[1.05]' : ''}`}
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
          {!hasContent && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/60 backdrop-blur-sm gap-1">
              {uploading ? (
                <span className="text-xs text-muted-foreground animate-pulse">Uploading...</span>
              ) : (
                <>
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground text-center px-2">Drop PDF or tap to add content</span>
                </>
              )}
            </div>
          )}
          {book.pinned && (
            <div className="absolute top-1.5 left-1.5 rounded-full bg-primary/90 p-1">
              <Pin className="h-3 w-3 text-primary-foreground" />
            </div>
          )}
          {progress > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted/50">
              <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
            </div>
          )}
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUploadContent(f); e.target.value = ''; }}
      />

      <div className="mt-2 px-0.5">
        <h3 className="text-sm font-medium text-foreground line-clamp-1">{book.title}</h3>
        <p className="text-xs text-muted-foreground line-clamp-1">{book.author}</p>
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
              {!hasContent && (
                <button
                  onClick={() => { fileInputRef.current?.click(); setShowMenu(false); }}
                  className="w-full px-3 py-2 text-left text-sm text-foreground hover:bg-secondary flex items-center gap-1.5"
                >
                  <Upload className="h-3.5 w-3.5" />
                  Upload PDF content
                </button>
              )}
              {onTogglePin && (
                <button
                  onClick={() => { onTogglePin(); setShowMenu(false); }}
                  disabled={!book.pinned && !canPin}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-secondary flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed text-foreground"
                >
                  <Pin className="h-3.5 w-3.5" />
                  {book.pinned ? 'Unpin' : 'Pin to top'}
                </button>
              )}
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
