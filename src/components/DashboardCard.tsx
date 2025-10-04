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
      className={`hover:shadow-md transition-shadow ${onClick ? 'cursor-pointer hover:bg-muted/50' : ''}`}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-6">
        <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground leading-tight">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      </CardHeader>
      <CardContent className="p-3 md:p-6 pt-0">
        <div className="text-lg md:text-2xl font-bold text-foreground break-all">{value}</div>
        {trend && (
          <p className={`text-[10px] md:text-xs ${trendUp ? 'text-green-600' : 'text-red-600'} mt-1 leading-tight`}>
            {trend}
          </p>
        )}
      </CardContent>
    </Card>
  );
};