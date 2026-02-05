# VyOS Web UI - User Manual

## Table of Contents

- [Overview](#overview)
- [Getting Started](#getting-started)
- [Dashboard](#dashboard)
- [Node Management](#node-management)
- [Network Configuration](#network-configuration)
- [Monitoring](#monitoring)
- [System Management](#system-management)
- [User Management](#user-management)
- [Best Practices](#best-practices)
- [Frequently Asked Questions](#frequently-asked-questions)

---

## Overview

The VyOS Web UI provides a modern, intuitive interface for managing VyOS-based network devices. This manual will guide you through all the features and functionality of the application.

### Key Features

- Centralized management of multiple VyOS nodes
- Real-time monitoring and alerting
- Network configuration management
- Configuration history with rollback capabilities
- Role-based access control
- Responsive design for desktop and mobile

---

## Getting Started

### First Login

1. Open your web browser and navigate to the VyOS Web UI URL
2. Enter your username and password
3. Click the "Sign In" button

**Default Credentials (for new installations):**
- Username: `admin`
- Password: `admin123`

**Important:** Change the default password immediately after your first login.

### Changing Your Password

1. Click on your user avatar in the top-right corner
2. Select "Settings" from the dropdown
3. Navigate to the "Security" tab
4. Enter your current password
5. Enter your new password
6. Confirm your new password
7. Click "Change Password"

### Navigation

The application uses a sidebar for navigation:

- **Dashboard**: Overview of system status and metrics
- **Nodes**: Manage your VyOS nodes
- **Network**: Configure network interfaces, routes, and firewall
- **Monitoring**: View detailed monitoring data and alerts
- **System**: System management and logs
- **Users**: User and role management (Admin only)

### Theme Selection

Switch between light and dark themes:

1. Click on your user avatar
2. Select "Theme"
3. Choose "Light" or "Dark"

---

## Dashboard

The Dashboard provides an at-a-glance view of your network infrastructure.

### System Overview

The System Overview panel displays:

- Total nodes in the system
- Online/offline node count
- Active network interfaces
- Overall system status (Healthy, Warning, Critical)

### Traffic Chart

View real-time traffic statistics:

- Select a time range (Last hour, 24 hours, 7 days)
- Toggle between inbound and outbound traffic
- Hover over data points for detailed information

### Activity Log

The Activity Log shows recent system events:

- Configuration changes
- Node status changes
- User actions
- System alerts

Events are categorized by type and include timestamps.

### Alert Panel

View active alerts requiring attention:

- Severity indicators (Info, Warning, Error, Critical)
- Alert descriptions
- Acknowledge alerts to mark them as reviewed

---

## Node Management

### Adding a New Node

1. Navigate to the "Nodes" page
2. Click the "Add Node" button
3. Fill in the required information:
   - **Name**: Display name for the node
   - **Hostname**: Fully qualified domain name or IP address
   - **IP Address**: Management IP address
   - **Port**: API port (default: 8443)
   - **Type**: Node type (Router, Switch, Firewall, etc.)
   - **Description**: Optional description
   - **Location**: Optional location information
   - **Tags**: Optional tags for organization
4. Click "Test Connection" to verify connectivity
5. Click "Add Node" to save

### Viewing Node Details

1. Navigate to the "Nodes" page
2. Click on a node card or row to view details
3. The node detail page shows:
   - Basic information (name, hostname, IP, type)
   - Current status (online/offline/degraded)
   - Health metrics (CPU, memory, disk usage)
   - Last connection time
   - Configuration version

### Updating Node Configuration

1. Open the node detail page
2. Click the "Edit" button
3. Modify the desired fields
4. Click "Save" to apply changes

### Deleting a Node

1. Navigate to the "Nodes" page
2. Click the "Delete" button on the node row
3. Confirm the deletion in the dialog

**Warning:** Deleting a node removes all associated configuration history and monitoring data.

### Testing Node Connection

1. Navigate to the "Nodes" page
2. Click the "Test Connection" button on a node
3. View the connection test results:
   - Success with latency
   - Failure with error message

### Importing Nodes

Import multiple nodes at once:

1. Navigate to the "Nodes" page
2. Click "Import Nodes"
3. Select a JSON or YAML file containing node definitions
4. Review the import summary
5. Click "Import" to add the nodes

**Import File Format (JSON):**

```json
[
  {
    "name": "Router-01",
    "hostname": "router01.example.com",
    "ip_address": "192.168.1.1",
    "port": 8443,
    "type": "router",
    "description": "Main router",
    "location": "Data Center 1",
    "tags": ["production", "core"]
  }
]
```

### Exporting Nodes

Export node configurations:

1. Navigate to the "Nodes" page
2. Click "Export Nodes"
3. Select export format (JSON or YAML)
4. Save the file to your computer

---

## Network Configuration

### Interface Configuration

#### Viewing Interfaces

1. Navigate to "Network" > "Interfaces"
2. Select a node from the dropdown
3. View all interfaces with their status and configuration

#### Adding an IP Address

1. Navigate to "Network" > "Interfaces"
2. Click on an interface to view details
3. Click "Add IP Address"
4. Enter IP address and prefix length
5. Select IP type (IPv4 or IPv6)
6. Check "Primary" if this is the primary address
7. Click "Add"

#### Configuring Interface Settings

1. Navigate to "Network" > "Interfaces"
2. Click on an interface
3. Modify settings:
   - Description
   - MTU (Maximum Transmission Unit)
   - Enable/Disable interface
4. Click "Apply Configuration"

### Routing Configuration

#### Viewing Routes

1. Navigate to "Network" > "Routing"
2. Select a node
3. View the routing table with:
   - Destination networks
   - Gateways
   - Interfaces
   - Route types (Connected, Static, Dynamic)
   - Metrics

#### Adding a Static Route

1. Navigate to "Network" > "Routing"
2. Click "Add Route"
3. Enter route information:
   - **Destination**: Network address (e.g., 10.0.0.0/24)
   - **Gateway**: Next-hop IP address
   - **Interface**: Outbound interface
   - **Metric**: Route metric (optional)
4. Click "Add Route"

#### Deleting a Route

1. Navigate to "Network" > "Routing"
2. Locate the route
3. Click the "Delete" button
4. Confirm deletion

### Firewall Configuration

#### Viewing Firewall Rules

1. Navigate to "Network" > "Firewall"
2. Select a node
3. View rules by chain (INPUT, OUTPUT, FORWARD)

#### Adding a Firewall Rule

1. Navigate to "Network" > "Firewall"
2. Click "Add Rule"
3. Configure the rule:
   - **Name**: Descriptive rule name
   - **Description**: Optional description
   - **Chain**: INPUT, OUTPUT, or FORWARD
   - **Action**: Accept, Drop, or Reject
   - **Source Address**: Source network (optional)
   - **Destination Address**: Destination network (optional)
   - **Source Port**: Source port (optional)
   - **Destination Port**: Destination port (optional)
   - **Protocol**: TCP, UDP, or any
   - **Enabled**: Toggle to enable/disable
4. Click "Add Rule"

#### Managing Firewall Rules

- Toggle rules on/off using the switch
- Edit rules by clicking the edit icon
- Delete rules by clicking the delete button
- Drag and drop to reorder rules

### Configuration History

#### Viewing Configuration History

1. Navigate to "Network" > "Config History"
2. Select a node
3. View all configuration versions with:
   - Version number
   - Change summary
   - User who made the change
   - Timestamp
   - Rollback point indicator

#### Comparing Configurations

1. Navigate to "Network" > "Config History"
2. Select two configuration versions
3. Click "Compare"
4. View the diff showing:
   - Added lines (green)
   - Removed lines (red)
   - Modified lines (yellow)

#### Rolling Back Configuration

1. Navigate to "Network" > "Config History"
2. Select the configuration to roll back to
3. Click "Rollback"
4. Confirm the rollback in the dialog

**Warning:** Rolling back will replace the current configuration. Ensure you have a backup if needed.

---

## Monitoring

### System Metrics

View detailed system metrics for individual nodes:

1. Navigate to the "Monitoring" page
2. Select a node
3. View metrics sections:

#### CPU Metrics
- Current CPU usage percentage
- Number of CPU cores
- Load averages (1, 5, 15 minutes)

#### Memory Metrics
- Total memory
- Used memory
- Available memory
- Usage percentage

#### Disk Metrics
- Total disk space
- Used disk space
- Available disk space
- Usage percentage

#### Network Interface Metrics
- Interface name and status
- Link speed
- MTU
- RX/TX bytes and packets
- Error counts

### Traffic Monitoring

1. Navigate to the "Monitoring" page
2. Click the "Traffic" tab
3. Select time range
4. Select interface (optional)
5. View traffic charts showing:
   - Inbound traffic
   - Outbound traffic
   - Total traffic

### Alerts

#### Viewing Alerts

1. Navigate to the "Monitoring" page
2. Click the "Alerts" tab
3. View alerts grouped by severity:
   - **Critical**: Immediate attention required
   - **Error**: Action required soon
   - **Warning**: Review recommended
   - **Info**: Informational

#### Acknowledging Alerts

1. Navigate to the "Monitoring" page
2. Click the "Alerts" tab
3. Click "Acknowledge" on an alert
4. The alert is marked as reviewed

#### Bulk Acknowledge

1. Select multiple alerts using checkboxes
2. Click "Acknowledge Selected"

#### Configuring Alert Thresholds

Alert thresholds are configured in the system settings (Admin only):

1. Navigate to "System" > "Settings"
2. Click the "Alerts" tab
3. Configure thresholds for:
   - CPU usage
   - Memory usage
   - Disk usage
   - Interface errors
4. Click "Save"

---

## System Management

### Image Management

Manage VyOS system images:

1. Navigate to "System" > "Image Manager"
2. View installed images
3. Perform actions:

#### Uploading an Image

1. Click "Upload Image"
2. Select the image file (.iso)
3. Enter image version
4. Click "Upload"

#### Setting Default Image

1. Locate the image
2. Click "Set as Default"
3. Confirm the action

#### Deleting an Image

1. Locate the image
2. Click "Delete"
3. Confirm deletion

**Warning:** Deleting the currently running image is not allowed.

### System Operations

#### Rebooting a Node

1. Navigate to the "System" page
2. Select the node
3. Click "Reboot"
4. Confirm in the dialog
5. Monitor the reboot progress

#### Powering Off a Node

1. Navigate to the "System" page
2. Select the node
3. Click "Power Off"
4. Confirm in the dialog

**Warning:** Powering off a node will disconnect all active connections.

### System Logs

View and analyze system logs:

1. Navigate to "System" > "Logs"
2. Select a node
3. Select log type:
   - System logs
   - Configuration logs
   - Error logs
4. Filter logs by:
   - Time range
   - Log level
   - Search term
5. Export logs using the "Export" button

### Configuration Backup

#### Creating a Backup

1. Navigate to "System" > "Backup"
2. Select node(s)
3. Click "Create Backup"
4. Enter backup name (optional)
5. Click "Backup"

#### Restoring from Backup

1. Navigate to "System" > "Backup"
2. Locate the backup
3. Click "Restore"
4. Confirm the restore operation

**Warning:** Restore will replace the current configuration.

---

## User Management

*Note: User management features require Admin privileges.*

### Viewing Users

1. Navigate to the "Users" page
2. View all users with:
   - Username
   - Email
   - Role
   - Status
   - Last login

### Adding a User

1. Navigate to the "Users" page
2. Click "Add User"
3. Enter user information:
   - **Username**: Unique username
   - **Email**: Valid email address
   - **Password**: Strong password
   - **Full Name**: User's full name
   - **Role**: Admin, Operator, or Viewer
4. Click "Create User"

### User Roles

#### Admin
- Full system access
- User and role management
- System configuration
- View and modify all data

#### Operator
- Network configuration
- Node management
- View monitoring data
- Cannot manage users

#### Viewer
- Read-only access
- View monitoring data
- View configurations
- Cannot make changes

### Updating User Information

1. Navigate to the "Users" page
2. Click "Edit" on the user row
3. Modify user information
4. Click "Save"

### Changing User Password

1. Navigate to the "Users" page
2. Click "Edit" on the user row
3. Click "Change Password"
4. Enter new password
5. Confirm new password
6. Click "Change Password"

### Disabling a User

1. Navigate to the "Users" page
2. Click "Edit" on the user row
3. Change status to "Disabled"
4. Click "Save"

**Note:** Disabled users cannot log in.

### Deleting a User

1. Navigate to the "Users" page
2. Click "Delete" on the user row
3. Confirm deletion

**Warning:** Deleting a user removes all access and associated data.

### Role Management

#### Viewing Roles

1. Navigate to the "Users" page
2. Click the "Roles" tab
3. View all roles with their permissions

#### Creating a Role

1. Navigate to the "Users" page
2. Click the "Roles" tab
3. Click "Add Role"
4. Enter role name and description
5. Select permissions
6. Click "Create Role"

#### Managing Permissions

Assign permissions to roles:

- **users.read**: View user information
- **users.write**: Create and update users
- **users.delete**: Delete users
- **nodes.read**: View node information
- **nodes.write**: Configure nodes
- **nodes.delete**: Delete nodes
- **config.read**: View configurations
- **config.write**: Modify configurations
- **config.rollback**: Rollback configurations
- **monitoring.read**: View monitoring data

---

## Best Practices

### Security

1. **Use Strong Passwords**: Minimum 12 characters with mixed case, numbers, and symbols
2. **Enable Two-Factor Authentication**: When available, enable 2FA for additional security
3. **Change Default Passwords**: Immediately change default credentials
4. **Regular Password Updates**: Update passwords every 90 days
5. **Limit Admin Access**: Grant admin privileges only when necessary

### Configuration Management

1. **Document Changes**: Always include meaningful change summaries
2. **Create Rollback Points**: Mark important configurations as rollback points
3. **Test Changes**: Test configuration changes in a staging environment first
4. **Backup Before Major Changes**: Create backups before significant configuration changes
5. **Review Configuration History**: Regularly review configuration history for unintended changes

### Monitoring

1. **Set Appropriate Thresholds**: Configure alert thresholds based on your environment
2. **Acknowledge Alerts Promptly**: Review and acknowledge alerts in a timely manner
3. **Regular Review**: Schedule regular reviews of monitoring data and trends
4. **Investigate Anomalies**: Investigate any unusual patterns or spikes in metrics

### Node Management

1. **Consistent Naming**: Use a consistent naming convention for nodes
2. **Tag Organization**: Use tags to organize nodes by location, type, or function
3. **Regular Connection Tests**: Periodically test node connections
4. **Firmware Updates**: Keep node firmware up to date
5. **Document Node Changes**: Document any changes to node configuration or location

---

## Frequently Asked Questions

### General

**Q: What browsers are supported?**
A: VyOS Web UI supports the latest versions of Chrome, Firefox, Safari, and Edge.

**Q: Can I access the UI from my mobile device?**
A: Yes, the UI is responsive and works on mobile devices.

**Q: How do I report a bug or request a feature?**
A: Please use the project's GitHub issues page to report bugs or request features.

### Authentication and Access

**Q: I forgot my password. How do I reset it?**
A: Contact your system administrator to reset your password. If you are an admin, you may need to use the command-line interface to reset the password.

**Q: How long do sessions stay active?**
A: Sessions expire after 60 minutes of inactivity by default. This can be configured by your administrator.

**Q: Can I have multiple active sessions?**
A: Yes, you can be logged in from multiple browsers or devices simultaneously.

### Configuration

**Q: What happens if I make a configuration mistake?**
A: Configuration changes are tracked in the configuration history. You can roll back to any previous configuration version.

**Q: How often should I create configuration backups?**
A: We recommend creating a backup before any major configuration change and at least weekly for routine backups.

**Q: Can I schedule configuration changes?**
A: Currently, scheduled changes are not supported. All changes are applied immediately.

### Monitoring and Alerts

**Q: How do I configure alert thresholds?**
A: Alert thresholds are configured in System > Settings by administrators. Contact your admin to adjust thresholds.

**Q: Can I receive alerts via email?**
A: Email notifications are not currently supported but are planned for a future release.

**Q: How far back does monitoring data go?**
A: Monitoring data is retained for 90 days by default. This can be configured by your administrator.

### Nodes

**Q: What node types are supported?**
A: Router, Switch, Firewall, Load Balancer, and Other (custom types).

**Q: How many nodes can I manage?**
A: There is no hard limit on the number of nodes. Performance will depend on your system resources.

**Q: Can I organize nodes into groups?**
A: Use tags to organize nodes. You can filter and search by tags.

### Troubleshooting

**Q: The Dashboard is not updating. What should I do?**
A:
1. Refresh your browser (F5 or Cmd+R)
2. Check your internet connection
3. Try clearing your browser cache
4. If the issue persists, contact your administrator

**Q: I can't connect to a node. What should I do?**
A:
1. Verify the node is powered on and connected to the network
2. Check the node's IP address and port configuration
3. Test network connectivity using the "Test Connection" button
4. Check firewall rules to ensure the required ports are open
5. Contact your network administrator if issues persist

**Q: I see a "Database Error" message. What does this mean?**
A: This indicates a problem with the application database. Contact your system administrator immediately.

**Q: The application is slow. What can I do?**
A:
1. Check your internet connection speed
2. Try a different browser
3. Clear your browser cache
4. If the issue persists, contact your administrator to check server performance

---

**Version**: 0.1.0
**Last Updated**: February 2025