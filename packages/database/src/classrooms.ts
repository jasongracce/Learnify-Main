import type { SupabaseClient as SupabaseJsClient } from "@supabase/supabase-js"

type SupabaseClient = SupabaseJsClient<any>
import {
  generateClassroomSlug,
  generateJoinCode,
  generateRawToken,
  hashToken,
  normalizeInviteEmail,
  normalizeSubject,
  buildInviteExpiresAt,
  checkStudentSeatCapacity,
  checkTeacherSeatCapacity,
  checkAdminSeatCapacity,
  resolveMembershipActivation,
  resolveMembershipDeactivation,
  resolveMembershipReactivation,
  resolveJoinRequestApproval,
  resolveJoinRequestRejection,
  resolveJoinRequestCancellation,
} from "@learnify/core"
import type {
  SchoolRecord,
  SchoolMembershipRecord,
  SchoolMembershipStatus,
  SchoolInviteRecord,
  ClassroomRecord,
  ClassroomJoinRequestRecord,
  ClassroomMembershipRecord,
  ClassroomStudentInviteRecord,
  SchoolAuditEventRecord,
  SchoolAuditEventType,
  SchoolSeatSummary,
  CreateSchoolRequest,
  CreateClassroomRequest,
  SchoolMembershipRole,
  ClassroomJoinSource,
} from "@learnify/shared"

export type SchoolAdminNotificationSummary = {
  subscriptionStatus: SchoolRecord["subscription_status"]
  pendingCapacityMemberships: number
  pendingInvites: number
  adminSeatsUsed: number
  adminSeatLimit: number
  teacherSeatsUsed: number
  teacherSeatLimit: number
  studentSeatsUsed: number
  studentSeatLimit: number
}

export type ClassroomRosterDetail = {
  classroom: ClassroomRecord
  activeRoster: ClassroomMembershipRecord[]
  pendingRequests: ClassroomJoinRequestRecord[]
}

// ---------------------------------------------------------------------------
// School queries
// ---------------------------------------------------------------------------

export async function getSchoolBySlug(input: {
  supabase: SupabaseClient
  slug: string
}): Promise<SchoolRecord | null> {
  const { data, error } = await input.supabase
    .from("schools")
    .select("*")
    .eq("slug", input.slug)
    .maybeSingle<SchoolRecord>()

  if (error) throw new Error(error.message)
  return data
}

export async function getSchoolById(input: {
  supabase: SupabaseClient
  schoolId: string
}): Promise<SchoolRecord | null> {
  const { data, error } = await input.supabase
    .from("schools")
    .select("*")
    .eq("id", input.schoolId)
    .maybeSingle<SchoolRecord>()

  if (error) throw new Error(error.message)
  return data
}

export async function listSchools(input: {
  supabase: SupabaseClient
}): Promise<SchoolRecord[]> {
  const { data, error } = await input.supabase
    .from("schools")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<SchoolRecord[]>()

  if (error) throw new Error(error.message)
  return data
}

export async function createSchool(input: {
  supabase: SupabaseClient
  createdBy: string
  request: CreateSchoolRequest
}): Promise<SchoolRecord> {
  const { data, error } = await input.supabase
    .from("schools")
    .insert({
      name: input.request.name,
      slug: input.request.slug,
      subscription_status: "active",
      admin_seat_limit: input.request.adminSeatLimit ?? 3,
      teacher_seat_limit: input.request.teacherSeatLimit,
      student_seat_limit: input.request.studentSeatLimit,
      student_overage_allowed_by_learnify:
        input.request.studentOverageAllowedByLearnify ?? false,
      student_overage_enabled_by_school: false,
      renewal_date: input.request.renewalDate ?? null,
      created_by: input.createdBy,
    })
    .select("*")
    .single<SchoolRecord>()

  if (error) throw new Error(error.message)
  return data
}

// ---------------------------------------------------------------------------
// Seat summary
// ---------------------------------------------------------------------------

export async function getSchoolSeatSummary(input: {
  supabase: SupabaseClient
  schoolId: string
}): Promise<SchoolSeatSummary> {
  const school = await getSchoolById({ supabase: input.supabase, schoolId: input.schoolId })
  if (!school) throw new Error("School not found.")

  const countActive = async (role: SchoolMembershipRole) => {
    const { count, error } = await input.supabase
      .from("school_memberships")
      .select("id", { count: "exact", head: true })
      .eq("school_id", input.schoolId)
      .eq("role", role)
      .eq("status", "active")
      .eq("seat_consumed", true)

    if (error) throw new Error(error.message)
    return count ?? 0
  }

  const countOverage = async () => {
    const { count, error } = await input.supabase
      .from("school_memberships")
      .select("id", { count: "exact", head: true })
      .eq("school_id", input.schoolId)
      .eq("role", "student")
      .eq("overage", true)

    if (error) throw new Error(error.message)
    return count ?? 0
  }

  const [activeAdmins, activeTeachers, activeStudents, studentOverageCount] =
    await Promise.all([
      countActive("school_admin"),
      countActive("teacher"),
      countActive("student"),
      countOverage(),
    ])

  return {
    adminSeatLimit: school.admin_seat_limit,
    teacherSeatLimit: school.teacher_seat_limit,
    studentSeatLimit: school.student_seat_limit,
    activeAdmins,
    activeTeachers,
    activeStudents,
    studentOverageAllowedByLearnify: school.student_overage_allowed_by_learnify,
    studentOverageEnabledBySchool: school.student_overage_enabled_by_school,
    studentOverageCount,
  }
}

