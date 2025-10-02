import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Package, AlertTriangle, Minus, Edit, Trash2, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

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
  const { user } = useAuth();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [newItem, setNewItem] = useState({
    name: '',
    quantity: '',
    minStock: '',
    price: '',
    category: 'Products'
  });

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  // Fetch inventory data
  useEffect(() => {
    if (user) {
      fetchInventory();
    }
  }, [user]);

  const fetchInventory = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('Inventory')
        .select('*')
        .eq('user_id', user.id)
        .order('Item_name', { ascending: true });

      if (error) throw error;

      const formattedInventory: InventoryItem[] = (data || []).map(item => ({
        id: item.id,
        name: item.Item_name || '',
        quantity: Number(item['Stock quantity']) || 0,
        minStock: 5,
        price: Number(item.Price_per_unit) || 0,
        category: item.Category || 'Products'
      }));

      setInventory(formattedInventory);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      toast({
        title: "Error",
        description: "Failed to load inventory data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async () => {
    if (!user || !newItem.name || !newItem.quantity || !newItem.price) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('Inventory')
        .insert({
          user_id: user.id,
          Item_name: newItem.name,
          'Stock quantity': parseInt(newItem.quantity),
          Price_per_unit: parseFloat(newItem.price),
          Category: newItem.category
        });

      if (error) throw error;

      setNewItem({ name: '', quantity: '', minStock: '', price: '', category: 'Products' });
      setIsAddDialogOpen(false);
      
      toast({
        title: "Item Added",
        description: `${newItem.name} added to inventory successfully`,
      });

      await fetchInventory();
    } catch (error) {
      console.error('Error adding item:', error);
      toast({
        title: "Error",
        description: "Failed to add item",
        variant: "destructive",
      });
    }
  };

  const updateQuantity = async (id: string, change: number) => {
    if (!user) return;

    const item = inventory.find(i => i.id === id);
    if (!item) return;

    const newQuantity = Math.max(0, item.quantity + change);

    try {
      const { error } = await supabase
        .from('Inventory')
        .update({ 'Stock quantity': newQuantity })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      await fetchInventory();
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast({
        title: "Error",
        description: "Failed to update quantity",
        variant: "destructive",
      });
    }
  };

  const handleEditItem = (item: InventoryItem) => {
    setEditingItem(item);
    setNewItem({
      name: item.name,
      quantity: item.quantity.toString(),
      minStock: item.minStock.toString(),
      price: item.price.toString(),
      category: item.category
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateItem = async () => {
    if (!user || !editingItem || !newItem.name || !newItem.quantity || !newItem.price) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('Inventory')
        .update({
          Item_name: newItem.name,
          'Stock quantity': parseInt(newItem.quantity),
          Price_per_unit: parseFloat(newItem.price),
          Category: newItem.category
        })
        .eq('id', editingItem.id)
        .eq('user_id', user.id);

      if (error) throw error;

      setNewItem({ name: '', quantity: '', minStock: '', price: '', category: 'Products' });
      setIsEditDialogOpen(false);
      setEditingItem(null);
      
      toast({
        title: "Item Updated",
        description: `${newItem.name} updated successfully`,
      });

      await fetchInventory();
    } catch (error) {
      console.error('Error updating item:', error);
      toast({
        title: "Error",
        description: "Failed to update item",
        variant: "destructive",
      });
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('Inventory')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Item Deleted",
        description: "Item removed from inventory",
      });

      await fetchInventory();
    } catch (error) {
      console.error('Error deleting item:', error);
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive",
      });
    }
  };

  const lowStockItems = inventory.filter(item => item.quantity <= item.minStock);
  const totalValue = inventory.reduce((sum, item) => sum + (item.quantity * item.price), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

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

        {/* Edit Item Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Item</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="editItemName">Item Name</Label>
                <Input
                  id="editItemName"
                  value={newItem.name}
                  onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter item name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editQuantity">Quantity</Label>
                  <Input
                    id="editQuantity"
                    type="number"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem(prev => ({ ...prev, quantity: e.target.value }))}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="editMinStock">Min Stock</Label>
                  <Input
                    id="editMinStock"
                    type="number"
                    value={newItem.minStock}
                    onChange={(e) => setNewItem(prev => ({ ...prev, minStock: e.target.value }))}
                    placeholder="5"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="editPrice">Price per unit (₹)</Label>
                <Input
                  id="editPrice"
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
              <Button onClick={handleUpdateItem} className="w-full">
                Update Item
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
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditItem(item)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteItem(item.id)}
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