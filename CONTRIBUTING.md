# Contributing to RevivePay AI

Thank you for your interest in contributing. This document provides comprehensive guidelines for contributing code, tests, and documentation to the RevivePay AI — Revenue Recovery Agent.

---

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Project Structure](#project-structure)
4. [Development Workflow](#development-workflow)
5. [Coding Standards](#coding-standards)
6. [Testing Guidelines](#testing-guidelines)
7. [Pull Request Process](#pull-request-process)
8. [Domain Module Conventions](#domain-module-conventions)
9. [AI Module Contributions](#ai-module-contributions)

---

## Code of Conduct

This project adheres to a standard of professional, constructive collaboration. All contributors are expected to:
- Provide specific, actionable feedback in code reviews.
- Justify architectural changes with reasoning documented in `DECISION.md`.
- Never commit credentials, API keys, or personally identifiable information.
- Write code that a future engineer can maintain without the original author's context.

---

## Getting Started

### Prerequisites

| Tool        | Version   | Notes                                   |
|-------------|-----------|-----------------------------------------|
| Node.js     | `>= 20.x` | Use `nvm` for version management        |
| PostgreSQL  | `>= 15`   | Or use the provided Docker Compose stack |
| Docker      | `>= 24`   | Required for the full container stack   |
| Git         | Any       | Use conventional commits (see below)    |

### Local Setup

```bash
# 1. Clone the repository
git clone https://github.com/your-org/ai-revenue-recovery.git
cd ai-revenue-recovery

# 2. Start the database
docker compose up postgres -d

# 3. Configure environment variables
cp server/.env.example server/.env
# Edit server/.env and add your GEMINI_API_KEY

cp client/.env.local.example client/.env.local

# 4. Install all dependencies
cd server && npm install
cd ../client && npm install

# 5. Initialize the database
cd server
npx prisma migrate dev
npx prisma db seed     # Seeds demo merchants, customers, transactions

# 6. Start development servers
# Terminal 1 — Backend API
cd server && npm run dev

# Terminal 2 — Frontend Dashboard
cd client && npm run dev
```

Visit `http://localhost:3000` for the dashboard and `http://localhost:4000/api-docs` for the Swagger API explorer.

---

## Project Structure

```
ai-revenue-recovery/
├── server/                         # Node.js / Express / TypeScript backend
│   ├── src/
│   │   ├── modules/                # Domain-driven modules (one per domain)
│   │   │   ├── ai-strategy-engine/ # Gemini AI integration
│   │   │   ├── policy-engine/      # Deterministic rule validation
│   │   │   ├── recovery-orchestrator/ # Core pipeline coordinator
│   │   │   ├── simulate/           # Scenario simulation engine
│   │   │   └── ...                 # Other domain modules
│   │   ├── lib/                    # Shared utilities (Prisma client, etc.)
│   │   └── config/                 # Swagger, environment config
│   └── prisma/                     # Schema, migrations, seed data
│
├── client/                         # Next.js 15 / TypeScript frontend
│   └── src/
│       ├── app/                    # Next.js App Router pages
│       ├── components/             # Shared UI components
│       └── lib/                    # API client, types, utilities
│
├── docker-compose.yml              # Full-stack container orchestration
├── ARCHITECTURE.md                 # System architecture and design diagrams
├── DECISION.md                     # Architectural Decision Records (ADRs)
├── AI_USAGE.md                     # AI model usage, guardrails, and transparency
├── SCOPE.md                        # Project scope and boundaries
└── WORKFLOWS.md                    # Recovery pipeline workflow documentation
```

---

## Development Workflow

### Branch Naming Convention

```
feat/<short-description>     # New features
fix/<short-description>      # Bug fixes
refactor/<short-description> # Refactoring without behavior change
docs/<short-description>     # Documentation updates
chore/<short-description>    # Build, tooling, dependency updates
```

### Commit Message Format

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(scope): <short imperative description>

[Optional body explaining WHY, not WHAT]

[Optional footer: Breaking changes, issue references]
```

**Examples:**
```
feat(simulate): add subscription plan selector to scenario form
fix(api): register /simulate route in Express app router
refactor(policy-engine): extract cooldown logic into separate validator
docs(ai-usage): document layer-3 policy guardrails
```

---

## Coding Standards

### TypeScript

- **Strict mode** is enabled. Do not use `any` — use `unknown` with type narrowing.
- All exported functions must have explicit return type annotations.
- Use `interface` for data shapes; use `type` for unions and intersections.
- Prefer named exports over default exports for modules (exceptions: Next.js page components).

### Backend (Express/TypeScript)

Each domain module must follow this file structure:
```
modules/<domain>/
├── <domain>.controller.ts   # Request parsing, response formatting
├── <domain>.service.ts      # Business logic, NO HTTP concerns
├── <domain>.routes.ts       # Router + Swagger JSDoc annotations
└── <domain>.types.ts        # (Optional) Module-specific types
```

**Controllers** are thin — they parse `req.body`, call the service, and format the response. Business logic belongs in the **service**.

### Frontend (Next.js/TypeScript)

- All pages must use the `"use client"` directive if they use React state or effects.
- API calls must go through `src/lib/api.ts` — **never** call `fetch()` directly in a component.
- Inline styles are acceptable for this project (avoids the need for class name mapping). Prefer CSS variables from the design system.
- Components receiving more than 3 props should define a `Props` interface.

### Error Handling

**Backend:** All service functions should throw typed errors with descriptive messages. Controllers catch these and return structured JSON:
```json
{ "error": "Merchant not found: <id>" }
```

**Frontend:** All `api.*` calls must be wrapped in `try/catch`. Never let an unhandled rejection propagate to the UI without user feedback.

---

## Testing Guidelines

> The project currently uses manual testing via the Scenario Simulator (`/simulate`) and Swagger (`/api-docs`). Automated test contributions are welcomed.

### Recommended Test Scope

| Layer           | Test Type          | Tool              |
|-----------------|--------------------|-------------------|
| Service logic   | Unit tests         | Vitest or Jest    |
| API endpoints   | Integration tests  | Supertest         |
| Policy Engine   | Unit tests         | Jest (deterministic, no mocking needed) |
| AI Strategy     | Unit tests         | Jest + mock `@google/genai` |
| Frontend pages  | E2E tests          | Playwright        |

### Running Tests

```bash
# Backend unit tests (when available)
cd server && npm test

# Frontend E2E tests (when available)
cd client && npm run test:e2e
```

---

## Pull Request Process

1. **Create a feature branch** from `main`.
2. **Write or update tests** for changed behaviour.
3. **Run type checks** before submitting:
   ```bash
   cd server && npm run typecheck
   ```
4. **Verify the simulator works end-to-end** on your branch by running a scenario through `/simulate`.
5. **Submit a Pull Request** with:
   - A concise description of **what** changed and **why**.
   - A link to any related issue.
   - Screenshots or recordings for UI changes.
6. **Address review feedback** — PRs require at least one approving review before merge.
7. **Squash and merge** is the preferred merge strategy to keep the git history clean.

---

## Domain Module Conventions

When adding a new domain module:

1. Create the directory: `server/src/modules/<domain>/`
2. Follow the controller/service/routes file structure.
3. Register the router in `server/src/app.ts`.
4. Add Swagger JSDoc comments to the routes file.
5. Add the corresponding API client methods to `client/src/lib/api.ts`.
6. Export any new TypeScript interfaces from `client/src/lib/types.ts`.

---

## AI Module Contributions

The AI Strategy Engine is the most security-sensitive module. Changes must:

1. **Never grant the AI new tool-use capabilities** — it must remain a stateless text-in/text-out function.
2. **Bump the prompt version** (e.g., `v2`) when the system prompt changes, so audit events remain traceable.
3. **Add the new version to `AI_USAGE.md`** with an explanation of what changed and why.
4. **Test all six decision types** by running batch simulations through the Batch Runner (`/batch`) to verify the new prompt produces valid JSON for all event types.
5. **Document any new output fields** in `AI_USAGE.md` and update the type definitions accordingly.

> If a contribution changes the AI's output schema, it must also update the Policy Engine's validation logic. These two components are coupled by contract, not by code.
