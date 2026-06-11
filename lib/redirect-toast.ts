export const redirectToastMessageParam = "_toast"
export const redirectToastTypeParam = "_toastType"

export type RedirectToastType = "success" | "error" | "info" | "warning"

export function withRedirectToast(
  href: string,
  message: string,
  type: RedirectToastType = "success"
) {
  const separator = href.includes("?") ? "&" : "?"

  return `${href}${separator}${redirectToastMessageParam}=${encodeURIComponent(message)}&${redirectToastTypeParam}=${type}`
}
