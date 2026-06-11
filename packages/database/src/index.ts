import {
  createClient,
  type SupabaseClient as SupabaseJsClient,
} from "@supabase/supabase-js"
import type {
  ConfidenceLevel,
  Locale,
  LumiMessage,
  LumiMessageRole,
  WaitlistSignupInput,
} from "@learnify/shared"
import {
  calculateLessonProgress,
  normalizeEmail,
  resolveWaitlistAccess,
  updateSkillMastery,
} from "@learnify/core"

export type SupabaseClient = SupabaseJsClient<any>

export type SupabaseServerEnv = Record<string, string | undefined> & {
  NEXT_PUBLIC_SUPABASE_URL?: string
  SUPABASE_SERVICE_ROLE_KEY?: string
}

export type WaitlistSignupRecord = {
  id: string
  email: string
  response_id: string | null
  created_at: string
}

export type LessonRecord = {
  id: string
  slug: string
  status: "draft" | "in_review" | "approved" | "published"
}

export type LessonBlockRecord = {
  id: string
  slug: string
  lesson_id: string
  type:
    | "text"
    | "visual"
    | "simulation"
    | "multiple_choice"
    | "lumi_hint"
    | "reflection"
    | "next_lesson"
  content_json: Record<string, unknown>
}

export type QuestionRecord = {
  id: string
  slug: string
  lesson_id: string
  skill_id: string | null
  correct_answer: unknown
}

export type LessonBlockProgressRecord = {
  id: string
  user_id: string
  lesson_id: string
  block_id: string
  status: "not_started" | "in_progress" | "completed"
  completed_at: string | null
  updated_at: string
}

export type LessonProgressRecord = {
  id: string
  user_id: string
  lesson_id: string
  status: "not_started" | "in_progress" | "completed"
  progress_percent: number
  completed_at: string | null
  updated_at: string
}

export type QuestionAttemptRecord = {
  id: string
  user_id: string
  lesson_id: string
  block_id: string
  question_id: string
  selected_answer: unknown
  is_correct: boolean
  attempt_number: number
  time_spent_seconds: number | null
  created_at: string
}

export type StudentSkillMasteryRecord = {
  id: string
  user_id: string
  skill_id: string
  mastery_score: number
  confidence_level: ConfidenceLevel
  last_practiced_at: string | null
  updated_at: string
}

export type LumiConversationRecord = {
  id: string
  user_id: string
  lesson_id: string | null
  course_id: string | null
  language: Locale
  title: string | null
  created_at: string
}

export type LumiMessageRecord = {
  id: string
  conversation_id: string
  role: LumiMessageRole
  message: string
  retrieved_context_ids: unknown
  created_at: string
}

export type RagDocumentRecord = {
  id: string
  title: string
  subject: string | null
  grade_level: string | null
  language: Locale
  source_type: string | null
  source_url: string | null
  status: "uploaded" | "processing" | "processed" | "failed" | "archived"
  verified: boolean
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export type RagChunkRecord = {
  id: string
  document_id: string
  chunk_index: number
  content: string
  metadata: Record<string, unknown>
  verified: boolean
  created_at: string
  updated_at: string
  rag_documents?: RagDocumentRecord | RagDocumentRecord[] | null
}

type RagChunkVectorMatchRecord = {
  id: string
  document_id: string
  document_title: string
  content: string
  locale: Locale
  subject: string | null
  source_type: string | null
  source_url: string | null
  chunk_index: number
  metadata: Record<string, unknown>
  score: number
  created_at: string
}

export type RetrievedRagChunk = {
  id: string
  documentId: string
  documentTitle: string
  content: string
  locale: Locale
  subject: string | null
  sourceType: string | null
  sourceUrl: string | null
  chunkIndex: number
  metadata: Record<string, unknown>
  score: number
  createdAt: string
}

export type RetrieveVerifiedRagChunksInput = {
  supabase: SupabaseClient
  locale: Locale
  query?: string
  subject?: string
  lessonSlug?: string
  courseSlug?: string
  limit?: number
  embedding?: number[]
}

export type ConsumeRateLimitInput = {
  supabase: SupabaseClient
  key: string
  namespace: string
  limit: number
  windowSeconds: number
}

export type RateLimitResult = {
  allowed: boolean
  limit: number
  remaining: number
  resetAtMs: number
  retryAfterSeconds: number
}

type RateLimitRpcRecord = {
  allowed: boolean
  limit_value: number
  remaining: number
  reset_at: string
  retry_after_seconds: number
}

export type LessonProgressSummary = {
  lessonId: string
  lessonSlug: string
  status: "not_started" | "in_progress" | "completed"
  progressPercent: number
  updatedAt: string
}

export type StudentSkillMasterySummary = {
  skillId: string
  skillSlug: string
  masteryScore: number
  confidenceLevel: ConfidenceLevel
  updatedAt: string
}

export type QuestionAttemptSummary = {
  id: string
  lessonId: string
  lessonSlug: string
  questionId: string
  isCorrect: boolean
  attemptNumber: number
  createdAt: string
}

export function getSupabaseServerConfig(env: SupabaseServerEnv) {
  const url = env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    return {
      configured: false as const,
      missing: [
        !url ? "NEXT_PUBLIC_SUPABASE_URL" : null,
        !serviceRoleKey ? "SUPABASE_SERVICE_ROLE_KEY" : null,
      ].filter(Boolean) as string[],
    }
  }

  return {
    configured: true as const,
    url,
    serviceRoleKey,
  }
}

