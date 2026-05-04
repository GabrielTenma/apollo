import React, { FC, useState } from 'react';
import { Box, Text } from 'ink';
import { Panel, StatusBar, ProgressBar, Table, Alert, SelectInput } from './components.js';
import { Dashboard, Menu, LoadingScreen } from './app.js';

// Template: Service Status Display
interface ServiceStatusTemplateProps {
  services: Array<{
    name: string;
    status: 'running' | 'stopped' | 'error';
    uptime?: string;
    details?: string;
  }>;
}

export const ServiceStatusTemplate: FC<ServiceStatusTemplateProps> = ({ services }) => {
  const getStatusColor = (status: string) => {
    if (status === 'running') return 'green';
    if (status === 'error') return 'red';
    return 'yellow';
  };
  
  const getStatusText = (status: string) => {
    if (status === 'running') return 'success' as const;
    if (status === 'error') return 'error' as const;
    return 'warning' as const;
  };
  
  return (
    <Box flexDirection="column" padding={1}>
      <Text bold color="cyan">Service Status</Text>
      <Box marginTop={1}>
        <Text>Total Services: {services.length} | </Text>
        <Text color="green">Running: {services.filter(s => s.status === 'running').length} | </Text>
        <Text color="yellow">Stopped: {services.filter(s => s.status === 'stopped').length} | </Text>
        <Text color="red">Errors: {services.filter(s => s.status === 'error').length}</Text>
      </Box>
      <Box flexDirection="column" marginTop={1}>
        {services.map(service => (
          <Panel key={service.name} title={service.name} borderColor={getStatusColor(service.status)}>
            <Box flexDirection="column">
              <StatusBar status={getStatusText(service.status)} message={service.status === 'running' ? 'Service is running' : service.status === 'error' ? 'Service error' : 'Service stopped'} />
              {service.uptime && (
                <Text>Uptime: {service.uptime}</Text>
              )}
              {service.details && (
                <Text dimColor>{service.details}</Text>
              )}
            </Box>
          </Panel>
        ))}
      </Box>
    </Box>
  );
};

// Template: Data Table View
interface DataTableTemplateProps {
  title: string;
  headers: string[];
  rows: string[][];
  footer?: string;
}

export const DataTableTemplate: FC<DataTableTemplateProps> = ({ title, headers, rows, footer }) => (
  <Box flexDirection="column" padding={1}>
    <Text bold color="cyan">{title}</Text>
    <Box marginTop={1}>
      <Table headers={headers} rows={rows} />
    </Box>
    {footer && (
      <Box marginTop={1}>
        <Text dimColor>{footer}</Text>
      </Box>
    )}
  </Box>
);

// Template: Task Progress
interface TaskProgressTemplateProps {
  tasks: Array<{
    name: string;
    progress: number;
    total: number;
    status: 'pending' | 'in-progress' | 'completed' | 'failed';
  }>;
}

export const TaskProgressTemplate: FC<TaskProgressTemplateProps> = ({ tasks }) => (
  <Box flexDirection="column" padding={1}>
    <Text bold color="cyan">Task Progress</Text>
    <Box flexDirection="column" marginTop={1}>
      {tasks.map(task => (
        <Box key={task.name} flexDirection="column" marginBottom={1}>
          <Box justifyContent="space-between">
            <Text>{task.name}</Text>
            <Text color={
              task.status === 'completed' ? 'green' : 
              task.status === 'failed' ? 'red' : 
              task.status === 'in-progress' ? 'cyan' : 'yellow'
            }>
              {task.status}
            </Text>
          </Box>
          <ProgressBar value={task.progress} total={task.total} />
        </Box>
      ))}
    </Box>
  </Box>
);

// Template: Confirmation Dialog
interface ConfirmDialogTemplateProps {
  message: string;
  details?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialogTemplate: FC<ConfirmDialogTemplateProps> = ({ message, details, onConfirm, onCancel }) => {
  const items = [
    { label: 'Yes', value: 'confirm' },
    { label: 'No', value: 'cancel' },
  ];
  
  return (
    <Box flexDirection="column" padding={1}>
      <Alert type="warning" message={message} details={details} />
      <Box marginTop={1}>
        <SelectInput 
          items={items}
          onSelect={(item) => {
            if (item.value === 'confirm') onConfirm();
            else onCancel();
          }}
        />
      </Box>
    </Box>
  );
};

// Template: Logs Viewer
interface LogViewerTemplateProps {
  title?: string;
  logs: Array<{
    timestamp: string;
    level: 'info' | 'warn' | 'error' | 'debug';
    message: string;
  }>;
}

export const LogViewerTemplate: FC<LogViewerTemplateProps> = ({ title = 'Logs', logs }) => (
  <Box flexDirection="column" padding={1}>
    <Text bold color="cyan">{title}</Text>
    <Box flexDirection="column" marginTop={1}>
      {logs.map((log, index) => (
        <Box key={index}>
          <Text dimColor>{log.timestamp}</Text>
          <Text color={
            log.level === 'error' ? 'red' :
            log.level === 'warn' ? 'yellow' :
            log.level === 'info' ? 'green' : 'blue'
          }> [{log.level.toUpperCase()}] </Text>
          <Text>{log.message}</Text>
        </Box>
      ))}
    </Box>
  </Box>
);

// Template: Settings Form
interface SettingsTemplateProps {
  title?: string;
  settings: Array<{
    key: string;
    label: string;
    value: string;
    type: 'text' | 'number' | 'boolean';
  }>;
  onSave: (settings: Record<string, string>) => void;
}

export const SettingsTemplate: FC<SettingsTemplateProps> = ({ title = 'Settings', settings, onSave }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [values, setValues] = useState<Record<string, string>>(
    settings.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {})
  );
  
  return (
    <Box flexDirection="column" padding={1}>
      <Text bold color="cyan">{title}</Text>
      <Box flexDirection="column" marginTop={1}>
        {settings.map((setting, index) => (
          <Box key={setting.key} marginBottom={1}>
            <Text color={index === selectedIndex ? 'cyan' : 'white'}>
              {index === selectedIndex ? '> ' : '  '}
              {setting.label}: 
              <Text dimColor> {values[setting.key]}</Text>
            </Text>
          </Box>
        ))}
      </Box>
      <Box marginTop={1}>
        <Text dimColor>Press Enter to edit, Ctrl+S to save</Text>
      </Box>
    </Box>
  );
};

export { Dashboard, Menu, LoadingScreen };