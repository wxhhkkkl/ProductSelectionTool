# Quickstart: 药食同源电商选品工具

**Feature**: 001-medicinal-food-selection
**Date**: 2026-06-23

## 快速开始

### 方式一：直接打开（生产模式，零依赖）

1. 将整个项目目录拷贝到任意位置
2. 双击 `index.html` 用浏览器打开
3. 首次打开时应用会自动从 `data/products/` 目录加载产品数据到浏览器本地数据库
4. 后续打开秒开（数据已在浏览器本地 IndexedDB 中）

### 方式二：本地开发服务器（开发模式）

```bash
# 安装开发依赖（仅测试工具）
npm install

# 启动本地开发服务器（端口 3000）
npx serve .

# 运行测试（TDD 模式）
npx vitest --watch

# 运行全部测试 + 覆盖率
npx vitest run --coverage

# 运行 E2E 验收测试
npx playwright test
```

## 项目结构速览

```
├── index.html           # 入口 — 双击打开即用
├── css/                 # 样式（4文件）
├── js/                  # 应用逻辑
│   ├── app.js           # 主控制器
│   ├── data/            # 数据层（IndexedDB）
│   ├── engine/          # 筛选/搜索/排序引擎
│   ├── ui/              # UI 组件
│   └── utils/           # 工具函数
├── data/products/       # 产品数据（JSON分片）
├── tests/               # 测试（unit/integration/e2e）
└── package.json         # 仅开发工具
```

## TDD 开发流程

遵循 Constitution Principle III (Test-First):

```
1. 在 tests/unit/ 或 tests/integration/ 写测试
2. 运行 npx vitest → 确认测试 FAIL（红色）
3. 在 js/ 写实现代码
4. 运行 npx vitest → 确认测试 PASS（绿色）
5. 重构优化（保持绿色）
6. 提交代码
```

## 关键约束

- **零运行时依赖**: `js/` 下所有代码使用 Vanilla JavaScript (ES2020+)
- **不使用 ES Modules**: 用传统 `<script>` 标签加载，确保 `file://` 协议兼容
- **全局命名空间**: 模块挂载到 `window.App.*` 下（如 `window.App.DataStore`, `window.App.FilterEngine`）
- **IndexedDB**: 所有产品数据查询通过 DataStore 封装，不直接操作 DOM 存储
- **localStorage**: 仅用于用户偏好（FilterCriteria），限制 < 5KB
- **不发起网络请求**: 核心功能完全离线（挂网链接打开除外）

## 浏览器兼容性

| 浏览器 | 最低版本 |
|--------|----------|
| Chrome | 90+ |
| Edge | 90+ |
| Firefox | 90+ |
| Safari | 15+ |

所有目标浏览器均完整支持 IndexedDB、CSS Grid/Flexbox、ES2020。
