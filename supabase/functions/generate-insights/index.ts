import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InsightRequest {
  businessType?: string;
  period?: string;
  metrics?: string[];
  section?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the JWT token from the Authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Create Supabase client with the user's token
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify the token and get the user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;
    const { section } = await req.json() as InsightRequest;

    // Check if insights were generated in the last hour to save credits
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: recentInsights } = await supabase
      .from('ai_insights')
      .select('created_at')
      .eq('user_id', userId)
      .eq('section', section || 'dashboard')
      .gte('created_at', oneHourAgo)
      .limit(1);

    if (recentInsights && recentInsights.length > 0) {
      return new Response(
        JSON.stringify({ 
          message: 'Using recent insights to save AI credits',
          insights: [] 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch data for insights - using userId from JWT token
    const [salesData, inventoryData, financeData] = await Promise.all([
      supabase
        .from('Sales')
        .select('*')
        .eq('User_id', userId)
        .order('Date', { ascending: false })
        .limit(100),
      supabase
        .from('Inventory')
        .select('*')
        .eq('user_id', userId),
      supabase
        .from('finance')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(100)
    ]);

    const insights = generateBusinessInsights(
      salesData.data || [],
      inventoryData.data || [],
      financeData.data || [],
      { section }
    );

    // Store insights
    await supabase
      .from('ai_insights')
      .upsert({
        user_id: userId,
        section: section || 'dashboard',
        insights: insights as any,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,section'
      });

    return new Response(
      JSON.stringify({ insights }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generateBusinessInsights(
  sales: any[],
  inventory: any[],
  finance: any[],
  request: InsightRequest
): any[] {
  const insights: any[] = [];
  const section = request.section || 'dashboard';

  // Sales insights
  if (section === 'sales' || section === 'dashboard') {
    const totalRevenue = sales.reduce((sum, sale) => sum + (Number(sale.Amount) || 0), 0);
    const avgSale = sales.length > 0 ? totalRevenue / sales.length : 0;

    if (sales.length > 0) {
      insights.push({
        type: 'sales',
        title: '💰 Sales Performance',
        description: `Total revenue: ₹${totalRevenue.toLocaleString()}. Average sale: ₹${avgSale.toFixed(0)}`,
        value: totalRevenue,
        suggestions: [
          'Track peak sales hours to optimize staffing',
          'Offer loyalty rewards to increase repeat customers',
        ]
      });
    }

    // Calculate growth rate
    const last30Days = sales.filter(s => {
      const saleDate = new Date(s.Date);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return saleDate >= thirtyDaysAgo;
    });

    const previous30Days = sales.filter(s => {
      const saleDate = new Date(s.Date);
      const sixtyDaysAgo = new Date();
      const thirtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return saleDate >= sixtyDaysAgo && saleDate < thirtyDaysAgo;
    });

    const recentRevenue = last30Days.reduce((sum, sale) => sum + (Number(sale.Amount) || 0), 0);
    const previousRevenue = previous30Days.reduce((sum, sale) => sum + (Number(sale.Amount) || 0), 0);
    
    if (previousRevenue > 0) {
      const growthRate = ((recentRevenue - previousRevenue) / previousRevenue) * 100;
      insights.push({
        type: 'growth',
        title: growthRate >= 0 ? '📈 Growth Trend' : '📉 Revenue Decline',
        description: `${Math.abs(growthRate).toFixed(1)}% ${growthRate >= 0 ? 'increase' : 'decrease'} vs previous month`,
        change: growthRate,
        suggestions: growthRate < 0 ? [
          'Review pricing strategy',
          'Increase marketing efforts',
          'Analyze customer feedback'
        ] : [
          'Maintain current strategies',
          'Consider expanding product range'
        ]
      });
    }
  }

  // Inventory insights
  if (section === 'inventory' || section === 'dashboard') {
    const lowStockItems = inventory.filter(item => 
      (Number(item['Stock quantity']) || 0) < (Number(item.minStock) || 5)
    );

    if (lowStockItems.length > 0) {
      insights.push({
        type: 'inventory',
        title: '⚠️ Low Stock Alert',
        description: `${lowStockItems.length} items need restocking`,
        items: lowStockItems.map(i => i.Item_name).slice(0, 3),
        suggestions: [
          'Place orders for low-stock items',
          'Set up automatic reorder points',
          'Review supplier delivery times'
        ]
      });
    }

    const highValueItems = inventory
      .sort((a, b) => 
        (Number(b['Stock quantity']) * Number(b.Price_per_unit)) - 
        (Number(a['Stock quantity']) * Number(a.Price_per_unit))
      )
      .slice(0, 3);

    if (highValueItems.length > 0) {
      const totalInventoryValue = inventory.reduce((sum, item) => 
        sum + ((Number(item['Stock quantity']) || 0) * (Number(item.Price_per_unit) || 0)), 0
      );

      insights.push({
        type: 'inventory-value',
        title: '📦 Inventory Value',
        description: `Total inventory worth: ₹${totalInventoryValue.toLocaleString()}`,
        value: totalInventoryValue,
        suggestions: [
          'Monitor slow-moving inventory',
          'Consider seasonal promotions for overstocked items'
        ]
      });
    }
  }

  // Finance insights
  if (section === 'finance' || section === 'dashboard') {
    const income = finance
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    
    const expenses = finance
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    const profit = income - expenses;
    const profitMargin = income > 0 ? (profit / income) * 100 : 0;

    if (income > 0 || expenses > 0) {
      insights.push({
        type: 'finance',
        title: '💵 Financial Health',
        description: `Income: ₹${income.toLocaleString()} | Expenses: ₹${expenses.toLocaleString()} | Profit: ₹${profit.toLocaleString()} (${profitMargin.toFixed(1)}% margin)`,
        value: profit,
        suggestions: profitMargin < 20 ? [
          'Review and reduce non-essential expenses',
          'Negotiate better supplier rates',
          'Consider price optimization'
        ] : [
          'Strong profit margin - maintain current practices',
          'Consider reinvesting in business growth'
        ]
      });
    }
  }

  return insights;
}
