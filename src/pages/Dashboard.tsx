import { useSearchParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { DashboardCard } from '@/components/DashboardCard';
import { AIAssistant } from '@/components/AIAssistant';
import { AIInsights } from '@/components/AIInsights';
import { SalesManagement } from '@/components/SalesManagement';
import { InventoryManagement } from '@/components/InventoryManagement';
import { FinanceTracking } from '@/components/FinanceTracking';
import { PromotionTools } from '@/components/PromotionTools';
import { LanguageSelector } from '@/components/LanguageSelector';
import { GreetingMessage } from '@/components/GreetingMessage';
import { BottomNavigation } from '@/components/BottomNavigation';
import { Button } from '@/components/ui/button';
import { 
  DollarSign, 
  Package, 
  TrendingUp, 
  AlertCircle,
  Share2,
  BarChart3,
  Wallet,
  LogOut
} from 'lucide-react';

export default function Dashboard() {
  const { t } = useLanguage();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const businessType = searchParams.get('businessType') || 'general';
  const [showGreeting, setShowGreeting] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const containerRef = useRef<HTMLDivElement>(null);
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
    
    const { data } = await supabase
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
    throttleMs: 500,
  });

  useRealtimeSubscription({
    table: 'Inventory',
    userId: user?.id,
    events: ['INSERT', 'UPDATE', 'DELETE'],
    onDataChange: fetchDashboardStats,
    throttleMs: 500,
  });

  useRealtimeSubscription({
    table: 'finance',
    userId: user?.id,
    events: ['INSERT', 'UPDATE', 'DELETE'],
    onDataChange: fetchDashboardStats,
    throttleMs: 500,
  });

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/', { replace: true });
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

  return (
    <div ref={containerRef} className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center gap-2">
            {/* Logo and Title */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/70 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                <span className="text-lg font-bold text-primary-foreground">VS</span>
              </div>
              <div className="flex flex-col min-w-0">
                <h1 className="text-lg font-bold text-foreground truncate">
                  {profile?.shop_name || 'Vyapaar Saathi'}
                </h1>
                {profile?.shop_category && (
                  <span className="text-xs text-muted-foreground truncate">
                    {profile.shop_category}
                  </span>
                )}
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <LanguageSelector />
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="px-2">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-4">
        {/* Dashboard Content */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-fade-in">
            {/* Greeting Message */}
            {showGreeting && (
              <GreetingMessage 
                businessType={profile?.shop_category || businessType} 
                onClose={() => setShowGreeting(false)} 
              />
            )}
            
            {/* Overview Cards */}
            <div className="grid grid-cols-2 gap-3">
              <DashboardCard
                title="Today Sales"
                value={`₹${dashboardStats.todaySales.toLocaleString()}`}
                icon={DollarSign}
                trend="Today's total"
                trendUp={dashboardStats.todaySales > 0}
                onClick={() => setActiveTab('sales')}
              />
              <DashboardCard
                title="Total Income"
                value={`₹${dashboardStats.totalRevenue.toLocaleString()}`}
                icon={TrendingUp}
                trend="All time"
                trendUp={dashboardStats.totalRevenue > 0}
                onClick={() => setActiveTab('finance')}
              />
              <DashboardCard
                title="Low Stock"
                value={dashboardStats.lowStockCount.toString()}
                icon={AlertCircle}
                trend="Need restock"
                onClick={() => setActiveTab('inventory')}
              />
              <DashboardCard
                title="Expenses"
                value={`₹${dashboardStats.pendingPayments.toLocaleString()}`}
                icon={Package}
                trend="Total"
                onClick={() => setActiveTab('finance')}
              />
            </div>

            {/* AI Insights */}
            <AIInsights section="dashboard" />

            {/* Main Content */}
            <div className="space-y-4">
              <AIAssistant />
              <div className="p-6 border rounded-xl bg-card shadow-sm">
                <h3 className="text-lg font-semibold mb-4 text-foreground">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col items-center justify-center gap-2 hover:bg-primary/10 hover:border-primary"
                    onClick={() => setActiveTab('finance')}
                  >
                    <BarChart3 className="h-7 w-7 text-primary" />
                    <span className="text-sm font-medium">Reports</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col items-center justify-center gap-2 hover:bg-primary/10 hover:border-primary"
                    onClick={() => setActiveTab('promote')}
                  >
                    <Share2 className="h-7 w-7 text-primary" />
                    <span className="text-sm font-medium">Share</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col items-center justify-center gap-2 hover:bg-primary/10 hover:border-primary"
                    onClick={() => setActiveTab('inventory')}
                  >
                    <Package className="h-7 w-7 text-primary" />
                    <span className="text-sm font-medium">Add Stock</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col items-center justify-center gap-2 hover:bg-primary/10 hover:border-primary"
                    onClick={() => setActiveTab('sales')}
                  >
                    <Wallet className="h-7 w-7 text-primary" />
                    <span className="text-sm font-medium">Add Sale</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sales Content */}
        {activeTab === 'sales' && (
          <div className="space-y-4 animate-fade-in">
            <AIInsights section="sales" />
            <SalesManagement />
          </div>
        )}

        {/* Inventory Content */}
        {activeTab === 'inventory' && (
          <div className="space-y-4 animate-fade-in">
            <AIInsights section="inventory" />
            <InventoryManagement />
          </div>
        )}

        {/* Finance Content */}
        {activeTab === 'finance' && (
          <div className="space-y-4 animate-fade-in">
            <AIInsights section="finance" />
            <FinanceTracking />
          </div>
        )}

        {/* Promote Content */}
        {activeTab === 'promote' && (
          <div className="animate-fade-in">
            <PromotionTools />
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