// ---------------------------------------------------------------------------
// School memberships
// ---------------------------------------------------------------------------

export async function getMembershipByUserAndSchool(input: {
  supabase: SupabaseClient
  userId: string
  schoolId: string
  role?: SchoolMembershipRole
}): Promise<SchoolMembershipRecord | null> {
  let query = input.supabase
    .from("school_memberships")
    .select("*")
    .eq("school_id", input.schoolId)
    .eq("user_id", input.userId)

  if (input.role) {
    query = query.eq("role", input.role)
  }

  const { data, error } = await query.maybeSingle<SchoolMembershipRecord>()
  if (error) throw new Error(error.message)
  return data
}

export async function listCurrentSchoolMemberships(input: {
  supabase: SupabaseClient
  userId: string
}): Promise<SchoolMembershipRecord[]> {
  const { data, error } = await input.supabase
    .from("school_memberships")
    .select("*")
    .eq("user_id", input.userId)
    .neq("status", "removed")
    .order("created_at", { ascending: false })
    .returns<SchoolMembershipRecord[]>()

  if (error) throw new Error(error.message)
  return data
}

export async function listSchoolMemberships(input: {
  supabase: SupabaseClient
  schoolId: string
  role?: SchoolMembershipRole
  status?: SchoolMembershipStatus
}): Promise<SchoolMembershipRecord[]> {
  let query = input.supabase
    .from("school_memberships")
    .select("*")
    .eq("school_id", input.schoolId)
    .order("role", { ascending: true })
    .order("status", { ascending: true })
    .order("created_at", { ascending: false })

  if (input.role) query = query.eq("role", input.role)
  if (input.status) query = query.eq("status", input.status)

  const { data, error } = await query.returns<SchoolMembershipRecord[]>()
  if (error) throw new Error(error.message)
  return data
}

export async function getMembershipById(input: {
  supabase: SupabaseClient
  membershipId: string
}): Promise<SchoolMembershipRecord | null> {
  const { data, error } = await input.supabase
    .from("school_memberships")
    .select("*")
    .eq("id", input.membershipId)
    .maybeSingle<SchoolMembershipRecord>()

  if (error) throw new Error(error.message)
  return data
}

export async function getMembershipByEmailAndSchool(input: {
  supabase: SupabaseClient
  emailNormalized: string
  schoolId: string
  role: SchoolMembershipRole
}): Promise<SchoolMembershipRecord | null> {
  const { data, error } = await input.supabase
    .from("school_memberships")
    .select("*")
    .eq("school_id", input.schoolId)
    .eq("email_normalized", input.emailNormalized)
    .eq("role", input.role)
    .maybeSingle<SchoolMembershipRecord>()

  if (error) throw new Error(error.message)
  return data
}

export async function createPendingMembership(input: {
  supabase: SupabaseClient
  schoolId: string
  emailNormalized: string
  role: SchoolMembershipRole
  invitedBy: string | null
  userId?: string | null
}): Promise<SchoolMembershipRecord> {
  const { data, error } = await input.supabase
    .from("school_memberships")
    .insert({
      school_id: input.schoolId,
      user_id: input.userId ?? null,
      role: input.role,
      status: "invited",
      email_normalized: input.emailNormalized,
      seat_consumed: false,
      overage: false,
      invited_by: input.invitedBy,
    })
    .select("*")
    .single<SchoolMembershipRecord>()

  if (error) throw new Error(error.message)
  return data
}

export async function attachUserToMembership(input: {
  supabase: SupabaseClient
  membershipId: string
  userId: string
}): Promise<SchoolMembershipRecord> {
  const { data, error } = await input.supabase
    .from("school_memberships")
    .update({ user_id: input.userId })
    .eq("id", input.membershipId)
    .select("*")
    .single<SchoolMembershipRecord>()

  if (error) throw new Error(error.message)
  return data
}

export async function attachSchoolIdentityByEmail(input: {
  supabase: SupabaseClient
  email: string
  userId: string
}): Promise<void> {
  const emailNormalized = normalizeInviteEmail(input.email)

  const { error: membershipError } = await input.supabase
    .from("school_memberships")
    .update({ user_id: input.userId })
    .eq("email_normalized", emailNormalized)
    .is("user_id", null)

  if (membershipError) throw new Error(membershipError.message)

  const { error: requestError } = await input.supabase
    .from("classroom_join_requests")
    .update({ student_user_id: input.userId })
    .eq("email_normalized", emailNormalized)
    .is("student_user_id", null)

  if (requestError) throw new Error(requestError.message)
}

