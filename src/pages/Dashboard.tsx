import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { DashboardCard } from '@/components/DashboardCard';
import { AIAssistant } from '@/components/AIAssistant';
import { LanguageSelector } from '@/components/LanguageSelector';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DollarSign, 
  Package, 
  TrendingUp, 
  AlertCircle,
  Share2,
  BarChart3,
  Wallet
} from 'lucide-react';

export default function Dashboard() {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const businessType = searchParams.get('businessType') || 'general';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-foreground">
            {t('appName')} - {t(businessType as any)}
          </h1>
          <LanguageSelector />
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard">{t('dashboard')}</TabsTrigger>
            <TabsTrigger value="sales">{t('sales')}</TabsTrigger>
            <TabsTrigger value="inventory">{t('inventory')}</TabsTrigger>
            <TabsTrigger value="finance">{t('finance')}</TabsTrigger>
            <TabsTrigger value="promote">{t('promote')}</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <DashboardCard
                title={t('todaySales')}
                value="₹12,450"
                icon={DollarSign}
                trend="+12.5% from yesterday"
                trendUp={true}
              />
              <DashboardCard
                title={t('totalRevenue')}
                value="₹3,45,600"
                icon={TrendingUp}
                trend="+8.2% this month"
                trendUp={true}
              />
              <DashboardCard
                title={t('lowStock')}
                value="5"
                icon={AlertCircle}
                trend="Items need restocking"
              />
              <DashboardCard
                title={t('pendingPayments')}
                value="₹8,900"
                icon={Package}
                trend="3 pending invoices"
              />
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AIAssistant />
              <div className="space-y-6">
                <div className="p-6 border rounded-lg bg-card">
                  <h3 className="text-lg font-semibold mb-4 text-foreground">Quick Actions</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                      <BarChart3 className="h-6 w-6 mb-2" />
                      View Reports
                    </Button>
                    <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                      <Share2 className="h-6 w-6 mb-2" />
                      Share Business
                    </Button>
                    <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                      <Package className="h-6 w-6 mb-2" />
                      Add Inventory
                    </Button>
                    <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                      <Wallet className="h-6 w-6 mb-2" />
                      Record Sale
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="sales">
            <div className="p-6 border rounded-lg bg-card">
              <h3 className="text-xl font-semibold mb-4 text-foreground">{t('sales')} Management</h3>
              <p className="text-muted-foreground">Sales tracking and analytics will be implemented here.</p>
            </div>
          </TabsContent>

          <TabsContent value="inventory">
            <div className="p-6 border rounded-lg bg-card">
              <h3 className="text-xl font-semibold mb-4 text-foreground">{t('inventory')} Management</h3>
              <p className="text-muted-foreground">Inventory tracking and management will be implemented here.</p>
            </div>
          </TabsContent>

          <TabsContent value="finance">
            <div className="p-6 border rounded-lg bg-card">
              <h3 className="text-xl font-semibold mb-4 text-foreground">{t('finance')} Tracking</h3>
              <p className="text-muted-foreground">Financial reports and tracking will be implemented here.</p>
            </div>
          </TabsContent>

          <TabsContent value="promote">
            <div className="p-6 border rounded-lg bg-card">
              <h3 className="text-xl font-semibold mb-4 text-foreground">{t('promote')} Your Business</h3>
              <p className="text-muted-foreground">Business promotion tools and platform integrations will be implemented here.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}