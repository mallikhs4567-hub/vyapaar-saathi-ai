import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, TrendingUp, Calendar, Edit, Trash2, Loader2, Activity, FileText, Download, X, IndianRupee } from 'lucide-react';
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

interface BillItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface ShopProfile {
  shop_name: string;
  shop_address: string;
  shop_phone: string;
  shop_email: string;
  full_name: string;
}

export const SalesManagement = () => {
  const { user } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [shopProfile, setShopProfile] = useState<ShopProfile | null>(null);
  const [viewingBill, setViewingBill] = useState<Sale | null>(null);
  const [isBillDialogOpen, setIsBillDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);

  // Bill form state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [billItems, setBillItems] = useState<BillItem[]>([
    { id: '1', name: '', quantity: 1, unitPrice: 0, total: 0 }
  ]);
  const [taxPercentage, setTaxPercentage] = useState(0);
  const [discountType, setDiscountType] = useState<'amount' | 'percentage'>('amount');
  const [discountValue, setDiscountValue] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'card'>('cash');
  const [notes, setNotes] = useState('');
  const [paidAmount, setPaidAmount] = useState(0);

  // Edit form state (simple)
  const [editForm, setEditForm] = useState({
    customerName: '',
    amount: '',
    items: '',
    quantity: '1'
  });

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
        items: sale.Product ? sale.Product.split(', ') : [],
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

  // Calculate totals
  const subtotal = billItems.reduce((sum, item) => sum + item.total, 0);
  const taxAmount = (subtotal * taxPercentage) / 100;
  const discountAmount = discountType === 'percentage' 
    ? (subtotal * discountValue) / 100 
    : discountValue;
  const grandTotal = subtotal + taxAmount - discountAmount;

  const generateBillNumber = (saleId: string) => {
    return `INV-${saleId.slice(-6).toUpperCase()}`;
  };

  const resetForm = () => {
    setCustomerName('');
    setCustomerPhone('');
    setBillItems([{ id: '1', name: '', quantity: 1, unitPrice: 0, total: 0 }]);
    setTaxPercentage(0);
    setDiscountType('amount');
    setDiscountValue(0);
    setPaymentMethod('cash');
    setNotes('');
    setPaidAmount(0);
  };

  const handleItemChange = (id: string, field: keyof BillItem, value: string | number) => {
    setBillItems(items => items.map(item => {
      if (item.id !== id) return item;
      
      const updated = { ...item, [field]: value };
      if (field === 'quantity' || field === 'unitPrice') {
        updated.total = updated.quantity * updated.unitPrice;
      }
      return updated;
    }));
  };

  const addItem = () => {
    setBillItems([...billItems, { 
      id: Date.now().toString(), 
      name: '', 
      quantity: 1, 
      unitPrice: 0, 
      total: 0 
    }]);
  };

  const removeItem = (id: string) => {
    if (billItems.length > 1) {
      setBillItems(billItems.filter(item => item.id !== id));
    }
  };

  const handleAddSale = async () => {
    if (!user) return;

    // Validation
    if (!customerName.trim()) {
      toast.error('Please enter customer name');
      return;
    }

    const validItems = billItems.filter(item => item.name.trim() && item.total > 0);
    if (validItems.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    try {
      // Create product string from items
      const productString = validItems.map(item => item.name).join(', ');
      const totalQuantity = validItems.reduce((sum, item) => sum + item.quantity, 0);

      const { error } = await supabase
        .from('Sales')
        .insert({
          User_id: user.id,
          Customer_name: customerName.trim(),
          Amount: grandTotal,
          Product: productString,
          Date: new Date().toISOString().split('T')[0],
          Quantity: totalQuantity
        });

      if (error) throw error;

      resetForm();
      setIsAddDialogOpen(false);
      toast.success('Sale recorded successfully!');
      await fetchSales();
    } catch (error) {
      toast.error('Failed to add sale');
    }
  };

  const handleEditSale = (sale: Sale) => {
    setEditingSale(sale);
    setEditForm({
      customerName: sale.customerName,
      amount: sale.amount.toString(),
      items: sale.items.join(', '),
      quantity: sale.quantity.toString()
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateSale = async () => {
    if (!user || !editingSale) return;

    if (!editForm.customerName.trim() || !editForm.amount) {
      toast.error('Please fill in customer name and amount');
      return;
    }

    try {
      const { error } = await supabase
        .from('Sales')
        .update({
          Customer_name: editForm.customerName.trim(),
          Amount: parseFloat(editForm.amount),
          Product: editForm.items,
          Quantity: parseInt(editForm.quantity) || 1
        })
        .eq('id', editingSale.id)
        .eq('User_id', user.id);

      if (error) throw error;

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
          ${sale.items.map(item => `
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #E2E8F0;">${item || 'Service'}</td>
              <td style="padding: 8px; text-align: center; border-bottom: 1px solid #E2E8F0;">${sale.quantity}</td>
              <td style="padding: 8px; text-align: right; border-bottom: 1px solid #E2E8F0;">₹${unitPrice.toFixed(2)}</td>
              <td style="padding: 8px; text-align: right; border-bottom: 1px solid #E2E8F0;">₹${sale.amount.toFixed(2)}</td>
            </tr>
          `).join('')}
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
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              New Bill
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Create Bill
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Customer Details */}
              <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
                <Label className="text-sm font-semibold">Customer Details</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="customerName" className="text-xs">Name *</Label>
                    <Input
                      id="customerName"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Customer name"
                      maxLength={100}
                    />
                  </div>
                  <div>
                    <Label htmlFor="customerPhone" className="text-xs">Phone</Label>
                    <Input
                      id="customerPhone"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="Optional"
                      maxLength={15}
                    />
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">Items</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addItem}>
                    <Plus className="h-3 w-3 mr-1" />
                    Add Item
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {billItems.map((item, index) => (
                    <div key={item.id} className="grid grid-cols-12 gap-2 items-end p-2 bg-muted/30 rounded-lg">
                      <div className="col-span-5">
                        {index === 0 && <Label className="text-[10px] text-muted-foreground">Item Name</Label>}
                        <Input
                          value={item.name}
                          onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                          placeholder="Item name"
                          className="h-9 text-sm"
                          maxLength={100}
                        />
                      </div>
                      <div className="col-span-2">
                        {index === 0 && <Label className="text-[10px] text-muted-foreground">Qty</Label>}
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(item.id, 'quantity', parseInt(e.target.value) || 1)}
                          className="h-9 text-sm"
                        />
                      </div>
                      <div className="col-span-3">
                        {index === 0 && <Label className="text-[10px] text-muted-foreground">Price</Label>}
                        <Input
                          type="number"
                          min="0"
                          value={item.unitPrice || ''}
                          onChange={(e) => handleItemChange(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                          placeholder="₹0"
                          className="h-9 text-sm"
                        />
                      </div>
                      <div className="col-span-2 flex items-center gap-1">
                        <span className="text-sm font-medium">₹{item.total}</span>
                        {billItems.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => removeItem(item.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tax & Discount */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Tax %</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={taxPercentage || ''}
                    onChange={(e) => setTaxPercentage(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label className="text-xs">Discount</Label>
                  <div className="flex gap-1">
                    <Input
                      type="number"
                      min="0"
                      value={discountValue || ''}
                      onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="flex-1"
                    />
                    <Select value={discountType} onValueChange={(v) => setDiscountType(v as 'amount' | 'percentage')}>
                      <SelectTrigger className="w-16">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="amount">₹</SelectItem>
                        <SelectItem value="percentage">%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Totals */}
              <div className="bg-primary/5 p-3 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                {taxAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax ({taxPercentage}%)</span>
                    <span>₹{taxAmount.toFixed(2)}</span>
                  </div>
                )}
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-success">
                    <span>Discount</span>
                    <span>-₹{discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Total</span>
                  <span className="text-primary">₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <Label className="text-xs">Payment Method</Label>
                <div className="flex gap-2 mt-2">
                  {(['cash', 'upi', 'card'] as const).map((method) => (
                    <Button
                      key={method}
                      type="button"
                      variant={paymentMethod === method ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPaymentMethod(method)}
                      className="flex-1"
                    >
                      {method.toUpperCase()}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label className="text-xs">Notes (Optional)</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional notes..."
                  className="h-16 resize-none"
                  maxLength={500}
                />
              </div>

              <Button onClick={handleAddSale} className="w-full" disabled={grandTotal <= 0}>
                <IndianRupee className="h-4 w-4 mr-1" />
                Create Bill - ₹{grandTotal.toFixed(2)}
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
                value={editForm.customerName}
                onChange={(e) => setEditForm(prev => ({ ...prev, customerName: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="editAmount">Amount (₹)</Label>
                <Input
                  id="editAmount"
                  type="number"
                  value={editForm.amount}
                  onChange={(e) => setEditForm(prev => ({ ...prev, amount: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="editQuantity">Quantity</Label>
                <Input
                  id="editQuantity"
                  type="number"
                  value={editForm.quantity}
                  onChange={(e) => setEditForm(prev => ({ ...prev, quantity: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="editItems">Item/Service</Label>
              <Input
                id="editItems"
                value={editForm.items}
                onChange={(e) => setEditForm(prev => ({ ...prev, items: e.target.value }))}
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

              <div className="text-center">
                <Badge variant="outline">#{generateBillNumber(viewingBill.id)}</Badge>
              </div>

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

              <div className="border rounded-lg overflow-hidden">
                <div className="grid grid-cols-4 gap-2 p-2 bg-muted text-xs font-medium">
                  <span className="col-span-2">Item</span>
                  <span className="text-center">Qty</span>
                  <span className="text-right">Total</span>
                </div>
                {viewingBill.items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-4 gap-2 p-2 text-sm border-t">
                    <span className="col-span-2">{item || 'Service'}</span>
                    <span className="text-center">{viewingBill.quantity}</span>
                    <span className="text-right font-medium">₹{viewingBill.amount}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-2 border-t-2 border-primary">
                <span className="font-semibold">Total</span>
                <span className="text-xl font-bold text-primary">₹{viewingBill.amount}</span>
              </div>

              <div className="flex items-center justify-center gap-2 text-success text-sm">
                <span>✓ Paid via {viewingBill.paymentMethod.toUpperCase()}</span>
              </div>

              <Button onClick={() => downloadBill(viewingBill)} className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Download Bill
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Sales List */}
      <div className="space-y-2">
        {sales.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No sales yet. Create your first bill!</p>
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
                      <span className="text-lg font-bold text-primary">₹{sale.amount.toLocaleString()}</span>
                      {sale.items.length > 0 && sale.items[0] && (
                        <Badge variant="secondary" className="text-[10px]">
                          {sale.items[0]}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {sale.date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      {sale.quantity > 1 && ` • Qty: ${sale.quantity}`}
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
