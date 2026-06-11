import { z } from "zod"

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const schoolSubscriptionStatuses = [
  "active",
  "suspended",
  "expired",
  "grace_ended",
  "cancelled",
] as const

export const schoolMembershipStatuses = [
  "invited",
  "active",
  "pending_capacity",
  "inactive",
  "removed",
] as const

export const schoolMembershipRoles = [
  "school_admin",
  "teacher",
  "student",
] as const

export const schoolInviteStatuses = [
  "pending",
  "accepted",
  "expired",
  "deleted",
  "revoked",
] as const

export const classroomStatuses = ["active", "archived", "deleted"] as const

export const classroomJoinRequestStatuses = [
  "pending_teacher_approval",
  "pending_capacity",
  "approved",
  "rejected",
  "cancelled",
] as const

export const classroomMembershipStatuses = ["active", "removed"] as const

export const classroomJoinSources = ["code", "qr", "email_invite"] as const

export const classroomStudentInviteStatuses = [
  "pending",
  "accepted",
  "expired",
  "deleted",
  "revoked",
] as const

export const schoolAuditEventTypes = [
  "school.created",
  "school.seats_changed",
  "school.subscription_changed",
  "school_admin.invited",
  "teacher.invited",
  "invite.deleted",
  "membership.activated",
  "membership.deactivated",
  "membership.pending_capacity",
  "classroom.created",
  "classroom.archived",
  "classroom.deleted",
  "classroom.join_code_regenerated",
  "classroom.join_code_disabled",
  "join_request.created",
  "join_request.approved",
  "join_request.rejected",
  "join_request.cancelled",
] as const

// ---------------------------------------------------------------------------
// Zod enums
// ---------------------------------------------------------------------------

export const schoolSubscriptionStatusSchema = z.enum(schoolSubscriptionStatuses)
export const schoolMembershipStatusSchema = z.enum(schoolMembershipStatuses)
export const schoolMembershipRoleSchema = z.enum(schoolMembershipRoles)
export const schoolInviteStatusSchema = z.enum(schoolInviteStatuses)
export const classroomStatusSchema = z.enum(classroomStatuses)
export const classroomJoinRequestStatusSchema = z.enum(
  classroomJoinRequestStatuses
)
export const classroomMembershipStatusSchema = z.enum(
  classroomMembershipStatuses
)
export const classroomJoinSourceSchema = z.enum(classroomJoinSources)
export const classroomStudentInviteStatusSchema = z.enum(
  classroomStudentInviteStatuses
)
export const schoolAuditEventTypeSchema = z.enum(schoolAuditEventTypes)

// ---------------------------------------------------------------------------
// TypeScript types from constants
// ---------------------------------------------------------------------------

export type SchoolSubscriptionStatus =
  (typeof schoolSubscriptionStatuses)[number]
export type SchoolMembershipStatus = (typeof schoolMembershipStatuses)[number]
export type SchoolMembershipRole = (typeof schoolMembershipRoles)[number]
export type SchoolInviteStatus = (typeof schoolInviteStatuses)[number]
export type ClassroomStatus = (typeof classroomStatuses)[number]
export type ClassroomJoinRequestStatus =
  (typeof classroomJoinRequestStatuses)[number]
export type ClassroomMembershipStatus =
  (typeof classroomMembershipStatuses)[number]
export type ClassroomJoinSource = (typeof classroomJoinSources)[number]
export type ClassroomStudentInviteStatus =
  (typeof classroomStudentInviteStatuses)[number]
export type SchoolAuditEventType = (typeof schoolAuditEventTypes)[number]

// ---------------------------------------------------------------------------
// Domain record types
// ---------------------------------------------------------------------------

