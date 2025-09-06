import { useSearchParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { DashboardCard } from '@/components/DashboardCard';
import { AIAssistant } from '@/components/AIAssistant';
import { SalesManagement } from '@/components/SalesManagement';
import { InventoryManagement } from '@/components/InventoryManagement';
import { FinanceTracking } from '@/components/FinanceTracking';
import { PromotionTools } from '@/components/PromotionTools';
import { LanguageSelector } from '@/components/LanguageSelector';
import { GreetingMessage } from '@/components/GreetingMessage';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DollarSign, 
  Package, 
  TrendingUp, 
  AlertCircle,
  Share2,
  BarChart3,
  Wallet,
  Home,
  LogOut,
  User
} from 'lucide-react';

export default function Dashboard() {
  const { t } = useLanguage();
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const businessType = searchParams.get('businessType') || 'general';
  const [showGreeting, setShowGreeting] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
      return;
    }

    if (user) {
      fetchProfile();
    }
  }, [user, loading, navigate]);

  const fetchProfile = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (data) {
      setProfile(data);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
        return;
      }
      // Navigate to home page after successful sign out
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

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

  if (!user) {
    return null;
  }

  const switchToTab = (tabValue: string) => {
    const tabElement = document.querySelector(`[value="${tabValue}"]`) as HTMLElement;
    if (tabElement) {
      tabElement.click();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-primary-foreground">VS</span>
              </div>
              <h1 className="text-2xl font-bold text-foreground">
                {profile?.shop_name || 'Vyapaar Saathi AI'}
              </h1>
            </div>
            {profile?.shop_category && (
              <span className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm">
                {profile.shop_category}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <LanguageSelector />
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="text-sm">{profile?.full_name || user.email}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard">{t('dashboard')}</TabsTrigger>
            <TabsTrigger value="sales" data-tab="sales">{t('sales')}</TabsTrigger>
            <TabsTrigger value="inventory" data-tab="inventory">{t('inventory')}</TabsTrigger>
            <TabsTrigger value="finance" data-tab="finance">{t('finance')}</TabsTrigger>
            <TabsTrigger value="promote" data-tab="promote">{t('promote')}</TabsTrigger>
          </TabsList>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard">{t('dashboard')}</TabsTrigger>
            <TabsTrigger value="sales">{t('sales')}</TabsTrigger>
            <TabsTrigger value="inventory">{t('inventory')}</TabsTrigger>
            <TabsTrigger value="finance">{t('finance')}</TabsTrigger>
            <TabsTrigger value="promote">{t('promote')}</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Greeting Message */}
            {showGreeting && (
              <GreetingMessage 
                businessType={profile?.shop_category || businessType} 
                onClose={() => setShowGreeting(false)} 
              />
            )}
            
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <DashboardCard
                title={t('todaySales')}
                value="₹12,450"
                icon={DollarSign}
                trend="+12.5% from yesterday"
                trendUp={true}
                onClick={() => switchToTab('sales')}
              />
              <DashboardCard
                title={t('totalRevenue')}
                value="₹3,45,600"
                icon={TrendingUp}
                trend="+8.2% this month"
                trendUp={true}
                onClick={() => switchToTab('finance')}
              />
              <DashboardCard
                title={t('lowStock')}
                value="5"
                icon={AlertCircle}
                trend="Items need restocking"
                onClick={() => switchToTab('inventory')}
              />
              <DashboardCard
                title={t('pendingPayments')}
                value="₹8,900"
                icon={Package}
                trend="3 pending invoices"
                onClick={() => switchToTab('finance')}
              />
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AIAssistant />
              <div className="space-y-6">
                <div className="p-6 border rounded-lg bg-card">
                  <h3 className="text-lg font-semibold mb-4 text-foreground">Quick Actions</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Button 
                      variant="outline" 
                      className="h-20 flex flex-col items-center justify-center"
                      onClick={() => switchToTab('finance')}
                    >
                      <BarChart3 className="h-6 w-6 mb-2" />
                      View Reports
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-20 flex flex-col items-center justify-center"
                      onClick={() => switchToTab('promote')}
                    >
                      <Share2 className="h-6 w-6 mb-2" />
                      Share Business
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-20 flex flex-col items-center justify-center"
                      onClick={() => switchToTab('inventory')}
                    >
                      <Package className="h-6 w-6 mb-2" />
                      Add Inventory
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-20 flex flex-col items-center justify-center"
                      onClick={() => switchToTab('sales')}
                    >
                      <Wallet className="h-6 w-6 mb-2" />
                      Record Sale
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="sales">
            <SalesManagement />
          </TabsContent>

          <TabsContent value="inventory">
            <InventoryManagement />
          </TabsContent>

          <TabsContent value="finance">
            <FinanceTracking />
          </TabsContent>

          <TabsContent value="promote">
            <PromotionTools />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}