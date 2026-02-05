import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';

export function MonitoringPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Monitoring</h1>
        <p className="text-muted-foreground">
          Real-time monitoring and performance metrics
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>CPU Usage</CardTitle>
            <CardDescription>Current CPU utilization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-center justify-center rounded-lg bg-muted">
              <p className="text-muted-foreground">Chart placeholder</p>
            </div>
            <div className="mt-4 text-center">
              <span className="text-3xl font-bold">32%</span>
              <p className="text-sm text-muted-foreground">Average over 24h</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Memory Usage</CardTitle>
            <CardDescription>Current memory utilization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-center justify-center rounded-lg bg-muted">
              <p className="text-muted-foreground">Chart placeholder</p>
            </div>
            <div className="mt-4 text-center">
              <span className="text-3xl font-bold">45%</span>
              <p className="text-sm text-muted-foreground">2.2 GB / 4.8 GB</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Network Traffic</CardTitle>
            <CardDescription>Incoming and outgoing traffic</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-center justify-center rounded-lg bg-muted">
              <p className="text-muted-foreground">Chart placeholder</p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-sm text-muted-foreground">Inbound</p>
                <span className="text-2xl font-bold">125 Mbps</span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Outbound</p>
                <span className="text-2xl font-bold">89 Mbps</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Connection Statistics</CardTitle>
            <CardDescription>Active network connections</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Active TCP</span>
                <span className="font-medium">1,234</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Active UDP</span>
                <span className="font-medium">567</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Established</span>
                <span className="font-medium">890</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Time Wait</span>
                <span className="font-medium">234</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}