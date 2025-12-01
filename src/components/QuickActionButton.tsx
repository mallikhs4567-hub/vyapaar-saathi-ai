import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface QuickActionButtonProps {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
}

export const QuickActionButton = ({ 
  icon: Icon, 
  label, 
  onClick,
  variant = 'primary' 
}: QuickActionButtonProps) => {
  return (
    <Button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center h-20 gap-2 rounded-[18px] flex-1",
        variant === 'primary' ? "bg-primary hover:bg-primary/90" : "bg-primary-dark hover:bg-primary-dark/90"
      )}
    >
      <Icon className="h-6 w-6" />
      <span className="text-xs font-medium">{label}</span>
    </Button>
  );
};
