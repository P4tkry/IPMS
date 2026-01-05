# Complex Project Summary (AGENTS.md)

## Overview
- Project: IPMS (AI Project Management Platform)
- Type: Monorepo (pnpm workspaces)
- Primary App: Next.js (App Router) in `app/`
- Microservices: `microservices/*` (currently `upload`)
- Tools package: `tools/`
- Runtime: Node.js

## Workspace Layout
- `app/` - main web app (Next.js)
- `microservices/` - auxiliary services
- `microservices/upload/` - image upload service (Express + multer)
- `tools/` - internal tooling package
- `docker-compose.yml` - local Postgres + upload service
- `projectdata.md`, `targets.md` - product/roadmap docs

## Package Management
- Workspace manager: `pnpm`
- Workspace config: `pnpm-workspace.yaml`
- Root scripts in `package.json`:
  - `dev`: run app dev server
  - `build`: build all packages
  - `lint`: lint app
  - `prisma:generate`, `prisma:migrate`: Prisma tasks for app

## Main App (app/)
- Framework: Next.js 16.1.1, React 19
- Styling: Tailwind v4, shadcn UI components
- Animation: framer-motion
- Forms/validation: Formik + Yup
- Auth: `better-auth` (email/password + GitHub OAuth)
- DB: Prisma + Postgres
- AI: `@ai-sdk/openai` + `ai` SDK
- Tests: Playwright (`app/tests`, `app/playwright.config.ts`)

## Key Routes (App Router)
- `/` landing
- `/login` sign-in
- `/dashboard` user summary (redirects if unauth)
- `/settings/account` profile + social links
- `/settings/users` user management
- `/register` invite-based registration
- `/project/create` multi-step project creation
- `/project/[project_id]` project views

## API Routes (app/src/app/api)
- `auth/[...all]` - better-auth integration
- `settings` - profile + permissions
- `users`, `users/[userId]` - user management
- `invites` - invite tokens
- `register` - invite registration
- `permissions` - permissions list
- `photos` - profile image uploads
- `projects` - create/list projects
- `projects/[projectId]` - get/update project
- `project/create` - draft creation
- `project/create/assistant` - AI assistant for project creation
- `feedback` - feedback endpoint

## Data Model (Prisma)
- `User`: profile/auth fields, permissions, projects, social links, career, feedback
- `Account`: auth provider linkage
- `Session`: login sessions
- `Verification`: verification tokens
- `Project`: core project entity
  - Fields include: name, category, justification, audience, description, tokens, isDraft, budget,
    peopleHighAvailability, peopleLowAvailability, logo, inScope, outScope
  - Relations: leader (User), members (Users)
- `Invite`: invite tokens
- `SocialLink`: external profiles
- `CareerEntry`: employment history
- `Feedback`: app feedback

## Permissions (enum)
- `CREATE_USERS`, `REMOVE_USERS`, `UPDATE_USERS`, `UPLOAD_PHOTOS`
- `CREATE_ALL_PROJECTS`, `REMOVE_ALL_PROJECTS`, `UPDATE_ALL_PROJECTS`

## Project Creation Flow (/project/create)
- Steps order:
  1) Name
  2) Category
  3) Justification
  4) Audience
  5) Outcome
  6) Scope (in/out tags)
  7) People (high/low availability)
  8) Budget (final submit)
- Scope step: two tag inputs (in-scope/out-scope), Enter creates tags
- Draft created via `POST /api/project/create`, final values via `PATCH /api/projects/:id`
- Permissions required: `CREATE_ALL_PROJECTS`

## AI Assistant (Project Creation)
- Endpoint: `POST /api/project/create/assistant`
- Uses OpenAI model `gpt-4o-mini` via AI SDK
- Requires `OPENAI_API_KEY`
- Consumes project token budget (`project.tokens`)

## Microservice: Upload
- Location: `microservices/upload`
- Express server with multer
- Endpoints:
  - `POST /upload` (images only, max 5MB)
  - `GET /health`
  - static `/uploads` for files
- Config via env: `PORT`, `UPLOAD_DIR`, `PUBLIC_BASE_URL`

## Local Infrastructure
- `docker-compose.yml` provides:
  - Postgres 16 (`ipms-postgres`)
  - Upload service (`ipms-upload`)

## Environment Variables (app/.env)
- `DATABASE_URL`
- `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`
- `NEXT_PUBLIC_BETTER_AUTH_URL`
- `UPLOAD_SERVICE_URL`
- `OPENAI_API_KEY`

## Notes / Known Gotchas
- After schema changes, run Prisma migration + generate
- AI assistant requires network access and valid OpenAI key
- `/project/create` uses draft-first creation pattern

## Implementation Requirements
- Prefer using Formik + Yup for form state and validation when practical.
- Split steps/components into separate files (avoid large monolithic form files).
