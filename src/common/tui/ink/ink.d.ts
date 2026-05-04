// Type declarations for ink v7
declare module 'ink' {
  import React from 'react';
  
  // Components - using React.FC<any> for JSX compatibility
  export const Box: React.FC<any>;
  export const Text: React.FC<any>;
  export const Spinner: React.FC<any>;
  export const Newline: React.FC<any>;
  export const Static: React.FC<any>;
  export const Spacer: React.FC<any>;
  export const Transform: React.FC<any>;
  
  // Hooks and functions
  export function render(element: React.ReactElement, options?: any): { waitUntilExit: () => Promise<void> };
  export function useApp(): { exit: () => void };
  export function useInput(callback: (input: string, key: any) => void): void;
  export function useStdin(): { stdin: NodeJS.ReadStream & { fd: 0 }, setRawMode: (mode: boolean) => void };
  export function useStdout(): { stdout: NodeJS.WriteStream & { fd: 1 } };
  export function useStderr(): { stderr: NodeJS.WriteStream & { fd: 2 } };
  export function measureElement(): { width: number; height: number };
}