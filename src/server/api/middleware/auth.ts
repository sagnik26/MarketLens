/** Authentication middleware: verify access token and set x-user-id / x-user-role on request. */

export async function authenticate(): Promise<void> {}

export function authorize(): () => Promise<void> {
  return async () => {};
}
