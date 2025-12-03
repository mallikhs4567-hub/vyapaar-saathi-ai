import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Plus, FileText, Download, Trash2, Edit, IndianRupee, Calendar, User, Phone, Store } from 'lucide-react';
import html2canvas from 'html2canvas';

interface Bill {
  id: string;
  bill_number: string;
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  customer_address?: string;
  bill_date: string;
  due_date?: string;
  subtotal: number;
  tax_percentage: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  paid_amount: number;
  status: 'paid' | 'unpaid' | 'partial' | 'cancelled';
  notes?: string;
}

interface BillItem {
  id?: string;
  product_name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export const BillingManagement = () => {
  const { user } = useAuth();
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Form state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [items, setItems] = useState<BillItem[]>([{ product_name: '', quantity: 1, unit_price: 0, total_price: 0 }]);
  const [taxPercentage, setTaxPercentage] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountType, setDiscountType] = useState<'amount' | 'percentage'>('amount');
  const [notes, setNotes] = useState('');
  const [paidAmount, setPaidAmount] = useState(0);
  
  // Shop details
  const [shopName, setShopName] = useState('');
  const [shopAddress, setShopAddress] = useState('');
  const [shopPhone, setShopPhone] = useState('');
  const [shopEmail, setShopEmail] = useState('');

  useEffect(() => {
    if (user) {
      fetchBills();
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('profiles')
      .select('shop_name, shop_address, shop_phone, shop_email')
      .eq('user_id', user.id)
      .single();

    if (data) {
      setShopName(data.shop_name || '');
      setShopAddress(data.shop_address || '');
      setShopPhone(data.shop_phone || '');
      setShopEmail(data.shop_email || '');
    }
  };

  const fetchBills = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('bills')
      .select('*')
      .eq('user_id', user.id)
      .order('bill_date', { ascending: false });

    if (error) {
      toast.error('Failed to fetch bills');
      console.error('Error:', error);
    } else {
      setBills((data || []) as Bill[]);
    }
    setLoading(false);
  };

  const generateBillNumber = () => {
    const date = new Date();
    const timestamp = date.getTime().toString().slice(-6);
    return `INV-${timestamp}`;
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.total_price, 0);
    const taxAmount = (subtotal * taxPercentage) / 100;
    const actualDiscount = discountType === 'percentage' 
      ? (subtotal * discountAmount) / 100 
      : discountAmount;
    const total = subtotal + taxAmount - actualDiscount;
    return { subtotal, taxAmount, total, actualDiscount };
  };

