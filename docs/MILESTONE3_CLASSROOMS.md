# Milestone 3 Learnify Classrooms Build Contract

Last updated: 2026-06-06

Purpose: define the market-ready school product direction for Learnify Classrooms and the implementation contract for the first classroom slices.

`docs/PRODUCT.md` remains the product source of truth. `docs/ARCHITECTURE.md` remains the implementation contract for the current app foundation. This file extends both for Milestone 3.

## 1. Milestone 3 Goal

Milestone 3 turns Learnify from a private beta learning app into a school-ready classroom product.

Primary buyer:

```txt
School or department
```

First daily user:

```txt
Teacher
```

Core classroom loop:

```txt
School buys seats
-> Learnify admin creates school
-> School admin invites teachers
-> Teacher creates classroom
-> Students join by email invite, code, or QR
-> Teacher approves students
-> Teacher assigns work
-> Students complete work
-> Teacher monitors class performance and grades
```

Milestone 3 product promise:

```txt
Learnify Classrooms should feel as simple as Google Classroom, but with stronger personalization, assignment analytics, and learning progress visibility.
```

## 2. Locked Product Decisions

Learnify Classrooms must support these role flows:

- Learnify admin creates schools, contracts, seat limits, and first school admin invites.
- School admin invites school admins and teachers, manages school users, seats, overage, and school settings.
- Teacher creates classrooms, invites students, approves every code or QR join request, creates assignments/quizzes later, grades work later, and monitors progress.
- Student joins classrooms, completes work, submits files or links later, and views grades/feedback.

One global Learnify account can belong to multiple schools.

One user can have only one role per school. The same email cannot be both `school_admin` and `teacher` in the same school. The same email can have different roles across different schools.

School admins do not consume teacher seats. School admin seats are separate and configurable. Default school admin seat limit is `3`, unless Learnify admin changes it for a school.

Teachers consume teacher seats only when their school membership becomes active. Teacher overage is not supported.

Students consume one student seat per active school membership, not per classroom. A student can join multiple classrooms in the same school and still consume only one student seat.

Student overage is supported only when both conditions are true:

- Learnify admin allows student overage for the school contract.
- School admin enables student overage for the school.

Teachers should not see billing details. If student overage is enabled, approving a student still shows only:

```txt
Approved. Student added.
```

If student overage is disabled and the school is at capacity, teacher approval leaves the student in `pending_capacity` and shows:

```txt
Approval pending. Your school has reached its student account limit.
```

Students should only see:

```txt
Your request is pending approval.
```

## 3. Slices

Build Milestone 3 in slices. Do not pull later-slice features into Slice 1 unless they are required to complete the core school/classroom foundation.

## Slice 1: School And Classroom Foundation

Goal: build the real Supabase-backed foundation for schools, seats, staff invites, classroom creation, student joining, teacher approval, roster, audit, and minimum notification visibility.

Build:

- Learnify admin school management.
- School contracts and seat limits.
- First school admin invite.
- School admin invite flow.
- Teacher invite flow.
- Resend email delivery for school admin and teacher invites.
- Role-specific dashboards.
- Classroom creation with required `name` and `subject`.
- Optional `school_year` and optional grade/year label.
- Auto-generated class code and QR token, enabled immediately.
- Student code and QR join flow.
- Student email invite flow with bulk paste.
- Teacher approval for every student join, including email invites, code joins, and QR joins.
- Student school seat counting on teacher approval.
- Classroom roster active and pending views.
- Teacher notification icon red dot for pending join requests.
- School admin notification center for seat and school-level alerts.
- `school_audit_events` database table.
- Learnify admin audit view.
- RLS policies in the first migration.
- Targeted core/database and route handler tests.
- Demo school/classroom seed records and invite records.

Slice 1 explicitly excludes:

- Assignment builder.
- Gradebook.
- Announcements.
- Calendar.
- Classroom analytics dashboard.
- Full notification preferences.
- Full notification centers beyond the minimum role surfaces.
- CSV imports.
- Co-teachers.
- Parent accounts.
- Payments or in-app billing.
- Google Classroom, SIS, LMS, or Google Drive API integration.

## Slice 2: Assignments, Quizzes, And Submissions

Goal: teachers can create meaningful classroom work.

Build:

