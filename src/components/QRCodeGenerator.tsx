import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Share2, Sparkles, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import QRCode from 'qrcode';
import { supabase } from '@/integrations/supabase/client';

interface QRCodeGeneratorProps {
  businessData: {
    name: string;
    phone: string;
    email: string;
    address: string;
    website?: string;
  };
}

export const QRCodeGenerator = ({ businessData }: QRCodeGeneratorProps) => {
  const [qrData, setQrData] = useState({
    type: 'contact',
    content: '',
    customText: ''
  });
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateVCard = () => {
    return `BEGIN:VCARD
VERSION:3.0
FN:${businessData.name}
ORG:${businessData.name}
TEL:${businessData.phone}
EMAIL:${businessData.email}
ADR:;;${businessData.address};;;;
${businessData.website ? `URL:${businessData.website}` : ''}
END:VCARD`;
  };

  const generateQRCode = async () => {
    let content = '';
    
    switch (qrData.type) {
      case 'contact':
        content = generateVCard();
        break;
      case 'phone':
        content = `tel:${businessData.phone}`;
        break;
      case 'email':
        content = `mailto:${businessData.email}`;
        break;
      case 'whatsapp':
        content = `https://wa.me/${businessData.phone.replace(/\D/g, '')}?text=${encodeURIComponent(qrData.customText || 'Hello!')}`;
        break;
      case 'website':
        content = businessData.website || '';
        break;
      case 'custom':
        content = qrData.content;
        break;
    }

    if (!content) {
      toast({
        title: "Error",
        description: "Please provide content for the QR code",
        variant: "destructive",
      });
      return;
    }

    try {
      const url = await QRCode.toDataURL(content, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      
      setQrCodeUrl(url);
      toast({
        title: "QR Code Generated",
        description: "Your QR code is ready to download or share",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate QR code",
        variant: "destructive",
      });
    }
  };

  const downloadQRCode = () => {
    if (!qrCodeUrl) return;

    const link = document.createElement('a');
    link.download = `${businessData.name}-qr-code.png`;
    link.href = qrCodeUrl;
    link.click();
  };

  const generateAIContent = async () => {
    if (qrData.type !== 'whatsapp' && qrData.type !== 'custom') {
      toast({
        title: "Not Available",
        description: "AI content generation is only available for WhatsApp and Custom QR codes",
      });
      return;
    }

    setIsGeneratingContent(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-qr-content', {
        body: {
          businessName: businessData.name,
          category: businessData.name,
          qrType: qrData.type
        }
      });

      if (error) throw error;

      if (qrData.type === 'whatsapp') {
        setQrData(prev => ({ ...prev, customText: data.content }));
      } else {
        setQrData(prev => ({ ...prev, content: data.content }));
      }

      toast({
        title: "Content Generated",
        description: "AI-generated content has been added",
      });
    } catch (error: any) {
      console.error('Generate content error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate AI content",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingContent(false);
    }
  };

  const shareQRCode = async () => {
    if (!qrCodeUrl) return;

    if (navigator.share) {
      try {
        // Convert data URL to blob
        const response = await fetch(qrCodeUrl);
        const blob = await response.blob();
        const file = new File([blob], `${businessData.name}-qr-code.png`, { type: 'image/png' });
        
        await navigator.share({
          title: `${businessData.name} QR Code`,
          text: `Scan this QR code to connect with ${businessData.name}`,
          files: [file],
        });
      } catch (error) {
        downloadQRCode();
      }
    } else {
      downloadQRCode();
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>QR Code Generator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>QR Code Type</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
              {[
                { value: 'contact', label: 'Contact Card' },
                { value: 'phone', label: 'Phone Call' },
                { value: 'email', label: 'Email' },
                { value: 'whatsapp', label: 'WhatsApp' },
                { value: 'website', label: 'Website' },
                { value: 'custom', label: 'Custom' },
              ].map((type) => (
                <Button
                  key={type.value}
                  variant={qrData.type === type.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setQrData(prev => ({ ...prev, type: type.value }))}
                >
                  {type.label}
                </Button>
              ))}
            </div>
          </div>

          {(qrData.type === 'whatsapp' || qrData.type === 'custom') && (
            <Button onClick={generateAIContent} variant="outline" className="w-full" disabled={isGeneratingContent}>
              {isGeneratingContent ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
              {isGeneratingContent ? 'Generating...' : 'Generate AI Content'}
            </Button>
          )}

          {qrData.type === 'whatsapp' && (
            <div>
              <Label htmlFor="whatsappText">WhatsApp Message (Optional)</Label>
              <Input
                id="whatsappText"
                value={qrData.customText}
                onChange={(e) => setQrData(prev => ({ ...prev, customText: e.target.value }))}
                placeholder="Hello! I'm interested in your services..."
              />
            </div>
          )}

          {qrData.type === 'custom' && (
            <div>
              <Label htmlFor="customContent">Custom Content</Label>
              <Textarea
                id="customContent"
                value={qrData.content}
                onChange={(e) => setQrData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Enter any text, URL, or data you want to encode"
                rows={3}
              />
            </div>
          )}

          <Button onClick={generateQRCode} className="w-full">
            Generate QR Code
          </Button>
        </CardContent>
      </Card>

      {qrCodeUrl && (
        <Card>
          <CardContent className="p-6 text-center space-y-4">
            <img src={qrCodeUrl} alt="Generated QR Code" className="mx-auto" />
            <div className="flex gap-2 justify-center">
              <Button onClick={downloadQRCode} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button onClick={shareQRCode}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};