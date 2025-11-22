import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ListChecks } from 'lucide-react';

const Operations = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <ListChecks className="h-8 w-8" />
        <h1 className="text-2xl font-semibold">Operations</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Operations Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Placeholder for operations dashboard. Add operational workflows, quick actions, and KPI widgets here.
          </p>

          <div className="mt-4 flex gap-2">
            <Button onClick={() => alert('Open move history')}>Open Move History</Button>
            <Button variant="ghost" onClick={() => alert('Open products')}>Open Products</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Operations;
