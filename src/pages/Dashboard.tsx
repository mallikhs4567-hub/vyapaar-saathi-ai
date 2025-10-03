import { useSearchParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
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
  const [dashboardStats, setDashboardStats] = useState({
    todaySales: 0,
    totalRevenue: 0,
    lowStockCount: 0,
    pendingPayments: 0,
  });

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

  const fetchDashboardStats = useCallback(async () => {
    if (!user) return;

    // Fetch today's sales
    const today = new Date().toISOString().split('T')[0];
    const { data: salesData } = await supabase
      .from('Sales')
      .select('Amount')
      .eq('User_id', user.id)
      .eq('Date', today);

    const todaySales = salesData?.reduce((sum, sale) => sum + Number(sale.Amount || 0), 0) || 0;

    // Fetch total revenue from finance
    const { data: financeData } = await supabase
      .from('finance')
      .select('amount, type')
      .eq('user_id', user.id);

    const totalRevenue = financeData?.reduce((sum, record) => {
      return record.type === 'income' ? sum + Number(record.amount || 0) : sum;
    }, 0) || 0;

    // Fetch low stock items (stock quantity < 10)
    const { data: inventoryData } = await supabase
      .from('Inventory')
      .select('"Stock quantity"')
      .eq('user_id', user.id)
      .lt('"Stock quantity"', 10);

    const lowStockCount = inventoryData?.length || 0;

    // Fetch pending payments from finance (expenses not paid)
    const { data: expensesData } = await supabase
      .from('finance')
      .select('amount')
      .eq('user_id', user.id)
      .eq('type', 'expense');

    const pendingPayments = expensesData?.reduce((sum, expense) => sum + Number(expense.amount || 0), 0) || 0;

    setDashboardStats({
      todaySales,
      totalRevenue,
      lowStockCount,
      pendingPayments,
    });
  }, [user]);

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  // Subscribe to all tables for dashboard updates
  useRealtimeSubscription({
    table: 'Sales',
    userId: user?.id,
    events: ['INSERT', 'UPDATE', 'DELETE'],
    onDataChange: fetchDashboardStats,
    throttleMs: 5000,
  });

  useRealtimeSubscription({
    table: 'Inventory',
    userId: user?.id,
    events: ['INSERT', 'UPDATE', 'DELETE'],
    onDataChange: fetchDashboardStats,
    throttleMs: 5000,
  });

  useRealtimeSubscription({
    table: 'finance',
    userId: user?.id,
    events: ['INSERT', 'UPDATE', 'DELETE'],
    onDataChange: fetchDashboardStats,
    throttleMs: 5000,
  });

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
                value={`₹${dashboardStats.todaySales.toLocaleString()}`}
                icon={DollarSign}
                trend="Today's total"
                trendUp={dashboardStats.todaySales > 0}
                onClick={() => switchToTab('sales')}
              />
              <DashboardCard
                title={t('totalRevenue')}
                value={`₹${dashboardStats.totalRevenue.toLocaleString()}`}
                icon={TrendingUp}
                trend="Total income"
                trendUp={dashboardStats.totalRevenue > 0}
                onClick={() => switchToTab('finance')}
              />
              <DashboardCard
                title={t('lowStock')}
                value={dashboardStats.lowStockCount.toString()}
                icon={AlertCircle}
                trend="Items need restocking"
                onClick={() => switchToTab('inventory')}
              />
              <DashboardCard
                title={t('pendingPayments')}
                value={`₹${dashboardStats.pendingPayments.toLocaleString()}`}
                icon={Package}
                trend="Total expenses"
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