import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Scissors, ShoppingCart, Hotel, Shirt } from 'lucide-react';

interface BusinessTypeCardProps {
  type: 'barber' | 'grocery' | 'hotel' | 'clothing';
}

const businessTypeIcons = {
  barber: Scissors,
  grocery: ShoppingCart,
  hotel: Hotel,
  clothing: Shirt,
};

export const BusinessTypeCard = ({ type }: BusinessTypeCardProps) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const Icon = businessTypeIcons[type];

  const handleClick = () => {
    navigate(`/dashboard?businessType=${type}`);
  };

  return (
    <Card 
      className="hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-105 border-2 hover:border-primary/50" 
      onClick={handleClick}
    >
      <CardContent className="p-6 text-center space-y-4">
        <div className="flex justify-center">
          <Icon className="h-12 w-12 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">{t(type)}</h3>
      </CardContent>
    </Card>
  );
};