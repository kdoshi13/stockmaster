import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const CreateReceipt = () => {
  const navigate = useNavigate();
  const [receiptItems, setReceiptItems] = useState([{ productId: '', quantity: 0 }]);
  
  // Mock products - replace with actual data
  const products = [
    { id: 1, name: 'Laptop HP Elite', sku: 'LAP-001' },
    { id: 2, name: 'Office Chair', sku: 'FUR-002' },
    { id: 3, name: 'Paper A4', sku: 'STA-003' },
    { id: 4, name: 'USB Cable', sku: 'ACC-004' },
  ];

  const addItem = () => {
    setReceiptItems([...receiptItems, { productId: '', quantity: 0 }]);
  };

  const removeItem = (index) => {
    setReceiptItems(receiptItems.filter((_, i) => i !== index));
  };

  const updateItem = (index, field, value) => {
    const updated = [...receiptItems];
    updated[index][field] = value;
    setReceiptItems(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Validate and submit
    const hasEmptyProduct = receiptItems.some(item => !item.productId);
    if (hasEmptyProduct) {
      toast.error('Please select a product for all items');
      return;
    }
    
    toast.success('Receipt created successfully');
    navigate('/receipts');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate('/receipts')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Create Receipt</h1>
          <p className="text-muted-foreground mt-1">Add incoming stock to inventory</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Receipt Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reference">Reference Number</Label>
                <Input id="reference" placeholder="RCP-001" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input id="date" type="date" required />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Items</h3>
                <Button type="button" onClick={addItem} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>

              <div className="space-y-3">
                {receiptItems.map((item, index) => (
                  <div key={index} className="flex gap-3 items-end">
                    <div className="flex-1 space-y-2">
                      <Label>Product</Label>
                      <Select
                        value={item.productId}
                        onValueChange={(value) => updateItem(index, 'productId', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover z-50">
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id.toString()}>
                              {product.name} ({product.sku})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-32 space-y-2">
                      <Label>Quantity</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                        required
                      />
                    </div>
                    {receiptItems.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeItem(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={() => navigate('/receipts')}>
                Cancel
              </Button>
              <Button type="submit">
                Create Receipt
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
};

export default CreateReceipt;
