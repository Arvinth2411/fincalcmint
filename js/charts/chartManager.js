window.FinCalc = window.FinCalc || {};

window.FinCalc.ChartManager = (function () {
  'use strict';

  var _instances = {};

  function _isDark() {
    return document.body.getAttribute('data-theme') === 'dark';
  }

  function _palette() {
    return {
      text:   _isDark() ? '#94a3b8' : '#64748b',
      grid:   _isDark() ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
      bg:     _isDark() ? '#1e293b' : '#ffffff'
    };
  }

  function _baseOptions(extraPlugins) {
    var p = _palette();
    return {
      responsive: true,
      maintainAspectRatio: true,
      animation: { duration: 700, easing: 'easeOutQuart' },
      plugins: Object.assign({
        legend: {
          labels: { color: p.text, font: { family: 'Inter', size: 12 }, padding: 16, boxWidth: 12 }
        },
        tooltip: {
          backgroundColor: _isDark() ? '#1e293b' : '#ffffff',
          titleColor: _isDark() ? '#f1f5f9' : '#0f172a',
          bodyColor: _isDark() ? '#94a3b8' : '#64748b',
          borderColor: _isDark() ? '#334155' : '#e2e8f0',
          borderWidth: 1,
          padding: 12,
          boxPadding: 4,
          cornerRadius: 10,
          displayColors: true
        }
      }, extraPlugins || {})
    };
  }

  function _destroy(canvasId) {
    if (_instances[canvasId]) {
      _instances[canvasId].destroy();
      delete _instances[canvasId];
    }
  }

  function _getCtx(canvasId) {
    var canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    return canvas.getContext('2d');
  }

  // DOUGHNUT chart
  function createDoughnut(canvasId, labels, data, colors, options) {
    if (typeof Chart === 'undefined') return;
    _destroy(canvasId);
    var ctx = _getCtx(canvasId);
    if (!ctx) return;
    var p = _palette();
    var opts = _baseOptions({
      tooltip: {
        callbacks: {
          label: function (item) {
            return ' ' + item.label + ': ' + FinCalc.Formatters.currency(item.parsed);
          }
        }
      }
    });
    opts.cutout = '65%';
    opts.plugins.legend.position = 'bottom';
    _instances[canvasId] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors,
          borderWidth: 0,
          hoverOffset: 8,
          hoverBorderWidth: 0
        }]
      },
      options: Object.assign(opts, options || {})
    });
  }

  // LINE chart
  function createLine(canvasId, labels, datasets, options) {
    if (typeof Chart === 'undefined') return;
    _destroy(canvasId);
    var ctx = _getCtx(canvasId);
    if (!ctx) return;
    var p = _palette();
    var opts = _baseOptions();
    opts.scales = {
      x: {
        ticks: { color: p.text, font: { size: 11 }, maxTicksLimit: 10 },
        grid: { color: p.grid }
      },
      y: {
        ticks: {
          color: p.text,
          font: { size: 11 },
          callback: function (v) { return FinCalc.Formatters.compact(v); }
        },
        grid: { color: p.grid }
      }
    };
    opts.plugins.legend.position = 'bottom';
    _instances[canvasId] = new Chart(ctx, {
      type: 'line',
      data: { labels: labels, datasets: datasets },
      options: Object.assign(opts, options || {})
    });
  }

  // BAR chart (vertical)
  function createBar(canvasId, labels, datasets, options) {
    if (typeof Chart === 'undefined') return;
    _destroy(canvasId);
    var ctx = _getCtx(canvasId);
    if (!ctx) return;
    var p = _palette();
    var opts = _baseOptions();
    opts.scales = {
      x: {
        ticks: { color: p.text, font: { size: 11 } },
        grid: { display: false }
      },
      y: {
        ticks: {
          color: p.text,
          font: { size: 11 },
          callback: function (v) { return FinCalc.Formatters.compact(v); }
        },
        grid: { color: p.grid }
      }
    };
    opts.plugins.legend.position = 'bottom';
    _instances[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: { labels: labels, datasets: datasets },
      options: Object.assign(opts, options || {})
    });
  }

  // HORIZONTAL BAR chart
  function createHorizontalBar(canvasId, labels, datasets, options) {
    if (typeof Chart === 'undefined') return;
    _destroy(canvasId);
    var ctx = _getCtx(canvasId);
    if (!ctx) return;
    var p = _palette();
    var opts = _baseOptions();
    opts.indexAxis = 'y';
    opts.scales = {
      x: {
        ticks: {
          color: p.text,
          font: { size: 11 },
          callback: function (v) { return FinCalc.Formatters.compact(v); }
        },
        grid: { color: p.grid }
      },
      y: {
        ticks: { color: p.text, font: { size: 11 } },
        grid: { display: false }
      }
    };
    opts.plugins.legend.display = false;
    _instances[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: { labels: labels, datasets: datasets },
      options: Object.assign(opts, options || {})
    });
  }

  // Update all charts when theme changes
  function updateTheme() {
    var p = _palette();
    Object.keys(_instances).forEach(function (id) {
      var chart = _instances[id];
      if (!chart) return;
      // Update legend color
      if (chart.options.plugins && chart.options.plugins.legend) {
        chart.options.plugins.legend.labels.color = p.text;
      }
      // Update tooltip
      if (chart.options.plugins && chart.options.plugins.tooltip) {
        chart.options.plugins.tooltip.backgroundColor = _isDark() ? '#1e293b' : '#ffffff';
        chart.options.plugins.tooltip.titleColor = _isDark() ? '#f1f5f9' : '#0f172a';
        chart.options.plugins.tooltip.bodyColor = _isDark() ? '#94a3b8' : '#64748b';
        chart.options.plugins.tooltip.borderColor = _isDark() ? '#334155' : '#e2e8f0';
      }
      // Update scale colors
      if (chart.options.scales) {
        ['x', 'y'].forEach(function (axis) {
          if (chart.options.scales[axis]) {
            if (chart.options.scales[axis].ticks) {
              chart.options.scales[axis].ticks.color = p.text;
            }
            if (chart.options.scales[axis].grid) {
              chart.options.scales[axis].grid.color = p.grid;
            }
          }
        });
      }
      chart.update('none');
    });
  }

  function destroy(canvasId) {
    _destroy(canvasId);
  }

  return {
    createDoughnut: createDoughnut,
    createLine: createLine,
    createBar: createBar,
    createHorizontalBar: createHorizontalBar,
    updateTheme: updateTheme,
    destroy: destroy
  };
})();
