/* ============================================
   PAGE-INIT.JS
   Shared bootstrap for all individual calculator pages.
   Handles: theme, mobile nav, scroll-spy, animations,
   slider init, FAQ accordions, AdSense lazy-init.
   ============================================ */
(function () {
  'use strict';

  // Navigation config — shared across all pages
  var NAV_ITEMS = [
    { href: 'index.html',                        icon: '🏠', label: 'Home' },
    { href: 'home-loan-emi-calculator.html',      icon: '🏦', label: 'Home Loan EMI' },
    { href: 'car-loan-emi-calculator.html',       icon: '🚗', label: 'Car / Personal Loan' },
    { href: 'sip-calculator.html',                icon: '📈', label: 'SIP Calculator' },
    { href: 'fd-calculator.html',                 icon: '🏧', label: 'FD Calculator' },
    { href: 'gst-calculator.html',                icon: '🧾', label: 'GST Calculator' },
    { href: 'salary-calculator.html',             icon: '💼', label: 'Salary Calculator' },
    { href: 'loan-comparison-calculator.html',    icon: '⚖️', label: 'Loan Comparison' },
    { href: 'inflation-calculator.html',          icon: '📊', label: 'Inflation Calc' },
    { href: 'income-tax-calculator-india.html',   icon: '🧮', label: 'Income Tax' }
  ];

  var PageInit = {

    init: function () {
      this.buildNav();
      this.initTheme();
      this.initMobileMenu();
      this.initScrollProgress();
      this.initRevealAnimations();
      this.initFAQ();
      this.initAdSense();
      if (window.FinCalc && FinCalc.DOM) {
        FinCalc.DOM.initAllSliders();
      }
    },

    // ============================================
    // BUILD SIDEBAR NAV (dynamic, shared)
    // ============================================
    buildNav: function () {
      var navList = document.getElementById('sidebar-nav');
      if (!navList) return;
      var currentPage = window.location.pathname.split('/').pop() || 'index.html';

      var html = NAV_ITEMS.map(function (item) {
        var isActive = currentPage === item.href ? ' active' : '';
        return '<li class="nav-item' + isActive + '">' +
          '<a class="nav-link" href="' + item.href + '">' +
          '<span class="nav-link-icon">' + item.icon + '</span>' +
          '<span class="nav-link-text">' + item.label + '</span>' +
          '</a></li>';
      }).join('');

      navList.innerHTML = html;
    },

    // ============================================
    // THEME
    // ============================================
    initTheme: function () {
      var saved = localStorage.getItem('fincalc-theme');
      if (!saved) {
        saved = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
      }
      document.body.setAttribute('data-theme', saved);

      var btn = document.getElementById('theme-toggle');
      if (!btn) return;
      btn.addEventListener('click', function () {
        var next = document.body.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
        document.body.setAttribute('data-theme', next);
        localStorage.setItem('fincalc-theme', next);
        if (window.FinCalc && FinCalc.ChartManager) FinCalc.ChartManager.updateTheme();
      });
    },

    // ============================================
    // MOBILE MENU
    // ============================================
    initMobileMenu: function () {
      var hamburger = document.getElementById('hamburger');
      var sidebar   = document.getElementById('sidebar');
      var overlay   = document.getElementById('sidebar-overlay');
      if (!hamburger || !sidebar || !overlay) return;

      function openMenu() {
        sidebar.classList.add('open');
        overlay.style.display = 'block';
        setTimeout(function () { overlay.classList.add('visible'); }, 10);
        hamburger.classList.add('open');
        document.body.style.overflow = 'hidden';
      }
      function closeMenu() {
        sidebar.classList.remove('open');
        overlay.classList.remove('visible');
        hamburger.classList.remove('open');
        document.body.style.overflow = '';
        setTimeout(function () { overlay.style.display = 'none'; }, 300);
      }

      hamburger.addEventListener('click', function () {
        sidebar.classList.contains('open') ? closeMenu() : openMenu();
      });
      overlay.addEventListener('click', closeMenu);

      sidebar.querySelectorAll('.nav-link').forEach(function (link) {
        link.addEventListener('click', function () {
          if (window.innerWidth < 1024) closeMenu();
        });
      });
    },

    // ============================================
    // SCROLL PROGRESS BAR
    // ============================================
    initScrollProgress: function () {
      var bar = document.getElementById('scroll-progress');
      if (!bar) return;
      window.addEventListener('scroll', function () {
        var pct = window.pageYOffset / (document.documentElement.scrollHeight - window.innerHeight);
        bar.style.transform = 'scaleX(' + Math.min(pct, 1) + ')';
      }, { passive: true });
    },

    // ============================================
    // REVEAL ANIMATIONS
    // ============================================
    initRevealAnimations: function () {
      var els = document.querySelectorAll('.reveal');
      if (!els.length || !window.IntersectionObserver) {
        els.forEach(function (el) { el.classList.add('visible'); });
        return;
      }
      var obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            obs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });
      els.forEach(function (el) { obs.observe(el); });
    },

    // ============================================
    // FAQ ACCORDION
    // ============================================
    initFAQ: function () {
      document.querySelectorAll('.faq-question').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var item = btn.closest('.faq-item');
          var isOpen = item.classList.contains('open');
          // Close all others
          document.querySelectorAll('.faq-item.open').forEach(function (i) { i.classList.remove('open'); });
          if (!isOpen) item.classList.add('open');
        });
      });
    },

    // ============================================
    // ADSENSE LAZY INIT
    // Pushes ads only when they scroll into view (saves quota)
    // ============================================
    initAdSense: function () {
      if (!window.IntersectionObserver) return;
      var adUnits = document.querySelectorAll('.adsbygoogle[data-ad-lazy="true"]');
      if (!adUnits.length) return;
      var obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var ins = entry.target;
            ins.removeAttribute('data-ad-lazy');
            try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) {}
            obs.unobserve(ins);
          }
        });
      }, { rootMargin: '200px' });
      adUnits.forEach(function (el) { obs.observe(el); });
    }
  };

  document.addEventListener('DOMContentLoaded', function () {
    PageInit.init();
  });

  // Expose for calculator pages that need to trigger GST/inflation on load
  window.PageInit = PageInit;
})();
