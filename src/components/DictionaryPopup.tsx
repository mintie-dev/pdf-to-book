import { DictionaryResult } from '@/lib/dictionary';
import { X, Loader2 } from 'lucide-react';

interface DictionaryPopupProps {
  result: DictionaryResult | null;
  loading: boolean;
  onClose: () => void;
}

const DictionaryPopup = ({ result, loading, onClose }: DictionaryPopupProps) => {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-foreground/20 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md max-h-[60vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-card p-5 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">
            {loading ? 'Looking up...' : result?.word || 'Not found'}
          </h3>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-secondary">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        {!loading && !result && (
          <p className="text-sm text-muted-foreground py-4">No definition found for this word.</p>
        )}

        {!loading && result && (
          <div className="space-y-4">
            {result.phonetic && (
              <p className="text-sm text-muted-foreground italic">{result.phonetic}</p>
            )}
            {result.meanings.map((meaning, i) => (
              <div key={i}>
                <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">
                  {meaning.partOfSpeech}
                </p>
                <ol className="space-y-2">
                  {meaning.definitions.map((def, j) => (
                    <li key={j} className="text-sm text-foreground">
                      <span>{j + 1}. {def.definition}</span>
                      {def.example && (
                        <p className="text-xs text-muted-foreground italic mt-0.5">"{def.example}"</p>
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DictionaryPopup;
