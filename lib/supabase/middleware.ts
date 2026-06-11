import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

import {
  canAccessRoute,
  getDefaultRouteForRole,
  type Role,
} from "@/lib/routes"
import {
  authContextHeader,
  createAuthContext,
  serializeAuthContext,
} from "@/lib/auth/auth-context"

function redirectWithSessionCookies(url: URL, supabaseResponse: NextResponse) {
  const response = NextResponse.redirect(url)

  supabaseResponse.cookies.getAll().forEach((cookie) => {
    response.cookies.set(cookie)
  })

  return response
}

function getSafeReturnPath(request: NextRequest, role: Role) {
  const fallbackPath = getDefaultRouteForRole(role)
  const referer = request.headers.get("referer")

  if (!referer) {
    return fallbackPath
  }

  try {
    const refererUrl = new URL(referer)

    if (
      refererUrl.origin !== request.nextUrl.origin ||
      refererUrl.pathname === request.nextUrl.pathname ||
      refererUrl.pathname === "/unauthorized" ||
      !canAccessRoute(refererUrl.pathname, role)
    ) {
      return fallbackPath
    }

    return `${refererUrl.pathname}${refererUrl.search}`
  } catch {
    return fallbackPath
  }
}

function getLegacyVoucherDetailRedirectUrl(request: NextRequest) {
  const legacyViewPrefixes = ["/vouchers/view=", "/voucher/view="]
  const matchedViewPrefix = legacyViewPrefixes.find((prefix) =>
    request.nextUrl.pathname.startsWith(prefix)
  )

  if (matchedViewPrefix) {
    const url = request.nextUrl.clone()
    const voucherCode = request.nextUrl.pathname.slice(matchedViewPrefix.length)
    url.pathname = `/vouchers/${voucherCode}`

    return url
  }

  const legacySingularPrefix = "/voucher/"

  if (!request.nextUrl.pathname.startsWith(legacySingularPrefix)) {
    return null
  }

  const url = request.nextUrl.clone()
  const voucherCode = request.nextUrl.pathname.slice(legacySingularPrefix.length)
  url.pathname = `/vouchers/${voucherCode}`

  return url
}

export async function updateSession(request: NextRequest) {
  const requestHeaders = new Headers(request.headers)
  requestHeaders.delete(authContextHeader)

  function createNextResponse(previousResponse?: NextResponse) {
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })

    previousResponse?.cookies.getAll().forEach((cookie) => {
      response.cookies.set(cookie)
    })

    return response
  }

  let supabaseResponse = createNextResponse()

  const legacyVoucherUrl = getLegacyVoucherDetailRedirectUrl(request)

  if (legacyVoucherUrl) {
    return redirectWithSessionCookies(legacyVoucherUrl, supabaseResponse)
  }

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = createNextResponse(supabaseResponse)
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  let user: ReturnType<typeof createAuthContext> = null

  try {
    const { data, error } = await supabase.auth.getClaims()

    if (error) {
      throw error
    }

    user = data?.claims ? createAuthContext(data.claims) : null
  } catch (error) {
    console.error("Supabase Auth middleware claims check failed", error)

    if (
      !request.nextUrl.pathname.startsWith("/login") &&
      !request.nextUrl.pathname.startsWith("/auth")
    ) {
      const url = request.nextUrl.clone()
      url.pathname = "/login"
      return redirectWithSessionCookies(url, supabaseResponse)
    }

    return supabaseResponse
  }

  if (
    !user &&
    !request.nextUrl.pathname.startsWith("/login") &&
    !request.nextUrl.pathname.startsWith("/auth")
  ) {
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return redirectWithSessionCookies(url, supabaseResponse)
  }

  if (user) {
    requestHeaders.set(authContextHeader, serializeAuthContext(user))
    supabaseResponse = createNextResponse(supabaseResponse)
    const role = user.role

    if (!canAccessRoute(request.nextUrl.pathname, role)) {
      const url = request.nextUrl.clone()
      url.pathname = "/unauthorized"
      url.search = ""
      url.searchParams.set("from", request.nextUrl.pathname)
      url.searchParams.set("returnTo", getSafeReturnPath(request, role))
      return redirectWithSessionCookies(url, supabaseResponse)
    }

    if (request.nextUrl.pathname.startsWith("/login")) {
      const url = request.nextUrl.clone()
      url.pathname = getDefaultRouteForRole(role)
      return redirectWithSessionCookies(url, supabaseResponse)
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse
}
