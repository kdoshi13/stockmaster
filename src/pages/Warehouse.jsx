import { useState, useEffect } from 'react';
import { Plus, Edit, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

/**
 * Warehouse page
 * - Simple in-memory CRUD for warehouses
 * - Replace the mock storage with real API calls as needed
 */

const initialWarehouses = [
  { id: 1, name: 'Main Warehouse', code: 'WH-001', address: '123 Industrial Park, City' },
  { id: 2, name: 'Overflow Warehouse', code: 'WH-002', address: '45 Storage Ave, City' },
];

const Warehouse = () => {
  const [warehouses, setWarehouses] = useState(initialWarehouses);
  const [form, setForm] = useState({ id: null, name: '', code: '', address: '' });
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    // TODO: replace with API fetch (GET /api/warehouses) when ready
    // Example:
    // fetch('/api/warehouses').then(r=>r.json()).then(setWarehouses)
  }, []);

  const resetForm = () => {
    setForm({ id: null, name: '', code: '', address: '' });
    setEditing(false);
  };

  const handleChange = (e) => {
    setForm((s) => ({ ...s, [e.target.name]: e.target.value }));
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.code.trim()) return;

    if (editing) {
      // update
      setWarehouses((list) =>
        list.map((w) => (w.id === form.id ? { ...w, name: form.name, code: form.code, address: form.address } : w))
      );
    } else {
      // add new
      const nextId = warehouses.length ? Math.max(...warehouses.map((w) => w.id)) + 1 : 1;
      setWarehouses((list) => [...list, { id: nextId, name: form.name, code: form.code, address: form.address }]);
    }
    resetForm();
  };

  const handleEdit = (w) => {
    setForm({ id: w.id, name: w.name, code: w.code, address: w.address });
    setEditing(true);
    // scroll to top of page where form is (optional)
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id) => {
    if (!confirm('Delete this warehouse?')) return;
    setWarehouses((list) => list.filter((w) => w.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Optional project graphic (local path provided) */}
      <div className="flex items-center gap-4">
        <img src="/mnt/data/StockMaster.svg" alt="StockMaster" className="h-12 w-auto" />
        <h1 className="text-2xl font-semibold">Warehouse Settings</h1>
      </div>

      {/* Form card */}
      <Card>
        <CardHeader>
          <CardTitle>{editing ? 'Edit Warehouse' : 'Add Warehouse'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Warehouse name"
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
                name="code"
                value={form.code}
                onChange={handleChange}
                placeholder="WH-001"
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="Street, City, ZIP"
              />
            </div>

            <div className="sm:col-span-3 flex gap-2 mt-2">
              <Button type="submit" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                {editing ? 'Save changes' : 'Add Warehouse'}
              </Button>
              <Button type="button" variant="secondary" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Table of warehouses */}
      <Card>
        <CardHeader>
          <CardTitle>Warehouses</CardTitle>
        </CardHeader>
        <CardContent>
          {warehouses.length === 0 ? (
            <p className="text-sm text-muted-foreground">No warehouses configured yet.</p>
          ) : (
            <div className="overflow-auto">
              <table className="w-full table-auto border-collapse">
                <thead>
                  <tr className="text-left text-sm text-muted-foreground border-b">
                    <th className="py-2 px-3">Name</th>
                    <th className="py-2 px-3">Code</th>
                    <th className="py-2 px-3">Address</th>
                    <th className="py-2 px-3 w-32">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {warehouses.map((w) => (
                    <tr key={w.id} className="hover:bg-muted/30">
                      <td className="py-2 px-3">{w.name}</td>
                      <td className="py-2 px-3">{w.code}</td>
                      <td className="py-2 px-3">{w.address}</td>
                      <td className="py-2 px-3">
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(w)} title="Edit">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDelete(w.id)} title="Delete">
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Warehouse;
