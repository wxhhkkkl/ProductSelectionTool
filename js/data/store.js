/**
 * IndexedDB DataStore for product data persistence and querying.
 * Handles 100k+ product records with indexed query support.
 */
var App = window.App || {};
App.Data = App.Data || {};

(function () {
  'use strict';

  var DB_NAME = 'ProductSelectionDB';
  var DB_VERSION = 1;
  var STORE_NAME = 'products';
  var META_STORE = 'metadata';
  var db = null;

  /**
   * Open (or create) the IndexedDB database and create object stores / indexes.
   * @returns {Promise<void>}
   */
  function init() {
    return new Promise(function (resolve, reject) {
      if (!window.indexedDB) {
        reject(new Error('IndexedDB not supported in this browser'));
        return;
      }

      var request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = function (e) {
        var database = e.target.result;

        // Product store
        var store;
        if (!database.objectStoreNames.contains(STORE_NAME)) {
          store = database.createObjectStore(STORE_NAME, { keyPath: 'id' });
        } else {
          store = e.target.transaction.objectStore(STORE_NAME);
        }

        // Create indexes for filterable dimensions
        var indexes = [
          { name: 'name', keyPath: 'name', opts: { unique: false } },
          { name: 'brand', keyPath: 'brand', opts: { unique: false } },
          { name: 'manufacturerType', keyPath: 'manufacturerType', opts: { unique: false } },
          { name: 'functionCategory', keyPath: 'functionCategory', opts: { unique: false, multiEntry: true } },
          { name: 'materialCategory', keyPath: 'materialCategory', opts: { unique: false } },
          { name: 'dosageForm', keyPath: 'dosageForm', opts: { unique: false } },
          { name: 'packaging', keyPath: 'packaging', opts: { unique: false } },
          { name: 'targetPopulation', keyPath: 'targetPopulation', opts: { unique: false, multiEntry: true } },
          { name: 'efficacyLevel', keyPath: 'efficacyLevel', opts: { unique: false } },
          { name: 'certification', keyPath: 'certification', opts: { unique: false } },
          { name: 'origin', keyPath: 'origin', opts: { unique: false } },
          { name: 'salesChannel', keyPath: 'salesChannel', opts: { unique: false } },
          { name: 'priceMin', keyPath: 'priceMin', opts: { unique: false } },
          { name: 'priceMax', keyPath: 'priceMax', opts: { unique: false } },
          { name: 'profitMargin', keyPath: 'profitMargin', opts: { unique: false } },
          { name: 'referenceSales', keyPath: 'referenceSales', opts: { unique: false } }
        ];

        for (var i = 0; i < indexes.length; i++) {
          var idx = indexes[i];
          try {
            if (!store.indexNames.contains(idx.name)) {
              store.createIndex(idx.name, idx.keyPath, idx.opts);
            }
          } catch (ex) {
            // Index might already exist; skip
          }
        }

        // Metadata store
        if (!database.objectStoreNames.contains(META_STORE)) {
          database.createObjectStore(META_STORE, { keyPath: 'key' });
        }
      };

      request.onsuccess = function (e) {
        db = e.target.result;
        resolve();
      };

      request.onerror = function (e) {
        reject(new Error('Failed to open IndexedDB: ' + e.target.error.message));
      };
    });
  }

  function ensureDb() {
    if (!db) {
      return Promise.reject(new Error('Database not initialized. Call init() first.'));
    }
    return Promise.resolve();
  }

  /**
   * Bulk import products into the store.
   * @param {Object[]} products
   * @returns {Promise<number>} Number of products imported
   */
  function importProducts(products) {
    return ensureDb().then(function () {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(STORE_NAME, 'readwrite');
        var store = tx.objectStore(STORE_NAME);
        var count = 0;

        for (var i = 0; i < products.length; i++) {
          store.put(products[i]);
          count++;
        }

        tx.oncomplete = function () {
          resolve(count);
        };

        tx.onerror = function (e) {
          reject(new Error('Import failed: ' + e.target.error.message));
        };
      });
    });
  }

  /**
   * Get all product IDs from the store.
   * @returns {Promise<string[]>}
   */
  function getAllIds() {
    return ensureDb().then(function () {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(STORE_NAME, 'readonly');
        var store = tx.objectStore(STORE_NAME);
        var request = store.getAllKeys();
        request.onsuccess = function () { resolve(request.result); };
        request.onerror = function (e) { reject(e.target.error); };
      });
    });
  }

  /**
   * Get products by IDs with pagination.
   * @param {string[]} ids
   * @param {number} offset
   * @param {number} limit
   * @returns {Promise<Object[]>}
   */
  function getByIds(ids, offset, limit) {
    offset = offset || 0;
    limit = limit || ids.length;
    return ensureDb().then(function () {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(STORE_NAME, 'readonly');
        var store = tx.objectStore(STORE_NAME);
        var results = [];
        var end = Math.min(offset + limit, ids.length);
        var pending = end - offset;

        if (pending <= 0) {
          resolve([]);
          return;
        }

        for (var i = offset; i < end; i++) {
          var request = store.get(ids[i]);
          request.onsuccess = (function (idx) {
            return function (e) {
              if (e.target.result) {
                results[idx - offset] = e.target.result;
              }
              pending--;
              if (pending === 0) {
                resolve(results.filter(Boolean));
              }
            };
          })(i);
          request.onerror = function () {
            pending--;
            if (pending === 0) {
              resolve(results.filter(Boolean));
            }
          };
        }
      });
    });
  }

  /**
   * Get a single product by ID.
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  function getById(id) {
    return ensureDb().then(function () {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(STORE_NAME, 'readonly');
        var store = tx.objectStore(STORE_NAME);
        var request = store.get(id);
        request.onsuccess = function () { resolve(request.result || null); };
        request.onerror = function (e) { reject(e.target.error); };
      });
    });
  }

  /**
   * Get the current data version from metadata.
   * @returns {Promise<string|null>}
   */
  function getVersion() {
    return ensureDb().then(function () {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(META_STORE, 'readonly');
        var store = tx.objectStore(META_STORE);
        var request = store.get('dataVersion');
        request.onsuccess = function () {
          resolve(request.result ? request.result.value : null);
        };
        request.onerror = function (e) { reject(e.target.error); };
      });
    });
  }

  /**
   * Set the data version in metadata.
   * @param {string} version
   * @returns {Promise<void>}
   */
  function setVersion(version) {
    return ensureDb().then(function () {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(META_STORE, 'readwrite');
        var store = tx.objectStore(META_STORE);
        store.put({ key: 'dataVersion', value: version });
        tx.oncomplete = function () { resolve(); };
        tx.onerror = function (e) { reject(e.target.error); };
      });
    });
  }

  /**
   * Clear all data from the store.
   * @returns {Promise<void>}
   */
  function clear() {
    return ensureDb().then(function () {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction([STORE_NAME, META_STORE], 'readwrite');
        tx.objectStore(STORE_NAME).clear();
        tx.objectStore(META_STORE).clear();
        tx.oncomplete = function () { resolve(); };
        tx.onerror = function (e) { reject(e.target.error); };
      });
    });
  }

  /**
   * Check if the database is empty.
   * @returns {Promise<boolean>}
   */
  function isEmpty() {
    return getAllIds().then(function (ids) { return ids.length === 0; });
  }

  App.Data.Store = {
    init: init,
    importProducts: importProducts,
    getAllIds: getAllIds,
    getByIds: getByIds,
    getById: getById,
    getVersion: getVersion,
    setVersion: setVersion,
    clear: clear,
    isEmpty: isEmpty
  };
})();
