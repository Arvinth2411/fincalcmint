window.FinCalc = window.FinCalc || {};

window.FinCalc.CarLoan = (function () {
  'use strict';

  var _amortRows = [];
  var _showAll = false;

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
      var interest = balance * r;
      var princ    = emi - interest;
      balance     -= princ;
      if (balance < 0.01) balance = 0;
      rows.push([m, emi, princ, interest, balance]);
    }
    return rows;
  }

  function calculate() {
    var fmt = FinCalc.Formatters;
    var dom = FinCalc.DOM;

    var loanType  = document.getElementById('cl-type') ? document.getElementById('cl-type').value : 'car';
    var principal = dom.getVal('cl-principal');
    var rate      = dom.getVal('cl-rate');
    var tenure    = dom.getVal('cl-tenure');
    var months    = tenure * 12;

    if (!principal || !rate || !tenure) return;

    var emi           = calcEMI(principal, rate, months);
    var totalPayment  = emi * months;
    var totalInterest = totalPayment - principal;

    dom.setResult('cl-emi',      fmt.currency(emi));
    dom.setResult('cl-interest', fmt.currency(totalInterest));
    dom.setResult('cl-total',    fmt.currency(totalPayment));

    // Interest rate comparison info
    var clRateInfo = document.getElementById('cl-rate-info');
    if (clRateInfo) {
      var info = loanType === 'car' ? 'Typical car loan rates: 7.5% – 12%' :
                 loanType === 'personal' ? 'Typical personal loan rates: 10.5% – 24%' :
                 'Typical two-wheeler rates: 9% – 18%';
      clRateInfo.textContent = info;
    }

    dom.showResults('cl-results');

    var color = loanType === 'car' ? '#06b6d4' : loanType === 'personal' ? '#8b5cf6' : '#f59e0b';
    var colorLight = loanType === 'car' ? '#cffafe' : loanType === 'personal' ? '#ede9fe' : '#fef3c7';

    FinCalc.ChartManager.createDoughnut(
      'cl-chart',
      ['Principal', 'Total Interest'],
      [principal, totalInterest],
      [color, colorLight]
    );

    _amortRows = buildAmortization(principal, rate, months, emi);
    _showAll = false;
    renderTable();
  }

  function renderTable() {
    var fmt = FinCalc.Formatters;
    var dom = FinCalc.DOM;
    var display = _showAll ? _amortRows : _amortRows.slice(0, 12);
    var headers = ['Month', 'EMI (₹)', 'Principal (₹)', 'Interest (₹)', 'Balance (₹)'];
    var data = display.map(function (r) {
      return [r[0], fmt.currency(r[1]), fmt.currency(r[2]), fmt.currency(r[3]), fmt.currency(r[4])];
    });
    dom.buildTable('cl-amortization-wrapper', headers, data);
  }

  function init() {
    var dom = FinCalc.DOM;

    dom.syncSliderInput('cl-principal-slider', 'cl-principal');
    dom.syncSliderInput('cl-rate-slider', 'cl-rate');
    dom.syncSliderInput('cl-tenure-slider', 'cl-tenure');

    // Loan type change — update slider ranges
    var typeSelect = document.getElementById('cl-type');
    if (typeSelect) {
      typeSelect.addEventListener('change', function () {
        var type = typeSelect.value;
        var principalSlider = document.getElementById('cl-principal-slider');
        var rateSlider      = document.getElementById('cl-rate-slider');
        var tenureSlider    = document.getElementById('cl-tenure-slider');
        var principalInput  = document.getElementById('cl-principal');
        var rateInput       = document.getElementById('cl-rate');
        var tenureInput     = document.getElementById('cl-tenure');

        if (type === 'car') {
          principalSlider.max = 5000000;  principalInput.max = 5000000;
          rateSlider.max = 15;            rateInput.max = 15;
          tenureSlider.max = 7;           tenureInput.max = 7;
          document.getElementById('cl-principal-max').textContent = '₹50L';
        } else if (type === 'personal') {
          principalSlider.max = 5000000;  principalInput.max = 5000000;
          rateSlider.max = 36;            rateInput.max = 36;
          tenureSlider.max = 7;           tenureInput.max = 7;
          document.getElementById('cl-principal-max').textContent = '₹50L';
        } else { // two-wheeler
          principalSlider.max = 1500000;  principalInput.max = 1500000;
          rateSlider.max = 22;            rateInput.max = 22;
          tenureSlider.max = 5;           tenureInput.max = 5;
          document.getElementById('cl-principal-max').textContent = '₹15L';
        }
        dom.updateSliderFill(principalSlider);
        dom.updateSliderFill(rateSlider);
        dom.updateSliderFill(tenureSlider);
      });
    }

    var btn = document.getElementById('cl-calculate');
    if (btn) btn.addEventListener('click', calculate);

    var showAllBtn = document.getElementById('cl-show-all');
    if (showAllBtn) {
      showAllBtn.addEventListener('click', function () {
        _showAll = !_showAll;
        showAllBtn.textContent = _showAll ? 'Show Less' : 'View Full Schedule';
        renderTable();
      });
    }
  }

  return { init: init, calculate: calculate };
})();
