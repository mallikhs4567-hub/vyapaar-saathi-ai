import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface PlatformConnectionDialogProps {
  platform: string;
  platformName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const PlatformConnectionDialog = ({
  platform,
  platformName,
  open,
  onOpenChange,
  onSuccess,
}: PlatformConnectionDialogProps) => {
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [accessTokenSecret, setAccessTokenSecret] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleConnect = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error("Not authenticated");

      // Validate Twitter credentials
      if (platform === 'twitter') {
        if (!apiKey || !apiSecret || !accessToken || !accessTokenSecret) {
          throw new Error("All fields are required for Twitter");
        }
      }

      const { error } = await supabase
        .from('platform_connections')
        .upsert({
          user_id: user.id,
          platform,
          is_connected: true,
          api_key: apiKey,
          api_secret: apiSecret,
          access_token: accessToken,
          access_token_secret: accessTokenSecret,
        });

      if (error) throw error;

      toast({
        title: "Connected!",
        description: `Successfully connected to ${platformName}`,
      });
      
      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setApiKey("");
      setApiSecret("");
      setAccessToken("");
      setAccessTokenSecret("");
    } catch (error: any) {
      console.error('Connection error:', error);
      toast({
        title: "Connection Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect to {platformName}</DialogTitle>
          <DialogDescription>
            {platform === 'twitter' ? (
              <>
                Enter your Twitter API credentials. You can get these from your{" "}
                <a 
                  href="https://developer.twitter.com/en/portal/dashboard" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Twitter Developer Portal
                </a>. Make sure your app has "Read and Write" permissions.
              </>
            ) : (
              `Enter your ${platformName} API credentials to connect.`
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-key">API Key / Consumer Key</Label>
            <Input
              id="api-key"
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter API Key"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="api-secret">API Secret / Consumer Secret</Label>
            <Input
              id="api-secret"
              type="password"
              value={apiSecret}
              onChange={(e) => setApiSecret(e.target.value)}
              placeholder="Enter API Secret"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="access-token">Access Token</Label>
            <Input
              id="access-token"
              type="text"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder="Enter Access Token"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="access-token-secret">Access Token Secret</Label>
            <Input
              id="access-token-secret"
              type="password"
              value={accessTokenSecret}
              onChange={(e) => setAccessTokenSecret(e.target.value)}
              placeholder="Enter Access Token Secret"
            />
          </div>
          <Button 
            onClick={handleConnect} 
            disabled={loading}
            className="w-full"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Connect {platformName}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
