import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { BottomNavigation } from '@/components/BottomNavigation';
import { SearchBar } from '@/components/SearchBar';
import { QuickActionButton } from '@/components/QuickActionButton';
import { ToolCard } from '@/components/ToolCard';
import { AISuggestionCard } from '@/components/AISuggestionCard';
import { AIInsights } from '@/components/AIInsights';
import { PageTransition } from '@/components/PageTransition';
import { Receipt, Package, UserPlus, Users, Megaphone } from 'lucide-react';
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  useSwipeNavigation({ enabled: false });

  const renderContent = () => {
    switch (activeTab) {
      case 'tools':
        return (
          <div className="space-y-6 pb-24">
            <div>
              <h2 className="text-xl font-bold text-foreground mb-4">Business Tools</h2>
              <div className="grid grid-cols-2 gap-3">
                <ToolCard icon={Receipt} label="Billing" />
                <ToolCard icon={Package} label="Inventory" />
                <ToolCard icon={Users} label="Customers" />
                <ToolCard icon={Megaphone} label="Marketing" locked />
              </div>
            </div>
          </div>
        );
      case 'insights':
        return (
          <div className="pb-24">
            <AIInsights section="dashboard" />
          </div>
        );
      case 'profile':
        return (
          <div className="pb-24">
            <div className="flex justify-center mt-8">
              <button 
                onClick={() => navigate('/profile')}
                className="text-primary hover:underline"
              >
                Go to Profile Settings
              </button>
            </div>
          </div>
        );
      default:
        return (
          <div className="space-y-6 pb-24">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-1">Vyapaar Saathi AI</h1>
              <p className="text-sm text-muted-foreground">Aapka Roz ka Vyapaar Assistant</p>
            </div>

            <SearchBar 
              placeholder="Search products, bills, customers..."
              value={searchQuery}
              onChange={setSearchQuery}
            />

            <div className="flex gap-3">
              <QuickActionButton 
                icon={Receipt} 
                label="Create Bill" 
                variant="primary"
              />
              <QuickActionButton 
                icon={Package} 
                label="Add Product"
                variant="secondary"
              />
              <QuickActionButton 
                icon={UserPlus} 
                label="Add Customer"
                variant="primary"
              />
            </div>

            <AISuggestionCard />

            <div>
              <h2 className="text-lg font-bold text-foreground mb-4">Quick Access</h2>
              <div className="grid grid-cols-2 gap-3">
                <ToolCard icon={Receipt} label="Billing" />
                <ToolCard icon={Package} label="Inventory" />
                <ToolCard icon={Users} label="Customers" />
                <ToolCard icon={Megaphone} label="Marketing" locked />
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-background pb-20">
        <div className="container mx-auto p-5 max-w-screen-xl">
          {renderContent()}
        </div>
        <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} />
      </div>
    </PageTransition>
  );
};

export default Dashboard;
