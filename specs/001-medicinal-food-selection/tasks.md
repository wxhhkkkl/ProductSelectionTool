# Tasks: 药食同源电商选品工具

**Input**: Design documents from `/specs/001-medicinal-food-selection/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/components.md, quickstart.md

**Tests**: TDD is mandatory per Constitution Principle III and user directive. Test tasks MUST be completed and verified to FAIL before corresponding implementation tasks begin.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `- [ ] [ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Based on plan.md project structure — single project SPA with no backend:
- Source root: `js/`, `css/`, `index.html`
- Data files: `data/products/`
- Tests: `tests/unit/`, `tests/integration/`, `tests/e2e/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure — no functional code yet.

- [ ] T001 Create full project directory structure: `js/data/`, `js/engine/`, `js/ui/`, `js/utils/`, `css/`, `data/products/`, `tests/unit/`, `tests/integration/`, `tests/e2e/`
- [ ] T002 Initialize `package.json` with dev dependencies: vitest, @vitest/coverage-v8, playwright, jsdom (no runtime dependencies)
- [ ] T003 [P] Create CSS design tokens and reset in `css/reset.css` (CSS variables for colors, spacing, typography; box-sizing reset)
- [ ] T004 [P] Create sample product test fixture data in `tests/fixtures/products.json` (50 diverse products covering all 11 filter dimensions, all certification types, all dosage forms)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core data infrastructure that MUST be complete before ANY user story can be implemented.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

### Data Layer — Schema & Store

- [ ] T005 Implement product data schema definition and validation function `validateProduct()` in `js/data/schema.js` (enforce all field types, required fields, value ranges per data-model.md)
- [ ] T006 [P] Write unit tests for schema validation in `tests/unit/schema.test.js` — verify FAIL (TDD: test valid/invalid products, missing required fields, type errors, boundary values)
- [ ] T007 Implement IndexedDB DataStore in `js/data/store.js`: `init()`, `importProducts()`, `getAllIds()`, `getByIds()`, `getById()`, `getVersion()`, `clear()` — with all indexes defined per data-model.md
- [ ] T008 [P] Write unit tests for DataStore in `tests/unit/store.test.js` — verify FAIL (TDD: test init, import, query by id, query by ids with offset/limit, version tracking, empty state)
- [ ] T009 Implement DataLoader in `js/data/loader.js`: loads product JSON via `<script>` tag or inline assignment, validates each product via schema.js, bulk imports into DataStore, reports import stats (success/fail count)

### Utilities

- [ ] T010 [P] Implement localStorage wrapper in `js/utils/storage.js`: `saveFilterCriteria()`, `loadFilterCriteria()`, `clearFilterCriteria()` — with JSON serialization and error handling for corrupted data
- [ ] T011 [P] Implement DOM helper utilities in `js/utils/dom.js`: `createElement(tag, attrs, children)`, `clearContainer(el)`, `addClass/removeClass/toggleClass`, `on/delegate/trigger` event helpers
- [ ] T012 [P] Implement format utilities in `js/utils/format.js`: `formatPrice(n)`, `formatProfit(n)`, `formatSales(n)`, `formatDate(d)`, `formatCertificationLabel(key)`, `formatDosageFormLabel(key)` (Chinese labels)
- [ ] T013 [P] Write unit tests for format utilities in `tests/unit/format.test.js` — verify FAIL (TDD: test price formatting, profit percentage, sales amount, Chinese enum label mappings)

### Base UI Shell

- [ ] T014 Create `index.html` with base structure: header (logo + title), sidebar placeholder (filter panel area), main content area (product list), detail overlay placeholder, compare overlay placeholder; load all JS files via `<script>` tags in dependency order
- [ ] T015 [P] Create global layout styles in `css/layout.css`: CSS Grid layout (sidebar 280px + main flex), header height, overlay z-index layers, scrollbar styling
- [ ] T016 [P] Create component base styles skeleton in `css/components.css`: filter panel section styles, card/list item styles, detail panel styles, compare table styles, search bar styles

**Checkpoint**: Foundation ready — DataStore, utilities, and shell UI operational. User story implementation can now begin.

---

## Phase 3: User Story 1 — 多维度筛选浏览产品 (Priority: P1) 🎯 MVP

**Goal**: 用户可通过11个维度组合筛选产品，关键词搜索，排序浏览结果列表。

**Independent Test**: 打开应用 → 选择筛选条件（如"中老年+胶囊+中端价格+蓝帽认证"）→ 列表实时更新显示匹配产品。可在无网络下完成全流程。

### Tests for User Story 1 — WRITE FIRST, ensure they FAIL ⚠️

- [ ] T017 [P] [US1] Write unit tests for FilterEngine in `tests/unit/filter.test.js` — verify FAIL (TDD: test single dimension filter, multi-dimension intersection, empty result, all-match, enum values, range queries)
- [ ] T018 [P] [US1] Write unit tests for SearchEngine in `tests/unit/search.test.js` — verify FAIL (TDD: test exact name match, partial brand match, no results, multi-byte Chinese characters, case insensitive)
- [ ] T019 [P] [US1] Write unit tests for SortEngine in `tests/unit/sort.test.js` — verify FAIL (TDD: test sort by sales desc, price asc, price desc, profit desc, tie-breaking behavior)
- [ ] T020 [P] [US1] Write integration test for filter-to-list flow in `tests/integration/filter-to-list.test.js` — verify FAIL (TDD: test FilterEngine output → ProductList renders correct items, multi-dimension combination, filter clear restores full list)
- [ ] T021 [P] [US1] Write integration test for search-to-list flow in `tests/integration/search-to-list.test.js` — verify FAIL (TDD: test SearchEngine → ProductList, search + filter combo, debounce behavior)

### Engine Implementation

- [ ] T022 [US1] Implement FilterEngine in `js/engine/filter.js`: `buildIndex(productIds, getProductMeta)` — build in-memory inverted index for all 11 dimensions; `filter(criteria)` — intersect dimension sets, return matched IDs; `getDimensionValues(dimension, currentIds)` — return available values with counts for filter panel
- [ ] T023 [P] [US1] Implement SearchEngine in `js/engine/search.js`: `buildIndex(products)` — build search trie/prefix index over name + brand; `search(query)` — substring match, return scored IDs
- [ ] T024 [P] [US1] Implement SortEngine in `js/engine/sort.js`: `sort(productIds, sortBy, products)` — sort by sales_desc, price_asc, price_desc, profit_desc; handle null sales values (push to bottom)

### UI Implementation

- [ ] T025 [US1] Implement FilterPanel component in `js/ui/filter-panel.js`: render 11 dimension groups (functionCategory, targetPopulation, efficacyLevel, dosageForm, priceRange, profitRange, certification, manufacturerType, salesChannel, origin, packaging); multi-select checkboxes for enum dimensions; range sliders for price/profit; dynamic option counts; reset button; emit `onChange` callback
- [ ] T026 [P] [US1] Implement SearchBar component in `js/ui/search-bar.js`: input field with search icon; 300ms debounce; clear button; emit `onSearch` callback
- [ ] T027 [US1] Implement ProductList component in `js/ui/product-list.js`: virtual scrolling (render only visible + buffer rows); product card template (name, brand, dosageForm, priceMin, targetPopulation tags, certification badge); compare checkbox per row; `setProductIds(ids)`, `onItemClick`, `onCompareSelectionChange` callbacks; sort dropdown (销量/价格↑/价格↓/利润) per FR-014
- [ ] T028 [US1] Create product list and card styles in `css/components.css`: card grid/list layout, hover states, certification badge colors, price formatting, tag chips styling, compare checkbox positioning

### App Controller — US1 Integration

- [ ] T029 [US1] Implement App controller initial wiring in `js/app.js`: init DataStore → build FilterEngine/SearchEngine indexes → render FilterPanel + SearchBar + ProductList → handle filter/search/sort changes → update ProductList → persist FilterCriteria to localStorage → restore saved criteria on reload; handle empty data edge case (friendly message per spec)

### E2E Acceptance

- [ ] T030 [US1] Write E2E test for US1 browse & filter journey in `tests/e2e/us1-browse-filter.spec.js` — verify FAIL, then PASS after implementation complete: test open app → see product list → apply filter → verify filtered results → clear filter → verify full list restored → search by keyword → verify search results → sort by price

**Checkpoint**: At this point, User Story 1 should be fully functional — a user can open index.html, browse all products, filter by any combination of 11 dimensions, search by keyword, sort results, and see updated filter option counts. All unit + integration + E2E tests pass.

---

## Phase 4: User Story 2 — 查看产品详细信息 (Priority: P2)

**Goal**: 用户点击产品后查看完整详情：厂家、销售额、挂网链接、疗效、规格等全方位信息。

**Independent Test**: 在产品列表中点击任一产品 → 详情面板展示全部信息。除打开挂网链接外可离线验证。

### Tests for User Story 2 — WRITE FIRST, ensure they FAIL ⚠️

- [ ] T031 [P] [US2] Write integration test for detail panel in `tests/integration/detail-panel.test.js` — verify FAIL (TDD: test click product → detail panel shows with all fields, multiple listing URLs display, close restores filter state, null sales data shows "暂无数据" label)

### Implementation

- [ ] T032 [US2] Implement ProductDetail component in `js/ui/product-detail.js`: full detail view layout — header (name + brand + certification badge), body sections (basic info: dosageForm/specification/packaging/origin, market info: price range/profit/sales with data type label, efficacy: efficacyLevel + description, target population tags, function categories, listing URLs table with platform name + URL link + collected date), close button; `show(product)`, `hide()`, `onClose` callback
- [ ] T033 [US2] Implement product detail styles in `css/components.css`: detail overlay positioning, section dividers, data labels vs values layout, listing URL link styling, certification badge, null data placeholder styling
- [ ] T034 [US2] Wire ProductDetail into App controller in `js/app.js`: handle ProductList `onItemClick` → DataStore.getById() → ProductDetail.show(); handle close → hide panel, preserve filter state per acceptance scenario

### E2E Acceptance

- [ ] T035 [US2] Write E2E test for US2 product detail journey in `tests/e2e/us2-product-detail.spec.js` — verify FAIL, then PASS: test browse list → click product → verify detail panel shows all fields → verify listing URLs have platform labels and dates → click listing URL opens new tab → close detail → verify filter state preserved

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently — filtering + detail drill-down complete.

---

## Phase 5: User Story 3 — 利润空间分析与产品对比 (Priority: P3)

**Goal**: 用户选择2-4个产品并列对比，可量化维度自动标注优劣。

**Independent Test**: 勾选2-4个产品 → 点击对比 → 查看并列对比表，含优劣标注。

### Tests for User Story 3 — WRITE FIRST, ensure they FAIL ⚠️

- [ ] T036 [P] [US3] Write integration test for compare view in `tests/integration/compare.test.js` — verify FAIL (TDD: test 2-product compare, 4-product compare, single product shows error hint, quantifiable dimensions highlighted (price: lower→green, profit: higher→green, sales: higher→green), non-quantifiable dimensions neutral display, close preserves selection)

### Implementation

- [ ] T037 [US3] Implement CompareView component in `js/ui/compare-view.js`: render comparison table — header row (product name + brand per column), data rows grouped (价格信息: priceMin/priceMax with highlighting, 利润: profitMargin with highlighting, 销量: referenceSales with highlighting, 基本信息: dosageForm/specification/packaging, 功效: efficacyLevel/functionCategory, 认证: certification, 厂家/渠道: manufacturerType/salesChannel/origin); quantifiable dimension highlighting per FR-022 (green for better value); `show(products)`, `hide()`, `onClose`, `onViewDetail` callbacks; "at least 2 products needed" message for single selection
- [ ] T038 [US3] Implement comparison table styles in `css/components.css`: responsive table layout (2-4 columns), winner highlight (green background + bold), dimension row labels, sticky first column, mobile horizontal scroll for 3-4 products
- [ ] T039 [US3] Wire CompareView into App controller in `js/app.js`: handle ProductList `onCompareSelectionChange` → enable/disable compare button; handle compare button click → validate 2-4 selection → DataStore.getByIds() → CompareView.show(); handle CompareView `onViewDetail` → show ProductDetail for that product; handle close → preserve compare selection state per acceptance scenario

### E2E Acceptance

- [ ] T040 [US3] Write E2E test for US3 compare journey in `tests/e2e/us3-compare.spec.js` — verify FAIL, then PASS: test select 2 products → click compare → verify comparison table → verify price/profit/sales highlighted → select 4 products → verify 4-column layout → click "view detail" from compare → verify detail panel → close detail → verify still in compare → test single product compare blocked

**Checkpoint**: All three user stories now independently functional. Full user journey: filter → browse → detail → compare complete.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Quality improvements that affect multiple user stories.

- [ ] T041 [P] Create responsive breakpoints and mobile layout in `css/responsive.css`: @media queries for tablet (<1024px: stacked sidebar), mobile (<768px: filter as collapsible drawer, single-column cards, compare table horizontal scroll)
- [ ] T042 [P] Add edge case UI handling in `js/app.js`: empty data state (friendly message + data update instructions), zero filter results (suggestion to relax criteria), corrupted localStorage data (graceful fallback to defaults), stale data version detection
- [ ] T043 Run full test suite (`npx vitest run --coverage`) and verify ≥80% branch coverage; add supplementary tests if any module falls below threshold
- [ ] T044 [P] Performance verification: test with 100k+ product dataset, verify SC-001 (<5s initial load), SC-002 (<500ms filter response), SC-004 (<300ms search), SC-005 (<500ms detail), SC-007 (<1s compare render); optimize if thresholds not met
- [ ] T045 [P] Browser compatibility verification: test `index.html` opened via `file://` protocol in Chrome 90+, Edge 90+, Firefox 90+, Safari 15+; verify all core functionality works offline
- [ ] T046 Run quickstart.md validation: follow quickstart instructions from scratch, verify `file://` double-click open works, verify `npx vitest` TDD cycle works, verify all SC thresholds met

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup (T001-T004) — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational phase — MVP
- **User Story 2 (Phase 4)**: Depends on US1 (ProductList + App controller must exist)
- **User Story 3 (Phase 5)**: Depends on US1 + US2 (ProductList compare checkbox + ProductDetail)
- **Polish (Phase 6)**: Depends on all desired user stories

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2). No dependencies on other stories. **MVP delivery point.**
- **User Story 2 (P2)**: Depends on US1 completion — needs ProductList.onItemClick and App controller wiring.
- **User Story 3 (P3)**: Depends on US1 (ProductList compare checkboxes) and US2 (ProductDetail for drill-down from compare).

