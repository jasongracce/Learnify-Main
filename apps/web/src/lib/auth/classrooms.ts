/**
 * Auth helpers for Milestone 3 classroom/school routes.
 *
 * These do NOT check beta-waitlist access — school users are fully onboarded
 * via invite. Any authenticated user with the right school membership is allowed.
 */
import { NextResponse } from "next/server"
import type { User } from "@supabase/supabase-js"
import { createSupabaseServiceClientFromEnv, getMembershipByUserAndSchool } from "@learnify/database"
import type { SchoolMembershipRecord, SchoolMembershipRole } from "@learnify/shared"
import { requireSupabaseServiceEnv } from "@/lib/env"
import {
  createSupabaseServerClient,
  hasSupabaseAuthCookie,
} from "@/lib/supabase/server"

// Explicit discriminated results: success members must not declare `response`,
// otherwise `"response" in auth` cannot narrow the union in route handlers.
type ApiAuthFailure = { response: NextResponse }

type ApiAuthContext = {
  user: User
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>
  serviceSupabase: ReturnType<typeof createSupabaseServiceClientFromEnv>
}

// ---------------------------------------------------------------------------
// Base auth — just checks login
// ---------------------------------------------------------------------------

export async function requireApiAuth(): Promise<ApiAuthFailure | ApiAuthContext> {
  if (!(await hasSupabaseAuthCookie())) {
    return {
      response: NextResponse.json(
        { error: "Authentication is required." },
        { status: 401 }
      ),
    }
  }

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user?.email) {
    return {
      response: NextResponse.json(
        { error: "Authentication is required." },
        { status: 401 }
      ),
    }
  }

  const serviceSupabase = createSupabaseServiceClientFromEnv(
    requireSupabaseServiceEnv()
  )

  return { user, supabase, serviceSupabase }
}

// ---------------------------------------------------------------------------
// Learnify admin gate
// ---------------------------------------------------------------------------

export async function requireApiLearnifyAdmin(): Promise<
  ApiAuthFailure | ApiAuthContext
> {
  const auth = await requireApiAuth()
  if ("response" in auth) return auth

  const { data: profile, error } = await auth.serviceSupabase
    .from("profiles")
    .select("role")
    .eq("id", auth.user.id)
    .single<{ role: string }>()

  if (error || profile?.role !== "admin") {
    return {
      response: NextResponse.json(
        { error: "Learnify admin access required." },
        { status: 403 }
      ),
    }
  }

  return auth
}

// ---------------------------------------------------------------------------
// School membership gate
// ---------------------------------------------------------------------------

export async function requireApiSchoolAccess(
  schoolId: string,
  role: SchoolMembershipRole | SchoolMembershipRole[]
): Promise<
  ApiAuthFailure | (ApiAuthContext & { membership: SchoolMembershipRecord })
> {
  const auth = await requireApiAuth()
  if ("response" in auth) return auth

  const roles = Array.isArray(role) ? role : [role]

  // Check each allowed role
  for (const r of roles) {
    const membership = await getMembershipByUserAndSchool({
      supabase: auth.serviceSupabase,
      userId: auth.user.id,
      schoolId,
      role: r,
    })

    if (membership && membership.status === "active") {
      return { ...auth, membership }
    }
  }

  return {
    response: NextResponse.json(
      { error: "You do not have access to this school." },
      { status: 403 }
    ),
  }
}

// ---------------------------------------------------------------------------
// School admin OR Learnify admin gate
// ---------------------------------------------------------------------------

export async function requireApiSchoolAdminOrLearnifyAdmin(
  schoolId: string
): Promise<
  | ApiAuthFailure
  | (ApiAuthContext & {
      membership: SchoolMembershipRecord | null
      isLearnifyAdmin: boolean
    })
> {
  const auth = await requireApiAuth()
  if ("response" in auth) return auth

  // Check if learnify admin
  const { data: profile } = await auth.serviceSupabase
    .from("profiles")
    .select("role")
    .eq("id", auth.user.id)
    .single<{ role: string }>()

  if (profile?.role === "admin") {
    return { ...auth, membership: null, isLearnifyAdmin: true }
  }

  // Check school_admin membership
  const membership = await getMembershipByUserAndSchool({
    supabase: auth.serviceSupabase,
    userId: auth.user.id,
    schoolId,
    role: "school_admin",
  })

  if (membership && membership.status === "active") {
    return { ...auth, membership, isLearnifyAdmin: false }
  }

  return {
    response: NextResponse.json(
      { error: "School admin or Learnify admin access required." },
      { status: 403 }
    ),
  }
}
