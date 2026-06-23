/**
 * DataLoader — loads product JSON data and imports into IndexedDB.
 * Supports both inline data assignment (window.PRODUCT_DATA) and
 * loading from external data files via script tags.
 */
var App = window.App || {};
App.Data = App.Data || {};

(function () {
  'use strict';

  /**
   * Load products from an array and import into DataStore.
   * @param {Object[]} products
   * @param {string} dataVersion
   * @returns {Promise<{imported: number, skipped: number, errors: Array}>}
   */
  function loadFromArray(products, dataVersion) {
    var schema = App.Data.Schema;
    var store = App.Data.Store;
    var batchResult = schema.validateProductBatch(products);

    if (!batchResult.valid) {
      // Filter to valid products only
      var validProducts = [];
      for (var i = 0; i < products.length; i++) {
        var result = schema.validateProduct(products[i]);
        if (result.valid) {
          validProducts.push(products[i]);
        }
      }

      return store.importProducts(validProducts).then(function (count) {
        return store.setVersion(dataVersion || 'unknown').then(function () {
          return {
            imported: count,
            skipped: products.length - count,
            errors: batchResult.errors
          };
        });
      });
    }

    return store.importProducts(products).then(function (count) {
      return store.setVersion(dataVersion || 'unknown').then(function () {
        return {
          imported: count,
          skipped: 0,
          errors: []
        };
      });
    });
  }

  /**
   * Load data from a registered data chunk (e.g., window.PRODUCT_DATA_chunk).
   * @param {string} chunkKey - key on window object
   * @returns {Promise<{imported: number, skipped: number, errors: Array}>}
   */
  function loadChunk(chunkKey) {
    var data = window[chunkKey];
    if (!data || !Array.isArray(data)) {
      return Promise.reject(new Error('Data chunk "' + chunkKey + '" not found or not an array'));
    }
    var version = (data.length > 0 && data[0].dataVersion) ? data[0].dataVersion : null;
    return loadFromArray(data, version);
  }

  /**
   * Check if data needs to be loaded (DB empty or version mismatch).
   * @param {string} expectedVersion
   * @returns {Promise<boolean>}
   */
  function needsLoad(expectedVersion) {
    return App.Data.Store.isEmpty().then(function (empty) {
      if (empty) return true;
      return App.Data.Store.getVersion().then(function (currentVersion) {
        return currentVersion !== expectedVersion;
      });
    });
  }

  App.Data.Loader = {
    loadFromArray: loadFromArray,
    loadChunk: loadChunk,
    needsLoad: needsLoad
  };
})();