- Step-by-step assignment builder.
- Assignment types: Learnify lesson, quiz, manual submission, mixed assignment.
- Mixed assignments with ordered items and one overall grade.
- Teacher-defined points per assignment item.
- Quiz builder with full assessment direction:
  - Multiple choice.
  - True/false.
  - Short answer.
  - Fill-in-the-blank.
  - Attachments and richer question types later as needed.
- Lumi-assisted quiz draft generation for teachers.
- Teacher-editable skill/concept tags suggested by Lumi.
- Attachments:
  - PDF upload.
  - Google Drive links.
  - Images.
  - Videos.
  - Audio.
  - Live previews where practical.
- Student submissions:
  - PDF upload.
  - Google Docs or Drive link.
  - Images.
  - Videos.
  - Audio.
  - Text response.
- Auto-grade only question types with teacher-provided correct answers, such as multiple choice and true/false.
- Manual grading for attachments, short answers, and open submission work.
- Teacher controls attempt count for quizzes.
- Teacher controls whether late submissions are accepted.
- Teacher manually applies any late penalty.
- Teacher can return work for resubmission.
- Students can resubmit freely before the due date.
- Latest student submission is visible for grading; previous versions are kept internally for audit.
- Required assignment items must be completed before final submission. Optional items can be skipped.
- Visible student submission receipt after submission.

Important Lumi rule:

```txt
If points > 0, the work is graded and Lumi is off during the work.
If points = 0, the work is practice and Lumi can be available.
```

## Slice 3: Gradebook, Feedback, And Records

Goal: teachers can grade, return, track, and export classroom work.

Build:

- Points-only gradebook.
- CSV export.
- Assignment-level and item-level score details.
- Teacher-to-student private submission feedback thread.
- Students can reply inside the submission feedback thread.
- School admins cannot view submission feedback threads.
- Students can continue to view their own feedback history.
- Deactivated teachers lose access to school classroom data.
- Classroom archive state:
  - Teachers keep read-only access while active in the school.
  - Students keep read-only access to submitted work, grades, and feedback.
  - Teachers and school admins can unarchive or permanently delete from normal UI.
  - Permanent delete hides from normal UI, but internal records remain.
- Assignment delete behavior:
  - Teacher can delete from classroom views.
  - Internal records remain for audit.
  - No restore UI for assignments in the first classroom release.
- Missing and excused statuses.
- Individual student due date overrides.

Manual submission statuses:

```txt
not_started
draft
submitted
late_submitted
returned
resubmitted
graded
```

Auto-graded quiz item statuses:

```txt
not_started
in_progress
completed
```

## Slice 4: Notifications, Announcements, Calendar, And Classroom UX

Goal: classrooms feel complete for school usage.

Build:

- Classroom announcements.
- Classroom calendar.
- Scheduled release for announcements and assignments using `publish_at`.
- Student notification center:
  - New announcement.
  - New assignment.
  - Upcoming due date.
  - Work graded or returned.
  - Teacher feedback reply.
  - Class join approved or rejected.
- Teacher notification center:
  - Pending student join requests.
  - New assignment submissions.
  - Late or missing submissions.
  - Student replies in submission feedback thread.
  - Scheduled publish failures.
- School admin notification center:
  - Seat limit reached.
  - Overage created.
  - Teacher invite accepted.
  - School subscription expiring.
  - Expired grace period ending.
  - Classroom deleted or archived.
  - Unusual usage or export events.
- Email notifications for:
  - Announcements.
  - Upcoming due dates.
  - Graded or returned work.
- Teachers control classroom email notification settings.
- Students cannot opt out of classroom emails in the first classroom release.
- In-app notifications are always enabled.
- No full granular notification preference system in Slice 4.

## Slice 5: Classroom Analytics And School Rollups

Goal: Learnify becomes more valuable than a basic classroom tool.

Teacher classroom overview should show:

- On-time completion rate.
- Average assignment score.
- Missing and late submissions count.
- Active students this week.
- Most difficult assignment.
- Most missed concept or skill.
- Students needing follow-up count.

Overview metrics should be aggregate first, with named drill-downs.

School admin dashboard should show roll-up performance and usage across classes:

- Seat usage.
- Active teachers.
- Active classes.
- Assignment completion trends.
- Average scores by class.
- Missing work trends.
- Classroom adoption.
- CSV exports.

Teachers should not see private Lumi chat data. School admins should not see private Lumi chat transcripts by default. For the agreed classroom release, teachers see no Lumi-related student chat data. Lumi can still personalize privately using classroom, assignment, progress, and mistake context.

