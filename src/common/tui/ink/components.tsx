import React, { FC, ReactNode } from 'react';

// Define proper types for Ink components to avoid JSX compatibility issues
type InkComponent = FC<Record<string, unknown>>;

// Import ink components with any type to avoid JSX errors
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Ink = require('ink');
const InkBox: InkComponent = Ink.Box;
const InkText: InkComponent = Ink.Text;
const InkSpinner: InkComponent = Ink.Spinner;
const InkNewline: InkComponent = Ink.Newline;
const InkStatic: InkComponent = Ink.Static;

// Re-export Ink components for convenience
export const Box = InkBox;
export const Text = InkText;
export const Spinner = InkSpinner;
export const Newline = InkNewline;
export const Static = InkStatic;

// Custom styled components
interface PanelProps {
  title?: string;
  children: React.ReactNode;
  borderColor?: string;
  borderStyle?: 'single' | 'double' | 'round' | 'bold' | 'singleDouble' | 'doubleSingle' | 'classic';
}

export const Panel: FC<PanelProps> = ({ 
  title, 
  children, 
  borderColor = 'blue',
  borderStyle = 'round'
}) => (
  <Box 
    flexDirection="column" 
    borderStyle={borderStyle}
    borderColor={borderColor}
    padding={1}
    marginY={1}
  >
    {title && (
      <Text bold color={borderColor}>
        {title}
      </Text>
    )}
    <Box marginTop={title ? 1 : 0}>
      {children}
    </Box>
  </Box>
);

interface StatusBarProps {
  status: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

const statusColors = {
  success: 'green',
  error: 'red',
  warning: 'yellow',
  info: 'cyan',
};

export const StatusBar: FC<StatusBarProps> = ({ status, message }) => (
  <Box>
    <Text color={statusColors[status]} bold>
      [{status.toUpperCase()}]
    </Text>
    <Text> {message}</Text>
  </Box>
);

interface ProgressProps {
  value: number;
  total: number;
  width?: number;
}

export const ProgressBar: FC<ProgressProps> = ({ value, total, width = 40 }) => {
  const percentage = Math.min(100, Math.round((value / total) * 100));
  const filled = Math.round((percentage / 100) * width);
  const empty = width - filled;
  
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  
  return (
    <Box>
      <Text color="green">{bar}</Text>
      <Text> {percentage}%</Text>
    </Box>
  );
};

interface TableProps {
  headers: string[];
  rows: string[][];
}

export const Table: FC<TableProps> = ({ headers, rows }) => (
  <Box flexDirection="column">
    <Box>
      {headers.map((header, i) => (
        <Box key={i} marginRight={2}>
          <Text bold underline>{header}</Text>
        </Box>
      ))}
    </Box>
    {rows.map((row, ri) => (
      <Box key={ri}>
        {row.map((cell, ci) => (
          <Box key={ci} marginRight={2}>
            <Text>{cell}</Text>
          </Box>
        ))}
      </Box>
    ))}
  </Box>
);

interface SelectInputProps {
  items: Array<{ label: string; value: string }>;
  onSelect: (item: { label: string; value: string }) => void;
  initialIndex?: number;
}

export const SelectInput: FC<SelectInputProps> = ({ items, onSelect, initialIndex = 0 }) => {
  const [selectedIndex, setSelectedIndex] = React.useState(initialIndex);
  
  React.useEffect(() => {
    const handleInput = (data: Buffer) => {
      const key = data.toString();
      if (key === '\u001b[A' || key === '\u001b[1~') { // Up arrow
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : items.length - 1));
      } else if (key === '\u001b[B' || key === '\u001b[2~') { // Down arrow
        setSelectedIndex(prev => (prev < items.length - 1 ? prev + 1 : 0));
      } else if (key === '\r' || key === '\n') { // Enter
        onSelect(items[selectedIndex]);
      }
    };
    
    process.stdin.on('data', handleInput);
    return () => {
      process.stdin.off('data', handleInput);
    };
  }, [items, selectedIndex, onSelect]);
  
  return (
    <Box flexDirection="column">
      {items.map((item, index) => (
        <Box key={item.value}>
          <Text color={index === selectedIndex ? 'cyan' : 'white'}>
            {index === selectedIndex ? '> ' : '  '}{item.label}
          </Text>
        </Box>
      ))}
    </Box>
  );
};

interface AlertProps {
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  details?: string;
}

export const Alert: FC<AlertProps> = ({ type, message, details }) => {
  const colors = {
    info: 'blue',
    success: 'green',
    warning: 'yellow',
    error: 'red',
  };
  
  const icons = {
    info: 'ℹ',
    success: '✓',
    warning: '⚠',
    error: '✗',
  };
  
  return (
    <Box flexDirection="column" marginY={1}>
      <Text color={colors[type]} bold>
        {icons[type]} {message}
      </Text>
      {details && (
        <Text dimColor>{details}</Text>
      )}
    </Box>
  );
};