export async function getOrCreateStudentMembershipForJoin(input: {
  supabase: SupabaseClient
  schoolId: string
  userId: string
  email: string
  invitedBy: string | null
}): Promise<SchoolMembershipRecord> {
  const byUser = await getMembershipByUserAndSchool({
    supabase: input.supabase,
    userId: input.userId,
    schoolId: input.schoolId,
    role: "student",
  })

  if (byUser && byUser.status !== "removed") {
    return byUser
  }

  const emailNormalized = normalizeInviteEmail(input.email)
  const byEmail = await getMembershipByEmailAndSchool({
    supabase: input.supabase,
    emailNormalized,
    schoolId: input.schoolId,
    role: "student",
  })

  if (byEmail && byEmail.status !== "removed") {
    if (byEmail.user_id && byEmail.user_id !== input.userId) {
      throw new Error("This school membership belongs to a different account.")
    }

    if (!byEmail.user_id) {
      return attachUserToMembership({
        supabase: input.supabase,
        membershipId: byEmail.id,
        userId: input.userId,
      })
    }

    return byEmail
  }

  return createPendingMembership({
    supabase: input.supabase,
    schoolId: input.schoolId,
    emailNormalized,
    role: "student",
    invitedBy: input.invitedBy,
    userId: input.userId,
  })
}

export async function activateMembership(input: {
  supabase: SupabaseClient
  membershipId: string
  userId: string
  schoolId: string
  role: SchoolMembershipRole
  now?: Date
}): Promise<SchoolMembershipRecord> {
  const now = input.now ?? new Date()
  const summary = await getSchoolSeatSummary({
    supabase: input.supabase,
    schoolId: input.schoolId,
  })

  const membership = await getMembershipById({
    supabase: input.supabase,
    membershipId: input.membershipId,
  })
  if (!membership) throw new Error("Membership not found.")

  let capacityResult
  if (input.role === "teacher") {
    capacityResult = checkTeacherSeatCapacity(summary)
  } else if (input.role === "school_admin") {
    capacityResult = checkAdminSeatCapacity(summary)
  } else {
    capacityResult = checkStudentSeatCapacity(summary)
  }

  const resolution = resolveMembershipActivation({
    currentStatus: membership.status,
    capacityResult,
    role: input.role,
  })

  if ("error" in resolution) throw new Error(resolution.error)

  const { data, error } = await input.supabase
    .from("school_memberships")
    .update({
      user_id: input.userId,
      status: resolution.nextStatus,
      seat_consumed: resolution.consumesSeat,
      overage: resolution.overage,
      activated_at: resolution.nextStatus === "active" ? now.toISOString() : null,
    })
    .eq("id", input.membershipId)
    .select("*")
    .single<SchoolMembershipRecord>()

  if (error) throw new Error(error.message)
  return data
}

export async function deactivateMembership(input: {
  supabase: SupabaseClient
  membershipId: string
  now?: Date
}): Promise<SchoolMembershipRecord> {
  const now = input.now ?? new Date()
  const membership = await getMembershipById({
    supabase: input.supabase,
    membershipId: input.membershipId,
  })
  if (!membership) throw new Error("Membership not found.")

  const resolution = resolveMembershipDeactivation({
    currentStatus: membership.status,
  })
  if ("error" in resolution) throw new Error(resolution.error)

  const { data, error } = await input.supabase
    .from("school_memberships")
    .update({
      status: resolution.nextStatus,
      seat_consumed: false,
      deactivated_at: now.toISOString(),
    })
    .eq("id", input.membershipId)
    .select("*")
    .single<SchoolMembershipRecord>()

  if (error) throw new Error(error.message)
  return data
}

export async function reactivateMembership(input: {
  supabase: SupabaseClient
  membershipId: string
  userId: string
  schoolId: string
  role: SchoolMembershipRole
}): Promise<SchoolMembershipRecord> {
  const summary = await getSchoolSeatSummary({
    supabase: input.supabase,
    schoolId: input.schoolId,
  })
  const membership = await getMembershipById({
    supabase: input.supabase,
    membershipId: input.membershipId,
  })
  if (!membership) throw new Error("Membership not found.")

  let capacityResult
  if (input.role === "teacher") {
    capacityResult = checkTeacherSeatCapacity(summary)
  } else if (input.role === "school_admin") {
    capacityResult = checkAdminSeatCapacity(summary)
  } else {
    capacityResult = checkStudentSeatCapacity(summary)
  }

  const resolution = resolveMembershipReactivation({
    currentStatus: membership.status,
    capacityResult,
  })

  if ("error" in resolution) throw new Error(resolution.error)

  const now = new Date().toISOString()
  const { data, error } = await input.supabase
    .from("school_memberships")
    .update({
      status: resolution.nextStatus,
      seat_consumed: resolution.consumesSeat,
      overage: resolution.overage,
      activated_at: resolution.nextStatus === "active" ? now : null,
      deactivated_at: null,
    })
    .eq("id", input.membershipId)
    .select("*")
    .single<SchoolMembershipRecord>()

  if (error) throw new Error(error.message)
  return data
}

