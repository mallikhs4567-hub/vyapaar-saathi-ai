import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Smartphone, Check, Download, Share2, Home, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function Install() {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Listen for the beforeinstallprompt event
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstalled(true);
    }

    // Clear the deferredPrompt so it can only be used once
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  const isAndroid = /Android/i.test(navigator.userAgent);
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 p-4 flex items-center justify-center">
      <Card className="w-full max-w-lg animate-fade-in">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-3xl font-bold text-primary-foreground">VS</span>
            </div>
          </div>
          <CardTitle className="text-2xl">Install Vyapaar Saathi AI</CardTitle>
          <CardDescription className="text-base mt-2">
            Get the app on your home screen for quick and easy access!
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {isInstalled ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">App Installed!</h3>
                <p className="text-muted-foreground text-sm">
                  Vyapaar Saathi AI is now on your home screen
                </p>
              </div>
              <Button onClick={() => navigate('/dashboard')} className="w-full" size="lg">
                <Home className="mr-2 h-5 w-5" />
                Open Dashboard
              </Button>
            </div>
          ) : (
            <>
              {/* Features List */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">Works Offline</h4>
                    <p className="text-sm text-muted-foreground">Access your data even without internet</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">Fast & Lightweight</h4>
                    <p className="text-sm text-muted-foreground">No app store needed, instant updates</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">Home Screen Access</h4>
                    <p className="text-sm text-muted-foreground">Launch like a native app</p>
                  </div>
                </div>
              </div>

              {/* Install Button (Chrome/Edge) */}
              {isInstallable && (
                <Button onClick={handleInstallClick} className="w-full" size="lg">
                  <Download className="mr-2 h-5 w-5" />
                  Install App
                </Button>
              )}

              {/* Manual Installation Instructions */}
              {!isInstallable && (
                <div className="space-y-4">
                  {isAndroid && (
                    <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
                      <h4 className="font-medium flex items-center gap-2">
                        <Smartphone className="h-5 w-5" />
                        Android Installation
                      </h4>
                      <ol className="text-sm space-y-2 list-decimal list-inside text-muted-foreground">
                        <li>Tap the menu (⋮) in your browser</li>
                        <li>Select "Add to Home screen" or "Install app"</li>
                        <li>Tap "Add" or "Install" to confirm</li>
                      </ol>
                    </div>
                  )}

                  {isIOS && (
                    <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
                      <h4 className="font-medium flex items-center gap-2">
                        <Share2 className="h-5 w-5" />
                        iPhone Installation
                      </h4>
                      <ol className="text-sm space-y-2 list-decimal list-inside text-muted-foreground">
                        <li>Tap the Share button <Share2 className="h-3 w-3 inline" /></li>
                        <li>Scroll down and tap "Add to Home Screen"</li>
                        <li>Tap "Add" in the top right</li>
                      </ol>
                    </div>
                  )}

                  {!isAndroid && !isIOS && (
                    <div className="border rounded-lg p-4 bg-muted/30">
                      <p className="text-sm text-muted-foreground">
                        Open this page on your mobile device to install the app on your home screen.
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/dashboard')} 
                  className="w-full"
                >
                  <X className="mr-2 h-4 w-4" />
                  Skip for Now
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
