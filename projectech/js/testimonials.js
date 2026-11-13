// Testimonials wall: columns of screenshots that drift slowly, pause when
// hovered/touched, and open enlarged on click.
// The list comes from data/testimonials.json (written by tools/prepare_testimonials.py).

document.addEventListener('DOMContentLoaded', () => {
    const wall = document.getElementById('testimonialsWall');
    if (!wall) return;

    const PICS_DIR = 'pics/testimonials/';
    const DRIFT_SPEED = 22;            // pixels per second
    const TOUCH_RESUME_DELAY = 2500;   // ms the wall stays paused after a touch ends
    const narrowScreen = window.matchMedia('(max-width: 600px)');

    let testimonials = [];

    fetch('data/testimonials.json')
        .then(res => res.json())
        .then(list => {
            testimonials = list;
            render();
            narrowScreen.addEventListener('change', render);
        })
        .catch(err => console.error('Failed to load testimonials.json', err));

    // ---------- Wall ----------
    function createCard(item, index, isClone) {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'testimonial-card';
        card.title = 'לחצ/י להגדלה';
        card.dataset.index = index;
        if (isClone) {
            card.setAttribute('aria-hidden', 'true');
            card.tabIndex = -1;
        }
        const img = document.createElement('img');
        img.src = PICS_DIR + item.file;
        img.alt = `המלצה ${index + 1}`;
        img.width = item.width;
        img.height = item.height;
        img.loading = 'lazy';
        card.appendChild(img);
        return card;
    }

    function render() {
        const columnCount = narrowScreen.matches ? 2 : 3;
        const columns = Array.from({ length: columnCount }, () => ({ items: [], height: 0 }));

        // Each testimonial goes to the currently shortest column, so the
        // columns end up about the same length whatever the image shapes.
        testimonials.forEach((item, index) => {
            const shortest = columns.reduce((a, b) => (b.height < a.height ? b : a));
            shortest.items.push({ item, index });
            shortest.height += item.height / item.width;
        });

        wall.innerHTML = '';
        columns.forEach(column => {
            const col = document.createElement('div');
            col.className = 'testimonials-col';
            const track = document.createElement('div');
            track.className = 'testimonials-track';
            [false, true].forEach(isClone => {
                column.items.forEach(({ item, index }) => track.appendChild(createCard(item, index, isClone)));
            });
            col.appendChild(track);
            wall.appendChild(col);
        });
        setDriftDurations();
    }

    // Same speed in every column: duration follows the track's real height.
    function setDriftDurations() {
        wall.querySelectorAll('.testimonials-track').forEach(track => {
            const loopHeight = track.scrollHeight / 2;
            if (loopHeight > 0) track.style.setProperty('--drift-duration', `${loopHeight / DRIFT_SPEED}s`);
        });
    }
    window.addEventListener('resize', setDriftDurations);

    // Touch screens have no hover - pause while touched, resume a moment after.
    let resumeTimer;
    wall.addEventListener('touchstart', () => {
        clearTimeout(resumeTimer);
        wall.classList.add('is-paused');
    }, { passive: true });
    wall.addEventListener('touchend', () => {
        resumeTimer = setTimeout(() => wall.classList.remove('is-paused'), TOUCH_RESUME_DELAY);
    });

    // ---------- Enlarged view ----------
    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox testimonial-lightbox';
    lightbox.innerHTML = '<img src="" alt="">';
    document.body.appendChild(lightbox);
    const lightboxImg = lightbox.querySelector('img');

    function openLightbox(item, alt) {
        lightboxImg.src = PICS_DIR + item.file;
        lightboxImg.alt = alt;
        // Small screenshots are enlarged up to 2x - beyond that they just blur
        lightboxImg.style.maxWidth = `${Math.min(700, item.width * 2)}px`;
        lightbox.scrollTop = 0;
        lightbox.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        lightbox.classList.remove('open');
        document.body.style.overflow = '';
    }

    wall.addEventListener('click', (e) => {
        const card = e.target.closest('.testimonial-card');
        if (!card) return;
        const index = Number(card.dataset.index);
        openLightbox(testimonials[index], `המלצה ${index + 1}`);
    });

    lightbox.addEventListener('click', closeLightbox);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeLightbox();
    });
});
