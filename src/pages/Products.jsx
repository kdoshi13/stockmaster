import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import ProductModal from '@/components/ProductModal';
import DeleteDialog from '@/components/DeleteDialog';
import { toast } from 'sonner';
import { productsAPI } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

const Products = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteProduct, setDeleteProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await productsAPI.getAll();
      console.log('Products fetched:', response.data);
      
      // Keep the data exactly as it comes from database
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (productData) => {
    try {
      if (editingProduct) {
        // Update existing product
        await productsAPI.update(editingProduct.id, {
          id_code: productData.id_code,
          name: productData.name,
          category: productData.category,
          unit_of_measure: productData.unit_of_measure,
          reorder_threshold: productData.reorder_threshold,
          reorder_target: productData.reorder_target
        });
        toast.success('Product updated successfully');
        await fetchProducts(); // Refresh the list
      } else {
        // Create new product - include created_by field
        await productsAPI.create({
          id_code: productData.id_code,
          name: productData.name,
          category: productData.category,
          unit_of_measure: productData.unit_of_measure,
          reorder_threshold: productData.reorder_threshold,
          reorder_target: productData.reorder_target,
          created_by: user?.id
        });
        toast.success('Product added successfully');
        await fetchProducts(); // Refresh the list
      }
      setIsModalOpen(false);
      setEditingProduct(null);
    } catch (error) {
      console.error('Error saving product:', error);
      // Display specific error message if available, otherwise generic
      const errorMessage = error.response?.data?.message || 'Failed to save product';
      toast.error(errorMessage);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteProduct) return;
    try {
      await productsAPI.delete(deleteProduct.id);
      toast.success('Product deleted successfully');
      await fetchProducts(); // Refresh the list
      setDeleteProduct(null); // Close the dialog
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.id_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading products...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Products</h1>
          <p className="text-muted-foreground mt-1">Manage your product inventory</p>
          <p className="text-sm text-muted-foreground mt-1">{products.length} products found</p>
        </div>
        <Button onClick={handleAddProduct}>
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search products by ID Code, name, or category..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">ID Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Unit of Measure</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Reorder Threshold</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Reorder Target</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Created By</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Created At</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="10" className="px-6 py-8 text-center text-muted-foreground">
                    No products found. {searchTerm ? 'Try a different search term.' : 'Add your first product to get started.'}
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-muted/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{product.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{product.id_code}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{product.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{product.category || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{product.unit_of_measure}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{product.reorder_threshold}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{product.reorder_target}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{product.created_by_name || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {product.created_at ? new Date(product.created_at).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditProduct(product)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteProduct(product)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ProductModal
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingProduct(null);
        }}
        onSave={handleSaveProduct}
        product={editingProduct}
      />

      <DeleteDialog
        open={!!deleteProduct}
        onClose={() => setDeleteProduct(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Product"
        description={`Are you sure you want to delete "${deleteProduct?.name}"? This action cannot be undone.`}
      />
    </div>
  );
};

export default Products;
