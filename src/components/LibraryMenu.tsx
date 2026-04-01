import { X, BarChart3, Settings, User, Sun, Moon, Flower2 } from 'lucide-react';
import { ReaderTheme } from '@/types/book';
import { useTheme } from '@/hooks/useTheme';
import ReadingLog from './ReadingLog';

const themeOptions: { key: ReaderTheme; label: string; icon: React.ReactNode }[] = [
  { key: 'light', label: 'Light', icon: <Sun className="h-4 w-4" /> },
  { key: 'dark', label: 'Dark', icon: <Moon className="h-4 w-4" /> },
  { key: 'warm-blush', label: 'Blush', icon: <Flower2 className="h-4 w-4" /> },
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
      <div className="fixed left-0 top-0 bottom-0 z-50 w-80 max-w-[85vw] bg-card border-r border-border shadow-2xl animate-[slide-in-left_0.3s_ease-out] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Menu</h2>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-secondary transition-colors">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Theme selector */}
          <div>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Theme</h3>
            <div className="flex gap-2">
              {themeOptions.map(opt => (
                <button
                  key={opt.key}
                  onClick={() => setTheme(opt.key)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
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
            <div className="flex items-center gap-1.5 mb-3">
              <BarChart3 className="h-4 w-4 text-primary" />
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Reading Log</h3>
            </div>
            <ReadingLog />
          </div>

          {/* Placeholder items */}
          <div className="space-y-1">
            <button className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
              <Settings className="h-4 w-4" />
              Settings
              <span className="ml-auto text-[10px] bg-secondary rounded-full px-2 py-0.5">Soon</span>
            </button>
            <button className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
              <User className="h-4 w-4" />
              Profile
              <span className="ml-auto text-[10px] bg-secondary rounded-full px-2 py-0.5">Soon</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default LibraryMenu;
