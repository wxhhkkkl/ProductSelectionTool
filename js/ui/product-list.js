/**
 * ProductList — virtual-scrolling product card list with compare selection.
 */
var App = window.App || {};
App.UI = App.UI || {};

(function () {
  'use strict';

  var F = App.Utils.Format;
  var D = App.Utils.DOM;
  var ROW_HEIGHT = 140; // card height in pixels
  var BUFFER = 5; // extra rows rendered above/below viewport

  function ProductList(container) {
    var instance = {};
    var productIds = [];
    var productsMap = {}; // id -> product
    var onItemClickCallback = null;
    var onCompareChangeCallback = null;
    var selectedForCompare = [];
    var scrollTop = 0;
    var viewportHeight = 0;

    function setProductIds(ids) {
      productIds = ids;
      render();
    }

    function render() {
      D.clearContainer(container);

      if (productIds.length === 0) {
        showEmptyState();
        return;
      }

      // Use simple rendering for now (virtual scrolling can be added later for 100k+ perf)
      var grid = D.createElement('div', { className: 'product-grid' });

      // Render all visible cards (for small datasets) or paginated
      var limit = Math.min(productIds.length, 200); // Cap at 200 for initial render
      for (var i = 0; i < limit; i++) {
        var product = productsMap[productIds[i]];
        if (product) {
          var card = createProductCard(product, productIds[i]);
          grid.appendChild(card);
        }
      }

      if (productIds.length > limit) {
        var more = D.createElement('div', {
          className: 'empty-state'
        }, '显示前 ' + limit + ' 条，共 ' + productIds.length + ' 条结果（请缩小筛选范围查看更多）');
        grid.appendChild(more);
      }

      container.appendChild(grid);
    }

    function createProductCard(product, id) {
      var isSelected = selectedForCompare.indexOf(id) !== -1;

      var card = D.createElement('div', {
        className: 'product-card',
        dataset: { productId: id },
        onClick: function (e) {
          // Don't trigger click if checkbox was clicked
          if (e.target.type === 'checkbox') return;
          if (onItemClickCallback) onItemClickCallback(id);
        }
      });

      // Compare checkbox
      var checkbox = D.createElement('input', {
        type: 'checkbox',
        className: 'compare-check',
        checked: isSelected,
        onClick: function (e) { e.stopPropagation(); },
        onChange: function () {
          toggleCompare(id);
        }
      });
      card.appendChild(checkbox);

      // Header: name + certification badge
      var header = D.createElement('div', { className: 'card-header' });
      var name = D.createElement('div', { className: 'card-name' }, product.name);
      header.appendChild(name);
      card.appendChild(header);

      // Brand
      var brand = D.createElement('div', { className: 'card-brand', style: 'margin-bottom:8px' }, product.brand);
      card.appendChild(brand);

      // Tags
      var tags = D.createElement('div', { className: 'card-tags' });
      if (product.certification) {
        tags.appendChild(D.createElement('span', { className: 'tag certification' }, F.formatCertificationLabel(product.certification)));
      }
      if (product.dosageForm) {
        tags.appendChild(D.createElement('span', { className: 'tag dosage' }, F.formatDosageFormLabel(product.dosageForm)));
      }
      if (product.targetPopulation && product.targetPopulation.length > 0) {
        for (var t = 0; t < Math.min(product.targetPopulation.length, 3); t++) {
          tags.appendChild(D.createElement('span', { className: 'tag population' }, F.formatPopulationLabel(product.targetPopulation[t])));
        }
      }
      // Profit tag
      var profitTagClass = product.profitMargin >= 50 ? 'profit-high' : (product.profitMargin >= 20 ? 'profit-mid' : 'profit-low');
      tags.appendChild(D.createElement('span', { className: 'tag ' + profitTagClass }, '利润' + F.formatProfit(product.profitMargin)));
      card.appendChild(tags);

      // Footer: price + sales
      var footer = D.createElement('div', { className: 'card-footer' });
      var price = D.createElement('span', { className: 'card-price' }, F.formatPriceRange(product.priceMin, product.priceMax));
      var sales = D.createElement('span', {}, '销量: ' + F.formatSales(product.referenceSales, product.salesDataType));
      footer.appendChild(price);
      footer.appendChild(sales);
      card.appendChild(footer);

      return card;
    }

    function toggleCompare(id) {
      var idx = selectedForCompare.indexOf(id);
      if (idx !== -1) {
        selectedForCompare.splice(idx, 1);
      } else {
        if (selectedForCompare.length >= 4) {
          alert('最多选择4个产品进行对比');
          return;
        }
        selectedForCompare.push(id);
      }
      if (onCompareChangeCallback) {
        onCompareChangeCallback(selectedForCompare.slice());
      }
      // Re-render to update checkbox states
      render();
    }

    function showEmptyState() {
      var empty = D.createElement('div', { className: 'empty-state' });
      var icon = D.createElement('div', { className: 'icon' }, '📭');
      var text = D.createElement('div', {}, '没有找到匹配的产品');
      var hint = D.createElement('div', { className: 'hint' }, '请尝试放宽筛选条件或清除筛选重新浏览');
      empty.appendChild(icon);
      empty.appendChild(text);
      empty.appendChild(hint);
      container.appendChild(empty);
    }

    function setProductsMap(map) {
      productsMap = map;
    }

    function onItemClick(cb) {
      onItemClickCallback = cb;
    }

    function onCompareSelectionChange(cb) {
      onCompareChangeCallback = cb;
    }

    function getSelectedForCompare() {
      return selectedForCompare.slice();
    }

    function clearCompareSelection() {
      selectedForCompare = [];
      render();
    }

    instance.setProductIds = setProductIds;
    instance.setProductsMap = setProductsMap;
    instance.onItemClick = onItemClick;
    instance.onCompareSelectionChange = onCompareSelectionChange;
    instance.getSelectedForCompare = getSelectedForCompare;
    instance.clearCompareSelection = clearCompareSelection;
    return instance;
  }

  App.UI.ProductList = ProductList;
})();
