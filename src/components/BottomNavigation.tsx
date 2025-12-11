import { Home, TrendingUp, Package, Wallet, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navItems = [
  { 
    id: 'dashboard', 
    icon: Home, 
    label: 'Home',
    color: 'text-primary'
  },
  { 
    id: 'sales', 
    icon: TrendingUp, 
    label: 'Sales',
    color: 'text-success'
  },
  { 
    id: 'inventory', 
    icon: Package, 
    label: 'Stock',
    color: 'text-info'
  },
  { 
    id: 'finance', 
    icon: Wallet, 
    label: 'Money',
    color: 'text-warning'
  },
  { 
    id: 'promote', 
    icon: Share2, 
    label: 'Share',
    color: 'text-accent-foreground'
  },
];

export const BottomNavigation = ({ activeTab, onTabChange }: BottomNavigationProps) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg z-50" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}>
      <div className="flex items-center justify-around max-w-screen-xl mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "flex flex-col items-center justify-center flex-1 min-h-[64px] py-2 touch-feedback transition-all duration-150",
                isActive && "bg-primary/10"
              )}
            >
              <div className={cn(
                "transition-all duration-150 p-2.5 rounded-full",
                isActive ? "bg-primary scale-105" : "bg-muted"
              )}>
                <Icon 
                  className={cn(
                    "h-5 w-5 transition-colors duration-150",
                    isActive ? "text-primary-foreground" : item.color
                  )}
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </div>
              <span className={cn(
                "text-[11px] font-medium mt-1 transition-colors duration-150",
                isActive ? "text-primary" : "text-muted-foreground"
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