### Within Each User Story

- Tests (TDD) MUST be written and verified to FAIL before implementation
- Engines before UI components (engines are used by UI)
- UI components before App controller wiring
- All implementation tasks before E2E test implementation (E2E validates the complete flow)

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Within US1: T017-T021 (5 test files) can all be written in parallel → all FAIL → T022-T024 (3 engines) can run in parallel → T025-T027 (3 UI components) T025 then T026+T027 in parallel → T028 CSS → T029 App wiring → T030 E2E
- US2 tests (T031) and US3 tests (T036) could theoretically be written ahead of time, but must FAIL and only pass after their respective implementations
- Phase 6 tasks T041, T042, T044, T045 are all [P] and independent
- Different user stories cannot truly run in parallel due to dependency chain (US1 → US2 → US3)

---

## Parallel Example: User Story 1

```bash
# Step 1: Launch all US1 tests together (TDD — all must FAIL first):
Task: "Write unit tests for FilterEngine in tests/unit/filter.test.js"
Task: "Write unit tests for SearchEngine in tests/unit/search.test.js"
Task: "Write unit tests for SortEngine in tests/unit/sort.test.js"
Task: "Write integration test for filter-to-list in tests/integration/filter-to-list.test.js"
Task: "Write integration test for search-to-list in tests/integration/search-to-list.test.js"

# Step 2: Launch all US1 engines together (make tests PASS):
Task: "Implement FilterEngine in js/engine/filter.js"
Task: "Implement SearchEngine in js/engine/search.js"
Task: "Implement SortEngine in js/engine/sort.js"

# Step 3: Launch UI + CSS together:
Task: "Implement FilterPanel in js/ui/filter-panel.js"
Task: "Implement SearchBar in js/ui/search-bar.js"
Task: "Implement ProductList in js/ui/product-list.js"
Task: "Create product list/card styles in css/components.css"

# Step 4: Sequential (dependencies):
Task: "Implement App controller in js/app.js" (depends on all above)
Task: "Write E2E test for US1" → verify FAIL → PASS
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Open `index.html` via `file://`, test filtering/searching/sorting with sample data
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready (data can be loaded and stored)
2. Add User Story 1 → Filter, search, sort, browse → **MVP!** Independent value delivery
3. Add User Story 2 → Click any product to see full details → Enhanced value
4. Add User Story 3 → Compare 2-4 products with winner highlighting → Complete tool
5. Polish → Responsive, performance verified, browser-compatible → Production ready

### TDD Rhythm

For every implementation task:
```
1. Write test → `npx vitest` → 🔴 FAIL
2. Write minimum code → `npx vitest` → 🟢 PASS
3. Refactor → `npx vitest` → 🟢 still PASS
4. Commit
```

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- TDD mandatory: tests written first, verified FAIL, then implement
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Core functionality works offline (except opening external listing URLs)
- Vanilla JavaScript only — no framework imports
- All scripts use traditional `<script>` tags (not ES Modules) for `file://` compatibility
