import React from 'react';
import { render } from 'ink';
import { App, Dashboard, Menu, Text, ServiceStatusTemplate, DataTableTemplate, LogViewerTemplate } from './index.js';

// Example 1: Simple App
const SimpleExample = () => (
  <App title="My TUI App">
    <Text color="green">Hello from Ink!</Text>
  </App>
);

// Example 2: Dashboard
const DashboardExample = () => (
  <Dashboard 
    title="System Dashboard" 
    status="running"
    stats={{
      'CPU': '45%',
      'Memory': '2.3 GB',
      'Uptime': '3d 12h'
    }}
  />
);

// Example 3: Service Status
const ServiceStatusExample = () => (
  <ServiceStatusTemplate 
    services={[
      { name: 'API Server', status: 'running', uptime: '3d 12h' },
      { name: 'Database', status: 'running', uptime: '5d 3h' },
      { name: 'Cache', status: 'error', details: 'Connection refused' },
    ]}
  />
);

// Example 4: Data Table
const DataTableExample = () => (
  <DataTableTemplate
    title="Users"
    headers={['ID', 'Name', 'Email']}
    rows={[
      ['1', 'John Doe', 'john@example.com'],
      ['2', 'Jane Smith', 'jane@example.com'],
    ]}
    footer="Total: 2 users"
  />
);

// Example 5: Menu
const MenuExample = () => (
  <Menu
    title="Main Menu"
    items={[
      { label: 'View Dashboard', value: 'dashboard', description: 'View system status' },
      { label: 'View Logs', value: 'logs', description: 'View application logs' },
      { label: 'Settings', value: 'settings', description: 'Configure application' },
      { label: 'Exit', value: 'exit', description: 'Exit application' },
    ]}
    onSelect={(item) => console.log('Selected:', item.value)}
  />
);

// Uncomment to run an example:
// render(<SimpleExample />);
// render(<DashboardExample />);
// render(<ServiceStatusExample />);
// render(<DataTableExample />);
// render(<MenuExample />);