## 4. Roles And Permissions

## Learnify Admin

Can:

- Create schools.
- Configure subscription status.
- Configure admin, teacher, and student seat limits.
- Configure whether student overage is allowed.
- Create first school admin invite.
- Suspend/reactivate schools.
- View overage counts.
- Export billing usage.
- View Slice 1 audit events.

Does not:

- Manage daily classroom work unless needed for support.
- Replace school admin workflows.

## School Admin

Can:

- Invite additional school admins up to `admin_seat_limit`.
- Invite teachers.
- Manage school users.
- Deactivate/reactivate teachers and students.
- Enable student overage only if Learnify admin allowed it.
- View seat usage.
- See pending student school memberships for capacity/user management.
- Archive/delete classrooms from normal UI.
- View school-level roll-up performance and usage.

Cannot:

- Read private Lumi chat transcripts by default.
- Read teacher-student submission feedback threads.
- Grade assignments as school admin unless they also have a separate teacher account in another school.

## Teacher

Can:

- Create classrooms freely within their active school membership.
- Create classrooms with required name and subject.
- Invite students by email in Slice 1.
- Share class code/QR.
- Approve or reject every student join request.
- Remove active students from a classroom only.
- Regenerate or disable class code/QR.
- View classroom roster and pending requests.
- Later create assignments, grade work, and give feedback.

Cannot:

- Create co-teachers in the first release.
- See billing details.
- Activate teacher seats.
- Deactivate a student from the school.
- See student private Lumi chat data.

## Student

Can:

- Join by class code, QR, or email invite.
- Cancel pending join requests.
- See rejected join status with a simple message.
- See classroom name, teacher, assignments, announcements, calendar, own grades, own submissions, own feedback.
- See classmate names only.

Cannot:

- See classmate scores, submission status, activity, Lumi use, or progress.
- Invite other students through a product feature.
- Use Lumi during graded work.

## 5. Auth And Invite Rules

Learnify admin creates the first school admin invite after a school contract is created.

School admins can invite additional school admins and teachers.

Invited school admins and teachers must register or sign in through the invite before their school membership activates.

Exact normalized email matching is required for:

- School admin invites.
- Teacher invites.
- Student email invites.

If the current signed-in email does not match the invite email, show a clear error and let the user sign out or request a new invite.

Invite email sender:

```txt
Learnify <onboarding@app.learnify.academy>
```

Email provider:

```txt
Resend
```

Invite email branding:

```txt
Learnify branding plus school name/context.
```

School admin and teacher invite links expire after 14 days.

Classroom email invite links expire after 14 days.

Class code and QR tokens do not expire automatically, but teachers can regenerate or disable them.

Expired invite records should be deleted/hidden from normal UI when no longer needed, but an internal audit event must remain.

## 6. Classroom Join Rules

Every student join through code, QR, or email invite requires teacher approval.

Class code/QR behavior:

- Auto-generate short human-readable class code on classroom creation.
- Auto-generate secure QR/invite token on classroom creation.
- Code and QR joins are enabled immediately.
- Short codes are globally unique.
- Classroom QR/invite tokens are separate from classroom slugs.
- Codes can be regenerated or disabled.
- Existing approved students remain enrolled when code/QR changes.

Student email invite behavior:

- Slice 1 includes student email invites.
- Teachers can bulk paste student emails, one per line or comma-separated.
- Student email invites are convenience only. They still require teacher approval.
- Email invite creates a pending classroom join request tied to the invited email and classroom.

Teacher approval behavior:

- One-by-one approval only in Slice 1.
- No bulk approve/reject in Slice 1.
- Approving a student activates both school membership and classroom membership when capacity allows.
- If school membership already exists and is active, the student does not consume another school seat.
- Rejected requests are visible to the student as not approved.
- No undo for rejected requests in Slice 1. Student can rejoin or be reinvited.

## 7. Subscription And Seat Rules

Initial billing model:

```txt
Seat-based annual school plan, manually managed by Learnify admin.
```

No in-app payments in Milestone 3. Learnify admin manages contracts manually.

School contract fields should include:

- School name.
- Subscription status.
- Admin seat limit, default `3`.
- Teacher seat limit.
- Student seat limit.
- Student overage allowed by Learnify.
- Student overage enabled by school.
- Student overage count.
- Renewal date.

Teacher invites:

