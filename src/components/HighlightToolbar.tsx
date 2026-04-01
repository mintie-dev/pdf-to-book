import { Search } from 'lucide-react';

interface HighlightToolbarProps {
  position: { x: number; y: number };
  onHighlight: (color: 'yellow' | 'blue' | 'pink' | 'green') => void;
  onLookup: () => void;
}

const colors: { color: 'yellow' | 'blue' | 'pink' | 'green'; class: string }[] = [
  { color: 'yellow', class: 'bg-highlight-yellow' },
  { color: 'blue', class: 'bg-highlight-blue' },
  { color: 'pink', class: 'bg-highlight-pink' },
  { color: 'green', class: 'bg-highlight-green' },
];

const HighlightToolbar = ({ position, onHighlight, onLookup }: HighlightToolbarProps) => {
  return (
    <div
      className="fixed z-50 flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-2 shadow-xl"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -100%)',
      }}
      onClick={e => e.stopPropagation()}
    >
      {colors.map(({ color, class: cls }) => (
        <button
          key={color}
          onClick={() => onHighlight(color)}
          className={`h-6 w-6 rounded-full ${cls} border border-border/50 transition-transform hover:scale-110 active:scale-95`}
          title={`Highlight ${color}`}
        />
      ))}
      <div className="mx-1 h-5 w-px bg-border" />
      <button
        onClick={onLookup}
        className="rounded-full p-1 hover:bg-secondary"
        title="Look up"
      >
        <Search className="h-4 w-4 text-muted-foreground" />
      </button>
    </div>
  );
};

export default HighlightToolbar;
