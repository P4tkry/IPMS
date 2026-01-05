# Project Data Model Overview

This document summarizes the main data models and their intent.

## User
- Purpose: Primary account entity for authentication and profile data.
- Key fields: `email`, `name`, `bio`, `image`, `permissions`, `hobbies`, `strengths`, `weaknesses`.
- Relations:
  - `accounts`, `sessions` (auth)
  - `leadingProjects` (leader of projects)
  - `projects` (member of projects)
  - `socialLinks` (external profiles)
  - `career` (employment history)
  - `Invite` (created invitations)

## Account
- Purpose: Auth provider linkage (credentials, OAuth providers).
- Key fields: `providerId`, `accountId`, `password` (for credentials), tokens.
- Relation: Belongs to a `User`.

## Session
- Purpose: Active login session management.
- Key fields: `token`, `expiresAt`, `ipAddress`, `userAgent`.
- Relation: Belongs to a `User`.

## Verification
- Purpose: Stores verification tokens (email verification, etc.).
- Key fields: `value`, `expiresAt`, `identifier`.

## Project
- Purpose: Core project entity.
- Key fields: `name`, `description`, `logo`.
- Relations:
  - `leader` (single `User`)
  - `members` (many `User`)

## SocialLink
- Purpose: User profile links for external platforms.
- Key fields: `platform`, `url`.
- Relation: Belongs to a `User`.

## Invite
- Purpose: Tokenized invitation for registration.
- Key fields: `token`, `email`, `name`, `expiresAt`, `createdById`.
- Relation: Belongs to a `User` (`createdBy`).

## CareerEntry
- Purpose: Employment history entries for a user profile.
- Key fields: `startDate`, `position`, `companyName`, `duration`.
- Relation: Belongs to a `User`.

## Enums
- `Permission`: user capabilities (`CREATE_USERS`, `REMOVE_USERS`, `UPDATE_USERS`, `CREATE_ALL_PROJECTS`, `REMOVE_ALL_PROJECTS`, `UPDATE_ALL_PROJECTS`).
- `Permission`: includes `UPLOAD_PHOTOS` for profile image uploads.
- `SocialPlatform`: supported social links (`GITHUB`, `LINKEDIN`, `X`, `WEBSITE`).

## UI Components (Shadcn)
- `Button`: primary actions and navbar actions.
- `Badge`: section labels.
- `Card`, `CardContent`: containers for login and settings.
- `Avatar`, `DropdownMenu`: user menu in the floating navbar.

## Styling and Layout
- Global theme: warm neutral palette with soft gradients and dotted background.
- Floating navbar: fixed at top, rounded pill, blur + shadow, no layout offset.
- Pages: background layers use soft blurred circles + subtle dot grid.
- Typography: landing + settings/login use `Fraunces`; global fonts are Geist in `layout.tsx`.

## Key Routes
- `/`: landing page.
- `/login`: sign-in form (Formik + Yup).
- `/dashboard`: user info summary, redirects to `/login` when unauthenticated.
- `/settings/account`: profile + social links editor (Formik + Yup).
- `/settings/users`: user management (invite + list/edit/delete).
- `/register`: invite-based registration.
 - Upload service: `http://localhost:4000/uploads/...` (local dev).

## Auth + Client
- Client hook: `authClient.useSession()` for session info.
- Sign-in: `authClient.signIn.email(...)`.
- Sign-out: `authClient.signOut()`.
- API: `/api/settings` for profile + social links + permissions.
- API: `/api/invites` for generating invite links and validating tokens.
- API: `/api/users` and `/api/users/:id` for listing and managing users.
- API: `/api/permissions` for available permission options.
- API: `/api/register` for completing invite registration.
- API: `/api/photos` for uploading profile images.

## Roadmap (from targets.md)
### 1) Core PM surface (MVP)
- Data model: Project/Epic/Task/Subtask + status, priority, estimates, dependencies, milestones.
- UI: Kanban with drag & drop, task detail drawer, activity/audit log.
- Gantt: timeline with dependencies, critical path, milestone markers.
- Permissions: role-based access in UI + API.
- Auth flow: GitHub OAuth + org/repo selection (MVP scope).

### 2) AI foundation
- AI task breakdown endpoint for epics/features -> tasks.
- Risk analysis: scoring + alerts for critical path impact.
- AI review: DoD checks, missing tests, logic pitfalls.
- Project context memory (RAG) with sources: tasks, docs, PRs.

### 3) Integrations
- GitHub App + webhooks for PR events.
- Auto-attach PRs to tasks and run AI review.
- Sync orgs/repos and map contributors to users.

### 4) Alerts & quality gates
- Rule engine: schedule slip, DoD violations, test gaps.
- Notifications: in-app + email/Slack (configurable).
- Alert severity and escalation rules.

### 5) Platform hardening
- Admin UI for roles/permissions and org settings.
- Multi-tenant org model.
- Observability: audit logs, metrics, error tracking.
- Infra: Postgres + Redis queues, CI/CD, backups.