- Pending teacher invites can exceed available teacher seats.
- Teacher seat is consumed only when the invited teacher accepts and activates.
- If no teacher seat is available, the teacher account can be created but school membership stays `pending_capacity`.
- Teacher overage is not supported.

Student joins:

- Student seat is consumed only when teacher approves the student's first active school membership.
- If capacity exists, membership becomes active.
- If capacity is full and student overage is enabled, membership becomes active and overage is counted.
- If capacity is full and overage is disabled, request/membership becomes `pending_capacity`.

Expired/suspended schools:

- Users keep read-only access.
- No new classrooms, assignments, submissions, invites, student approvals, Lumi usage, or grading.
- Expired schools receive a 30-day read-only grace period.
- After 30 days, Learnify admin handles final lockout manually.

## 8. Status Model

School subscription statuses:

```txt
active
suspended
expired
grace_ended
cancelled
```

School membership statuses:

```txt
invited
active
pending_capacity
inactive
removed
```

Classroom statuses:

```txt
active
archived
deleted
```

Classroom join request statuses:

```txt
pending_teacher_approval
pending_capacity
approved
rejected
cancelled
```

Classroom membership statuses:

```txt
active
removed
```

## 9. Proposed Slice 1 Data Model

Use exact table names during implementation unless a migration conflict requires adjustment.

## `schools`

Key columns:

- `id uuid primary key`
- `name text not null`
- `slug text not null unique`
- `subscription_status text not null`
- `admin_seat_limit integer not null default 3`
- `teacher_seat_limit integer not null`
- `student_seat_limit integer not null`
- `student_overage_allowed_by_learnify boolean not null default false`
- `student_overage_enabled_by_school boolean not null default false`
- `renewal_date date`
- `created_by uuid references profiles(id)`
- `created_at timestamptz`
- `updated_at timestamptz`

## `school_memberships`

Key columns:

- `id uuid primary key`
- `school_id uuid references schools(id)`
- `user_id uuid references profiles(id)`
- `role text not null`
- `status text not null`
- `email_normalized text not null`
- `seat_consumed boolean not null default false`
- `overage boolean not null default false`
- `invited_by uuid references profiles(id)`
- `activated_at timestamptz`
- `deactivated_at timestamptz`
- `created_at timestamptz`
- `updated_at timestamptz`

Constraints:

- One role per user per school.
- One active membership identity per normalized email per school.

Roles:

```txt
school_admin
teacher
student
```

## `school_invites`

Key columns:

- `id uuid primary key`
- `school_id uuid references schools(id)`
- `email text not null`
- `email_normalized text not null`
- `role text not null`
- `token_hash text not null`
- `status text not null`
- `invited_by uuid references profiles(id)`
- `accepted_by uuid references profiles(id)`
- `expires_at timestamptz not null`
- `accepted_at timestamptz`
- `created_at timestamptz`
- `updated_at timestamptz`

Statuses:

```txt
pending
accepted
expired
deleted
revoked
```

## `classrooms`

Key columns:

- `id uuid primary key`
- `school_id uuid references schools(id)`
- `owner_membership_id uuid references school_memberships(id)`
- `name text not null`
- `slug text not null unique`
- `subject_label text not null`
- `subject_normalized text`
- `school_year text`
- `grade_label text`
- `status text not null default 'active'`
- `join_code text not null unique`
- `join_token_hash text not null`
- `join_enabled boolean not null default true`
- `archived_at timestamptz`
- `deleted_at timestamptz`
- `created_at timestamptz`
- `updated_at timestamptz`

Subject is required at classroom creation. Store teacher-entered free text as `subject_label` and best-effort normalized category as `subject_normalized`.

## `classroom_join_requests`

Key columns:

- `id uuid primary key`
- `school_id uuid references schools(id)`
- `classroom_id uuid references classrooms(id)`
- `student_user_id uuid references profiles(id)`
- `student_membership_id uuid references school_memberships(id)`
- `email text`
- `email_normalized text`
- `source text not null`
- `status text not null`
- `requested_at timestamptz`
- `approved_by uuid references profiles(id)`
- `approved_at timestamptz`
- `rejected_by uuid references profiles(id)`
- `rejected_at timestamptz`
- `cancelled_at timestamptz`
- `created_at timestamptz`
- `updated_at timestamptz`

Sources:

```txt
code
qr
email_invite
```

## `classroom_memberships`

Key columns:

