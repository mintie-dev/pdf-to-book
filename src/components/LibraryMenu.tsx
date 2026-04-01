import { X, BarChart3, Settings, User, Sun, Moon, Flower2 } from 'lucide-react';
import { ReaderTheme } from '@/types/book';
import { useTheme } from '@/hooks/useTheme';
import ReadingLog from './ReadingLog';

const themeOptions: { key: ReaderTheme; label: string; icon: React.ReactNode }[] = [
  { key: 'light', label: 'Light', icon: <Sun className="h-3.5 w-3.5" /> },
  { key: 'dark', label: 'Dark', icon: <Moon className="h-3.5 w-3.5" /> },
  { key: 'warm-blush', label: 'Blush', icon: <Flower2 className="h-3.5 w-3.5" /> },
];

interface LibraryMenuProps {
  open: boolean;
  onClose: () => void;
}

const LibraryMenu = ({ open, onClose }: LibraryMenuProps) => {
  const { theme, setTheme } = useTheme();

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 z-50 w-80 max-w-[85vw] bg-card border-l border-border shadow-2xl animate-[slide-in-right_0.3s_ease-out] flex flex-col">
        <div className="flex items-center justify-between p-3 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Menu</h2>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-secondary transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="p-3 space-y-4 flex-1 overflow-y-auto">
          {/* Theme selector - compact */}
          <div>
            <h3 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Theme</h3>
            <div className="flex gap-1.5">
              {themeOptions.map(opt => (
                <button
                  key={opt.key}
                  onClick={() => setTheme(opt.key)}
                  className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all ${
                    theme === opt.key
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {opt.icon}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Reading Log */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <BarChart3 className="h-3.5 w-3.5 text-primary" />
              <h3 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Reading Log</h3>
            </div>
            <ReadingLog />
          </div>
        </div>

        {/* Settings & Profile pinned to bottom */}
        <div className="border-t border-border p-3 space-y-0.5">
          <button className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
            <Settings className="h-3.5 w-3.5" />
            Settings
            <span className="ml-auto text-[9px] bg-secondary rounded-full px-1.5 py-0.5">Soon</span>
          </button>
          <button className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
            <User className="h-3.5 w-3.5" />
            Profile
            <span className="ml-auto text-[9px] bg-secondary rounded-full px-1.5 py-0.5">Soon</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default LibraryMenu;
