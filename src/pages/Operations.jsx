import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ListChecks, Package, Truck, Repeat, ArrowUpRight } from 'lucide-react';
import { useNavigate } from "react-router-dom";


const Operations = () => {

  const navigate = useNavigate();

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div className="flex items-center gap-4">
        <ListChecks className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-semibold">Operations</h1>
          <p className="text-sm text-muted-foreground">
            Overview of receipts, deliveries, and move activities
          </p>
        </div>
      </div>

      {/* Main Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle>Operations Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Monitor recent transactions and manage workflow activities.
          </p>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

            <Button
              className="flex items-center gap-2 w-full"
              onClick={() => navigate('/receipts')}
            >
              <Package className="h-4 w-4" />
              Receipts
            </Button>


            <Button
              variant="secondary"
              className="flex items-center gap-2 w-full"
              onClick={() => navigate('/delivery')}
            >
              <Truck className="h-4 w-4" />
              Deliveries
            </Button>

            <Button
              variant="ghost"
              className="flex items-center gap-2 w-full"
              onClick={() => navigate('/moves')}
            >
              <Repeat className="h-4 w-4" />
              Move History
            </Button>

          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Operations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">

            <div className="flex items-center justify-between bg-muted/40 p-3 rounded">
              <div>
                <p className="font-medium">Receipt RCPT-324</p>
                <p className="text-xs text-muted-foreground">2 hours ago</p>
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </div>

            <div className="flex items-center justify-between bg-muted/40 p-3 rounded">
              <div>
                <p className="font-medium">Delivery DLV-412</p>
                <p className="text-xs text-muted-foreground">Yesterday</p>
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </div>

            <div className="flex items-center justify-between bg-muted/40 p-3 rounded">
              <div>
                <p className="font-medium">Move MOVE-182</p>
                <p className="text-xs text-muted-foreground">3 days ago</p>
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </div>

          </div>
        </CardContent>
      </Card>

    </div>
  );
};

export default Operations;
