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
    const purchaseModal = document.getElementById('purchaseModal');
    const purchaseModalClose = document.getElementById('purchaseModalClose');
    const purchaseSubmitBtn = document.getElementById('purchaseSubmitBtn');

    function openPurchaseModal() {
        purchaseModal.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closePurchaseModal() {
        purchaseModal.classList.remove('open');
        document.body.style.overflow = '';
    }

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

    // Wire up every photo thumbnail
    document.querySelectorAll('.photo-item').forEach(item => {
        const img = item.querySelector('img');
        const buyBtn = item.querySelector('.buy-btn');

        img.addEventListener('click', () => openLightbox(img.src, img.alt));

        buyBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openPurchaseModal();
        });
    });

    // Lightbox controls
    lightboxClose.addEventListener('click', closeLightbox);
    lightboxBuyBtn.addEventListener('click', () => {
        closeLightbox();
        openPurchaseModal();
    });
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) closeLightbox();
    });

    // Purchase modal controls
    purchaseModalClose.addEventListener('click', closePurchaseModal);
    purchaseModal.addEventListener('click', (e) => {
        if (e.target === purchaseModal) closePurchaseModal();
    });
    purchaseSubmitBtn.addEventListener('click', () => {
        // Placeholder - form fields and submit behavior to be added later
        closePurchaseModal();
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
});
