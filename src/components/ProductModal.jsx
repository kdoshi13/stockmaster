import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ProductModal = ({ open, onClose, onSave, product }) => {
  const [formData, setFormData] = useState({
    id_code: '',
    name: '',
    category: '',
    unit_of_measure: '',
    reorder_threshold: 0,
    reorder_target: 0,
  });

  useEffect(() => {
    if (product) {
      setFormData({
        id_code: product.id_code || '',
        name: product.name || '',
        category: product.category || '',
        unit_of_measure: product.unit_of_measure || '',
        reorder_threshold: product.reorder_threshold || 0,
        reorder_target: product.reorder_target || 0,
      });
    } else {
      setFormData({
        id_code: '',
        name: '',
        category: '',
        unit_of_measure: '',
        reorder_threshold: 0,
        reorder_target: 0,
      });
    }
  }, [product, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{product ? 'Edit Product' : 'Add New Product'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="id_code">ID Code</Label>
              <Input
                id="id_code"
                value={formData.id_code}
                onChange={(e) => setFormData({ ...formData, id_code: e.target.value })}
                placeholder="Enter product ID code"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Product Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter product name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  <SelectItem value="Electronics">Electronics</SelectItem>
                  <SelectItem value="Furniture">Furniture</SelectItem>
                  <SelectItem value="Stationery">Stationery</SelectItem>
                  <SelectItem value="Accessories">Accessories</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit_of_measure">Unit of Measure</Label>
              <Select value={formData.unit_of_measure} onValueChange={(value) => setFormData({ ...formData, unit_of_measure: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select unit of measure" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  <SelectItem value="Piece">Piece</SelectItem>
                  <SelectItem value="Box">Box</SelectItem>
                  <SelectItem value="Kg">Kg</SelectItem>
                  <SelectItem value="Liter">Liter</SelectItem>
                  <SelectItem value="Meter">Meter</SelectItem>
                  <SelectItem value="Pack">Pack</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reorder_threshold">Reorder Threshold</Label>
              <Input
                id="reorder_threshold"
                type="number"
                min="0"
                value={formData.reorder_threshold}
                onChange={(e) => setFormData({ ...formData, reorder_threshold: parseInt(e.target.value) || 0 })}
                placeholder="Minimum stock level before reordering"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reorder_target">Reorder Target</Label>
              <Input
                id="reorder_target"
                type="number"
                min="0"
                value={formData.reorder_target}
                onChange={(e) => setFormData({ ...formData, reorder_target: parseInt(e.target.value) || 0 })}
                placeholder="Target stock level after reordering"
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {product ? 'Update' : 'Add'} Product
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProductModal;
