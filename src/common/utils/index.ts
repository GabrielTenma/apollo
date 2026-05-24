/**
 * Barrel file for common utilities
 * This allows importing multiple utilities from a single path
 *
 * @example
 * import { successResponse, paginatedResponse, toCamelCase } from 'src/common/utils';
 */

// Date utilities
export {
  addTime,
  dateDiff,
  formatDate,
  isExpired,
  toISOString,
} from './date.util';
// Memory Key Store utilities
export {
  MemoryEntry,
  MemoryKeyStore,
  memoryKeyStore,
} from './memory-key-store.util';
// Pagination utilities
export {
  getPagination,
  getPaginationMeta,
  normalizePagination,
  PaginationOptions,
  PaginationResult,
} from './pagination.util';
// Response utilities
export {
  ApiResponse,
  errorResponse,
  PaginatedResponse,
  paginatedResponse,
  successResponse,
} from './response.util';
// String utilities
export {
  capitalize,
  randomString,
  slugify,
  toCamelCase,
  toKebabCase,
  toPascalCase,
  toSnakeCase,
  truncate,
} from './string.util';
