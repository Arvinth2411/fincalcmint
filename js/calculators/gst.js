window.FinCalc = window.FinCalc || {};

window.FinCalc.GST = (function () {
  'use strict';

  var _mode = 'add'; // 'add' or 'remove'
  var _rate = 18;

  function calculate() {
    var fmt     = FinCalc.Formatters;
    var dom     = FinCalc.DOM;
    var amount  = dom.getVal('gst-amount');
    if (!amount) return;

    var base, gstAmt, total, cgst, sgst;

    if (_mode === 'add') {
      base   = amount;
      gstAmt = base * _rate / 100;
      total  = base + gstAmt;
    } else {
      total  = amount;
      base   = total * 100 / (100 + _rate);
      gstAmt = total - base;
    }

    cgst = gstAmt / 2;
    sgst = gstAmt / 2;

    dom.setResult('gst-base',  fmt.currency(base));
    dom.setResult('gst-cgst',  fmt.currency(cgst));
    dom.setResult('gst-sgst',  fmt.currency(sgst));
    dom.setResult('gst-total', fmt.currency(total));
    dom.setResult('gst-total-gst', fmt.currency(gstAmt));
    dom.setResult('gst-rate-display', _rate + '%');

    dom.showResults('gst-results');

    FinCalc.ChartManager.createHorizontalBar(
      'gst-chart',
      ['Base Amount', 'GST Amount'],
      [{
        data: [Math.round(base), Math.round(gstAmt)],
        backgroundColor: ['#ef4444', '#fca5a5'],
        borderRadius: 6,
        borderSkipped: false
      }]
    );
  }

  function init() {
    var dom = FinCalc.DOM;

    // Mode toggle
    var addBtn    = document.getElementById('gst-mode-add');
    var removeBtn = document.getElementById('gst-mode-remove');
    var labelEl   = document.getElementById('gst-amount-label');

    function setMode(mode) {
      _mode = mode;
      if (addBtn)    addBtn.classList.toggle('active', mode === 'add');
      if (removeBtn) removeBtn.classList.toggle('active', mode === 'remove');
      if (labelEl)   labelEl.textContent = mode === 'add' ? 'Amount (Before GST)' : 'Amount (Inclusive of GST)';
      calculate();
    }

    if (addBtn)    addBtn.addEventListener('click',    function () { setMode('add'); });
    if (removeBtn) removeBtn.addEventListener('click', function () { setMode('remove'); });

    // Rate pills
    document.querySelectorAll('.gst-rate-pill').forEach(function (pill) {
      pill.addEventListener('click', function () {
        document.querySelectorAll('.gst-rate-pill').forEach(function (p) { p.classList.remove('active'); });
        pill.classList.add('active');
        _rate = parseFloat(pill.getAttribute('data-rate'));
        var rateInput = document.getElementById('gst-rate-input');
        if (rateInput) rateInput.value = _rate;
        calculate();
      });
    });

    // Custom rate input
    var rateInput = document.getElementById('gst-rate-input');
    if (rateInput) {
      rateInput.addEventListener('input', function () {
        var v = parseFloat(rateInput.value);
        if (!isNaN(v) && v >= 0 && v <= 100) {
          _rate = v;
          document.querySelectorAll('.gst-rate-pill').forEach(function (p) {
            p.classList.toggle('active', parseFloat(p.getAttribute('data-rate')) === v);
          });
        }
        calculate();
      });
    }

    // Amount input — live calculation
    var amountInput = document.getElementById('gst-amount');
    if (amountInput) {
      amountInput.addEventListener('input', dom.debounce(calculate, 150));
    }

    // Set default active pill
    var defaultPill = document.querySelector('.gst-rate-pill[data-rate="18"]');
    if (defaultPill) defaultPill.classList.add('active');
  }

  return { init: init, calculate: calculate };
})();
