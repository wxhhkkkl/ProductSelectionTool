/**
 * CompareView — side-by-side product comparison with winner highlighting.
 */
var App = window.App || {};
App.UI = App.UI || {};

(function () {
  'use strict';

  var F = App.Utils.Format;
  var D = App.Utils.DOM;

  function CompareView(container) {
    var instance = {};
    var onCloseCallback = null;
    var onViewDetailCallback = null;

    function show(products) {
      D.clearContainer(container);

      if (!products || products.length < 2) {
        container.appendChild(D.createElement('div', {
          className: 'empty-state'
        }, D.createElement('div', { className: 'icon' }, '⚠️'),
          D.createElement('div', {}, '至少需要选择2个产品才能进行对比')));
        return;
      }

      // Header
      var headerArea = D.createElement('div', {
        style: 'display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;'
      });

      var title = D.createElement('h3', {
        style: 'margin:0;'
      }, '产品对比 (' + products.length + '个产品)');

      var closeBtn = D.createElement('button', {
        className: 'detail-close',
        onClick: hide
      }, '×');
      headerArea.appendChild(title);
      headerArea.appendChild(closeBtn);
      container.appendChild(headerArea);

      // Comparison Table
      var table = D.createElement('table', { className: 'compare-table' });

      // Table header: product names + brands
      var thead = D.createElement('thead');
      var headerRow = D.createElement('tr');
      headerRow.appendChild(D.createElement('th', {}, '对比维度'));

      for (var i = 0; i < products.length; i++) {
        var cell = D.createElement('th', {},
          D.createElement('div', { style: 'font-weight:600' }, products[i].name),
          D.createElement('div', { style: 'font-size:11px;color:#5f6368;font-weight:400;margin-top:4px' }, products[i].brand)
        );
        headerRow.appendChild(cell);
      }
      thead.appendChild(headerRow);
      table.appendChild(thead);

      var tbody = D.createElement('tbody');

      // Dimension rows: each has a label + values, winner is highlighted
      var dimensions = [
        { label: '价格', getVal: function (p) { return F.formatPriceRange(p.priceMin, p.priceMax); }, quantifiable: true, betterIs: 'lower' },
        { label: '利润空间', getVal: function (p) { return F.formatProfit(p.profitMargin); }, quantifiable: true, betterIs: 'higher' },
        { label: '参考销售额', getVal: function (p) { return F.formatSales(p.referenceSales, p.salesDataType); }, quantifiable: true, betterIs: 'higher' },
        { label: '剂型', getVal: function (p) { return F.formatDosageFormLabel(p.dosageForm); }, quantifiable: false },
        { label: '规格', getVal: function (p) { return p.specification; }, quantifiable: false },
        { label: '包装', getVal: function (p) { return F.formatPackagingLabel(p.packaging); }, quantifiable: false },
        { label: '适用人群', getVal: function (p) { return F.formatLabelList(p.targetPopulation, F.formatPopulationLabel); }, quantifiable: false },
        { label: '疗效程度', getVal: function (p) { return F.formatEfficacyLabel(p.efficacyLevel); }, quantifiable: false },
        { label: '功能分类', getVal: function (p) { return F.formatLabelList(p.functionCategory, F.formatFunctionCategoryLabel); }, quantifiable: false },
        { label: '认证', getVal: function (p) { return F.formatCertificationLabel(p.certification); }, quantifiable: false },
        { label: '厂家类型', getVal: function (p) { return F.formatManufacturerLabel(p.manufacturerType); }, quantifiable: false },
        { label: '销售渠道', getVal: function (p) { return F.formatChannelLabel(p.salesChannel); }, quantifiable: false },
        { label: '产地', getVal: function (p) { return p.origin; }, quantifiable: false }
      ];

      for (var d = 0; d < dimensions.length; d++) {
        var dim = dimensions[d];
        var row = D.createElement('tr');
        row.appendChild(D.createElement('td', { className: 'dim-label' }, dim.label));

        var values = products.map(function (p) { return dim.getVal(p); });

        // Find winner for quantifiable dimensions
        var winnerIdx = -1;
        if (dim.quantifiable) {
          winnerIdx = findWinner(products, dim);
        }

        for (var v = 0; v < products.length; v++) {
          var td = D.createElement('td', {});
          if (v === winnerIdx) {
            D.addClass(td, 'winner');
          }
          td.appendChild(document.createTextNode(values[v]));
          row.appendChild(td);
        }

        tbody.appendChild(row);
      }

      // Action row: "View Detail" links
      var actionRow = D.createElement('tr');
      actionRow.appendChild(D.createElement('td', { className: 'dim-label' }, '操作'));
      for (var a = 0; a < products.length; a++) {
        (function (product) {
          var td = D.createElement('td', {});
          var link = D.createElement('button', {
            style: 'background:none;border:none;color:var(--color-primary);cursor:pointer;text-decoration:underline;font-size:13px;',
            onClick: function () {
              if (onViewDetailCallback) onViewDetailCallback(product.id);
            }
          }, '查看详情');
          td.appendChild(link);
          actionRow.appendChild(td);
        })(products[a]);
      }
      tbody.appendChild(actionRow);

      table.appendChild(tbody);
      container.appendChild(table);

      // Show overlay
      var overlay = document.getElementById('compare-overlay');
      if (overlay) D.removeClass(overlay, 'hidden');
    }

    function findWinner(products, dim) {
      var best = 0;
      if (dim.betterIs === 'lower') {
        for (var i = 1; i < products.length; i++) {
          var currVal = getNumericValue(products[i], dim.label);
          var bestVal = getNumericValue(products[best], dim.label);
          if (currVal < bestVal) best = i;
        }
      } else {
        for (var i = 1; i < products.length; i++) {
          var currVal = getNumericValue(products[i], dim.label);
          var bestVal = getNumericValue(products[best], dim.label);
          if (currVal > bestVal) best = i;
        }
      }
      return best;
    }

    function getNumericValue(product, label) {
      switch (label) {
        case '价格': return product.priceMin;
        case '利润空间': return product.profitMargin || 0;
        case '参考销售额': return product.referenceSales || 0;
        default: return 0;
      }
    }

    function hide() {
      var overlay = document.getElementById('compare-overlay');
      if (overlay) D.addClass(overlay, 'hidden');
      if (onCloseCallback) onCloseCallback();
    }

    function onClose(cb) { onCloseCallback = cb; }
    function onViewDetail(cb) { onViewDetailCallback = cb; }

    instance.show = show;
    instance.hide = hide;
    instance.onClose = onClose;
    instance.onViewDetail = onViewDetail;
    return instance;
  }

  App.UI.CompareView = CompareView;
})();