// ---------------------------------------------------------------------------
// School invites
// ---------------------------------------------------------------------------

export async function createSchoolInvite(input: {
  supabase: SupabaseClient
  schoolId: string
  email: string
  role: "school_admin" | "teacher"
  invitedBy: string
  now?: Date
}): Promise<{ invite: SchoolInviteRecord; rawToken: string }> {
  const emailNormalized = normalizeInviteEmail(input.email)
  const rawToken = generateRawToken()
  const tokenHash = hashToken(rawToken)
  const expiresAt = buildInviteExpiresAt(input.now)

  const { data, error } = await input.supabase
    .from("school_invites")
    .insert({
      school_id: input.schoolId,
      email: input.email,
      email_normalized: emailNormalized,
      role: input.role,
      token_hash: tokenHash,
      status: "pending",
      invited_by: input.invitedBy,
      expires_at: expiresAt,
    })
    .select("*")
    .single<SchoolInviteRecord>()

  if (error) throw new Error(error.message)
  return { invite: data, rawToken }
}

export async function getSchoolInviteByTokenHash(input: {
  supabase: SupabaseClient
  tokenHash: string
}): Promise<SchoolInviteRecord | null> {
  const { data, error } = await input.supabase
    .from("school_invites")
    .select("*")
    .eq("token_hash", input.tokenHash)
    .maybeSingle<SchoolInviteRecord>()

  if (error) throw new Error(error.message)
  return data
}

export async function markSchoolInviteAccepted(input: {
  supabase: SupabaseClient
  inviteId: string
  acceptedBy: string
  now?: Date
}): Promise<SchoolInviteRecord> {
  const now = (input.now ?? new Date()).toISOString()
  const { data, error } = await input.supabase
    .from("school_invites")
    .update({
      status: "accepted",
      accepted_by: input.acceptedBy,
      accepted_at: now,
    })
    .eq("id", input.inviteId)
    .select("*")
    .single<SchoolInviteRecord>()

  if (error) throw new Error(error.message)
  return data
}

export async function deleteSchoolInvite(input: {
  supabase: SupabaseClient
  inviteId: string
}): Promise<SchoolInviteRecord> {
  const { data, error } = await input.supabase
    .from("school_invites")
    .update({ status: "deleted" })
    .eq("id", input.inviteId)
    .select("*")
    .single<SchoolInviteRecord>()

  if (error) throw new Error(error.message)
  return data
}

export async function listPendingSchoolInvites(input: {
  supabase: SupabaseClient
  schoolId: string
  role?: "school_admin" | "teacher"
}): Promise<SchoolInviteRecord[]> {
  let query = input.supabase
    .from("school_invites")
    .select("*")
    .eq("school_id", input.schoolId)
    .eq("status", "pending")
    .order("created_at", { ascending: false })

  if (input.role) {
    query = query.eq("role", input.role)
  }

  const { data, error } = await query.returns<SchoolInviteRecord[]>()
  if (error) throw new Error(error.message)
  return data
}

export async function getSchoolAdminNotificationSummary(input: {
  supabase: SupabaseClient
  schoolId: string
}): Promise<SchoolAdminNotificationSummary> {
  const [school, seats, pendingCapacityMemberships, pendingInvites] =
    await Promise.all([
      getSchoolById({ supabase: input.supabase, schoolId: input.schoolId }),
      getSchoolSeatSummary({ supabase: input.supabase, schoolId: input.schoolId }),
      listSchoolMemberships({
        supabase: input.supabase,
        schoolId: input.schoolId,
        status: "pending_capacity",
      }),
      listPendingSchoolInvites({
        supabase: input.supabase,
        schoolId: input.schoolId,
      }),
    ])

  if (!school) throw new Error("School not found.")

  return {
    subscriptionStatus: school.subscription_status,
    pendingCapacityMemberships: pendingCapacityMemberships.length,
    pendingInvites: pendingInvites.length,
    adminSeatsUsed: seats.activeAdmins,
    adminSeatLimit: seats.adminSeatLimit,
    teacherSeatsUsed: seats.activeTeachers,
    teacherSeatLimit: seats.teacherSeatLimit,
    studentSeatsUsed: seats.activeStudents,
    studentSeatLimit: seats.studentSeatLimit,
  }
}

// ---------------------------------------------------------------------------
// Classrooms
// ---------------------------------------------------------------------------

