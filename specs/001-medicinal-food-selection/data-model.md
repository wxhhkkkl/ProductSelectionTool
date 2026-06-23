# Data Model: 药食同源电商选品工具

**Feature**: 001-medicinal-food-selection
**Date**: 2026-06-23
**Source**: [spec.md](./spec.md) — Key Entities + Functional Requirements

## Entity Relationship

```
Product (1) ──< (N) ListingURL
Product (N) ──< (M) FilterCriteria (via user selection)
Product (N) ──< (M) ComparisonSet (via user selection, max 4)
FilterCriteria (1) ── (1) localStorage (persisted)
```

## Entity Definitions

### Product (产品)

核心实体。代表一个在售的药食同源商品。

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✅ | 唯一标识，格式: `{brand}_{name}_{spec}` 的 slug |
| `name` | string | ✅ | 产品名称（如"同仁堂灵芝孢子粉胶囊"） |
| `brand` | string | ✅ | 品牌/厂家名称 |
| `manufacturerType` | enum | ✅ | 生产厂家类型: `famous_pharma` \| `specialty_health` \| `oem` |
| `functionCategory` | string[] | ✅ | 功能分类标签（至少1个）: `immunity`, `sleep`, `digestion`, `bone`, `beauty`, `sangan`, `kidney`, ... |
| `materialCategory` | string | ✅ | 原料分类: `ginseng`, `goji`, `ganoderma`, `donkey_hide`, `astragalus`, `other` |
| `dosageForm` | enum | ✅ | 剂型: `tablet`, `capsule`, `liquid`, `granule`, `pill`, `paste`, `tea`, `powder` |
| `specification` | string | ✅ | 规格描述（如"60粒/瓶"、"10ml×30支"） |
| `packaging` | enum | ✅ | 包装规格: `single_box`, `gift_box`, `family_pack`, `bulk` |
| `targetPopulation` | string[] | ✅ | 适用人群标签: `children`, `adult`, `elderly`, `pregnant`, `male`, `female`, `general` |
| `efficacyLevel` | enum | ✅ | 疗效程度: `health` (保健级), `conditioning` (调理级), `treatment_adjunct` (治疗辅助级) |
| `certification` | enum | ✅ | 批准文号/认证类型: `blue_hat` (蓝帽), `sc_food` (SC食品), `gmp`, `other` |
| `origin` | string | ✅ | 产地/道地产区 (如"宁夏中宁", "吉林长白山") |
| `salesChannel` | enum | ✅ | 销售渠道: `online_only`, `offline_only`, `omni_channel` |
| `priceMin` | number | ✅ | 最低参考价（元），≥0 |
| `priceMax` | number | ✅ | 最高参考价（元），≥ priceMin |
| `profitMargin` | number | ✅ | 预估利润空间（百分比，0-100） |
| `referenceSales` | number | ❌ | 参考销售额（万元），null 表示无数据 |
| `salesDataType` | enum | ❌ | 销售额数据类型: `exact` \| `estimated`，仅 referenceSales 有值时设置 |
| `salesDataPeriod` | string | ❌ | 数据参考期间（如"2025Q4"），仅 referenceSales 有值时设置 |
| `description` | string | ❌ | 产品简要描述/疗效说明 |
| `listingUrls` | ListingURL[] | ❌ | 挂网链接列表 |
| `dataVersion` | string | ✅ | 数据版本号（如"2026-06"），用于追踪数据新鲜度 |

**IndexedDB Indexes** (for query performance):
- `functionCategory` (multiEntry) — 功能分类筛选
- `dosageForm` — 剂型筛选
- `targetPopulation` (multiEntry) — 适用人群筛选
- `efficacyLevel` — 疗效筛选
- `certification` — 认证筛选
- `manufacturerType` — 厂家类型筛选
- `salesChannel` — 销售渠道筛选
- `origin` — 产地筛选
- `packaging` — 包装规格筛选
- `priceMin`, `priceMax` — 价格带筛选
- `profitMargin` — 利润筛选
- `referenceSales` — 销量排序
- `name`, `brand` (fulltext-ish via Array index) — 关键词搜索

### ListingURL (挂网链接)

产品的电商平台商品页面链接。

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `platform` | string | ✅ | 平台名称 (如"淘宝", "京东", "拼多多", "抖音电商") |
| `url` | string | ✅ | 商品页面完整URL |
| `platformPrice` | number | ❌ | 该平台当前售价（元） |
| `collectedAt` | string | ✅ | 链接采集/验证日期 (YYYY-MM-DD) |

### FilterCriteria (筛选条件)

用户当前的筛选状态，持久化到 localStorage。

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `functionCategory` | string[] | ❌ | 选中的功能分类 |
| `targetPopulation` | string[] | ❌ | 选中的适用人群 |
| `efficacyLevel` | string[] | ❌ | 选中的疗效程度 |
| `dosageForm` | string[] | ❌ | 选中的剂型 |
| `priceRange` | {min, max} | ❌ | 选中的价格区间 |
| `profitRange` | {min, max} | ❌ | 选中的利润区间 |
| `certification` | string[] | ❌ | 选中的认证类型 |
| `manufacturerType` | string[] | ❌ | 选中的厂家类型 |
| `salesChannel` | string[] | ❌ | 选中的销售渠道 |
| `origin` | string[] | ❌ | 选中的产地 |
| `packaging` | string[] | ❌ | 选中的包装规格 |
| `searchQuery` | string | ❌ | 关键词搜索文本 |
| `sortBy` | enum | ❌ | 排序方式: `sales_desc`, `price_asc`, `price_desc`, `profit_desc` |

### ComparisonSet (对比组)

用户临时选择的产品对比集合（仅存在于内存，不持久化）。

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `productIds` | string[] | ✅ | 对比产品ID列表（2-4个） |

### Data Schema (数据文件结构)

```json
{
  "version": "2026-06",
  "generatedAt": "2026-06-23",
  "category": "immunity",
  "products": [ /* Product[] */ ]
}
```

## Validation Rules

- `priceMin` ≤ `priceMax`，且两者均 ≥ 0
- `profitMargin` ∈ [0, 100]
- `functionCategory` 至少包含1个标签
- `listingUrls[].platform` 不允许重复（同一平台最多一个链接）
- `id` 唯一约束（在 IndexedDB 层通过 unique index 保证）
- `dataVersion` 格式: `YYYY-MM`
- `referenceSales` 为 null 时，`salesDataType` 和 `salesDataPeriod` 必须为 null
- `comparisonSet.productIds` 长度 ∈ [2, 4] 或为空（初始状态）

## State Transitions

Products 是只读静态数据，无状态机。用户交互状态：

```
FilterCriteria: ∅ (初始) → 用户选择维度 → 多维度组合 → 持久化 localStorage
ComparisonSet: ∅ → +product (检查 length ≤ 4) → -product → ∅
Data Loading:   首次打开 → 检查 IndexedDB → 空? → 加载JSON → 写入IndexedDB → 就绪
                再次打开 → 检查 IndexedDB → 有数据 → 检查版本 → 匹配? → 就绪
                                                              → 不匹配? → 重新加载
```
