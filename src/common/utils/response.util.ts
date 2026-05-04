/**
 * Standard API response wrapper interface
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  timestamp: string;
  statusCode?: number;
}

/**
 * Creates a success response object
 * @param data - The data to include in the response
 * @param message - Optional success message
 * @param statusCode - Optional HTTP status code (default: 200)
 * @returns A standardized success response object
 */
export const successResponse = <T>(
  data?: T,
  message?: string,
  statusCode = 200,
): ApiResponse<T> => ({
  success: true,
  data,
  message,
  timestamp: new Date().toISOString(),
  statusCode,
});

/**
 * Creates an error response object
 * @param message - The error message
 * @param statusCode - HTTP status code (default: 400)
 * @param errors - Optional array of detailed errors
 * @returns A standardized error response object
 */
export const errorResponse = (
  message: string,
  statusCode = 400,
  errors?: string[],
): ApiResponse<null> => ({
  success: false,
  data: null,
  message,
  timestamp: new Date().toISOString(),
  statusCode,
});

/**
 * Creates a paginated response object
 * @param data - Array of items for the current page
 * @param total - Total number of items across all pages
 * @param page - Current page number
 * @param limit - Number of items per page
 * @returns A standardized paginated response
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export const paginatedResponse = <T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResponse<T> => ({
  success: true,
  data,
  timestamp: new Date().toISOString(),
  pagination: {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasNext: page < Math.ceil(total / limit),
    hasPrev: page > 1,
  },
});