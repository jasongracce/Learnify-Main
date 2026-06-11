import { createHash, randomBytes } from "crypto"
import type {
  ClassroomJoinRequestStatus,
  SchoolMembershipStatus,
  SchoolSeatSummary,
} from "@learnify/shared"

// ---------------------------------------------------------------------------
// Email normalisation
// ---------------------------------------------------------------------------

export function normalizeInviteEmail(email: string): string {
  return email.trim().toLowerCase()
}

// ---------------------------------------------------------------------------
// Slug generation
// ---------------------------------------------------------------------------

const SLUG_NOISE_BYTES = 3

export function generateClassroomSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 40)

  const noise = randomBytes(SLUG_NOISE_BYTES).toString("hex")
  return `${base}-${noise}`
}

export function generateSchoolSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60)
}

// ---------------------------------------------------------------------------
// Join code generation
// ---------------------------------------------------------------------------

const CODE_CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
const CODE_LENGTH = 6

export function generateJoinCode(): string {
  const bytes = randomBytes(CODE_LENGTH)
  return Array.from(bytes)
    .map((b) => CODE_CHARSET[b % CODE_CHARSET.length])
    .join("")
}

// ---------------------------------------------------------------------------
// Token generation and hashing
// ---------------------------------------------------------------------------

export function generateRawToken(): string {
  return randomBytes(32).toString("hex")
}

export function hashToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex")
}

// ---------------------------------------------------------------------------
// Subject normalisation
// ---------------------------------------------------------------------------

const SUBJECT_MAP: [RegExp, string][] = [
  [/math|calcul|algebra|geometry|trigon|statistic/i, "mathematics"],
  [/physics|mechanic|wave|optic|thermodynam|quantum/i, "physics"],
  [/chemistry|chem|organic|inorganic/i, "chemistry"],
  [/biology|bio|life science|ecology|genetics|cell/i, "biology"],
  [/english|literature|writing|reading|grammar|language arts/i, "english"],
  [/history|social studies|civics|geography|economics/i, "social_studies"],
  [/computer|coding|programming|cs|ict/i, "computer_science"],
  [/art|drawing|painting|design|music|pe|physical education/i, "arts_pe"],
  [/science/i, "general_science"],
]

export function normalizeSubject(subjectLabel: string): string | null {
  const lower = subjectLabel.trim().toLowerCase()

  for (const [pattern, normalized] of SUBJECT_MAP) {
    if (pattern.test(lower)) {
      return normalized
    }
  }

  return null
}

// ---------------------------------------------------------------------------
// Invite expiry
// ---------------------------------------------------------------------------

const INVITE_TTL_DAYS = 14

export function buildInviteExpiresAt(from: Date = new Date()): string {
  const expires = new Date(from)
  expires.setUTCDate(expires.getUTCDate() + INVITE_TTL_DAYS)
  return expires.toISOString()
}

export function isInviteExpired(expiresAt: string, now: Date = new Date()): boolean {
  return new Date(expiresAt) < now
}

// ---------------------------------------------------------------------------
// Seat capacity rules
// ---------------------------------------------------------------------------

export type TeacherCapacityResult =
  | { allowed: true }
  | { allowed: false; reason: "no_teacher_seats" }

export function checkTeacherSeatCapacity(summary: {
  teacherSeatLimit: number
  activeTeachers: number
}): TeacherCapacityResult {
  if (summary.activeTeachers < summary.teacherSeatLimit) {
    return { allowed: true }
  }
  return { allowed: false, reason: "no_teacher_seats" }
}

export type StudentCapacityResult =
  | { allowed: true; overage: false }
  | { allowed: true; overage: true }
  | { allowed: false; reason: "no_student_seats" }

export function checkStudentSeatCapacity(
  summary: Pick<
    SchoolSeatSummary,
    | "studentSeatLimit"
    | "activeStudents"
    | "studentOverageAllowedByLearnify"
    | "studentOverageEnabledBySchool"
  >
): StudentCapacityResult {
  if (summary.activeStudents < summary.studentSeatLimit) {
    return { allowed: true, overage: false }
  }

  if (
    summary.studentOverageAllowedByLearnify &&
    summary.studentOverageEnabledBySchool
  ) {
    return { allowed: true, overage: true }
  }

  return { allowed: false, reason: "no_student_seats" }
}

export type AdminCapacityResult =
  | { allowed: true }
  | { allowed: false; reason: "no_admin_seats" }

export function checkAdminSeatCapacity(summary: {
  adminSeatLimit: number
  activeAdmins: number
}): AdminCapacityResult {
  if (summary.activeAdmins < summary.adminSeatLimit) {
    return { allowed: true }
  }
  return { allowed: false, reason: "no_admin_seats" }
}

