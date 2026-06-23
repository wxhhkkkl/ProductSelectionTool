/**
 * App Controller — initializes all modules, wires data flow, manages state.
 * ProductSelectionTool main application.
 */
(function () {
  'use strict';

  var Store = App.Data.Store;
  var Loader = App.Data.Loader;
  var FilterEngine = App.Engine.Filter;
  var SearchEngine = App.Engine.Search;
  var SortEngine = App.Engine.Sort;
  var Schema = App.Data.Schema;
  var Storage = App.Utils.Storage;

  // State
  var allProducts = {};       // id -> product
  var currentFilteredIds = [];
  var filterCriteria = {};
  var searchQuery = '';
  var currentSort = 'sales_desc';

  // UI instances
  var filterPanel = null;
  var searchBar = null;
  var productList = null;
  var productDetail = null;
  var compareView = null;

  /**
   * Initialize the application.
   */
  function init() {
    // Create UI instances
    filterPanel = App.UI.FilterPanel(document.getElementById('filter-panel'));
    searchBar = App.UI.SearchBar(document.getElementById('search-bar-container'));
    productList = App.UI.ProductList(document.getElementById('product-list'));
    productDetail = App.UI.ProductDetail(document.getElementById('detail-panel'));
    compareView = App.UI.CompareView(document.getElementById('compare-panel'));

    // Wire events
    wireEvents();

    // Load data
    loadData();
  }

  function wireEvents() {
    // Filter changes
    filterPanel.onChange(function (criteria) {
      filterCriteria = criteria;
      Storage.saveFilterCriteria(criteria);
      applyFiltersAndUpdate();
    });

    // Search
    searchBar.onSearch(function (query) {
      searchQuery = query;
      applyFiltersAndUpdate();
    });

    // Sort
    document.getElementById('sort-select').addEventListener('change', function (e) {
      currentSort = e.target.value;
      applyFiltersAndUpdate();
    });

    // Product detail
    productList.onItemClick(function (productId) {
      Store.getById(productId).then(function (product) {
        if (product) {
          productDetail.show(product);
        }
      });
    });

    productDetail.onClose(function () {
      // Just hide overlay; filter state preserved
    });

    // Compare
    productList.onCompareSelectionChange(function (selectedIds) {
      updateCompareBar(selectedIds);
    });

    document.getElementById('compare-btn').addEventListener('click', function () {
      var selected = productList.getSelectedForCompare();
      if (selected.length < 2) return;
      var ids = selected.slice(0, 4);
      Store.getByIds(ids, 0, ids.length).then(function (products) {
        compareView.show(products);
      });
    });

    document.getElementById('compare-clear').addEventListener('click', function () {
      productList.clearCompareSelection();
      updateCompareBar([]);
    });

    compareView.onClose(function () {
      updateCompareBar(productList.getSelectedForCompare());
    });

    compareView.onViewDetail(function (productId) {
      Store.getById(productId).then(function (product) {
        if (product) {
          productDetail.show(product);
        }
      });
    });

    // Filter reset
    document.getElementById('filter-reset').addEventListener('click', function () {
      filterPanel.reset();
    });

    // Detail overlay: click backdrop to close
    document.getElementById('detail-overlay').addEventListener('click', function (e) {
      if (e.target === e.currentTarget) {
        productDetail.hide();
      }
    });

    // Compare overlay: click backdrop to close
    document.getElementById('compare-overlay').addEventListener('click', function (e) {
      if (e.target === e.currentTarget) {
        compareView.hide();
      }
    });

    // Keyboard shortcut
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        productDetail.hide();
        compareView.hide();
      }
    });
  }

  function loadData() {
    var infoEl = document.getElementById('data-info');

    Store.init().then(function () {
      return Store.isEmpty();
    }).then(function (empty) {
      if (empty && window.PRODUCT_DATA) {
        infoEl.textContent = '正在导入数据...';
        return Loader.loadFromArray(window.PRODUCT_DATA, '2026-06');
      } else if (!empty) {
        infoEl.textContent = '数据就绪';
        return { imported: 0, skipped: 0, errors: [] };
      } else {
        infoEl.textContent = '无数据 — 请在data/products/目录放置产品数据';
        return { imported: 0, skipped: 0, errors: [{ index: -1, errors: ['No data available'] }] };
      }
    }).then(function (result) {
      if (result.errors && result.errors.length > 0 && result.errors[0].index === -1 && result.errors[0].errors[0] === 'No data available') {
        showError('无产品数据', '请将产品JSON数据文件放置在 data/products/ 目录下，或在页面中通过 window.PRODUCT_DATA 注入数据');
        return;
      }
      return Store.getAllIds().then(function (ids) {
        infoEl.textContent = '共 ' + ids.length + ' 个产品';
        // Load all products into memory for filtering
        return Store.getByIds(ids, 0, ids.length).then(function (products) {
          return { ids: ids, products: products };
        });
      });
    }).then(function (data) {
      if (!data) return;
      var ids = data.ids;
      var products = data.products;

      // Build product map
      for (var i = 0; i < products.length; i++) {
        allProducts[products[i].id] = products[i];
      }
      productList.setProductsMap(allProducts);

      // Build filter index
      FilterEngine.buildIndex(ids, function (id) { return allProducts[id]; });

      // Build search index
      var searchData = [];
      for (var j = 0; j < products.length; j++) {
        searchData.push({
          id: products[j].id,
          name: products[j].name,
          brand: products[j].brand
        });
      }
      SearchEngine.buildIndex(searchData);

      // Restore saved filter criteria
      var saved = Storage.loadFilterCriteria();
      if (saved && Object.keys(saved).length > 0) {
        filterPanel.setCriteria(saved);
        filterCriteria = saved;
      }

      // Initial render
      applyFiltersAndUpdate();
    }).catch(function (err) {
      console.error('Data load error:', err);
      showError('数据加载失败', err.message);
    });
  }

  function applyFiltersAndUpdate() {
    // 1. Filter
    var filtered = FilterEngine.filter(filterCriteria);

    // 2. Search (intersect with filter results)
    if (searchQuery && searchQuery.trim()) {
      var searched = SearchEngine.search(searchQuery);
      var searchedSet = {};
      for (var i = 0; i < searched.length; i++) {
        searchedSet[searched[i]] = true;
      }
      var intersected = [];
      for (var j = 0; j < filtered.length; j++) {
        if (searchedSet[filtered[j]]) {
          intersected.push(filtered[j]);
        }
      }
      filtered = intersected;
    }

    // 3. Sort
    var sorted = SortEngine.sort(filtered, currentSort, allProducts);

    // 4. Update UI
    currentFilteredIds = sorted;
    productList.setProductIds(sorted);

    // Update result count
    document.getElementById('result-count').textContent =
      '共 ' + sorted.length + ' 条结果';

    // Update data info
    document.getElementById('data-info').textContent =
      '展示 ' + sorted.length + ' / ' + FilterEngine.getTotalCount() + ' 个产品';
  }

  function updateCompareBar(selectedIds) {
    var bar = document.getElementById('compare-bar');
    var countEl = document.getElementById('compare-count');
    var btn = document.getElementById('compare-btn');

    countEl.textContent = '已选 ' + selectedIds.length + ' 个产品';
    btn.disabled = selectedIds.length < 2;

    if (selectedIds.length > 0) {
      bar.classList.add('visible');
    } else {
      bar.classList.remove('visible');
    }
  }

  function showError(title, message) {
    var container = document.getElementById('product-list');
    var D = App.Utils.DOM;
    D.clearContainer(container);
    var errDiv = D.createElement('div', { className: 'empty-state' });
    errDiv.appendChild(D.createElement('div', { className: 'icon' }, '⚠️'));
    errDiv.appendChild(D.createElement('div', { style: 'font-size:16px;font-weight:600;margin-bottom:8px' }, title));
    errDiv.appendChild(D.createElement('div', { className: 'hint' }, message));
    container.appendChild(errDiv);
    document.getElementById('data-info').textContent = title;
  }

  // Boot
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
