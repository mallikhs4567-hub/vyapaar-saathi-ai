import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSelector } from '@/components/LanguageSelector';

const Index = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="absolute top-4 right-4">
        <LanguageSelector />
      </div>
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold text-foreground">
          {t('welcome')} {t('appName')}
        </h1>
        <p className="text-xl text-muted-foreground">
          {t('selectBusinessType')}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 max-w-2xl">
          <div className="p-6 border rounded-lg hover:bg-accent transition-colors cursor-pointer">
            <h3 className="text-lg font-semibold">{t('barber')}</h3>
          </div>
          <div className="p-6 border rounded-lg hover:bg-accent transition-colors cursor-pointer">
            <h3 className="text-lg font-semibold">{t('grocery')}</h3>
          </div>
          <div className="p-6 border rounded-lg hover:bg-accent transition-colors cursor-pointer">
            <h3 className="text-lg font-semibold">{t('hotel')}</h3>
          </div>
          <div className="p-6 border rounded-lg hover:bg-accent transition-colors cursor-pointer">
            <h3 className="text-lg font-semibold">{t('clothing')}</h3>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
