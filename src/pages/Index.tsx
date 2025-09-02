import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSelector } from '@/components/LanguageSelector';
import { BusinessTypeCard } from '@/components/BusinessTypeCard';

const Index = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="absolute top-4 right-4">
        <LanguageSelector />
      </div>
      <div className="text-center space-y-8 max-w-4xl">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">
            {t('welcome')} {t('appName')}
          </h1>
          <p className="text-xl text-muted-foreground">
            {t('selectBusinessType')}
          </p>
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
