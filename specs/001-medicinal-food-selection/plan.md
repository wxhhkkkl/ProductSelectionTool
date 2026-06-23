# Implementation Plan: 药食同源电商选品工具

**Branch**: `001-medicinal-food-selection` | **Date**: 2026-06-23 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-medicinal-food-selection/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

构建一个纯前端单页面应用（SPA），帮助电商选品人员通过11个维度筛选、
搜索和对比十万级药食同源产品。核心数据内嵌为静态JSON，首次加载后存入
IndexedDB 实现高性能离线筛选。零后端依赖，可直接通过 `file://` 或任意
静态服务器打开使用。

技术路线：Vanilla JavaScript (ES2020+) + IndexedDB + 虚拟滚动 + 内存索引。
开发阶段使用 Vitest + jsdom 做 TDD 单元测试，Playwright 做端到端验收测试。

## Technical Context

**Language/Version**: Vanilla JavaScript ES2020+（无框架，无TypeScript编译，符合Constitution的"No Build Required"约束）
**Primary Dependencies**: 无运行时依赖（零依赖纯前端）。开发依赖：Vitest + jsdom（单元/集成测试）、Playwright（E2E验收测试）
**Storage**: IndexedDB（10万+产品数据持久化与索引查询）、localStorage（用户筛选偏好与浏览历史，<5KB轻量状态）
**Testing**: Vitest + jsdom（TDD单元/集成测试，浏览器等效环境）、Playwright（E2E用户旅程验收测试）
**Target Platform**: 现代浏览器（Chrome 90+, Edge 90+, Firefox 90+, Safari 15+），桌面优先，移动端响应式可用
**Project Type**: 纯静态单页面Web应用（Single HTML file + CSS + JS + static data files）
**Performance Goals**: 首屏加载≤5s（含IndexedDB初始化），筛选响应≤500ms（10万+数据集），搜索建议≤300ms（输入停止后），详情展开≤500ms，4产品对比≤1s渲染
**Constraints**: 零后端、零网络请求（核心功能离线）、file://协议可用、无构建步骤可用（开发构建可选）、应用+数据总包体按需分片加载
**Scale/Scope**: 10万+产品记录，11个筛选维度（每个维度5-20个可选值），3个排序维度，关键词搜索，产品对比视图

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Data-Driven Decisions ✅
- **合规**: 所有产品数据内嵌于应用，筛选逻辑透明可检查。每个产品属性有明确来源标注。
- **验证**: 产品数据显示原始数据字段，筛选不涉及黑盒算法。销售额标注估算/精确类型。

### II. Modular Frontend Architecture ✅
- **合规**: 组件独立可测试——FilterPanel、ProductList、ProductDetail、CompareView、DataStore、FilterEngine 各自独立。
- **验证**: 每个模块通过明确的接口（函数签名/事件）通信，可独立替换。

### III. Test-First (NON-NEGOTIABLE) ✅
- **合规**: TDD 强制执行——测试先行，验证失败，再实现。目标 ≥80% 分支覆盖率。
- **验证**: Vitest + jsdom 提供浏览器等效测试环境。每个 User Story 有对应的集成测试和验收测试。

### IV. User-Centric Design ✅
- **合规**: 所有功能对应 spec 中 User Story。P1(筛选)→P2(详情)→P3(对比) 优先级明确。
- **验证**: 无 spec 外功能。功能验收以 User Story 的 Acceptance Scenarios 为准。

### V. Simplicity & YAGNI ✅
- **合规**: 零运行时依赖，Vanilla JS。IndexedDB 的使用由10万+数据量证明必要（localStorage 5MB限制无法满足）。
- **验证**: 无多余抽象层。复杂度在 Complexity Tracking 中记录。

### Architecture Constraints ✅
- **零后端**: ✅ 所有逻辑在浏览器执行
- **静态部署**: ✅ `file://` 可用，无需应用服务器
- **内嵌数据**: ✅ 产品数据随应用打包为静态文件
- **浏览器存储**: ✅ localStorage + IndexedDB，数据不出浏览器
- **离线可用**: ✅ 首次加载后完全离线工作（挂网链接除外）
- **无构建可用**: ✅ 开发构建可选，生产可直接打开HTML文件

