window.FinCalc = window.FinCalc || {};

window.FinCalc.SIP = (function () {
  'use strict';

  function calcSIP(monthly, annualRate, years, stepUpPct) {
    var months     = years * 12;
    var r          = annualRate / 12 / 100;
    stepUpPct      = stepUpPct || 0;
    var corpus     = 0;
    var invested   = 0;
    var yearlyData = [];
    var P          = monthly;

    if (stepUpPct === 0) {
      // Standard SIP formula
      if (r === 0) {
        corpus = monthly * months;
      } else {
        corpus = monthly * ((Math.pow(1 + r, months) - 1) / r) * (1 + r);
      }
      invested = monthly * months;
      // Build year-by-year
      for (var yr = 1; yr <= years; yr++) {
        var n = yr * 12;
        var c = (r === 0) ? monthly * n : monthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
        yearlyData.push({ year: yr, corpus: c, invested: monthly * n });
      }
    } else {
      // Step-up SIP: P increases by stepUpPct% each year
      corpus = 0; invested = 0;
      for (var y = 0; y < years; y++) {
        var pm = P * Math.pow(1 + stepUpPct / 100, y);
        for (var m = 0; m < 12; m++) {
          var monthsRemaining = (years - y) * 12 - m;
          corpus   += pm * Math.pow(1 + r, monthsRemaining);
          invested += pm;
        }
        yearlyData.push({ year: y + 1, corpus: corpus, invested: invested });
      }
    }

    return { corpus: corpus, invested: invested, returns: corpus - invested, yearlyData: yearlyData };
  }

  function calculate() {
    var fmt = FinCalc.Formatters;
    var dom = FinCalc.DOM;

    var monthly  = dom.getVal('sip-monthly');
    var rate     = dom.getVal('sip-rate');
    var years    = dom.getVal('sip-tenure');
    var stepUpEl = document.getElementById('sip-stepup');
    var stepUp   = (stepUpEl && document.getElementById('sip-stepup-toggle').checked)
                   ? dom.getVal('sip-stepup') : 0;

    if (!monthly || !rate || !years) return;

    var result = calcSIP(monthly, rate, years, stepUp);

    dom.setResult('sip-corpus',   fmt.currency(result.corpus));
    dom.setResult('sip-invested', fmt.currency(result.invested));
    dom.setResult('sip-returns',  fmt.currency(result.returns));
    dom.setResult('sip-gain-pct',
      fmt.percent(result.invested > 0 ? (result.returns / result.invested) * 100 : 0, 1));

    dom.showResults('sip-results');

    // Line chart: Invested vs Corpus
    var labels   = result.yearlyData.map(function (d) { return 'Yr ' + d.year; });
    var invested = result.yearlyData.map(function (d) { return d.invested; });
    var corpus   = result.yearlyData.map(function (d) { return d.corpus; });

    FinCalc.ChartManager.createLine('sip-chart', labels, [
      {
        label: 'Amount Invested',
        data: invested,
        borderColor: '#94a3b8',
        backgroundColor: 'rgba(148,163,184,0.08)',
        borderWidth: 2,
        fill: true,
        tension: 0.3,
        pointRadius: 0
      },
      {
        label: 'Estimated Corpus',
        data: corpus,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16,185,129,0.12)',
        borderWidth: 2.5,
        fill: true,
        tension: 0.3,
        pointRadius: 0
      }
    ]);
  }

  function init() {
    var dom = FinCalc.DOM;

    dom.syncSliderInput('sip-monthly-slider', 'sip-monthly');
    dom.syncSliderInput('sip-rate-slider',    'sip-rate');
    dom.syncSliderInput('sip-tenure-slider',  'sip-tenure');

    // Step-up toggle
    var stepUpToggle = document.getElementById('sip-stepup-toggle');
    var stepUpWrap   = document.getElementById('sip-stepup-wrap');
    if (stepUpToggle && stepUpWrap) {
      stepUpToggle.addEventListener('change', function () {
        stepUpWrap.classList.toggle('hidden', !stepUpToggle.checked);
      });
      dom.syncSliderInput('sip-stepup-slider', 'sip-stepup');
    }

    var btn = document.getElementById('sip-calculate');
    if (btn) btn.addEventListener('click', calculate);
  }

  return { init: init, calculate: calculate };
})();
