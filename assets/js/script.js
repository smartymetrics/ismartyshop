/**
 * ISMARTYSHOP - CLIENT INTERACTION SCRIPT
 * Handles iframe auto-resizing, countdown urgency, FAQ toggling, and smooth scroll.
 */

document.addEventListener('DOMContentLoaded', function () {
  // 1. Olinwa CMS Iframe Message Listener
  window.addEventListener('message', function (e) {
    if (!e.data) return;
    var data = e.data;
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch (err) {}
    }

    // Auto-resize iframe height to prevent double scrollbars
    if (data.type === 'resize-iframe') {
      var iframes = document.querySelectorAll('.olinwa-iframe-wrapper iframe');
      iframes.forEach(function (iframe) {
        if (data.height) {
          iframe.style.height = data.height + 'px';
        }
      });
    }

    // Redirect to Thank You page after successful form submission
    if (data.type === 'redirect-thank-you' || data.type === 'redirect') {
      if (data.url) {
        window.location.href = data.url;
      } else {
        window.location.href = './thank-you.html';
      }
    }
  });

  // 2. Dynamic Urgency Countdown Timer (3 hours recurring countdown)
  function initCountdown() {
    var hoursEl = document.getElementById('timer-hours');
    var minutesEl = document.getElementById('timer-mins');
    var secondsEl = document.getElementById('timer-secs');

    if (!hoursEl || !minutesEl || !secondsEl) return;

    // Use a persistent 3-hour window
    var now = new Date().getTime();
    var storedTarget = localStorage.getItem('ismarty_promo_timer');
    var targetTime;

    if (storedTarget && Number(storedTarget) > now) {
      targetTime = Number(storedTarget);
    } else {
      targetTime = now + (2 * 60 * 60 + 47 * 60 + 35) * 1000; // 2h 47m 35s
      localStorage.setItem('ismarty_promo_timer', targetTime);
    }

    function update() {
      var current = new Date().getTime();
      var diff = targetTime - current;

      if (diff <= 0) {
        targetTime = current + (2 * 60 * 60) * 1000;
        localStorage.setItem('ismarty_promo_timer', targetTime);
        diff = targetTime - current;
      }

      var h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      var m = Math.floor((diff / (1000 * 60)) % 60);
      var s = Math.floor((diff / 1000) % 60);

      hoursEl.textContent = (h < 10 ? '0' : '') + h;
      minutesEl.textContent = (m < 10 ? '0' : '') + m;
      secondsEl.textContent = (s < 10 ? '0' : '') + s;
    }

    update();
    setInterval(update, 1000);
  }
  initCountdown();

  // 3. Smooth Scroll to Order Form with Offset
  var scrollButtons = document.querySelectorAll('a[href^="#order-form"]');
  scrollButtons.forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      var target = document.getElementById('order-form');
      if (target) {
        var headerOffset = 20;
        var elementPosition = target.getBoundingClientRect().top;
        var offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });

        // Track InitiateCheckout on Pixel if defined
        if (typeof fbq === 'function') {
          fbq('track', 'InitiateCheckout', {
            content_name: 'Smart Visual Ear Cleaner',
            content_ids: ['smart-visual-ear-cleaner'],
            content_type: 'product',
            value: 25000,
            currency: 'NGN'
          });
        }
      }
    });
  });

  // 4. FAQ Accordion Toggle
  var faqQuestions = document.querySelectorAll('.faq-question');
  faqQuestions.forEach(function (button) {
    button.addEventListener('click', function () {
      var faqItem = this.parentElement;
      var isActive = faqItem.classList.contains('active');

      // Close all others
      document.querySelectorAll('.faq-item').forEach(function (item) {
        item.classList.remove('active');
      });

      // Toggle current
      if (!isActive) {
        faqItem.classList.add('active');
      }
    });
  });

  // 5. Video Autoplay & Tap to Unmute Toggle
  var heroVideo = document.getElementById('hero-product-video');
  var unmuteBtn = document.getElementById('unmute-btn');
  var iconMuted = document.getElementById('sound-icon-muted');
  var iconActive = document.getElementById('sound-icon-active');
  var unmuteText = document.getElementById('unmute-text');

  if (heroVideo) {
    // Ensure muted for browser autoplay policy
    heroVideo.muted = true;
    var playPromise = heroVideo.play();
    if (playPromise !== undefined) {
      playPromise.catch(function () {
        // Autoplay prevented by browser, keep poster visible or retry on interaction
      });
    }

    if (unmuteBtn) {
      unmuteBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (heroVideo.muted) {
          heroVideo.muted = false;
          heroVideo.volume = 1.0;
          if (iconMuted) iconMuted.style.display = 'none';
          if (iconActive) iconActive.style.display = 'inline';
          if (unmuteText) unmuteText.textContent = 'Sound On';
        } else {
          heroVideo.muted = true;
          if (iconMuted) iconMuted.style.display = 'inline';
          if (iconActive) iconActive.style.display = 'none';
          if (unmuteText) unmuteText.textContent = 'Tap For Sound';
        }
      });
    }
  }
});

