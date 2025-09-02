import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Package, AlertTriangle, Minus } from 'lucide-react';

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  minStock: number;
  price: number;
  category: string;
}

export const InventoryManagement = () => {
  const { t } = useLanguage();
  const [inventory, setInventory] = useState<InventoryItem[]>([
    {
      id: '1',
      name: 'Hair Clipper Blades',
      quantity: 5,
      minStock: 10,
      price: 250,
      category: 'Equipment'
    },
    {
      id: '2', 
      name: 'Shampoo Bottles',
      quantity: 8,
      minStock: 5,
      price: 150,
      category: 'Products'
    },
    {
      id: '3',
      name: 'Beard Oil',
      quantity: 3,
      minStock: 8,
      price: 300,
      category: 'Products'
    },
    {
      id: '4',
      name: 'Hair Gel',
      quantity: 12,
      minStock: 6,
      price: 180,
      category: 'Products'
    }
  ]);

  const [newItem, setNewItem] = useState({
    name: '',
    quantity: '',
    minStock: '',
    price: '',
    category: 'Products'
  });

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const handleAddItem = () => {
    if (!newItem.name || !newItem.quantity || !newItem.price) return;

    const item: InventoryItem = {
      id: Date.now().toString(),
      name: newItem.name,
      quantity: parseInt(newItem.quantity),
      minStock: parseInt(newItem.minStock) || 5,
      price: parseFloat(newItem.price),
      category: newItem.category
    };

    setInventory(prev => [...prev, item]);
    setNewItem({ name: '', quantity: '', minStock: '', price: '', category: 'Products' });
    setIsAddDialogOpen(false);
  };

  const updateQuantity = (id: string, change: number) => {
    setInventory(prev => prev.map(item => 
      item.id === id 
        ? { ...item, quantity: Math.max(0, item.quantity + change) }
        : item
    ));
  };

  const lowStockItems = inventory.filter(item => item.quantity <= item.minStock);
  const totalValue = inventory.reduce((sum, item) => sum + (item.quantity * item.price), 0);

  return (
    <div className="space-y-6">
      {/* Inventory Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventory.length}</div>
            <p className="text-xs text-muted-foreground">Unique products</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alert</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{lowStockItems.length}</div>
            <p className="text-xs text-muted-foreground">Items need restocking</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalValue}</div>
            <p className="text-xs text-muted-foreground">Total stock value</p>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alerts */}
      {lowStockItems.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800">⚠️ Low Stock Alert</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowStockItems.map(item => (
                <div key={item.id} className="flex justify-between items-center p-2 bg-white rounded">
                  <span className="font-medium">{item.name}</span>
                  <Badge variant="destructive">
                    {item.quantity} left (Min: {item.minStock})
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Item Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Inventory Items</h3>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Item</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="itemName">Item Name</Label>
                <Input
                  id="itemName"
                  value={newItem.name}
                  onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter item name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem(prev => ({ ...prev, quantity: e.target.value }))}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="minStock">Min Stock</Label>
                  <Input
                    id="minStock"
                    type="number"
                    value={newItem.minStock}
                    onChange={(e) => setNewItem(prev => ({ ...prev, minStock: e.target.value }))}
                    placeholder="5"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="price">Price per unit (₹)</Label>
                <Input
                  id="price"
                  type="number"
                  value={newItem.price}
                  onChange={(e) => setNewItem(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label>Category</Label>
                <div className="flex gap-2 mt-2">
                  {['Products', 'Equipment', 'Supplies'].map((category) => (
                    <Button
                      key={category}
                      variant={newItem.category === category ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setNewItem(prev => ({ ...prev, category }))}
                    >
                      {category}
                    </Button>
                  ))}
                </div>
              </div>
              <Button onClick={handleAddItem} className="w-full">
                Add Item
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>Stock Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Min Stock</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventory.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={item.quantity <= item.minStock ? 'destructive' : 'secondary'}
                    >
                      {item.quantity}
                    </Badge>
                  </TableCell>
                  <TableCell>{item.minStock}</TableCell>
                  <TableCell>₹{item.price}</TableCell>
                  <TableCell>₹{item.quantity * item.price}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateQuantity(item.id, -1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateQuantity(item.id, 1)}
                      >
                        <Plus className="h-3 w-3" />
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