# ATARAXIA

ATARAXIA is a complete local demonstration of a university wellbeing application. The student experience combines preventive nursing and psychology perspectives, a guided self-check, self-reported vital signs, personal activities, and simulated attention requests. All product copy is Spanish; code and technical documentation are English.

## Safety and scope

This is a wellness, prevention, and orientation MVP, not a diagnostic system, therapy platform, medical device, emergency monitoring service, or substitute for licensed care. Neither assessment scoring nor resource content has clinical validation or institutional approval. Every resource carries a review label. An urgent answer presents support immediately; it never creates a plan, books an appointment, notifies an institution, or claims that help is on the way.

## Inspection and assumptions

- The starting directory contained unrelated MBOSUITE projects and no ATARAXIA repository or reusable frontend. `git status` at the parent returned “not a git repository.” This application was created independently under `ataraxia`; unrelated projects were preserved.
- Node 22.23.2 and npm 10.9.8 were available. PowerShell blocks `npm.ps1`, so use `npm.cmd` on this machine. The normal `npm` commands below work in other supported shells.
- No approved logo, licensed photography, wellness reference attachment, or old module diagram was available as an asset. The written light wellness specification and six-module map were used. The original temporary SVG mark is replaceable in `BrandLogo`; the CSS atmosphere requires no external images, fonts, or services.
- The institution is Universidad de Linda Vista, with the user-provided institutional contact `+52 9371549923`. Shared defaults populate the API, browser fallback, navigation shell, landing and support panels. The emergency-service phone remains independently configurable; the institutional contact is not represented as an emergency hotline.
- No authentication, real scheduling, multiuser database, cloud services, emails, paid services, AI APIs, or Docker are implemented.

## Architecture and workspace

```text
apps/web/src/
  app/             Routes, error boundary, route interaction tests
  components/      Accessible primitives, dialog and replaceable brand
  features/        Assessment, resources, plan, vitals, requests, data, dashboard, support
  layouts/         Responsive shell and navigation
  pages/           Landing, privacy, accessibility, help and not-found
  services/        Validated public API access with built-in fallbacks
  storage/         Local repository and React provider
  styles/          Global tokens and typography
apps/api/src/      Stateless Hapi application, server lifecycle and API tests
packages/shared/  Zod schemas, types, public content and pure business rules
e2e/              Real Chrome user-flow tests
```

React 19, TypeScript 6, Vite 8, React Router 7, React Hook Form, Zod 4, TanStack Query, CSS Modules and Recharts power the frontend. Hapi 21 serves public configuration and educational content. npm workspaces share schemas and pure functions. Vitest, React Testing Library, Playwright, ESLint and Prettier provide validation. `package-lock.json` pins the installed dependency graph. A compatible esbuild override avoids the vulnerable transitive version shipped by the build-tool dependency range.

TanStack Query manages only API server state. React and the storage repository own browser data. The Hapi server never reads or persists browser localStorage. The dashboard is lazy-loaded so its chart library is not required for the landing page. Feature folders contain actual functionality; unused abstraction folders were not created.

## Requirements and installation

Use Node 22.12 or newer within a supported Node LTS release, npm, and a modern browser with localStorage, `crypto.randomUUID`, native dialogs, and ES2023 support.

```sh
cd ataraxia
npm install
npm run dev
```

Development starts both the frontend at `http://localhost:5173` and the API at `http://localhost:3001`. Keep the same browser hostname and port when testing persistence: `localhost` and `127.0.0.1` have separate storage origins.

## Environment configuration

Copy `apps/api/.env.example` to `apps/api/.env` and `apps/web/.env.example` to `apps/web/.env` only when custom configuration is needed. These real environment files are ignored by Git; none is supplied or required to start locally.

| API variable       | Purpose                          | Local default                  |
| ------------------ | -------------------------------- | ------------------------------ |
| `API_PORT`         | Hapi listening port              | `3001`                         |
| `FRONTEND_ORIGIN`  | Exact allowed CORS origin        | `http://localhost:5173`        |
| `INSTITUTION_NAME` | Institution display name         | `Universidad de Linda Vista`   |
| `EMERGENCY_PHONE`  | Verified emergency number        | Empty, explicitly unconfigured |
| `SUPPORT_PHONE`    | Institutional contact phone      | `+52 9371549923`               |
| `SUPPORT_URL`      | Institutional HTTPS support page | Empty                          |

The web equivalents are `VITE_INSTITUTION_NAME`, `VITE_EMERGENCY_PHONE`, `VITE_SUPPORT_PHONE`, and `VITE_SUPPORT_URL`. These provide offline/API-failure fallback contacts and must be kept aligned with verified server values. Never place secrets in `VITE_*` variables. `VITE_API_BASE_URL` defaults to `http://localhost:3001/api` in development and `/api` in production. Vite variables are read at build time. Invalid API responses are rejected by Zod; resources and help retain built-in local fallbacks with visible notices and retry controls.

