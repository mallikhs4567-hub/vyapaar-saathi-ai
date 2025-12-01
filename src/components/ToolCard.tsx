import { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface ToolCardProps {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  locked?: boolean;
}

export const ToolCard = ({ icon: Icon, label, onClick, locked }: ToolCardProps) => {
  return (
    <Card
      onClick={onClick}
      className="flex flex-col items-center justify-center p-6 gap-3 cursor-pointer hover:shadow-lg transition-all duration-200 bg-card border-0 rounded-[14px] relative"
    >
      {locked && (
        <div className="absolute top-2 right-2 bg-warning text-warning-foreground px-2 py-0.5 rounded-full text-[10px] font-bold">
          PRO
        </div>
      )}
      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <span className="text-sm font-semibold text-foreground text-center">{label}</span>
    </Card>
  );
};
