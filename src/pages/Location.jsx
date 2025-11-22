import { useState, useEffect } from 'react';
import { Plus, Edit, Trash, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const initialLocations = [
  { id: 1, name: 'Receiving Dock', code: 'LOC-001', warehouseCode: 'WH001', notes: 'Near entrance' },
  { id: 2, name: 'Cold Storage', code: 'LOC-002', warehouseCode: 'WH002', notes: 'Temperature-controlled' },
];

const Location = () => {
  const [locations, setLocations] = useState(initialLocations);
  const [form, setForm] = useState({ id: null, name: '', code: '', warehouseCode: '', notes: '' });
  const [editing, setEditing] = useState(false);

  const resetForm = () => {
    setForm({ id: null, name: '', code: '', warehouseCode: '', notes: '' });
    setEditing(false);
  };

  const handleChange = (e) => {
    setForm((s) => ({ ...s, [e.target.name]: e.target.value }));
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.code.trim() || !form.warehouseCode.trim()) return;

    if (editing) {
      setLocations((list) =>
        list.map((l) =>
          l.id === form.id
            ? { ...l, name: form.name, code: form.code, warehouseCode: form.warehouseCode, notes: form.notes }
            : l
        )
      );
    } else {
      const nextId = locations.length ? Math.max(...locations.map((l) => l.id)) + 1 : 1;
      setLocations((list) => [
        ...list,
        {
          id: nextId,
          name: form.name,
          code: form.code,
          warehouseCode: form.warehouseCode,
          notes: form.notes,
        },
      ]);
    }

    resetForm();
  };

  const handleEdit = (l) => {
    setForm({
      id: l.id,
      name: l.name,
      code: l.code,
      warehouseCode: l.warehouseCode,
      notes: l.notes,
    });
    setEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id) => {
    if (!confirm('Delete this location?')) return;
    setLocations((list) => list.filter((l) => l.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Optional logo */}
      <div className="flex items-center gap-4">
        <img src="/mnt/data/StockMaster.svg" alt="StockMaster" className="h-12 w-auto" />
        <h1 className="text-2xl font-semibold">Location Settings</h1>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>{editing ? 'Edit Location' : 'Add Location'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div className="space-y-1">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Receiving Dock"
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="code">Location Code</Label>
              <Input
                id="code"
                name="code"
                value={form.code}
                onChange={handleChange}
                placeholder="LOC-001"
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="warehouseCode">Warehouse Code</Label>
              <Input
                id="warehouseCode"
                name="warehouseCode"
                value={form.warehouseCode}
                onChange={handleChange}
                placeholder="WH001"
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="Optional notes"
              />
            </div>

            <div className="sm:col-span-4 flex gap-2 mt-2">
              <Button type="submit" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                {editing ? 'Save Changes' : 'Add Location'}
              </Button>
              <Button type="button" variant="secondary" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Locations</CardTitle>
        </CardHeader>
        <CardContent>
          {locations.length === 0 ? (
            <p className="text-sm text-muted-foreground">No locations configured yet.</p>
          ) : (
            <div className="overflow-auto">
              <table className="w-full table-auto border-collapse">
                <thead>
                  <tr className="text-left text-sm text-muted-foreground border-b">
                    <th className="py-2 px-3">Name</th>
                    <th className="py-2 px-3">Location Code</th>
                    <th className="py-2 px-3">Warehouse Code</th>
                    <th className="py-2 px-3">Notes</th>
                    <th className="py-2 px-3 w-32">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {locations.map((l) => (
                    <tr key={l.id} className="hover:bg-muted/30">
                      <td className="py-2 px-3 flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        {l.name}
                      </td>
                      <td className="py-2 px-3">{l.code}</td>
                      <td className="py-2 px-3">{l.warehouseCode}</td>
                      <td className="py-2 px-3">{l.notes}</td>
                      <td className="py-2 px-3">
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(l)} title="Edit">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDelete(l.id)} title="Delete">
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

export default Location;
