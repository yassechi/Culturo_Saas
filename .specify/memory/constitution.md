<!--
SYNC IMPACT REPORT
==================
Version change: [TEMPLATE] → 1.0.0
Modified principles: None (initial ratification)
Added sections:
  - Core Principles (I–V)
  - Technical Constraints
  - Development Workflow
  - Governance
Templates requiring updates:
  - .specify/templates/plan-template.md ✅ aligned (Constitution Check section present)
  - .specify/templates/spec-template.md ✅ aligned (role-based stories, measurable criteria)
  - .specify/templates/tasks-template.md ✅ aligned (test-first task ordering)
Follow-up TODOs: None — all placeholders resolved.
-->

# Culturo Constitution

## Core Principles

### I. Centralized Rules Engine (NON-NEGOTIABLE)

The agronomic rules engine is the heart of the application.
It MUST be implemented as a single, isolated service/module — never duplicated across controllers, views, or helpers.

Rules enforced by the engine:
- Two primary botanical families MUST NOT coexist on the same bed in the same year.
- A primary family MUST NOT return to a bed where any other primary family was present within the last 5 years.
- Incompatible botanical associations MUST be flagged before any planting is confirmed.
- Seasonal planting windows MUST be validated for every crop assignment.
- Cover crop (engrais vert) and fallow (jachère) recommendations MUST be generated automatically based on nitrogen needs and cultivation intensity.

The engine MUST be independently testable in complete isolation from the database, API layer, and UI.
Every agronomic rule MUST have a dedicated automated test.
No rule logic may leak into controllers, components, or utilities.

### II. Role-Based Access Control

The application has exactly three roles with non-overlapping write permissions:

| Role      | Capabilities |
|-----------|-------------|
| Admin     | Full access: exploitations, users, beds, botanical catalog, system config |
| Formateur | Planning, rotation validation, trainee activity review, observation approval |
| Stagiaire | Read-only plan view, terrain observation entry |

Every API route MUST declare and enforce its required role via middleware.
No feature may be accessible without authentication.
Role escalation MUST require explicit admin action — no self-promotion.

### III. API-First Design

The backend exposes a documented RESTful API; the frontend is a pure consumer of it.
No business logic may reside in the frontend. All computation and validation happens server-side.

Rules:
- Every endpoint MUST be documented in Swagger before implementation.
- Request/response contracts are the source of truth for frontend–backend integration.
- The API MUST return structured, machine-readable errors (code + message) for all failure cases.
- Breaking API changes require a version increment and a migration path.

### IV. Test-First Development (NON-NEGOTIABLE)

Tests are written before implementation. The Red-Green-Refactor cycle is strictly enforced.

Mandatory coverage areas:
- All rules engine logic: 100% branch coverage required.
- All API endpoints: contract tests for happy paths and error paths.
- Role enforcement: integration tests for unauthorized access attempts.

Sequence: write test → confirm it fails → implement → confirm it passes → refactor.
Skipping this sequence requires explicit documented justification.

### V. Pedagogical Clarity

This application serves a training context (agricultural interns and their instructor).
Code and UX MUST be understandable by someone learning, not just by experts.

Requirements:
- Error messages MUST explain WHY a crop is rejected (e.g., "Brassicacées were on this bed in 2022 — minimum 5-year rotation required").
- Rule violations MUST display the specific rule and the historical data that triggered it.
- The codebase MUST favor readability over cleverness — complexity requires a comment explaining the agronomic reason.
- Every module MUST have a single, clear responsibility.
- Abstractions are introduced only when three concrete examples of the same pattern exist.

## Technical Constraints

The technical stack is locked for the duration of v1 development:

- **Backend**: NestJS (TypeScript strict mode) — no Express raw routes outside NestJS modules.
- **Frontend**: Vue.js 3 with Composition API and Pinia state management.
- **Database**: PostgreSQL — TypeORM for all data access; raw SQL only for complex reporting queries.
- **Authentication**: JWT with role claims — tokens issued by the backend, verified on every request.
- **API Documentation**: Swagger (OpenAPI 3) — auto-generated from NestJS decorators.
- **Containerization**: Docker Compose for local development; all environments use the same image.
- **Node.js**: v22 LTS.

Dependencies outside this stack MUST be approved before introduction.
No ORM bypass (direct DB client) for write operations.

## Development Workflow

All features follow the Spec Kit workflow in strict order:

1. `/speckit-specify` — define functional requirements (no implementation details)
2. `/speckit-clarify` — resolve ambiguities before any design
3. `/speckit-plan` — define technical architecture and contracts
4. `/speckit-tasks` — break plan into ordered, testable tasks
5. `/speckit-implement` — execute tasks following TDD

Feature branches are created per feature and merged via pull request.
No direct commits to `main` or `master`.
Each commit covers one logical unit of work; commit messages follow conventional commits format (`feat:`, `fix:`, `docs:`, `test:`, `chore:`).

Constitution Check gates in plan.md MUST be completed before implementation begins.

## Governance

This constitution supersedes all other development practices, README instructions, and informal conventions.

Amendment procedure:
1. Propose the amendment with rationale and impact assessment.
2. Update this file and increment the version (MAJOR/MINOR/PATCH per semantic versioning).
3. Propagate changes to affected templates and guidance files.
4. Record the amendment in the Sync Impact Report (HTML comment at top of this file).

Compliance review:
- Every pull request MUST verify adherence to the Rules Engine principle (I) and Role-Based Access (II).
- Violations MUST be resolved before merge — exceptions require documented justification in the PR.
- Architecture decisions that deviate from Technical Constraints MUST be recorded as ADRs.

**Version**: 1.0.0 | **Ratified**: 2026-04-19 | **Last Amended**: 2026-04-19
