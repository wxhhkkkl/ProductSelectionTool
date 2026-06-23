/**
 * ProductDetail — full detail overlay panel for a single product.
 */
var App = window.App || {};
App.UI = App.UI || {};

(function () {
  'use strict';

  var F = App.Utils.Format;
  var D = App.Utils.DOM;

  function ProductDetail(container) {
    var instance = {};
    var onCloseCallback = null;

    function show(product) {
      D.clearContainer(container);

      // Header
      var header = D.createElement('div', { className: 'detail-header' });
      var titleArea = D.createElement('div', {});
      titleArea.appendChild(D.createElement('div', { className: 'detail-name' }, product.name));
      titleArea.appendChild(D.createElement('div', { className: 'detail-brand' },
        product.brand + ' | ' + F.formatManufacturerLabel(product.manufacturerType)));

      var closeBtn = D.createElement('button', { className: 'detail-close', onClick: hide }, '×');
      header.appendChild(titleArea);
      header.appendChild(closeBtn);
      container.appendChild(header);

      // Tags row
      var tags = D.createElement('div', { className: 'card-tags', style: 'margin-bottom:16px' });
      if (product.certification) {
        tags.appendChild(D.createElement('span', { className: 'tag certification' }, F.formatCertificationLabel(product.certification)));
      }
      tags.appendChild(D.createElement('span', { className: 'tag dosage' }, F.formatDosageFormLabel(product.dosageForm)));
      tags.appendChild(D.createElement('span', { className: 'tag' }, '利润' + F.formatProfit(product.profitMargin)));
      container.appendChild(tags);

      // Section: Basic Info
      addSection(container, '基本信息', [
        { label: '剂型', value: F.formatDosageFormLabel(product.dosageForm) },
        { label: '规格', value: product.specification },
        { label: '包装', value: F.formatPackagingLabel(product.packaging) },
        { label: '产地', value: product.origin },
        { label: '销售渠道', value: F.formatChannelLabel(product.salesChannel) },
        { label: '批准文号', value: F.formatCertificationLabel(product.certification) }
      ]);

      // Section: Market Info
      addSection(container, '市场信息', [
        { label: '参考价格', value: F.formatPriceRange(product.priceMin, product.priceMax) },
        { label: '利润空间', value: F.formatProfit(product.profitMargin) },
        { label: '参考销售额', value: F.formatSales(product.referenceSales, product.salesDataType) + (product.salesDataPeriod ? ' (' + product.salesDataPeriod + ')' : '') },
        { label: '数据来源', value: product.salesDataType === 'exact' ? '精确数据' : (product.salesDataType === 'estimated' ? '估算数据' : (product.referenceSales ? '未标注' : '暂无')) }
      ]);

      // Section: Efficacy
      addSection(container, '功效与适用', [
        { label: '疗效程度', value: F.formatEfficacyLabel(product.efficacyLevel) },
        { label: '功能分类', value: F.formatLabelList(product.functionCategory, F.formatFunctionCategoryLabel) },
        { label: '原料分类', value: F.formatMaterialLabel(product.materialCategory) },
        { label: '适用人群', value: F.formatLabelList(product.targetPopulation, F.formatPopulationLabel) }
      ]);

      if (product.description) {
        addField(container, { label: '产品描述', value: product.description });
      }

      // Section: Listing URLs
      if (product.listingUrls && product.listingUrls.length > 0) {
        var urlSection = D.createElement('div', { className: 'detail-section' });
        urlSection.appendChild(D.createElement('h4', {}, '挂网链接 (' + product.listingUrls.length + '个平台)'));

        var table = D.createElement('table', { className: 'listing-urls-table' });
        var thead = D.createElement('thead', {},
          D.createElement('tr', {},
            D.createElement('th', {}, '平台'),
            D.createElement('th', {}, '链接'),
            D.createElement('th', {}, '平台价格'),
            D.createElement('th', {}, '采集日期')
          )
        );
        table.appendChild(thead);

        var tbody = D.createElement('tbody');
        for (var i = 0; i < product.listingUrls.length; i++) {
          var lu = product.listingUrls[i];
          var tr = D.createElement('tr', {},
            D.createElement('td', {}, lu.platform),
            D.createElement('td', {},
              D.createElement('a', { href: lu.url, target: '_blank', rel: 'noopener' }, lu.url.length > 50 ? lu.url.substring(0, 50) + '...' : lu.url)
            ),
            D.createElement('td', {}, lu.platformPrice ? F.formatPrice(lu.platformPrice) : '—'),
            D.createElement('td', {}, F.formatDate(lu.collectedAt))
          );
          tbody.appendChild(tr);
        }
        table.appendChild(tbody);
        urlSection.appendChild(table);
        container.appendChild(urlSection);
      }

      // Show overlay
      var overlay = document.getElementById('detail-overlay');
      if (overlay) D.removeClass(overlay, 'hidden');
    }

    function addSection(container, title, fields) {
      var section = D.createElement('div', { className: 'detail-section' });
      section.appendChild(D.createElement('h4', {}, title));
      for (var i = 0; i < fields.length; i++) {
        addField(section, fields[i]);
      }
      container.appendChild(section);
    }

    function addField(container, field) {
      var row = D.createElement('div', { className: 'detail-field' });
      row.appendChild(D.createElement('span', { className: 'field-label' }, field.label));
      row.appendChild(D.createElement('span', { className: 'field-value' }, field.value || '暂无'));
      container.appendChild(row);
    }

    function hide() {
      var overlay = document.getElementById('detail-overlay');
      if (overlay) D.addClass(overlay, 'hidden');
      if (onCloseCallback) onCloseCallback();
    }

    function onClose(cb) {
      onCloseCallback = cb;
    }

    instance.show = show;
    instance.hide = hide;
    instance.onClose = onClose;
    return instance;
  }

  App.UI.ProductDetail = ProductDetail;
})();
