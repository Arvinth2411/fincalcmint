window.FinCalc = window.FinCalc || {};

window.FinCalc.FD = (function () {
  'use strict';

  var FREQ_MAP = { annual: 1, semi: 2, quarterly: 4, monthly: 12 };

  function calcFD(principal, annualRate, years, freqKey) {
    var n = FREQ_MAP[freqKey] || 4;
    var r = annualRate / 100;
    var maturity  = principal * Math.pow(1 + r / n, n * years);
    var interest  = maturity - principal;
    return { maturity: maturity, interest: interest };
  }

  function calcSimple(principal, annualRate, years) {
    var interest = principal * annualRate / 100 * years;
    return { maturity: principal + interest, interest: interest };
  }

  function calculate() {
    var fmt     = FinCalc.Formatters;
    var dom     = FinCalc.DOM;
    var fdType  = document.getElementById('fd-type') ? document.getElementById('fd-type').value : 'compound';

    var principal = dom.getVal('fd-principal');
    var rate      = dom.getVal('fd-rate');
    var years     = dom.getVal('fd-tenure');
    var freqEl    = document.getElementById('fd-frequency');
    var freq      = freqEl ? freqEl.value : 'quarterly';

    if (!principal || !rate || !years) return;

    var result = fdType === 'simple'
      ? calcSimple(principal, rate, years)
      : calcFD(principal, rate, years, freq);

    dom.setResult('fd-maturity',  fmt.currency(result.maturity));
    dom.setResult('fd-interest',  fmt.currency(result.interest));
    dom.setResult('fd-principal-display', fmt.currency(principal));

    var roi = (result.interest / principal) * 100;
    dom.setResult('fd-roi', fmt.percent(roi, 1));

    dom.showResults('fd-results');

    FinCalc.ChartManager.createDoughnut(
      'fd-chart',
      ['Principal', 'Interest Earned'],
      [principal, result.interest],
      ['#f59e0b', '#fef3c7']
    );

    // Comparison table across compounding frequencies
    buildComparisonTable(principal, rate, years, fdType);
  }

  function buildComparisonTable(principal, rate, years, fdType) {
    var fmt = FinCalc.Formatters;
    var dom = FinCalc.DOM;
    var freqs = [
      { key: 'annual',    label: 'Annually' },
      { key: 'semi',      label: 'Semi-annually' },
      { key: 'quarterly', label: 'Quarterly' },
      { key: 'monthly',   label: 'Monthly' }
    ];
    var headers = ['Compounding', 'Interest Earned', 'Maturity Value'];
    var rows = freqs.map(function (f) {
      var r = fdType === 'simple' ? calcSimple(principal, rate, years) : calcFD(principal, rate, years, f.key);
      return [f.label, fmt.currency(r.interest), fmt.currency(r.maturity)];
    });
    dom.buildTable('fd-freq-comparison', headers, rows);
  }

  function init() {
    var dom = FinCalc.DOM;

    dom.syncSliderInput('fd-principal-slider', 'fd-principal');
    dom.syncSliderInput('fd-rate-slider',      'fd-rate');
    dom.syncSliderInput('fd-tenure-slider',    'fd-tenure');

    // FD type toggle
    var fdTypeEl = document.getElementById('fd-type');
    var freqWrap = document.getElementById('fd-freq-wrap');
    if (fdTypeEl && freqWrap) {
      fdTypeEl.addEventListener('change', function () {
        freqWrap.classList.toggle('hidden', fdTypeEl.value === 'simple');
      });
    }

    var btn = document.getElementById('fd-calculate');
    if (btn) btn.addEventListener('click', calculate);
  }

  return { init: init, calculate: calculate };
})();
