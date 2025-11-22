import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, CheckCircle, Table, Kanban, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const Delivery = () => {
  const navigate = useNavigate();

  // Toggle list / kanban views
  const [view, setView] = useState("list");

  const [deliveries, setDeliveries] = useState([]);

  useEffect(() => {
    // Replace this with API later
    setDeliveries([
      { id: 1, reference: 'WH/OUT/0001', date: '2024-01-15', status: 'Ready', customer: 'Azure Interior', items: 2, totalQty: 50 },
      { id: 2, reference: 'WH/OUT/0002', date: '2024-01-14', status: 'Draft', customer: 'Wood Galaxy', items: 4, totalQty: 120 },
      { id: 3, reference: 'WH/OUT/0003', date: '2024-01-13', status: 'Waiting', customer: 'Skyline Studio', items: 3, totalQty: 75 },
      { id: 4, reference: 'WH/OUT/0004', date: '2024-01-10', status: 'Done', customer: 'Dream Decor', items: 5, totalQty: 200 },
    ]);
  }, []);

  // Validate → marks status as Done
  const handleValidate = (id) => {
    setDeliveries(deliveries.map(d => d.id === id ? { ...d, status: "Done" } : d));
    toast.success("Delivery validated successfully");
  };

  const statuses = ["Draft", "Waiting", "Ready", "Done", "Canceled"];

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Delivery Orders</h1>
          <p className="text-muted-foreground mt-1">Manage outgoing stock deliveries</p>
        </div>

        <Button onClick={() => navigate('/delivery/create')}>
          <Plus className="h-4 w-4 mr-2" />
          Create Delivery
        </Button>
      </div>

      {/* Search + Toggle */}
      <div className="flex justify-between items-center">

        {/* Search */}
        <div className="flex items-center gap-2 border px-3 py-2 rounded w-64 bg-background">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search deliveries..."
            className="bg-transparent outline-none text-sm"
          />
        </div>

        {/* Toggle between List / Kanban */}
        <div className="flex gap-2">
          <Button variant={view === "list" ? "default" : "outline"} onClick={() => setView("list")}>
            <Table className="h-4 w-4" />
          </Button>
          <Button variant={view === "kanban" ? "default" : "outline"} onClick={() => setView("kanban")}>
            <Kanban className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* ------------- LIST VIEW ------------- */}
      {view === "list" && (
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Reference</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Items</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Total Qty</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {deliveries.map((delivery) => (
                  <tr key={delivery.id} className="hover:bg-muted/50">
                    <td className="px-6 py-4 text-sm font-medium">{delivery.reference}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{delivery.date}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{delivery.customer}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{delivery.items}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{delivery.totalQty}</td>
                    
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-muted/30">
                        {delivery.status}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {delivery.status !== 'Done' && (
                        <Button size="sm" onClick={() => handleValidate(delivery.id)}>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Validate
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>

            </table>
          </div>
        </div>
      )}

      {/* ------------- KANBAN VIEW ------------- */}
      {view === "kanban" && (
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {statuses.map(status => (
            <div key={status} className="border rounded-lg p-4 bg-muted/30">

              <h2 className="font-semibold mb-3">{status}</h2>

              <div className="space-y-3">
                {deliveries
                  .filter(d => d.status === status)
                  .map(d => (
                    <div key={d.id} className="p-3 bg-card rounded shadow border">
                      <p className="font-medium">{d.reference}</p>
                      <p className="text-xs text-muted-foreground">{d.customer}</p>
                      <p className="text-xs text-muted-foreground">{d.items} items / {d.totalQty} qty</p>
                    </div>
                  ))
                }
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default Delivery;
