import { NextResponse } from "next/server"
import { getClassroomById, getTeacherAssignmentDetail } from "@learnify/database"
import type { AssignmentDetail } from "@learnify/database"
import type { ClassroomRecord, SchoolMembershipRecord } from "@learnify/shared"

type SupabaseLike = Parameters<typeof getClassroomById>[0]["supabase"]

export type AssignmentOwnerContext = {
  assignment: AssignmentDetail
  classroom: ClassroomRecord
}

export async function requireOwnedClassroom(input: {
  supabase: SupabaseLike
  classroomId: string
  schoolId: string
  membership: SchoolMembershipRecord
}): Promise<{ classroom: ClassroomRecord } | { response: NextResponse }> {
  const classroom = await getClassroomById({
    supabase: input.supabase,
    classroomId: input.classroomId,
  })

  if (!classroom || classroom.school_id !== input.schoolId) {
    return {
      response: NextResponse.json(
        { error: "Classroom not found." },
        { status: 404 }
      ),
    }
  }

  if (classroom.owner_membership_id !== input.membership.id) {
    return {
      response: NextResponse.json(
        { error: "Only the classroom owner can manage assignments." },
        { status: 403 }
      ),
    }
  }

  return { classroom }
}

export async function requireOwnedAssignment(input: {
  supabase: SupabaseLike
  assignmentId: string
  schoolId: string
  membership: SchoolMembershipRecord
}): Promise<AssignmentOwnerContext | { response: NextResponse }> {
  const assignment = await getTeacherAssignmentDetail({
    supabase: input.supabase,
    assignmentId: input.assignmentId,
  })

  if (!assignment || assignment.assignment.school_id !== input.schoolId) {
    return {
      response: NextResponse.json(
        { error: "Assignment not found." },
        { status: 404 }
      ),
    }
  }

  const classroomCheck = await requireOwnedClassroom({
    supabase: input.supabase,
    classroomId: assignment.assignment.classroom_id,
    schoolId: input.schoolId,
    membership: input.membership,
  })

  if ("response" in classroomCheck) {
    return classroomCheck.response.status === 404
      ? {
          response: NextResponse.json(
            { error: "Assignment not found." },
            { status: 404 }
          ),
        }
      : classroomCheck
  }

  return {
    assignment,
    classroom: classroomCheck.classroom,
  }
}

export function assignmentAuditMetadata(input: {
  classroomId: string
  assignmentType: string
  status: string
  recipientCount?: number
}) {
  return {
    classroomId: input.classroomId,
    assignmentType: input.assignmentType,
    status: input.status,
    ...(input.recipientCount != null
      ? { recipientCount: input.recipientCount }
      : {}),
  }
}
