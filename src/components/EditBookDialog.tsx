import { useState, useRef } from 'react';
import { Book } from '@/types/book';
import { updateBookMeta } from '@/lib/bookStorage';
import { X, Upload } from 'lucide-react';

interface EditBookDialogProps {
  book: Book;
  onClose: () => void;
  onSave: () => void;
}

const EditBookDialog = ({ book, onClose, onSave }: EditBookDialogProps) => {
  const [title, setTitle] = useState(book.title);
  const [author, setAuthor] = useState(book.author);
  const [coverUrl, setCoverUrl] = useState(book.coverUrl);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCoverUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    updateBookMeta(book.id, { title, author, coverUrl });
    onSave();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-foreground/30 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-card p-6 shadow-2xl animate-in slide-in-from-bottom"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-foreground">Edit Book</h2>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-secondary">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Cover preview */}
        <div className="flex justify-center mb-6">
          <button
            onClick={() => fileRef.current?.click()}
            className="relative aspect-[2/3] w-28 overflow-hidden rounded-lg bg-secondary border-2 border-dashed border-border hover:border-primary transition-colors"
          >
            {coverUrl ? (
              <img src={coverUrl} alt="Cover" className="h-full w-full object-cover" />
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-1">
                <Upload className="h-5 w-5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Cover</span>
              </div>
            )}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Title</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Author</label>
            <input
              value={author}
              onChange={e => setAuthor(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium text-foreground hover:bg-secondary">
            Cancel
          </button>
          <button onClick={handleSave} className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground shadow-md hover:shadow-lg">
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditBookDialog;
