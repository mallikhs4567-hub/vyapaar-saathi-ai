import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { LanguageSelector } from '@/components/LanguageSelector';
import { BusinessTypeCard } from '@/components/BusinessTypeCard';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const Index = () => {
  const { t } = useLanguage();
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !loading) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="absolute top-4 right-4 flex items-center gap-4">
        <LanguageSelector />
        <Button onClick={() => navigate('/auth')} variant="outline">
          Get Started
        </Button>
      </div>
      
      <div className="text-center space-y-8 max-w-4xl">
        <div className="space-y-6">
          <div className="flex items-center justify-center mb-8">
            <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center">
              <span className="text-3xl font-bold text-primary-foreground">VS</span>
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">
            {t('welcome')} {t('appName')}
          </h1>
          <p className="text-xl text-muted-foreground">
            Your AI-powered business growth partner
          </p>
          <Button 
            onClick={() => navigate('/auth')} 
            size="lg"
            className="mt-6"
          >
            Start Your Business Journey
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
          <BusinessTypeCard type="barber" />
          <BusinessTypeCard type="grocery" />
          <BusinessTypeCard type="hotel" />
          <BusinessTypeCard type="clothing" />
        </div>
      </div>
    </div>
  );
};

export default Index;