export async function createClassroom(input: {
  supabase: SupabaseClient
  schoolId: string
  ownerMembershipId: string
  request: CreateClassroomRequest
}): Promise<{ classroom: ClassroomRecord; rawJoinToken: string }> {
  const slug = generateClassroomSlug(input.request.name)
  const joinCode = generateJoinCode()
  const rawToken = generateRawToken()
  const joinTokenHash = hashToken(rawToken)
  const subjectNormalized = normalizeSubject(input.request.subjectLabel)

  const { data, error } = await input.supabase
    .from("classrooms")
    .insert({
      school_id: input.schoolId,
      owner_membership_id: input.ownerMembershipId,
      name: input.request.name,
      slug,
      subject_label: input.request.subjectLabel,
      subject_normalized: subjectNormalized,
      school_year: input.request.schoolYear ?? null,
      grade_label: input.request.gradeLabel ?? null,
      status: "active",
      join_code: joinCode,
      join_token_hash: joinTokenHash,
      join_enabled: true,
    })
    .select("*")
    .single<ClassroomRecord>()

  if (error) throw new Error(error.message)
  return { classroom: data, rawJoinToken: rawToken }
}

export async function getClassroomBySlug(input: {
  supabase: SupabaseClient
  slug: string
}): Promise<ClassroomRecord | null> {
  const { data, error } = await input.supabase
    .from("classrooms")
    .select("*")
    .eq("slug", input.slug)
    .maybeSingle<ClassroomRecord>()

  if (error) throw new Error(error.message)
  return data
}

export async function getClassroomById(input: {
  supabase: SupabaseClient
  classroomId: string
}): Promise<ClassroomRecord | null> {
  const { data, error } = await input.supabase
    .from("classrooms")
    .select("*")
    .eq("id", input.classroomId)
    .maybeSingle<ClassroomRecord>()

  if (error) throw new Error(error.message)
  return data
}

export async function getClassroomByJoinCode(input: {
  supabase: SupabaseClient
  joinCode: string
}): Promise<ClassroomRecord | null> {
  const { data, error } = await input.supabase
    .from("classrooms")
    .select("*")
    .eq("join_code", input.joinCode.toUpperCase())
    .maybeSingle<ClassroomRecord>()

  if (error) throw new Error(error.message)
  return data
}

export async function getClassroomByJoinTokenHash(input: {
  supabase: SupabaseClient
  tokenHash: string
}): Promise<ClassroomRecord | null> {
  const { data, error } = await input.supabase
    .from("classrooms")
    .select("*")
    .eq("join_token_hash", input.tokenHash)
    .maybeSingle<ClassroomRecord>()

  if (error) throw new Error(error.message)
  return data
}

export async function listClassroomsForTeacher(input: {
  supabase: SupabaseClient
  ownerMembershipId: string
}): Promise<ClassroomRecord[]> {
  const { data, error } = await input.supabase
    .from("classrooms")
    .select("*")
    .eq("owner_membership_id", input.ownerMembershipId)
    .neq("status", "deleted")
    .order("created_at", { ascending: false })
    .returns<ClassroomRecord[]>()

  if (error) throw new Error(error.message)
  return data
}

export async function getClassroomRosterDetailBySlug(input: {
  supabase: SupabaseClient
  classroomSlug: string
}): Promise<ClassroomRosterDetail | null> {
  const classroom = await getClassroomBySlug({
    supabase: input.supabase,
    slug: input.classroomSlug,
  })

  if (!classroom) return null

  const [activeRoster, pendingRequests] = await Promise.all([
    listActiveClassroomMemberships({
      supabase: input.supabase,
      classroomId: classroom.id,
    }),
    listPendingJoinRequestsForClassroom({
      supabase: input.supabase,
      classroomId: classroom.id,
    }),
  ])

  return { classroom, activeRoster, pendingRequests }
}

export async function regenerateJoinCode(input: {
  supabase: SupabaseClient
  classroomId: string
}): Promise<{ classroom: ClassroomRecord; rawJoinToken: string }> {
  const newCode = generateJoinCode()
  const rawToken = generateRawToken()
  const newTokenHash = hashToken(rawToken)

  const { data, error } = await input.supabase
    .from("classrooms")
    .update({ join_code: newCode, join_token_hash: newTokenHash, join_enabled: true })
    .eq("id", input.classroomId)
    .select("*")
    .single<ClassroomRecord>()

  if (error) throw new Error(error.message)
  return { classroom: data, rawJoinToken: rawToken }
}

export async function disableJoinCode(input: {
  supabase: SupabaseClient
  classroomId: string
}): Promise<ClassroomRecord> {
  const { data, error } = await input.supabase
    .from("classrooms")
    .update({ join_enabled: false })
    .eq("id", input.classroomId)
    .select("*")
    .single<ClassroomRecord>()

  if (error) throw new Error(error.message)
  return data
}

// ---------------------------------------------------------------------------
// Classroom join requests
// ---------------------------------------------------------------------------

