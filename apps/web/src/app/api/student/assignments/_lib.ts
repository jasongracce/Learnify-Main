import { NextResponse } from "next/server"
import { getStudentAssignmentDetail } from "@learnify/database"
import type {
  StudentAssignmentItemSubmissionRecord,
  StudentAssignmentSubmissionRecord,
  SubmissionVersionRecord,
} from "@learnify/shared"

type SupabaseLike = Parameters<typeof getStudentAssignmentDetail>[0]["supabase"]

export async function requireStudentAssignment(input: {
  supabase: SupabaseLike
  assignmentId: string
  studentUserId: string
}): Promise<{ ok: true } | { response: NextResponse }> {
  const assignment = await getStudentAssignmentDetail(input)

  if (!assignment) {
    return {
      response: NextResponse.json(
        { error: "Assignment not found." },
        { status: 404 }
      ),
    }
  }

  return { ok: true }
}

export function submissionReceipt(input: {
  submission: StudentAssignmentSubmissionRecord
  version: SubmissionVersionRecord
}) {
  return {
    submissionId: input.submission.id,
    assignmentId: input.submission.assignment_id,
    status: input.submission.status,
    submittedAt: input.submission.submitted_at,
    late: input.submission.late,
    score: input.submission.score,
    maxScore: input.submission.max_score,
    versionNumber: input.version.version_number,
  }
}

export function submissionPayload(input: {
  submission: StudentAssignmentSubmissionRecord
  itemSubmissions: StudentAssignmentItemSubmissionRecord[]
  version: SubmissionVersionRecord
}) {
  return {
    submission: input.submission,
    itemSubmissions: input.itemSubmissions,
    receipt: submissionReceipt({
      submission: input.submission,
      version: input.version,
    }),
  }
}