  const handleItemChange = (index: number, field: keyof BillItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    if (field === 'quantity' || field === 'unit_price') {
      newItems[index].total_price = newItems[index].quantity * newItems[index].unit_price;
    }
    
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { product_name: '', quantity: 1, unit_price: 0, total_price: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const resetForm = () => {
    setCustomerName('');
    setCustomerPhone('');
    setCustomerEmail('');
    setCustomerAddress('');
    setBillDate(new Date().toISOString().split('T')[0]);
    setDueDate('');
    setItems([{ product_name: '', quantity: 1, unit_price: 0, total_price: 0 }]);
    setTaxPercentage(0);
    setDiscountAmount(0);
    setDiscountType('amount');
    setNotes('');
    setPaidAmount(0);
    setEditingBill(null);
    // Keep shop details as they rarely change
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const { subtotal, taxAmount, total, actualDiscount } = calculateTotals();
    
    let status: 'paid' | 'unpaid' | 'partial' = 'unpaid';
    if (paidAmount >= total) status = 'paid';
    else if (paidAmount > 0) status = 'partial';

    const billData = {
      user_id: user.id,
      bill_number: editingBill?.bill_number || generateBillNumber(),
      customer_name: customerName,
      customer_phone: customerPhone || null,
      customer_email: customerEmail || null,
      customer_address: customerAddress || null,
      bill_date: billDate,
      due_date: dueDate || null,
      subtotal,
      tax_percentage: taxPercentage,
      tax_amount: taxAmount,
      discount_amount: actualDiscount,
      total_amount: total,
      paid_amount: paidAmount,
      status,
      notes: notes || null,
    };

    let billId = editingBill?.id;

    if (editingBill) {
      const { error } = await supabase
        .from('bills')
        .update(billData)
        .eq('id', editingBill.id);

      if (error) {
        toast.error('Failed to update bill');
        return;
      }

      await supabase.from('bill_items').delete().eq('bill_id', editingBill.id);
    } else {
      const { data, error } = await supabase
        .from('bills')
        .insert([billData])
        .select()
        .single();

      if (error) {
        toast.error('Failed to create bill');
        return;
      }
      billId = data.id;
    }

    const itemsData = items
      .filter(item => item.product_name.trim() !== '')
      .map(item => ({
        bill_id: billId,
        product_name: item.product_name,
        description: item.description || null,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
      }));

    if (itemsData.length > 0) {
      const { error: itemsError } = await supabase
        .from('bill_items')
        .insert(itemsData);

      if (itemsError) {
        toast.error('Failed to save bill items');
        return;
      }
    }

    toast.success(editingBill ? 'Bill updated successfully' : 'Bill created successfully');
    setIsDialogOpen(false);
    resetForm();
    fetchBills();
  };

  const handleEdit = async (bill: Bill) => {
    setEditingBill(bill);
    setCustomerName(bill.customer_name);
    setCustomerPhone(bill.customer_phone || '');
    setCustomerEmail(bill.customer_email || '');
    setCustomerAddress(bill.customer_address || '');
    setBillDate(bill.bill_date);
    setDueDate(bill.due_date || '');
    setTaxPercentage(bill.tax_percentage);
    setDiscountAmount(bill.discount_amount);
    setNotes(bill.notes || '');
    setPaidAmount(bill.paid_amount);

    const { data } = await supabase
      .from('bill_items')
      .select('*')
      .eq('bill_id', bill.id);

    if (data && data.length > 0) {
      setItems(data.map(item => ({
        id: item.id,
        product_name: item.product_name,
        description: item.description || '',
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
      })));
    }

    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this bill?')) return;

    const { error } = await supabase
      .from('bills')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete bill');
    } else {
      toast.success('Bill deleted successfully');
      fetchBills();
    }
  };

  const downloadBillPDF = async (bill: Bill) => {
    const { data: itemsData } = await supabase
      .from('bill_items')
      .select('*')
      .eq('bill_id', bill.id);

    const billElement = document.createElement('div');
    billElement.style.width = '800px';
    billElement.style.padding = '40px';
    billElement.style.backgroundColor = 'white';
    billElement.style.fontFamily = 'Arial, sans-serif';
    
    billElement.innerHTML = `
      ${shopName ? `
      <div style="text-align: center; margin-bottom: 20px; padding-bottom: 20px; border-bottom: 2px solid #0EA5E9;">
        <h2 style="color: #1E293B; margin: 0 0 5px 0; font-size: 24px;">${shopName}</h2>
        ${shopAddress ? `<p style="margin: 5px 0; color: #64748B; font-size: 14px;">${shopAddress}</p>` : ''}
        <div style="color: #64748B; font-size: 13px;">
          ${shopPhone ? `<span>📞 ${shopPhone}</span>` : ''}
          ${shopPhone && shopEmail ? ' | ' : ''}
          ${shopEmail ? `<span>✉️ ${shopEmail}</span>` : ''}
        </div>
      </div>
      ` : ''}
      
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #0EA5E9; margin-bottom: 5px;">INVOICE</h1>
        <p style="color: #64748B; font-size: 14px;">Bill #${bill.bill_number}</p>
      </div>
      
      <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
        <div>
          <h3 style="color: #1E293B; margin-bottom: 10px;">Bill To:</h3>
          <p style="margin: 5px 0;"><strong>${bill.customer_name}</strong></p>
          ${bill.customer_phone ? `<p style="margin: 5px 0; color: #64748B;">Phone: ${bill.customer_phone}</p>` : ''}
          ${bill.customer_email ? `<p style="margin: 5px 0; color: #64748B;">Email: ${bill.customer_email}</p>` : ''}
          ${bill.customer_address ? `<p style="margin: 5px 0; color: #64748B;">${bill.customer_address}</p>` : ''}
        </div>
        <div style="text-align: right;">
          <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date(bill.bill_date).toLocaleDateString()}</p>
          ${bill.due_date ? `<p style="margin: 5px 0;"><strong>Due Date:</strong> ${new Date(bill.due_date).toLocaleDateString()}</p>` : ''}
          <p style="margin: 5px 0;"><strong>Status:</strong> <span style="color: ${bill.status === 'paid' ? '#10B981' : bill.status === 'partial' ? '#F59E0B' : '#EF4444'}; text-transform: uppercase;">${bill.status}</span></p>
        </div>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
        <thead>
          <tr style="background-color: #F1F5F9;">
            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #CBD5E1;">Item</th>
            <th style="padding: 12px; text-align: center; border-bottom: 2px solid #CBD5E1;">Qty</th>
            <th style="padding: 12px; text-align: right; border-bottom: 2px solid #CBD5E1;">Price</th>
            <th style="padding: 12px; text-align: right; border-bottom: 2px solid #CBD5E1;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsData?.map(item => `
            <tr>
              <td style="padding: 12px; border-bottom: 1px solid #E2E8F0;">
                <strong>${item.product_name}</strong>
                ${item.description ? `<br><span style="color: #64748B; font-size: 12px;">${item.description}</span>` : ''}
              </td>
              <td style="padding: 12px; text-align: center; border-bottom: 1px solid #E2E8F0;">${item.quantity}</td>
              <td style="padding: 12px; text-align: right; border-bottom: 1px solid #E2E8F0;">₹${Number(item.unit_price).toFixed(2)}</td>
              <td style="padding: 12px; text-align: right; border-bottom: 1px solid #E2E8F0;">₹${Number(item.total_price).toFixed(2)}</td>
            </tr>
          `).join('') || ''}
        </tbody>
      </table>

      <div style="text-align: right; margin-bottom: 20px;">
        <p style="margin: 8px 0;"><strong>Subtotal:</strong> ₹${Number(bill.subtotal).toFixed(2)}</p>
        ${bill.tax_percentage > 0 ? `<p style="margin: 8px 0;"><strong>Tax (${bill.tax_percentage}%):</strong> ₹${Number(bill.tax_amount).toFixed(2)}</p>` : ''}
        ${bill.discount_amount > 0 ? `<p style="margin: 8px 0; color: #10B981;"><strong>Discount:</strong> -₹${Number(bill.discount_amount).toFixed(2)}</p>` : ''}
        <p style="margin: 8px 0; font-size: 18px; color: #0EA5E9;"><strong>Total:</strong> ₹${Number(bill.total_amount).toFixed(2)}</p>
        <p style="margin: 8px 0; color: #10B981;"><strong>Paid:</strong> ₹${Number(bill.paid_amount).toFixed(2)}</p>
        ${bill.paid_amount < bill.total_amount ? `<p style="margin: 8px 0; color: #EF4444;"><strong>Balance Due:</strong> ₹${Number(bill.total_amount - bill.paid_amount).toFixed(2)}</p>` : ''}
      </div>

      ${bill.notes ? `<div style="margin-top: 30px; padding: 15px; background-color: #F1F5F9; border-radius: 8px;">
        <p style="margin: 0; color: #64748B; font-size: 14px;"><strong>Notes:</strong> ${bill.notes}</p>
      </div>` : ''}

      <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #E2E8F0; text-align: center; color: #64748B; font-size: 12px;">
        <p>Thank you for your business!</p>
      </div>
    `;

    document.body.appendChild(billElement);

    const canvas = await html2canvas(billElement, {
      scale: 2,
      backgroundColor: '#ffffff',
    });

    document.body.removeChild(billElement);

    const link = document.createElement('a');
    link.download = `invoice-${bill.bill_number}.png`;
    link.href = canvas.toDataURL();
    link.click();

    toast.success('Bill downloaded successfully');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-500/10 text-green-700 border-green-500/20';
      case 'unpaid': return 'bg-red-500/10 text-red-700 border-red-500/20';
      case 'partial': return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20';
      case 'cancelled': return 'bg-gray-500/10 text-gray-700 border-gray-500/20';
      default: return 'bg-gray-500/10 text-gray-700 border-gray-500/20';
    }
  };

