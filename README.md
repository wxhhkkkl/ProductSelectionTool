# 🌿 药食同源电商选品工具

一个纯前端 H5 SPA 工具，帮助电商选品人员通过多维度筛选查找市售药食同源及保健食品，获取竞品分析数据。

## 功能概览

- **多维度筛选** — 按功能分类、适用人群、剂型、价格带、利润空间、批准文号、生产厂家类型、销售渠道、产地、包装规格等维度组合筛选
- **产品对比** — 勾选多个产品进行并行对比，可量化维度自动标注优劣方
- **销量数据参考** — 基于真实药店 POS 销售数据的价格和销量参考
- **离线可用** — IndexedDB 本地缓存，一次性导入后所有筛选均在浏览器内完成

## 快速开始

```bash
# 启动本地服务
npm run serve
# 或者
npx serve .
```

打开浏览器访问 `http://localhost:3000`（或其他 serve 分配的端口）。

数据通过 `data/products/all-products.jsonp.js` 自动加载，首次打开会自动导入到浏览器 IndexedDB 中。

## 数据规模

| 指标 | 数值 |
|------|------|
| 产品总数 | **616** |
| 品牌数 | 378 |
| 功能分类 | 20 个 |
| 认证类型 | 蓝帽 239 / SC食品 365 / GMP 10 / 其他 2 |

### 功能分类

免疫力、助眠安神、健脾消食、强健骨骼、美容养颜、调节三高、补肾益气、清咽润喉、益智健脑、抗氧化、护眼明目、基础维生素、中药食材、谷物膳食、蛋白质补充、益生菌、矿物质补充、胶原蛋白、护肝养肝、蜂产品

### 数据来源

- 手工录入的高热度市场调研产品
- 河北华佗药房、吉林神农健康等连锁药店真实 POS 销售数据（已过滤非药食同源品类）

## 项目结构

```
├── index.html                  # 应用入口
├── css/
│   ├── reset.css               # 样式重置
│   ├── layout.css              # 布局
│   ├── components.css          # 组件样式
│   └── responsive.css          # 响应式
├── js/
│   ├── app.js                  # 主应用逻辑
│   ├── data/
│   │   ├── schema.js           # 数据模型定义与校验
│   │   ├── store.js            # IndexedDB 存储层
│   │   └── loader.js           # 数据加载与版本管理
│   ├── engine/
│   │   ├── filter.js           # 多维度筛选引擎
│   │   ├── search.js           # 全文搜索
│   │   └── sort.js             # 排序
│   ├── ui/
│   │   ├── filter-panel.js     # 筛选面板
│   │   ├── product-list.js     # 产品列表
│   │   ├── product-detail.js   # 产品详情
│   │   ├── compare-view.js     # 产品对比视图
│   │   └── search-bar.js       # 搜索栏
│   └── utils/
│       ├── dom.js              # DOM 工具
│       ├── format.js           # 格式化工具
│       └── storage.js          # localStorage 工具
├── data/products/
│   ├── all-products.json       # 产品数据 (JSON)
│   ├── all-products.jsonp.js   # 产品数据 (JSONP, 页面直接加载)
│   └── food_products_raw.json  # 原始中间数据
├── scripts/
│   ├── generate_products.py    # 手工产品生成脚本
│   └── import_csv_v5.js        # CSV 数据导入脚本（最新版）
├── specs/001-medicinal-food-selection/
│   ├── spec.md                 # 需求规格说明
│   ├── plan.md                 # 实施计划
│   ├── data-model.md           # 数据模型
│   ├── tasks.md                # 任务清单
│   └── research.md             # 竞品调研
└── tests/
    ├── fixtures/               # 测试固件
    └── unit/                   # 单元测试
```

## 更新数据

### 从 CSV 导入新数据

```bash
node scripts/import_csv_v5.js
```

该脚本会：
1. 读取 GBK 编码的 DataWorks 导出的 CSV 文件
2. 按条形码 / 产品名去重聚合
3. 排除医疗器械、化妆品、药品、普通食品
4. 自动分类（功能分类、剂型、适用人群、品牌提取等）
5. 与现有数据合并去重
6. 生成 `all-products.json` 和 `all-products.jsonp.js`
7. 同时需更新 `js/app.js` 中的 `expectedVersion` 以触发浏览器重新导入

### CSV 字段要求

| 字段 | 说明 |
|------|------|
| 商品名称 | 产品名称 |
| 条形码 | 用于去重的关键字段 |
| 批准文号 | 用于区分品类（蓝帽/SC/国药准字等） |
| 规格 | 产品规格 |
| 生产厂家 | 生产厂家，用于品牌提取 |
| 销售单价_平均值 | 平均零售价 |
| 销售数量_总和 | 销售量汇总 |
| 销售金额_总和 | 销售额汇总 |

## 技术栈

- 纯前端 H5 SPA，无框架依赖
- IndexedDB 本地数据存储
- CSS3 响应式布局
- Vitest 单元测试
- Node.js 数据处理脚本

## License

Private
