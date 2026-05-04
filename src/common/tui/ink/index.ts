// Export all Ink components and templates
export * from './components.js';
export * from './app.js';
export * from './templates.js';
export * from './claude-layout.js';

// Re-export Ink core (types simplified for v7 compatibility)
export { render, useApp, useInput, useStdin, useStdout, useStderr, Box, Text, Spinner, Newline, Static, measureElement, Spacer, Transform } from 'ink';
