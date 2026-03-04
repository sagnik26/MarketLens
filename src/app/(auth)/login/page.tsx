/** Login page: sign-in form and redirect for authenticated users. */

import { LoginForm } from "@/components/features/auth/LoginForm";

export default function LoginPage() {
  // For now we just always redirect to /dashboard after login.
  return <LoginForm redirect="/dashboard" />;
}

