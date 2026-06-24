/**
 * App Controller — ProductSelectionTool
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

  var allProducts = {};
  var currentFilteredIds = [];
  var filterCriteria = {};
  var searchQuery = '';
  var currentSort = 'sales_desc';

  var filterPanel = null;
  var searchBar = null;
  var productList = null;
  var productDetail = null;
  var compareView = null;

  function log(msg, el) {
    el = el || document.getElementById('data-info');
    if (el) el.textContent = msg;
    console.log('[App]', msg);
  }

  function init() {
    log('初始化中...');

    try {
      filterPanel = App.UI.FilterPanel(document.getElementById('filter-panel'));
      searchBar = App.UI.SearchBar(document.getElementById('search-bar-container'));
      productList = App.UI.ProductList(document.getElementById('product-list'));
      productDetail = App.UI.ProductDetail(document.getElementById('detail-panel'));
      compareView = App.UI.CompareView(document.getElementById('compare-panel'));
      log('UI组件已创建');
    } catch (e) {
      log('UI初始化失败: ' + e.message);
      console.error(e);
      return;
    }

    wireEvents();
    loadData();
  }

  function wireEvents() {
    filterPanel.onChange(function (criteria) {
      filterCriteria = criteria;
      Storage.saveFilterCriteria(criteria);
      applyFiltersAndUpdate();
    });

    searchBar.onSearch(function (query) {
      searchQuery = query;
      applyFiltersAndUpdate();
    });

    var sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', function (e) {
        currentSort = e.target.value;
        applyFiltersAndUpdate();
      });
    }

    productList.onItemClick(function (productId) {
      Store.getById(productId).then(function (product) {
        if (product) productDetail.show(product);
      });
    });

    productDetail.onClose(function () {});

    productList.onCompareSelectionChange(function (selectedIds) {
      updateCompareBar(selectedIds);
    });

    var compareBtn = document.getElementById('compare-btn');
    if (compareBtn) {
      compareBtn.addEventListener('click', function () {
        var selected = productList.getSelectedForCompare();
        if (selected.length < 2) return;
        Store.getByIds(selected.slice(0, 4), 0, 4).then(function (products) {
          compareView.show(products);
        });
      });
    }

    var compareClear = document.getElementById('compare-clear');
    if (compareClear) {
      compareClear.addEventListener('click', function () {
        productList.clearCompareSelection();
        updateCompareBar([]);
      });
    }

    compareView.onClose(function () {
      updateCompareBar(productList.getSelectedForCompare());
    });

    compareView.onViewDetail(function (productId) {
      Store.getById(productId).then(function (product) {
        if (product) productDetail.show(product);
      });
    });

    var filterReset = document.getElementById('filter-reset');
    if (filterReset) {
      filterReset.addEventListener('click', function () {
        filterPanel.reset();
      });
    }

    var detailOverlay = document.getElementById('detail-overlay');
    if (detailOverlay) {
      detailOverlay.addEventListener('click', function (e) {
        if (e.target === e.currentTarget) productDetail.hide();
      });
    }

    var compareOverlay = document.getElementById('compare-overlay');
    if (compareOverlay) {
      compareOverlay.addEventListener('click', function (e) {
        if (e.target === e.currentTarget) compareView.hide();
      });
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        productDetail.hide();
        compareView.hide();
      }
    });
  }

  function loadData() {
    log('正在加载数据...');

    if (!window.PRODUCT_DATA || !Array.isArray(window.PRODUCT_DATA)) {
      log('错误: PRODUCT_DATA 未找到');
      showError('数据未找到', '请确保all-products.jsonp.js文件存在');
      return;
    }

    log('数据已就绪: ' + window.PRODUCT_DATA.length + ' 条产品');

    var expectedVersion = '2026-09';

    Store.init().then(function () {
      log('IndexedDB已初始化');
      return Loader.needsLoad(expectedVersion).then(function (needs) {
        log('数据库' + (needs ? '需要重新导入' : '已是最新'));
        return needs;
      });
    }).then(function (needsLoad) {
      if (needsLoad && window.PRODUCT_DATA && window.PRODUCT_DATA.length > 0) {
        log('正在导入 ' + window.PRODUCT_DATA.length + ' 条产品...');
        // Clear old data first, then import new
        return Store.clear().then(function () {
          return Loader.loadFromArray(window.PRODUCT_DATA, expectedVersion);
        });
      } else if (!needsLoad) {
        log('使用已有数据（版本已匹配）');
        return { imported: 0, skipped: 0, errors: [] };
      } else {
        log('无数据可加载');
        return { imported: 0, skipped: 0, errors: [{ index: -1, errors: ['No data available'] }] };
      }
    }).then(function (result) {
      log('导入结果: ' + result.imported + ' 条导入, ' + result.skipped + ' 条跳过, ' + (result.errors ? result.errors.length : 0) + ' 个错误');

      if (result.errors && result.errors.length > 0 && result.errors[0].index === -1) {
        showError('无产品数据', '请将产品JSON数据文件放置在 data/products/ 目录下');
        return null;
      }

      return Store.getAllIds().then(function (ids) {
        log('数据库中共 ' + ids.length + ' 条产品ID');
        if (ids.length === 0) {
          showError('数据库为空', '导入未成功，请检查浏览器控制台');
          return null;
        }
        return Store.getByIds(ids, 0, ids.length).then(function (products) {
          log('加载了 ' + products.length + ' 条产品详情');
          return { ids: ids, products: products };
        });
      });
    }).then(function (data) {
      if (!data) return;
      var ids = data.ids;
      var products = data.products;

      // Build product map
      allProducts = {};
      for (var i = 0; i < products.length; i++) {
        allProducts[products[i].id] = products[i];
      }
      productList.setProductsMap(allProducts);

      // Build indexes
      FilterEngine.buildIndex(ids, function (id) { return allProducts[id]; });

      var searchData = [];
      for (var j = 0; j < products.length; j++) {
        searchData.push({
          id: products[j].id,
          name: products[j].name,
          brand: products[j].brand
        });
      }
      SearchEngine.buildIndex(searchData);

      // Restore saved criteria
      var saved = Storage.loadFilterCriteria();
      if (saved && Object.keys(saved).length > 0) {
        filterPanel.setCriteria(saved);
        filterCriteria = saved;
      }

      // Render
      log('渲染产品列表...');
      applyFiltersAndUpdate();
      log('就绪: ' + FilterEngine.getTotalCount() + ' 个产品');
    }).catch(function (err) {
      console.error('加载失败:', err);
      log('加载失败: ' + err.message);
      showError('数据加载失败', err.message || '未知错误');
    });
  }

  function applyFiltersAndUpdate() {
    var filtered = FilterEngine.filter(filterCriteria);

    if (searchQuery && searchQuery.trim()) {
      var searched = SearchEngine.search(searchQuery);
      var searchedSet = {};
      for (var i = 0; i < searched.length; i++) searchedSet[searched[i]] = true;
      var intersected = [];
      for (var j = 0; j < filtered.length; j++) {
        if (searchedSet[filtered[j]]) intersected.push(filtered[j]);
      }
      filtered = intersected;
    }

    var sorted = SortEngine.sort(filtered, currentSort, allProducts);
    currentFilteredIds = sorted;
    productList.setProductIds(sorted);

    // Update filter panel counts with current filtered IDs
    if (filterPanel && filterPanel.updateCounts) {
      filterPanel.updateCounts(currentFilteredIds);
    }

    var countEl = document.getElementById('result-count');
    if (countEl) countEl.textContent = '共 ' + sorted.length + ' 条结果';

    var infoEl = document.getElementById('data-info');
    if (infoEl) infoEl.textContent = sorted.length + ' / ' + FilterEngine.getTotalCount() + ' 个产品';
  }

  function updateCompareBar(selectedIds) {
    var bar = document.getElementById('compare-bar');
    var countEl = document.getElementById('compare-count');
    var btn = document.getElementById('compare-btn');
    if (countEl) countEl.textContent = '已选 ' + selectedIds.length + ' 个产品';
    if (btn) btn.disabled = selectedIds.length < 2;
    if (bar) {
      if (selectedIds.length > 0) bar.classList.add('visible');
      else bar.classList.remove('visible');
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
    var infoEl = document.getElementById('data-info');
    if (infoEl) infoEl.textContent = title;
  }

  // Boot
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
