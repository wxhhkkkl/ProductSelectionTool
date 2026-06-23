/**
 * FilterEngine — multi-dimensional in-memory filter with inverted indexes.
 * Supports 11 filter dimensions with real-time intersection.
 */
var App = window.App || {};
App.Engine = App.Engine || {};

(function () {
  'use strict';

  // Inverted indexes: dimension -> value -> Set of product IDs
  var indexes = {};
  var allIds = [];
  var productMeta = {}; // id -> { priceMin, priceMax, profitMargin, referenceSales, ... }

  /**
   * Build in-memory inverted indexes from product metadata.
   * @param {string[]} ids - product IDs
   * @param {function} getProductMeta - (id) => metadata object
   */
  function buildIndex(ids, getProductMeta) {
    allIds = ids.slice();
    indexes = {};
    productMeta = {};

    for (var i = 0; i < ids.length; i++) {
      var id = ids[i];
      var meta = getProductMeta(id);
      if (!meta) continue;
      productMeta[id] = meta;

      // Index each filterable dimension
      indexDimension('manufacturerType', id, meta.manufacturerType);
      indexDimension('dosageForm', id, meta.dosageForm);
      indexDimension('packaging', id, meta.packaging);
      indexDimension('efficacyLevel', id, meta.efficacyLevel);
      indexDimension('certification', id, meta.certification);
      indexDimension('origin', id, meta.origin);
      indexDimension('salesChannel', id, meta.salesChannel);
      indexDimension('materialCategory', id, meta.materialCategory);

      // Multi-value dimensions
      indexMultiDimension('functionCategory', id, meta.functionCategory);
      indexMultiDimension('targetPopulation', id, meta.targetPopulation);

      // Numeric dimensions: store in productMeta for range queries
      // (priceMin, priceMax, profitMargin, referenceSales are stored in productMeta)
    }
  }

  function indexDimension(dim, id, value) {
    if (value === null || value === undefined) return;
    if (!indexes[dim]) indexes[dim] = {};
    if (!indexes[dim][value]) indexes[dim][value] = [];
    indexes[dim][value].push(id);
  }

  function indexMultiDimension(dim, id, values) {
    if (!values || !Array.isArray(values)) return;
    for (var i = 0; i < values.length; i++) {
      indexDimension(dim, id, values[i]);
    }
  }

  /**
   * Filter products by criteria. Returns array of matching product IDs.
   * @param {Object} criteria - FilterCriteria object
   * @returns {string[]}
   */
  function filter(criteria) {
    if (!criteria) return allIds.slice();

    var resultSets = [];

    // Enum dimensions — use inverted index
    resultSets = addEnumFilter(resultSets, criteria.manufacturerType, 'manufacturerType');
    resultSets = addEnumFilter(resultSets, criteria.dosageForm, 'dosageForm');
    resultSets = addEnumFilter(resultSets, criteria.packaging, 'packaging');
    resultSets = addEnumFilter(resultSets, criteria.efficacyLevel, 'efficacyLevel');
    resultSets = addEnumFilter(resultSets, criteria.certification, 'certification');
    resultSets = addEnumFilter(resultSets, criteria.origin, 'origin');
    resultSets = addEnumFilter(resultSets, criteria.salesChannel, 'salesChannel');
    resultSets = addEnumFilter(resultSets, criteria.materialCategory, 'materialCategory');
    resultSets = addEnumFilter(resultSets, criteria.functionCategory, 'functionCategory');
    resultSets = addEnumFilter(resultSets, criteria.targetPopulation, 'targetPopulation');

    // Numeric/range dimensions — scan productMeta
    if (criteria.priceRange && (criteria.priceRange.min !== undefined || criteria.priceRange.max !== undefined)) {
      resultSets.push(filterPriceRange(criteria.priceRange));
    }
    if (criteria.profitRange && (criteria.profitRange.min !== undefined || criteria.profitRange.max !== undefined)) {
      resultSets.push(filterProfitRange(criteria.profitRange));
    }

    // Intersect all result sets
    if (resultSets.length === 0) return allIds.slice();

    // Sort by size, intersect smallest first
    resultSets.sort(function (a, b) { return a.length - b.length; });

    var result = toIdSet(resultSets[0]);
    for (var i = 1; i < resultSets.length; i++) {
      result = intersectSets(result, toIdSet(resultSets[i]));
      if (Object.keys(result).length === 0) break;
    }

    return Object.keys(result);
  }

  function addEnumFilter(resultSets, values, dim) {
    if (!values || !Array.isArray(values) || values.length === 0) return resultSets;
    if (!indexes[dim]) return resultSets;

    var union = {};
    for (var i = 0; i < values.length; i++) {
      var ids = indexes[dim][values[i]];
      if (ids) {
        for (var j = 0; j < ids.length; j++) {
          union[ids[j]] = true;
        }
      }
    }
    var idList = Object.keys(union);
    if (idList.length > 0) {
      resultSets.push(idList);
    }
    return resultSets;
  }

  function filterPriceRange(range) {
    var result = [];
    var min = range.min !== undefined ? range.min : -Infinity;
    var max = range.max !== undefined ? range.max : Infinity;

    for (var i = 0; i < allIds.length; i++) {
      var meta = productMeta[allIds[i]];
      if (!meta) continue;
      // Product matches if its price range overlaps with the filter range
      if (meta.priceMax >= min && meta.priceMin <= max) {
        result.push(allIds[i]);
      }
    }
    return result;
  }

  function filterProfitRange(range) {
    var result = [];
    var min = range.min !== undefined ? range.min : -Infinity;
    var max = range.max !== undefined ? range.max : Infinity;

    for (var i = 0; i < allIds.length; i++) {
      var meta = productMeta[allIds[i]];
      if (!meta) continue;
      if (meta.profitMargin >= min && meta.profitMargin <= max) {
        result.push(allIds[i]);
      }
    }
    return result;
  }

  function toIdSet(arr) {
    var set = {};
    for (var i = 0; i < arr.length; i++) {
      set[arr[i]] = true;
    }
    return set;
  }

  function intersectSets(a, b) {
    var result = {};
    var keys = Object.keys(a);
    for (var i = 0; i < keys.length; i++) {
      if (b[keys[i]]) {
        result[keys[i]] = true;
      }
    }
    return result;
  }

  /**
   * Get available values and counts for a dimension in the current result set.
   * @param {string} dimension - dimension name
   * @param {string[]} currentIds - current filtered product IDs (for count calculation)
   * @returns {Array<{value: string, count: number}>}
   */
  function getDimensionValues(dimension, currentIds) {
    if (!indexes[dimension]) return [];

    var idSet = toIdSet(currentIds);
    var dimIndex = indexes[dimension];
    var result = [];
    var keys = Object.keys(dimIndex);

    for (var i = 0; i < keys.length; i++) {
      var ids = dimIndex[keys[i]];
      var count = 0;
      for (var j = 0; j < ids.length; j++) {
        if (idSet[ids[j]]) count++;
      }
      if (count > 0) {
        result.push({ value: keys[i], count: count });
      }
    }
    return result.sort(function (a, b) { return b.count - a.count; });
  }

  /**
   * Get total number of indexed products.
   * @returns {number}
   */
  function getTotalCount() {
    return allIds.length;
  }

  /**
   * Reset all indexes.
   */
  function reset() {
    indexes = {};
    allIds = [];
    productMeta = {};
  }

  App.Engine.Filter = {
    buildIndex: buildIndex,
    filter: filter,
    getDimensionValues: getDimensionValues,
    getTotalCount: getTotalCount,
    reset: reset
  };
})();
