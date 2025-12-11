import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface DashboardCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  onClick?: () => void;
}

export const DashboardCard = ({ title, value, icon: Icon, trend, trendUp, onClick }: DashboardCardProps) => {
  return (
    <Card 
      className={`transition-all duration-150 touch-feedback select-none ${onClick ? 'cursor-pointer hover:bg-muted/50 active:scale-[0.98] active:bg-muted/70' : ''}`}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
        <CardTitle className="text-xs font-medium text-muted-foreground leading-tight">
          {title}
        </CardTitle>
        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="text-xl font-bold text-foreground break-all">{value}</div>
        {trend && (
          <p className={`text-[11px] ${trendUp ? 'text-success' : 'text-destructive'} mt-1 leading-tight font-medium`}>
            {trend}
          </p>
        )}
      </CardContent>
    </Card>
  );
};