- `id uuid primary key`
- `school_id uuid references schools(id)`
- `classroom_id uuid references classrooms(id)`
- `student_membership_id uuid references school_memberships(id)`
- `student_user_id uuid references profiles(id)`
- `status text not null`
- `joined_at timestamptz`
- `removed_at timestamptz`
- `removed_by uuid references profiles(id)`
- `created_at timestamptz`
- `updated_at timestamptz`

## `classroom_student_invites`

Key columns:

- `id uuid primary key`
- `school_id uuid references schools(id)`
- `classroom_id uuid references classrooms(id)`
- `email text not null`
- `email_normalized text not null`
- `token_hash text not null`
- `status text not null`
- `invited_by uuid references profiles(id)`
- `expires_at timestamptz not null`
- `accepted_by uuid references profiles(id)`
- `accepted_at timestamptz`
- `created_at timestamptz`
- `updated_at timestamptz`

Statuses:

```txt
pending
accepted
expired
deleted
revoked
```

## `school_audit_events`

Key columns:

- `id uuid primary key`
- `school_id uuid references schools(id)`
- `actor_user_id uuid references profiles(id)`
- `actor_membership_id uuid references school_memberships(id)`
- `event_type text not null`
- `target_type text not null`
- `target_id uuid`
- `metadata jsonb not null default '{}'`
- `created_at timestamptz`

Initial event types:

```txt
school.created
school.seats_changed
school.subscription_changed
school_admin.invited
teacher.invited
invite.deleted
membership.activated
membership.deactivated
membership.pending_capacity
classroom.created
classroom.archived
classroom.deleted
classroom.join_code_regenerated
classroom.join_code_disabled
join_request.created
join_request.approved
join_request.rejected
join_request.cancelled
```

## 10. Routes

Keep routes inside the authenticated localized app area.

Recommended UI routes:

```txt
/{locale}/app/admin/schools
/{locale}/app/admin/schools/[schoolSlug]
/{locale}/app/school
/{locale}/app/school/users
/{locale}/app/school/invites
/{locale}/app/classrooms
/{locale}/app/classrooms/[classroomSlug]
/{locale}/app/classrooms/[classroomSlug]/roster
/{locale}/app/join/[joinToken]
```

Classroom URLs use slugs. UUIDs remain internal. Classroom slugs are globally unique.

Recommended API route direction:

```txt
POST /api/admin/schools
POST /api/admin/schools/[schoolId]/school-admin-invites
GET /api/admin/schools/[schoolId]/audit-events
POST /api/school/invites/admin
POST /api/school/invites/teacher
POST /api/school/invites/[inviteId]/delete
POST /api/school/memberships/[membershipId]/deactivate
POST /api/school/memberships/[membershipId]/reactivate
POST /api/classrooms
POST /api/classrooms/[classroomId]/join-code/regenerate
POST /api/classrooms/[classroomId]/join-code/disable
POST /api/classrooms/[classroomId]/student-invites
POST /api/classrooms/join/code
POST /api/classrooms/join/token
POST /api/classrooms/join-requests/[requestId]/approve
POST /api/classrooms/join-requests/[requestId]/reject
POST /api/classrooms/join-requests/[requestId]/cancel
POST /api/classrooms/[classroomId]/students/[membershipId]/remove
```

All Slice 1 mutations must go through route handlers and repository functions. Do not mutate school/classroom tables directly from UI components.

Reads should mostly use repository/server boundaries. Use API/TanStack Query for interactive refreshes such as pending join counts and notification badges.

## 11. RLS And Security

Add RLS in the first Slice 1 migration.

Use server-side route handlers and repository functions for:

- Seat enforcement.
- Invite token validation.
- Exact email matching.
- Join approval.
- Membership activation/deactivation.
- Audit event creation.

Do not expose service-role logic to client code.

Token storage:

- Store invite and join token hashes, not raw tokens.
- Show raw token only in generated links/emails.
- Regenerating a token invalidates the old token.

Minimum RLS direction:

- Learnify admins can read/manage schools through server checks.
- School admins can read/manage their own school users and school settings, excluding private feedback and Lumi transcripts.
- Teachers can read their own active school/classroom records and manage their own classrooms.
- Students can read their own school/classroom memberships and their own classroom records.
- No public reads on invite, membership, audit, or seat tables.

## 12. Notification Scope

Slice 1 minimum:

- Teacher top notification icon red dot for pending join requests.
- Classroom roster pending count.
- School admin notification center for seat limit, overage, invite, subscription, and school-level alerts.

