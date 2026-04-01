import { useState, useRef } from 'react';
import { Book, ReadingStatus } from '@/types/book';
import { Upload, AlertCircle } from 'lucide-react';

interface GoodreadsEntry {
  title: string;
  author: string;
  shelf: string;
}

interface GoodreadsImportProps {
  onImport: (entries: { title: string; author: string; readingStatus: ReadingStatus }[]) => void;
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split('\n');
  if (lines.length < 2) return [];

  // Parse header
  const headers = parseCSVLine(lines[0]);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === 0) continue;
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h.trim()] = (values[idx] || '').trim();
    });
    rows.push(row);
  }
  return rows;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function mapShelfToStatus(shelf: string): ReadingStatus {
  const s = shelf.toLowerCase();
  if (s.includes('currently-reading') || s.includes('reading')) return 'reading';
  if (s.includes('read')) return 'read';
  return 'want-to-read';
}

const GoodreadsImport = ({ onImport }: GoodreadsImportProps) => {
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<{ title: string; author: string; readingStatus: ReadingStatus }[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');

    try {
      const text = await file.text();
      const rows = parseCSV(text);

      if (rows.length === 0) {
        setError('No data found in CSV');
        return;
      }

      // Look for Goodreads columns
      const titleKey = Object.keys(rows[0]).find(k => k.toLowerCase() === 'title') || 'Title';
      const authorKey = Object.keys(rows[0]).find(k => k.toLowerCase().includes('author')) || 'Author';
      const shelfKey = Object.keys(rows[0]).find(k => k.toLowerCase().includes('exclusive shelf') || k.toLowerCase().includes('bookshelves')) || 'Exclusive Shelf';

      const entries = rows
        .filter(r => r[titleKey])
        .map(r => ({
          title: r[titleKey] || 'Untitled',
          author: r[authorKey] || 'Unknown Author',
          readingStatus: mapShelfToStatus(r[shelfKey] || ''),
        }));

      setPreview(entries);
    } catch {
      setError('Failed to parse CSV file');
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-dashed border-border p-6 text-center">
        <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground mb-2">
          Upload your Goodreads export CSV
        </p>
        <p className="text-xs text-muted-foreground mb-3">
          Go to goodreads.com → My Books → Import/Export → Export Library
        </p>
        <button
          onClick={() => fileRef.current?.click()}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Choose CSV file
        </button>
        <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {preview.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-foreground font-medium">{preview.length} books found</p>
          <div className="max-h-48 overflow-y-auto rounded-lg border border-border divide-y divide-border">
            {preview.slice(0, 20).map((entry, i) => (
              <div key={i} className="px-3 py-2 flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground line-clamp-1">{entry.title}</p>
                  <p className="text-xs text-muted-foreground">{entry.author}</p>
                </div>
                <span className="text-[10px] rounded-full bg-secondary px-2 py-0.5 text-muted-foreground shrink-0 ml-2">
                  {entry.readingStatus}
                </span>
              </div>
            ))}
            {preview.length > 20 && (
              <p className="text-xs text-muted-foreground text-center py-2">
                ...and {preview.length - 20} more
              </p>
            )}
          </div>
          <button
            onClick={() => onImport(preview)}
            className="w-full rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground"
          >
            Import {preview.length} books
          </button>
        </div>
      )}
    </div>
  );
};

export default GoodreadsImport;