export async function getOpenJoinRequestForStudent(input: {
  supabase: SupabaseClient
  classroomId: string
  studentUserId: string
}): Promise<ClassroomJoinRequestRecord | null> {
  const { data, error } = await input.supabase
    .from("classroom_join_requests")
    .select("*")
    .eq("classroom_id", input.classroomId)
    .eq("student_user_id", input.studentUserId)
    .in("status", ["pending_teacher_approval", "pending_capacity"])
    .maybeSingle<ClassroomJoinRequestRecord>()

  if (error) throw new Error(error.message)
  return data
}

export async function createJoinRequest(input: {
  supabase: SupabaseClient
  schoolId: string
  classroomId: string
  studentUserId: string | null
  studentMembershipId: string | null
  source: ClassroomJoinSource
  email?: string
  emailNormalized?: string
}): Promise<ClassroomJoinRequestRecord> {
  const { data, error } = await input.supabase
    .from("classroom_join_requests")
    .insert({
      school_id: input.schoolId,
      classroom_id: input.classroomId,
      student_user_id: input.studentUserId,
      student_membership_id: input.studentMembershipId,
      email: input.email ?? null,
      email_normalized: input.emailNormalized ?? null,
      source: input.source,
      status: "pending_teacher_approval",
      requested_at: new Date().toISOString(),
    })
    .select("*")
    .single<ClassroomJoinRequestRecord>()

  if (error) throw new Error(error.message)
  return data
}

export async function getJoinRequestById(input: {
  supabase: SupabaseClient
  requestId: string
}): Promise<ClassroomJoinRequestRecord | null> {
  const { data, error } = await input.supabase
    .from("classroom_join_requests")
    .select("*")
    .eq("id", input.requestId)
    .maybeSingle<ClassroomJoinRequestRecord>()

  if (error) throw new Error(error.message)
  return data
}

export async function getOpenJoinRequestForEmail(input: {
  supabase: SupabaseClient
  classroomId: string
  emailNormalized: string
}): Promise<ClassroomJoinRequestRecord | null> {
  const { data, error } = await input.supabase
    .from("classroom_join_requests")
    .select("*")
    .eq("classroom_id", input.classroomId)
    .eq("email_normalized", input.emailNormalized)
    .in("status", ["pending_teacher_approval", "pending_capacity"])
    .maybeSingle<ClassroomJoinRequestRecord>()

  if (error) throw new Error(error.message)
  return data
}

export async function attachUserToJoinRequest(input: {
  supabase: SupabaseClient
  requestId: string
  studentUserId: string
  studentMembershipId: string
}): Promise<ClassroomJoinRequestRecord> {
  const { data, error } = await input.supabase
    .from("classroom_join_requests")
    .update({
      student_user_id: input.studentUserId,
      student_membership_id: input.studentMembershipId,
    })
    .eq("id", input.requestId)
    .select("*")
    .single<ClassroomJoinRequestRecord>()

  if (error) throw new Error(error.message)
  return data
}

export async function approveJoinRequest(input: {
  supabase: SupabaseClient
  requestId: string
  approvedBy: string
  schoolId: string
  now?: Date
}): Promise<{ request: ClassroomJoinRequestRecord; activated: boolean }> {
  const now = input.now ?? new Date()

  const joinRequest = await getJoinRequestById({
    supabase: input.supabase,
    requestId: input.requestId,
  })
  if (!joinRequest) throw new Error("Join request not found.")

  if (!joinRequest.student_membership_id || !joinRequest.student_user_id) {
    throw new Error("Join request is missing student membership data.")
  }

  const membership = await getMembershipById({
    supabase: input.supabase,
    membershipId: joinRequest.student_membership_id,
  })
  if (!membership) throw new Error("Membership not found.")

  const summary = await getSchoolSeatSummary({
    supabase: input.supabase,
    schoolId: input.schoolId,
  })
  const capacityResult =
    membership.status === "active"
      ? ({ allowed: true, overage: false } as const)
      : checkStudentSeatCapacity(summary)
  const resolution = resolveJoinRequestApproval({
    currentStatus: joinRequest.status,
    capacityResult,
  })

  if ("error" in resolution) throw new Error(resolution.error)

  const { data, error } = await input.supabase
    .from("classroom_join_requests")
    .update({
      status: resolution.nextStatus,
      approved_by: input.approvedBy,
      approved_at: now.toISOString(),
    })
    .eq("id", input.requestId)
    .select("*")
    .single<ClassroomJoinRequestRecord>()

  if (error) throw new Error(error.message)

  if (resolution.nextStatus !== "approved") {
    return { request: data, activated: false }
  }

  if (membership.status !== "active") {
    await activateMembership({
      supabase: input.supabase,
      membershipId: joinRequest.student_membership_id,
      userId: joinRequest.student_user_id,
      schoolId: input.schoolId,
      role: "student",
      now,
    })
  }

  await createClassroomMembership({
    supabase: input.supabase,
    schoolId: input.schoolId,
    classroomId: joinRequest.classroom_id,
    studentMembershipId: joinRequest.student_membership_id,
    studentUserId: joinRequest.student_user_id,
    now,
  })

  return { request: data, activated: true }
}

