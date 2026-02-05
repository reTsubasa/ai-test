import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';

export function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your VyOS network infrastructure
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Nodes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">+2 from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Interfaces</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">48</div>
            <p className="text-xs text-muted-foreground">All operational</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bandwidth Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8.2 TB</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">Healthy</div>
            <p className="text-xs text-muted-foreground">All nodes online</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest configuration changes and events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4 border-b pb-4">
              <div className="flex-1">
                <p className="font-medium">Interface eth0 configuration updated</p>
                <p className="text-sm text-muted-foreground">Node: vyos-router-01</p>
              </div>
              <span className="text-sm text-muted-foreground">2 minutes ago</span>
            </div>
            <div className="flex items-center gap-4 border-b pb-4">
              <div className="flex-1">
                <p className="font-medium">New BGP peer added</p>
                <p className="text-sm text-muted-foreground">Node: vyos-router-03</p>
              </div>
              <span className="text-sm text-muted-foreground">15 minutes ago</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p className="font-medium">Firewall rules applied</p>
                <p className="text-sm text-muted-foreground">Node: vyos-router-02</p>
              </div>
              <span className="text-sm text-muted-foreground">1 hour ago</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}