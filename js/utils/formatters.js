window.FinCalc = window.FinCalc || {};

window.FinCalc.Formatters = (function () {
  'use strict';

  function currency(amount) {
    if (isNaN(amount) || amount === null) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
      minimumFractionDigits: 0
    }).format(Math.round(amount));
  }

  function currencyFull(amount) {
    if (isNaN(amount) || amount === null) return '₹0.00';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
      minimumFractionDigits: 2
    }).format(amount);
  }

  function compact(amount) {
    if (isNaN(amount) || amount === null) return '₹0';
    const abs = Math.abs(amount);
    if (abs >= 1e7) return '₹' + (amount / 1e7).toFixed(2) + ' Cr';
    if (abs >= 1e5) return '₹' + (amount / 1e5).toFixed(2) + ' L';
    if (abs >= 1e3) return '₹' + (amount / 1e3).toFixed(1) + ' K';
    return '₹' + Math.round(amount).toLocaleString('en-IN');
  }

  function number(val) {
    if (isNaN(val) || val === null) return '0';
    return Math.round(val).toLocaleString('en-IN');
  }

  function percent(val, decimals) {
    decimals = decimals !== undefined ? decimals : 2;
    if (isNaN(val) || val === null) return '0%';
    return val.toFixed(decimals) + '%';
  }

  function months(n) {
    const y = Math.floor(n / 12);
    const m = n % 12;
    const parts = [];
    if (y > 0) parts.push(y + (y === 1 ? ' yr' : ' yrs'));
    if (m > 0) parts.push(m + (m === 1 ? ' mo' : ' mos'));
    return parts.join(' ') || '0 mos';
  }

  function parseInput(value, fallback) {
    const num = parseFloat(String(value).replace(/,/g, ''));
    return isNaN(num) ? (fallback || 0) : num;
  }

  return { currency, currencyFull, compact, number, percent, months, parseInput };
})();
