window.FinCalc = window.FinCalc || {};

window.FinCalc.EMI = (function () {
  'use strict';

  var fmt = null;
  var dom = null;

  function calcEMI(principal, annualRate, months) {
    if (annualRate === 0) return principal / months;
    var r = annualRate / 12 / 100;
    return principal * r * Math.pow(1 + r, months) / (Math.pow(1 + r, months) - 1);
  }

  function buildAmortization(principal, annualRate, totalMonths, emi) {
    var rows = [];
    var balance = principal;
    var r = annualRate / 12 / 100;
    for (var m = 1; m <= totalMonths; m++) {
      var interest  = balance * r;
      var princ     = emi - interest;
      balance      -= princ;
      if (balance < 0.01) balance = 0;
      rows.push([m, emi, princ, interest, balance]);
    }
    return rows;
  }

  function buildYearlyData(rows) {
    var yearly = {};
    rows.forEach(function (row) {
      var yr = Math.ceil(row[0] / 12);
      if (!yearly[yr]) yearly[yr] = { principal: 0, interest: 0 };
      yearly[yr].principal += row[2];
      yearly[yr].interest  += row[3];
    });
    return yearly;
  }

  var _amortRows = [];
  var _showAll = false;

  function renderTable(rows, mode, wrapperId) {
    var headers = ['Month', 'EMI (₹)', 'Principal (₹)', 'Interest (₹)', 'Balance (₹)'];
    var data;
    if (mode === 'yearly') {
      var yd = buildYearlyData(rows);
      headers = ['Year', 'Principal Paid (₹)', 'Interest Paid (₹)'];
      data = Object.keys(yd).map(function (yr) {
        return [
          'Year ' + yr,
          fmt.currency(yd[yr].principal),
          fmt.currency(yd[yr].interest)
        ];
      });
    } else {
      var display = _showAll ? rows : rows.slice(0, 12);
      data = display.map(function (r) {
        return [r[0], fmt.currency(r[1]), fmt.currency(r[2]), fmt.currency(r[3]), fmt.currency(r[4])];
      });
    }
    dom.buildTable(wrapperId, headers, data);
  }

  function calculate() {
    fmt = FinCalc.Formatters;
    dom = FinCalc.DOM;

    var principal = dom.getVal('hl-principal');
    var rate      = dom.getVal('hl-rate');
    var tenure    = dom.getVal('hl-tenure');
    var months    = tenure * 12;

    if (!principal || !rate || !tenure) return;

    var emi           = calcEMI(principal, rate, months);
    var totalPayment  = emi * months;
    var totalInterest = totalPayment - principal;

    dom.setResult('hl-emi',       fmt.currency(emi));
    dom.setResult('hl-interest',  fmt.currency(totalInterest));
    dom.setResult('hl-total',     fmt.currency(totalPayment));
    dom.setResult('hl-tenure-display', fmt.months(months));

    dom.showResults('hl-results');

    // Doughnut chart
    FinCalc.ChartManager.createDoughnut(
      'hl-chart',
      ['Principal', 'Total Interest'],
      [principal, totalInterest],
      ['#6366f1', '#c7d2fe']
    );

    // Build amortization
    _amortRows = buildAmortization(principal, rate, months, emi);
    _showAll = false;
    var mode = document.querySelector('#hl-table-mode.active');
    renderTable(_amortRows, mode ? mode.getAttribute('data-mode') : 'monthly', 'hl-amortization-wrapper');
  }

  function init() {
    fmt = FinCalc.Formatters;
    dom = FinCalc.DOM;

    dom.syncSliderInput('hl-principal-slider', 'hl-principal');
    dom.syncSliderInput('hl-rate-slider', 'hl-rate');
    dom.syncSliderInput('hl-tenure-slider', 'hl-tenure');

    var btn = document.getElementById('hl-calculate');
    if (btn) btn.addEventListener('click', calculate);

    // Table mode toggle
    var modebtns = document.querySelectorAll('#hl-table-mode');
    modebtns.forEach(function (b) {
      b.addEventListener('click', function () {
        modebtns.forEach(function (x) { x.classList.remove('active'); });
        b.classList.add('active');
        renderTable(_amortRows, b.getAttribute('data-mode'), 'hl-amortization-wrapper');
      });
    });

    // Show all rows
    var showAllBtn = document.getElementById('hl-show-all');
    if (showAllBtn) {
      showAllBtn.addEventListener('click', function () {
        _showAll = !_showAll;
        showAllBtn.textContent = _showAll ? 'Show Less' : 'View Full Schedule';
        var mode = document.querySelector('[data-mode].active');
        renderTable(_amortRows, mode ? mode.getAttribute('data-mode') : 'monthly', 'hl-amortization-wrapper');
      });
    }
  }

  return { init: init, calculate: calculate };
})();
