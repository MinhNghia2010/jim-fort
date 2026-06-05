"use client"

import { useActionState, useState } from "react"
import { CircleAlert, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react"

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

export function LoginForm({ action }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [state, formAction, pending] = useActionState(
    action,
    initialLoginActionState
  )
  const isInvalid = Boolean(state.error)

  return (
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
      >
        {pending ? (
          <>
            <Loader2 data-icon="inline-start" className="animate-spin" />
            Signing in
          </>
        ) : (
          "Sign in"
        )}
      </Button>
    </form>
  )
}