**Gate Result**: ✅ ALL GATES PASSED — 无违规项。IndexedDB 的使用由数据规模证明必要，不属于过度设计。

## Project Structure

### Documentation (this feature)

```text
specs/001-medicinal-food-selection/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (internal component contracts)
└── tasks.md             # Phase 2 output (/speckit-tasks)
```

### Source Code (repository root)

```text
/
├── index.html               # 应用入口（单页面）
├── css/
│   ├── reset.css            # CSS reset + CSS variables/tokens
│   ├── layout.css           # 全局布局（header, sidebar, main）
│   ├── components.css       # 组件样式（filter, card, detail, compare）
│   └── responsive.css       # 移动端响应式覆盖
├── js/
│   ├── app.js               # 应用入口，初始化与路由
│   ├── data/
│   │   ├── store.js         # IndexedDB 封装（CRUD、索引管理）
│   │   ├── loader.js        # 数据加载器（JSON→IndexedDB 首次导入）
│   │   └── schema.js        # 数据 Schema 定义与校验
│   ├── engine/
│   │   ├── filter.js        # 多维筛选引擎（内存索引，11维度组合）
│   │   ├── search.js        # 全文关键词搜索
│   │   └── sort.js          # 排序引擎（销量/价格/利润）
│   ├── ui/
│   │   ├── filter-panel.js  # 筛选面板组件（11维度UI）
│   │   ├── product-list.js  # 产品列表/卡片组件（虚拟滚动）
│   │   ├── product-detail.js# 产品详情面板
│   │   ├── compare-view.js  # 产品对比视图
│   │   └── search-bar.js    # 搜索栏组件
│   └── utils/
│       ├── dom.js           # DOM 操作工具函数
│       ├── format.js        # 数据格式化（价格、百分比等）
│       └── storage.js       # localStorage 封装
├── data/
│   ├── products/            # 按品类分片的产品JSON数据文件
│   │   ├── immunity.json    # 免疫力类产品
│   │   ├── sleep.json       # 助眠安神类产品
│   │   └── ...              # 其他品类
│   └── schema.json          # 数据Schema定义（供校验使用）
├── tests/
│   ├── unit/
│   │   ├── filter.test.js
│   │   ├── search.test.js
│   │   ├── sort.test.js
│   │   ├── store.test.js
│   │   ├── schema.test.js
│   │   └── format.test.js
│   ├── integration/
│   │   ├── filter-to-list.test.js
│   │   ├── search-to-list.test.js
│   │   ├── detail-panel.test.js
│   │   └── compare.test.js
│   └── e2e/
│       ├── us1-browse-filter.spec.js
│       ├── us2-product-detail.spec.js
│       └── us3-compare.spec.js
└── package.json             # 仅开发依赖（vitest, playwright, 无运行时依赖）
```

**Structure Decision**: 采用单项目结构（Option 1），所有源码在 `js/` 下按功能分层（data/engine/ui/utils），而非按框架模式。此结构直接映射到 spec 中的实体和功能需求，无前后端分离。

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| IndexedDB（非 localStorage） | 十万级产品数据（每条~500B，总计~50MB+）远超 localStorage 5MB 限制 | localStorage 仅适合 <5MB 轻量数据；直接用内存数组存储 10 万条会导致内存占用过高且页面刷新数据丢失 |
| 虚拟滚动 | 10万+产品列表渲染，一次性 DOM 创建会导致浏览器卡死 | 全量 DOM 渲染会创建 10 万+节点，首次渲染 >30s 且滚动帧率 <5fps，无法满足 SC-001 5s 加载要求 |
| 内存索引（Map/Set） | 11维度组合筛选需亚毫秒级响应，遍历全量数据无法满足 500ms 要求 | 全量遍历筛选 10 万条平均耗时 50-200ms，含 DOM 更新则会超 500ms；索引结构将筛选降至 O(1) 维度查询 + O(m) 交集 |