## Commands

```sh
npm run dev           # Vite and Hapi watchers
npm run typecheck     # Strict TypeScript checks across all workspaces
npm run lint          # ESLint, including hook correctness
npm test              # Unit, API and React interaction tests
npm run test:e2e      # Real Chrome user flows; starts development servers
npm run test:e2e:production # The same user flows against the compiled Hapi-hosted app
npm run build         # Shared declarations, bundled API, production web assets
npm start             # Hapi serving both API and built SPA
npm run format        # Apply Prettier
npm run format:check  # Verify formatting without editing
```

The browser tests use the installed Google Chrome channel. If Chrome is unavailable, install Chrome or adjust `playwright.config.ts` to use an installed Playwright Chromium browser. No browser download is needed in the validated Windows environment. E2E output is ignored in `test-results/`; failures preserve traces and successful layout checks save screenshots.

## Production build and route refresh

Run `npm run build` and `npm start`, then visit `http://localhost:3001`. Hapi serves `apps/web/dist` and returns the SPA entry for frontend routes, so direct refresh works. API paths retain JSON errors. Do not deploy only the Vite files behind a server without an equivalent SPA fallback. The included server binds to loopback for this local MVP; external hosting requires deliberate host/TLS/reverse-proxy configuration.

## Route map

| Route                                 | Behavior                                                                    |
| ------------------------------------- | --------------------------------------------------------------------------- |
| `/`                                   | Wellness landing and six-module journey                                     |
| `/recursos`                           | Search, symptom/category filters and local fallback catalog                 |
| `/recursos/:resourceId`               | Article, review notice and related resources                                |
| `/evaluacion`                         | Consent, context, stress, thoughts, somatic/safety, optional vitals, review |
| `/evaluacion/resultado/:assessmentId` | Non-diagnostic orientation or urgent support                                |
| `/signos-vitales`                     | Optional local measurement CRUD and chronological history                   |
| `/mi-plan`                            | Latest user assessment plan, activities, editable goals and progress        |
| `/atencion`                           | Local virtual/in-person request simulation and history                      |
| `/institucional`                      | Demonstration role, aggregated charts, filters and labeled examples         |
| `/datos`                              | Export, validated preview, merge, backup-before-replace and reset           |
| `/privacidad`                         | Explicit local-data and role-switch limitations                             |
| `/accesibilidad`                      | Implemented accessibility behaviors, without certification claims           |
| `/ayuda`                              | Usage help and configurable urgent support                                  |
| `*`                                   | Recoverable not-found page                                                  |

## Data model and repository

One document, `ataraxia.database`, uses `schemaVersion: 1` and contains `profile`, `assessments`, `vitalSigns`, `plans`, `appointments`, `activityLogs`, and `preferences`. Exports add `exportedAt`. Business records and nested plan activities have UUIDs and ISO `createdAt`/`updatedAt` timestamps. Preferences hold the demonstration role and an optional in-progress assessment draft. Drafts are saved when advancing, returning to a previous step, or choosing save-and-exit; unsubmitted edits on the current step are not continuously autosaved.

Strict shared Zod schemas cover all domain models and import summaries. Every read, write and import is validated. Result values must agree with the corresponding demonstration answers. Values entered for vital signs are checked only for representation and broad input limits; these are not clinical normal ranges, and measurements never influence the score.

The repository provides initialization, read/save/reset, raw-value recovery, import and export. Shared pure functions implement merge, scoring, care-plan generation, demo seeding and dashboard aggregation. Missing keys initialize an empty database. Empty existing strings, corrupt JSON, invalid schemas and unsupported versions never silently reset: the recovery screen offers raw download, retry, support and an explicitly confirmed reset. Storage denial and quota failure produce visible errors and do not claim a successful save. The database is capped so formatted backups remain within the 2 MB portability limit.

Updates read the current document before committing, but this is not a transactional multiuser system. Avoid editing the same record concurrently in multiple tabs. Different browser profiles and origins have independent databases.

## Export, import and merge

- Export requires a sensitive-data warning and downloads readable JSON named `ataraxia-backup-YYYY-MM-DD.json` with version and export timestamp. UI drafts are omitted; business records and private notes are included. Files are not encrypted.
- Import accepts only `.json` files up to 2 MB, parses safely, rejects unknown schema versions and dangerous `__proto__`, `prototype`, or `constructor` keys recursively, and validates the entire document before showing record counts.
- Replace requires explicit confirmation and invokes the backup download before writing replacement data. If preparing the backup throws, replacement stops. Browsers do not expose a reliable confirmation that a user kept a downloaded file; the UI explicitly asks users to check the downloaded backup.
- Merge deduplicates each collection by `id`, preserves the greatest valid `updatedAt`, and keeps the local record on an exact timestamp tie. Duplicate IDs within an input are normalized by the same rule. Local preferences remain; profile conflicts use the same latest-update policy. Plan records are merged as whole records, with their activities deduplicated.
- Imported strings are rendered as text, never HTML or executable code. Import never sends the file to the API.

