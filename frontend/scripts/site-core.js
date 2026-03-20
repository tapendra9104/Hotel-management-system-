(() => {
    const transparentPixel =
        'data:image/gif;base64,R0lGODlhAQABAPAAAP///wAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==';

    const app = {
        state: {
            roomInventory: [],
            roomSearch: { checkIn: '', checkOut: '' },
            spaServices: [],
            spaAddOns: {},
            spaAvailability: null,
            foodMenu: [],
            foodSettings: null
        },

        escapeHtml(value) {
            return String(value ?? '').replace(/[&<>"']/g, (character) => {
                const replacements = {
                    '&': '&amp;',
                    '<': '&lt;',
                    '>': '&gt;',
                    '"': '&quot;',
                    "'": '&#39;'
                };
                return replacements[character] || character;
            });
        },

        getImageConfigByPath(path) {
            if (!window.hotelImages || !path) {
                return null;
            }
            return path.split('.').reduce((current, segment) => current?.[segment], window.hotelImages);
        },

        applyImageAsset(img, asset) {
            if (!img || !asset) {
                return;
            }
            img.src = asset.url || transparentPixel;
            img.alt = asset.alt || img.alt || '';
            img.loading = asset.fetchPriority === 'high' ? 'eager' : (img.loading || 'lazy');
            img.decoding = 'async';
            if (asset.fetchPriority) {
                img.fetchPriority = asset.fetchPriority;
            }
            if (asset.position) {
                img.style.objectPosition = asset.position;
            }
        },

        initializeHomepageImages() {
            document.querySelectorAll('[data-image-key]').forEach((img) => {
                app.applyImageAsset(img, app.getImageConfigByPath(img.dataset.imageKey));
            });

            document.querySelectorAll('[data-gallery-index]').forEach((img) => {
                app.applyImageAsset(img, window.hotelImages?.gallery?.[Number(img.dataset.galleryIndex)]);
            });

            document.querySelectorAll('[data-gallery-title-index]').forEach((overlay) => {
                const asset = window.hotelImages?.gallery?.[Number(overlay.dataset.galleryTitleIndex)];
                if (asset?.title) {
                    overlay.textContent = asset.title;
                }
            });
        },

        scrollToSection(sectionId) {
            const target = document.getElementById(sectionId);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        },

        formatHeroDate(value) {
            if (!value) {
                return 'Select date';
            }
            const parsedDate = new Date(`${value}T00:00:00`);
            if (Number.isNaN(parsedDate.getTime())) {
                return 'Select date';
            }
            return parsedDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
        },

        initializeHeroDateFields() {
            document.querySelectorAll('[data-date-trigger]').forEach((trigger) => {
                const input = document.getElementById(trigger.dataset.dateTrigger);
                if (!input) {
                    return;
                }

                const syncDisplay = () => {
                    trigger.textContent = app.formatHeroDate(input.value);
                };

                trigger.addEventListener('click', () => {
                    if (typeof input.showPicker === 'function') {
                        input.showPicker();
                    } else {
                        input.focus();
                        input.click();
                    }
                });

                input.addEventListener('change', syncDisplay);
                syncDisplay();
            });
        },

        createFloatingMessage(text, options = {}) {
            const message = document.createElement('div');
            message.style.cssText = `
                position: fixed;
                top: 100px;
                left: 50%;
                transform: translateX(-50%);
                background: ${options.background || '#d4af37'};
                color: ${options.color || '#1a1a1a'};
                padding: 1rem 2rem;
                border-radius: 12px;
                box-shadow: 0 8px 24px rgba(0,0,0,0.22);
                z-index: 9999;
                font-weight: 600;
                max-width: min(92vw, 560px);
                text-align: center;
            `;
            message.textContent = text;
            document.body.appendChild(message);
            setTimeout(() => message.remove(), options.duration || 4000);
        },

        setSectionFeedback(target, message = '', tone = '') {
            const element = typeof target === 'string' ? document.getElementById(target) : target;
            if (!element) {
                return;
            }

            element.textContent = message;
            element.style.color = tone === 'error'
                ? '#b33a3a'
                : tone === 'success'
                    ? '#1d7a45'
                    : '#58637c';
        },

        formatCurrency(value) {
            return new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR',
                maximumFractionDigits: 0
            }).format(Number(value) || 0);
        },

        formatLongDate(value) {
            const date = new Date(value);
            if (Number.isNaN(date.getTime())) {
                return value;
            }
            return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        },

        formatTimeLabel(value) {
            if (!value || value === 'asap') {
                return 'ASAP';
            }
            const [hours, minutes] = value.split(':').map(Number);
            const date = new Date();
            date.setHours(hours, minutes, 0, 0);
            return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
        },

        toLocalDateString(date) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        },

        getTodayIso() {
            return app.toLocalDateString(new Date());
        },

        addDays(dateString, days) {
            const date = new Date(`${dateString}T00:00:00`);
            date.setDate(date.getDate() + days);
            return app.toLocalDateString(date);
        },

        getStaySearchCriteria() {
            const checkIn = document.getElementById('checkin')?.value;
            const checkOut = document.getElementById('checkout')?.value;
            if (checkIn && checkOut) {
                return { checkIn, checkOut };
            }
            const today = app.getTodayIso();
            return { checkIn: today, checkOut: app.addDays(today, 1) };
        },

        async fetchJSON(url, options = {}) {
            const response = await fetch(url, options);
            const data = await response.json().catch(() => ({}));
            if (!response.ok || data.success === false) {
                throw new Error(data.message || `Request failed with status ${response.status}`);
            }
            return data;
        }
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    app.observeCards = (scope = document) => {
        scope.querySelectorAll('.room-card, .facility-card, .review-card, .stat-card, .feature-card, .spa-card, .menu-card').forEach((element) => {
            if (element.dataset.animated === 'true') {
                return;
            }
            element.dataset.animated = 'true';
            element.style.opacity = '0';
            element.style.transform = 'translateY(20px)';
            element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(element);
        });
    };

    app.openModal = (modal) => {
        if (!modal) {
            return;
        }
        modal.classList.add('is-open');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    };

    app.closeModal = (modal) => {
        if (!modal) {
            return;
        }
        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
        if (!document.querySelector('.booking-modal.is-open')) {
            document.body.style.overflow = '';
        }
    };

    app.wireModalClosers = (selector, modal, onClose) => {
        document.querySelectorAll(selector).forEach((element) => {
            element.addEventListener('click', () => {
                if (typeof onClose === 'function') {
                    onClose();
                }
                app.closeModal(modal);
            });
        });
    };

    app.initializeStatsAnimation = () => {
        const statsSection = document.querySelector('.stats-grid');
        if (!statsSection) {
            return;
        }

        const animateCounters = () => {
            document.querySelectorAll('.stat-card h4').forEach((stat) => {
                const finalText = stat.dataset.targetText || stat.textContent.trim();
                stat.dataset.targetText = finalText;
                const match = finalText.match(/^(\d+(?:\.\d+)?)(.*)$/);
                if (!match) {
                    return;
                }
                const target = parseFloat(match[1]);
                const suffix = match[2] || '';
                const decimals = (match[1].split('.')[1] || '').length;
                if (Number.isNaN(target) || suffix.includes('/')) {
                    stat.textContent = finalText;
                    return;
                }

                const increment = target / 30;
                let current = 0;
                const counter = setInterval(() => {
                    current += increment;
                    if (current >= target) {
                        stat.textContent = finalText;
                        clearInterval(counter);
                    } else {
                        const nextValue = decimals > 0 ? current.toFixed(decimals) : Math.floor(current).toString();
                        stat.textContent = `${nextValue}${suffix}`;
                    }
                }, 30);
            });
        };

        const statsObserver = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                animateCounters();
                statsObserver.unobserve(entries[0].target);
            }
        }, { threshold: 0.5 });

        statsObserver.observe(statsSection);
    };

    app.initializeNavigationEffects = () => {
        document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
            anchor.addEventListener('click', (event) => {
                event.preventDefault();
                const targetSelector = anchor.getAttribute('href');
                if (targetSelector) {
                    app.scrollToSection(targetSelector.slice(1));
                }
            });
        });

        document.querySelectorAll('[data-scroll-target]').forEach((button) => {
            button.addEventListener('click', (event) => {
                const target = button.dataset.scrollTarget;
                if (target) {
                    event.preventDefault();
                    app.scrollToSection(target);
                }
            });
        });

        const navbar = document.querySelector('.navbar');
        window.addEventListener('scroll', () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            if (navbar) {
                navbar.style.boxShadow = scrollTop > 50
                    ? '0 4px 20px rgba(0, 0, 0, 0.15)'
                    : '0 2px 10px rgba(0, 0, 0, 0.1)';
            }

            let current = '';
            document.querySelectorAll('section').forEach((section) => {
                if (window.pageYOffset >= section.offsetTop - 200) {
                    current = section.getAttribute('id');
                }
            });

            document.querySelectorAll('.nav-links a').forEach((link) => {
                link.style.color = link.getAttribute('href').slice(1) === current
                    ? 'var(--primary-color)'
                    : 'var(--text-dark)';
            });
        });
    };

    app.initCore = () => {
        app.initializeHomepageImages();
        app.initializeHeroDateFields();
        app.initializeNavigationEffects();
        app.initializeStatsAnimation();
        app.observeCards(document);
    };

    window.GrandStayApp = app;
})();
