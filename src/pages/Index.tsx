import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { LanguageSelector } from '@/components/LanguageSelector';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart3, Package, TrendingUp, Smartphone, Sparkles, MessageSquare, Download } from 'lucide-react';

const Index = () => {
  const { t } = useLanguage();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    if (user && !loading) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    // Show install prompt on mobile devices that aren't already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile && !isStandalone) {
      setShowInstallPrompt(true);
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary mb-2">Vyapaar Saathi AI</div>
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  const features = [
    {
      icon: BarChart3,
      title: 'Sales Tracking',
      description: 'Monitor your sales in real-time with detailed analytics',
      color: 'text-blue-500'
    },
    {
      icon: Package,
      title: 'Inventory Management',
      description: 'Keep track of your stock levels and get low stock alerts',
      color: 'text-green-500'
    },
    {
      icon: TrendingUp,
      title: 'Financial Insights',
      description: 'Track income, expenses, and profit margins effortlessly',
      color: 'text-purple-500'
    },
    {
      icon: Smartphone,
      title: 'Promotion Tools',
      description: 'Create QR codes, business cards, and social posts instantly',
      color: 'text-orange-500'
    },
    {
      icon: Sparkles,
      title: 'AI Assistant',
      description: 'Get smart business insights powered by AI',
      color: 'text-pink-500'
    },
    {
      icon: MessageSquare,
      title: 'Multi-language',
      description: 'Available in English, Hindi, and Kannada',
      color: 'text-cyan-500'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="absolute top-4 right-4 flex items-center gap-4 animate-fade-in">
        <LanguageSelector />
        <Button onClick={() => navigate('/auth')} variant="outline">
          Get Started
        </Button>
      </div>
      
      <div className="text-center space-y-12 max-w-5xl w-full animate-scale-in">
        <div className="space-y-6">
          <div className="flex items-center justify-center mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center hover-scale">
              <span className="text-3xl font-bold text-primary-foreground">VS</span>
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground animate-fade-in" style={{ animationDelay: '0.4s' }}>
            {t('welcome')} {t('appName')}
          </h1>
          <p className="text-xl text-muted-foreground animate-fade-in" style={{ animationDelay: '0.6s' }}>
            Your AI-powered business growth partner
          </p>
        </div>

        <div className="animate-fade-in px-4 md:px-12" style={{ animationDelay: '0.8s' }}>
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <CarouselItem key={index} className="pl-2 md:pl-4 basis-full md:basis-1/2 lg:basis-1/3">
                    <Card className="border-2 hover:border-primary/50 transition-all duration-300 h-full">
                      <CardContent className="p-6 text-center space-y-4 flex flex-col items-center justify-center h-full min-h-[200px]">
                        <div className={`${feature.color} bg-muted rounded-full p-4`}>
                          <Icon className="h-8 w-8" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground">{feature.title}</h3>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                      </CardContent>
                    </Card>
                  </CarouselItem>
                );
              })}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex" />
            <CarouselNext className="hidden md:flex" />
          </Carousel>
        </div>

        <div className="animate-fade-in" style={{ animationDelay: '1s' }}>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              onClick={() => navigate('/auth')} 
              size="lg"
              className="hover-scale"
            >
              Start Your Business Journey
            </Button>
            
            {showInstallPrompt && (
              <Button
                onClick={() => navigate('/install')}
                size="lg"
                variant="outline"
                className="hover-scale"
              >
                <Download className="mr-2 h-5 w-5" />
                Install App
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
