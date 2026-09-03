document.addEventListener('DOMContentLoaded', () => {
    const WHATSAPP_NUMBER = '972584694464';
    const LANG = document.documentElement.lang === 'en' ? 'en' : 'he';
    const CURRENCY = LANG === 'en' ? '€' : '₪';

    const SIZE_LABELS = {
        he: { '1015': '10x15 ס"מ', '1521': '15x21 ס"מ', '2030': '20x30 ס"מ', '3040': '30x40 ס"מ', other: 'אחר' },
        en: { '1015': '10x15 cm', '1521': '15x21 cm', '2030': '20x30 cm', '3040': '30x40 cm', other: 'other' },
    }[LANG];

    const T = {
        he: {
            buy: 'רכישה',
            slideAlt: n => `תמונה ${n}`,
            chooseLicense: 'נא לבחור האם התמונה היא לשימוש אישי או מסחרי',
            printBySize: 'לתיאום',
            licensePersonal: 'אישי',
            licenseCommercial: 'מסחרי',
            digitalMessage: (name, license, price) =>
                `היי ליאורה, ברצוני לרכוש מקור של התמונה הדיגיטלית ${name} לשימוש ${license}, ב ${price} ש"ח.`,
            printMessage: (name, size, format) => `היי ליאורה, ברצוני לרכוש את התמונה ${name} בגודל ${size} בפורמט ${format}`,
            printMessagePrice: price => `, ב ${price} ש"ח.`,
            printMessageOther: '.',
        },
        en: {
            buy: 'Buy',
            slideAlt: n => `Photo ${n}`,
            chooseLicense: 'Please choose whether the photo is for personal or commercial use',
            printBySize: 'to be arranged',
            licensePersonal: 'personal',
            licenseCommercial: 'commercial',
            digitalMessage: (name, license, price) =>
                `Hi Liora, I'd like to purchase the original of the digital photo "${name}" for ${license} use, at ${CURRENCY}${price}.`,
            printMessage: (name, size, format) => `Hi Liora, I'd like to purchase the photo "${name}" in size ${size}, ${format} finish`,
            printMessagePrice: price => `, at ${CURRENCY}${price}.`,
            printMessageOther: '.',
        },
    }[LANG];

    // ---------- Data loading ----------
    fetch('data/photos.json')
        .then(res => res.json())
        .then(photos => {
            renderCarousel(photos.filter(p => /^\d+$/.test(p.category)).sort((a, b) => Number(a.category) - Number(b.category)));
            renderCategories(photos.filter(p => !/^\d+$/.test(p.category)));
            wirePhotoCards();
            initCarousel();
        })
        .catch(err => console.error('Failed to load photos.json', err));

    function photoCardHtml(photo) {
        // photo.file is "<folder>/<name>.png" — encode each path segment on its
        // own so the "/" itself isn't escaped into %2F.
        const src = `pics/${photo.file.split('/').map(encodeURIComponent).join('/')}`;
        const displayName = LANG === 'en' ? (photo.nameEn || photo.name) : photo.name;
        const personal = LANG === 'en' ? photo.priceDigitalPersonalEUR : photo.priceDigitalPersonal;
        const commercial = LANG === 'en' ? photo.priceDigitalCommercialEUR : photo.priceDigitalCommercial;
        const p1015 = LANG === 'en' ? photo.price1015EUR : photo.price1015;
        const p1521 = LANG === 'en' ? photo.price1521EUR : photo.price1521;
        const p2030 = LANG === 'en' ? photo.price2030EUR : photo.price2030;
        const p3040 = LANG === 'en' ? photo.price3040EUR : photo.price3040;
        return `
            <img src="${src}" alt="${displayName}" data-name="${displayName}"
                 data-price-personal="${personal}" data-price-commercial="${commercial}"
                 data-price1015="${p1015}" data-price1521="${p1521}"
                 data-price2030="${p2030}" data-price3040="${p3040}">
            <span class="photo-name-tag">${displayName}</span>
            <button type="button" class="buy-btn">${T.buy}</button>`;
    }

    function renderCarousel(items) {
        const track = document.getElementById('carouselTrack');
        track.innerHTML = items.map(p => `<div class="carousel-slide photo-card">${photoCardHtml(p)}</div>`).join('');
    }

    function renderCategories(items) {
        const container = document.getElementById('categoriesContainer');
        const order = [];
        const groups = {};
        items.forEach(p => {
            if (!groups[p.category]) {
                groups[p.category] = [];
                order.push(p.category);
            }
            groups[p.category].push(p);
        });

        container.innerHTML = order.map(category => {
            const items = groups[category];
            const heading = LANG === 'en' ? (items[0].categoryEn || category) : category;
            return `
            <section class="archive-section">
                <h2 class="category-title">${heading}</h2>
                <div class="photo-grid">
                    ${items.map(p => `<div class="photo-item photo-card">${photoCardHtml(p)}</div>`).join('')}
                </div>
            </section>
        `;
        }).join('');
    }

    // ---------- Lightbox ----------
    const lightbox = document.getElementById('photoLightbox');
    const lightboxImg = lightbox.querySelector('img');
    const lightboxNameTag = document.getElementById('lightboxNameTag');
    const lightboxClose = document.getElementById('lightboxClose');
    const lightboxBuyBtn = document.getElementById('lightboxBuyBtn');
    let lightboxSourceImg = null;

    // Note: the copyright watermark is baked directly into the image file
    // itself (see bake_watermark.py) rather than drawn as a CSS overlay here —
    // that way it's present no matter how the image is accessed (direct URL,
    // right-click save, etc.), not just when viewed through this lightbox.
    function openLightbox(imgEl) {
        lightboxSourceImg = imgEl;
        lightboxImg.src = imgEl.src;
        lightboxImg.alt = imgEl.alt || '';
        lightboxNameTag.textContent = imgEl.dataset.name || '';
        lightbox.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        lightbox.classList.remove('open');
        document.body.style.overflow = '';
    }

    lightboxClose.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) closeLightbox();
    });
    lightboxBuyBtn.addEventListener('click', () => {
        const img = lightboxSourceImg;
        closeLightbox();
        if (img) openPurchaseModal(img);
    });

    // ---------- Purchase modal ----------
    const purchaseModal = document.getElementById('purchaseModal');
    const purchaseModalClose = document.getElementById('purchaseModalClose');
    const purchaseTitle = document.getElementById('purchaseTitle');
    const digitalPanel = document.getElementById('digitalPanel');
    const printPanel = document.getElementById('printPanel');
    const digitalWhatsappBtn = document.getElementById('digitalWhatsappBtn');
    const printWhatsappBtn = document.getElementById('printWhatsappBtn');
    const printSizeSelect = document.getElementById('printSize');
    let currentPhotoImg = null;

    function currentPrices() {
        const d = currentPhotoImg.dataset;
        return {
            personal: Number(d.pricePersonal),
            commercial: Number(d.priceCommercial),
            '1015': Number(d.price1015),
            '1521': Number(d.price1521),
            '2030': Number(d.price2030),
            '3040': Number(d.price3040),
        };
    }

    function isDigitalSelected() {
        return purchaseModal.querySelector('input[name="purchaseType"]:checked').value === 'digital';
    }

    function updatePurchaseTitle() {
        const name = currentPhotoImg.dataset.name;
        if (isDigitalSelected()) {
            // Personal/commercial pricing shown as the two license radio
            // labels instead, so the title is just the photo name here.
            purchaseTitle.textContent = name;
            return;
        }
        const size = printSizeSelect.value;
        if (size === 'other') {
            purchaseTitle.textContent = `${name} - ${T.printBySize}`;
        } else {
            purchaseTitle.textContent = `${name} - ${CURRENCY}${currentPrices()[size]}`;
        }
    }

    function openPurchaseModal(imgEl) {
        currentPhotoImg = imgEl;
        document.getElementById('personalPriceLabel').textContent = imgEl.dataset.pricePersonal;
        document.getElementById('commercialPriceLabel').textContent = imgEl.dataset.priceCommercial;
        // Reset to defaults every time it opens for a (possibly different) photo
        purchaseModal.querySelector('input[name="purchaseType"][value="digital"]').checked = true;
        // Deliberately left unchecked - the buyer must actively choose personal
        // vs. commercial, not fall through on a default they didn't notice.
        purchaseModal.querySelectorAll('input[name="digitalLicense"]').forEach(r => { r.checked = false; });
        purchaseModal.querySelectorAll('input[name="printFormat"]')[0].checked = true;
        printSizeSelect.selectedIndex = 0;
        digitalPanel.hidden = false;
        printPanel.hidden = true;
        updatePurchaseTitle();

        purchaseModal.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closePurchaseModal() {
        purchaseModal.classList.remove('open');
        document.body.style.overflow = '';
    }

    purchaseModal.querySelectorAll('input[name="purchaseType"]').forEach(radio => {
        radio.addEventListener('change', () => {
            const digital = isDigitalSelected();
            digitalPanel.hidden = !digital;
            printPanel.hidden = digital;
            updatePurchaseTitle();
        });
    });

    printSizeSelect.addEventListener('change', updatePurchaseTitle);

    purchaseModalClose.addEventListener('click', closePurchaseModal);
    purchaseModal.addEventListener('click', (e) => {
        if (e.target === purchaseModal) closePurchaseModal();
    });

    digitalWhatsappBtn.addEventListener('click', () => {
        const licenseRadio = purchaseModal.querySelector('input[name="digitalLicense"]:checked');
        if (!licenseRadio) {
            alert(T.chooseLicense);
            return;
        }
        const name = currentPhotoImg.dataset.name;
        const licenseLabel = licenseRadio.value === 'personal' ? T.licensePersonal : T.licenseCommercial;
        const price = currentPrices()[licenseRadio.value];
        const text = T.digitalMessage(name, licenseLabel, price);
        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`, '_blank');
    });

    printWhatsappBtn.addEventListener('click', () => {
        const name = currentPhotoImg.dataset.name;
        const sizeKey = printSizeSelect.value;
        const size = SIZE_LABELS[sizeKey];
        const format = purchaseModal.querySelector('input[name="printFormat"]:checked').value;
        let text = T.printMessage(name, size, format);
        // "אחר"/"other" has no fixed price (to be arranged) - nothing to append in that case.
        text += sizeKey !== 'other' ? T.printMessagePrice(currentPrices()[sizeKey]) : T.printMessageOther;
        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`, '_blank');
    });

    // Note: "הפספוס של חיי" / "The Miss of My Life" is its own page
    // (story.html / story-en.html), not a modal.

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeLightbox();
            closePurchaseModal();
        }
    });

    // ---------- Wire up dynamically-rendered photo cards ----------
    function wirePhotoCards() {
        document.querySelectorAll('.photo-card').forEach(card => {
            const img = card.querySelector('img');
            const buyBtn = card.querySelector('.buy-btn');

            img.addEventListener('click', () => openLightbox(img));
            buyBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                openPurchaseModal(img);
            });
        });
    }

    // ---------- Weekly carousel navigation ----------
    function initCarousel() {
        const track = document.querySelector('.carousel-track');
        const slides = Array.from(track.querySelectorAll('.carousel-slide'));
        if (slides.length === 0) return;

        const prevBtn = document.querySelector('.carousel-prev');
        const nextBtn = document.querySelector('.carousel-next');
        const dotsContainer = document.getElementById('carouselDots');
        dotsContainer.innerHTML = '';

        slides.forEach((_, i) => {
            const dot = document.createElement('button');
            dot.type = 'button';
            dot.className = 'dot' + (i === 0 ? ' active' : '');
            dot.setAttribute('aria-label', T.slideAlt(i + 1));
            dot.addEventListener('click', () => goToSlide(i));
            dotsContainer.appendChild(dot);
        });
        const dots = Array.from(dotsContainer.querySelectorAll('.dot'));
        let currentIdx = 0;

        function detectIndexFromScroll() {
            const trackRect = track.getBoundingClientRect();
            let closest = 0;
            let closestDist = Infinity;
            slides.forEach((slide, i) => {
                const dist = Math.abs(slide.getBoundingClientRect().left - trackRect.left);
                if (dist < closestDist) {
                    closestDist = dist;
                    closest = i;
                }
            });
            return closest;
        }

        function setActiveDot(idx) {
            dots.forEach((d, i) => d.classList.toggle('active', i === idx));
        }

        function goToSlide(i) {
            currentIdx = Math.max(0, Math.min(slides.length - 1, i));
            slides[currentIdx].scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
            // Track state directly rather than re-deriving from live scroll
            // position, which lags behind during the smooth-scroll animation
            // and gives wrong results on rapid consecutive clicks.
            setActiveDot(currentIdx);
        }

        prevBtn.addEventListener('click', () => goToSlide(currentIdx - 1));
        nextBtn.addEventListener('click', () => goToSlide(currentIdx + 1));

        // Resync after a manual swipe/drag (which fires real scroll events,
        // unlike programmatic scrollIntoView) once it settles.
        let scrollTimeout;
        track.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                currentIdx = detectIndexFromScroll();
                setActiveDot(currentIdx);
            }, 100);
        });
    }
});
