# Research Report: 药食同源电商选品工具

**Feature**: 001-medicinal-food-selection
**Date**: 2026-06-23
**Purpose**: Resolve all Technical Context unknowns and document key architectural decisions.

## Decision 1: Vanilla JavaScript — 零运行时框架

**Decision**: 使用纯 JavaScript (ES2020+) 开发，不引入 React/Vue/Angular 等框架。

**Rationale**:
- Constitution 明确要求"Vanilla HTML/CSS/JS is the default"，任何框架依赖须在 Constitution Check 中显式证明
- 应用功能模式清晰（列表→筛选→详情→对比），不需要框架级状态管理或路由
- 零框架意味着零运行时依赖体积、零构建步骤要求，直接符合"file:// 可用"约束
- 10万+数据场景的性能瓶颈在数据结构（索引）和 DOM 策略（虚拟滚动），不在框架层

**Alternatives considered**:
- **React + Vite**: 提供更好的组件模型和开发体验，但引入 ~40KB 运行时，且必须有构建步骤 → 违反"No Build Required"约束
- **Vue 3 + CDN**: 可通过 CDN 引入无构建使用，但网络依赖违反"Offline Capable"约束（首网加载后 CDN 可缓存，但首次冷启动需网络）
- **Preact + htm**: 轻量（~3KB），但所有组件需模板字符串编译，调试困难，且仍引入外部依赖

## Decision 2: IndexedDB — 数据持久化与索引

**Decision**: 使用 IndexedDB 作为产品数据的主存储和查询引擎。

**Rationale**:
- 10万+产品数据（预估每条约300-500字节，总计30-80MB）远超 localStorage 的 5-10MB 限制
- IndexedDB 支持索引（类似数据库索引），可在十万级数据上实现亚毫秒级查询
- 异步 API 不阻塞 UI 线程（localStorage 是同步的，大数据量写入会冻结页面）
- 浏览器原生支持，无额外依赖
- 数据持久化在浏览器中，页面刷新后无需重新下载

**Alternatives considered**:
- **localStorage**: 5-10MB 硬限制，同步API阻塞UI，无索引能力 → 仅适合用户偏好等轻量数据
- **内存数组 (in-memory array)**: 页面刷新数据丢失，100k条加载耗时5-10秒，每次打开都需重新加载 → 与IndexedDB配合使用（内存索引+IndexedDB持久化）
- **Cache API (Service Worker)**: 适合缓存网络请求，不适合结构化查询和索引 → 可作为预缓存JSON文件的补充方案

## Decision 3: 虚拟滚动 — 大列表渲染

**Decision**: 采用虚拟滚动（Virtual Scrolling）技术渲染产品列表。

**Rationale**:
- 10万+产品无法一次性渲染所有DOM节点（会创建10万+DOM元素，内存>500MB，渲染阻塞>30秒）
- 虚拟滚动仅渲染可视区域 + 缓冲区（约20-30个DOM节点），滚动时动态替换内容
- 配合 IndexedDB 的分页查询，按需加载数据

**Alternatives considered**:
- **分页 (Pagination)**: 实现简单但用户体验差——每次翻页需重新筛选，且无法快速扫描大量结果
- **懒加载 (Infinite Scroll)**: DOM节点持续增长，滚动1000+条目后仍会卡顿 → 不如虚拟滚动彻底
- **Canvas渲染**: 性能极致但失去DOM可访问性（屏幕阅读器、文本选择、链接点击）→ 违反可访问性原则

## Decision 4: 内存多维索引 — 筛选引擎

**Decision**: 在内存中为每个可筛选维度构建倒排索引（Inverted Index），筛选时执行集合交集运算。

**Rationale**:
- 11个筛选维度 × 10万产品，全量遍历筛选耗时 50-200ms（取决于条件复杂度）→ 接近 SC-002 500ms 上限
- 内存索引将筛选降为 O(1) 维度查询 + O(m) 集合交集（m = 结果集大小），典型耗时 <10ms
- 索引随 IndexedDB 数据加载时构建，构建时间可摊入首次加载

**Alternatives considered**:
- **IndexedDB 多字段索引查询**: Tava 支持复合索引但动态组合查询（11选N）需要创建大量索引组合（2^11种）→ 不可行；且每次查询需序列化/反序列化，开销大
- **Web Worker 全量筛选**: 将筛选计算移到Worker线程避免阻塞UI，但通信序列化开销 + 遍历时间仍 >100ms → 可与索引方案互补（兜底策略）
- **WASM 筛选**: 引入额外构建工具链（emscripten/wasm-pack），违反 Simplicity 原则 → 10万数据量远未到需要 WASM 的级别

## Decision 5: 测试策略 — 分层测试

**Decision**: 三层测试金字塔——单元测试 (Vitest + jsdom)、集成测试 (Vitest + jsdom)、E2E验收测试 (Playwright)。

**Rationale**:
- Constitution Principle III 要求 TDD + 80% 分支覆盖率
- jsdom 提供浏览器等效DOM/API环境，适合单元和集成测试的快速反馈（无需启动浏览器）
- Playwright 用于真实浏览器中的用户旅程验证（User Story Acceptance Scenarios）
- 符合 TDD 流程：先写 Vitest 单元测试 → 失败 → 实现 → 通过 → 用 Playwright 验证 E2E

**Alternatives considered**:
- **仅 Playwright E2E**: 反馈太慢（秒级），不适合 TDD 红-绿-重构快速循环
- **Jest**: 与 Vitest 功能相近但配置更复杂，Vitest 默认兼容 Vite 生态且速度更快
- **Cypress**: 功能强大但安装体积大，Playwright 更轻量且多浏览器支持更好

## Decision 6: file:// 协议兼容 — 非模块化脚本

**Decision**: 不使用 ES Modules (`import`/`export`)，采用传统 `<script>` 标签加载（IIFE 模式或全局命名空间）。

**Rationale**:
- ES Modules (`<script type="module">`) 在 `file://` 协议下被浏览器 CORS 策略阻止
- 传统脚本标签在 `file://` 下正常工作
- 开发时可使用简单的拼接脚本或直接按依赖顺序引用 `<script>` 标签

**Alternatives considered**:
- **ES Modules + 本地开发服务器**: 开发体验好但生产环境需要构建工具打包 → 违反"No Build Required"约束
- **Service Worker 拦截 + ES Modules**: 过于复杂，10万数据场景不需要 → 违反 Simplicity 原则

## Decision 7: 数据加载 — 分片JSON + IndexedDB 种子

**Decision**: 产品数据按品类分片为独立JSON文件，首次运行时通过 `<script>` 标签加载并写入 IndexedDB。

**Rationale**:
- 10万+产品按品类分片（每个品类5k-20k条），用户可按需加载（首页默认加载全部索引，详情按需加载具体品类数据）
- JSON 通过 `<script>` 标签引入（`<script src="data/products/immunity.jsonp.js">`，实际是 `window.DATA_CHUNKS.immunity = [...]`），规避 `file://` 下的 fetch CORS 限制
- IndexedDB 作为持久层，后续访问直接读取 IndexedDB，无需重新加载

**Alternatives considered**:
- **单个大JSON文件**: 10万条数据约30-80MB，`<script>` 标签加载会阻塞页面渲染5-10秒 → 分片避免首屏阻塞
- **内联 `<script>window.DATA = [...]</script>`**: 最兼容但HTML文件体积过大（30-80MB），浏览器解析HTML卡死 → 仅适合小数据集
- **fetch + IndexedDB**: 浏览器 `fetch()` API 在 `file://` 下受CORS限制 → 不可行
