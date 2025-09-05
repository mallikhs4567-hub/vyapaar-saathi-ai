import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Download, Share2, Camera, Hash, Sparkles } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import html2canvas from 'html2canvas';

interface SocialPostCreatorProps {
  businessData: {
    name: string;
    category?: string;
  };
}

export const SocialPostCreator = ({ businessData }: SocialPostCreatorProps) => {
  const [postData, setPostData] = useState({
    platform: 'instagram',
    template: 'offer',
    title: '',
    description: '',
    offerText: '',
    backgroundColor: '#3b82f6',
    textColor: '#ffffff'
  });
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [hashtagInput, setHashtagInput] = useState('');
  const postRef = useRef<HTMLDivElement>(null);

  const platforms = [
    { id: 'instagram', name: 'Instagram', size: '1080x1080' },
    { id: 'facebook', name: 'Facebook', size: '1200x630' },
    { id: 'whatsapp', name: 'WhatsApp Status', size: '1080x1920' },
    { id: 'story', name: 'Story', size: '1080x1920' }
  ];

  const templates = [
    { id: 'offer', name: 'Special Offer', icon: '🎯' },
    { id: 'announcement', name: 'Announcement', icon: '📢' },
    { id: 'testimonial', name: 'Customer Review', icon: '⭐' },
    { id: 'behind-scenes', name: 'Behind the Scenes', icon: '🎬' },
    { id: 'tips', name: 'Tips & Advice', icon: '💡' },
    { id: 'event', name: 'Event/Workshop', icon: '📅' }
  ];

  const suggestedHashtags = [
    '#local', '#business', '#service', '#quality', '#customer',
    '#professional', '#trusted', '#experience', '#community', '#smallbusiness'
  ];

  const addHashtag = () => {
    if (hashtagInput.trim() && !hashtags.includes(hashtagInput.trim())) {
      setHashtags(prev => [...prev, hashtagInput.trim()]);
      setHashtagInput('');
    }
  };

  const removeHashtag = (tag: string) => {
    setHashtags(prev => prev.filter(t => t !== tag));
  };

  const generateAIContent = () => {
    const templates_content = {
      offer: {
        title: `🎉 Special Offer at ${businessData.name}!`,
        description: `Don't miss out on our amazing deals! Limited time only.`,
        offerText: `50% OFF on selected items`
      },
      announcement: {
        title: `📢 Exciting News from ${businessData.name}!`,
        description: `We're thrilled to share something special with our valued customers.`,
        offerText: ``
      },
      testimonial: {
        title: `⭐ What Our Customers Say`,
        description: `"Amazing service and quality! Highly recommended!" - Happy Customer`,
        offerText: ``
      },
      'behind-scenes': {
        title: `🎬 Behind the Scenes at ${businessData.name}`,
        description: `Take a peek at how we create quality products/services for you!`,
        offerText: ``
      },
      tips: {
        title: `💡 Pro Tips from ${businessData.name}`,
        description: `Here's a helpful tip from our experts to make your day better!`,
        offerText: ``
      },
      event: {
        title: `📅 Join Us for a Special Event!`,
        description: `Mark your calendars! We're hosting an exciting event for our community.`,
        offerText: `Register now!`
      }
    };

    const content = templates_content[postData.template as keyof typeof templates_content];
    setPostData(prev => ({
      ...prev,
      title: content.title,
      description: content.description,
      offerText: content.offerText
    }));

    // Add relevant hashtags
    const categoryHashtags = businessData.category ? [`#${businessData.category.toLowerCase()}`] : [];
    setHashtags(prev => [...new Set([...prev, ...categoryHashtags, '#local', '#business'])]);

    toast({
      title: "Content Generated",
      description: "AI-generated content has been added to your post",
    });
  };

  const getPostDimensions = () => {
    switch (postData.platform) {
      case 'instagram':
        return { width: '400px', height: '400px' };
      case 'facebook':
        return { width: '400px', height: '210px' };
      case 'whatsapp':
      case 'story':
        return { width: '300px', height: '533px' };
      default:
        return { width: '400px', height: '400px' };
    }
  };

  const downloadPost = async () => {
    if (!postRef.current) return;

    try {
      const canvas = await html2canvas(postRef.current, {
        scale: 3,
        backgroundColor: null,
      });
      
      const link = document.createElement('a');
      link.download = `${businessData.name}-${postData.platform}-post.png`;
      link.href = canvas.toDataURL();
      link.click();
      
      toast({
        title: "Success",
        description: "Social media post downloaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download post",
        variant: "destructive",
      });
    }
  };

  const sharePost = async () => {
    if (!postRef.current) return;

    try {
      const canvas = await html2canvas(postRef.current, {
        scale: 3,
        backgroundColor: null,
      });
      
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        
        const file = new File([blob], `${businessData.name}-social-post.png`, { type: 'image/png' });
        
        if (navigator.share) {
          try {
            await navigator.share({
              title: `${businessData.name} Social Post`,
              text: postData.description,
              files: [file],
            });
          } catch (error) {
            downloadPost();
          }
        } else {
          downloadPost();
        }
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to share post",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Social Media Post Creator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Platform</Label>
              <Select value={postData.platform} onValueChange={(value) => setPostData(prev => ({ ...prev, platform: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {platforms.map((platform) => (
                    <SelectItem key={platform.id} value={platform.id}>
                      {platform.name} ({platform.size})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Template</Label>
              <Select value={postData.template} onValueChange={(value) => setPostData(prev => ({ ...prev, template: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.icon} {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={generateAIContent} variant="outline" className="w-full">
            <Sparkles className="h-4 w-4 mr-2" />
            Generate AI Content
          </Button>

          <div>
            <Label htmlFor="title">Post Title</Label>
            <Input
              id="title"
              value={postData.title}
              onChange={(e) => setPostData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter post title..."
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={postData.description}
              onChange={(e) => setPostData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter post description..."
              rows={3}
            />
          </div>

          {(postData.template === 'offer' || postData.template === 'event') && (
            <div>
              <Label htmlFor="offerText">Offer/CTA Text</Label>
              <Input
                id="offerText"
                value={postData.offerText}
                onChange={(e) => setPostData(prev => ({ ...prev, offerText: e.target.value }))}
                placeholder="e.g., 50% OFF, Register Now!, Call Today!"
              />
            </div>
          )}

          <div>
            <Label>Hashtags</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={hashtagInput}
                onChange={(e) => setHashtagInput(e.target.value)}
                placeholder="Add hashtag (without #)"
                onKeyPress={(e) => e.key === 'Enter' && addHashtag()}
              />
              <Button onClick={addHashtag} size="sm">
                <Hash className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-1 mb-2">
              {hashtags.map((tag) => (
                <Badge key={tag} variant="secondary" onClick={() => removeHashtag(tag)} className="cursor-pointer">
                  #{tag} ×
                </Badge>
              ))}
            </div>
            
            <div className="flex flex-wrap gap-1">
              {suggestedHashtags.filter(tag => !hashtags.includes(tag.slice(1))).map((tag) => (
                <Badge key={tag} variant="outline" onClick={() => setHashtags(prev => [...prev, tag.slice(1)])} className="cursor-pointer">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center mb-4">
            <div 
              ref={postRef}
              style={{
                ...getPostDimensions(),
                backgroundColor: postData.backgroundColor,
                color: postData.textColor,
                borderRadius: '16px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div>
                <h2 className="text-xl font-bold mb-3">{postData.title || 'Your Post Title'}</h2>
                <p className="text-sm mb-4 opacity-90">{postData.description || 'Your post description will appear here...'}</p>
                {postData.offerText && (
                  <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 mb-4">
                    <p className="font-bold text-center">{postData.offerText}</p>
                  </div>
                )}
              </div>
              
              <div>
                <div className="text-xs opacity-75 mb-2">
                  {hashtags.slice(0, 5).map(tag => `#${tag}`).join(' ')}
                </div>
                <div className="text-sm font-semibold">{businessData.name}</div>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2 justify-center">
            <Button onClick={downloadPost} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button onClick={sharePost}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};