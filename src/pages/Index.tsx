import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { LanguageSelector } from '@/components/LanguageSelector';
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
      <div className="absolute top-4 right-4 flex items-center gap-4 animate-fade-in">
        <LanguageSelector />
        <Button onClick={() => navigate('/auth')} variant="outline">
          Get Started
        </Button>
      </div>
      
      <div className="text-center space-y-8 max-w-4xl animate-scale-in">
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
          <div className="animate-fade-in" style={{ animationDelay: '0.8s' }}>
            <Button 
              onClick={() => navigate('/auth')} 
              size="lg"
              className="mt-6 hover-scale"
            >
              Start Your Business Journey
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
