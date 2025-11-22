import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, CheckCircle, Table, Kanban, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const Receipts = () => {
  const navigate = useNavigate();

  // 👇 New state for switching between List ↔ Kanban
  const [view, setView] = useState("list");

  const [receipts, setReceipts] = useState([]);

  useEffect(() => {
    setReceipts([
      { id: 1, reference: 'WH/IN/0001', date: '2024-01-15', status: 'Ready', items: 3, totalQty: 150 },
      { id: 2, reference: 'WH/IN/0002', date: '2024-01-14', status: 'Draft', items: 5, totalQty: 200 },
      { id: 3, reference: 'WH/IN/0003', date: '2024-01-13', status: 'Waiting', items: 2, totalQty: 80 },
      { id: 4, reference: 'WH/IN/0004', date: '2024-01-13', status: 'Done', items: 2, totalQty: 80 },
    ]);
  }, []);

  const handleValidate = (id) => {
    setReceipts(receipts.map(r => r.id === id ? { ...r, status: 'Done' } : r));
    toast.success('Receipt validated successfully');
  };

  // Kanban column names (same as UI)
  const statuses = ["Draft", "Waiting", "Ready", "Done", "Canceled"];

  return (
    <div className="space-y-6">

      {/* ---------------- HEADER ---------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Receipts</h1>
          <p className="text-muted-foreground mt-1">Manage incoming stock receipts</p>
        </div>

        <Button onClick={() => navigate('/receipts/create')}>
          <Plus className="h-4 w-4 mr-2" />
          Create Receipt
        </Button>
      </div>

      {/* ---------------- SEARCH + TOGGLE ---------------- */}
      <div className="flex justify-between items-center">

        {/* Search Bar */}
        <div className="flex items-center gap-2 border px-3 py-2 rounded w-64 bg-background">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search receipts..."
            className="bg-transparent outline-none text-sm"
          />
        </div>

        {/* Toggle Icons */}
        <div className="flex gap-2">
          <Button variant={view === "list" ? "default" : "outline"} onClick={() => setView("list")}>
            <Table className="h-4 w-4" />
          </Button>
          <Button variant={view === "kanban" ? "default" : "outline"} onClick={() => setView("kanban")}>
            <Kanban className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* ---------------- VIEW RENDERING ---------------- */}
      {view === "list" && (
        <>
          {/* ------------ TABLE LIST VIEW ------------ */}
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Reference</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Items</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Qty</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-border">
                  {receipts.map((receipt) => (
                    <tr key={receipt.id} className="hover:bg-muted/50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{receipt.reference}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{receipt.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{receipt.items}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{receipt.totalQty}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-muted/30">
                          {receipt.status}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {receipt.status !== 'Done' && (
                          <Button size="sm" onClick={() => handleValidate(receipt.id)}>
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
        </>
      )}

      {/* --------------- KANBAN VIEW ---------------- */}
      {view === "kanban" && (
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {statuses.map(status => (
            <div key={status} className="border rounded-lg p-4 bg-muted/30">

              <h2 className="font-semibold mb-3">{status}</h2>

              {/* Cards */}
              <div className="space-y-3">
                {receipts
                  .filter(r => r.status === status)
                  .map(r => (
                    <div key={r.id} className="p-3 bg-card rounded shadow border">
                      <p className="font-medium">{r.reference}</p>
                      <p className="text-xs text-muted-foreground">{r.items} items / {r.totalQty} qty</p>
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

export default Receipts;
