import { AuthPanel } from "@/components/auth/AuthPanel"
import { AuthShell } from "@/components/auth/AuthShell"

import { LoginForm, type LoginAction } from "./LoginForm"

interface LoginPageProps {
  action: LoginAction
}

export function LoginPage({ action }: LoginPageProps) {
  return (
    <AuthShell
      title="Sign in to your gym workspace."
      description="Use the Jim Fort account assigned to you. Your workspace opens from the role stored with your authenticated account."
    >
      <AuthPanel
        title="Sign in"
        description="Enter the email and password created for your account."
      >
        <LoginForm action={action} />
      </AuthPanel>
    </AuthShell>
  )
}
