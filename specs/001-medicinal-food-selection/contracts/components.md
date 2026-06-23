# Component Contracts: 药食同源电商选品工具

**Feature**: 001-medicinal-food-selection
**Date**: 2026-06-23
**Type**: Internal component interfaces (pure frontend, no external API)

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│  App (app.js) — 初始化 + 路由/状态协调          │
├─────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐ │
│  │FilterPanel│  │SearchBar │  │ ProductList   │ │
│  │(11维度)  │  │          │  │ (虚拟滚动)    │ │
│  └────┬─────┘  └────┬─────┘  └───────┬───────┘ │
│       │             │                │          │
│  ┌────┴─────────────┴────────────────┴───────┐  │
│  │         FilterEngine + SearchEngine       │  │
│  │         (内存索引 + 集合运算)              │  │
│  └─────────────────┬─────────────────────────┘  │
│                    │                             │
│  ┌─────────────────┴─────────────────────────┐  │
│  │         DataStore (IndexedDB)              │  │
│  └───────────────────────────────────────────┘  │
│                                                 │
│  ┌──────────────┐  ┌────────────────────────┐  │
│  │ProductDetail │  │  CompareView           │  │
│  │(详情面板)    │  │  (并列对比+优劣标注)   │  │
│  └──────────────┘  └────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

## Module Contracts

### 1. DataStore (`js/data/store.js`)

IndexedDB 封装，提供产品数据的 CRUD 和索引查询。

```js
// 初始化数据库，创建 indexes
DataStore.init(): Promise<void>

// 批量导入产品数据（首次加载或数据更新）
DataStore.importProducts(products: Product[]): Promise<number>  // 返回导入条数

// 获取所有产品ID（用于构建内存索引）
DataStore.getAllIds(): Promise<string[]>

// 按ID批量获取产品（分页，用于虚拟滚动）
DataStore.getByIds(ids: string[], offset: number, limit: number): Promise<Product[]>

// 按ID获取单个产品完整信息
DataStore.getById(id: string): Promise<Product | null>

// 获取当前数据版本
DataStore.getVersion(): Promise<string | null>

// 清空数据库
DataStore.clear(): Promise<void>
```

### 2. FilterEngine (`js/engine/filter.js`)

内存多维筛选引擎，基于倒排索引。

```js
// 构建内存索引（在 DataStore 初始化后调用）
FilterEngine.buildIndex(productIds: string[], getProductMeta: (id: string) => ProductMeta): void

// 应用筛选条件，返回匹配的产品ID集合
FilterEngine.filter(criteria: FilterCriteria): string[]

// 获取某个维度下所有可能的值（用于筛选面板展示维度选项+计数）
FilterEngine.getDimensionValues(dimension: string, currentIds: string[]): {value: string, count: number}[]
```

### 3. SearchEngine (`js/engine/search.js`)

关键词搜索，基于名称和品牌前缀/子串匹配。

```js
// 初始化搜索索引
SearchEngine.buildIndex(products: Array<{id: string, name: string, brand: string}>): void

// 搜索，返回匹配的产品ID列表
SearchEngine.search(query: string): string[]
```

### 4. SortEngine (`js/engine/sort.js`)

排序引擎。

```js
// 排序产品ID列表
SortEngine.sort(productIds: string[], sortBy: SortField, products: Map<string, Product>): string[]
```

### 5. FilterPanel (`js/ui/filter-panel.js`)

筛选面板 UI 组件（11维度）。

```js
// 创建筛选面板，挂载到 container
FilterPanel(container: HTMLElement): FilterPanelInstance

interface FilterPanelInstance {
  // 设置某维度的可选值列表
  setDimensionOptions(dimension: string, options: {value: string, label: string, count: number}[]): void
  // 注册筛选变更回调
  onChange(callback: (criteria: FilterCriteria) => void): void
  // 程序化设置筛选（恢复保存的状态）
  setCriteria(criteria: FilterCriteria): void
  // 重置所有筛选
  reset(): void
  // 获取当前筛选状态
  getCriteria(): FilterCriteria
}
```

