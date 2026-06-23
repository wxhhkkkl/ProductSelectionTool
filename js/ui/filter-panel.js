/**
 * FilterPanel — renders 11-dimension filter UI in the sidebar.
 */
var App = window.App || {};
App.UI = App.UI || {};

(function () {
  'use strict';

  var F = App.Utils.Format;
  var D = App.Utils.DOM;

  // Filter dimension definitions
  var DIMENSIONS = [
    {
      key: 'functionCategory',
      label: '功能分类',
      type: 'multi',
      getLabel: F.formatFunctionCategoryLabel
    },
    {
      key: 'targetPopulation',
      label: '适用人群',
      type: 'multi',
      getLabel: F.formatPopulationLabel
    },
    {
      key: 'efficacyLevel',
      label: '疗效程度',
      type: 'multi',
      getLabel: F.formatEfficacyLabel
    },
    {
      key: 'dosageForm',
      label: '剂型',
      type: 'multi',
      getLabel: F.formatDosageFormLabel
    },
    {
      key: 'certification',
      label: '批准文号',
      type: 'multi',
      getLabel: F.formatCertificationLabel
    },
    {
      key: 'manufacturerType',
      label: '厂家类型',
      type: 'multi',
      getLabel: F.formatManufacturerLabel
    },
    {
      key: 'salesChannel',
      label: '销售渠道',
      type: 'multi',
      getLabel: F.formatChannelLabel
    },
    {
      key: 'packaging',
      label: '包装规格',
      type: 'multi',
      getLabel: F.formatPackagingLabel
    },
    {
      key: 'materialCategory',
      label: '原料分类',
      type: 'multi',
      getLabel: F.formatMaterialLabel
    },
    {
      key: 'origin',
      label: '产地',
      type: 'multi',
      getLabel: function (v) { return v; }
    },
    {
      key: 'priceRange',
      label: '价格带 (¥)',
      type: 'range',
      rangeKey: 'priceRange'
    },
    {
      key: 'profitRange',
      label: '利润空间 (%)',
      type: 'range',
      rangeKey: 'profitRange'
    }
  ];

  var PRICE_RANGES = [
    { label: '50元以下', min: 0, max: 50 },
    { label: '50-100元', min: 50, max: 100 },
    { label: '100-200元', min: 100, max: 200 },
    { label: '200元以上', min: 200, max: Infinity }
  ];

  var PROFIT_RANGES = [
    { label: '低利润 (<20%)', min: 0, max: 20 },
    { label: '中等利润 (20-50%)', min: 20, max: 50 },
    { label: '高利润 (>50%)', min: 50, max: 100 }
  ];

  function FilterPanel(container) {
    var instance = {};
    var criteria = {};
    var onChangeCallback = null;
    var currentIds = [];

    function render() {
      D.clearContainer(container);

      for (var i = 0; i < DIMENSIONS.length; i++) {
        var dim = DIMENSIONS[i];
        var section = createSection(dim);
        container.appendChild(section);
      }
    }

    function createSection(dim) {
      var section = D.createElement('div', { className: 'filter-section' });
      var title = D.createElement('div', {
        className: 'filter-section-title',
        onClick: function () {
          D.toggleClass(section, 'collapsed');
        }
      }, dim.label);
      section.appendChild(title);

      var optionsContainer = D.createElement('div', { className: 'filter-options' });

      if (dim.type === 'multi') {
        var values = [];
        if (App.Engine && App.Engine.Filter) {
          values = App.Engine.Filter.getDimensionValues(dim.key, currentIds.length > 0 ? currentIds : []);
        }
        if (values.length === 0) {
          // Show available values from global data
          values = getAvailableValues(dim.key);
        }

        for (var j = 0; j < values.length; j++) {
          var opt = createCheckboxOption(dim, values[j].value, values[j].count);
          optionsContainer.appendChild(opt);
        }
      } else if (dim.type === 'range') {
        if (dim.rangeKey === 'priceRange') {
          for (var p = 0; p < PRICE_RANGES.length; p++) {
            var pr = PRICE_RANGES[p];
            var opt = createRangeOption(dim, pr.label, pr.min, pr.max);
            optionsContainer.appendChild(opt);
          }
        } else if (dim.rangeKey === 'profitRange') {
          for (var f = 0; f < PROFIT_RANGES.length; f++) {
            var fr = PROFIT_RANGES[f];
            var opt = createRangeOption(dim, fr.label, fr.min, fr.max);
            optionsContainer.appendChild(opt);
          }
        }
      }

      section.appendChild(optionsContainer);
      return section;
    }

    function createCheckboxOption(dim, value, count) {
      var checked = false;
      if (criteria[dim.key] && Array.isArray(criteria[dim.key])) {
        checked = criteria[dim.key].indexOf(value) !== -1;
      }

      var label = D.createElement('label', { className: 'filter-option' });
      var input = D.createElement('input', {
        type: 'checkbox',
        value: value
      });
      if (checked) input.checked = true;

      input.addEventListener('change', function () {
        handleMultiChange(dim.key, value, input.checked);
      });

      var displayLabel = dim.getLabel ? dim.getLabel(value) : value;
      var countSpan = D.createElement('span', { className: 'count' }, '(' + (count || 0) + ')');

      label.appendChild(input);
      label.appendChild(document.createTextNode(displayLabel));
      label.appendChild(countSpan);

      return label;
    }

    function createRangeOption(dim, labelText, min, max) {
      var checked = false;
      if (criteria[dim.rangeKey]) {
        checked = criteria[dim.rangeKey].min === min && criteria[dim.rangeKey].max === max;
      }

      var label = D.createElement('label', { className: 'filter-option' });
      var input = D.createElement('input', {
        type: 'radio',
        name: dim.rangeKey,
        value: labelText
      });
      if (checked) input.checked = true;

      input.addEventListener('change', function () {
        if (input.checked) {
          criteria[dim.rangeKey] = { min: min, max: max === Infinity ? 999999 : max };
          emitChange();
        }
      });

      label.appendChild(input);
      label.appendChild(document.createTextNode(labelText));
      return label;
    }

    function handleMultiChange(dimKey, value, checked) {
      if (!criteria[dimKey]) criteria[dimKey] = [];
      if (checked) {
        if (criteria[dimKey].indexOf(value) === -1) {
          criteria[dimKey].push(value);
        }
      } else {
        var idx = criteria[dimKey].indexOf(value);
        if (idx !== -1) {
          criteria[dimKey].splice(idx, 1);
        }
        if (criteria[dimKey].length === 0) {
          delete criteria[dimKey];
        }
      }
      emitChange();
    }

    function emitChange() {
      if (onChangeCallback) {
        onChangeCallback(getCriteria());
      }
    }

    function getCriteria() {
      var c = {};
      Object.keys(criteria).forEach(function (k) {
        if (criteria[k] && (typeof criteria[k] !== 'object' || Object.keys(criteria[k]).length > 0)) {
          if (Array.isArray(criteria[k]) && criteria[k].length === 0) return;
          c[k] = criteria[k];
        }
      });
      return c;
    }

    function setCriteria(c) {
      criteria = c || {};
      render();
    }

    function reset() {
      criteria = {};
      // Uncheck all radio buttons
      var radios = container.querySelectorAll('input[type="radio"]');
      for (var i = 0; i < radios.length; i++) {
        radios[i].checked = false;
      }
      emitChange();
      render();
    }

    function setDimensionOptions(dim, options) {
      // Update counts in the UI dynamically (called after filter changes)
    }

    function updateCounts(ids) {
      currentIds = ids;
      // Re-render sections to update counts
      // (In production, we'd update counts without full re-render)
    }

    function onChange(cb) {
      onChangeCallback = cb;
    }

    function getAvailableValues(dimKey) {
      // Fallback: return sample values if no engine is available
      var fallbacks = {
        functionCategory: [
          { value: 'immunity', count: 0 },
          { value: 'sleep', count: 0 },
          { value: 'digestion', count: 0 },
          { value: 'bone', count: 0 },
          { value: 'beauty', count: 0 },
          { value: 'sangan', count: 0 },
          { value: 'kidney', count: 0 }
        ],
        targetPopulation: [
          { value: 'children', count: 0 },
          { value: 'adult', count: 0 },
          { value: 'elderly', count: 0 },
          { value: 'pregnant', count: 0 },
          { value: 'male', count: 0 },
          { value: 'female', count: 0 },
          { value: 'general', count: 0 }
        ],
        efficacyLevel: [
          { value: 'health', count: 0 },
          { value: 'conditioning', count: 0 },
          { value: 'treatment_adjunct', count: 0 }
        ],
        dosageForm: [
          { value: 'tablet', count: 0 },
          { value: 'capsule', count: 0 },
          { value: 'liquid', count: 0 },
          { value: 'granule', count: 0 },
          { value: 'pill', count: 0 },
          { value: 'paste', count: 0 },
          { value: 'tea', count: 0 },
          { value: 'powder', count: 0 }
        ],
        certification: [
          { value: 'blue_hat', count: 0 },
          { value: 'sc_food', count: 0 },
          { value: 'gmp', count: 0 },
          { value: 'other', count: 0 }
        ],
        manufacturerType: [
          { value: 'famous_pharma', count: 0 },
          { value: 'specialty_health', count: 0 },
          { value: 'oem', count: 0 }
        ],
        salesChannel: [
          { value: 'online_only', count: 0 },
          { value: 'offline_only', count: 0 },
          { value: 'omni_channel', count: 0 }
        ],
        packaging: [
          { value: 'single_box', count: 0 },
          { value: 'gift_box', count: 0 },
          { value: 'family_pack', count: 0 },
          { value: 'bulk', count: 0 }
        ],
        materialCategory: [
          { value: 'ginseng', count: 0 },
          { value: 'goji', count: 0 },
          { value: 'ganoderma', count: 0 },
          { value: 'donkey_hide', count: 0 },
          { value: 'astragalus', count: 0 },
          { value: 'other', count: 0 }
        ],
        origin: []
      };
      return fallbacks[dimKey] || [];
    }

    render();

    instance.setDimensionOptions = setDimensionOptions;
    instance.onChange = onChange;
    instance.setCriteria = setCriteria;
    instance.getCriteria = getCriteria;
    instance.reset = reset;
    instance.updateCounts = updateCounts;
    return instance;
  }

  App.UI.FilterPanel = FilterPanel;
})();
