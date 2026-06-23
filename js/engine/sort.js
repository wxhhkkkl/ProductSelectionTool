/**
 * SortEngine — sorts product IDs by specified criteria.
 */
var App = window.App || {};
App.Engine = App.Engine || {};

(function () {
  'use strict';

  /**
   * Sort product IDs by the given field.
   * @param {string[]} productIds - IDs to sort
   * @param {string} sortBy - 'sales_desc' | 'price_asc' | 'price_desc' | 'profit_desc'
   * @param {Object<string, Object>} products - ID → product metadata map
   * @returns {string[]}
   */
  function sort(productIds, sortBy, products) {
    var ids = productIds.slice();

    switch (sortBy) {
      case 'sales_desc':
        ids.sort(function (a, b) {
          var sa = getSales(products[a]);
          var sb = getSales(products[b]);
          return sb - sa; // descending
        });
        break;

      case 'price_asc':
        ids.sort(function (a, b) {
          var pa = getPriceMin(products[a]);
          var pb = getPriceMin(products[b]);
          return pa - pb; // ascending
        });
        break;

      case 'price_desc':
        ids.sort(function (a, b) {
          var pa = getPriceMin(products[a]);
          var pb = getPriceMin(products[b]);
          return pb - pa; // descending
        });
        break;

      case 'profit_desc':
        ids.sort(function (a, b) {
          var fa = getProfit(products[a]);
          var fb = getProfit(products[b]);
          return fb - fa; // descending
        });
        break;

      default:
        // Default: sales_desc
        ids.sort(function (a, b) {
          var sa = getSales(products[a]);
          var sb = getSales(products[b]);
          return sb - sa;
        });
    }

    return ids;
  }

  function getSales(p) {
    if (!p || p.referenceSales === null || p.referenceSales === undefined) return -1;
    return p.referenceSales;
  }

  function getPriceMin(p) {
    if (!p || p.priceMin === undefined) return Infinity;
    return p.priceMin;
  }

  function getProfit(p) {
    if (!p || p.profitMargin === undefined) return -1;
    return p.profitMargin;
  }

  App.Engine.Sort = {
    sort: sort
  };
})();