## Demonstration scoring and urgent rules

`packages/shared/src/logic.ts` isolates `scoringConfig` and `scoreAssessment`. Four frequency questions each contribute 0–3 points; each distinct selected somatic category contributes one point, for a maximum of 16. Scores 0–4 map to `low`, 5–9 to `moderate`, and 10–16 to `high`. An affirmative immediate-safety answer overrides every score with `urgent`. No numerical risk probability is shown. Optional vital measurements are excluded.

These thresholds and questions are arbitrary demonstration rules, not a validated instrument. They must be replaced only after professional review, clinical validation, and versioned migration planning. A low result cannot rule out a condition, and a high result cannot confirm one. Urgent support is accessible throughout the app and remains available after storage or API failure. No one is automatically contacted. Verified local emergency and institutional resources must be configured explicitly.

## API contract and lifecycle

- `GET /api/health`: availability and browser-storage architecture marker.
- `GET /api/config`: validated public institution/support configuration.
- `GET /api/resources`: illustrative preventive catalog.
- `GET /api/resources/{id}`: one resource or 404.
- `GET /api/emergency-resources`: configured support resources.
- `POST /api/import/validate`: optional stateless full-schema validation and counts; the frontend validates locally and does not call this route with user data automatically.

Hapi limits payloads to 2 MB, restricts CORS, returns safe centralized errors, and logs only method, route template and status. It never logs request payloads, import contents, answers, measurements, profile fields or notes. SIGINT/SIGTERM stop the server gracefully. The API deliberately has no persistence layer.

## Dashboard and privacy

The demonstration role switch is not authentication or authorization. The panel analyzes only the current browser database. It exposes aggregate orientation levels, time, symptom categories, faculty distribution, and recent summaries with date/faculty/orientation/source only. It never exposes record IDs, contact details, notes or full answers. Example records are fictitious, labeled, filterable, removable, and never preloaded silently. Counts are derived from actual records, including imports.

De-identification is not a guarantee against inference in small cohorts. The MVP is not suitable for deployment with real sensitive institutional data. Shared-device access, deletion of browser storage, plain-text exports and lack of real access controls are explicitly described in the UI. No regulatory compliance or security audit is claimed.

## UX and accessibility

Warm off-white surfaces, deep-teal text/actions, sage accents, restrained cards and an original water-inspired CSS hero follow the written light wellness reference. The six-module map is functional navigation, not a dark visual theme. Local system sans-serif and selective Georgia headings avoid external font requests.

Semantic landmarks, skip navigation, route focus, visible focus rings, labeled fields, described errors, native radio/checkbox controls, 44px targets, native modal dialogs with Escape/focus restoration, keyboard mobile navigation, reduced-motion support and text chart summaries support accessibility. Primary text/action colors are darker than the suggested decorative tokens for contrast. No formal certification is claimed; assistive-technology and institutional usability review remain necessary.

## Production evolution (not implemented)

Replace the repository adapter with authenticated API operations and server-side relational persistence. Add institution tenancy, real authorization, encryption/key management, audit trails, consent governance and retention policies. Commission clinical content/scoring review, safety testing, privacy and security assessment, and accessibility evaluation. Integrate real scheduling and notification services only with explicit institutional agreements. Mobile clients and faculty-specific content can consume the versioned shared contracts after those foundations exist. Keep secrets server-side and define verified location-specific urgent-support resources before launch.

## Local validation record

Validated on Windows with Node 22.23.2, npm 10.9.8 and installed Google Chrome. The production build, ESLint, strict type checking and Prettier checks pass. Vitest reports 46 passing tests in four files. Fourteen browser scenarios pass in development and the same fourteen pass against the compiled Hapi-hosted production app, including all frontend routes, direct navigation, assessment/back/resume/urgent flows, persisted plan progress and goal editing, vital CRUD, simulated request lifecycle, export/backup/replace/merge, corruption recovery, invalid imports/API responses, dashboard privacy and keyboard mobile navigation. Layout checks cover 320, 375, 768 and 1440 pixel widths. Primary action contrast is 5.90:1 against white; body secondary text is 5.60:1 against the page background; input borders exceed 3:1 against white. These focused checks are not formal accessibility certification.

The restricted execution environment initially blocked npm network access and writes by build/test tools. Those commands were rerun with approved local permissions; no unresolved startup restriction remains. The final dependency installation reports zero known vulnerabilities. No real `.env`, credential, external message, appointment or institutional transmission was created.
