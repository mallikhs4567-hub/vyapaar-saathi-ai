import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper to detect query type
function detectQueryType(message: string): 'sale_add' | 'query' | 'overview' | 'chat' {
  const lowerMessage = message.toLowerCase();
  
  // Sale add detection
  const saleAddPatterns = ['sale add', 'add sale', 'nayi sale', 'new sale', 'bech diya', 'bikri', 'sell'];
  if (saleAddPatterns.some(p => lowerMessage.includes(p))) {
    return 'sale_add';
  }
  
  // Overview detection
  const overviewPatterns = ['overview', 'mahine ka', 'monthly', 'report', 'summary', 'performance', 'overall'];
  if (overviewPatterns.some(p => lowerMessage.includes(p))) {
    return 'overview';
  }
  
  // Database query detection
  const queryPatterns = [
    'kitni', 'kitna', 'total', 'sale', 'stock', 'inventory', 'revenue', 'profit',
    'pending', 'payment', 'customer', 'product', 'item', 'expense', 'income',
    'aaj', 'kal', 'today', 'yesterday', 'week', 'month', 'year',
    'top', 'best', 'worst', 'low', 'high', 'average', 'count', 'number',
    'balance', 'due', 'amount', 'price', 'cost', 'margin', 'loss',
    'bill', 'invoice', 'transaction', 'order', 'baki', 'udhar'
  ];
  if (queryPatterns.some(p => lowerMessage.includes(p))) {
    return 'query';
  }
  
  return 'chat';
}

// Fetch user profile from database
async function fetchUserProfile(supabase: any, userId: string) {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  
  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
  
  return profile;
}

