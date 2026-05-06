window.FinCalc = window.FinCalc || {};

window.FinCalc.DOM = (function () {
  'use strict';

  // Bidirectional sync between range slider and number input
  function syncSliderInput(sliderId, inputId, onChange) {
    var slider = document.getElementById(sliderId);
    var input  = document.getElementById(inputId);
    if (!slider || !input) return;

    function clamp(val) {
      return Math.min(Math.max(val, parseFloat(slider.min) || 0), parseFloat(slider.max) || 1e9);
    }

    slider.addEventListener('input', function () {
      input.value = slider.value;
      updateSliderFill(slider);
      if (onChange) onChange(parseFloat(slider.value));
    });

    input.addEventListener('input', function () {
      var val = clamp(FinCalc.Formatters.parseInput(input.value));
      slider.value = val;
      updateSliderFill(slider);
      if (onChange) onChange(val);
    });

    input.addEventListener('change', function () {
      var val = clamp(FinCalc.Formatters.parseInput(input.value));
      input.value = val;
      slider.value = val;
      updateSliderFill(slider);
    });

    // Initial fill
    updateSliderFill(slider);
  }

  // Update the filled portion of a range slider (gradient background)
  function updateSliderFill(slider) {
    var min = parseFloat(slider.min) || 0;
    var max = parseFloat(slider.max) || 100;
    var val = parseFloat(slider.value) || 0;
    var pct = ((val - min) / (max - min)) * 100;
    slider.style.background =
      'linear-gradient(to right, var(--color-primary) 0%, var(--color-primary) ' +
      pct + '%, var(--border-color) ' + pct + '%, var(--border-color) 100%)';
  }

  // Initialize all sliders on page load
  function initAllSliders() {
    document.querySelectorAll('input[type="range"]').forEach(function (slider) {
      updateSliderFill(slider);
    });
  }

  // Animate a numeric counter from 0 to target value
  function animateCounter(element, target, duration, formatter) {
    if (!element) return;
    duration = duration || 1200;
    formatter = formatter || function (n) { return Math.round(n).toLocaleString('en-IN'); };
    var start = performance.now();

    function step(now) {
      var elapsed = now - start;
      var progress = Math.min(elapsed / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      var current = eased * target;
      element.textContent = formatter(current);
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  // Update a result value element with animation
  function setResult(elementId, text) {
    var el = document.getElementById(elementId);
    if (!el) return;
    el.textContent = text;
    el.classList.remove('appear');
    // Force reflow to restart animation
    void el.offsetWidth;
    el.classList.add('appear');
  }

  // Show result panel
  function showResults(panelId) {
    var panel = document.getElementById(panelId);
    if (!panel) return;
    panel.classList.remove('hidden');
    panel.classList.remove('result-appear');
    void panel.offsetWidth;
    panel.classList.add('result-appear');

    // Trigger result card animations
    var cards = panel.querySelectorAll('.result-card');
    cards.forEach(function (card, i) {
      card.classList.remove('appear');
      void card.offsetWidth;
      setTimeout(function () { card.classList.add('appear'); }, i * 80);
    });
  }

  // Hide results panel
  function hideResults(panelId) {
    var panel = document.getElementById(panelId);
    if (panel) panel.classList.add('hidden');
  }

  // Show inline input error
  function showError(groupId, message) {
    var group = document.getElementById(groupId + '-group');
    if (!group) return;
    group.classList.add('has-error');
    var err = group.querySelector('.input-error');
    if (err) err.textContent = message;
  }

  // Clear input error
  function clearError(groupId) {
    var group = document.getElementById(groupId + '-group');
    if (!group) return;
    group.classList.remove('has-error');
  }

  // Safe numeric read from input
  function getVal(id, defaultVal) {
    var el = document.getElementById(id);
    if (!el) return defaultVal || 0;
    var v = parseFloat(el.value);
    return isNaN(v) ? (defaultVal || 0) : v;
  }

  // Debounce helper
  function debounce(fn, delay) {
    var timer;
    return function () {
      clearTimeout(timer);
      var args = arguments;
      var ctx  = this;
      timer = setTimeout(function () { fn.apply(ctx, args); }, delay);
    };
  }

  // Setup button loading state
  function setLoading(btnId, loading) {
    var btn = document.getElementById(btnId);
    if (!btn) return;
    if (loading) {
      btn.classList.add('loading');
      btn.disabled = true;
    } else {
      btn.classList.remove('loading');
      btn.disabled = false;
    }
  }

  // Build a simple table inside a wrapper
  function buildTable(wrapperId, headers, rows) {
    var wrapper = document.getElementById(wrapperId);
    if (!wrapper) return;
    var html = '<table><thead><tr>' +
      headers.map(function (h) { return '<th>' + h + '</th>'; }).join('') +
      '</tr></thead><tbody>';
    rows.forEach(function (row) {
      html += '<tr>' + row.map(function (cell) { return '<td>' + cell + '</td>'; }).join('') + '</tr>';
    });
    html += '</tbody></table>';
    wrapper.innerHTML = html;
  }

  return {
    syncSliderInput: syncSliderInput,
    updateSliderFill: updateSliderFill,
    initAllSliders: initAllSliders,
    animateCounter: animateCounter,
    setResult: setResult,
    showResults: showResults,
    hideResults: hideResults,
    showError: showError,
    clearError: clearError,
    getVal: getVal,
    debounce: debounce,
    setLoading: setLoading,
    buildTable: buildTable
  };
})();