  const filteredBills = filterStatus === 'all' 
    ? bills 
    : bills.filter(bill => bill.status === filterStatus);

  const { subtotal, taxAmount, total, actualDiscount } = calculateTotals();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Billing & Invoices
              </CardTitle>
              <CardDescription>Create and manage customer invoices</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Bill
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingBill ? 'Edit Bill' : 'Create New Bill'}</DialogTitle>
                  <DialogDescription>
                    Fill in the details to {editingBill ? 'update' : 'create'} an invoice
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Shop Details Section */}
                  <div className="bg-muted/50 p-4 rounded-lg space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Store className="h-4 w-4 text-primary" />
                      <Label className="text-base font-semibold">Shop Details (for Invoice Header)</Label>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="shopName">Shop Name</Label>
                        <Input
                          id="shopName"
                          value={shopName}
                          onChange={(e) => setShopName(e.target.value)}
                          placeholder="Your Business Name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="shopPhone">Shop Phone</Label>
                        <Input
                          id="shopPhone"
                          type="tel"
                          value={shopPhone}
                          onChange={(e) => setShopPhone(e.target.value)}
                          placeholder="Business contact number"
                        />
                      </div>
                      <div>
                        <Label htmlFor="shopEmail">Shop Email</Label>
                        <Input
                          id="shopEmail"
                          type="email"
                          value={shopEmail}
                          onChange={(e) => setShopEmail(e.target.value)}
                          placeholder="business@email.com"
                        />
                      </div>
                      <div className="md:col-span-1">
                        <Label htmlFor="shopAddress">Shop Address</Label>
                        <Input
                          id="shopAddress"
                          value={shopAddress}
                          onChange={(e) => setShopAddress(e.target.value)}
                          placeholder="Full business address"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Customer Details Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="customerName">Customer Name *</Label>
                      <Input
                        id="customerName"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="customerPhone">Phone Number</Label>
                      <Input
                        id="customerPhone"
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="customerEmail">Email</Label>
                      <Input
                        id="customerEmail"
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="billDate">Bill Date *</Label>
                      <Input
                        id="billDate"
                        type="date"
                        value={billDate}
                        onChange={(e) => setBillDate(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="dueDate">Due Date</Label>
                      <Input
                        id="dueDate"
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Customer Address</Label>
                    <Textarea
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      rows={2}
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <Label>Items *</Label>
                      <Button type="button" variant="outline" size="sm" onClick={addItem}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add Item
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      {items.map((item, index) => (
                        <Card key={index} className="p-4">
                          <div className="grid grid-cols-12 gap-3">
                            <div className="col-span-12 md:col-span-4">
                              <Label>Product Name *</Label>
                              <Input
                                value={item.product_name}
                                onChange={(e) => handleItemChange(index, 'product_name', e.target.value)}
                                required
                              />
                            </div>
                            <div className="col-span-12 md:col-span-3">
                              <Label>Description</Label>
                              <Input
                                value={item.description || ''}
                                onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                              />
                            </div>
                            <div className="col-span-4 md:col-span-2">
                              <Label>Quantity *</Label>
                              <Input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                                required
                              />
                            </div>
                            <div className="col-span-4 md:col-span-2">
                              <Label>Price *</Label>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.unit_price}
                                onChange={(e) => handleItemChange(index, 'unit_price', Number(e.target.value))}
                                required
                              />
                            </div>
                            <div className="col-span-3 md:col-span-1 flex items-end">
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                onClick={() => removeItem(index)}
                                disabled={items.length === 1}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mt-2">
                            Total: ₹{item.total_price.toFixed(2)}
                          </p>
                        </Card>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="taxPercentage">Tax %</Label>
                      <Input
                        id="taxPercentage"
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={taxPercentage}
                        onChange={(e) => setTaxPercentage(Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label htmlFor="discountAmount">Discount</Label>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs ${discountType === 'amount' ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>₹</span>
                          <Switch
                            checked={discountType === 'percentage'}
                            onCheckedChange={(checked) => setDiscountType(checked ? 'percentage' : 'amount')}
                          />
                          <span className={`text-xs ${discountType === 'percentage' ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>%</span>
                        </div>
                      </div>
                      <Input
                        id="discountAmount"
                        type="number"
                        min="0"
                        max={discountType === 'percentage' ? 100 : undefined}
                        step="0.01"
                        value={discountAmount}
                        onChange={(e) => setDiscountAmount(Number(e.target.value))}
                        placeholder={discountType === 'percentage' ? 'Enter %' : 'Enter amount'}
                      />
                    </div>
                    <div>
                      <Label htmlFor="paidAmount">Paid Amount</Label>
                      <Input
                        id="paidAmount"
                        type="number"
                        min="0"
                        step="0.01"
                        value={paidAmount}
                        onChange={(e) => setPaidAmount(Number(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="bg-muted p-4 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
                    </div>
                    {taxPercentage > 0 && (
                      <div className="flex justify-between">
                        <span>Tax ({taxPercentage}%):</span>
                        <span className="font-semibold">₹{taxAmount.toFixed(2)}</span>
                      </div>
                    )}
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount {discountType === 'percentage' ? `(${discountAmount}%)` : ''}:</span>
                        <span className="font-semibold">-₹{actualDiscount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg border-t pt-2">
                      <span className="font-bold">Total:</span>
                      <span className="font-bold text-primary">₹{total.toFixed(2)}</span>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <DialogFooter>
                    <Button type="submit">
                      {editingBill ? 'Update Bill' : 'Create Bill'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent>
          <div className="flex gap-2 mb-4">
            <Button
              variant={filterStatus === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('all')}
            >
              All
            </Button>
            <Button
              variant={filterStatus === 'unpaid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('unpaid')}
            >
              Unpaid
            </Button>
            <Button
              variant={filterStatus === 'partial' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('partial')}
            >
              Partial
            </Button>
            <Button
              variant={filterStatus === 'paid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('paid')}
            >
              Paid
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading bills...</div>
          ) : filteredBills.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No bills found. Create your first invoice!
            </div>
          ) : (
            <div className="space-y-3">
              {filteredBills.map((bill) => (
                <Card key={bill.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-lg">#{bill.bill_number}</span>
                        <Badge className={getStatusColor(bill.status)}>
                          {bill.status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <User className="h-4 w-4" />
                          <span>{bill.customer_name}</span>
                        </div>
                        {bill.customer_phone && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="h-4 w-4" />
                            <span>{bill.customer_phone}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(bill.bill_date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2 font-semibold text-primary">
                          <IndianRupee className="h-4 w-4" />
                          <span>₹{Number(bill.total_amount).toLocaleString()}</span>
                        </div>
                      </div>

                      {bill.paid_amount < bill.total_amount && (
                        <p className="text-sm text-red-600">
                          Due: ₹{Number(bill.total_amount - bill.paid_amount).toLocaleString()}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => downloadBillPDF(bill)}
                        title="Download PDF"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEdit(bill)}
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleDelete(bill.id)}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};