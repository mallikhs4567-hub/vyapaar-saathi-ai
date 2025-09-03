import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Send, Bot, User, HelpCircle } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

export const AIAssistant = () => {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const businessType = searchParams.get('businessType') || 'general';
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: `Hello! I'm your AI business assistant for ${businessType} business. How can I help you today?`,
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');

  const businessFAQs = {
    grocery: [
      "How to manage inventory for perishable items?",
      "Best pricing strategies for local competition",
      "How to reduce wastage in fruits and vegetables?",
      "Setting up credit system for customers"
    ],
    barber: [
      "How to manage appointment bookings?",
      "What services should I offer?",
      "How to build customer loyalty?",
      "Setting competitive pricing for services"
    ],
    hotel: [
      "How to manage room bookings?",
      "Food cost management tips",
      "How to handle customer complaints?",
      "Marketing strategies for local customers"
    ],
    clothing: [
      "How to manage seasonal inventory?",
      "Best display techniques for clothes?",
      "How to handle returns and exchanges?",
      "Trend forecasting for local market"
    ]
  };

  const getAIResponse = (userQuery: string): string => {
    const query = userQuery.toLowerCase();
    
    // Business-specific responses
    if (businessType === 'grocery') {
      if (query.includes('inventory') || query.includes('stock')) {
        return "For grocery inventory management: 1) Use FIFO (First In, First Out) for perishables 2) Track expiry dates closely 3) Maintain minimum stock levels 4) Build relationships with multiple suppliers for better deals.";
      }
      if (query.includes('price') || query.includes('pricing')) {
        return "Pricing strategy: 1) Research competitor prices weekly 2) Keep 15-20% markup on MRP 3) Offer bulk discounts 4) Use psychological pricing (₹99 instead of ₹100).";
      }
      if (query.includes('waste') || query.includes('spoil')) {
        return "Reduce wastage: 1) Proper storage conditions 2) Regular quality checks 3) Offer discounts on near-expiry items 4) Donate to local NGOs for tax benefits.";
      }
    }
    
    if (businessType === 'barber') {
      if (query.includes('appointment') || query.includes('booking')) {
        return "Appointment management: 1) Use a simple booking app or register 2) Keep 15-minute buffer between appointments 3) Send SMS reminders 4) Have a waiting area for walk-ins.";
      }
      if (query.includes('service') || query.includes('price')) {
        return "Service pricing: 1) Basic haircut: ₹50-150 2) Premium styling: ₹200-500 3) Beard trimming: ₹30-80 4) Package deals for regular customers.";
      }
      if (query.includes('loyal') || query.includes('customer')) {
        return "Build loyalty: 1) Remember customer preferences 2) Offer loyalty cards (10th haircut free) 3) Maintain hygiene standards 4) Keep up with latest trends.";
      }
    }

    // General business responses
    if (query.includes('sales') || query.includes('revenue')) {
      return "To increase sales: 1) Focus on customer service 2) Use social media marketing 3) Offer seasonal promotions 4) Ask for customer referrals 5) Maintain quality consistently.";
    }
    if (query.includes('customer') || query.includes('service')) {
      return "Customer service tips: 1) Greet every customer warmly 2) Listen to their needs 3) Provide honest recommendations 4) Follow up after purchase 5) Handle complaints gracefully.";
    }
    if (query.includes('marketing') || query.includes('promote')) {
      return "Local marketing ideas: 1) Create WhatsApp Business profile 2) Partner with nearby businesses 3) Offer first-time customer discounts 4) Use local community groups 5) Display customer testimonials.";
    }
    if (query.includes('finance') || query.includes('money') || query.includes('profit')) {
      return "Financial management: 1) Track daily income/expenses 2) Separate business and personal accounts 3) Save 20% of profits 4) Keep receipts for tax purposes 5) Review numbers weekly.";
    }

    return "I'm here to help with your business queries! You can ask me about sales, inventory, customer service, marketing, finance, or any specific challenges you're facing in your business.";
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentQuery = inputValue;
    setInputValue('');

    // AI response with business-specific logic
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: getAIResponse(currentQuery),
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  const handleFAQClick = (faq: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      content: faq,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);

    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: getAIResponse(faq),
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 800);
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          {t('chatbot')}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <ScrollArea className="flex-1 mb-4 p-4 border rounded-md">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-2 max-w-[80%] ${message.isUser ? 'flex-row-reverse' : 'flex-row'}`}>
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
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {message.content}
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
          <Button onClick={handleSendMessage} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};