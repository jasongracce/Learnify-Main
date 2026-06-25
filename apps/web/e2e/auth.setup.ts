import fs from "node:fs"
import path from "node:path"
import { expect, test, type APIRequestContext } from "@playwright/test"

type RoleAuthConfig = {
  role: "student" | "teacher" | "school admin" | "Learnify admin"
  emailEnv: string
  defaultEmail: string
  passwordEnv: string
  statePath: string
}

const authDir = path.join(process.cwd(), "playwright", ".auth")
const sharedPassword = process.env.PLAYWRIGHT_AUTH_PASSWORD

const roleAuthConfigs: RoleAuthConfig[] = [
  {
    role: "student",
    emailEnv: "PLAYWRIGHT_STUDENT_EMAIL",
    defaultEmail: "student@demo.learnify.academy",
    passwordEnv: "PLAYWRIGHT_STUDENT_PASSWORD",
    statePath:
      process.env.PLAYWRIGHT_AUTH_STATE ??
      path.join(authDir, "beta-user.json"),
  },
  {
    role: "teacher",
    emailEnv: "PLAYWRIGHT_TEACHER_EMAIL",
    defaultEmail: "teacher@demo.learnify.academy",
    passwordEnv: "PLAYWRIGHT_TEACHER_PASSWORD",
    statePath:
      process.env.PLAYWRIGHT_TEACHER_AUTH_STATE ??
      path.join(authDir, "teacher-user.json"),
  },
  {
    role: "school admin",
    emailEnv: "PLAYWRIGHT_SCHOOL_ADMIN_EMAIL",
    defaultEmail: "school-admin@demo.learnify.academy",
    passwordEnv: "PLAYWRIGHT_SCHOOL_ADMIN_PASSWORD",
    statePath:
      process.env.PLAYWRIGHT_SCHOOL_ADMIN_AUTH_STATE ??
      path.join(authDir, "school-admin-user.json"),
  },
  {
    role: "Learnify admin",
    emailEnv: "PLAYWRIGHT_ADMIN_EMAIL",
    defaultEmail: "admin@demo.learnify.academy",
    passwordEnv: "PLAYWRIGHT_ADMIN_PASSWORD",
    statePath:
      process.env.PLAYWRIGHT_ADMIN_AUTH_STATE ??
      path.join(authDir, "admin-user.json"),
  },
]

test.describe("role auth storage states", () => {
  for (const config of roleAuthConfigs) {
    test(`writes ${config.role} storage state`, async ({ request }) => {
      const password = process.env[config.passwordEnv] ?? sharedPassword
      if (!password) {
        test.skip(
          true,
          `Set ${config.passwordEnv} or PLAYWRIGHT_AUTH_PASSWORD to write ${config.role} storage state.`
        )
        return
      }

      const email = process.env[config.emailEnv] ?? config.defaultEmail
      await signInAndWriteState({
        request,
        email,
        password,
        statePath: config.statePath,
      })
    })
  }
})

async function signInAndWriteState(input: {
  request: APIRequestContext
  email: string
  password: string
  statePath: string
}) {
  const response = await input.request.post("/api/auth/login", {
    data: {
      email: input.email,
      password: input.password,
      locale: "en",
    },
  })

  expect(response.ok(), await response.text()).toBe(true)

  fs.mkdirSync(path.dirname(input.statePath), { recursive: true })
  await input.request.storageState({ path: input.statePath })
}
