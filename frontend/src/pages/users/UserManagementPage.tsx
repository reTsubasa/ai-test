import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export function UserManagementPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Manage users, roles, and permissions
          </p>
        </div>
        <Button>Add User</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>
            List of all users with their roles and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-medium">admin</p>
                <p className="text-sm text-muted-foreground">admin@vyos.local</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
                  Admin
                </span>
                <Button variant="ghost" size="sm">
                  Edit
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-medium">operator</p>
                <p className="text-sm text-muted-foreground">operator@vyos.local</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="rounded-full bg-secondary px-3 py-1 text-sm">
                  User
                </span>
                <Button variant="ghost" size="sm">
                  Edit
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-medium">readonly</p>
                <p className="text-sm text-muted-foreground">readonly@vyos.local</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="rounded-full bg-muted px-3 py-1 text-sm">
                  Readonly
                </span>
                <Button variant="ghost" size="sm">
                  Edit
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}