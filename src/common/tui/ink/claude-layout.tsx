import React, { FC, useState, useEffect, useRef } from 'react';
import { Box, Text, Spinner, useInput, useApp } from 'ink';
import { readFileSync } from 'fs';
import { join } from 'path';

// Color scheme similar to Claude Code
const colors = {
  primary: 'magenta',
  secondary: 'cyan',
  accent: 'yellow',
  success: 'green',
  error: 'red',
  warning: 'yellow',
  info: 'blue',
  muted: 'gray',
  userMessage: 'green',
  assistantMessage: 'cyan',
  systemMessage: 'yellow',
};

// Header component similar to Claude Code
interface HeaderProps {
  title?: string;
  version?: string;
  showHelp?: boolean;
}

export const ClaudeHeader: FC<HeaderProps> = ({ 
  title = 'Apollo', 
  version = '0.0.1',
  showHelp = true 
}) => {
  const { exit } = useApp();
  
  useInput((input, key) => {
    if (input === 'q' && key.ctrl) {
      exit();
    }
  });
  
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box justifyContent="space-between" alignItems="center">
        <Box>
          <Text bold color={colors.primary}>
            {title}
          </Text>
          <Text dimColor> v{version}</Text>
        </Box>
        <Box>
          {showHelp && (
            <Text dimColor>
              Press Ctrl+Q to quit
            </Text>
          )}
        </Box>
      </Box>
      <Box>
        <Text dimColor>─────────────────────────────────────────────────────</Text>
      </Box>
    </Box>
  );
};

// Message types for chat interface
interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
}

interface ChatMessageProps {
  message: Message;
  showTimestamp?: boolean;
}

export const ChatMessage: FC<ChatMessageProps> = ({ message, showTimestamp = false }) => {
  const roleColors = {
    user: colors.userMessage,
    assistant: colors.assistantMessage,
    system: colors.systemMessage,
  };
  
  const rolePrefix = {
    user: '> ',
    assistant: '  ',
    system: '! ',
  };
  
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box>
        <Text bold color={roleColors[message.role]}>
          {message.role.toUpperCase()}
        </Text>
        {showTimestamp && message.timestamp && (
          <Text dimColor> {message.timestamp.toLocaleTimeString()}</Text>
        )}
      </Box>
      <Box>
        <Text color={roleColors[message.role]}>
          {rolePrefix[message.role]}
        </Text>
        <Text>{message.content}</Text>
      </Box>
    </Box>
  );
};

interface ChatContainerProps {
  messages: Message[];
  showTimestamp?: boolean;
  maxHeight?: number;
}

export const ChatContainer: FC<ChatContainerProps> = ({ 
  messages, 
  showTimestamp = false,
  maxHeight = 20 
}) => {
  const messagesEndRef = useRef(null);
  
  return (
    <Box 
      flexDirection="column" 
      flexGrow={1}
      overflow="hidden"
    >
      {messages.slice(-maxHeight).map((msg) => (
        <ChatMessage 
          key={msg.id} 
          message={msg} 
          showTimestamp={showTimestamp}
        />
      ))}
    </Box>
  );
};

// Input component for Claude-like input
interface InputBoxProps {
  prompt?: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  placeholder?: string;
  history?: string[];
}

export const InputBox: FC<InputBoxProps> = ({ 
  prompt = '>' , 
  value, 
  onChange, 
  onSubmit,
  placeholder = 'Type a message...',
  history = []
}) => {
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  useInput((input, key) => {
    if (key.upArrow && history.length > 0) {
      const newIndex = Math.min(historyIndex + 1, history.length - 1);
      setHistoryIndex(newIndex);
      onChange(history[history.length - 1 - newIndex] || '');
    } else if (key.downArrow && history.length > 0) {
      const newIndex = Math.max(historyIndex - 1, -1);
      setHistoryIndex(newIndex);
      if (newIndex === -1) {
        onChange('');
      } else {
        onChange(history[history.length - 1 - newIndex] || '');
      }
    } else if (key.return) {
      if (value.trim()) {
        onSubmit(value);
        onChange('');
        setHistoryIndex(-1);
      }
    }
  });
  
  return (
    <Box flexDirection="column" marginTop={1}>
      <Box>
        <Text color={colors.primary} bold>{prompt} </Text>
        <Text>{value || <Text dimColor>{placeholder}</Text>}</Text>
        <Text color="cyan">█</Text>
      </Box>
    </Box>
  );
};

// Status bar similar to Claude Code
interface StatusBarProps {
  status: 'idle' | 'thinking' | 'working' | 'error';
  message?: string;
  tokenUsage?: { used: number; limit: number };
}

export const ClaudeStatusBar: FC<StatusBarProps> = ({ 
  status, 
  message,
  tokenUsage 
}) => {
  const statusColors = {
    idle: colors.success,
    thinking: colors.warning,
    working: colors.info,
    error: colors.error,
  };
  
  const statusText = {
    idle: 'IDLE',
    thinking: 'THINKING',
    working: 'WORKING',
    error: 'ERROR',
  };
  
  return (
    <Box justifyContent="space-between" marginTop={1}>
      <Box>
        <Text color={statusColors[status]} bold>
          [{statusText[status]}]
        </Text>
        {message && <Text> {message}</Text>}
      </Box>
      {tokenUsage && (
        <Box>
          <Text dimColor>
            Tokens: {tokenUsage.used}/{tokenUsage.limit}
          </Text>
        </Box>
      )}
    </Box>
  );
};

// Main layout component
interface ClaudeLayoutProps {
  children?: React.ReactNode;
  header?: boolean;
  statusBar?: boolean;
  inputBox?: boolean;
}

export const ClaudeLayout: FC<ClaudeLayoutProps> = ({ 
  children, 
  header = true,
  statusBar = true,
  inputBox: _inputBox = false
}) => {
  return (
    <Box flexDirection="column" padding={1} height="100%">
      {header && <ClaudeHeader />}
      <Box flexGrow={1} flexDirection="column">
        {children}
      </Box>
      {statusBar && <ClaudeStatusBar status="idle" />}
    </Box>
  );
};

// Quick action buttons similar to Claude Code's suggestions
interface QuickActionsProps {
  actions: Array<{ label: string; value: string; }>;
  onSelect: (value: string) => void;
}

export const QuickActions: FC<QuickActionsProps> = ({ actions, onSelect }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  useInput((input, key) => {
    if (key.leftArrow) {
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : actions.length - 1));
    } else if (key.rightArrow) {
      setSelectedIndex(prev => (prev < actions.length - 1 ? prev + 1 : 0));
    } else if (key.return) {
      onSelect(actions[selectedIndex].value);
    }
  });
  
  return (
    <Box flexDirection="row" gap={2} marginTop={1}>
      {actions.map((action, index) => (
        <Box 
          key={action.value}
          borderStyle={index === selectedIndex ? 'double' : 'single'}
          borderColor={index === selectedIndex ? colors.primary : colors.muted}
          paddingX={2}
          paddingY={1}
        >
          <Text color={index === selectedIndex ? colors.primary : colors.muted}>
            {action.label}
          </Text>
        </Box>
      ))}
    </Box>
  );
};

export { colors };