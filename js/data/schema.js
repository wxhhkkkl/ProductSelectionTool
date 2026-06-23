/**
 * Product data schema definition and validation.
 * Part of the ProductSelectionTool data layer.
 */
var App = window.App || {};
App.Data = App.Data || {};

(function () {
  'use strict';

  var REQUIRED_FIELDS = [
    'id', 'name', 'brand', 'manufacturerType', 'functionCategory',
    'materialCategory', 'dosageForm', 'specification', 'packaging',
    'targetPopulation', 'efficacyLevel', 'certification', 'origin',
    'salesChannel', 'priceMin', 'priceMax', 'profitMargin', 'dataVersion'
  ];

  var VALID_ENUMS = {
    manufacturerType: ['famous_pharma', 'specialty_health', 'oem'],
    dosageForm: ['tablet', 'capsule', 'liquid', 'granule', 'pill', 'paste', 'tea', 'powder'],
    packaging: ['single_box', 'gift_box', 'family_pack', 'bulk'],
    efficacyLevel: ['health', 'conditioning', 'treatment_adjunct'],
    certification: ['blue_hat', 'sc_food', 'gmp', 'other'],
    salesChannel: ['online_only', 'offline_only', 'omni_channel'],
    salesDataType: ['exact', 'estimated']
  };

  var VALID_FUNCTION_CATEGORIES = [
    'immunity', 'sleep', 'digestion', 'bone', 'beauty', 'sangan', 'kidney'
  ];

  var VALID_MATERIAL_CATEGORIES = [
    'ginseng', 'goji', 'ganoderma', 'donkey_hide', 'astragalus', 'other'
  ];

  var VALID_TARGET_POPULATIONS = [
    'children', 'adult', 'elderly', 'pregnant', 'male', 'female', 'general'
  ];

  var VALID_PLATFORMS = ['淘宝', '京东', '拼多多', '抖音电商', '天猫', '唯品会', '快手电商'];

  /**
   * Validate a single product object.
   * @param {Object} product
   * @returns {{ valid: boolean, errors: string[] }}
   */
  function validateProduct(product) {
    var errors = [];

    if (!product || typeof product !== 'object') {
      return { valid: false, errors: ['Product must be a non-null object'] };
    }

    // Required fields
    for (var i = 0; i < REQUIRED_FIELDS.length; i++) {
      var field = REQUIRED_FIELDS[i];
      if (product[field] === undefined || product[field] === null) {
        errors.push('Missing required field: ' + field);
      }
    }

    // String fields
    ['id', 'name', 'brand', 'specification', 'origin', 'description', 'dataVersion']
      .forEach(function (f) {
        if (product[f] !== undefined && product[f] !== null && typeof product[f] !== 'string') {
          errors.push('Field ' + f + ' must be a string');
        }
      });

    // ID format (slug)
    if (product.id && typeof product.id === 'string' && !/^[a-z0-9_-]+$/.test(product.id)) {
      errors.push('Field id must be a lowercase slug (letters, digits, hyphens, underscores)');
    }

    // functionCategory: array of valid values, non-empty
    if (product.functionCategory !== undefined) {
      if (!Array.isArray(product.functionCategory) || product.functionCategory.length === 0) {
        errors.push('functionCategory must be a non-empty array');
      } else {
        for (var j = 0; j < product.functionCategory.length; j++) {
          if (VALID_FUNCTION_CATEGORIES.indexOf(product.functionCategory[j]) === -1) {
            errors.push('Invalid functionCategory value: ' + product.functionCategory[j]);
          }
        }
      }
    }

    // targetPopulation: array of valid values, non-empty
    if (product.targetPopulation !== undefined) {
      if (!Array.isArray(product.targetPopulation) || product.targetPopulation.length === 0) {
        errors.push('targetPopulation must be a non-empty array');
      } else {
        for (var k = 0; k < product.targetPopulation.length; k++) {
          if (VALID_TARGET_POPULATIONS.indexOf(product.targetPopulation[k]) === -1) {
            errors.push('Invalid targetPopulation value: ' + product.targetPopulation[k]);
          }
        }
      }
    }

    // Enum validations
    ['manufacturerType', 'dosageForm', 'packaging', 'efficacyLevel', 'certification', 'salesChannel']
      .forEach(function (ef) {
        if (product[ef] !== undefined && product[ef] !== null) {
          if (VALID_ENUMS[ef] && VALID_ENUMS[ef].indexOf(product[ef]) === -1) {
            errors.push('Invalid ' + ef + ' value: ' + product[ef]);
          }
        }
      });

    // materialCategory validation
    if (product.materialCategory && VALID_MATERIAL_CATEGORIES.indexOf(product.materialCategory) === -1) {
      errors.push('Invalid materialCategory: ' + product.materialCategory);
    }

    // Number validations
    if (typeof product.priceMin !== 'number' || product.priceMin < 0) {
      errors.push('priceMin must be a number >= 0');
    }
    if (typeof product.priceMax !== 'number' || product.priceMax < 0) {
      errors.push('priceMax must be a number >= 0');
    }
    if (product.priceMin !== undefined && product.priceMax !== undefined && product.priceMin > product.priceMax) {
      errors.push('priceMin must be <= priceMax');
    }
    if (typeof product.profitMargin !== 'number' || product.profitMargin < 0 || product.profitMargin > 100) {
      errors.push('profitMargin must be a number between 0 and 100');
    }

    // referenceSales: nullable number
    if (product.referenceSales !== null && product.referenceSales !== undefined) {
      if (typeof product.referenceSales !== 'number' || product.referenceSales < 0) {
        errors.push('referenceSales must be a non-negative number or null');
      }
    }

    // salesDataType/salesDataPeriod must be null when referenceSales is null
    if (product.referenceSales === null || product.referenceSales === undefined) {
      if (product.salesDataType !== null && product.salesDataType !== undefined) {
        errors.push('salesDataType must be null when referenceSales is null');
      }
      if (product.salesDataPeriod !== null && product.salesDataPeriod !== undefined) {
        errors.push('salesDataPeriod must be null when referenceSales is null');
      }
    } else {
      if (product.salesDataType && VALID_ENUMS.salesDataType.indexOf(product.salesDataType) === -1) {
        errors.push('Invalid salesDataType: ' + product.salesDataType);
      }
      if (product.salesDataPeriod && typeof product.salesDataPeriod !== 'string') {
        errors.push('salesDataPeriod must be a string');
      }
    }

    // dataVersion format
    if (product.dataVersion && typeof product.dataVersion === 'string') {
      if (!/^\d{4}-\d{2}$/.test(product.dataVersion)) {
        errors.push('dataVersion must be in YYYY-MM format');
      }
    }

    // listingUrls validation
    if (product.listingUrls !== undefined && product.listingUrls !== null) {
      if (!Array.isArray(product.listingUrls)) {
        errors.push('listingUrls must be an array');
      } else {
        var seenPlatforms = {};
        for (var u = 0; u < product.listingUrls.length; u++) {
          var lu = product.listingUrls[u];
          if (!lu.platform || typeof lu.platform !== 'string') {
            errors.push('listingUrl[' + u + ']: platform is required and must be a string');
          } else if (VALID_PLATFORMS.indexOf(lu.platform) === -1) {
            errors.push('listingUrl[' + u + ']: unknown platform "' + lu.platform + '"');
          }
          if (!lu.url || typeof lu.url !== 'string') {
            errors.push('listingUrl[' + u + ']: url is required and must be a string');
          }
          if (!lu.collectedAt || typeof lu.collectedAt !== 'string') {
            errors.push('listingUrl[' + u + ']: collectedAt is required');
          }
          if (lu.platform && seenPlatforms[lu.platform]) {
            errors.push('listingUrl: duplicate platform "' + lu.platform + '"');
          }
          seenPlatforms[lu.platform] = true;
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * Validate a batch of products.
   * @param {Object[]} products
   * @returns {{ valid: boolean, total: number, validCount: number, invalidCount: number, errors: Array<{index: number, errors: string[]}> }}
   */
  function validateProductBatch(products) {
    if (!Array.isArray(products)) {
      return { valid: false, total: 0, validCount: 0, invalidCount: 0, errors: [{ index: -1, errors: ['Input must be an array'] }] };
    }

    var results = { valid: true, total: products.length, validCount: 0, invalidCount: 0, errors: [] };
    for (var i = 0; i < products.length; i++) {
      var result = validateProduct(products[i]);
      if (result.valid) {
        results.validCount++;
      } else {
        results.valid = false;
        results.invalidCount++;
        results.errors.push({ index: i, errors: result.errors });
      }
    }
    return results;
  }

  App.Data.Schema = {
    validateProduct: validateProduct,
    validateProductBatch: validateProductBatch,
    VALID_ENUMS: VALID_ENUMS,
    VALID_FUNCTION_CATEGORIES: VALID_FUNCTION_CATEGORIES,
    VALID_MATERIAL_CATEGORIES: VALID_MATERIAL_CATEGORIES,
    VALID_TARGET_POPULATIONS: VALID_TARGET_POPULATIONS,
    VALID_PLATFORMS: VALID_PLATFORMS,
    REQUIRED_FIELDS: REQUIRED_FIELDS
  };
})();
