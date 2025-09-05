import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Share2, Palette } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import html2canvas from 'html2canvas';

interface BusinessCardGeneratorProps {
  businessData: {
    name: string;
    phone: string;
    email: string;
    address: string;
    website?: string;
    category?: string;
  };
}

export const BusinessCardGenerator = ({ businessData }: BusinessCardGeneratorProps) => {
  const [cardData, setCardData] = useState({
    template: 'modern',
    primaryColor: '#3b82f6',
    secondaryColor: '#1e40af',
    textColor: '#ffffff',
    tagline: 'Your trusted business partner'
  });
  const cardRef = useRef<HTMLDivElement>(null);

  const templates = [
    { id: 'modern', name: 'Modern' },
    { id: 'classic', name: 'Classic' },
    { id: 'minimal', name: 'Minimal' },
    { id: 'gradient', name: 'Gradient' }
  ];

  const colors = [
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Green', value: '#10b981' },
    { name: 'Purple', value: '#8b5cf6' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Pink', value: '#ec4899' }
  ];

  const downloadCard = async () => {
    if (!cardRef.current) return;

    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: null,
        width: 800,
        height: 500
      });
      
      const link = document.createElement('a');
      link.download = `${businessData.name}-business-card.png`;
      link.href = canvas.toDataURL();
      link.click();
      
      toast({
        title: "Success",
        description: "Business card downloaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download business card",
        variant: "destructive",
      });
    }
  };

  const shareCard = async () => {
    if (!cardRef.current) return;

    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: null,
        width: 800,
        height: 500
      });
      
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        
        const file = new File([blob], `${businessData.name}-business-card.png`, { type: 'image/png' });
        
        if (navigator.share) {
          try {
            await navigator.share({
              title: `${businessData.name} Business Card`,
              text: `Check out my digital business card!`,
              files: [file],
            });
          } catch (error) {
            // Fallback to download
            const link = document.createElement('a');
            link.download = file.name;
            link.href = URL.createObjectURL(file);
            link.click();
          }
        } else {
          const link = document.createElement('a');
          link.download = file.name;
          link.href = URL.createObjectURL(file);
          link.click();
        }
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to share business card",
        variant: "destructive",
      });
    }
  };

  const getCardStyle = () => {
    const baseStyle = {
      width: '400px',
      height: '250px',
      borderRadius: '16px',
      padding: '24px',
      color: cardData.textColor,
      position: 'relative' as const,
      overflow: 'hidden'
    };

    switch (cardData.template) {
      case 'modern':
        return {
          ...baseStyle,
          background: `linear-gradient(135deg, ${cardData.primaryColor} 0%, ${cardData.secondaryColor} 100%)`,
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
        };
      case 'classic':
        return {
          ...baseStyle,
          backgroundColor: cardData.primaryColor,
          border: `2px solid ${cardData.secondaryColor}`
        };
      case 'minimal':
        return {
          ...baseStyle,
          backgroundColor: '#ffffff',
          color: cardData.primaryColor,
          border: `1px solid ${cardData.primaryColor}`
        };
      case 'gradient':
        return {
          ...baseStyle,
          background: `radial-gradient(circle at 30% 30%, ${cardData.primaryColor} 0%, ${cardData.secondaryColor} 70%)`
        };
      default:
        return baseStyle;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Business Card Designer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Template</Label>
            <Select value={cardData.template} onValueChange={(value) => setCardData(prev => ({ ...prev, template: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Primary Color</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {colors.map((color) => (
                <button
                  key={color.value}
                  className="w-8 h-8 rounded-full border-2 border-white shadow-md"
                  style={{ backgroundColor: color.value }}
                  onClick={() => setCardData(prev => ({ ...prev, primaryColor: color.value }))}
                />
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="tagline">Business Tagline</Label>
            <Input
              id="tagline"
              value={cardData.tagline}
              onChange={(e) => setCardData(prev => ({ ...prev, tagline: e.target.value }))}
              placeholder="Your business tagline..."
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center mb-4">
            <div ref={cardRef} style={getCardStyle()}>
              <div className="h-full flex flex-col justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-1">{businessData.name}</h2>
                  {businessData.category && (
                    <p className="text-sm opacity-90 mb-3">{businessData.category}</p>
                  )}
                  <p className="text-sm opacity-90">{cardData.tagline}</p>
                </div>
                
                <div className="space-y-1 text-sm">
                  <p>📞 {businessData.phone}</p>
                  <p>✉️ {businessData.email}</p>
                  <p>📍 {businessData.address}</p>
                  {businessData.website && <p>🌐 {businessData.website}</p>}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2 justify-center">
            <Button onClick={downloadCard} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button onClick={shareCard}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};