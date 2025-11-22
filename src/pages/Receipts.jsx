import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, CheckCircle, Table, Kanban, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { receiptsAPI } from "@/services/api";

const Receipts = () => {
  const navigate = useNavigate();
  const [view, setView] = useState("list");
  const [receipts, setReceipts] = useState([]);

  // ---------------- LOAD FROM API ----------------
  useEffect(() => {
    const loadReceipts = async () => {
      try {
        const res = await receiptsAPI.getAll();
        setReceipts(res.data); // expects: id, ref, vendor_name, status, created_at, validated_at
      } catch (err) {
        console.error(err);
        toast.error("Failed to load receipts");
      }
    };

    loadReceipts();
  }, []);

  // ---------------- VALIDATION ----------------
  const handleValidate = async (id) => {
    try {
      await receiptsAPI.validate(id);
      toast.success("Receipt validated");

      setReceipts((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: "validated" } : r))
      );
    } catch (err) {
      console.error(err);
      toast.error("Validation failed");
    }
  };

  // DB statuses
  const statuses = ["draft", "waiting", "ready", "validated", "canceled"];

  return (
    <div className="space-y-6">

      {/* ---------------- HEADER ---------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Receipts</h1>
          <p className="text-muted-foreground mt-1">
            Manage incoming stock receipts
          </p>
        </div>

        <Button onClick={() => navigate("/receipts/create")}>
          <Plus className="h-4 w-4 mr-2" />
          Create Receipt
        </Button>
      </div>

      {/* ---------------- SEARCH + VIEW TOGGLE ---------------- */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 border px-3 py-2 rounded w-64 bg-background">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search receipts..."
            className="bg-transparent outline-none text-sm"
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
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Reference
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Created At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {receipts.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/50">
                    <td className="px-6 py-4 text-sm font-medium">
                      {r.ref}
                    </td>

                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {r.vendor_name || "—"}
                    </td>

                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {r.created_at}
                    </td>

                    <td className="px-6 py-4">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-muted/30 capitalize">
                        {r.status}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      {r.status !== "validated" && (
                        <Button size="sm" onClick={() => handleValidate(r.id)}>
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
                {receipts
                  .filter((r) => r.status === status)
                  .map((r) => (
                    <div
                      key={r.id}
                      className="p-3 bg-card rounded shadow border"
                    >
                      <p className="font-medium">{r.ref}</p>
                      <p className="text-xs text-muted-foreground">
                        Vendor: {r.vendor_name || "—"}
                      </p>
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

export default Receipts;
