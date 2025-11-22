import { useEffect, useState } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, ArrowDownToLine, ArrowUpFromLine, Clock } from 'lucide-react';
import { dashboardAPI } from '@/services/api';
import { toast } from 'sonner';

/**
 * Dashboard page layout matched to provided SVG image.
 * - Left: summary stats and charts placeholders
 * - Middle: main content cards
 * - Right: recent activity / quick actions
 *
 * Uses your existing UI primitives so styling matches the app.
 */

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStock: 0,
    pendingReceipts: 0,
    pendingDeliveries: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await dashboardAPI.getStats();
      console.log('Dashboard stats:', response.data);
      
      // Transform the data from backend format to frontend format
      const dashboardStats = {
        totalProducts: response.data.totalProducts || 0,
        lowStock: response.data.lowStock || 0,
        pendingReceipts: response.data.pendingReceipts || 0,
        pendingDeliveries: response.data.pendingDeliveries || 0,
        recentActivity: response.data.recentActivity || []
      };
      
      setStats(dashboardStats);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
      
      // Set fallback values on error
      setStats({
        totalProducts: 0,
        lowStock: 0,
        pendingReceipts: 0,
        pendingDeliveries: 0,
        recentActivity: []
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNavigation = (path) => {
    // Navigate to different sections
    window.location.href = path;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* header with logo */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Dashboard</h1>
            <p className="text-sm text-muted-foreground">Overview of stock & operations</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Today
          </Button>
          <Button className="flex items-center gap-2" onClick={() => handleNavigation('/products')}>
            <Package className="h-4 w-4" />
            New Product
          </Button>
        </div>
      </div>

      {/* grid layout similar to the image: left summary, center large cards, right activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left summary column */}
        <aside className="lg:col-span-3 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Products</p>
                    <p className="text-xl font-semibold">{stats.totalProducts}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Low Stock</p>
                    <p className="text-xl font-semibold text-red-600">{stats.lowStock}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pending Receipts</p>
                    <p className="text-xl font-semibold text-orange-600">{stats.pendingReceipts}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pending Deliveries</p>
                    <p className="text-xl font-semibold text-blue-600">{stats.pendingDeliveries}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Links</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                <Button variant="ghost" onClick={() => handleNavigation('/products')}>Products</Button>
                <Button variant="ghost" onClick={() => handleNavigation('/receipts')}>Receipts</Button>
                <Button variant="ghost" onClick={() => handleNavigation('/deliveries')}>Deliveries</Button>
                <Button variant="ghost" onClick={() => handleNavigation('/warehouse')}>Warehouse</Button>
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* Main column */}
        <section className="lg:col-span-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Stock Level Overview</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Placeholder for charts — replace with chart component */}
              <div className="h-48 bg-muted/20 rounded-md flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <p>Stock Level Chart</p>
                  <p className="text-xs mt-2">Total: {stats.totalProducts} products</p>
                  <p className="text-xs">Low Stock: {stats.lowStock} items</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Inventory Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Products in Stock</span>
                  <span className="font-semibold">{stats.totalProducts}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Low Stock Alerts</span>
                  <span className="font-semibold text-red-600">{stats.lowStock}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Pending Operations</span>
                  <span className="font-semibold text-orange-600">{stats.pendingReceipts + stats.pendingDeliveries}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Right column */}
        <aside className="lg:col-span-3 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.recentActivity.length > 0 ? (
                <ul className="space-y-3 text-sm">
                  {stats.recentActivity.map((activity, index) => (
                    <li key={index}>
                      <div className="flex items-center gap-2">
                        {activity.type === 'receipt' && <ArrowDownToLine className="h-4 w-4 text-green-600" />}
                        {activity.type === 'delivery' && <ArrowUpFromLine className="h-4 w-4 text-blue-600" />}
                        <div>
                          <p className="font-medium">{activity.description}</p>
                          <p className="text-xs text-muted-foreground">{activity.time}</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No recent activity</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Database Connected</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">API Services</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">All Systems Operational</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
};

export default Dashboard;