export async function rejectJoinRequest(input: {
  supabase: SupabaseClient
  requestId: string
  rejectedBy: string
  now?: Date
}): Promise<ClassroomJoinRequestRecord> {
  const now = input.now ?? new Date()
  const joinRequest = await getJoinRequestById({
    supabase: input.supabase,
    requestId: input.requestId,
  })
  if (!joinRequest) throw new Error("Join request not found.")

  const resolution = resolveJoinRequestRejection({ currentStatus: joinRequest.status })
  if ("error" in resolution) throw new Error(resolution.error)

  const { data, error } = await input.supabase
    .from("classroom_join_requests")
    .update({
      status: resolution.nextStatus,
      rejected_by: input.rejectedBy,
      rejected_at: now.toISOString(),
    })
    .eq("id", input.requestId)
    .select("*")
    .single<ClassroomJoinRequestRecord>()

  if (error) throw new Error(error.message)
  return data
}

export async function cancelJoinRequest(input: {
  supabase: SupabaseClient
  requestId: string
  now?: Date
}): Promise<ClassroomJoinRequestRecord> {
  const now = input.now ?? new Date()
  const joinRequest = await getJoinRequestById({
    supabase: input.supabase,
    requestId: input.requestId,
  })
  if (!joinRequest) throw new Error("Join request not found.")

  const resolution = resolveJoinRequestCancellation({ currentStatus: joinRequest.status })
  if ("error" in resolution) throw new Error(resolution.error)

  const { data, error } = await input.supabase
    .from("classroom_join_requests")
    .update({ status: resolution.nextStatus, cancelled_at: now.toISOString() })
    .eq("id", input.requestId)
    .select("*")
    .single<ClassroomJoinRequestRecord>()

  if (error) throw new Error(error.message)
  return data
}

export async function listPendingJoinRequestsForClassroom(input: {
  supabase: SupabaseClient
  classroomId: string
}): Promise<ClassroomJoinRequestRecord[]> {
  const { data, error } = await input.supabase
    .from("classroom_join_requests")
    .select("*")
    .eq("classroom_id", input.classroomId)
    .in("status", ["pending_teacher_approval", "pending_capacity"])
    .order("requested_at", { ascending: true })
    .returns<ClassroomJoinRequestRecord[]>()

  if (error) throw new Error(error.message)
  return data
}

export async function listOpenJoinRequestsForStudent(input: {
  supabase: SupabaseClient
  studentUserId: string
}): Promise<ClassroomJoinRequestRecord[]> {
  const { data, error } = await input.supabase
    .from("classroom_join_requests")
    .select("*")
    .eq("student_user_id", input.studentUserId)
    .in("status", ["pending_teacher_approval", "pending_capacity"])
    .order("requested_at", { ascending: false })
    .returns<ClassroomJoinRequestRecord[]>()

  if (error) throw new Error(error.message)
  return data
}

export async function countPendingJoinRequestsForTeacher(input: {
  supabase: SupabaseClient
  ownerMembershipId: string
}): Promise<number> {
  // Get all active classrooms for the teacher, then count pending requests
  const { data: classrooms, error: classroomError } = await input.supabase
    .from("classrooms")
    .select("id")
    .eq("owner_membership_id", input.ownerMembershipId)
    .eq("status", "active")
    .returns<{ id: string }[]>()

  if (classroomError) throw new Error(classroomError.message)
  if (classrooms.length === 0) return 0

  const classroomIds = classrooms.map((c) => c.id)
  const { count, error } = await input.supabase
    .from("classroom_join_requests")
    .select("id", { count: "exact", head: true })
    .in("classroom_id", classroomIds)
    .in("status", ["pending_teacher_approval", "pending_capacity"])

  if (error) throw new Error(error.message)
  return count ?? 0
}

// ---------------------------------------------------------------------------
// Classroom memberships
// ---------------------------------------------------------------------------

export async function createClassroomMembership(input: {
  supabase: SupabaseClient
  schoolId: string
  classroomId: string
  studentMembershipId: string
  studentUserId: string
  now?: Date
}): Promise<ClassroomMembershipRecord> {
  const now = (input.now ?? new Date()).toISOString()

  const { data, error } = await input.supabase
    .from("classroom_memberships")
    .upsert(
      {
        school_id: input.schoolId,
        classroom_id: input.classroomId,
        student_membership_id: input.studentMembershipId,
        student_user_id: input.studentUserId,
        status: "active",
        joined_at: now,
      },
      { onConflict: "classroom_id,student_user_id" }
    )
    .select("*")
    .single<ClassroomMembershipRecord>()

  if (error) throw new Error(error.message)
  return data
}

