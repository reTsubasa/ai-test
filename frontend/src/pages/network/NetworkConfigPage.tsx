import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export function NetworkConfigPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Network Configuration</h1>
        <p className="text-muted-foreground">
          Configure interfaces, routing, and firewall settings
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Interfaces</CardTitle>
            <CardDescription>Manage network interfaces</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium">eth0</p>
                  <p className="text-sm text-muted-foreground">192.168.1.1/24</p>
                </div>
                <span className="rounded-full bg-green-500/10 px-2 py-1 text-xs text-green-500">
                  UP
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium">eth1</p>
                  <p className="text-sm text-muted-foreground">10.0.0.1/24</p>
                </div>
                <span className="rounded-full bg-green-500/10 px-2 py-1 text-xs text-green-500">
                  UP
                </span>
              </div>
            </div>
            <Button className="mt-4" variant="outline">
              Add Interface
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Static Routes</CardTitle>
            <CardDescription>Configure static routing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium">0.0.0.0/0</p>
                  <p className="text-sm text-muted-foreground">via 192.168.1.254</p>
                </div>
              </div>
            </div>
            <Button className="mt-4" variant="outline">
              Add Route
            </Button>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Firewall Configuration</CardTitle>
            <CardDescription>Configure firewall rules and policies</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Input placeholder="Rule name" />
                <Button>Add Rule</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}