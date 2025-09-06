import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Eye, TrendingUp, Calendar, Edit, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Sale {
  id: string;
  customerName: string;
  amount: number;
  items: string[];
  date: Date;
  paymentMethod: 'cash' | 'upi' | 'card';
}

export const SalesManagement = () => {
  const { t } = useLanguage();
  const [sales, setSales] = useState<Sale[]>([
    {
      id: '1',
      customerName: 'राजेश कुमार',
      amount: 450,
      items: ['Haircut', 'Beard Trim'],
      date: new Date('2024-01-15'),
      paymentMethod: 'upi'
    },
    {
      id: '2',
      customerName: 'सुनील शर्मा',
      amount: 350,
      items: ['Haircut'],
      date: new Date('2024-01-15'),
      paymentMethod: 'cash'
    },
    {
      id: '3',
      customerName: 'अमित पटेल',
      amount: 650,
      items: ['Haircut', 'Beard Trim', 'Hair Wash'],
      date: new Date('2024-01-14'),
      paymentMethod: 'card'
    }
  ]);

  const [newSale, setNewSale] = useState<{
    customerName: string;
    amount: string;
    items: string;
    paymentMethod: 'cash' | 'upi' | 'card';
  }>({
    customerName: '',
    amount: '',
    items: '',
    paymentMethod: 'cash'
  });

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);

  const handleAddSale = () => {
    if (!newSale.customerName || !newSale.amount) {
      toast({
        title: "Error",
        description: "Please fill in customer name and amount",
        variant: "destructive",
      });
      return;
    }

    const sale: Sale = {
      id: (Date.now()).toString(),
      customerName: newSale.customerName,
      amount: parseFloat(newSale.amount),
      items: newSale.items.split(',').map(item => item.trim()),
      date: new Date(),
      paymentMethod: newSale.paymentMethod
    };

    setSales(prev => [sale, ...prev]);
    setNewSale({ customerName: '', amount: '', items: '', paymentMethod: 'cash' });
    setIsAddDialogOpen(false);
    
    toast({
      title: "Sale Recorded",
      description: `₹${sale.amount} sale added successfully`,
    });
  };

  const handleEditSale = (sale: Sale) => {
    setEditingSale(sale);
    setNewSale({
      customerName: sale.customerName,
      amount: sale.amount.toString(),
      items: sale.items.join(', '),
      paymentMethod: sale.paymentMethod
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateSale = () => {
    if (!editingSale || !newSale.customerName || !newSale.amount) {
      toast({
        title: "Error",
        description: "Please fill in customer name and amount",
        variant: "destructive",
      });
      return;
    }

    const updatedSale: Sale = {
      ...editingSale,
      customerName: newSale.customerName,
      amount: parseFloat(newSale.amount),
      items: newSale.items.split(',').map(item => item.trim()),
      paymentMethod: newSale.paymentMethod
    };

    setSales(prev => prev.map(sale => 
      sale.id === editingSale.id ? updatedSale : sale
    ));
    
    setNewSale({ customerName: '', amount: '', items: '', paymentMethod: 'cash' });
    setIsEditDialogOpen(false);
    setEditingSale(null);
    
    toast({
      title: "Sale Updated",
      description: `Sale updated successfully`,
    });
  };

  const handleDeleteSale = (id: string) => {
    setSales(prev => prev.filter(sale => sale.id !== id));
    toast({
      title: "Sale Deleted",
      description: "Sale removed successfully",
    });
  };

  const totalSales = sales.reduce((sum, sale) => sum + sale.amount, 0);
  const todaySales = sales.filter(sale => 
    sale.date.toDateString() === new Date().toDateString()
  ).reduce((sum, sale) => sum + sale.amount, 0);

  return (
    <div className="space-y-6">
      {/* Sales Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{todaySales}</div>
            <p className="text-xs text-muted-foreground">+20.1% from yesterday</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalSales}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sales.length}</div>
            <p className="text-xs text-muted-foreground">Total transactions</p>
          </CardContent>
        </Card>
      </div>

      {/* Add Sale Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Recent Sales</h3>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
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
              <div>
                <Label htmlFor="amount">Amount (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={newSale.amount}
                  onChange={(e) => setNewSale(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="Enter amount"
                />
              </div>
              <div>
                <Label htmlFor="items">Services/Items (comma separated)</Label>
                <Input
                  id="items"
                  value={newSale.items}
                  onChange={(e) => setNewSale(prev => ({ ...prev, items: e.target.value }))}
                  placeholder="Haircut, Beard Trim, etc."
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
                  placeholder="Enter customer name"
                />
              </div>
              <div>
                <Label htmlFor="editAmount">Amount (₹)</Label>
                <Input
                  id="editAmount"
                  type="number"
                  value={newSale.amount}
                  onChange={(e) => setNewSale(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="Enter amount"
                />
              </div>
              <div>
                <Label htmlFor="editItems">Services/Items (comma separated)</Label>
                <Input
                  id="editItems"
                  value={newSale.items}
                  onChange={(e) => setNewSale(prev => ({ ...prev, items: e.target.value }))}
                  placeholder="Haircut, Beard Trim, etc."
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
                    >
                      {method.toUpperCase()}
                    </Button>
                  ))}
                </div>
              </div>
              <Button onClick={handleUpdateSale} className="w-full">
                Update Sale
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Sales Table */}
      <Card>
        <CardHeader>
          <CardTitle>Sales History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Items/Services</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell className="font-medium">{sale.customerName}</TableCell>
                  <TableCell>₹{sale.amount}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {sale.items.map((item, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{sale.date.toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant={sale.paymentMethod === 'cash' ? 'outline' : 'default'}>
                      {sale.paymentMethod.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditSale(sale)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteSale(sale.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};