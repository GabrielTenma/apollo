/**
 * Routine execution configuration
 * This file contains the configuration for routine execution service
 */
export const routineConfig = {
  enabled: process.env.ROUTINE_ENABLED === 'true',
};

/**
 * Validation function for Routine configuration
 */
export function validateRoutineConfig() {
  const errors: string[] = [];

  // No validation needed for just enabled flag
  return {
    isValid: errors.length === 0,
    errors,
  };
}