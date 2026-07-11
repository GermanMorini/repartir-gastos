<!--
Sync Impact Report
Version change: template -> 1.0.0
Modified principles:
- PRINCIPLE_1_NAME placeholder -> I. Monetary Logic Is Pure and Centralized
- PRINCIPLE_2_NAME placeholder -> II. Decimal Money Only
- PRINCIPLE_3_NAME placeholder -> III. Shared Logic, Separate Layouts
- PRINCIPLE_4_NAME placeholder -> IV. shadcn/Radix First
- PRINCIPLE_5_NAME placeholder -> V. Shared Views Are Read-Only
Added sections:
- Project Constraints
- Development Workflow and Quality Gates
Removed sections:
- None
Templates requiring updates:
- ✅ .specify/templates/plan-template.md
- ✅ .specify/templates/spec-template.md
- ✅ .specify/templates/tasks-template.md
- ✅ .specify/templates/commands/*.md (directory absent)
- ✅ README.md reviewed; not edited because runtime guidance already aligns and user did not request README changes
Follow-up TODOs:
- None
-->

# Repartir Gastos Constitution

## Core Principles

### I. Monetary Logic Is Pure and Centralized

All monetary behavior MUST live in deterministic pure functions under `src/lib`
or an equally explicit business-logic module. This includes expense splitting,
registered payments, pending transfers, per-person summaries, calculation
matrices, category totals, and any derived balance. React components MAY parse
form input and render formatted output, but MUST NOT contain business formulas
for balances or settlements. Every change to these functions MUST be covered by
focused tests using realistic shared-expense cases.

### II. Decimal Money Only

Monetary arithmetic MUST use `decimal.js` or a shared decimal helper. Raw
JavaScript `number` arithmetic MUST NOT be used to calculate money, cents,
percentages that derive from money, balances, or settlements. Serialized app
state and UI props MAY expose numbers for compatibility with browser storage,
forms, charts, and formatting, but calculations MUST convert values to Decimal
before arithmetic and round only at defined output boundaries.

### III. Shared Logic, Separate Layouts

Mobile and desktop MUST share domain logic, storage, validation rules, and data
types, but their layouts MUST remain separate when their interaction models
differ. Desktop shell changes MUST NOT regress the mobile bottom-navigation
flow, and mobile changes MUST NOT force desktop to reuse cramped mobile
structure. Shared components are encouraged only when they do not duplicate
state or hide divergent behavior behind confusing conditionals.

### IV. shadcn/Radix First

Before creating manual UI primitives, implementation MUST check existing local
shadcn/Radix wrappers in `src/components/ui.tsx`. If a matching primitive
exists, it MUST be reused. If a missing primitive is needed, the preferred path
is to add or extend a local wrapper around the shadcn/Radix primitive before
building custom interaction logic. Manual components are acceptable only for
app-specific composition, not for reimplementing standard dialogs, sheets,
tables, selects, scroll areas, accordions, badges, buttons, or tooltips.

### V. Shared Views Are Read-Only

The shared summary route (`#/share/...`) MUST be read-only. It MAY decode source
data, recalculate derived summaries, display details, navigate within the shared
view, and copy/share links or text. It MUST NOT write to `localStorage`, hydrate
the editable app with shared data, expose edit/delete/clear actions, or mutate
the payload. Any feature touching shared views MUST verify that editable and
shared flows stay separated.

## Project Constraints

- The app remains a single static React/Vite application deployable to GitHub
  Pages. No backend or account system is part of the core architecture.
- Persisted editable data lives in browser `localStorage` through the storage
  boundary in `src/lib/storage.ts`.
- Categories, storage keys, share encoding, formatting helpers, and export
  helpers MUST stay centralized in `src/lib` or feature-local modules.
- New styles MUST NOT be added to `src/index.css`. Component or feature changes
  MUST use a specific CSS file imported by that component or use scoped
  Tailwind/className utilities. `src/index.css` is reserved for theme variables,
  base rules, and existing global primitives.
- Shared data models MUST remain minimal. Do not add fields that are not used by
  the app's current source data model.

## Development Workflow and Quality Gates

- Before large changes, inspect the relevant repo structure, component
  boundaries, calculation functions, storage, and CSS ownership.
- Plans and tasks MUST explicitly state whether the work touches monetary
  logic, mobile/desktop layout separation, shared read-only views, shadcn/Radix
  primitives, or CSS ownership.
- Monetary changes MUST update or add tests in the existing test path before
  final verification.
- UI changes MUST preserve existing mobile and desktop behavior unless the
  requested feature explicitly changes one of them.
- Before finalizing implementation work, `pnpm test` and `pnpm build` MUST run
  successfully. Any inability to run them MUST be reported with the reason.

## Governance

This constitution supersedes conflicting local habits, implementation plans,
and generated tasks. Amendments MUST update this file, include a Sync Impact
Report, choose a semantic version bump, and propagate changed rules to affected
spec-kit templates.

Versioning policy:
- MAJOR for incompatible governance changes or removal/redefinition of a core
  principle.
- MINOR for a new principle, a new required section, or materially expanded
  mandatory guidance.
- PATCH for clarifications that do not change required behavior.

Compliance review is mandatory for every feature plan and implementation
handoff. Violations MUST be documented in the plan's Complexity Tracking
section with a concrete reason and rejected simpler alternative.

**Version**: 1.0.0 | **Ratified**: 2026-07-11 | **Last Amended**: 2026-07-11
