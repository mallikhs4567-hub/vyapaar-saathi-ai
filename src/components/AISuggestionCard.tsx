import { Card } from '@/components/ui/card';
import { Lightbulb, TrendingUp, AlertCircle } from 'lucide-react';

interface AISuggestion {
  type: 'insight' | 'trend' | 'alert';
  text: string;
}

export const AISuggestionCard = () => {
  const suggestions: AISuggestion[] = [
    { type: 'alert', text: '3 items low stock' },
    { type: 'trend', text: 'Weekly sales up 8%' },
  ];

  const getIcon = (type: AISuggestion['type']) => {
    switch (type) {
      case 'insight':
        return <Lightbulb className="h-4 w-4 text-warning" />;
      case 'trend':
        return <TrendingUp className="h-4 w-4 text-success" />;
      case 'alert':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
    }
  };

  return (
    <Card className="p-4 bg-card border-0 rounded-[14px]">
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground">AI Suggestions</h3>
      </div>
      <div className="space-y-2">
        {suggestions.map((suggestion, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            {getIcon(suggestion.type)}
            <span className="text-muted-foreground">{suggestion.text}</span>
          </div>
        ))}
      </div>
    </Card>
  );
};
