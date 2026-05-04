import React, { FC, useState } from 'react';
import { render, useApp, useInput, Box, Text, Spinner } from 'ink';
import { Box as BoxComponent, Text as TextComponent, Spinner as SpinnerComponent } from './components.js';

interface AppProps {
  title?: string;
  children?: React.ReactNode;
}

export const App: FC<AppProps> = ({ title = 'Apollo TUI', children }) => {
  const { exit } = useApp();
  
  useInput((input, key) => {
    if (input === 'q' || (key.ctrl && input === 'c')) {
      exit();
    }
  });
  
  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">
          {title}
        </Text>
      </Box>
      {children || <Text dimColor>Press 'q' to quit</Text>}
    </Box>
  );
};

interface DashboardProps {
  title?: string;
  status?: 'running' | 'stopped' | 'error';
  stats?: Record<string, string | number>;
}

export const Dashboard: FC<DashboardProps> = ({ 
  title = 'Dashboard', 
  status = 'running',
  stats = {}
}) => {
  const statusColor = {
    running: 'green',
    stopped: 'yellow',
    error: 'red',
  };
  
  return (
    <App title={title}>
      <Box flexDirection="column" gap={1}>
        <Box>
          <Text bold>Status: </Text>
          <Text color={statusColor[status]} bold>
            {status.toUpperCase()}
          </Text>
        </Box>
        
        {Object.entries(stats).length > 0 && (
          <Box flexDirection="column" marginTop={1}>
            <Text underline>Statistics:</Text>
            {Object.entries(stats).map(([key, value]) => (
              <Box key={key}>
                <Text dimColor>{key}: </Text>
                <Text>{String(value)}</Text>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </App>
  );
};

interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen: FC<LoadingScreenProps> = ({ message = 'Loading...' }) => (
  <App>
    <Box flexDirection="column" alignItems="center" justifyContent="center">
      <Spinner type="dots" />
      <Text> {message}</Text>
    </Box>
  </App>
);

interface MenuProps {
  title?: string;
  items: Array<{ label: string; value: string; description?: string }>;
  onSelect: (item: { label: string; value: string }) => void;
}

export const Menu: FC<MenuProps> = ({ title = 'Main Menu', items, onSelect }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { exit } = useApp();
  
  useInput((input, key) => {
    if (key.upArrow) {
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : items.length - 1));
    } else if (key.downArrow) {
      setSelectedIndex(prev => (prev < items.length - 1 ? prev + 1 : 0));
    } else if (key.return) {
      onSelect(items[selectedIndex]);
    } else if (input === 'q' || (key.ctrl && input === 'c')) {
      exit();
    }
  });
  
  return (
    <App title={title}>
      <Box flexDirection="column">
        {items.map((item, index) => (
          <Box key={item.value} flexDirection="column" marginBottom={1}>
            <Text color={index === selectedIndex ? 'cyan' : 'white'}>
              {index === selectedIndex ? '> ' : '  '}
              {item.label}
            </Text>
            {item.description && index === selectedIndex && (
              <Text dimColor>    {item.description}</Text>
            )}
          </Box>
        ))}
        <Box marginTop={1}>
          <Text dimColor>↑/↓: Navigate | Enter: Select | q: Quit</Text>
        </Box>
      </Box>
    </App>
  );
};

export { render, useApp, useInput, Box, Text, Spinner };
