import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Eye, TrendingUp, Calendar, Edit, Trash2, Loader2, Activity, FileText, Download, Store } from 'lucide-react';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';

interface Sale {
  id: string;
  customerName: string;
  amount: number;
  items: string[];
  date: Date;
  quantity: number;
  paymentMethod: 'cash' | 'upi' | 'card';
}

interface ShopProfile {
  shop_name: string;
  shop_address: string;
  shop_phone: string;
  shop_email: string;
  full_name: string;
}

export const SalesManagement = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [shopProfile, setShopProfile] = useState<ShopProfile | null>(null);
  const [viewingBill, setViewingBill] = useState<Sale | null>(null);
  const [isBillDialogOpen, setIsBillDialogOpen] = useState(false);

  const [newSale, setNewSale] = useState<{
    customerName: string;
    amount: string;
    items: string;
    quantity: string;
    paymentMethod: 'cash' | 'upi' | 'card';
  }>({
    customerName: '',
    amount: '',
    items: '',
    quantity: '1',
    paymentMethod: 'cash'
  });

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('profiles')
      .select('shop_name, shop_address, shop_phone, shop_email, full_name')
      .eq('user_id', user.id)
      .single();

    if (data) {
      setShopProfile(data as ShopProfile);
    }
  }, [user]);

  const fetchSales = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('Sales')
        .select('*')
        .eq('User_id', user.id)
        .order('Date', { ascending: false });

      if (error) throw error;

      const formattedSales: Sale[] = (data || []).map(sale => ({
        id: sale.id,
        customerName: sale.Customer_name || '',
        amount: Number(sale.Amount) || 0,
        items: sale.Product ? [sale.Product] : [],
        date: sale.Date ? new Date(sale.Date) : new Date(),
        quantity: Number(sale.Quantity) || 1,
        paymentMethod: 'cash' as const
      }));

      setSales(formattedSales);
    } catch (error) {
      toast.error('Failed to load sales data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSales();
    fetchProfile();
  }, [fetchSales, fetchProfile]);

  const { isSubscribed } = useRealtimeSubscription({
    table: 'Sales',
    userId: user?.id,
    events: ['INSERT', 'UPDATE'],
    onDataChange: fetchSales,
    throttleMs: 1000,
    enableCreditSaver: true,
  });

  const generateBillNumber = (saleId: string) => {
    return `INV-${saleId.slice(-6).toUpperCase()}`;
  };

  const handleAddSale = async () => {
    if (!user || !newSale.customerName || !newSale.amount) {
      toast.error('Please fill in customer name and amount');
      return;
    }

    try {
      const { error } = await supabase
        .from('Sales')
        .insert({
          User_id: user.id,
          Customer_name: newSale.customerName,
          Amount: parseFloat(newSale.amount),
          Product: newSale.items,
          Date: new Date().toISOString().split('T')[0],
          Quantity: parseInt(newSale.quantity) || 1
        });

      if (error) throw error;

      setNewSale({ customerName: '', amount: '', items: '', quantity: '1', paymentMethod: 'cash' });
      setIsAddDialogOpen(false);
      toast.success(`₹${newSale.amount} sale added successfully`);
      await fetchSales();
    } catch (error) {
      toast.error('Failed to add sale');
    }
  };

  const handleEditSale = (sale: Sale) => {
    setEditingSale(sale);
    setNewSale({
      customerName: sale.customerName,
      amount: sale.amount.toString(),
      items: sale.items.join(', '),
      quantity: sale.quantity.toString(),
      paymentMethod: sale.paymentMethod
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateSale = async () => {
    if (!user || !editingSale || !newSale.customerName || !newSale.amount) {
      toast.error('Please fill in customer name and amount');
      return;
    }

    try {
      const { error } = await supabase
        .from('Sales')
        .update({
          Customer_name: newSale.customerName,
          Amount: parseFloat(newSale.amount),
          Product: newSale.items,
          Quantity: parseInt(newSale.quantity) || 1
        })
        .eq('id', editingSale.id)
        .eq('User_id', user.id);

      if (error) throw error;

      setNewSale({ customerName: '', amount: '', items: '', quantity: '1', paymentMethod: 'cash' });
      setIsEditDialogOpen(false);
      setEditingSale(null);
      toast.success('Sale updated successfully');
      await fetchSales();
    } catch (error) {
      toast.error('Failed to update sale');
    }
  };

  const handleDeleteSale = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('Sales')
        .delete()
        .eq('id', id)
        .eq('User_id', user.id);

      if (error) throw error;
      toast.success('Sale deleted successfully');
      await fetchSales();
    } catch (error) {
      toast.error('Failed to delete sale');
    }
  };

  const handleViewBill = (sale: Sale) => {
    setViewingBill(sale);
    setIsBillDialogOpen(true);
  };

  const downloadBill = async (sale: Sale) => {
    const billElement = document.createElement('div');
    billElement.style.width = '400px';
    billElement.style.padding = '24px';
    billElement.style.backgroundColor = 'white';
    billElement.style.fontFamily = 'Arial, sans-serif';
    
    const billNumber = generateBillNumber(sale.id);
    const unitPrice = sale.amount / sale.quantity;
    
    billElement.innerHTML = `
      <div style="text-align: center; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 2px solid #0EA5E9;">
        ${shopProfile?.shop_name ? `<h2 style="color: #1E293B; margin: 0 0 4px 0; font-size: 20px;">${shopProfile.shop_name}</h2>` : ''}
        ${shopProfile?.shop_address ? `<p style="margin: 4px 0; color: #64748B; font-size: 12px;">${shopProfile.shop_address}</p>` : ''}
        <div style="color: #64748B; font-size: 11px;">
          ${shopProfile?.shop_phone ? `<span>📞 ${shopProfile.shop_phone}</span>` : ''}
          ${shopProfile?.shop_phone && shopProfile?.shop_email ? ' | ' : ''}
          ${shopProfile?.shop_email ? `<span>✉️ ${shopProfile.shop_email}</span>` : ''}
        </div>
      </div>
      
      <div style="text-align: center; margin-bottom: 16px;">
        <h3 style="color: #0EA5E9; margin: 0 0 4px 0; font-size: 16px;">INVOICE</h3>
        <p style="color: #64748B; font-size: 12px; margin: 0;">#${billNumber}</p>
      </div>
      
      <div style="margin-bottom: 16px; padding: 12px; background: #F8FAFC; border-radius: 8px;">
        <p style="margin: 0 0 4px 0; font-size: 12px; color: #64748B;">Customer</p>
        <p style="margin: 0; font-size: 14px; font-weight: 600; color: #1E293B;">${sale.customerName}</p>
        <p style="margin: 8px 0 0 0; font-size: 11px; color: #64748B;">Date: ${sale.date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 13px;">
        <thead>
          <tr style="background-color: #F1F5F9;">
            <th style="padding: 8px; text-align: left; border-bottom: 1px solid #E2E8F0;">Item</th>
            <th style="padding: 8px; text-align: center; border-bottom: 1px solid #E2E8F0;">Qty</th>
            <th style="padding: 8px; text-align: right; border-bottom: 1px solid #E2E8F0;">Price</th>
            <th style="padding: 8px; text-align: right; border-bottom: 1px solid #E2E8F0;">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #E2E8F0;">${sale.items.join(', ') || 'Service'}</td>
            <td style="padding: 8px; text-align: center; border-bottom: 1px solid #E2E8F0;">${sale.quantity}</td>
            <td style="padding: 8px; text-align: right; border-bottom: 1px solid #E2E8F0;">₹${unitPrice.toFixed(2)}</td>
            <td style="padding: 8px; text-align: right; border-bottom: 1px solid #E2E8F0;">₹${sale.amount.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>

      <div style="text-align: right; padding-top: 8px; border-top: 2px solid #0EA5E9;">
        <p style="margin: 4px 0; font-size: 16px; font-weight: bold; color: #0EA5E9;">Total: ₹${sale.amount.toFixed(2)}</p>
        <p style="margin: 4px 0; font-size: 12px; color: #10B981;">✓ Paid via ${sale.paymentMethod.toUpperCase()}</p>
      </div>

      <div style="margin-top: 20px; padding-top: 12px; border-top: 1px dashed #CBD5E1; text-align: center;">
        <p style="margin: 0; color: #64748B; font-size: 11px;">Thank you for your business! 🙏</p>
      </div>
    `;

    document.body.appendChild(billElement);

    const canvas = await html2canvas(billElement, {
      scale: 2,
      backgroundColor: '#ffffff',
    });

    document.body.removeChild(billElement);

    const link = document.createElement('a');
    link.download = `invoice-${billNumber}.png`;
    link.href = canvas.toDataURL();
    link.click();

    toast.success('Bill downloaded!');
  };

  const totalSales = sales.reduce((sum, sale) => sum + sale.amount, 0);
  const todaySales = sales.filter(sale => 
    sale.date.toDateString() === new Date().toDateString()
  ).reduce((sum, sale) => sum + sale.amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Sales Overview */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="touch-feedback">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">Today</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl font-bold">₹{todaySales.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="touch-feedback">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total</CardTitle>
            <Calendar className="h-4 w-4 text-info" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl font-bold">₹{totalSales.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Header with Add Button */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold">Sales</h3>
          {isSubscribed && (
            <Badge variant="outline" className="gap-1 text-[10px]">
              <Activity className="h-3 w-3 text-success" />
              Live
            </Badge>
          )}
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Sale
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record New Sale</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="customerName">Customer Name</Label>
                <Input
                  id="customerName"
                  value={newSale.customerName}
                  onChange={(e) => setNewSale(prev => ({ ...prev, customerName: e.target.value }))}
                  placeholder="Enter customer name"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="amount">Amount (₹)</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={newSale.amount}
                    onChange={(e) => setNewSale(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={newSale.quantity}
                    onChange={(e) => setNewSale(prev => ({ ...prev, quantity: e.target.value }))}
                    placeholder="1"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="items">Item/Service</Label>
                <Input
                  id="items"
                  value={newSale.items}
                  onChange={(e) => setNewSale(prev => ({ ...prev, items: e.target.value }))}
                  placeholder="Product or service name"
                />
              </div>
              <div>
                <Label>Payment Method</Label>
                <div className="flex gap-2 mt-2">
                  {(['cash', 'upi', 'card'] as const).map((method) => (
                    <Button
                      key={method}
                      variant={newSale.paymentMethod === method ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setNewSale(prev => ({ ...prev, paymentMethod: method }))}
                      className="flex-1"
                    >
                      {method.toUpperCase()}
                    </Button>
                  ))}
                </div>
              </div>
              <Button onClick={handleAddSale} className="w-full">
                Record Sale
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Sale Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Sale</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editCustomerName">Customer Name</Label>
              <Input
                id="editCustomerName"
                value={newSale.customerName}
                onChange={(e) => setNewSale(prev => ({ ...prev, customerName: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="editAmount">Amount (₹)</Label>
                <Input
                  id="editAmount"
                  type="number"
                  value={newSale.amount}
                  onChange={(e) => setNewSale(prev => ({ ...prev, amount: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="editQuantity">Quantity</Label>
                <Input
                  id="editQuantity"
                  type="number"
                  value={newSale.quantity}
                  onChange={(e) => setNewSale(prev => ({ ...prev, quantity: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="editItems">Item/Service</Label>
              <Input
                id="editItems"
                value={newSale.items}
                onChange={(e) => setNewSale(prev => ({ ...prev, items: e.target.value }))}
              />
            </div>
            <Button onClick={handleUpdateSale} className="w-full">
              Update Sale
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Bill Dialog */}
      <Dialog open={isBillDialogOpen} onOpenChange={setIsBillDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Invoice
            </DialogTitle>
          </DialogHeader>
          {viewingBill && (
            <div className="space-y-4">
              {/* Shop Header */}
              {shopProfile?.shop_name && (
                <div className="text-center pb-3 border-b border-primary">
                  <h3 className="font-bold text-lg">{shopProfile.shop_name}</h3>
                  {shopProfile.shop_address && (
                    <p className="text-xs text-muted-foreground">{shopProfile.shop_address}</p>
                  )}
                  <div className="text-xs text-muted-foreground mt-1">
                    {shopProfile.shop_phone && <span>📞 {shopProfile.shop_phone}</span>}
                    {shopProfile.shop_phone && shopProfile.shop_email && ' | '}
                    {shopProfile.shop_email && <span>✉️ {shopProfile.shop_email}</span>}
                  </div>
                </div>
              )}

              {/* Bill Number */}
              <div className="text-center">
                <Badge variant="outline">#{generateBillNumber(viewingBill.id)}</Badge>
              </div>

              {/* Customer Info */}
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-xs text-muted-foreground">Customer</p>
                <p className="font-semibold">{viewingBill.customerName}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {viewingBill.date.toLocaleDateString('en-IN', { 
                    day: '2-digit', 
                    month: 'short', 
                    year: 'numeric' 
                  })}
                </p>
              </div>

              {/* Items */}
              <div className="border rounded-lg overflow-hidden">
                <div className="grid grid-cols-4 gap-2 p-2 bg-muted text-xs font-medium">
                  <span className="col-span-2">Item</span>
                  <span className="text-center">Qty</span>
                  <span className="text-right">Total</span>
                </div>
                <div className="grid grid-cols-4 gap-2 p-2 text-sm">
                  <span className="col-span-2">{viewingBill.items.join(', ') || 'Service'}</span>
                  <span className="text-center">{viewingBill.quantity}</span>
                  <span className="text-right font-medium">₹{viewingBill.amount}</span>
                </div>
              </div>

              {/* Total */}
              <div className="flex justify-between items-center pt-2 border-t-2 border-primary">
                <span className="font-semibold">Total</span>
                <span className="text-xl font-bold text-primary">₹{viewingBill.amount}</span>
              </div>

              <div className="flex items-center justify-center gap-2 text-success text-sm">
                <span>✓ Paid via {viewingBill.paymentMethod.toUpperCase()}</span>
              </div>

              {/* Download Button */}
              <Button onClick={() => downloadBill(viewingBill)} className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Download Bill
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Sales List - Mobile Optimized */}
      <div className="space-y-2">
        {sales.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No sales yet. Add your first sale!</p>
          </Card>
        ) : (
          sales.map((sale) => (
            <Card key={sale.id} className="touch-feedback">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{sale.customerName}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-primary"
                        onClick={() => handleViewBill(sale)}
                      >
                        <FileText className="h-3.5 w-3.5 mr-1" />
                        Bill
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-lg font-bold text-primary">₹{sale.amount}</span>
                      {sale.items.length > 0 && sale.items[0] && (
                        <Badge variant="secondary" className="text-[10px]">
                          {sale.items[0]}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {sale.date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      {' • '}
                      Qty: {sale.quantity}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => handleEditSale(sale)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleDeleteSale(sale.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
