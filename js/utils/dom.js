/**
 * DOM helper utilities for element creation and manipulation.
 */
var App = window.App || {};
App.Utils = App.Utils || {};

(function () {
  'use strict';

  /**
   * Create an HTML element with attributes and children.
   * @param {string} tag
   * @param {Object} [attrs] - attribute map
   * @param {...(string|HTMLElement|Array)} children
   * @returns {HTMLElement}
   */
  function createElement(tag, attrs) {
    var el = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (key) {
        if (key === 'className') {
          el.className = attrs[key];
        } else if (key === 'dataset') {
          Object.keys(attrs.dataset).forEach(function (dk) {
            el.dataset[dk] = attrs.dataset[dk];
          });
        } else if (key === 'style' && typeof attrs[key] === 'object') {
          Object.keys(attrs.style).forEach(function (sk) {
            el.style[sk] = attrs.style[sk];
          });
        } else if (key.substring(0, 2) === 'on') {
          el.addEventListener(key.substring(2).toLowerCase(), attrs[key]);
        } else if (key === 'html') {
          el.innerHTML = attrs[key];
        } else {
          el.setAttribute(key, attrs[key]);
        }
      });
    }
    for (var i = 2; i < arguments.length; i++) {
      appendChild(el, arguments[i]);
    }
    return el;
  }

  function appendChild(parent, child) {
    if (child === null || child === undefined) return;
    if (Array.isArray(child)) {
      child.forEach(function (c) { appendChild(parent, c); });
    } else if (typeof child === 'string') {
      parent.appendChild(document.createTextNode(child));
    } else if (child instanceof HTMLElement || child instanceof Node) {
      parent.appendChild(child);
    }
  }

  /**
   * Remove all children from an element.
   * @param {HTMLElement} el
   */
  function clearContainer(el) {
    while (el.firstChild) {
      el.removeChild(el.firstChild);
    }
  }

  /**
   * Set innerHTML safely (no sanitization — data is trusted).
   * @param {HTMLElement} el
   * @param {string} html
   */
  function setHTML(el, html) {
    el.innerHTML = html;
  }

  // Class manipulation
  function addClass(el, className) {
    el.classList.add(className);
  }
  function removeClass(el, className) {
    el.classList.remove(className);
  }
  function toggleClass(el, className) {
    el.classList.toggle(className);
  }
  function hasClass(el, className) {
    return el.classList.contains(className);
  }

  // Event delegation
  function delegate(parent, eventType, selector, handler) {
    parent.addEventListener(eventType, function (e) {
      var target = e.target;
      while (target && target !== parent) {
        if (target.matches(selector)) {
          handler.call(target, e);
          return;
        }
        target = target.parentElement;
      }
    });
  }

  App.Utils.DOM = {
    createElement: createElement,
    clearContainer: clearContainer,
    setHTML: setHTML,
    addClass: addClass,
    removeClass: removeClass,
    toggleClass: toggleClass,
    hasClass: hasClass,
    delegate: delegate
  };
})();
