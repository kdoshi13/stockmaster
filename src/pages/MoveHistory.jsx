import { useState, useMemo, useEffect } from "react";
import { Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { stockAPI } from "@/services/api";

const csvEscape = (v) => ("" + (v ?? "")).replace(/"/g, '""');

const MoveHistory = () => {
  const [moves, setMoves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState("");

  useEffect(() => {
    fetchMoveHistory();
  }, []);

  /** ------------------------------
   *  MAIN FETCH
   *  ------------------------------ */
  const fetchMoveHistory = async () => {
    try {
      setLoading(true);

      // --- 1) Try real stock_ledger API ---
      const res = await stockAPI.getMovements();

      const mapped = res.data.map((row) => ({
        id: row.id,
        timestamp: row.timestamp,
        date: row.timestamp?.split("T")[0] || "",
        item: row.product_name,
        product_code: row.product_code,
        type: row.type,
        qty: row.qty_change,
        qty_change: row.qty_change,
        fromLocation: row.location_from_name,
        toLocation: row.location_to_name,
        user: row.user_name,
        balance_after: row.balance_after,
        notes: row.note,
      }));

      setMoves(mapped);
    } catch (err) {
      console.warn("Primary failed, trying fallback...", err);

      // --- 2) Fallback API (stock levels) ---
      try {
        const fb = await stockAPI.getStockFallback();

        const transformed = fb.data.map((s, index) => ({
          id: index + 1,
          timestamp: new Date().toISOString(),
          date: new Date().toISOString().split("T")[0],
          item: s.product_name,
          product_code: s.product_code,
          type: "stock_check",
          qty: s.qty,
          qty_change: s.qty,
          fromLocation: s.location_name || "Main Warehouse",
          toLocation: "",
          user: "system",
          balance_after: s.qty,
          notes: `Current stock: ${s.qty}`,
        }));

        setMoves(transformed);
      } catch (fallbackErr) {
        toast.error("Failed to load movement history");
      }
    } finally {
      setLoading(false);
    }
  };

  /** ------------------------------
   *  CLEAR FILTERS
   *  ------------------------------ */
  const resetFilters = () => {
    setQuery("");
    setFilterType("");
  };

  /** ------------------------------
   *  EXPORT CSV
   *  ------------------------------ */
  const handleExportCsv = () => {
    if (!moves.length) return toast.error("No moves to export");

    const header = [
      "ID",
      "Date",
      "Product",
      "Product Code",
      "Type",
      "Quantity Change",
      "From Location",
      "To Location",
      "User",
      "Balance After",
      "Notes",
    ];

    const rows = filtered.map((m) => [
      m.id,
      m.date,
      m.item,
      m.product_code,
      m.type,
      m.qty_change,
      m.fromLocation || "-",
      m.toLocation || "-",
      m.user || "N/A",
      m.balance_after || "-",
      m.notes || "-",
    ]);

    const csv = [
      header.join(","),
      ...rows.map((r) => r.map((c) => `"${csvEscape(c)}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `move-history-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success("Export complete");
  };

  /** ------------------------------
   *  FILTER LOGIC
   *  ------------------------------ */
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return moves.filter((m) => {
      if (filterType && m.type !== filterType) return false;

      if (!q) return true;

      return (
        m.item?.toLowerCase().includes(q) ||
        m.product_code?.toLowerCase().includes(q) ||
        m.fromLocation?.toLowerCase().includes(q) ||
        m.toLocation?.toLowerCase().includes(q) ||
        m.user?.toLowerCase().includes(q) ||
        m.notes?.toLowerCase().includes(q)
      );
    });
  }, [moves, query, filterType]);

  /** ------------------------------
   *  LOADING UI
   *  ------------------------------ */
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading movement history...</div>
      </div>
    );
  }

  /** ------------------------------
   *  UI RENDER
   *  ------------------------------ */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Move History</h1>
          <p className="text-sm text-muted-foreground">
            Stock movement and transfer history
          </p>
          <p className="text-sm text-muted-foreground">
            {moves.length} movement records found
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={fetchMoveHistory} variant="outline">
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
          <Button onClick={handleExportCsv}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="Search by product, location, user, notes..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="max-w-md"
            />

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="h-10 px-3 rounded-md border"
            >
              <option value="">All Types</option>
              <option value="receipt">Receipt</option>
              <option value="delivery">Delivery</option>
              <option value="transfer">Transfer</option>
              <option value="adjustment">Adjustment</option>
              <option value="stock_check">Stock Check</option>
            </select>

            <Button variant="ghost" onClick={resetFilters}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Movement Records ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {!filtered.length ? (
            <p className="text-center text-muted-foreground py-8">
              No matching movement records
            </p>
          ) : (
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Product</th>
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-3">Qty Change</th>
                    <th className="py-3 px-3">From</th>
                    <th className="py-3 px-3">To</th>
                    <th className="py-3 px-3">User</th>
                    <th className="py-3 px-3">Balance</th>
                    <th className="py-3 px-3">Notes</th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((m) => (
                    <tr key={m.id} className="border-b hover:bg-muted/30">
                      <td className="px-3 py-3">
                        {new Date(m.timestamp).toLocaleDateString()}
                      </td>
                      <td className="px-3 py-3">
                        <div className="font-semibold">{m.item}</div>
                        <div className="text-xs text-muted-foreground">
                          {m.product_code}
                        </div>
                      </td>
                      <td className="px-3 py-3">{m.type}</td>
                      <td className="px-3 py-3">
                        <span
                          className={
                            m.qty_change >= 0 ? "text-green-600" : "text-red-600"
                          }
                        >
                          {m.qty_change > 0 ? "+" : ""}
                          {m.qty_change}
                        </span>
                      </td>
                      <td className="px-3 py-3">{m.fromLocation || "-"}</td>
                      <td className="px-3 py-3">{m.toLocation || "-"}</td>
                      <td className="px-3 py-3">{m.user || "N/A"}</td>
                      <td className="px-3 py-3">{m.balance_after}</td>
                      <td className="px-3 py-3 text-xs">{m.notes}</td>
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

export default MoveHistory;