export type SchoolRecord = {
  id: string
  name: string
  slug: string
  subscription_status: SchoolSubscriptionStatus
  admin_seat_limit: number
  teacher_seat_limit: number
  student_seat_limit: number
  student_overage_allowed_by_learnify: boolean
  student_overage_enabled_by_school: boolean
  renewal_date: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export type SchoolMembershipRecord = {
  id: string
  school_id: string
  user_id: string | null
  role: SchoolMembershipRole
  status: SchoolMembershipStatus
  email_normalized: string
  seat_consumed: boolean
  overage: boolean
  invited_by: string | null
  activated_at: string | null
  deactivated_at: string | null
  created_at: string
  updated_at: string
}

export type SchoolInviteRecord = {
  id: string
  school_id: string
  email: string
  email_normalized: string
  role: SchoolMembershipRole
  token_hash: string
  status: SchoolInviteStatus
  invited_by: string | null
  accepted_by: string | null
  expires_at: string
  accepted_at: string | null
  created_at: string
  updated_at: string
}

export type ClassroomRecord = {
  id: string
  school_id: string
  owner_membership_id: string
  name: string
  slug: string
  subject_label: string
  subject_normalized: string | null
  school_year: string | null
  grade_label: string | null
  status: ClassroomStatus
  join_code: string
  join_token_hash: string
  join_enabled: boolean
  archived_at: string | null
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export type ClassroomJoinRequestRecord = {
  id: string
  school_id: string
  classroom_id: string
  student_user_id: string | null
  student_membership_id: string | null
  email: string | null
  email_normalized: string | null
  source: ClassroomJoinSource
  status: ClassroomJoinRequestStatus
  requested_at: string
  approved_by: string | null
  approved_at: string | null
  rejected_by: string | null
  rejected_at: string | null
  cancelled_at: string | null
  created_at: string
  updated_at: string
}

export type ClassroomMembershipRecord = {
  id: string
  school_id: string
  classroom_id: string
  student_membership_id: string
  student_user_id: string
  status: ClassroomMembershipStatus
  joined_at: string | null
  removed_at: string | null
  removed_by: string | null
  created_at: string
  updated_at: string
}

export type ClassroomStudentInviteRecord = {
  id: string
  school_id: string
  classroom_id: string
  email: string
  email_normalized: string
  token_hash: string
  status: ClassroomStudentInviteStatus
  invited_by: string
  expires_at: string
  accepted_by: string | null
  accepted_at: string | null
  created_at: string
  updated_at: string
}

export type SchoolAuditEventRecord = {
  id: string
  school_id: string
  actor_user_id: string | null
  actor_membership_id: string | null
  event_type: SchoolAuditEventType
  target_type: string
  target_id: string | null
  metadata: Record<string, unknown>
  created_at: string
}

// ---------------------------------------------------------------------------
// API request / response schemas
// ---------------------------------------------------------------------------

// --- Admin: create school ---
export const createSchoolRequestSchema = z.object({
  name: z.string().trim().min(1).max(120),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, or hyphens"),
  adminSeatLimit: z.number().int().min(1).max(20).default(3),
  teacherSeatLimit: z.number().int().min(1),
  studentSeatLimit: z.number().int().min(1),
  studentOverageAllowedByLearnify: z.boolean().default(false),
  renewalDate: z.string().date().optional(),
})

export type CreateSchoolRequest = z.infer<typeof createSchoolRequestSchema>

// --- Admin: send first school admin invite ---
export const sendSchoolAdminInviteRequestSchema = z.object({
  email: z
    .string()
    .trim()
    .email()
    .transform((v) => v.toLowerCase()),
  locale: z.enum(["en", "th"]).default("en"),
})

export type SendSchoolAdminInviteRequest = z.infer<
  typeof sendSchoolAdminInviteRequestSchema
>

// School-level variant: school admins inviting additional admins pass the
// school in the body (the Learnify-admin route takes it from the URL).
export const inviteSchoolAdminRequestSchema =
  sendSchoolAdminInviteRequestSchema.extend({
    schoolId: z.string().uuid(),
  })

export type InviteSchoolAdminRequest = z.infer<
  typeof inviteSchoolAdminRequestSchema
>

// --- School admin: invite teacher ---
export const sendTeacherInviteRequestSchema = z.object({
  schoolId: z.string().uuid(),
  email: z
    .string()
    .trim()
    .email()
    .transform((v) => v.toLowerCase()),
  locale: z.enum(["en", "th"]).default("en"),
})

export type SendTeacherInviteRequest = z.infer<
  typeof sendTeacherInviteRequestSchema
>

// --- Accept invite (school admin / teacher) ---
export const acceptInviteRequestSchema = z.object({
  token: z.string().trim().min(1),
})

export type AcceptInviteRequest = z.infer<typeof acceptInviteRequestSchema>

// --- Delete invite ---
export const deleteInviteRequestSchema = z.object({
  reason: z.string().trim().max(200).optional(),
})

export type DeleteInviteRequest = z.infer<typeof deleteInviteRequestSchema>

// --- Teacher: create classroom ---
export const createClassroomRequestSchema = z.object({
  schoolId: z.string().uuid(),
  name: z.string().trim().min(1).max(120),
  subjectLabel: z.string().trim().min(1).max(120),
  schoolYear: z.string().trim().max(20).optional(),
  gradeLabel: z.string().trim().max(40).optional(),
})

export type CreateClassroomRequest = z.infer<typeof createClassroomRequestSchema>

// --- Student: join by code ---
export const joinByCodeRequestSchema = z.object({
  joinCode: z.string().trim().min(1).max(20),
})

export type JoinByCodeRequest = z.infer<typeof joinByCodeRequestSchema>

// --- Student: join by QR token ---
export const joinByTokenRequestSchema = z.object({
  joinToken: z.string().trim().min(1),
})

export type JoinByTokenRequest = z.infer<typeof joinByTokenRequestSchema>

// --- Teacher: send student email invites (bulk paste) ---
export const sendStudentInvitesRequestSchema = z.object({
  schoolId: z.string().uuid(),
  locale: z.enum(["en", "th"]).default("en"),
  emails: z
    .string()
    .trim()
    .min(1)
    .transform((raw) =>
      raw
        .split(/[\n,]+/)
        .map((e) => e.trim().toLowerCase())
        .filter((e) => e.length > 0)
    )
    .pipe(
      z
        .array(z.string().email("Each entry must be a valid email"))
        .min(1)
        .max(100)
    ),
})

export type SendStudentInvitesRequest = z.infer<
  typeof sendStudentInvitesRequestSchema
>

// --- Teacher: approve join request ---
export const approveJoinRequestSchema = z.object({})
export type ApproveJoinRequest = z.infer<typeof approveJoinRequestSchema>

// --- Teacher: reject join request ---
export const rejectJoinRequestSchema = z.object({
  reason: z.string().trim().max(200).optional(),
})
export type RejectJoinRequest = z.infer<typeof rejectJoinRequestSchema>

// --- Student: cancel join request ---
export const cancelJoinRequestSchema = z.object({})
export type CancelJoinRequest = z.infer<typeof cancelJoinRequestSchema>

// --- Teacher: regenerate join code ---
export const regenerateJoinCodeRequestSchema = z.object({})
export type RegenerateJoinCodeRequest = z.infer<
  typeof regenerateJoinCodeRequestSchema
>

// --- Teacher: disable join code ---
export const disableJoinCodeRequestSchema = z.object({})
export type DisableJoinCodeRequest = z.infer<typeof disableJoinCodeRequestSchema>

// --- Teacher: remove student from classroom ---
export const removeStudentFromClassroomRequestSchema = z.object({})
export type RemoveStudentFromClassroomRequest = z.infer<
  typeof removeStudentFromClassroomRequestSchema
>

// --- School admin: deactivate membership ---
export const deactivateMembershipRequestSchema = z.object({
  reason: z.string().trim().max(200).optional(),
})
export type DeactivateMembershipRequest = z.infer<
  typeof deactivateMembershipRequestSchema
>

// --- School admin: reactivate membership ---
export const reactivateMembershipRequestSchema = z.object({})
export type ReactivateMembershipRequest = z.infer<
  typeof reactivateMembershipRequestSchema
>

// ---------------------------------------------------------------------------
// Seat / capacity helpers used across layers
// ---------------------------------------------------------------------------

export type SchoolSeatSummary = {
  adminSeatLimit: number
  teacherSeatLimit: number
  studentSeatLimit: number
  activeAdmins: number
  activeTeachers: number
  activeStudents: number
  studentOverageAllowedByLearnify: boolean
  studentOverageEnabledBySchool: boolean
  studentOverageCount: number
}