// Fetch business data from database
async function fetchBusinessData(supabase: any, userId: string) {
  const today = new Date().toISOString().split('T')[0];
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  
  // Fetch all data in parallel
  const [salesResult, inventoryResult, financeResult, billsResult] = await Promise.all([
    supabase.from('Sales').select('*').eq('User_id', userId),
    supabase.from('Inventory').select('*').eq('user_id', userId),
    supabase.from('finance').select('*').eq('user_id', userId),
    supabase.from('bills').select('*').eq('user_id', userId)
  ]);
  
  const sales = salesResult.data || [];
  const inventory = inventoryResult.data || [];
  const finance = financeResult.data || [];
  const bills = billsResult.data || [];
  
  // Calculate metrics
  const todaySales = sales.filter((s: any) => s.Date === today);
  const yesterdaySales = sales.filter((s: any) => s.Date === yesterday);
  const monthSales = sales.filter((s: any) => s.Date >= startOfMonth);
  
  const todayRevenue = todaySales.reduce((sum: number, s: any) => sum + Number(s.Amount), 0);
  const yesterdayRevenue = yesterdaySales.reduce((sum: number, s: any) => sum + Number(s.Amount), 0);
  const monthRevenue = monthSales.reduce((sum: number, s: any) => sum + Number(s.Amount), 0);
  const totalRevenue = sales.reduce((sum: number, s: any) => sum + Number(s.Amount), 0);
  
  // Inventory analysis
  const lowStockItems = inventory.filter((i: any) => i['Stock quantity'] < 10);
  const totalInventoryValue = inventory.reduce((sum: number, i: any) => 
    sum + (Number(i.Price_per_unit) * Number(i['Stock quantity'])), 0);
  
  // Finance analysis
  const monthIncome = finance
    .filter((f: any) => f.type === 'income' && f.date >= startOfMonth)
    .reduce((sum: number, f: any) => sum + Number(f.amount), 0);
  const monthExpenses = finance
    .filter((f: any) => f.type === 'expense' && f.date >= startOfMonth)
    .reduce((sum: number, f: any) => sum + Number(f.amount), 0);
  
  // Bills analysis
  const pendingBills = bills.filter((b: any) => b.status === 'unpaid' || b.status === 'partial');
  const pendingAmount = pendingBills.reduce((sum: number, b: any) => 
    sum + (Number(b.total_amount) - Number(b.paid_amount)), 0);
  
  // Top products
  const productSales: Record<string, { quantity: number; revenue: number }> = {};
  sales.forEach((s: any) => {
    const product = s.Product || 'Unknown';
    if (!productSales[product]) {
      productSales[product] = { quantity: 0, revenue: 0 };
    }
    productSales[product].quantity += Number(s.Quantity);
    productSales[product].revenue += Number(s.Amount);
  });
  
  const topProducts = Object.entries(productSales)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 5)
    .map(([name, data]) => ({ name, ...data }));
  
  return {
    today: {
      sales: todaySales.length,
      revenue: todayRevenue,
    },
    yesterday: {
      sales: yesterdaySales.length,
      revenue: yesterdayRevenue,
    },
    month: {
      sales: monthSales.length,
      revenue: monthRevenue,
      income: monthIncome,
      expenses: monthExpenses,
      profit: monthIncome + monthRevenue - monthExpenses,
    },
    total: {
      sales: sales.length,
      revenue: totalRevenue,
    },
    inventory: {
      totalItems: inventory.length,
      totalValue: totalInventoryValue,
      lowStockItems: lowStockItems.map((i: any) => ({
        name: i.Item_name,
        stock: i['Stock quantity'],
        category: i.Category
      })),
      lowStockCount: lowStockItems.length,
    },
    bills: {
      pending: pendingBills.length,
      pendingAmount: pendingAmount,
    },
    topProducts,
    rawData: { sales, inventory, finance, bills }
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, businessType } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    let userId = null;
    let businessData = null;
    let userProfile = null;

    if (authHeader && SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      
      // Verify the JWT token
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (!authError && user) {
        userId = user.id;
        
        // Fetch user profile for personalization
        userProfile = await fetchUserProfile(supabase, userId);
        
        // Detect query type and fetch data if needed
        const queryType = detectQueryType(message);
        
        if (queryType !== 'chat') {
          businessData = await fetchBusinessData(supabase, userId);
        }
      }
    }

    // Build system prompt based on query type
    const queryType = detectQueryType(message);
    
    // Build user profile context
    const userName = userProfile?.full_name || 'User';
    const shopName = userProfile?.shop_name || 'Your Shop';
    const shopCategory = userProfile?.shop_category || businessType || 'General';
    const shopAddress = userProfile?.shop_address || '';
    const shopPhone = userProfile?.shop_phone || '';
    const shopEmail = userProfile?.shop_email || '';
    
    let systemPrompt = `You are VyapaarSaathiAI — a fully database-connected business assistant for shop owners.

👤 USER PROFILE:
- Owner Name: ${userName}
- Shop Name: ${shopName}
- Business Category: ${shopCategory}
${shopAddress ? `- Address: ${shopAddress}` : ''}
${shopPhone ? `- Contact: ${shopPhone}` : ''}
${shopEmail ? `- Email: ${shopEmail}` : ''}

Your personality:
- Friendly, helpful, and professional
- Address the user by their name (${userName.split(' ')[0]}) to make it personal
- Speak in a mix of Hindi and English (Hinglish) when appropriate
- Use emojis to make responses engaging
- Keep answers concise but informative
- Reference the shop name (${shopName}) when discussing their business

CRITICAL RULES:
- NEVER guess or fabricate data
- ALWAYS use the real data provided in the context
- Format numbers in Indian style (e.g., ₹1,00,000)
- If data is unavailable, clearly state that
- Provide advice tailored to ${shopCategory} business type`;

    let contextData = '';
    
    if (businessData) {
      contextData = `

REAL BUSINESS DATA (use this for your response):
📊 TODAY'S PERFORMANCE:
- Sales Count: ${businessData.today.sales}
- Revenue: ₹${businessData.today.revenue.toLocaleString('en-IN')}

📊 YESTERDAY:
- Sales Count: ${businessData.yesterday.sales}
- Revenue: ₹${businessData.yesterday.revenue.toLocaleString('en-IN')}

📊 THIS MONTH:
- Total Sales: ${businessData.month.sales}
- Total Revenue: ₹${businessData.month.revenue.toLocaleString('en-IN')}
- Income: ₹${businessData.month.income.toLocaleString('en-IN')}
- Expenses: ₹${businessData.month.expenses.toLocaleString('en-IN')}
- Net Profit: ₹${businessData.month.profit.toLocaleString('en-IN')}

📦 INVENTORY STATUS:
- Total Items: ${businessData.inventory.totalItems}
- Total Value: ₹${businessData.inventory.totalValue.toLocaleString('en-IN')}
- Low Stock Items (${businessData.inventory.lowStockCount}): ${businessData.inventory.lowStockItems.map((i: any) => `${i.name} (${i.stock} left)`).join(', ') || 'None'}

📋 PENDING BILLS:
- Count: ${businessData.bills.pending}
- Amount: ₹${businessData.bills.pendingAmount.toLocaleString('en-IN')}

🏆 TOP SELLING PRODUCTS:
${businessData.topProducts.map((p: any, i: number) => `${i + 1}. ${p.name} - ₹${p.revenue.toLocaleString('en-IN')} (${p.quantity} units)`).join('\n')}

ALL TIME:
- Total Sales: ${businessData.total.sales}
- Total Revenue: ₹${businessData.total.revenue.toLocaleString('en-IN')}`;
    }

    if (queryType === 'overview') {
      systemPrompt += `

RESPONSE FORMAT FOR OVERVIEW:
Provide a comprehensive business overview using the real data above. Structure it as:
1. 📊 Today's Snapshot
2. 📈 This Month's Performance
3. 📦 Inventory Health
4. 💰 Financial Summary
5. ⚠️ Alerts & Recommendations

Keep it professional and actionable.`;
    } else if (queryType === 'query') {
      systemPrompt += `

RESPONSE FORMAT FOR QUERIES:
- Answer the specific question using ONLY the real data provided
- Be precise with numbers
- Add relevant context if helpful
- Suggest related insights when appropriate`;
    } else if (queryType === 'sale_add') {
      systemPrompt += `

RESPONSE FOR SALE ADD REQUESTS:
Currently, sales must be added through the Sales Management section in the app.
Guide the user to:
1. Go to Dashboard
2. Navigate to Sales section
3. Click "Add Sale" button
4. Fill in the product, quantity, and amount details

The app will automatically update inventory and generate invoice.`;
    }

    const fullSystemPrompt = systemPrompt + (contextData || '');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: fullSystemPrompt },
          { role: 'user', content: message }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to your workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error('AI Gateway error');
    }

    const data = await response.json();
    const aiMessage = data.choices?.[0]?.message?.content;

    return new Response(
      JSON.stringify({ 
        message: aiMessage,
        queryType,
        hasData: !!businessData
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Chatbot error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
