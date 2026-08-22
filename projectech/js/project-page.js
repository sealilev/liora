// Shared behavior for project case-study pages (route-planner, aromatherapy, etc.)

document.addEventListener('DOMContentLoaded', () => {
    // Image lightbox - click any project image to see it enlarged
    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.innerHTML = '<img src="" alt="">';
    document.body.appendChild(lightbox);
    const lightboxImg = lightbox.querySelector('img');

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

    document.querySelectorAll('.project-feature-image, .project-row-image img').forEach(img => {
        img.addEventListener('click', () => openLightbox(img.src, img.alt));
    });

    lightbox.addEventListener('click', closeLightbox);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeLightbox();
    });
});
