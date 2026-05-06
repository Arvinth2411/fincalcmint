window.FinCalc = window.FinCalc || {};

window.FinCalc.Salary = (function () {
  'use strict';

  // New tax regime slabs FY 2025-26
  var NEW_SLABS = [
    { limit: 300000,   rate: 0  },
    { limit: 700000,   rate: 5  },
    { limit: 1000000,  rate: 10 },
    { limit: 1200000,  rate: 15 },
    { limit: 1500000,  rate: 20 },
    { limit: Infinity, rate: 30 }
  ];

  // Old tax regime slabs
  var OLD_SLABS = [
    { limit: 250000,   rate: 0  },
    { limit: 500000,   rate: 5  },
    { limit: 1000000,  rate: 20 },
    { limit: Infinity, rate: 30 }
  ];

  function calcTaxOnSlabs(income, slabs) {
    var tax  = 0;
    var prev = 0;
    for (var i = 0; i < slabs.length; i++) {
      if (income <= prev) break;
      var taxable = Math.min(income, slabs[i].limit) - prev;
      tax += taxable * slabs[i].rate / 100;
      prev = slabs[i].limit;
    }
    return tax;
  }

  function calcTax(taxableIncome, regime) {
    var slabs = regime === 'new' ? NEW_SLABS : OLD_SLABS;
    var tax   = calcTaxOnSlabs(taxableIncome, slabs);

    // Rebate u/s 87A
    if (regime === 'new' && taxableIncome <= 700000) tax = 0;
    if (regime === 'old' && taxableIncome <= 500000) tax = 0;

    // 4% cess
    tax = tax * 1.04;
    return tax;
  }

  function breakdown(ctc, isMetro, regime, deductions80C, deductions80D, homeLoanInt) {
    // CTC breakdown
    var basic     = ctc * 0.40;
    var hra       = basic * (isMetro ? 0.50 : 0.40);
    var specialAl = ctc - basic - hra - (basic * 0.12) - (ctc * 0.0481); // approx gratuity

    // Employee PF: 12% of basic, capped at ₹21,600/yr if basic > 15000/m
    var pfBase    = Math.min(basic, 180000); // ₹15000 * 12
    var employeePF = pfBase * 0.12;
    var employerPF = employeePF;

    // Professional tax ₹2,400/yr
    var profTax = 2400;

    // Gross salary
    var grossSalary = basic + hra + specialAl;

    // Taxable income
    var standardDeduction = 75000;
    var taxableNew = Math.max(0, grossSalary - standardDeduction - employeePF);

    var taxableOld = grossSalary - standardDeduction - employeePF
      - Math.min(deductions80C || 150000, 150000)
      - Math.min(deductions80D || 0, 25000)
      - Math.min(homeLoanInt || 0, 200000)
      - hraExemption(basic, hra, isMetro, grossSalary * 0.10);

    taxableOld = Math.max(0, taxableOld);

    var annualTax = calcTax(regime === 'new' ? taxableNew : taxableOld, regime);
    var monthlyTax = annualTax / 12;

    // Monthly values
    var m = {
      basic:      basic / 12,
      hra:        hra / 12,
      special:    specialAl / 12,
      gross:      grossSalary / 12,
      employeePF: employeePF / 12,
      employerPF: employerPF / 12,
      profTax:    profTax / 12,
      tds:        monthlyTax,
      totalDeductions: (employeePF + profTax + annualTax) / 12,
      netTakeHome: (grossSalary - employeePF - profTax - annualTax) / 12,
      annualTax:   annualTax
    };
    return m;
  }

  function hraExemption(annualBasic, annualHRA, isMetro, annualRentPaid) {
    var actualHRA   = annualHRA;
    var basicPct    = annualBasic * (isMetro ? 0.50 : 0.40);
    var rentLess10  = Math.max(0, annualRentPaid - annualBasic * 0.10);
    return Math.min(actualHRA, Math.min(basicPct, rentLess10));
  }

  function calculate() {
    var fmt    = FinCalc.Formatters;
    var dom    = FinCalc.DOM;
    var ctc    = dom.getVal('sal-ctc');
    if (!ctc) return;

    var isMetroEl  = document.getElementById('sal-metro');
    var regimeEl   = document.getElementById('sal-regime');
    var d80cEl     = document.getElementById('sal-80c');
    var d80dEl     = document.getElementById('sal-80d');
    var homeLoanEl = document.getElementById('sal-homeloan');

    var isMetro    = isMetroEl  ? isMetroEl.checked  : true;
    var regime     = regimeEl   ? regimeEl.value      : 'new';
    var d80c       = d80cEl     ? dom.getVal('sal-80c')      : 150000;
    var d80d       = d80dEl     ? dom.getVal('sal-80d')      : 0;
    var homeLoan   = homeLoanEl ? dom.getVal('sal-homeloan') : 0;

    var m = breakdown(ctc, isMetro, regime, d80c, d80d, homeLoan);

    // Set results
    dom.setResult('sal-net',     fmt.currency(m.netTakeHome));
    dom.setResult('sal-gross',   fmt.currency(m.gross));
    dom.setResult('sal-tds',     fmt.currency(m.tds));
    dom.setResult('sal-annual-tax', fmt.currency(m.annualTax));

    // Breakdown rows
    var bRows = [
      ['Basic Salary',         fmt.currency(m.basic),       ''],
      ['HRA',                  fmt.currency(m.hra),         ''],
      ['Special Allowance',    fmt.currency(m.special),     ''],
      ['Gross Salary',         fmt.currency(m.gross),       ''],
      ['Employee PF (12%)',    '-' + fmt.currency(m.employeePF),  'negative'],
      ['Professional Tax',     '-' + fmt.currency(m.profTax),     'negative'],
      ['TDS / Income Tax',     '-' + fmt.currency(m.tds),         'negative'],
      ['Net Take-Home',        fmt.currency(m.netTakeHome),        'positive']
    ];

    var wrap = document.getElementById('sal-breakdown');
    if (wrap) {
      var html = bRows.map(function (r, i) {
        var cls = (i === 3 || i === 7) ? 'breakdown-row total' : 'breakdown-row';
        var valCls = r[2] ? ' class="breakdown-value ' + r[2] + '"' : ' class="breakdown-value"';
        return '<div class="' + cls + '">' +
          '<span class="breakdown-label">' + r[0] + '</span>' +
          '<span' + valCls + '>' + r[1] + '</span></div>';
      }).join('');
      wrap.innerHTML = html;
    }

    dom.showResults('sal-results');

    FinCalc.ChartManager.createDoughnut(
      'sal-chart',
      ['Net Take-Home', 'Employee PF', 'Income Tax', 'Prof. Tax'],
      [m.netTakeHome, m.employeePF, m.tds, m.profTax],
      ['#8b5cf6', '#c4b5fd', '#ede9fe', '#ddd6fe']
    );
  }

  function init() {
    var dom = FinCalc.DOM;

    dom.syncSliderInput('sal-ctc-slider', 'sal-ctc');

    // Old regime deductions wrapper
    var regimeEl  = document.getElementById('sal-regime');
    var oldWrap   = document.getElementById('sal-old-deductions');
    if (regimeEl && oldWrap) {
      regimeEl.addEventListener('change', function () {
        oldWrap.classList.toggle('hidden', regimeEl.value === 'new');
      });
    }

    var btn = document.getElementById('sal-calculate');
    if (btn) btn.addEventListener('click', calculate);
  }

  return { init: init, calculate: calculate };
})();
