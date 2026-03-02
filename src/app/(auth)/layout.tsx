/** Auth route group layout: wraps login/signup with shared auth-specific layout. */

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
