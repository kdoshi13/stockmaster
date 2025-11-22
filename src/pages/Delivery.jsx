import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, CheckCircle, Table, Kanban, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { deliveriesAPI } from "@/services/api";   // <- IMPORTANT

const Delivery = () => {
  const navigate = useNavigate();

  const [view, setView] = useState("list");
  const [deliveries, setDeliveries] = useState([]);
  const [search, setSearch] = useState("");

  // Fetch deliveries from backend
  const loadDeliveries = async () => {
    try {
      const res = await deliveriesAPI.getAll();
      setDeliveries(res.data);
    } catch (err) {
      toast.error("Failed to load deliveries");
      console.error(err);
    }
  };

  useEffect(() => {
    loadDeliveries();
  }, []);

  // Validate delivery → update status in DB
  const handleValidate = async (id) => {
    try {
      await deliveriesAPI.validate(id);

      // update UI instantly
      setDeliveries((prev) =>
        prev.map((d) =>
          d.id === id ? { ...d, status: "done" } : d
        )
      );

      toast.success("Delivery validated successfully");
    } catch (err) {
      toast.error("Failed to validate");
      console.error(err);
    }
  };

  const statuses = ["draft", "waiting", "ready", "done", "canceled"];

  const filtered = deliveries.filter(
    (d) =>
      d.ref.toLowerCase().includes(search.toLowerCase()) ||
      (d.customer_name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Delivery Orders</h1>
          <p className="text-muted-foreground">Manage outgoing deliveries</p>
        </div>

        <Button onClick={() => navigate("/delivery/create")}>
          <Plus className="h-4 w-4 mr-2" /> Create Delivery
        </Button>
      </div>

      {/* Search + Toggle */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 border px-3 py-2 rounded w-64">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent outline-none text-sm w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant={view === "list" ? "default" : "outline"}
            onClick={() => setView("list")}
          >
            <Table className="h-4 w-4" />
          </Button>

          <Button
            variant={view === "kanban" ? "default" : "outline"}
            onClick={() => setView("kanban")}
          >
            <Kanban className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* ---------------- LIST VIEW ---------------- */}
      {view === "list" && (
        <div className="bg-card rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">
                    Reference
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">
                    Created At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {filtered.map((d) => (
                  <tr key={d.id} className="hover:bg-muted/50">
                    <td className="px-6 py-4 font-medium">{d.ref}</td>
                    <td className="px-6 py-4">{d.customer_name}</td>
                    <td className="px-6 py-4">{d.created_at}</td>

                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded bg-muted/30 text-xs font-semibold">
                        {d.status}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      {d.status !== "done" && (
                        <Button size="sm" onClick={() => handleValidate(d.id)}>
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

      {/* ---------------- KANBAN VIEW ---------------- */}
      {view === "kanban" && (
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {statuses.map((status) => (
            <div key={status} className="border rounded-lg p-4 bg-muted/30">
              <h2 className="font-semibold mb-3 capitalize">{status}</h2>

              <div className="space-y-3">
                {filtered
                  .filter((d) => d.status === status)
                  .map((d) => (
                    <div key={d.id} className="p-3 bg-card rounded border">
                      <p className="font-medium">{d.ref}</p>
                      <p className="text-xs text-muted-foreground">
                        {d.customer_name}
                      </p>
                      <p className="text-xs text-muted-foreground">{d.created_at}</p>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Delivery;
