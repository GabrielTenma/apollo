import React, { useState } from 'react';
import { render, useApp } from 'ink';
import { 
  ClaudeLayout, 
  ClaudeHeader, 
  ChatContainer, 
  ChatMessage, 
  InputBox, 
  QuickActions,
  ClaudeStatusBar,
  colors 
} from './index.js';

// Example messages
const initialMessages = [
  {
    id: '1',
    role: 'system' as const,
    content: 'Welcome to Apollo TUI - Claude Code style interface',
    timestamp: new Date(),
  },
  {
    id: '2',
    role: 'user' as const,
    content: 'Can you help me design a TUI like Claude Code?',
    timestamp: new Date(),
  },
  {
    id: '3',
    role: 'assistant' as const,
    content: 'I can help you create a beautiful terminal UI with chat interface, status indicators, and interactive components.',
    timestamp: new Date(),
  },
];

const quickActions = [
  { label: 'New Chat', value: 'new' },
  { label: 'View History', value: 'history' },
  { label: 'Settings', value: 'settings' },
  { label: 'Help', value: 'help' },
];

const ClaudeExample = () => {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<'idle' | 'thinking' | 'working'>('idle');
  const { exit } = useApp();

  const handleSubmit = (value: string) => {
    if (!value.trim()) return;
    
    const newMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: value,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, newMessage]);
    setStatus('thinking');
    
    // Simulate assistant response
    setTimeout(() => {
      const response = {
        id: (Date.now() + 1).toString(),
        role: 'assistant' as const,
        content: `I received: "${value}". This is a simulated response.`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, response]);
      setStatus('idle');
    }, 1000);
  };

  return (
    <ClaudeLayout>
      <ChatContainer messages={messages} showTimestamp />
      
      <QuickActions 
        actions={quickActions}
        onSelect={(value) => {
          if (value === 'new') {
            setMessages([initialMessages[0]]);
          }
        }}
      />
      
      <InputBox
        prompt=">"
        value={input}
        onChange={setInput}
        onSubmit={handleSubmit}
        placeholder="Type a message..."
      />
      
      <ClaudeStatusBar 
        status={status}
        message={status === 'thinking' ? 'Processing your request...' : undefined}
      />
    </ClaudeLayout>
  );
};

// Uncomment to run:
// render(<ClaudeExample />);

export default ClaudeExample;