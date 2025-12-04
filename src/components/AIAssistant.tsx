import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Send, Bot, User, HelpCircle, Loader2, TrendingUp, Package, IndianRupee, BarChart3, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

// Structured message renderer for AI responses
const StructuredMessage = ({ content }: { content: string }) => {
  // Parse sections - split by double newlines or section headers
  const parseContent = (text: string) => {
    const lines = text.split('\n');
    const elements: JSX.Element[] = [];
    let currentKey = 0;

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) {
        elements.push(<div key={currentKey++} className="h-2" />);
        return;
      }

      // Header detection (emoji at start or ** wrapped)
      if (/^(📊|📦|💰|📋|✅|❌|⚠️|🎯|📈|🔔|💼|🏪|📱|🎁|⭐)/.test(trimmedLine)) {
        const isMainHeader = trimmedLine.includes('Overview') || trimmedLine.includes('Summary') || trimmedLine.includes('Report');
        elements.push(
          <div key={currentKey++} className={`font-semibold ${isMainHeader ? 'text-base text-foreground border-b border-border pb-1 mb-2' : 'text-sm text-foreground mt-3'}`}>
            {trimmedLine}
          </div>
        );
        return;
      }

      // Success message (starts with ✅)
      if (trimmedLine.startsWith('✅')) {
        elements.push(
          <div key={currentKey++} className="flex items-start gap-2 bg-green-500/10 text-green-700 dark:text-green-400 p-2 rounded-md text-sm">
            <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{trimmedLine.replace('✅', '').trim()}</span>
          </div>
        );
        return;
      }

      // Warning/Alert (starts with ⚠️ or ❌)
      if (trimmedLine.startsWith('⚠️') || trimmedLine.startsWith('❌')) {
        elements.push(
          <div key={currentKey++} className="flex items-start gap-2 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 p-2 rounded-md text-sm">
            <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{trimmedLine.replace(/^(⚠️|❌)/, '').trim()}</span>
          </div>
        );
        return;
      }

      // Key-value pairs (contains : with value)
      const kvMatch = trimmedLine.match(/^([•\-📊📦💰📋🔹▸►]?\s*)([^:]+):\s*(.+)$/);
      if (kvMatch && !trimmedLine.includes('http')) {
        const [, bullet, key, value] = kvMatch;
        const isMonetary = /₹|revenue|sale|profit|amount|payment|total/i.test(key);
        elements.push(
          <div key={currentKey++} className="flex justify-between items-center py-1.5 text-sm border-b border-border/50 last:border-0">
            <span className="text-muted-foreground">{bullet}{key}</span>
            <span className={`font-medium ${isMonetary ? 'text-green-600 dark:text-green-400' : 'text-foreground'}`}>
              {value}
            </span>
          </div>
        );
        return;
      }

      // Bullet points (starts with •, -, ▸, or numbers)
      if (/^[•\-▸►]\s/.test(trimmedLine) || /^\d+\.\s/.test(trimmedLine)) {
        elements.push(
          <div key={currentKey++} className="flex items-start gap-2 text-sm py-0.5">
            <span className="text-primary">•</span>
            <span className="text-muted-foreground">{trimmedLine.replace(/^[•\-▸►\d.]\s*/, '')}</span>
          </div>
        );
        return;
      }

      // Bold text (**text**)
      if (trimmedLine.includes('**')) {
        const parts = trimmedLine.split(/\*\*([^*]+)\*\*/g);
        elements.push(
          <p key={currentKey++} className="text-sm text-muted-foreground">
            {parts.map((part, i) => 
              i % 2 === 1 ? <strong key={i} className="text-foreground">{part}</strong> : part
            )}
          </p>
        );
        return;
      }

      // Default text
      elements.push(
        <p key={currentKey++} className="text-sm text-muted-foreground">
          {trimmedLine}
        </p>
      );
    });

    return elements;
  };

  return <div className="space-y-1">{parseContent(content)}</div>;
};
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

