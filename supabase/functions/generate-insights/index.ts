// ============================================
// FILE: supabase/functions/generate-insights/index.ts
// Secured edge function with proper JWT verification
// ============================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  requireAuth,
  handleCors,
  successResponse,
  errorResponse,
  checkRateLimit,
  sanitizeInput,
  validateRequiredFields,
} from '../_shared/auth.ts';

interface InsightRequest {
  businessType?: string;
  period?: 'week' | 'month' | 'quarter' | 'year';
  metrics?: string[];
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // ==================== STEP 1: VERIFY JWT ====================
    const { user, userId, response: authResponse } = await requireAuth(req);
    
    if (authResponse) {
      console.error('Authentication failed');
      return authResponse;
    }

    console.log('✅ Authenticated user:', userId);

    // ==================== STEP 2: RATE LIMITING ====================
    const { allowed, remaining } = checkRateLimit(userId, 50, 60000); // 50 requests per minute
    
    if (!allowed) {
      console.error('Rate limit exceeded for user:', userId);
      return errorResponse('Rate limit exceeded. Please try again later.', 429);
    }

    console.log(`Rate limit: ${remaining} requests remaining`);

    // ==================== STEP 3: PARSE & VALIDATE REQUEST ====================
    let body: InsightRequest = {};
    
    if (req.method === 'POST') {
      try {
        body = await req.json();
        body = sanitizeInput(body); // Sanitize all inputs
      } catch (error) {
        return errorResponse('Invalid JSON in request body');
      }
    }

    // ==================== STEP 4: INITIALIZE SUPABASE WITH USER TOKEN ====================
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: req.headers.get('Authorization')! },
      },
    });

    // ==================== STEP 5: FETCH USER'S DATA ONLY ====================
    // CRITICAL: Always filter by authenticated userId, never trust client input!
    
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

    // Fetch sales data - ONLY for authenticated user
    const { data: salesData, error: salesError } = await supabase
      .from('invoices')
      .select('amount, created_at, status')
      .eq('user_id', userId) // ⚠️ CRITICAL: Always filter by userId from JWT
      .gte('created_at', startDate.toISOString());

    if (salesError) {
      console.error('Error fetching sales:', salesError);
      return errorResponse('Failed to fetch sales data', 500);
    }

    // Fetch products data - ONLY for authenticated user
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('name, price, stock, sales_count')
      .eq('user_id', userId) // ⚠️ CRITICAL: Always filter by userId from JWT
      .order('sales_count', { ascending: false })
      .limit(10);

    if (productsError) {
      console.error('Error fetching products:', productsError);
      return errorResponse('Failed to fetch products data', 500);
    }

    // Fetch customers data - ONLY for authenticated user
    const { data: customersData, error: customersError } = await supabase
      .from('customers')
      .select('id, name, total_purchases')
      .eq('user_id', userId); // ⚠️ CRITICAL: Always filter by userId from JWT

    if (customersError) {
      console.error('Error fetching customers:', customersError);
      return errorResponse('Failed to fetch customers data', 500);
    }

    // ==================== STEP 6: GENERATE INSIGHTS ====================
    const insights = generateBusinessInsights({
      sales: salesData || [],
      products: productsData || [],
      customers: customersData || [],
      period,
      businessType: body.businessType || 'general',
    });

    // ==================== STEP 7: LOG ACTIVITY ====================
    // Log this action for audit trail
    await supabase.from('activity_log').insert({
      user_id: userId,
      action: 'generate_insights',
      details: { period, metrics_count: insights.length },
      created_at: new Date().toISOString(),
    });

    console.log(`✅ Generated ${insights.length} insights for user:`, userId);

    // ==================== STEP 8: RETURN RESPONSE ====================
    return successResponse({
      success: true,
      userId, // Return the verified userId
      period,
      insights,
      metadata: {
        salesCount: salesData?.length || 0,
        productsCount: productsData?.length || 0,
        customersCount: customersData?.length || 0,
        generatedAt: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return errorResponse('Internal server error', 500);
  }
});

// ==================== INSIGHT GENERATION LOGIC ====================
function generateBusinessInsights(data: {
  sales: any[];
  products: any[];
  customers: any[];
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

  // Low stock alert
  const lowStockProducts = data.products.filter(p => p.stock < 10);
  
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

  // Customer insights
  const topCustomers = data.customers
    .sort((a, b) => (b.total_purchases || 0) - (a.total_purchases || 0))
    .slice(0, 5);

  if (topCustomers.length > 0) {
    insights.push({
      type: 'customers',
      title: 'Top Customers',
      items: topCustomers.map(c => ({
        name: c.name,
        purchases: c.total_purchases || 0,
      })),
      description: `Your top ${topCustomers.length} valued customers`,
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

  // AI-powered recommendations
  insights.push({
    type: 'recommendation',
    title: 'AI Recommendations',
    suggestions: [
      growthRate < 0 ? 'Consider running promotions to boost sales' : 'Keep up the great momentum!',
      lowStockProducts.length > 0 ? 'Restock low inventory items soon' : 'Inventory levels look good',
      data.customers.length < 50 ? 'Focus on customer acquisition' : 'Consider loyalty programs for retention',
    ],
  });

  return insights;
}