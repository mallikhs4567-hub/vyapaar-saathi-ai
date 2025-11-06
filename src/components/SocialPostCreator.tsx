import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Download, Share2, Camera, Hash, Sparkles, Loader2, Send } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import html2canvas from 'html2canvas';
import { supabase } from '@/integrations/supabase/client';

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
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [platformConnections, setPlatformConnections] = useState<any[]>([]);
  const postRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchPlatformConnections();
  }, []);

  const fetchPlatformConnections = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('platform_connections')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setPlatformConnections(data || []);
    } catch (error) {
      console.error('Error fetching platform connections:', error);
    }
  };

  const isPlatformConnected = (platform: string) => {
    return platformConnections.some(
      conn => conn.platform === platform && conn.is_connected
    );
  };

  const publishToPlatform = async (platform: string) => {
    try {
      setIsPublishing(true);
      
      if (!postData.title || !postData.description) {
        throw new Error('Please generate or enter content first');
      }

      const fullContent = `${postData.title}\n\n${postData.description}${postData.offerText ? `\n\n${postData.offerText}` : ''}\n\n${hashtags.map(tag => `#${tag}`).join(' ')}`;

      const { data, error } = await supabase.functions.invoke('publish-to-platform', {
        body: {
          platform,
          content: fullContent,
        },
      });

      if (error) throw error;

      toast({
        title: "Published!",
        description: `Successfully published to ${platform}`,
      });
    } catch (error: any) {
      console.error('Publish error:', error);
      toast({
        title: "Publish Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  };

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

  const generateAIContent = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-social-post', {
        body: {
          businessName: businessData.name,
          category: businessData.category,
          template: postData.template,
          platform: postData.platform
        }
      });

      if (error) throw error;

      setPostData(prev => ({
        ...prev,
        title: data.title,
        description: data.description,
        offerText: data.offerText || ''
      }));

      setHashtags(data.hashtags || []);

      toast({
        title: "Content Generated",
        description: "AI-generated content has been added to your post",
      });
    } catch (error: any) {
      console.error('Generate content error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate AI content",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
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

          <Button onClick={generateAIContent} variant="outline" className="w-full" disabled={isGenerating}>
            {isGenerating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
            {isGenerating ? 'Generating...' : 'Generate AI Content'}
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
          
          <div className="flex flex-wrap gap-2 justify-center">
            <Button onClick={downloadPost} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button onClick={sharePost} variant="outline">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            {isPlatformConnected('twitter') && postData.title && (
              <Button 
                onClick={() => publishToPlatform('twitter')} 
                disabled={isPublishing}
                variant="default"
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Publish to Twitter
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};