export function createSupabaseBrowserClient(input: {
  url: string
  anonKey: string
}) {
  return createClient<any>(input.url, input.anonKey)
}

export function createSupabaseServiceClient(input: {
  url: string
  serviceRoleKey: string
}) {
  return createClient<any>(input.url, input.serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

export function createSupabaseServiceClientFromEnv(env: SupabaseServerEnv) {
  const config = getSupabaseServerConfig(env)

  if (!config.configured) {
    throw new Error(`Missing Supabase env: ${config.missing.join(", ")}`)
  }

  return createSupabaseServiceClient({
    url: config.url,
    serviceRoleKey: config.serviceRoleKey,
  })
}

export async function upsertWaitlistSignup(input: {
  supabase: SupabaseClient
  signup: WaitlistSignupInput
}) {
  const normalizedEmail = normalizeEmail(input.signup.email)
  const { data: existing, error: existingError } = await input.supabase
    .from("beta_signups")
    .select("id,email,response_id,created_at")
    .eq("email_normalized", normalizedEmail)
    .maybeSingle<WaitlistSignupRecord>()

  if (existingError) {
    throw new Error(existingError.message)
  }

  if (existing) {
    return existing
  }

  const { data, error } = await input.supabase
    .from("beta_signups")
    .insert({
      email: normalizedEmail,
      email_normalized: normalizedEmail,
      response_id: null,
    })
    .select("id,email,response_id,created_at")
    .single<WaitlistSignupRecord>()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function getWaitlistAccessByEmail(input: {
  supabase: SupabaseClient
  email: string
}) {
  const normalizedEmail = normalizeEmail(input.email)
  const { data, error } = await input.supabase
    .from("beta_signups")
    .select("id")
    .eq("email_normalized", normalizedEmail)
    .maybeSingle<{ id: string }>()

  if (error) {
    throw new Error(error.message)
  }

  return resolveWaitlistAccess({
    exists: Boolean(data),
    betaAccess: Boolean(data),
  })
}

export async function upsertStudentProfile(input: {
  supabase: SupabaseClient
  userId: string
  locale: Locale
}) {
  const { data, error } = await input.supabase
    .from("profiles")
    .upsert(
      {
        id: input.userId,
        role: "student",
        language_preference: input.locale,
      },
      {
        onConflict: "id",
      }
    )
    .select("id,role,language_preference")
    .single<{
      id: string
      role: "student" | "teacher" | "admin"
      language_preference: Locale
    }>()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function checkSupabaseWaitlistTable(input: {
  supabase: SupabaseClient
}) {
  const { error, count } = await input.supabase
    .from("beta_signups")
    .select("id", { count: "exact", head: true })

  if (error) {
    throw new Error(error.message)
  }

  return {
    reachable: true,
    waitlistCount: count ?? 0,
  }
}

export * from "./classrooms"

export async function consumeRateLimit(
  input: ConsumeRateLimitInput
): Promise<RateLimitResult> {
  const key = input.key.trim()
  const namespace = input.namespace.trim()
  const limit = toPositiveInteger(input.limit, "Rate limit")
  const windowSeconds = toPositiveInteger(
    input.windowSeconds,
    "Rate limit window"
  )

  if (!key || !namespace) {
    throw new Error("Rate limit key and namespace are required.")
  }

  const { data, error } = await input.supabase
    .rpc("consume_rate_limit", {
      rate_limit_key: key,
      rate_limit_namespace: namespace,
      max_attempts: limit,
      window_seconds: windowSeconds,
    })
    .returns<RateLimitRpcRecord[]>()

  if (error) {
    throw new Error(`Rate limit check failed: ${error.message}`)
  }

  const record = Array.isArray(data) ? data[0] : null

  if (!record) {
    throw new Error("Rate limit check failed: no limiter status returned.")
  }

  const resetAtMs = Date.parse(record.reset_at)

  if (!Number.isFinite(resetAtMs)) {
    throw new Error("Rate limit check failed: invalid reset time returned.")
  }

  return {
    allowed: Boolean(record.allowed),
    limit: Number(record.limit_value),
    remaining: Math.max(Number(record.remaining), 0),
    resetAtMs,
    retryAfterSeconds: Math.max(Number(record.retry_after_seconds), 0),
  }
}

export async function getPublishedLessonBySlug(input: {
  supabase: SupabaseClient
  lessonSlug: string
}) {
  const { data, error } = await input.supabase
    .from("lessons")
    .select("id,slug,status")
    .eq("slug", input.lessonSlug)
    .eq("status", "published")
    .maybeSingle<LessonRecord>()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function getLessonBlockBySlug(input: {
  supabase: SupabaseClient
  lessonId: string
  blockSlug: string
}) {
  const { data, error } = await input.supabase
    .from("lesson_blocks")
    .select("id,slug,lesson_id,type,content_json")
    .eq("lesson_id", input.lessonId)
    .eq("slug", input.blockSlug)
    .maybeSingle<LessonBlockRecord>()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function getQuestionForLesson(input: {
  supabase: SupabaseClient
  lessonId: string
  questionSlugOrId: string
}) {
  const { data, error } = await input.supabase
    .from("questions")
    .select("id,slug,lesson_id,skill_id,correct_answer")
    .eq("lesson_id", input.lessonId)
    .returns<QuestionRecord[]>()

  if (error) {
    throw new Error(error.message)
  }

  const exactMatch = data.find(
    (question) =>
      question.id === input.questionSlugOrId ||
      question.slug === input.questionSlugOrId
  )

  if (exactMatch) {
    return exactMatch
  }

  return null
}

export async function getNextQuestionAttemptNumber(input: {
  supabase: SupabaseClient
  userId: string
  blockId: string
  questionId: string
}) {
  const { data, error } = await input.supabase
    .from("question_attempts")
    .select("attempt_number")
    .eq("user_id", input.userId)
    .eq("block_id", input.blockId)
    .eq("question_id", input.questionId)
    .order("attempt_number", { ascending: false })
    .limit(1)
    .maybeSingle<{ attempt_number: number }>()

  if (error) {
    throw new Error(error.message)
  }

  return (data?.attempt_number ?? 0) + 1
}

export async function updateLessonProgressRollup(input: {
  supabase: SupabaseClient
  userId: string
  lessonId: string
}) {
  const { count: totalBlocks, error: totalError } = await input.supabase
    .from("lesson_blocks")
    .select("id", { count: "exact", head: true })
    .eq("lesson_id", input.lessonId)

  if (totalError) {
    throw new Error(totalError.message)
  }

  const { count: completedBlocks, error: completedError } = await input.supabase
    .from("lesson_block_progress")
    .select("id", { count: "exact", head: true })
    .eq("user_id", input.userId)
    .eq("lesson_id", input.lessonId)
    .eq("status", "completed")

  if (completedError) {
    throw new Error(completedError.message)
  }

  const progressPercent = calculateLessonProgress({
    completedBlocks: completedBlocks ?? 0,
    totalBlocks: totalBlocks ?? 0,
  })
  const status =
    progressPercent === 100
      ? "completed"
      : progressPercent > 0
        ? "in_progress"
        : "not_started"
  const completedAt = status === "completed" ? new Date().toISOString() : null

  const { data, error } = await input.supabase
    .from("lesson_progress")
    .upsert(
      {
        user_id: input.userId,
        lesson_id: input.lessonId,
        status,
        progress_percent: progressPercent,
        completed_at: completedAt,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id,lesson_id",
      }
    )
    .select(
      "id,user_id,lesson_id,status,progress_percent,completed_at,updated_at"
    )
    .single<LessonProgressRecord>()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function completeLessonBlock(input: {
  supabase: SupabaseClient
  userId: string
  lessonSlug: string
  blockSlug: string
}) {
  return completeLessonBlockForProgress({
    ...input,
    allowQuestionBlockCompletion: false,
  })
}

async function completeLessonBlockForProgress(input: {
  supabase: SupabaseClient
  userId: string
  lessonSlug: string
  blockSlug: string
  allowQuestionBlockCompletion: boolean
}) {
  const lesson = await getPublishedLessonBySlug({
    supabase: input.supabase,
    lessonSlug: input.lessonSlug,
  })

  if (!lesson) {
    throw new Error("Published lesson not found.")
  }

  const block = await getLessonBlockBySlug({
    supabase: input.supabase,
    lessonId: lesson.id,
    blockSlug: input.blockSlug,
  })

  if (!block) {
    throw new Error("Lesson block not found.")
  }

  if (block.type === "multiple_choice" && !input.allowQuestionBlockCompletion) {
    throw new Error(
      "Question blocks must be completed through question attempts."
    )
  }

  const now = new Date().toISOString()
  const { data, error } = await input.supabase
    .from("lesson_block_progress")
    .upsert(
      {
        user_id: input.userId,
        lesson_id: lesson.id,
        block_id: block.id,
        status: "completed",
        completed_at: now,
        updated_at: now,
      },
      {
        onConflict: "user_id,block_id",
      }
    )
    .select("id,user_id,lesson_id,block_id,status,completed_at,updated_at")
    .single<LessonBlockProgressRecord>()

  if (error) {
    throw new Error(error.message)
  }

  const lessonProgress = await updateLessonProgressRollup({
    supabase: input.supabase,
    userId: input.userId,
    lessonId: lesson.id,
  })

  return {
    blockProgress: data,
    lessonProgress,
  }
}

export async function upsertStudentSkillMasteryFromAttempt(input: {
  supabase: SupabaseClient
  userId: string
  skillId: string
  isCorrect: boolean
  attemptNumber: number
}) {
  const { data: current, error: currentError } = await input.supabase
    .from("student_skill_mastery")
    .select(
      "id,user_id,skill_id,mastery_score,confidence_level,last_practiced_at,updated_at"
    )
    .eq("user_id", input.userId)
    .eq("skill_id", input.skillId)
    .maybeSingle<StudentSkillMasteryRecord>()

  if (currentError) {
    throw new Error(currentError.message)
  }

  const next = updateSkillMastery({
    current: current
      ? {
          skillId: current.skill_id,
          masteryScore: Number(current.mastery_score),
          confidenceLevel: current.confidence_level,
          attempts: 0,
          correctAttempts: 0,
        }
      : undefined,
    skillId: input.skillId,
    isCorrect: input.isCorrect,
    attemptNumber: input.attemptNumber,
  })
  const now = new Date().toISOString()

  const { data, error } = await input.supabase
    .from("student_skill_mastery")
    .upsert(
      {
        user_id: input.userId,
        skill_id: input.skillId,
        mastery_score: next.masteryScore,
        confidence_level: next.confidenceLevel,
        last_practiced_at: now,
        updated_at: now,
      },
      {
        onConflict: "user_id,skill_id",
      }
    )
    .select(
      "id,user_id,skill_id,mastery_score,confidence_level,last_practiced_at,updated_at"
    )
    .single<StudentSkillMasteryRecord>()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function recordQuestionAttempt(input: {
  supabase: SupabaseClient
  userId: string
  lessonSlug: string
  blockSlug: string
  questionSlugOrId: string
  selectedAnswer: unknown
  isCorrect: boolean
  timeSpentSeconds?: number
}) {
  const lesson = await getPublishedLessonBySlug({
    supabase: input.supabase,
    lessonSlug: input.lessonSlug,
  })

  if (!lesson) {
    throw new Error("Published lesson not found.")
  }

  const block = await getLessonBlockBySlug({
    supabase: input.supabase,
    lessonId: lesson.id,
    blockSlug: input.blockSlug,
  })

  if (!block) {
    throw new Error("Lesson block not found.")
  }

  const question = await getQuestionForLesson({
    supabase: input.supabase,
    lessonId: lesson.id,
    questionSlugOrId: input.questionSlugOrId,
  })

  if (!question) {
    throw new Error("Question not found.")
  }

  const attemptNumber = await getNextQuestionAttemptNumber({
    supabase: input.supabase,
    userId: input.userId,
    blockId: block.id,
    questionId: question.id,
  })

  const { data, error } = await input.supabase
    .from("question_attempts")
    .insert({
      user_id: input.userId,
      lesson_id: lesson.id,
      block_id: block.id,
      question_id: question.id,
      selected_answer: input.selectedAnswer,
      is_correct: input.isCorrect,
      attempt_number: attemptNumber,
      time_spent_seconds: input.timeSpentSeconds ?? null,
    })
    .select(
      "id,user_id,lesson_id,block_id,question_id,selected_answer,is_correct,attempt_number,time_spent_seconds,created_at"
    )
    .single<QuestionAttemptRecord>()

  if (error) {
    throw new Error(error.message)
  }

  const skillMastery = question.skill_id
    ? await upsertStudentSkillMasteryFromAttempt({
        supabase: input.supabase,
        userId: input.userId,
        skillId: question.skill_id,
        isCorrect: input.isCorrect,
        attemptNumber,
      })
    : null

  const completion = input.isCorrect
    ? await completeLessonBlockForProgress({
        supabase: input.supabase,
        userId: input.userId,
        lessonSlug: input.lessonSlug,
        blockSlug: input.blockSlug,
        allowQuestionBlockCompletion: true,
      })
    : null

  return {
    attempt: data,
    skillMastery,
    blockProgress: completion?.blockProgress ?? null,
    lessonProgress:
      completion?.lessonProgress ??
      (await updateLessonProgressRollup({
        supabase: input.supabase,
        userId: input.userId,
        lessonId: lesson.id,
      })),
  }
}

function getJoinedSlug(record: unknown, key: string) {
  if (!record || typeof record !== "object") {
    return null
  }

  const value = (record as Record<string, unknown>)[key]
  const joined = Array.isArray(value) ? value[0] : value

  if (!joined || typeof joined !== "object") {
    return null
  }

  const slug = (joined as Record<string, unknown>).slug

  return typeof slug === "string" ? slug : null
}

export async function getLessonProgressForUser(input: {
  supabase: SupabaseClient
  userId: string
}) {
  const { data, error } = await input.supabase
    .from("lesson_progress")
    .select(
      "lesson_id,status,progress_percent,updated_at,lessons!inner(slug,status)"
    )
    .eq("user_id", input.userId)
    .order("updated_at", { ascending: false })
    .returns<
      {
        lesson_id: string
        status: "not_started" | "in_progress" | "completed"
        progress_percent: number
        updated_at: string
      }[]
    >()

  if (error) {
    throw new Error(error.message)
  }

  return data
    .map((record) => {
      const lessonSlug = getJoinedSlug(record, "lessons")

      if (!lessonSlug) {
        return null
      }

      return {
        lessonId: record.lesson_id,
        lessonSlug,
        status: record.status,
        progressPercent: Number(record.progress_percent),
        updatedAt: record.updated_at,
      } satisfies LessonProgressSummary
    })
    .filter((record): record is LessonProgressSummary => Boolean(record))
}

export async function getCompletedLessonBlockSlugsForUser(input: {
  supabase: SupabaseClient
  userId: string
  lessonSlug: string
}) {
  const lesson = await getPublishedLessonBySlug({
    supabase: input.supabase,
    lessonSlug: input.lessonSlug,
  })

  if (!lesson) {
    return []
  }

  const { data: blocks, error: blocksError } = await input.supabase
    .from("lesson_blocks")
    .select("id,slug")
    .eq("lesson_id", lesson.id)
    .returns<{ id: string; slug: string }[]>()

  if (blocksError) {
    throw new Error(blocksError.message)
  }

  if (blocks.length === 0) {
    return []
  }

  const slugByBlockId = new Map(blocks.map((block) => [block.id, block.slug]))
  const { data: progress, error: progressError } = await input.supabase
    .from("lesson_block_progress")
    .select("block_id")
    .eq("user_id", input.userId)
    .eq("lesson_id", lesson.id)
    .eq("status", "completed")
    .in(
      "block_id",
      blocks.map((block) => block.id)
    )
    .returns<{ block_id: string }[]>()

  if (progressError) {
    throw new Error(progressError.message)
  }

  return progress
    .map((record) => slugByBlockId.get(record.block_id))
    .filter((slug): slug is string => Boolean(slug))
}

export async function getStudentSkillMasteryForUser(input: {
  supabase: SupabaseClient
  userId: string
}) {
  const { data, error } = await input.supabase
    .from("student_skill_mastery")
    .select(
      "skill_id,mastery_score,confidence_level,updated_at,skills!inner(slug)"
    )
    .eq("user_id", input.userId)
    .order("mastery_score", { ascending: true })
    .returns<
      {
        skill_id: string
        mastery_score: number
        confidence_level: ConfidenceLevel
        updated_at: string
      }[]
    >()

  if (error) {
    throw new Error(error.message)
  }

  return data
    .map((record) => {
      const skillSlug = getJoinedSlug(record, "skills")

      if (!skillSlug) {
        return null
      }

      return {
        skillId: record.skill_id,
        skillSlug,
        masteryScore: Number(record.mastery_score),
        confidenceLevel: record.confidence_level,
        updatedAt: record.updated_at,
      } satisfies StudentSkillMasterySummary
    })
    .filter((record): record is StudentSkillMasterySummary => Boolean(record))
}

export async function getRecentQuestionAttemptsForUser(input: {
  supabase: SupabaseClient
  userId: string
  limit?: number
}) {
  const { data, error } = await input.supabase
    .from("question_attempts")
    .select(
      "id,lesson_id,question_id,is_correct,attempt_number,created_at,lessons!inner(slug)"
    )
    .eq("user_id", input.userId)
    .order("created_at", { ascending: false })
    .limit(input.limit ?? 5)
    .returns<
      {
        id: string
        lesson_id: string
        question_id: string
        is_correct: boolean
        attempt_number: number
        created_at: string
      }[]
    >()

  if (error) {
    throw new Error(error.message)
  }

  return data
    .map((record) => {
      const lessonSlug = getJoinedSlug(record, "lessons")

      if (!lessonSlug) {
        return null
      }

      return {
        id: record.id,
        lessonId: record.lesson_id,
        lessonSlug,
        questionId: record.question_id,
        isCorrect: record.is_correct,
        attemptNumber: record.attempt_number,
        createdAt: record.created_at,
      } satisfies QuestionAttemptSummary
    })
    .filter((record): record is QuestionAttemptSummary => Boolean(record))
}

export async function retrieveVerifiedRagChunks(
  input: RetrieveVerifiedRagChunksInput
): Promise<RetrievedRagChunk[]> {
  const limit = clampRetrievalLimit(input.limit)
  const candidateLimit = Math.min(Math.max(limit * 4, 20), 100)
  const query = normalizeRetrievalQuery(input.query)

  if (input.embedding && input.embedding.length > 0) {
    try {
      const vectorMatches = await retrieveVerifiedRagChunksByVector({
        ...input,
        limit,
        embedding: input.embedding,
      })

      if (vectorMatches.length > 0) {
        return vectorMatches
      }
    } catch {
      // Keyword retrieval remains the production fallback until embeddings are complete.
    }
  }

  const [contentMatches, titleMatches] = await Promise.all([
    fetchVerifiedRagChunkCandidates({
      ...input,
      limit: candidateLimit,
    }),
    query
      ? fetchVerifiedRagChunksByDocumentTitle({
          ...input,
          limit: candidateLimit,
          titleQuery: query,
        })
      : Promise.resolve([]),
  ])

  const merged = new Map<string, RetrievedRagChunk>()

  for (const chunk of [...contentMatches, ...titleMatches]) {
    const existing = merged.get(chunk.id)

    if (!existing || chunk.score > existing.score) {
      merged.set(chunk.id, chunk)
    }
  }

  return [...merged.values()]
    .map((chunk) => ({
      ...chunk,
      score: scoreRetrievedRagChunk(chunk, query),
    }))
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score
      }

      return left.chunkIndex - right.chunkIndex
    })
    .slice(0, limit)
}

export async function retrieveVerifiedRagChunksByVector(input: {
  supabase: SupabaseClient
  locale: Locale
  subject?: string
  lessonSlug?: string
  courseSlug?: string
  limit?: number
  embedding: number[]
}): Promise<RetrievedRagChunk[]> {
  const { data, error } = await input.supabase
    .rpc("match_verified_rag_chunks", {
      query_embedding: input.embedding,
      match_locale: input.locale,
      match_subject: input.subject ?? null,
      match_course_slug: input.courseSlug ?? null,
      match_lesson_slug: input.lessonSlug ?? null,
      match_count: clampRetrievalLimit(input.limit),
    })
    .returns<RagChunkVectorMatchRecord[]>()

  if (error) {
    throw new Error(error.message)
  }

  if (!Array.isArray(data)) {
    return []
  }

  return data.map(mapRagChunkVectorMatchRecord).filter(isRetrievedRagChunk)
}

async function fetchVerifiedRagChunkCandidates(input: {
  supabase: SupabaseClient
  locale: Locale
  subject?: string
  lessonSlug?: string
  courseSlug?: string
  limit: number
}) {
  const { data, error } = await baseVerifiedRagChunkQuery(input.supabase, input)
    .order("chunk_index", { ascending: true })
    .limit(input.limit)
    .returns<RagChunkRecord[]>()

  if (error) {
    throw new Error(error.message)
  }

  return data.map(mapRagChunkRecord).filter(isRetrievedRagChunk)
}

async function fetchVerifiedRagChunksByDocumentTitle(input: {
  supabase: SupabaseClient
  locale: Locale
  subject?: string
  lessonSlug?: string
  courseSlug?: string
  limit: number
  titleQuery: string
}) {
  let documentQuery = input.supabase
    .from("rag_documents")
    .select("id")
    .eq("language", input.locale)
    .eq("status", "processed")
    .eq("verified", true)
    .ilike("title", toIlikePattern(input.titleQuery))
    .limit(25)

  if (input.subject) {
    documentQuery = documentQuery.eq("subject", input.subject)
  }

  if (input.lessonSlug) {
    documentQuery = documentQuery.contains("metadata", {
      lesson_slug: input.lessonSlug,
    })
  }

  if (input.courseSlug) {
    documentQuery = documentQuery.contains("metadata", {
      course_slug: input.courseSlug,
    })
  }

  const { data: documents, error: documentError } =
    await documentQuery.returns<{ id: string }[]>()

  if (documentError) {
    throw new Error(documentError.message)
  }

  if (documents.length === 0) {
    return []
  }

  const { data, error } = await baseVerifiedRagChunkQuery(input.supabase, input)
    .in(
      "document_id",
      documents.map((document) => document.id)
    )
    .order("chunk_index", { ascending: true })
    .limit(input.limit)
    .returns<RagChunkRecord[]>()

  if (error) {
    throw new Error(error.message)
  }

  return data.map(mapRagChunkRecord).filter(isRetrievedRagChunk)
}

function baseVerifiedRagChunkQuery(
  supabase: SupabaseClient,
  input: {
    locale: Locale
    subject?: string
    lessonSlug?: string
    courseSlug?: string
  }
) {
  let query = supabase
    .from("rag_chunks")
    .select(
      [
        "id",
        "document_id",
        "chunk_index",
        "content",
        "metadata",
        "verified",
        "created_at",
        "updated_at",
        "rag_documents!inner(id,title,subject,grade_level,language,source_type,source_url,status,verified,metadata,created_at,updated_at)",
      ].join(",")
    )
    .eq("verified", true)
    .eq("rag_documents.language", input.locale)
    .eq("rag_documents.status", "processed")
    .eq("rag_documents.verified", true)

  if (input.subject) {
    query = query.eq("rag_documents.subject", input.subject)
  }

  if (input.lessonSlug) {
    query = query.contains("metadata", {
      lesson_slug: input.lessonSlug,
    })
  }

  if (input.courseSlug) {
    query = query.contains("metadata", {
      course_slug: input.courseSlug,
    })
  }

  return query
}

function mapRagChunkRecord(record: RagChunkRecord) {
  const document = getJoinedRagDocument(record.rag_documents)

  if (!document) {
    return null
  }

  return {
    id: record.id,
    documentId: record.document_id,
    documentTitle: document.title,
    content: record.content,
    locale: document.language,
    subject: document.subject,
    sourceType: document.source_type,
    sourceUrl: document.source_url,
    chunkIndex: Number(record.chunk_index),
    metadata: normalizeJsonObject(record.metadata),
    score: 0,
    createdAt: record.created_at,
  } satisfies RetrievedRagChunk
}

function mapRagChunkVectorMatchRecord(record: RagChunkVectorMatchRecord) {
  return {
    id: record.id,
    documentId: record.document_id,
    documentTitle: record.document_title,
    content: record.content,
    locale: record.locale,
    subject: record.subject,
    sourceType: record.source_type,
    sourceUrl: record.source_url,
    chunkIndex: Number(record.chunk_index),
    metadata: normalizeJsonObject(record.metadata),
    score: Number(record.score),
    createdAt: record.created_at,
  } satisfies RetrievedRagChunk
}

function getJoinedRagDocument(
  value: RagChunkRecord["rag_documents"]
): RagDocumentRecord | null {
  const document = Array.isArray(value) ? value[0] : value

  return document ?? null
}

function scoreRetrievedRagChunk(
  chunk: RetrievedRagChunk,
  query: string | undefined
) {
  if (!query) {
    return 1
  }

  const normalizedQuery = query.toLowerCase()
  const content = chunk.content.toLowerCase()
  const title = chunk.documentTitle.toLowerCase()
  const metadata = JSON.stringify(chunk.metadata).toLowerCase()
  let score = 0

  if (title.includes(normalizedQuery)) {
    score += 4
  }

  if (content.includes(normalizedQuery)) {
    score += 3
  }

  if (metadata.includes(normalizedQuery)) {
    score += 1
  }

  for (const token of normalizedQuery.split(/\s+/).filter(Boolean)) {
    if (title.includes(token)) {
      score += 2
    }

    if (content.includes(token)) {
      score += 1
    }
  }

  return score
}

function isRetrievedRagChunk(
  value: RetrievedRagChunk | null
): value is RetrievedRagChunk {
  return Boolean(value)
}

function normalizeRetrievalQuery(query?: string) {
  const normalized = query?.trim().replace(/\s+/g, " ")

  return normalized ? normalized.slice(0, 160) : undefined
}

function toIlikePattern(query: string) {
  return `%${query.replaceAll("\\", "\\\\").replaceAll("%", "\\%").replaceAll("_", "\\_")}%`
}

function clampRetrievalLimit(limit?: number) {
  if (!Number.isFinite(limit)) {
    return 6
  }

  return Math.min(Math.max(Math.trunc(limit ?? 6), 1), 20)
}

function toPositiveInteger(value: number, label: string) {
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${label} must be a positive integer.`)
  }

  return value
}

function normalizeJsonObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {}
  }

  return value as Record<string, unknown>
}

export async function getOrCreateLumiConversation(input: {
  supabase: SupabaseClient
  userId: string
  locale: Locale
  conversationId?: string
  currentLessonSlug?: string
  titleSource?: string
}) {
  if (input.conversationId) {
    const { data, error } = await input.supabase
      .from("lumi_conversations")
      .select("id,user_id,lesson_id,course_id,language,title,created_at")
      .eq("id", input.conversationId)
      .eq("user_id", input.userId)
      .maybeSingle<LumiConversationRecord>()

    if (error) {
      throw new Error(error.message)
    }

    if (data) {
      return data
    }
  }

  const lesson = input.currentLessonSlug
    ? await getPublishedLessonBySlug({
        supabase: input.supabase,
        lessonSlug: input.currentLessonSlug,
      })
    : null
  const course = await getPublishedCourseBySlug({
    supabase: input.supabase,
    courseSlug: "physics-foundations",
  })
  const title = buildLumiConversationTitle(input.titleSource)

  const { data, error } = await input.supabase
    .from("lumi_conversations")
    .insert({
      user_id: input.userId,
      lesson_id: lesson?.id ?? null,
      course_id: course?.id ?? null,
      language: input.locale,
      title,
    })
    .select("id,user_id,lesson_id,course_id,language,title,created_at")
    .single<LumiConversationRecord>()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function insertLumiMessage(input: {
  supabase: SupabaseClient
  conversationId: string
  role: LumiMessageRole
  message: string
  retrievedContextIds?: unknown
}) {
  const { data, error } = await input.supabase
    .from("lumi_messages")
    .insert({
      conversation_id: input.conversationId,
      role: input.role,
      message: input.message,
      retrieved_context_ids: input.retrievedContextIds ?? null,
    })
    .select("id,conversation_id,role,message,retrieved_context_ids,created_at")
    .single<LumiMessageRecord>()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function getRecentLumiMessagesForUser(input: {
  supabase: SupabaseClient
  userId: string
  limit?: number
  currentLessonSlug?: string
}) {
  const lesson = input.currentLessonSlug
    ? await getPublishedLessonBySlug({
        supabase: input.supabase,
        lessonSlug: input.currentLessonSlug,
      })
    : null

  if (input.currentLessonSlug && !lesson) {
    return {
      conversationId: null,
      messages: [] as LumiMessage[],
    }
  }

  let conversationQuery = input.supabase
    .from("lumi_conversations")
    .select("id")
    .eq("user_id", input.userId)
    .order("created_at", { ascending: false })
    .limit(1)

  if (lesson) {
    conversationQuery = conversationQuery.eq("lesson_id", lesson.id)
  }

  const { data: conversation, error: conversationError } =
    await conversationQuery.maybeSingle<{ id: string }>()

  if (conversationError) {
    throw new Error(conversationError.message)
  }

  if (!conversation) {
    return {
      conversationId: null,
      messages: [] as LumiMessage[],
    }
  }

  const { data, error } = await input.supabase
    .from("lumi_messages")
    .select("id,conversation_id,role,message,created_at")
    .eq("conversation_id", conversation.id)
    .order("created_at", { ascending: false })
    .limit(input.limit ?? 20)
    .returns<
      {
        id: string
        conversation_id: string
        role: LumiMessageRole
        message: string
        created_at: string
      }[]
    >()

  if (error) {
    throw new Error(error.message)
  }

  return {
    conversationId: conversation.id,
    messages: data
      .map((record) => ({
        id: record.id,
        conversationId: record.conversation_id,
        role: record.role,
        message: record.message,
        createdAt: record.created_at,
      }))
      .reverse(),
  }
}

async function getPublishedCourseBySlug(input: {
  supabase: SupabaseClient
  courseSlug: string
}) {
  const { data, error } = await input.supabase
    .from("courses")
    .select("id,slug,status")
    .eq("slug", input.courseSlug)
    .eq("status", "published")
    .maybeSingle<{ id: string; slug: string; status: "published" }>()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

function buildLumiConversationTitle(titleSource?: string) {
  const fallback = "Physics Lumi chat"
  const source = titleSource?.trim()

  if (!source) {
    return fallback
  }

  return source.length > 80 ? `${source.slice(0, 77)}...` : source
}
