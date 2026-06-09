"use client"

import { useActionState, useEffect, useRef, useState } from "react"
import {
  Briefcase,
  CircleAlert,
  Dumbbell,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  User,
} from "lucide-react"
import { toast } from "sonner"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  initialLoginActionState,
  type LoginActionState,
} from "@/lib/auth/login"

export type LoginAction = (
  state: LoginActionState,
  formData: FormData
) => Promise<LoginActionState>

interface LoginFormProps {
  action: LoginAction
}

const demoLoginAccounts = [
  {
    role: "owner",
    label: "Owner",
    email: "owner@gmail.com",
    icon: ShieldCheck,
  },
  {
    role: "manager",
    label: "Manager",
    email: "manager@gmail.com",
    icon: Briefcase,
  },
  {
    role: "pt",
    label: "PT",
    email: "pt01@gmail.com",
    icon: Dumbbell,
  },
  {
    role: "member",
    label: "Member",
    email: "member@gmail.com",
    icon: User,
  },
] as const

type DemoLoginRole = (typeof demoLoginAccounts)[number]["role"]

export function LoginForm({ action }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [selectedDemoRole, setSelectedDemoRole] =
    useState<DemoLoginRole | null>(null)
  const [state, formAction, pending] = useActionState(
    action,
    initialLoginActionState
  )
  const wasPending = useRef(false)
  const isInvalid = Boolean(state.error)

  useEffect(() => {
    if (pending) {
      wasPending.current = true
      return
    }

    if (!wasPending.current) {
      return
    }

    wasPending.current = false

    if (state.error) {
      toast.error(state.error)
    }
  }, [pending, state.error])

  return (
    <div className="flex flex-col gap-5">
      <form action={formAction} className="flex flex-col gap-5">
        <FieldGroup>
          <Field data-invalid={isInvalid || undefined}>
            <FieldLabel htmlFor="email">Email address</FieldLabel>
            <InputGroup className="h-11 bg-background">
              <InputGroupInput
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                required
                aria-invalid={isInvalid}
              />
              <InputGroupAddon align="inline-start">
                <Mail />
              </InputGroupAddon>
            </InputGroup>
          </Field>

          <Field data-invalid={isInvalid || undefined}>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <InputGroup className="h-11 bg-background">
              <InputGroupInput
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter your password"
                required
                aria-invalid={isInvalid}
              />
              <InputGroupAddon align="inline-start">
                <Lock />
              </InputGroupAddon>
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  size="icon-xs"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((value) => !value)}
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          </Field>

          {state.error ? (
            <Alert variant="destructive">
              <CircleAlert />
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          ) : null}

          <Field orientation="horizontal" className="items-center gap-2">
            <Checkbox id="remember" name="remember" defaultChecked />
            <FieldLabel htmlFor="remember" className="font-normal">
              Keep me signed in
            </FieldLabel>
          </Field>
        </FieldGroup>

        <Button
          type="submit"
          size="lg"
          className="h-11 w-full"
          disabled={pending}
          onClick={() => setSelectedDemoRole(null)}
        >
          {pending && selectedDemoRole === null ? (
            <>
              <Loader2 data-icon="inline-start" className="animate-spin" />
              Signing in
            </>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <p className="text-xs font-medium text-muted-foreground">
            Demo accounts
          </p>
          <div className="h-px flex-1 bg-border" />
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {demoLoginAccounts.map((account) => {
            const Icon = account.icon
            const isSelected = selectedDemoRole === account.role

            return (
              <form key={account.role} action={formAction}>
                <Button
                  type="submit"
                  variant="outline"
                  name="demoRole"
                  value={account.role}
                  className="h-auto min-h-11 w-full justify-start px-3 py-2 text-left whitespace-normal"
                  disabled={pending}
                  aria-label={`Sign in as ${account.label}`}
                  onClick={() => setSelectedDemoRole(account.role)}
                >
                  {pending && isSelected ? (
                    <Loader2
                      data-icon="inline-start"
                      className="animate-spin"
                    />
                  ) : (
                    <Icon data-icon="inline-start" />
                  )}
                  <span className="flex min-w-0 flex-col items-start gap-0.5">
                    <span className="text-sm leading-4 font-medium">
                      {account.label}
                    </span>
                    <span className="text-xs leading-4 text-muted-foreground">
                      {account.email}
                    </span>
                  </span>
                </Button>
              </form>
            )
          })}
        </div>
      </div>
    </div>
  )
}
