import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Star, TrendingUp, Target } from 'lucide-react';

interface GreetingMessageProps {
  businessType: string;
  onClose: () => void;
  userName?: string;
}

export const GreetingMessage = ({ businessType, onClose, userName }: GreetingMessageProps) => {
  const { t } = useLanguage();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    setCurrentTime(new Date());
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getMotivationalMessage = () => {
    const messages = [
      "Every sale is a step towards your dreams! 🌟",
      "Your business is growing stronger every day! 💪",
      "Success is built one customer at a time! 🚀",
      "Today is full of new opportunities! ✨",
      "Your dedication will lead to great success! 🎯",
      "Keep pushing forward - you're doing amazing! 🔥"
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  return (
    <Card className="mb-6 border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Star className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">
                {getGreeting()}, {userName || 'Friend'}! 👋
              </h2>
            </div>
            <p className="text-muted-foreground mb-3">
              Welcome to your {t(businessType as any)} dashboard
            </p>
            <div className="flex items-center gap-2 p-3 bg-card rounded-lg border">
              <TrendingUp className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium text-foreground">
                {getMotivationalMessage()}
              </p>
            </div>
            <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Target className="h-4 w-4" />
                <span>Track your progress</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4" />
                <span>Grow your business</span>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="ml-4"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};