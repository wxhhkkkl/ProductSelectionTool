/**
 * Format utilities for displaying product data in Chinese locale.
 */
var App = window.App || {};
App.Utils = App.Utils || {};

(function () {
  'use strict';

  /**
   * Format a price in CNY.
   * @param {number} n
   * @returns {string}
   */
  function formatPrice(n) {
    if (n === null || n === undefined || isNaN(n)) return '暂无';
    return '¥' + n.toFixed(2).replace(/\.00$/, '').replace(/(\.[1-9])0$/, '$1');
  }

  /**
   * Format a price range.
   * @param {number} min
   * @param {number} max
   * @returns {string}
   */
  function formatPriceRange(min, max) {
    if (min === max) return formatPrice(min);
    return formatPrice(min) + ' - ' + formatPrice(max);
  }

  /**
   * Format profit margin as percentage.
   * @param {number} n
   * @returns {string}
   */
  function formatProfit(n) {
    if (n === null || n === undefined || isNaN(n)) return '暂无';
    return n.toFixed(0) + '%';
  }

  /**
   * Format sales amount (in 万元).
   * @param {number|null} n
   * @param {string} [dataType] - 'exact' or 'estimated'
   * @returns {string}
   */
  function formatSales(n, dataType) {
    if (n === null || n === undefined || isNaN(n)) return '暂无数据';
    var label = dataType === 'estimated' ? '（估）' : '';
    if (n >= 10000) {
      return (n / 10000).toFixed(2) + '亿' + label;
    }
    return n.toFixed(0) + '万' + label;
  }

  /**
   * Format a date string for display.
   * @param {string} d - date string
   * @returns {string}
   */
  function formatDate(d) {
    if (!d) return '未知';
    return d; // Already in YYYY-MM-DD or similar format
  }

  // --- Chinese label mappings ---

  var DOSAGE_FORM_LABELS = {
    tablet: '片剂', capsule: '胶囊', liquid: '口服液',
    granule: '颗粒', pill: '丸剂', paste: '膏剂', tea: '代用茶', powder: '粉剂'
  };

  var EFFICACY_LABELS = {
    health: '保健级', conditioning: '调理级', treatment_adjunct: '治疗辅助级'
  };

  var CERTIFICATION_LABELS = {
    blue_hat: '蓝帽', sc_food: 'SC食品', gmp: 'GMP认证', other: '其他'
  };

  var MANUFACTURER_LABELS = {
    famous_pharma: '知名药企', specialty_health: '专业保健品厂', oem: 'OEM代工厂'
  };

  var CHANNEL_LABELS = {
    online_only: '线上专供', offline_only: '线下专供', omni_channel: '全渠道'
  };

  var PACKAGING_LABELS = {
    single_box: '单盒装', gift_box: '礼盒装', family_pack: '家庭装', bulk: '散装'
  };

  var FUNCTION_CATEGORY_LABELS = {
    immunity: '增强免疫力', sleep: '助眠安神', digestion: '健脾消食',
    bone: '强健骨骼', beauty: '美容养颜', sangan: '调节三高', kidney: '补肾益气',
    throat: '清咽润喉', brain: '益智健脑', antioxidant: '抗氧化', eye: '护眼明目',
    vitamin: '基础维生素', herb: '中药食材', cereal: '谷物膳食',
    protein: '蛋白质补充', probiotic: '益生菌', mineral: '矿物质补充', collagen: '胶原蛋白',
    liver: '护肝养肝', bee: '蜂产品'
  };

  var MATERIAL_LABELS = {
    ginseng: '人参类', goji: '枸杞类', ganoderma: '灵芝类',
    donkey_hide: '阿胶类', astragalus: '黄芪类', other: '其他'
  };

  var POPULATION_LABELS = {
    children: '儿童', adult: '成人', elderly: '中老年',
    pregnant: '孕妇', male: '男性', female: '女性', general: '通用'
  };

  function formatDosageFormLabel(key) { return DOSAGE_FORM_LABELS[key] || key; }
  function formatEfficacyLabel(key) { return EFFICACY_LABELS[key] || key; }
  function formatCertificationLabel(key) { return CERTIFICATION_LABELS[key] || key; }
  function formatManufacturerLabel(key) { return MANUFACTURER_LABELS[key] || key; }
  function formatChannelLabel(key) { return CHANNEL_LABELS[key] || key; }
  function formatPackagingLabel(key) { return PACKAGING_LABELS[key] || key; }
  function formatFunctionCategoryLabel(key) { return FUNCTION_CATEGORY_LABELS[key] || key; }
  function formatMaterialLabel(key) { return MATERIAL_LABELS[key] || key; }
  function formatPopulationLabel(key) { return POPULATION_LABELS[key] || key; }

  /**
   * Format a list of enum values to Chinese labels joined by separator.
   * @param {string[]} values
   * @param {function} labelFn
   * @param {string} [sep]
   * @returns {string}
   */
  function formatLabelList(values, labelFn, sep) {
    if (!values || values.length === 0) return '暂无';
    sep = sep || '、';
    return values.map(function (v) { return labelFn(v); }).join(sep);
  }

  App.Utils.Format = {
    formatPrice: formatPrice,
    formatPriceRange: formatPriceRange,
    formatProfit: formatProfit,
    formatSales: formatSales,
    formatDate: formatDate,
    formatDosageFormLabel: formatDosageFormLabel,
    formatEfficacyLabel: formatEfficacyLabel,
    formatCertificationLabel: formatCertificationLabel,
    formatManufacturerLabel: formatManufacturerLabel,
    formatChannelLabel: formatChannelLabel,
    formatPackagingLabel: formatPackagingLabel,
    formatFunctionCategoryLabel: formatFunctionCategoryLabel,
    formatMaterialLabel: formatMaterialLabel,
    formatPopulationLabel: formatPopulationLabel,
    formatLabelList: formatLabelList
  };
})();