export async function getClassroomMembershipById(input: {
  supabase: SupabaseClient
  classroomMembershipId: string
}): Promise<ClassroomMembershipRecord | null> {
  const { data, error } = await input.supabase
    .from("classroom_memberships")
    .select("*")
    .eq("id", input.classroomMembershipId)
    .maybeSingle<ClassroomMembershipRecord>()

  if (error) throw new Error(error.message)
  return data
}

export async function removeStudentFromClassroom(input: {
  supabase: SupabaseClient
  classroomMembershipId: string
  removedBy: string
  now?: Date
}): Promise<ClassroomMembershipRecord> {
  const now = (input.now ?? new Date()).toISOString()

  const { data, error } = await input.supabase
    .from("classroom_memberships")
    .update({ status: "removed", removed_at: now, removed_by: input.removedBy })
    .eq("id", input.classroomMembershipId)
    .eq("status", "active")
    .select("*")
    .single<ClassroomMembershipRecord>()

  if (error) throw new Error(error.message)
  return data
}

export async function listActiveClassroomMemberships(input: {
  supabase: SupabaseClient
  classroomId: string
}): Promise<ClassroomMembershipRecord[]> {
  const { data, error } = await input.supabase
    .from("classroom_memberships")
    .select("*")
    .eq("classroom_id", input.classroomId)
    .eq("status", "active")
    .order("joined_at", { ascending: true })
    .returns<ClassroomMembershipRecord[]>()

  if (error) throw new Error(error.message)
  return data
}

// ---------------------------------------------------------------------------
// Classroom student invites
// ---------------------------------------------------------------------------

export async function createClassroomStudentInvite(input: {
  supabase: SupabaseClient
  schoolId: string
  classroomId: string
  email: string
  invitedBy: string
  now?: Date
}): Promise<{ invite: ClassroomStudentInviteRecord; rawToken: string }> {
  const emailNormalized = normalizeInviteEmail(input.email)
  const rawToken = generateRawToken()
  const tokenHash = hashToken(rawToken)
  const expiresAt = buildInviteExpiresAt(input.now)

  const { data, error } = await input.supabase
    .from("classroom_student_invites")
    .insert({
      school_id: input.schoolId,
      classroom_id: input.classroomId,
      email: input.email,
      email_normalized: emailNormalized,
      token_hash: tokenHash,
      status: "pending",
      invited_by: input.invitedBy,
      expires_at: expiresAt,
    })
    .select("*")
    .single<ClassroomStudentInviteRecord>()

  if (error) throw new Error(error.message)
  return { invite: data, rawToken }
}

export async function getClassroomStudentInviteByTokenHash(input: {
  supabase: SupabaseClient
  tokenHash: string
}): Promise<ClassroomStudentInviteRecord | null> {
  const { data, error } = await input.supabase
    .from("classroom_student_invites")
    .select("*")
    .eq("token_hash", input.tokenHash)
    .maybeSingle<ClassroomStudentInviteRecord>()

  if (error) throw new Error(error.message)
  return data
}

export async function markClassroomStudentInviteAccepted(input: {
  supabase: SupabaseClient
  inviteId: string
  acceptedBy: string
  now?: Date
}): Promise<ClassroomStudentInviteRecord> {
  const now = (input.now ?? new Date()).toISOString()
  const { data, error } = await input.supabase
    .from("classroom_student_invites")
    .update({
      status: "accepted",
      accepted_by: input.acceptedBy,
      accepted_at: now,
    })
    .eq("id", input.inviteId)
    .select("*")
    .single<ClassroomStudentInviteRecord>()

  if (error) throw new Error(error.message)
  return data
}

// ---------------------------------------------------------------------------
// Audit events
// ---------------------------------------------------------------------------

export async function insertAuditEvent(input: {
  supabase: SupabaseClient
  schoolId: string
  actorUserId: string | null
  actorMembershipId: string | null
  eventType: SchoolAuditEventType
  targetType: string
  targetId: string | null
  metadata?: Record<string, unknown>
}): Promise<SchoolAuditEventRecord> {
  const { data, error } = await input.supabase
    .from("school_audit_events")
    .insert({
      school_id: input.schoolId,
      actor_user_id: input.actorUserId,
      actor_membership_id: input.actorMembershipId,
      event_type: input.eventType,
      target_type: input.targetType,
      target_id: input.targetId,
      metadata: input.metadata ?? {},
    })
    .select("*")
    .single<SchoolAuditEventRecord>()

  if (error) throw new Error(error.message)
  return data
}

export async function listAuditEventsForSchool(input: {
  supabase: SupabaseClient
  schoolId: string
  limit?: number
  offset?: number
}): Promise<SchoolAuditEventRecord[]> {
  const { data, error } = await input.supabase
    .from("school_audit_events")
    .select("*")
    .eq("school_id", input.schoolId)
    .order("created_at", { ascending: false })
    .range(input.offset ?? 0, (input.offset ?? 0) + (input.limit ?? 50) - 1)
    .returns<SchoolAuditEventRecord[]>()

  if (error) throw new Error(error.message)
  return data
}