// ---------------------------------------------------------------------------
// Membership status transitions
// ---------------------------------------------------------------------------

type MembershipTransitionResult =
  | { nextStatus: SchoolMembershipStatus; consumesSeat: boolean; overage: boolean }
  | { error: string }

export function resolveMembershipActivation(input: {
  currentStatus: SchoolMembershipStatus
  capacityResult: StudentCapacityResult | TeacherCapacityResult | AdminCapacityResult
  role: "school_admin" | "teacher" | "student"
}): MembershipTransitionResult {
  if (
    input.currentStatus !== "invited" &&
    input.currentStatus !== "pending_capacity"
  ) {
    return { error: `Cannot activate membership in status '${input.currentStatus}'.` }
  }

  const cap = input.capacityResult

  if (!cap.allowed) {
    return { nextStatus: "pending_capacity", consumesSeat: false, overage: false }
  }

  const overage = "overage" in cap ? cap.overage : false
  return { nextStatus: "active", consumesSeat: true, overage }
}

export function resolveMembershipDeactivation(input: {
  currentStatus: SchoolMembershipStatus
}): { nextStatus: SchoolMembershipStatus } | { error: string } {
  if (input.currentStatus === "active" || input.currentStatus === "invited") {
    return { nextStatus: "inactive" }
  }
  return { error: `Cannot deactivate membership in status '${input.currentStatus}'.` }
}

export function resolveMembershipReactivation(input: {
  currentStatus: SchoolMembershipStatus
  capacityResult: StudentCapacityResult | TeacherCapacityResult | AdminCapacityResult
}): MembershipTransitionResult {
  if (input.currentStatus !== "inactive") {
    return { error: `Cannot reactivate membership in status '${input.currentStatus}'.` }
  }
  return resolveMembershipActivation({
    currentStatus: "invited",
    capacityResult: input.capacityResult,
    role: "student",
  })
}

// ---------------------------------------------------------------------------
// Classroom join request transitions
// ---------------------------------------------------------------------------

export type JoinRequestTransitionResult =
  | { nextStatus: ClassroomJoinRequestStatus }
  | { error: string }

export function resolveJoinRequestApproval(input: {
  currentStatus: ClassroomJoinRequestStatus
  capacityResult: StudentCapacityResult
}): JoinRequestTransitionResult {
  if (
    input.currentStatus !== "pending_teacher_approval" &&
    input.currentStatus !== "pending_capacity"
  ) {
    return { error: `Cannot approve join request in status '${input.currentStatus}'.` }
  }

  if (!input.capacityResult.allowed) {
    return { nextStatus: "pending_capacity" }
  }

  return { nextStatus: "approved" }
}

export function resolveJoinRequestRejection(input: {
  currentStatus: ClassroomJoinRequestStatus
}): JoinRequestTransitionResult {
  if (
    input.currentStatus !== "pending_teacher_approval" &&
    input.currentStatus !== "pending_capacity"
  ) {
    return { error: `Cannot reject join request in status '${input.currentStatus}'.` }
  }
  return { nextStatus: "rejected" }
}

export function resolveJoinRequestCancellation(input: {
  currentStatus: ClassroomJoinRequestStatus
}): JoinRequestTransitionResult {
  if (
    input.currentStatus !== "pending_teacher_approval" &&
    input.currentStatus !== "pending_capacity"
  ) {
    return { error: `Cannot cancel join request in status '${input.currentStatus}'.` }
  }
  return { nextStatus: "cancelled" }
}

// ---------------------------------------------------------------------------
// Invite acceptance validation
// ---------------------------------------------------------------------------

export type InviteAcceptResult =
  | { valid: true }
  | { valid: false; reason: "expired" | "already_used" | "revoked" | "email_mismatch" }

export function validateInviteAcceptance(input: {
  inviteEmailNormalized: string
  acceptingEmailNormalized: string
  inviteStatus: "pending" | "accepted" | "expired" | "deleted" | "revoked"
  expiresAt: string
  now?: Date
}): InviteAcceptResult {
  if (input.inviteStatus === "accepted") {
    return { valid: false, reason: "already_used" }
  }

  if (input.inviteStatus === "revoked" || input.inviteStatus === "deleted") {
    return { valid: false, reason: "revoked" }
  }

  if (isInviteExpired(input.expiresAt, input.now)) {
    return { valid: false, reason: "expired" }
  }

  if (input.inviteEmailNormalized !== input.acceptingEmailNormalized) {
    return { valid: false, reason: "email_mismatch" }
  }

  return { valid: true }
}
