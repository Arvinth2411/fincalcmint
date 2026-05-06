(function () {
  'use strict';

  var App = {

    init: function () {
      this.initTheme();
      this.initMobileMenu();
      this.initNavigation();
      this.initScrollSpy();
      this.initStatCounters();
      this.initRevealAnimations();
      this.initScrollProgress();
      FinCalc.DOM.initAllSliders();

      // Init calculators after DOM is ready
      FinCalc.EMI.init();
      FinCalc.CarLoan.init();
      FinCalc.SIP.init();
      FinCalc.FD.init();
      FinCalc.GST.init();
      FinCalc.Salary.init();
      FinCalc.Comparison.init();
      FinCalc.Inflation.init();
      FinCalc.IncomeTax.init();
    },

    // ============================================
    // THEME TOGGLE
    // ============================================
    initTheme: function () {
      // Detect system preference on first visit
      if (!localStorage.getItem('fincalc-theme')) {
        var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.body.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
      } else {
        document.body.setAttribute('data-theme', localStorage.getItem('fincalc-theme'));
      }

      var btn = document.getElementById('theme-toggle');
      if (!btn) return;

      btn.addEventListener('click', function () {
        var current = document.body.getAttribute('data-theme');
        var next = current === 'light' ? 'dark' : 'light';
        document.body.setAttribute('data-theme', next);
        localStorage.setItem('fincalc-theme', next);
        FinCalc.ChartManager.updateTheme();
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

      function open() {
        sidebar.classList.add('open');
        overlay.style.display = 'block';
        setTimeout(function () { overlay.classList.add('visible'); }, 10);
        hamburger.classList.add('open');
        document.body.style.overflow = 'hidden';
      }

      function close() {
        sidebar.classList.remove('open');
        overlay.classList.remove('visible');
        hamburger.classList.remove('open');
        document.body.style.overflow = '';
        setTimeout(function () { overlay.style.display = 'none'; }, 300);
      }

      hamburger.addEventListener('click', function () {
        sidebar.classList.contains('open') ? close() : open();
      });

      overlay.addEventListener('click', close);

      // Close on nav link click (mobile)
      sidebar.querySelectorAll('.nav-link').forEach(function (link) {
        link.addEventListener('click', function () {
          if (window.innerWidth < 1024) close();
        });
      });
    },

    // ============================================
    // NAVIGATION — SMOOTH SCROLL
    // ============================================
    initNavigation: function () {
      document.querySelectorAll('[data-nav-target]').forEach(function (el) {
        el.addEventListener('click', function (e) {
          e.preventDefault();
          var targetId = el.getAttribute('data-nav-target');
          var target = document.querySelector(targetId);
          if (!target) return;
          var offset = parseInt(getComputedStyle(document.documentElement)
            .getPropertyValue('--topbar-height')) || 64;
          var top = target.getBoundingClientRect().top + window.pageYOffset - offset - 16;
          window.scrollTo({ top: top, behavior: 'smooth' });
          // Update URL hash
          history.replaceState(null, '', targetId);
        });
      });
    },

    // ============================================
    // SCROLL SPY
    // ============================================
    initScrollSpy: function () {
      var sections = document.querySelectorAll('[data-section]');
      if (!sections.length) return;

      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var id = entry.target.id;
            document.querySelectorAll('.nav-item').forEach(function (item) {
              item.classList.remove('active');
            });
            var active = document.querySelector('.nav-item[data-section-id="' + id + '"]');
            if (active) {
              active.classList.add('active');
              // Scroll into view in sidebar if needed
              var link = active.querySelector('.nav-link');
              if (link) link.scrollIntoView({ block: 'nearest' });
            }
          }
        });
      }, { rootMargin: '-20% 0px -70% 0px', threshold: 0 });

      sections.forEach(function (section) { observer.observe(section); });
    },

    // ============================================
    // HERO STAT COUNTERS
    // ============================================
    initStatCounters: function () {
      var observed = false;
      var statEls = document.querySelectorAll('[data-counter]');
      if (!statEls.length) return;

      var observer = new IntersectionObserver(function (entries) {
        if (observed) return;
        entries.forEach(function (entry) {
          if (entry.isIntersecting && !observed) {
            observed = true;
            statEls.forEach(function (el) {
              var target   = parseInt(el.getAttribute('data-counter')) || 0;
              var suffix   = el.getAttribute('data-suffix') || '';
              var prefix   = el.getAttribute('data-prefix') || '';
              FinCalc.DOM.animateCounter(el, target, 1400, function (n) {
                return prefix + Math.round(n).toLocaleString('en-IN') + suffix;
              });
            });
            observer.disconnect();
          }
        });
      }, { threshold: 0.5 });

      statEls.forEach(function (el) { observer.observe(el); });
    },

    // ============================================
    // REVEAL ANIMATIONS (sections entering viewport)
    // ============================================
    initRevealAnimations: function () {
      var revealEls = document.querySelectorAll('.reveal');
      if (!revealEls.length) return;

      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

      revealEls.forEach(function (el) { observer.observe(el); });
    },

    // ============================================
    // SCROLL PROGRESS BAR
    // ============================================
    initScrollProgress: function () {
      var bar = document.getElementById('scroll-progress');
      if (!bar) return;
      window.addEventListener('scroll', function () {
        var scrollTop  = window.pageYOffset;
        var docHeight  = document.documentElement.scrollHeight - window.innerHeight;
        var pct        = docHeight > 0 ? (scrollTop / docHeight) : 0;
        bar.style.transform = 'scaleX(' + pct + ')';
      }, { passive: true });
    }
  };

  document.addEventListener('DOMContentLoaded', function () {
    App.init();
  });

})();
