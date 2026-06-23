<!--
  Sync Impact Report
  ==================
  Version change: 1.0.0 → 1.1.0 (MINOR — new Architecture Constraints section + materially expanded guidance for SPA/zero-backend/TDD context)
  Modified principles:
    - II. Modular Architecture → refined for frontend component modularity
    - III. Test-First → reinforced TDD emphasis per user directive
  Added sections:
    - Architecture Constraints (zero-backend SPA, static deployment, embedded data, browser storage only)
  Removed sections: None
  Renamed sections:
    - "Data Integrity & Security" → "Data Integrity & Privacy"
  Templates requiring updates:
    - .specify/templates/plan-template.md ✅ No changes needed (Technical Context is dynamic, Constitution Check is generic)
    - .specify/templates/spec-template.md ✅ No changes needed (mandatory sections align)
    - .specify/templates/tasks-template.md ✅ No changes needed (path conventions cover SPA structure)
    - .specify/templates/checklist-template.md ✅ No changes needed (generic template)
  Follow-up TODOs: None
-->

# ProductSelectionTool Constitution

## Core Principles

### I. Data-Driven Decisions

Every product comparison, ranking, or recommendation MUST be backed by transparent,
traceable data bundled within the application. Decision logic MUST be inspectable —
no black-box algorithms without documented rationale. Product attributes used in
selection MUST have clearly defined sources embedded in the application data.
Selection criteria weighting MUST be visible and adjustable by the user.

**Rationale**: A product selection tool derives its value from trust. Users must be
able to understand why a product was recommended and inspect the underlying data
directly in the browser.

### II. Modular Frontend Architecture

Each UI capability — filtering, sorting, comparison view, ranking display, data
table — MUST be implemented as a self-contained, independently testable module.
Components MUST have clear contracts (props/events or equivalent interface) and
MUST be replaceable without cascading changes. New product categories or comparison
dimensions MUST be addable without modifying core selection logic.

**Rationale**: Evolving product domains and comparison criteria demand composable
UI. Modular components enable independent development, testing, and refinement of
each selection feature.

### III. Test-First (NON-NEGOTIABLE)

TDD is mandatory per user directive: tests MUST be written before implementation,
MUST be verified to fail against current code, and only then MUST implementation
proceed. Every module MUST achieve minimum 80% branch coverage. Tests MUST run in a
browser or browser-equivalent environment (jsdom, Playwright, or similar).
Acceptance tests MUST cover complete user journeys through the product selection
flow.

**Rationale**: Product selection logic is correctness-critical — a bad
recommendation erodes user trust irreversibly. TDD is the strongest guard against
regression in comparison and ranking logic. Browser-environment testing ensures
real-world fidelity.

### IV. User-Centric Design

Every feature MUST originate from a documented user scenario with clear acceptance
criteria. Features without a user story in spec.md MUST NOT be implemented.
Priorities (P1, P2, P3) MUST reflect actual user impact, not technical convenience.
The UI MUST remain intuitive when opened as a plain HTML file — no assumptions
about server-side routing or API availability.

**Rationale**: The tool exists to serve users making real purchasing decisions.
Feature scope is defined by user need, not by what is technically interesting. The
experience must work from the moment the file is opened.

### V. Simplicity & YAGNI

Start with the simplest solution that satisfies current requirements. Resist adding
frameworks, build toolchains, or abstractions "just in case." Vanilla HTML/CSS/JS
is the default; any framework dependency MUST be explicitly justified in the
Constitution Check. If a simpler alternative was rejected, the rationale MUST be
documented.

**Rationale**: A zero-dependency or minimal-dependency app opens instantly, works
offline, and has zero maintenance overhead from dependency churn. Complexity is
adopted only when the need is proven.

## Architecture Constraints

This project is a **pure HTML5 single-page application** with the following
non-negotiable constraints:

- **Zero Backend**: The application MUST contain no server-side code. All logic
  executes entirely in the user's browser.
- **Static Deployment**: The application MUST function when opened as a `file://`
  URL or served from any static file host. No application server, no server-side
  rendering, no API endpoints.
- **Embedded Data**: All product data MUST be bundled with the application (inline
  JSON, static data files, or equivalent). No runtime network requests for core
  product data.
- **Browser Storage Only**: User preferences, saved comparisons, and application
  state MUST be persisted exclusively via browser-local storage APIs
  (localStorage, IndexedDB). No data leaves the user's browser.
- **Offline Capable**: The application MUST be fully functional without a network
  connection after initial load.
- **No Build Required for Use**: A build step MAY exist for development (testing,
  linting, minification) but the application MUST be usable by opening the HTML
  file directly in a browser without any compilation.

**Rationale**: These constraints ensure the tool is instantly accessible,
privacy-respecting, and deployable anywhere — a USB drive, a static site host, or
a local download. Zero backend means zero server costs, zero latency, and zero
data exfiltration risk.

## Data Integrity & Privacy

Product data bundled with the application MUST be validated against a defined
schema at build time or application load time. Data inconsistencies MUST be
detected and reported during development, never silently at runtime.

Comparison algorithms MUST be deterministic: given the same input data and user
preferences, the same output MUST be produced. Non-deterministic behavior (e.g.,
randomized tie-breaking) MUST be explicitly documented and user-configurable.

User-provided data (preferences, filters, saved comparisons) stays exclusively in
the browser. The application MUST NOT transmit any user data over the network.
This is a privacy guarantee, not merely a design preference. Any analytics or
telemetry (if ever added) MUST be opt-in, explicitly disclosed, and never include
product selection or preference data.

## Development Workflow

All features follow the SpecKit workflow: **Specify → Clarify → Plan → Tasks →
Implement**. Each phase produces artifacts reviewed before the next phase begins.

- **Specification** (`/speckit-specify`): Feature spec with user stories and
  acceptance criteria.
- **Clarification** (`/speckit-clarify`): Resolve ambiguities before planning.
- **Planning** (`/speckit-plan`): Technical design with Constitution Check gate.
- **Tasks** (`/speckit-tasks`): Dependency-ordered, testable work items grouped by
  user story.
- **Implementation** (`/speckit-implement`): Execute tasks, verify tests pass
  (red-green-refactor per Principle III).

Code review is mandatory before merging any feature branch. The review MUST verify
Constitution compliance — especially Architecture Constraints and test coverage —
and adherence to the approved plan.

## Governance

This Constitution supersedes all other development practices and conventions.
Amendments require:

1. A documented proposal explaining the change and its rationale.
2. Review of impact on all dependent templates (plan, spec, tasks, checklist).
3. Version increment per semantic versioning:
   - **MAJOR**: Principle removal or backward-incompatible redefinition.
   - **MINOR**: New principle or section added, or materially expanded guidance.
   - **PATCH**: Clarifications, wording fixes, non-semantic refinements.
4. Propagation of changes to all affected templates and guidance documents.

Compliance is verified at the Constitution Check gate in every implementation plan.
Violations that cannot be resolved MUST be documented with justification in the
plan's Complexity Tracking table.

**Version**: 1.1.0 | **Ratified**: 2026-06-23 | **Last Amended**: 2026-06-23
