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
        // Dynamically resolve to the product's own thank-you page
        var currentPath = window.location.pathname.replace(/\/index\.html$/, '').replace(/\/$/, '');
        window.location.href = currentPath ? (currentPath + '/thank-you.html') : '/ear-cleaner/thank-you.html';
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

  // 3b. Mobile-Optimized Sticky Bottom Bar Visibility Controller
  (function initStickyBarVisibility() {
    var stickyBar = document.querySelector('.sticky-bottom-bar');
    var orderFormSection = document.getElementById('order-form');
    if (!stickyBar || !orderFormSection) return;

    function updateStickyBar() {
      var rect = orderFormSection.getBoundingClientRect();
      var vh = window.innerHeight || document.documentElement.clientHeight;
      // In view if the form overlaps the visible screen area
      var inView = rect.top < (vh - 30) && rect.bottom > 30;
      if (inView) {
        stickyBar.classList.add('hidden');
      } else {
        stickyBar.classList.remove('hidden');
      }
    }

    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            stickyBar.classList.add('hidden');
          } else {
            stickyBar.classList.remove('hidden');
          }
        });
      }, {
        root: null,
        threshold: [0, 0.05, 0.15],
        rootMargin: '0px 0px -30px 0px'
      });
      observer.observe(orderFormSection);
    }

    // Passive scroll & touchmove listener for mobile in-app browsers (Facebook, Instagram, TikTok WebViews)
    var ticking = false;
    function onScrollOrTouch() {
      if (!ticking) {
        window.requestAnimationFrame(function () {
          updateStickyBar();
          ticking = false;
        });
        ticking = true;
      }
    }

    window.addEventListener('scroll', onScrollOrTouch, { passive: true });
    window.addEventListener('touchmove', onScrollOrTouch, { passive: true });
    window.addEventListener('resize', onScrollOrTouch, { passive: true });

    // Initial check on page load
    updateStickyBar();
  })();

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

  // 6. Professional WhatsApp Order Modal & Instant Submission
  (function initWhatsAppOrderSystem() {
    var modal = document.getElementById('wa-order-modal');
    if (!modal) return;

    var closeBtn = document.getElementById('wa-modal-close-btn');
    var form = document.getElementById('wa-order-form');
    var packageItems = document.querySelectorAll('.wa-package-item');
    var openBtns = document.querySelectorAll('.open-wa-modal');
    var submitBtn = document.getElementById('btn-submit-wa-order');

    var selectedPackage = {
      id: '1',
      qty: 1,
      price: 25000,
      label: '1 Full Kit (₦25,000)'
    };

    function selectPackage(pkgId) {
      packageItems.forEach(function (item) {
        if (item.getAttribute('data-package-id') === String(pkgId)) {
          item.classList.add('active');
          selectedPackage = {
            id: pkgId,
            qty: parseInt(item.getAttribute('data-qty') || '1', 10),
            price: parseInt(item.getAttribute('data-price') || '25000', 10),
            label: item.getAttribute('data-label') || '1 Full Kit (₦25,000)'
          };
        } else {
          item.classList.remove('active');
        }
      });
    }

    packageItems.forEach(function (item) {
      item.addEventListener('click', function () {
        var pkgId = this.getAttribute('data-package-id');
        selectPackage(pkgId);
      });
    });

    function openModal(pkgId) {
      if (pkgId) selectPackage(pkgId);
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
      setTimeout(function () {
        var nameInput = document.getElementById('wa-fullname');
        if (nameInput) nameInput.focus();
      }, 150);
    }

    function closeModal() {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }

    openBtns.forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        var pkgId = this.getAttribute('data-package') || '1';
        openModal(pkgId);
      });
    });

    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    modal.addEventListener('click', function (e) {
      if (e.target === modal) closeModal();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.classList.contains('active')) {
        closeModal();
      }
    });

    // Remove error class on typing or changing
    ['wa-fullname', 'wa-phone', 'wa-state', 'wa-address'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', function () {
          this.classList.remove('error');
        });
        el.addEventListener('change', function () {
          this.classList.remove('error');
        });
      }
    });

    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();

        var nameEl = document.getElementById('wa-fullname');
        var phoneEl = document.getElementById('wa-phone');
        var altPhoneEl = document.getElementById('wa-altphone');
        var stateEl = document.getElementById('wa-state');
        var addressEl = document.getElementById('wa-address');
        var notesEl = document.getElementById('wa-notes');

        var isValid = true;
        var firstErrorEl = null;

        var nameVal = nameEl ? nameEl.value.trim() : '';
        var phoneVal = phoneEl ? phoneEl.value.trim().replace(/\s+/g, '') : '';
        var stateVal = stateEl ? stateEl.value.trim() : '';
        var addressVal = addressEl ? addressEl.value.trim() : '';

        if (nameVal.length < 2) {
          if (nameEl) nameEl.classList.add('error');
          isValid = false;
          if (!firstErrorEl) firstErrorEl = nameEl;
        }

        if (phoneVal.length < 10) {
          if (phoneEl) phoneEl.classList.add('error');
          isValid = false;
          if (!firstErrorEl) firstErrorEl = phoneEl;
        }

        if (!stateVal) {
          if (stateEl) stateEl.classList.add('error');
          isValid = false;
          if (!firstErrorEl) firstErrorEl = stateEl;
        }

        if (addressVal.length < 6) {
          if (addressEl) addressEl.classList.add('error');
          isValid = false;
          if (!firstErrorEl) firstErrorEl = addressEl;
        }

        if (!isValid) {
          if (firstErrorEl) firstErrorEl.focus();
          return;
        }

        // Format professional WhatsApp message
        var lines = [
          '📦 *NEW ORDER: SMART VISUAL EAR CLEANER*',
          '━━━━━━━━━━━━━━━━━━━━',
          '👤 *Customer Name:* ' + nameVal,
          '📞 *Phone Number:* ' + phoneVal
        ];

        if (altPhoneEl && altPhoneEl.value.trim()) {
          lines.push('📱 *Alternative Phone:* ' + altPhoneEl.value.trim());
        }

        lines.push('');
        lines.push('🛍️ *Package Selected:* ' + selectedPackage.label);
        lines.push('💰 *Total Amount:* ₦' + selectedPackage.price.toLocaleString());
        lines.push('🚚 *Delivery:* FREE Delivery + Payment On Delivery');
        lines.push('');
        lines.push('📍 *Delivery State:* ' + stateVal);
        lines.push('🏠 *Full Address & Landmark:* ' + addressVal);

        if (notesEl && notesEl.value.trim()) {
          lines.push('📝 *Special Note:* ' + notesEl.value.trim());
        }

        lines.push('━━━━━━━━━━━━━━━━━━━━');
        lines.push('✅ *I am available and have the cash/transfer ready to pay the dispatch rider upon delivery. Please confirm dispatch!*');

        var fullMessage = lines.join('\n');

        // Meta Pixel Tracking (Tracks Contact & Lead, leaving Purchase strictly for confirmed orders on thank you page)
        if (typeof fbq === 'function') {
          fbq('track', 'Contact', {
            content_name: 'Smart Visual Ear Cleaner - WhatsApp Order',
            value: selectedPackage.price,
            currency: 'NGN'
          });
          fbq('track', 'Lead', {
            content_name: 'Smart Visual Ear Cleaner - WhatsApp Order',
            value: selectedPackage.price,
            currency: 'NGN'
          });
        }

        // Store last purchase details
        try {
          localStorage.setItem('ismarty_last_order', JSON.stringify({
            name: nameVal,
            package: selectedPackage.label,
            price: selectedPackage.price,
            time: Date.now()
          }));
        } catch (err) {}

        // Button feedback
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.style.opacity = '0.7';
          submitBtn.innerHTML = '<span class="btn-main-txt">Connecting to WhatsApp...</span>';
        }

        // Open WhatsApp
        var waUrl = 'https://wa.me/2348109178477?text=' + encodeURIComponent(fullMessage);
        window.open(waUrl, '_blank');

        // Reset and close after a moment
        setTimeout(function () {
          closeModal();
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.style.opacity = '1';
            submitBtn.innerHTML = '<span class="btn-main-txt"><svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24zm4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.01-1.24-.74-.66-1.24-1.48-1.39-1.73-.14-.25-.02-.39.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.17.04-.32-.02-.45-.06-.13-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.13.17 1.78 2.72 4.31 3.81.6.26 1.07.42 1.44.53.61.19 1.16.17 1.6.1.49-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.11-.23-.17-.48-.3z"/></svg> SEND ORDER ON WHATSAPP NOW</span><small>Direct to Official WhatsApp: 0810 917 8477</small>';
          }
        }, 1500);
      });
    }
  })();
});

