export type ApiResponse<T> = { data: T; meta?: Record<string, unknown> };

export function apiResponse<T>(
  data: T,
  meta?: Record<string, unknown>,
): ApiResponse<T> {
  return meta ? { data, meta } : { data };
}
