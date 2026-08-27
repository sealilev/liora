document.addEventListener('DOMContentLoaded', () => {
    // Lightbox
    const lightbox = document.getElementById('photoLightbox');
    const lightboxImg = lightbox.querySelector('img');
    const lightboxClose = document.getElementById('lightboxClose');
    const lightboxBuyBtn = document.getElementById('lightboxBuyBtn');

    function openLightbox(src, alt) {
        lightboxImg.src = src;
        lightboxImg.alt = alt || '';
        lightbox.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        lightbox.classList.remove('open');
        document.body.style.overflow = '';
    }

    // Purchase modal
    const WHATSAPP_NUMBER = '972584694464';
    const purchaseModal = document.getElementById('purchaseModal');
    const purchaseModalClose = document.getElementById('purchaseModalClose');
    const digitalPanel = document.getElementById('digitalPanel');
    const printPanel = document.getElementById('printPanel');
    const digitalWhatsappBtn = document.getElementById('digitalWhatsappBtn');
    const printWhatsappBtn = document.getElementById('printWhatsappBtn');
    const printSizeSelect = document.getElementById('printSize');
    let currentPhotoName = '';

    function getPhotoName(imgEl) {
        try {
            const path = new URL(imgEl.src, window.location.href).pathname;
            const filename = path.substring(path.lastIndexOf('/') + 1);
            return filename.replace(/\.[^.]+$/, '');
        } catch (e) {
            return imgEl.alt || '';
        }
    }

    function openPurchaseModal(photoName) {
        currentPhotoName = photoName;
        // Reset to defaults every time it opens for a (possibly different) photo
        purchaseModal.querySelector('input[name="purchaseType"][value="digital"]').checked = true;
        purchaseModal.querySelector('input[name="printFormat"][value="מבריק"]').checked = true;
        printSizeSelect.selectedIndex = 0;
        digitalPanel.hidden = false;
        printPanel.hidden = true;

        purchaseModal.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closePurchaseModal() {
        purchaseModal.classList.remove('open');
        document.body.style.overflow = '';
    }

    purchaseModal.querySelectorAll('input[name="purchaseType"]').forEach(radio => {
        radio.addEventListener('change', () => {
            const isDigital = purchaseModal.querySelector('input[name="purchaseType"]:checked').value === 'digital';
            digitalPanel.hidden = !isDigital;
            printPanel.hidden = isDigital;
        });
    });

    digitalWhatsappBtn.addEventListener('click', () => {
        const text = `היי ליאורה, ברצוני לרכוש מקור של התמונה הדיגיטלית ${currentPhotoName}.`;
        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`, '_blank');
    });

    printWhatsappBtn.addEventListener('click', () => {
        const size = printSizeSelect.value;
        const format = purchaseModal.querySelector('input[name="printFormat"]:checked').value;
        const text = `היי ליאורה, ברצוני לרכוש את התמונה ${currentPhotoName} בגודל ${size} בפורמט ${format}`;
        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`, '_blank');
    });

    // Story modal ("הפספוס של חיי")
    const storyModal = document.getElementById('storyModal');
    const storyModalClose = document.getElementById('storyModalClose');
    const missOfLifeBtn = document.getElementById('missOfLifeBtn');

    function openStoryModal() {
        storyModal.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeStoryModal() {
        storyModal.classList.remove('open');
        document.body.style.overflow = '';
    }

    function closeAll() {
        closeLightbox();
        closePurchaseModal();
        closeStoryModal();
    }

    // Wire up every photo (carousel slides + archive grid items alike)
    document.querySelectorAll('.photo-card').forEach(card => {
        const img = card.querySelector('img');
        const buyBtn = card.querySelector('.buy-btn');

        img.addEventListener('click', () => openLightbox(img.src, img.alt));

        buyBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openPurchaseModal(getPhotoName(img));
        });
    });

    // Lightbox controls
    lightboxClose.addEventListener('click', closeLightbox);
    lightboxBuyBtn.addEventListener('click', () => {
        const name = getPhotoName(lightboxImg);
        closeLightbox();
        openPurchaseModal(name);
    });
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) closeLightbox();
    });

    // Purchase modal controls
    purchaseModalClose.addEventListener('click', closePurchaseModal);
    purchaseModal.addEventListener('click', (e) => {
        if (e.target === purchaseModal) closePurchaseModal();
    });

    // Story modal controls
    missOfLifeBtn.addEventListener('click', openStoryModal);
    storyModalClose.addEventListener('click', closeStoryModal);
    storyModal.addEventListener('click', (e) => {
        if (e.target === storyModal) closeStoryModal();
    });

    // Shared Escape handling
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeAll();
    });

    // Weekly carousel
    const track = document.querySelector('.carousel-track');
    if (track) {
        const slides = Array.from(track.querySelectorAll('.carousel-slide'));
        const prevBtn = document.querySelector('.carousel-prev');
        const nextBtn = document.querySelector('.carousel-next');
        const dotsContainer = document.querySelector('.carousel-dots');

        slides.forEach((_, i) => {
            const dot = document.createElement('button');
            dot.type = 'button';
            dot.className = 'dot' + (i === 0 ? ' active' : '');
            dot.setAttribute('aria-label', `תמונה ${i + 1}`);
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
