# Web E2E setup

`pnpm --filter web test:e2e` starts the Next dev server automatically unless `PLAYWRIGHT_BASE_URL` is already set.

Role smoke tests are optional. They run only when matching storage states exist under `apps/web/playwright/.auth/` or when these path env vars point to valid files:

- `PLAYWRIGHT_AUTH_STATE`
- `PLAYWRIGHT_TEACHER_AUTH_STATE`
- `PLAYWRIGHT_SCHOOL_ADMIN_AUTH_STATE`
- `PLAYWRIGHT_ADMIN_AUTH_STATE`

To generate local states, make sure local Supabase has the demo users and classroom seed applied, then run the setup spec with the users' passwords:

```sh
PLAYWRIGHT_AUTH_PASSWORD="local-password" pnpm --filter web test:e2e e2e/auth.setup.ts
```

Per-role overrides are supported:

- `PLAYWRIGHT_STUDENT_EMAIL`, `PLAYWRIGHT_STUDENT_PASSWORD`
- `PLAYWRIGHT_TEACHER_EMAIL`, `PLAYWRIGHT_TEACHER_PASSWORD`
- `PLAYWRIGHT_SCHOOL_ADMIN_EMAIL`, `PLAYWRIGHT_SCHOOL_ADMIN_PASSWORD`
- `PLAYWRIGHT_ADMIN_EMAIL`, `PLAYWRIGHT_ADMIN_PASSWORD`

Default demo emails are `student@demo.learnify.academy`, `teacher@demo.learnify.academy`, `school-admin@demo.learnify.academy`, and `admin@demo.learnify.academy`.