### 6. ProductList (`js/ui/product-list.js`)

产品列表组件（虚拟滚动）。

```js
ProductList(container: HTMLElement): ProductListInstance

interface ProductListInstance {
  // 设置要显示的产品的ID列表（筛选/搜索后调用）
  setProductIds(ids: string[]): void
  // 注册行渲染器（返回每行的HTML/DOM）
  onRender(callback: (product: Product) => HTMLElement): void
  // 注册点击回调
  onItemClick(callback: (productId: string) => void): void
  // 获取已勾选的对比产品ID
  getSelectedForCompare(): string[]
  // 注册对比选择变更回调
  onCompareSelectionChange(callback: (selectedIds: string[]) => void): void
  // 滚动到指定产品
  scrollTo(productId: string): void
}
```

### 7. ProductDetail (`js/ui/product-detail.js`)

产品详情面板。

```js
ProductDetail(container: HTMLElement): ProductDetailInstance

interface ProductDetailInstance {
  // 展示产品详情
  show(product: Product): void
  // 隐藏详情面板
  hide(): void
  // 注册关闭回调
  onClose(callback: () => void): void
}
```

### 8. CompareView (`js/ui/compare-view.js`)

产品对比视图。

```js
CompareView(container: HTMLElement): CompareViewInstance

interface CompareViewInstance {
  // 展示对比视图
  show(products: Product[]): void   // products.length ∈ [2, 4]
  // 隐藏对比视图
  hide(): void
  // 注册关闭回调（返回时保留选择状态）
  onClose(callback: () => void): void
  // 注册"查看详情"回调
  onViewDetail(callback: (productId: string) => void): void
}
```

### 9. SearchBar (`js/ui/search-bar.js`)

搜索栏组件。

```js
SearchBar(container: HTMLElement): SearchBarInstance

interface SearchBarInstance {
  // 注册搜索回调（debounced, 300ms）
  onSearch(callback: (query: string) => void): void
  // 清空搜索
  clear(): void
}
```

### 10. App (`js/app.js`)

应用入口，协调所有模块。

```
App 职责:
1. 初始化 DataStore → 检查 IndexedDB 版本 → 需要更新? → 加载 JSON 数据
2. 构建 FilterEngine + SearchEngine 的内存索引
3. 渲染 FilterPanel + SearchBar + ProductList
4. 监听筛选/搜索变更 → 调用 FilterEngine → 更新 ProductList
5. 管理 ProductDetail 面板的显示/隐藏
6. 管理 CompareView 的显示/隐藏
7. 保存/恢复 FilterCriteria 到 localStorage
8. 管理 SortEngine 排序
```

## Event Flow

### 筛选流程
```
User changes filter in FilterPanel
  → FilterPanel.onChange(criteria)
    → App.handleFilterChange(criteria)
      → FilterEngine.filter(criteria) → matchedIds: string[]
      → SortEngine.sort(matchedIds, sortBy) → sortedIds: string[]
      → ProductList.setProductIds(sortedIds)
      → FilterPanel.setDimensionOptions(dimension, updatedCounts)
```

### 搜索流程
```
User types in SearchBar (debounced 300ms)
  → SearchBar.onSearch(query)
    → App.handleSearch(query)
      → 有 query? → SearchEngine.search(query) → searchIds
      → 无 query? → 恢复筛选结果
      → 合并 searchIds ∩ filterIds (如果同时有筛选)
      → ProductList.setProductIds(mergedIds)
```

### 产品详情流程
```
User clicks product in ProductList
  → ProductList.onItemClick(productId)
    → App.handleProductClick(productId)
      → DataStore.getById(productId) → fullProduct
      → ProductDetail.show(fullProduct)
```

### 产品对比流程
```
User selects products for compare (2-4)
  → ProductList.onCompareSelectionChange(selectedIds)
    → App.handleCompare(selectedIds)
      → 检查 length ∈ [2,4]
      → DataStore.getByIds(selectedIds) → products[]
      → CompareView.show(products)
```
