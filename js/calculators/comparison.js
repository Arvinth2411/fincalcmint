window.FinCalc = window.FinCalc || {};

window.FinCalc.Comparison = (function () {
  'use strict';

  function calcEMI(p, r, n) {
    if (r === 0) return p / n;
    var mr = r / 12 / 100;
    return p * mr * Math.pow(1 + mr, n) / (Math.pow(1 + mr, n) - 1);
  }

  function calculate() {
    var fmt   = FinCalc.Formatters;
    var dom   = FinCalc.DOM;
    var loans = [];

    for (var i = 1; i <= 3; i++) {
      var pEl = document.getElementById('cmp-p' + i);
      var rEl = document.getElementById('cmp-r' + i);
      var tEl = document.getElementById('cmp-t' + i);
      if (!pEl || !rEl || !tEl) continue;
      var p = parseFloat(pEl.value);
      var r = parseFloat(rEl.value);
      var t = parseFloat(tEl.value);
      if (!p || !r || !t) continue;
      var n   = t * 12;
      var emi = calcEMI(p, r, n);
      loans.push({
        name:      'Loan ' + i,
        principal: p,
        rate:      r,
        tenure:    t,
        emi:       emi,
        total:     emi * n,
        interest:  emi * n - p
      });
    }

    if (loans.length < 2) {
      var warn = document.getElementById('cmp-warning');
      if (warn) warn.classList.remove('hidden');
      return;
    }

    var warn2 = document.getElementById('cmp-warning');
    if (warn2) warn2.classList.add('hidden');

    // Find best deal (lowest total payment)
    var best = loans.reduce(function (b, l) { return l.total < b.total ? l : b; }, loans[0]);

    // Build results table
    var wrap = document.getElementById('cmp-results-table');
    if (wrap) {
      var headers = ['', 'Loan Amount', 'Rate', 'Tenure', 'Monthly EMI', 'Total Interest', 'Total Payment'];
      var rows = loans.map(function (l) {
        var badge = l === best ? '<span class="best-deal-badge">★ Best Deal</span>' : '';
        return [
          l.name + ' ' + badge,
          fmt.currency(l.principal),
          l.rate + '%',
          l.tenure + ' yrs',
          fmt.currency(l.emi),
          fmt.currency(l.interest),
          fmt.currency(l.total)
        ];
      });
      dom.buildTable('cmp-results-table', headers, rows);
    }

    dom.showResults('cmp-results');

    // Grouped bar chart
    var labels   = loans.map(function (l) { return l.name; });
    var emis     = loans.map(function (l) { return Math.round(l.emi); });
    var interests = loans.map(function (l) { return Math.round(l.interest); });
    var totals   = loans.map(function (l) { return Math.round(l.total); });

    FinCalc.ChartManager.createBar('cmp-chart', labels, [
      { label: 'Monthly EMI',    data: emis,      backgroundColor: '#6366f1' },
      { label: 'Total Interest', data: interests, backgroundColor: '#ec4899' },
      { label: 'Total Payment',  data: totals,    backgroundColor: '#06b6d4' }
    ]);
  }

  function init() {
    var btn = document.getElementById('cmp-calculate');
    if (btn) btn.addEventListener('click', calculate);
  }

  return { init: init, calculate: calculate };
})();
