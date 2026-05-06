window.FinCalc = window.FinCalc || {};

window.FinCalc.IncomeTax = (function () {
  'use strict';

  var NEW_SLABS = [
    { from: 0,        to: 300000,   rate: 0  },
    { from: 300000,   to: 700000,   rate: 5  },
    { from: 700000,   to: 1000000,  rate: 10 },
    { from: 1000000,  to: 1200000,  rate: 15 },
    { from: 1200000,  to: 1500000,  rate: 20 },
    { from: 1500000,  to: Infinity, rate: 30 }
  ];

  var OLD_SLABS = [
    { from: 0,       to: 250000,   rate: 0  },
    { from: 250000,  to: 500000,   rate: 5  },
    { from: 500000,  to: 1000000,  rate: 20 },
    { from: 1000000, to: Infinity, rate: 30 }
  ];

  function slabTax(income, slabs) {
    var tax = 0;
    slabs.forEach(function (s) {
      if (income > s.from) {
        var taxable = Math.min(income, s.to) - s.from;
        tax += taxable * s.rate / 100;
      }
    });
    return tax;
  }

  function calcRegime(grossIncome, regime, deductions) {
    var taxable, tax, standardDeduction;

    if (regime === 'new') {
      standardDeduction = 75000;
      taxable = Math.max(0, grossIncome - standardDeduction);
      tax = slabTax(taxable, NEW_SLABS);
      if (taxable <= 700000) tax = 0; // 87A rebate
    } else {
      standardDeduction = 50000;
      var d80c       = Math.min(deductions.d80c || 0,       150000);
      var d80d       = Math.min(deductions.d80d || 0,       25000);
      var homeLoan   = Math.min(deductions.homeLoan || 0,   200000);
      var nps        = Math.min(deductions.nps || 0,        50000);
      taxable = Math.max(0,
        grossIncome - standardDeduction - d80c - d80d - homeLoan - nps);
      tax = slabTax(taxable, OLD_SLABS);
      if (taxable <= 500000) tax = 0; // 87A rebate
    }

    // 4% cess
    tax = tax * 1.04;
    return { taxable: taxable, tax: tax, monthly: tax / 12 };
  }

  function renderSlabTable(income, slabs, wrapperId) {
    var fmt = FinCalc.Formatters;
    var dom = FinCalc.DOM;
    var headers = ['Income Slab', 'Rate', 'Tax Amount'];
    var rows = slabs.map(function (s) {
      if (income <= s.from) return null;
      var taxable = Math.min(income, s.to === Infinity ? income : s.to) - s.from;
      var tax     = taxable * s.rate / 100;
      var toLabel = s.to === Infinity ? 'Above' : fmt.compact(s.to);
      return [
        fmt.compact(s.from) + ' – ' + toLabel,
        s.rate + '%',
        fmt.currency(tax)
      ];
    }).filter(Boolean);
    dom.buildTable(wrapperId, headers, rows);
  }

  function calculate() {
    var fmt    = FinCalc.Formatters;
    var dom    = FinCalc.DOM;
    var income = dom.getVal('tax-income');
    if (!income) return;

    var d80c     = dom.getVal('tax-80c');
    var d80d     = dom.getVal('tax-80d');
    var homeLoan = dom.getVal('tax-homeloan');
    var nps      = dom.getVal('tax-nps');

    var deductions = { d80c: d80c, d80d: d80d, homeLoan: homeLoan, nps: nps };

    var newResult = calcRegime(income, 'new', deductions);
    var oldResult = calcRegime(income, 'old', deductions);

    dom.setResult('tax-new-tax',     fmt.currency(newResult.tax));
    dom.setResult('tax-new-monthly', fmt.currency(newResult.monthly));
    dom.setResult('tax-new-taxable', fmt.currency(newResult.taxable));

    dom.setResult('tax-old-tax',     fmt.currency(oldResult.tax));
    dom.setResult('tax-old-monthly', fmt.currency(oldResult.monthly));
    dom.setResult('tax-old-taxable', fmt.currency(oldResult.taxable));

    // Recommended regime
    var recEl = document.getElementById('tax-recommendation');
    if (recEl) {
      var saving = Math.abs(newResult.tax - oldResult.tax);
      if (newResult.tax <= oldResult.tax) {
        recEl.innerHTML = '<span class="badge badge-success">New Regime Recommended</span> ' +
          'You save ' + fmt.currency(saving) + ' with New Regime.';
        document.getElementById('tax-new-card').classList.add('recommended');
        document.getElementById('tax-old-card').classList.remove('recommended');
      } else {
        recEl.innerHTML = '<span class="badge badge-success">Old Regime Recommended</span> ' +
          'You save ' + fmt.currency(saving) + ' with Old Regime.';
        document.getElementById('tax-old-card').classList.add('recommended');
        document.getElementById('tax-new-card').classList.remove('recommended');
      }
    }

    dom.showResults('tax-results');

    // Render slab tables
    renderSlabTable(newResult.taxable, NEW_SLABS, 'tax-new-slabs');
    renderSlabTable(oldResult.taxable, OLD_SLABS, 'tax-old-slabs');

    // Grouped bar chart
    FinCalc.ChartManager.createBar('tax-chart',
      ['Gross Income', 'Taxable Income', 'Tax Payable'],
      [
        {
          label: 'New Regime',
          data: [income, newResult.taxable, newResult.tax],
          backgroundColor: '#f97316',
          borderRadius: 6
        },
        {
          label: 'Old Regime',
          data: [income, oldResult.taxable, oldResult.tax],
          backgroundColor: '#fbd5b5',
          borderRadius: 6
        }
      ]
    );
  }

  function init() {
    var dom = FinCalc.DOM;

    dom.syncSliderInput('tax-income-slider', 'tax-income');

    var btn = document.getElementById('tax-calculate');
    if (btn) btn.addEventListener('click', calculate);
  }

  return { init: init, calculate: calculate };
})();
