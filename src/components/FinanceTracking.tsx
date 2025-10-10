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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Wallet, TrendingUp, CreditCard, ArrowUpDown, Edit, Trash2, Activity } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  date: Date;
}

export const FinanceTracking = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [newTransaction, setNewTransaction] = useState({
    type: 'expense' as 'income' | 'expense',
    amount: '',
    description: '',
    category: ''
  });

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const fetchTransactions = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('finance')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching transactions:', error);
      return;
    }

    if (data) {
      setTransactions(data.map(t => ({
        id: t.id,
        type: t.type as 'income' | 'expense',
        amount: Number(t.amount),
        description: t.description,
        category: t.category,
        date: new Date(t.date)
      })));
    }
  }, [user]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const { isSubscribed } = useRealtimeSubscription({
    table: 'finance',
    userId: user?.id,
    events: ['INSERT', 'UPDATE', 'DELETE'],
    onDataChange: fetchTransactions,
    throttleMs: 2000,
  });

  const handleAddTransaction = async () => {
    if (!newTransaction.amount || !newTransaction.description || !user) {
      toast({
        title: "Error",
        description: "Please fill in amount and description",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from('finance')
      .insert({
        user_id: user.id,
        type: newTransaction.type,
        amount: parseFloat(newTransaction.amount),
        description: newTransaction.description,
        category: newTransaction.category || (newTransaction.type === 'income' ? 'Sales' : 'Other'),
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add transaction",
        variant: "destructive",
      });
      return;
    }

    setNewTransaction({ type: 'expense', amount: '', description: '', category: '' });
    setIsAddDialogOpen(false);
    
    toast({
      title: "Transaction Added",
      description: `${newTransaction.type === 'income' ? 'Income' : 'Expense'} of ₹${newTransaction.amount} recorded`,
    });
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setNewTransaction({
      type: transaction.type,
      amount: transaction.amount.toString(),
      description: transaction.description,
      category: transaction.category
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateTransaction = async () => {
    if (!editingTransaction || !newTransaction.amount || !newTransaction.description) {
      toast({
        title: "Error",
        description: "Please fill in amount and description",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from('finance')
      .update({
        type: newTransaction.type,
        amount: parseFloat(newTransaction.amount),
        description: newTransaction.description,
        category: newTransaction.category || (newTransaction.type === 'income' ? 'Sales' : 'Other'),
      })
      .eq('id', editingTransaction.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update transaction",
        variant: "destructive",
      });
      return;
    }
    
    setNewTransaction({ type: 'expense', amount: '', description: '', category: '' });
    setIsEditDialogOpen(false);
    setEditingTransaction(null);
    
    toast({
      title: "Transaction Updated",
      description: `Transaction updated successfully`,
    });
  };

  const handleDeleteTransaction = async (id: string) => {
    const { error } = await supabase
      .from('finance')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete transaction",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Transaction Deleted",
      description: "Transaction removed successfully",
    });
  };

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const netProfit = totalIncome - totalExpenses;

  const expenseCategories = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₹{totalIncome}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <CreditCard className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">₹{totalExpenses}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ₹{netProfit}
            </div>
            <p className="text-xs text-muted-foreground">
              {netProfit >= 0 ? 'Profit' : 'Loss'} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transactions.length}</div>
            <p className="text-xs text-muted-foreground">Total entries</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="expenses">Expense Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          {/* Add Transaction Button */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">Recent Transactions</h3>
              <div className="flex items-center gap-1 text-xs">
                <Activity className={`h-3 w-3 ${isSubscribed ? 'text-green-600 animate-pulse' : 'text-muted-foreground'}`} />
                <span className={isSubscribed ? 'text-green-600' : 'text-muted-foreground'}>
                  {isSubscribed ? 'Live' : 'Offline'}
                </span>
              </div>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Transaction
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Transaction</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Transaction Type</Label>
                    <div className="flex gap-2 mt-2">
                      <Button
                        variant={newTransaction.type === 'income' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setNewTransaction(prev => ({ ...prev, type: 'income' }))}
                      >
                        Income
                      </Button>
                      <Button
                        variant={newTransaction.type === 'expense' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setNewTransaction(prev => ({ ...prev, type: 'expense' }))}
                      >
                        Expense
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="amount">Amount (₹)</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={newTransaction.amount}
                      onChange={(e) => setNewTransaction(prev => ({ ...prev, amount: e.target.value }))}
                      placeholder="Enter amount"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={newTransaction.description}
                      onChange={(e) => setNewTransaction(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Enter description"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      value={newTransaction.category}
                      onChange={(e) => setNewTransaction(prev => ({ ...prev, category: e.target.value }))}
                      placeholder={newTransaction.type === 'income' ? 'e.g., Sales' : 'e.g., Rent, Utilities'}
                    />
                  </div>
                  <Button onClick={handleAddTransaction} className="w-full" type="button">
                    Add Transaction
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Edit Transaction Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Transaction</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Transaction Type</Label>
                    <div className="flex gap-2 mt-2">
                      <Button
                        variant={newTransaction.type === 'income' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setNewTransaction(prev => ({ ...prev, type: 'income' }))}
                      >
                        Income
                      </Button>
                      <Button
                        variant={newTransaction.type === 'expense' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setNewTransaction(prev => ({ ...prev, type: 'expense' }))}
                      >
                        Expense
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="editAmount">Amount (₹)</Label>
                    <Input
                      id="editAmount"
                      type="number"
                      value={newTransaction.amount}
                      onChange={(e) => setNewTransaction(prev => ({ ...prev, amount: e.target.value }))}
                      placeholder="Enter amount"
                    />
                  </div>
                  <div>
                    <Label htmlFor="editDescription">Description</Label>
                    <Input
                      id="editDescription"
                      value={newTransaction.description}
                      onChange={(e) => setNewTransaction(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Enter description"
                    />
                  </div>
                  <div>
                    <Label htmlFor="editCategory">Category</Label>
                    <Input
                      id="editCategory"
                      value={newTransaction.category}
                      onChange={(e) => setNewTransaction(prev => ({ ...prev, category: e.target.value }))}
                      placeholder={newTransaction.type === 'income' ? 'e.g., Sales' : 'e.g., Rent, Utilities'}
                    />
                  </div>
                  <Button onClick={handleUpdateTransaction} className="w-full">
                    Update Transaction
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Transactions Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <Badge variant={transaction.type === 'income' ? 'default' : 'destructive'}>
                          {transaction.type === 'income' ? '↗ Income' : '↘ Expense'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{transaction.description}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{transaction.category}</Badge>
                      </TableCell>
                      <TableCell className={transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                        {transaction.type === 'income' ? '+' : '-'}₹{transaction.amount}
                      </TableCell>
                      <TableCell>{transaction.date.toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditTransaction(transaction)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteTransaction(transaction.id)}
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
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Expense Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(expenseCategories).map(([category, amount]) => (
                  <div key={category} className="flex justify-between items-center p-3 border rounded">
                    <div>
                      <h4 className="font-medium">{category}</h4>
                      <p className="text-sm text-muted-foreground">
                        {((amount / totalExpenses) * 100).toFixed(1)}% of total expenses
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-red-600">₹{amount}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};