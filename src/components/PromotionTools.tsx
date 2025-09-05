import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { QRCodeGenerator } from './QRCodeGenerator';
import { BusinessCardGenerator } from './BusinessCardGenerator';
import { SocialPostCreator } from './SocialPostCreator';
import { toast } from '@/hooks/use-toast';
import { 
  Share2, 
  Star, 
  Eye, 
  MessageCircle, 
  Facebook, 
  Instagram, 
  Linkedin,
  ExternalLink,
  QrCode,
  Camera,
  TrendingUp,
  Users,
  Target,
  Megaphone
} from 'lucide-react';

interface Campaign {
  id: string;
  platform: string;
  title: string;
  status: 'active' | 'paused' | 'completed';
  reach: number;
  engagement: number;
  cost: number;
}

export const PromotionTools = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('tools');
  const [campaigns, setCampaigns] = useState<Campaign[]>([
    {
      id: '1',
      platform: 'Google My Business',
      title: 'Local Business Listing',
      status: 'active',
      reach: 1250,
      engagement: 89,
      cost: 0
    },
    {
      id: '2',
      platform: 'Facebook',
      title: 'New Year Special Offer',
      status: 'active',
      reach: 850,
      engagement: 45,
      cost: 500
    },
    {
      id: '3',
      platform: 'Instagram',
      title: 'Behind the Scenes',
      status: 'completed',
      reach: 620,
      engagement: 78,
      cost: 300
    }
  ]);

  const [newCampaign, setNewCampaign] = useState({
    platform: '',
    title: '',
    budget: ''
  });

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

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

  const handleCreateCampaign = () => {
    if (!newCampaign.platform || !newCampaign.title) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const campaign: Campaign = {
      id: Date.now().toString(),
      platform: newCampaign.platform,
      title: newCampaign.title,
      status: 'active',
      reach: 0,
      engagement: 0,
      cost: parseFloat(newCampaign.budget) || 0
    };

    setCampaigns(prev => [campaign, ...prev]);
    setNewCampaign({ platform: '', title: '', budget: '' });
    setIsCreateDialogOpen(false);
    
    toast({
      title: "Campaign Created",
      description: "Your marketing campaign has been created successfully",
    });
  };

  const toggleCampaignStatus = (id: string) => {
    setCampaigns(prev => prev.map(campaign => 
      campaign.id === id 
        ? { ...campaign, status: campaign.status === 'active' ? 'paused' : 'active' as 'active' | 'paused' | 'completed' }
        : campaign
    ));
    
    toast({
      title: "Campaign Updated",
      description: "Campaign status has been updated",
    });
  };

  const getBusinessData = () => ({
    name: profile?.shop_name || 'Your Business',
    phone: '+91 98765 43210', // This should come from profile
    email: user?.email || 'business@example.com',
    address: 'Business Address', // This should come from profile
    website: 'https://yourbusiness.com',
    category: profile?.shop_category || 'Business'
  });

  const promotionTools = [
    { 
      id: 'qr-code', 
      name: 'QR Code Generator', 
      icon: QrCode, 
      description: 'Generate QR codes for easy contact sharing',
      color: 'bg-blue-100 text-blue-800'
    },
    { 
      id: 'business-card', 
      name: 'Digital Business Card', 
      icon: ExternalLink, 
      description: 'Create beautiful digital business cards',
      color: 'bg-green-100 text-green-800'
    },
    { 
      id: 'social-posts', 
      name: 'Social Media Posts', 
      icon: Camera, 
      description: 'Design engaging social media content',
      color: 'bg-purple-100 text-purple-800'
    }
  ];

  const platforms = [
    { name: 'Google My Business', icon: Star, color: 'bg-yellow-100 text-yellow-800' },
    { name: 'Facebook', icon: Facebook, color: 'bg-blue-100 text-blue-800' },
    { name: 'Instagram', icon: Instagram, color: 'bg-pink-100 text-pink-800' },
    { name: 'WhatsApp Business', icon: MessageCircle, color: 'bg-green-100 text-green-800' },
    { name: 'LinkedIn', icon: Linkedin, color: 'bg-blue-100 text-blue-600' }
  ];

  const connectPlatform = (platformName: string) => {
    toast({
      title: "Platform Integration",
      description: `${platformName} integration coming soon! This will allow you to post directly to your ${platformName} account.`,
    });
  };

  const renderToolContent = () => {
    const businessData = getBusinessData();
    
    switch (selectedTool) {
      case 'qr-code':
        return <QRCodeGenerator businessData={businessData} />;
      case 'business-card':
        return <BusinessCardGenerator businessData={businessData} />;
      case 'social-posts':
        return <SocialPostCreator businessData={businessData} />;
      default:
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {promotionTools.map((tool) => {
              const Icon = tool.icon;
              return (
                <Card 
                  key={tool.id} 
                  className="border-dashed border-2 hover:border-primary transition-colors cursor-pointer"
                  onClick={() => setSelectedTool(tool.id)}
                >
                  <CardContent className="p-6 text-center">
                    <div className={`inline-flex p-3 rounded-full ${tool.color} mb-3`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <h4 className="font-medium mb-2">{tool.name}</h4>
                    <p className="text-sm text-muted-foreground">{tool.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tools" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Promotion Tools
          </TabsTrigger>
          <TabsTrigger value="platforms" className="flex items-center gap-2">
            <Share2 className="h-4 w-4" />
            Platforms
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="flex items-center gap-2">
            <Megaphone className="h-4 w-4" />
            Campaigns
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tools" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Marketing Tools
                </CardTitle>
                {selectedTool && (
                  <Button variant="outline" onClick={() => setSelectedTool(null)}>
                    ← Back to Tools
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {renderToolContent()}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="platforms" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5" />
                Platform Integrations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {platforms.map((platform) => {
                  const Icon = platform.icon;
                  return (
                    <Card key={platform.name} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${platform.color}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium">{platform.name}</h4>
                            <p className="text-sm text-muted-foreground">Connect & promote</p>
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => connectPlatform(platform.name)}
                          >
                            Connect
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              
              <Card className="mt-6 bg-muted/50">
                <CardContent className="p-6 text-center">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Coming Soon: Direct Publishing</h3>
                  <p className="text-muted-foreground mb-4">
                    Connect your social media accounts to publish content directly from Vyapaar Saathi AI. 
                    Schedule posts, track performance, and manage all your social presence in one place.
                  </p>
                  <Badge variant="secondary">Feature in Development</Badge>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Megaphone className="h-5 w-5" />
              Marketing Campaigns
            </h3>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>Create Campaign</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Campaign</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Platform</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {platforms.slice(0, 4).map((platform) => (
                        <Button
                          key={platform.name}
                          variant={newCampaign.platform === platform.name ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setNewCampaign(prev => ({ ...prev, platform: platform.name }))}
                        >
                          {platform.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="campaignTitle">Campaign Title</Label>
                    <Input
                      id="campaignTitle"
                      value={newCampaign.title}
                      onChange={(e) => setNewCampaign(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g., Summer Special Offer"
                    />
                  </div>
                  <div>
                    <Label htmlFor="budget">Budget (₹)</Label>
                    <Input
                      id="budget"
                      type="number"
                      value={newCampaign.budget}
                      onChange={(e) => setNewCampaign(prev => ({ ...prev, budget: e.target.value }))}
                      placeholder="0 (for free campaigns)"
                    />
                  </div>
                  <Button onClick={handleCreateCampaign} className="w-full">
                    Create Campaign
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {campaigns.map((campaign) => (
              <Card key={campaign.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{campaign.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">{campaign.platform}</p>
                    </div>
                    <Badge 
                      variant={
                        campaign.status === 'active' ? 'default' : 
                        campaign.status === 'paused' ? 'secondary' : 'outline'
                      }
                    >
                      {campaign.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="text-2xl font-bold">{campaign.reach}</div>
                        <div className="text-xs text-muted-foreground">Reach</div>
                      </div>
                      <div>
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="text-2xl font-bold">{campaign.engagement}</div>
                        <div className="text-xs text-muted-foreground">Engagement</div>
                      </div>
                      <div>
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <span className="text-sm">₹</span>
                        </div>
                        <div className="text-2xl font-bold">{campaign.cost}</div>
                        <div className="text-xs text-muted-foreground">Spent</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => toast({
                          title: "Campaign Details",
                          description: "Detailed analytics and performance metrics coming soon!",
                        })}
                      >
                        View Details
                      </Button>
                      <Button 
                        size="sm" 
                        variant={campaign.status === 'active' ? 'destructive' : 'default'}
                        className="flex-1"
                        onClick={() => toggleCampaignStatus(campaign.id)}
                      >
                        {campaign.status === 'active' ? 'Pause' : 'Resume'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};