export const AIAssistant = () => {
  const { t } = useLanguage();
  const { session } = useAuth();
  const [searchParams] = useSearchParams();
  const businessType = searchParams.get('businessType') || 'general';
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: `🙏 Namaste! Main hoon VyapaarSaathiAI - aapka business assistant!\n\nMain aapke real data se connected hoon. Aap mujhse pooch sakte ho:\n\n📊 "Aaj ki sale kitni hai?"\n📦 "Low stock items batao"\n💰 "Is mahine ka profit?"\n📋 "Monthly overview do"\n\nKya jaanna chahte ho?`,
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Quick action queries for business data
  const quickQueries = [
    { label: "📊 Aaj ki Sale", query: "Aaj ki total sale kitni hai?" },
    { label: "📦 Stock Status", query: "Mera inventory status batao, low stock items kaunse hain?" },
    { label: "💰 Monthly Profit", query: "Is mahine ka profit kitna hua?" },
    { label: "📋 Overview", query: "Mera complete business overview do" },
  ];

  const businessFAQs = {
    grocery: [
      "Low stock items batao",
      "Aaj ki sale kitni hai?",
      "Top selling products kaunse hain?",
      "Pending payments kitne hain?"
    ],
    barber: [
      "Aaj ki kamai kitni hai?",
      "Is hafte ki total sale?",
      "Top services kaunsi hain?",
      "Monthly overview do"
    ],
    hotel: [
      "Aaj ka revenue kitna hai?",
      "Pending bills kitne hain?",
      "Is mahine ka profit?",
      "Inventory status batao"
    ],
    clothing: [
      "Low stock items kaunse hain?",
      "Top selling items batao",
      "Is mahine ki sale kitni hai?",
      "Pending payments check karo"
    ],
    general: [
      "Aaj ki sale kitni hai?",
      "Low stock items batao",
      "Monthly overview do",
      "Pending payments kitne hain?"
    ]
  };

  const getAIResponse = (userQuery: string): string => {
    const query = userQuery.toLowerCase();
    
    // Conversational AI responses that feel more natural
    const greetings = ['hello', 'hi', 'hey', 'namaste', 'good morning', 'good evening'];
    const thanks = ['thank', 'thanks', 'appreciate', 'helpful'];
    
    if (greetings.some(greeting => query.includes(greeting))) {
      return `Hello! I'm your AI business assistant specialized in ${businessType} business. I'm here to help you grow your business with practical advice, strategies, and solutions. What specific challenge are you facing today?`;
    }
    
    if (thanks.some(thank => query.includes(thank))) {
      return "You're welcome! I'm always here to help your business succeed. Feel free to ask me anything about managing your business, improving sales, or solving day-to-day challenges.";
    }
    
    // Business-specific intelligent responses
    if (businessType === 'grocery') {
      if (query.includes('inventory') || query.includes('stock') || query.includes('manage')) {
        return "For grocery inventory management, here's what successful store owners do:\n\n📦 **Smart Stocking**: Use the FIFO method (First In, First Out) especially for perishables\n📱 **Digital Tracking**: Keep a simple register or use apps like Khatabook to track stock levels\n⏰ **Timing**: Order new stock when you reach 20% of normal quantity\n🤝 **Supplier Relations**: Build good relationships with 2-3 suppliers for better rates and credit terms\n\nWhat specific inventory challenge are you facing? I can give more targeted advice.";
      }
      if (query.includes('price') || query.includes('pricing') || query.includes('competition')) {
        return "Smart pricing is key to winning customers while maintaining profits:\n\n💰 **Competitive Pricing**: Visit nearby stores weekly to check prices\n📊 **Markup Strategy**: Keep 15-25% markup on MRP for essentials, higher for convenience items\n🎯 **Psychology**: Use ₹99 instead of ₹100, ₹49 instead of ₹50\n📦 **Bulk Deals**: Offer \"Buy 2 Get 1 Free\" or quantity discounts\n🎪 **Seasonal**: Adjust prices during festivals and seasons\n\nAre you facing specific competition issues? Tell me about your local market situation.";
      }
      if (query.includes('waste') || query.includes('spoil') || query.includes('loss')) {
        return "Reducing wastage directly increases your profits. Here's how:\n\n❄️ **Storage**: Invest in proper refrigeration and storage systems\n👀 **Daily Checks**: Inspect perishables twice daily, morning and evening\n💸 **Quick Sales**: Offer 20-30% discounts on items nearing expiry\n🤝 **Community**: Donate to local NGOs - you get tax benefits and goodwill\n📱 **Apps**: Use apps to sell discounted items to nearby customers\n\nWhat items are you losing most money on? I can suggest specific solutions.";
      }
      if (query.includes('customer') || query.includes('service') || query.includes('retain')) {
        return "Building loyal customers is your biggest asset:\n\n😊 **Personal Touch**: Remember regular customers' names and preferences\n📱 **Credit System**: Offer trusted customers monthly credit with WhatsApp reminders\n🎁 **Loyalty Program**: \"Buy ₹1000, get ₹50 free\" type offers\n⏰ **Convenience**: Stay open during peak hours (7-9 AM, 6-8 PM)\n🛒 **Home Delivery**: Offer delivery for orders above ₹200\n\nHow do you currently handle customer relationships? Any specific challenges?";
      }
    }
    
    if (businessType === 'barber') {
      if (query.includes('appointment') || query.includes('booking') || query.includes('time')) {
        return "Smart appointment management boosts your income:\n\n📱 **Simple System**: Use WhatsApp Business or a basic appointment book\n⏱️ **Time Slots**: Keep 20-minute slots for haircuts, 30 for styling\n🔔 **Reminders**: Send WhatsApp messages day before appointment\n🚶 **Walk-ins**: Reserve 30% slots for walk-in customers\n☕ **Waiting Area**: Make it comfortable with magazines, music\n\nHow are you currently managing appointments? Any busy time issues?";
      }
      if (query.includes('service') || query.includes('price') || query.includes('rate')) {
        return "Pricing your services for maximum profit and customer satisfaction:\n\n✂️ **Basic Haircut**: ₹80-200 (depending on your area)\n💼 **Premium Styling**: ₹300-800 (include consultation and styling)\n🧔 **Beard Services**: ₹50-150 (very profitable add-on)\n💆 **Additional Services**: Head massage (₹100), face clean (₹200)\n🎫 **Packages**: Monthly packages for regular customers (₹800 for 4 visits)\n\nWhat's your current pricing? Are customers asking for specific services you don't offer?";
      }
      if (query.includes('loyal') || query.includes('customer') || query.includes('regular')) {
        return "Building a loyal customer base ensures steady income:\n\n📝 **Remember Details**: Note their preferred style, length, and personal details\n🎪 **Loyalty Cards**: \"10th haircut free\" or punch card system\n🧽 **Hygiene**: Always use fresh towels, sanitize tools visibly\n📱 **Stay Updated**: Learn trending hairstyles from YouTube, Instagram\n🎁 **Special Occasions**: Offer festival discounts or birthday specials\n💬 **Communication**: Ask about their work, family - build relationships\n\nWhat percentage of your customers are regulars? How do you currently engage with them?";
      }
    }

    if (businessType === 'hotel') {
      if (query.includes('booking') || query.includes('room') || query.includes('reservation')) {
        return "Efficient booking management increases your occupancy:\n\n📱 **Digital Presence**: List on Google My Business, OYO, or local booking sites\n📞 **Phone System**: Keep a dedicated number for bookings\n📋 **Manual Backup**: Maintain a physical register as backup\n💰 **Advance Payment**: Ask for 20-30% advance to confirm bookings\n🕐 **Check-in Time**: Standard 12 PM checkout, 2 PM check-in\n\nWhat's your current occupancy rate? Are you getting bookings mainly from walk-ins or advance reservations?";
      }
      if (query.includes('food') || query.includes('restaurant') || query.includes('kitchen')) {
        return "Food service can significantly boost your revenue:\n\n🍽️ **Menu Planning**: Focus on 8-10 dishes you can make consistently well\n💰 **Cost Control**: Food cost should be 30-35% of selling price\n🥬 **Fresh Ingredients**: Build relationships with local vegetable vendors\n⏰ **Timing**: Serve breakfast (7-10 AM), lunch (12-3 PM), dinner (7-10 PM)\n📦 **Packaging**: Offer takeaway and home delivery\n\nAre you currently serving food? What type of cuisine works best in your area?";
      }
    }

    if (businessType === 'clothing') {
      if (query.includes('inventory') || query.includes('season') || query.includes('trend')) {
        return "Clothing inventory management requires seasonal planning:\n\n🌞 **Seasonal Buying**: Stock summer clothes in March, winter in September\n👗 **Mix Strategy**: 60% current season, 30% next season, 10% previous season discounts\n📊 **Size Ratio**: Keep more M and L sizes, fewer XS and XXL\n🎯 **Trend Watching**: Follow local fashion influencers and Bollywood trends\n💸 **End-of-Season**: Clear old stock at 30-50% discount to make space\n\nWhat season are you planning for? Any specific clothing categories performing well?";
      }
      if (query.includes('display') || query.includes('show') || query.includes('attract')) {
        return "Attractive displays directly impact sales:\n\n🎨 **Window Display**: Change it weekly, show complete outfits\n💡 **Lighting**: Bright, warm lighting makes clothes look appealing\n👥 **Mannequins**: Show how clothes look when worn\n🌈 **Color Coordination**: Group similar colors together\n🏷️ **Clear Pricing**: Use attractive price tags, show discounts prominently\n📱 **Mirror Placement**: Full-length mirrors in good lighting\n\nHow is your current store layout? Are customers spending enough time browsing?";
      }
    }

    // General business intelligence
    if (query.includes('sales') || query.includes('revenue') || query.includes('increase') || query.includes('grow')) {
      return `Here are proven strategies to grow your ${businessType} business:\n\n📈 **Track Daily Numbers**: Know your daily sales target and track progress\n🎯 **Customer Focus**: Solve customer problems, don't just sell products\n📱 **Digital Marketing**: Use WhatsApp Business status, local Facebook groups\n🤝 **Referral System**: Reward customers who bring new customers\n⭐ **Quality Consistency**: Never compromise on quality for quick profits\n💰 **Upselling**: Suggest complementary products naturally\n\nWhat's your current monthly revenue? What's your biggest sales challenge right now?`;
    }
    
    if (query.includes('marketing') || query.includes('promote') || query.includes('advertise')) {
      return "Cost-effective marketing for local businesses:\n\n📱 **WhatsApp Business**: Create business profile, use status for offers\n📍 **Google My Business**: Claim and optimize your listing with photos\n🤝 **Local Partnerships**: Partner with nearby complementary businesses\n🎪 **Community Events**: Sponsor local festivals, school events\n📸 **Social Proof**: Display customer photos and testimonials\n📢 **Word of Mouth**: Exceptional service is your best advertisement\n\nWhich marketing methods have you tried? What's your monthly marketing budget?";
    }
    
    if (query.includes('finance') || query.includes('money') || query.includes('profit') || query.includes('account')) {
      return "Smart financial management for sustainable growth:\n\n📊 **Daily Tracking**: Record every rupee in and out using apps like Khatabook\n🏦 **Separate Accounts**: Keep business and personal money separate\n💰 **Profit Savings**: Save 20% of monthly profit for emergencies\n📄 **Receipt Management**: Keep all bills for tax purposes and supplier relations\n📈 **Weekly Review**: Analyze which products/services make most profit\n💳 **Digital Payments**: Accept UPI, cards to track transactions automatically\n\nAre you currently tracking your daily expenses? What's your biggest financial challenge?";
    }
    
    // Handle specific problems and give contextual advice
    if (query.includes('problem') || query.includes('issue') || query.includes('challenge') || query.includes('difficulty')) {
      return "I understand you're facing some challenges. Every successful business owner has been there! Could you tell me more specifically about:\n\n• What exactly is the problem you're experiencing?\n• How long has this been happening?\n• What have you already tried to solve it?\n\nWith these details, I can give you very specific, actionable advice that other business owners in similar situations have used successfully.";
    }
    
    if (query.includes('start') || query.includes('begin') || query.includes('new') || query.includes('setup')) {
      return `Starting a ${businessType} business? Here's your roadmap:\n\n📋 **Legal Setup**: Get trade license, GST registration if needed\n🏪 **Location**: Choose high footfall area within your budget\n💰 **Initial Investment**: Plan for 3-6 months of expenses\n📦 **Supplier Relations**: Find 2-3 reliable suppliers\n📱 **Basic Systems**: WhatsApp Business, simple accounting method\n🎯 **Target Customers**: Understand your local market needs\n\nWhat stage are you at? Have you secured a location yet?`;
    }
    
    // Default intelligent response
    return `I'm here to help you succeed in your ${businessType} business! I can provide specific advice on:\n\n💼 **Business Operations**: Day-to-day management, efficiency tips\n💰 **Financial Management**: Profit optimization, cost control\n📈 **Sales Growth**: Customer acquisition and retention strategies\n📦 **Inventory**: Stock management and procurement\n🎯 **Marketing**: Local advertising and customer engagement\n⚠️ **Problem Solving**: Specific challenges you're facing\n\nWhat would you like to focus on? The more specific your question, the better advice I can give you!`;
  };

  const sendMessageToAI = async (messageText: string) => {
    try {
      // Get the current session token
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke('ai-chatbot', {
        body: { message: messageText, businessType },
        headers: currentSession?.access_token ? {
          Authorization: `Bearer ${currentSession.access_token}`
        } : undefined
      });

      if (error) throw error;

      return data.message || 'Sorry, I could not generate a response.';
    } catch (error: any) {
      console.error('Chatbot error:', error);
      throw error;
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentQuery = inputValue;
    setInputValue('');
    setIsLoading(true);

    try {
      const responseText = await sendMessageToAI(currentQuery);
      
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: responseText,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiResponse]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to get AI response",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickQuery = async (query: string) => {
    if (isLoading) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      content: query,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const responseText = await sendMessageToAI(query);
      
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: responseText,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiResponse]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to get AI response",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFAQClick = (faq: string) => {
    handleQuickQuery(faq);
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          VyapaarSaathiAI
        </CardTitle>
        {/* Quick Action Buttons */}
        <div className="flex flex-wrap gap-2 mt-2">
          {quickQueries.map((q, i) => (
            <Button
              key={i}
              variant="outline"
              size="sm"
              onClick={() => handleQuickQuery(q.query)}
              disabled={isLoading}
              className="text-xs"
            >
              {q.label}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <ScrollArea className="flex-1 mb-4 p-4 border rounded-md">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-2 max-w-[85%] ${message.isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className="flex-shrink-0">
                    {message.isUser ? (
                      <User className="h-6 w-6 text-primary" />
                    ) : (
                      <Bot className="h-6 w-6 text-secondary-foreground" />
                    )}
                  </div>
                  <div
                    className={`p-3 rounded-lg ${
                      message.isUser
                        ? 'bg-primary text-primary-foreground text-sm'
                        : 'bg-muted border border-border'
                    }`}
                  >
                    {message.isUser ? (
                      message.content
                    ) : (
                      <StructuredMessage content={message.content} />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        
        {/* FAQ Section */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Quick Questions:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {businessFAQs[businessType as keyof typeof businessFAQs]?.map((faq, index) => (
              <Badge
                key={index}
                variant="outline"
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors text-xs"
                onClick={() => handleFAQClick(faq)}
              >
                {faq}
              </Badge>
            ))}
          </div>
        </div>
        
        <div className="flex gap-2">
          <Input
            placeholder={t('helpPlaceholder')}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <Button onClick={handleSendMessage} size="icon" disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};