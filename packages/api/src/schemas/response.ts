/**
 * Standardized API response helpers
 */

export interface ApiSuccess<T> {
  readonly ok: true;
  readonly data: T;
}

export interface ApiError {
  readonly ok: false;
  readonly error: {
    readonly message: string;
    readonly code?: string;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export function apiOk<T>(data: T): ApiSuccess<T> {
  return { ok: true as const, data };
}

export function apiErr(message: string, code?: string): ApiError {
  const error: { readonly message: string; readonly code?: string } = code !== undefined
    ? { message, code }
    : { message };
  return { ok: false as const, error };
}
