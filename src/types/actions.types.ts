/** ActionResponse<T> and related types for Server Action return shape (success, data, error, fieldErrors). */

export interface ActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}
