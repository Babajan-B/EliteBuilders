/**
 * Standard API error codes and response utilities
 */

export const ErrorCode = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  BAD_REQUEST: 'BAD_REQUEST',
  NOT_IMPLEMENTED: 'NOT_IMPLEMENTED',
} as const;

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

export interface ApiError {
  code: ErrorCodeType;
  message: string;
}

export interface ApiSuccessResponse<T = unknown> {
  ok: true;
  data: T;
}

export interface ApiErrorResponse {
  ok: false;
  error: ApiError;
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Create a success response
 */
export function success<T>(data: T): ApiSuccessResponse<T> {
  return { ok: true, data };
}

/**
 * Create an error response
 */
export function error(code: ErrorCodeType, message: string): ApiErrorResponse {
  return { ok: false, error: { code, message } };
}

/**
 * HTTP status codes for error types
 */
export function getHttpStatus(code: ErrorCodeType): number {
  switch (code) {
    case ErrorCode.VALIDATION_ERROR:
    case ErrorCode.BAD_REQUEST:
      return 400;
    case ErrorCode.UNAUTHORIZED:
      return 401;
    case ErrorCode.FORBIDDEN:
      return 403;
    case ErrorCode.NOT_FOUND:
      return 404;
    case ErrorCode.CONFLICT:
      return 409;
    case ErrorCode.NOT_IMPLEMENTED:
      return 501;
    case ErrorCode.INTERNAL_ERROR:
    default:
      return 500;
  }
}

/**
 * Create a NextResponse with standard error format
 */
export function errorResponse(code: ErrorCodeType, message: string) {
  return Response.json(error(code, message), {
    status: getHttpStatus(code),
  });
}

/**
 * Create a NextResponse with standard success format
 */
export function successResponse<T>(data: T, status = 200) {
  return Response.json(success(data), { status });
}

/**
 * Alias for success() - creates success response object
 */
export const ok = success;

/**
 * Alias for error() - creates error response object
 */
export const fail = error;

/**
 * Handle unknown errors and convert to ApiErrorResponse
 */
export function handleError(err: unknown): ApiErrorResponse {
  if (typeof err === 'object' && err !== null && 'code' in err && 'message' in err) {
    // Already an ApiError-like object
    const apiErr = err as { code: string; message: string };
    return {
      ok: false,
      error: {
        code: apiErr.code as ErrorCodeType,
        message: apiErr.message,
      },
    };
  }

  // Convert standard errors
  if (err instanceof Error) {
    // Map common error types
    if (err.message.includes('Authentication required')) {
      return error(ErrorCode.UNAUTHORIZED, err.message);
    }
    if (err.message.includes('Access denied') || err.message.includes('Forbidden')) {
      return error(ErrorCode.FORBIDDEN, err.message);
    }
    if (err.message.includes('not found')) {
      return error(ErrorCode.NOT_FOUND, err.message);
    }

    return error(ErrorCode.INTERNAL_ERROR, err.message);
  }

  // Unknown error type
  return error(ErrorCode.INTERNAL_ERROR, 'An unexpected error occurred');
}
