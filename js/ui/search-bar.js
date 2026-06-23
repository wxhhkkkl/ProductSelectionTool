/**
 * SearchBar — keyword search input with debounce.
 */
var App = window.App || {};
App.UI = App.UI || {};

(function () {
  'use strict';

  var D = App.Utils.DOM;

  function SearchBar(container) {
    var instance = {};
    var onSearchCallback = null;
    var debounceTimer = null;
    var DEBOUNCE_MS = 300;

    var wrapper = D.createElement('div', { className: 'search-bar' });

    var icon = D.createElement('span', { className: 'search-icon' }, '🔍');
    wrapper.appendChild(icon);

    var input = D.createElement('input', {
      type: 'text',
      placeholder: '搜索产品名称或品牌...'
    });

    var clearBtn = D.createElement('button', {
      className: 'clear-btn hidden'
    }, '×');

    input.addEventListener('input', function () {
      var val = input.value;
      if (val.length > 0) {
        D.removeClass(clearBtn, 'hidden');
      } else {
        D.addClass(clearBtn, 'hidden');
      }

      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function () {
        if (onSearchCallback) {
          onSearchCallback(val);
        }
      }, DEBOUNCE_MS);
    });

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        input.value = '';
        D.addClass(clearBtn, 'hidden');
        if (onSearchCallback) onSearchCallback('');
      }
    });

    clearBtn.addEventListener('click', function () {
      input.value = '';
      D.addClass(clearBtn, 'hidden');
      if (onSearchCallback) onSearchCallback('');
      input.focus();
    });

    wrapper.appendChild(input);
    wrapper.appendChild(clearBtn);
    container.appendChild(wrapper);

    function onSearch(cb) {
      onSearchCallback = cb;
    }

    function clear() {
      input.value = '';
      D.addClass(clearBtn, 'hidden');
    }

    function getValue() {
      return input.value;
    }

    instance.onSearch = onSearch;
    instance.clear = clear;
    instance.getValue = getValue;
    return instance;
  }

  App.UI.SearchBar = SearchBar;
})();
