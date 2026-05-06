window.FinCalc = window.FinCalc || {};

window.FinCalc.Inflation = (function () {
  'use strict';

  function calculate() {
    var fmt    = FinCalc.Formatters;
    var dom    = FinCalc.DOM;
    var amount = dom.getVal('inf-amount');
    var rate   = dom.getVal('inf-rate');
    var years  = dom.getVal('inf-years');

    if (!amount || !rate || !years) return;

    var fv   = amount * Math.pow(1 + rate / 100, years);
    var pp   = amount / Math.pow(1 + rate / 100, years);
    var loss = amount - pp;

    dom.setResult('inf-future-cost',    fmt.currency(fv));
    dom.setResult('inf-purchasing-pwr', fmt.currency(pp));
    dom.setResult('inf-value-loss',     fmt.currency(loss));
    dom.setResult('inf-rate-display',   rate + '%');

    dom.showResults('inf-results');

    // Build year-by-year data
    var labels = [], fvData = [], ppData = [];
    for (var y = 0; y <= years; y++) {
      labels.push('Yr ' + y);
      fvData.push(amount * Math.pow(1 + rate / 100, y));
      ppData.push(amount / Math.pow(1 + rate / 100, y));
    }

    FinCalc.ChartManager.createLine('inf-chart', labels, [
      {
        label: 'Future Cost of ₹' + fmt.compact(amount),
        data: fvData,
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239,68,68,0.08)',
        borderWidth: 2.5,
        fill: true,
        tension: 0.3,
        pointRadius: 0
      },
      {
        label: 'Purchasing Power Today',
        data: ppData,
        borderColor: '#14b8a6',
        backgroundColor: 'rgba(20,184,166,0.08)',
        borderWidth: 2.5,
        fill: true,
        tension: 0.3,
        pointRadius: 0
      }
    ]);
  }

  function init() {
    var dom = FinCalc.DOM;

    dom.syncSliderInput('inf-amount-slider', 'inf-amount');
    dom.syncSliderInput('inf-rate-slider',   'inf-rate');
    dom.syncSliderInput('inf-years-slider',  'inf-years');

    // Live recalculation
    ['inf-amount', 'inf-rate', 'inf-years'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('input', dom.debounce(calculate, 200));
    });

    // Quick presets
    document.querySelectorAll('.inf-preset').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var el = document.getElementById('inf-years');
        var sl = document.getElementById('inf-years-slider');
        if (el) el.value = btn.getAttribute('data-years');
        if (sl) { sl.value = btn.getAttribute('data-years'); dom.updateSliderFill(sl); }
        calculate();
      });
    });
  }

  return { init: init, calculate: calculate };
})();
