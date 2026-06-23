/**
 * localStorage wrapper for persisting filter criteria and user preferences.
 */
var App = window.App || {};
App.Utils = App.Utils || {};

(function () {
  'use strict';

  var FILTER_KEY = 'pst_filter_criteria';
  var PREFIX = 'pst_';

  /**
   * Save filter criteria to localStorage.
   * @param {Object} criteria
   */
  function saveFilterCriteria(criteria) {
    try {
      var data = JSON.stringify(criteria);
      localStorage.setItem(FILTER_KEY, data);
    } catch (e) {
      // localStorage full or disabled — silently fail
      console.warn('Failed to save filter criteria:', e.message);
    }
  }

  /**
   * Load filter criteria from localStorage.
   * @returns {Object|null} Parsed criteria or null if not found / corrupted
   */
  function loadFilterCriteria() {
    try {
      var data = localStorage.getItem(FILTER_KEY);
      if (!data) return null;
      var parsed = JSON.parse(data);
      if (typeof parsed !== 'object' || parsed === null) return null;
      return parsed;
    } catch (e) {
      // Corrupted data — clear and return null
      localStorage.removeItem(FILTER_KEY);
      return null;
    }
  }

  /**
   * Clear saved filter criteria.
   */
  function clearFilterCriteria() {
    localStorage.removeItem(FILTER_KEY);
  }

  /**
   * Generic key-value storage with prefix.
   * @param {string} key
   * @param {*} value
   */
  function set(key, value) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch (e) {
      console.warn('localStorage set failed for', key, ':', e.message);
    }
  }

  /**
   * Generic key-value retrieval.
   * @param {string} key
   * @param {*} defaultValue
   * @returns {*}
   */
  function get(key, defaultValue) {
    try {
      var data = localStorage.getItem(PREFIX + key);
      if (data === null) return defaultValue;
      return JSON.parse(data);
    } catch (e) {
      return defaultValue;
    }
  }

  /**
   * Remove a key from storage.
   * @param {string} key
   */
  function remove(key) {
    localStorage.removeItem(PREFIX + key);
  }

  App.Utils.Storage = {
    saveFilterCriteria: saveFilterCriteria,
    loadFilterCriteria: loadFilterCriteria,
    clearFilterCriteria: clearFilterCriteria,
    set: set,
    get: get,
    remove: remove
  };
})();