No full preference system in Slice 1.

Later notification rules:

- Teachers receive classroom-action notifications.
- School admins receive school/account/seat notifications.
- Students receive classroom assignment/announcement/feedback notifications.
- Teachers configure classroom email notification settings.
- Students cannot opt out of classroom emails in the first classroom release.

## 13. Testing

Slice 1 must include targeted tests before the branch is considered stable.

Core/database tests:

- Subject normalization.
- Classroom slug generation.
- Class code generation uniqueness.
- Invite expiry logic.
- Exact-email invite acceptance.
- Teacher seat capacity.
- Student seat capacity.
- Student overage allowed/enabled behavior.
- School membership status transitions.
- Classroom join request status transitions.
- Deactivation frees seats while preserving history.

Route handler tests:

- Learnify admin creates school.
- Learnify admin sends first school admin invite.
- School admin invites teacher.
- Teacher accepts invite with matching email.
- Mismatched email cannot accept invite.
- Teacher creates classroom.
- Student joins by code.
- Student joins by QR token.
- Student email invite creates pending request.
- Teacher approves student and consumes seat.
- Teacher approval at capacity creates `pending_capacity`.
- Teacher sees no billing/overage details.
- Teacher removes student from classroom without deactivating school membership.

Delay Playwright until the first UI path exists:

```txt
Learnify admin creates school
-> school admin invite
-> teacher invite
-> classroom create
-> student join request
-> teacher approval
```

## 14. Seeds

Seed demo records for development:

- Demo school.
- Admin seat limit `3`.
- Teacher seat limit `5`.
- Student seat limit `200`.
- Student overage allowed/enabled `false` by default.
- One school admin invite or account record.
- One teacher invite or teacher membership record.
- One classroom: `Physics 6A 2026`.

Do not seed real auth users unless local Supabase auth seeding is already reliable. Prefer seed records and invites, then create/sign in test users during manual or Playwright testing.

## 15. Explicit Non-Goals For Slice 1

Do not build in Slice 1:

- Assignment builder.
- Quiz builder.
- File uploads.
- Google Drive OAuth or deep document sync.
- Gradebook.
- CSV imports.
- Announcements.
- Calendar.
- Classroom analytics.
- Parent/guardian accounts.
- Co-teachers.
- Payments or self-serve billing.
- SIS/LMS integrations.
- Mobile classroom UI.
- Full notification preferences.
- Full audit UI for school admins.

## 16. Implementation Order

1. Add shared types and Zod schemas for schools, memberships, invites, classrooms, join requests, and classroom memberships.
2. Add core rules for seat capacity, overage, invite acceptance, classroom join transitions, code generation, and slug generation.
3. Add Supabase migration with tables, indexes, constraints, and RLS.
4. Add database repository functions.
5. Add route handlers for school creation, invites, classroom creation, joins, approvals, and removals.
6. Add Resend email helpers and templates for school admin and teacher invites.
7. Add role-specific dashboard shells.
8. Add classroom creation UI.
9. Add student join UI.
10. Add teacher roster pending queue and notification red dot.
11. Add Learnify admin audit view.
12. Add tests and seed data.

## 17. Success Criteria For Slice 1

Slice 1 is complete when:

- Learnify admin can create a school with seat limits.
- Learnify admin can send first school admin invite by email.
- School admin can accept invite with exact matching email.
- School admin can invite teachers by email.
- Teacher can accept invite with exact matching email.
- Teacher activation respects teacher seat capacity and `pending_capacity`.
- Teacher can create a classroom with name and subject.
- Classroom has globally unique slug, code, and QR token.
- Student can request to join by code or QR.
- Teacher can invite students by bulk-pasted emails.
- Student email invite creates a pending teacher approval request.
- Teacher approval activates student school membership and classroom membership when capacity allows.
- Student overage works only when Learnify allows it and school admin enables it.
- Teacher approval at capacity leaves request pending without exposing billing details.
- Student can cancel pending join request.
- Teacher can reject join request.
- Teacher can remove active student from classroom without deactivating school membership.
- School admin can deactivate/reactivate school students.
- Deactivation frees seats and preserves history.
- Teacher notification red dot reflects pending join requests.
- School admin notification center shows school-level seat/capacity alerts.
- Audit events are written for key school, invite, membership, classroom, and join actions.
- RLS is enabled for new tables.
- Targeted tests cover the critical state transitions.
