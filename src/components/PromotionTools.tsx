import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
  Camera
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
  const [campaigns, setCampaigns] = useState<Campaign[]>([
    {
      id: '1',
      platform: 'Google My Business',
      title: 'Local Barber Shop Listing',
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
      title: 'Before/After Photos',
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

  const handleCreateCampaign = () => {
    if (!newCampaign.platform || !newCampaign.title) return;

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
  };

  const platforms = [
    { name: 'Google My Business', icon: Star, color: 'bg-yellow-100 text-yellow-800' },
    { name: 'Facebook', icon: Facebook, color: 'bg-blue-100 text-blue-800' },
    { name: 'Instagram', icon: Instagram, color: 'bg-pink-100 text-pink-800' },
    { name: 'WhatsApp Business', icon: MessageCircle, color: 'bg-green-100 text-green-800' },
    { name: 'LinkedIn', icon: Linkedin, color: 'bg-blue-100 text-blue-600' }
  ];

  return (
    <div className="space-y-6">
      {/* Quick Share Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Quick Business Sharing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-dashed border-2 hover:border-primary transition-colors cursor-pointer">
              <CardContent className="p-6 text-center">
                <QrCode className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <h4 className="font-medium">QR Code</h4>
                <p className="text-sm text-muted-foreground">Generate QR for contact</p>
              </CardContent>
            </Card>

            <Card className="border-dashed border-2 hover:border-primary transition-colors cursor-pointer">
              <CardContent className="p-6 text-center">
                <ExternalLink className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <h4 className="font-medium">Business Card</h4>
                <p className="text-sm text-muted-foreground">Digital business card</p>
              </CardContent>
            </Card>

            <Card className="border-dashed border-2 hover:border-primary transition-colors cursor-pointer">
              <CardContent className="p-6 text-center">
                <Camera className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <h4 className="font-medium">Photo Posts</h4>
                <p className="text-sm text-muted-foreground">Create social posts</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Platform Integration */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Integrations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {platforms.map((platform) => {
              const Icon = platform.icon;
              return (
                <Card key={platform.name} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${platform.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{platform.name}</h4>
                        <p className="text-sm text-muted-foreground">Connect & promote</p>
                      </div>
                      <Button size="sm" variant="outline">
                        Connect
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Active Campaigns */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Marketing Campaigns</h3>
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
                      <MessageCircle className="h-4 w-4 text-muted-foreground" />
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
                  <Button size="sm" variant="outline" className="flex-1">
                    View Details
                  </Button>
                  <Button 
                    size="sm" 
                    variant={campaign.status === 'active' ? 'destructive' : 'default'}
                    className="flex-1"
                  >
                    {campaign.status === 'active' ? 'Pause' : 'Resume'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};