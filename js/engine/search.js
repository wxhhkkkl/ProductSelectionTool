/**
 * SearchEngine — prefix/substring search over product name and brand.
 * Builds a simple search index for fast keyword matching.
 */
var App = window.App || {};
App.Engine = App.Engine || {};

(function () {
  'use strict';

  var productMap = {}; // id -> { name, brand, searchText }

  /**
   * Build search index from an array of product metadata.
   * @param {Array<{id: string, name: string, brand: string}>} products
   */
  function buildIndex(products) {
    productMap = {};
    for (var i = 0; i < products.length; i++) {
      var p = products[i];
      productMap[p.id] = {
        name: p.name || '',
        brand: p.brand || '',
        searchText: (p.name + ' ' + p.brand).toLowerCase()
      };
    }
  }

  /**
   * Search products by keyword.
   * @param {string} query
   * @returns {string[]} Matching product IDs, scored by relevance
   */
  function search(query) {
    if (!query || query.trim() === '') return [];

    var q = query.trim().toLowerCase();
    var results = [];
    var ids = Object.keys(productMap);

    for (var i = 0; i < ids.length; i++) {
      var id = ids[i];
      var p = productMap[id];
      var score = matchScore(p.searchText, q, p.name.toLowerCase(), p.brand.toLowerCase(), q);
      if (score > 0) {
        results.push({ id: id, score: score });
      }
    }

    // Sort by score descending
    results.sort(function (a, b) { return b.score - a.score; });
    return results.map(function (r) { return r.id; });
  }

  /**
   * Calculate match score:
   * - Exact name match: 100
   * - Name starts with query: 80
   * - Name contains query: 60
   * - Brand starts with query: 40
   * - Brand contains query: 30
   * - SearchText contains query: 10
   * @param {string} searchText
   * @param {string} query
   * @param {string} name
   * @param {string} brand
   * @param {string} q
   * @returns {number}
   */
  function matchScore(searchText, query, name, brand, q) {
    if (name === q) return 100;
    if (name.indexOf(q) === 0) return 80;
    if (name.indexOf(q) !== -1) return 60;
    if (brand.indexOf(q) === 0) return 40;
    if (brand.indexOf(q) !== -1) return 30;
    if (searchText.indexOf(q) !== -1) return 10;
    return 0;
  }

  /**
   * Reset the search index.
   */
  function reset() {
    productMap = {};
  }

  App.Engine.Search = {
    buildIndex: buildIndex,
    search: search,
    reset: reset
  };
})();
