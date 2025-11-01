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

    const { data: salesData } = await supabase
      .from('Sales')
      .select('amount, created_at, status')
      .eq('user_id', user.id)
      .gte('created_at', startDate.toISOString());

    const { data: inventoryData } = await supabase
      .from('Inventory')
      .select('name, price, quantity')
      .eq('user_id', user.id)
      .order('quantity', { ascending: false })
      .limit(10);

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
  const insights = [];

  // Calculate total revenue
  const totalRevenue = data.sales
    .filter(s => s.status === 'paid')
    .reduce((sum, sale) => sum + (sale.amount || 0), 0);

  // Calculate growth
  const midpoint = Math.floor(data.sales.length / 2);
  const firstHalf = data.sales.slice(0, midpoint);
  const secondHalf = data.sales.slice(midpoint);
  
  const firstHalfRevenue = firstHalf.reduce((sum, s) => sum + (s.amount || 0), 0);
  const secondHalfRevenue = secondHalf.reduce((sum, s) => sum + (s.amount || 0), 0);
  
  const growthRate = firstHalfRevenue > 0 
    ? ((secondHalfRevenue - firstHalfRevenue) / firstHalfRevenue) * 100 
    : 0;

  insights.push({
    type: 'revenue',
    title: 'Revenue Overview',
    value: totalRevenue,
    change: growthRate,
    trend: growthRate > 0 ? 'up' : 'down',
    description: `Total revenue of ₹${totalRevenue.toFixed(2)} with ${growthRate.toFixed(1)}% ${growthRate > 0 ? 'growth' : 'decline'}`,
  });

  // Top selling products
  const topProducts = data.products.slice(0, 5);
  
  if (topProducts.length > 0) {
    insights.push({
      type: 'products',
      title: 'Top Selling Products',
      items: topProducts.map(p => ({
        name: p.name,
        sales: p.sales_count || 0,
        stock: p.stock,
      })),
      description: `Your top ${topProducts.length} best-selling products`,
    });
  }

  const lowStockProducts = data.products.filter(p => (p.quantity || 0) < 10);
  
  if (lowStockProducts.length > 0) {
    insights.push({
      type: 'alert',
      title: 'Low Stock Warning',
      severity: 'high',
      count: lowStockProducts.length,
      items: lowStockProducts.map(p => p.name),
      description: `${lowStockProducts.length} products are running low on stock`,
    });
  }

  // Sales trend
  insights.push({
    type: 'trend',
    title: 'Sales Trend',
    period: data.period,
    totalSales: data.sales.length,
    averageOrder: data.sales.length > 0 ? totalRevenue / data.sales.length : 0,
    description: `${data.sales.length} sales with average order value of ₹${data.sales.length > 0 ? (totalRevenue / data.sales.length).toFixed(2) : 0}`,
  });

  insights.push({
    type: 'recommendation',
    title: 'AI Recommendations',
    suggestions: [
      growthRate < 0 ? 'Consider running promotions to boost sales' : 'Keep up the great momentum!',
      lowStockProducts.length > 0 ? 'Restock low inventory items soon' : 'Inventory levels look good',
    ],
  });

  return insights;
}