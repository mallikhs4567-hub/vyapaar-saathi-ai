import { Home, DollarSign, Package, Wallet, Share2, TrendingUp } from 'lucide-react';
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
    id: 'billing', 
    icon: DollarSign, 
    label: 'Bills',
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
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg z-50 pb-safe">
      <div className="flex items-center justify-around h-20 max-w-screen-xl mx-auto px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "flex flex-col items-center justify-center flex-1 gap-1 transition-all duration-200 py-2 rounded-lg",
                isActive && "bg-primary/10"
              )}
            >
              <div className={cn(
                "transition-all duration-200 p-2 rounded-full",
                isActive ? "bg-primary scale-110" : "bg-muted"
              )}>
                <Icon 
                  className={cn(
                    "h-6 w-6 transition-colors duration-200",
                    isActive ? "text-primary-foreground" : item.color
                  )}
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </div>
              <span className={cn(
                "text-xs font-medium transition-colors duration-200",
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
