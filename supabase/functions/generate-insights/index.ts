// ============================================
// FILE: supabase/functions/generate-insights/index.ts
// Secured edge function with proper JWT verification
// ============================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface InsightRequest {
  businessType?: string;
  period?: 'week' | 'month' | 'quarter' | 'year';
  metrics?: string[];
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let body: InsightRequest = {};
    if (req.method === 'POST') {
      try {
        body = await req.json();
      } catch {
        return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    const period = body.period || 'month';
    const now = new Date();
    let startDate = new Date();

    switch (period) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    const startDateStr = startDate.toISOString().split('T')[0];

    const { data: salesData } = await supabase
      .from('Sales')
      .select('"Amount","Date","Quantity"')
      .eq('"User_id"', user.id)
      .gte('"Date"', startDateStr);

    const { data: inventoryData } = await supabase
      .from('Inventory')
      .select('"Item_name","Stock quantity","Price_per_unit","Category"')
      .eq('user_id', user.id)
      .order('"Stock quantity"', { ascending: true })
      .limit(50);

    const { data: financeData } = await supabase
      .from('finance')
      .select('amount, type, created_at')
      .eq('user_id', user.id);

    const insights = generateBusinessInsights({
      sales: salesData || [],
      products: inventoryData || [],
      finance: financeData || [],
      period,
      businessType: body.businessType || 'general',
    });

    return new Response(
      JSON.stringify({
        success: true,
        period,
        insights,
        metadata: {
          salesCount: salesData?.length || 0,
          productsCount: inventoryData?.length || 0,
          generatedAt: new Date().toISOString(),
        },
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});

// ==================== INSIGHT GENERATION LOGIC ====================
function generateBusinessInsights(data: {
  sales: any[];
  products: any[];
  finance: any[];
  period: string;
  businessType: string;
}): any[] {
  // Calculate totals from schema-correct fields
  const salesAmounts = data.sales.map((s: any) => Number(s["Amount"] || 0));
  const totalRevenue = salesAmounts.reduce((sum: number, v: number) => sum + v, 0);

  // Growth based on first vs second half of the period
  const midpoint = Math.floor(salesAmounts.length / 2);
  const firstHalfRevenue = salesAmounts.slice(0, midpoint).reduce((s, v) => s + v, 0);
  const secondHalfRevenue = salesAmounts.slice(midpoint).reduce((s, v) => s + v, 0);
  const growthRate = firstHalfRevenue > 0 ? ((secondHalfRevenue - firstHalfRevenue) / firstHalfRevenue) * 100 : 0;

  insights.push({
    type: 'revenue',
    title: 'Revenue Overview',
    value: totalRevenue,
    change: growthRate,
    trend: growthRate > 0 ? 'up' : 'down',
    description: `Total revenue of ₹${totalRevenue.toFixed(2)} with ${growthRate.toFixed(1)}% ${growthRate > 0 ? 'growth' : 'decline'}`,
  });

  // Low stock products using "Stock quantity"
  const lowStockProducts = data.products.filter((p: any) => Number(p["Stock quantity"] || 0) < 10);
  if (lowStockProducts.length > 0) {
    insights.push({
      type: 'alert',
      title: 'Low Stock Warning',
      severity: 'high',
      count: lowStockProducts.length,
      items: lowStockProducts.map((p: any) => p["Item_name"]) as string[],
      description: `${lowStockProducts.length} products are running low on stock`,
    });
  }

  // Sales trend
  const averageOrder = salesAmounts.length > 0 ? totalRevenue / salesAmounts.length : 0;
  insights.push({
    type: 'trend',
    title: 'Sales Trend',
    period: data.period,
    totalSales: salesAmounts.length,
    averageOrder,
    description: `${salesAmounts.length} sales with average order value of ₹${averageOrder.toFixed(2)}`,
  });

  // Finance-based KPIs
  const totalIncome = data.finance.filter((f: any) => f.type === 'income').reduce((s: number, r: any) => s + Number(r.amount || 0), 0);
  const totalExpense = data.finance.filter((f: any) => f.type === 'expense').reduce((s: number, r: any) => s + Number(r.amount || 0), 0);
  const netProfit = totalIncome - totalExpense;

  insights.push({
    type: 'finance',
    title: 'Profitability Snapshot',
    value: netProfit,
    description: `Income ₹${totalIncome.toFixed(2)} − Expenses ₹${totalExpense.toFixed(2)} = Net ₹${netProfit.toFixed(2)}`,
  });

  // High-value inventory focus
  const topValue = (data.products || [])
    .map((p: any) => ({
      name: p["Item_name"],
      value: Number(p["Price_per_unit"] || 0) * Number(p["Stock quantity"] || 0),
    }))
    .sort((a: any, b: any) => b.value - a.value)
    .slice(0, 3);
  if (topValue.length > 0) {
    insights.push({
      type: 'inventory',
      title: 'High-Value Inventory Focus',
      items: topValue,
      description: 'Items contributing most to inventory value.',
    });
  }

  // Actionable recommendations
  const suggestions: string[] = [];
  if (growthRate < 0) suggestions.push('Run a 10% weekday discount to recover declining growth.');
  if (lowStockProducts.length > 0) suggestions.push(`Restock ${Math.min(lowStockProducts.length, 3)} low-stock items today to prevent lost sales.`);
  if (netProfit < 0) suggestions.push('Reduce non-essential expenses or increase pricing on low-margin items.');
  if (averageOrder < 200) suggestions.push('Offer bundles or free add-ons above ₹500 to lift average order value.');

  if (suggestions.length > 0) {
    insights.push({
      type: 'recommendation',
      title: 'AI Recommendations',
      suggestions,
    });
  }

  return insights;
}