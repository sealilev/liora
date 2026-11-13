#!/usr/bin/env python3
"""Prepare testimonial screenshots for the "wall" on personal-apps.html.

Takes the raw screenshots from projectech/testimonials-raw/ (private,
gitignored), crops away phone chrome and identifying details (phone numbers,
email headers), shrinks them to web size, and writes the public copies to
projectech/pics/testimonials/testimonial-NN.(png|jpg), plus the list the
page reads (projectech/data/testimonials.json).

    python3 projectech/tools/prepare_testimonials.py

To add a testimonial: put the screenshot in testimonials-raw/, add a line to
TESTIMONIALS below, and run this again. Order here = number in the file name.

Needs Pillow:  python3 -m pip install --user Pillow
"""

import json
import subprocess
import tempfile
from pathlib import Path

from PIL import Image, ImageOps

PROJECTECH_DIR = Path(__file__).resolve().parent.parent
RAW_DIR = PROJECTECH_DIR / 'testimonials-raw'
OUT_DIR = PROJECTECH_DIR / 'pics' / 'testimonials'
JSON_PATH = PROJECTECH_DIR / 'data' / 'testimonials.json'

MAX_WIDTH = 900
JPEG_QUALITY = 82

# Each entry: (source, crop) or a list of them to stack vertically into one
# image (an email that was captured as two screenshots).
# crop = (left, top, right, bottom) in source pixels, None = whole image.
# 'photo' entries are saved as JPEG, everything else as a palette PNG
# (much smaller for screenshots of text).
TESTIMONIALS = [
    {'src': 'john-bryce-1.png'},
    {'src': 'IMG_3549.jpg', 'photo': True},
    {'src': 'Screen Shot 2020-03-25 at 13.15.26.png'},
    # SMS: cropped to the messages only - the header shows a phone number
    {'src': 'המלצה.png', 'crop': (0, 272, 750, 745)},
    {'src': 'Screen Shot 2020-01-19 at 08.00.10.png'},
    {'src': 'Screen Shot 2017-08-19 at 12.44.35.png'},
    {'src': 'john-bryce-2.png'},
    {'src': 'IMG_5826.jpg', 'photo': True},
    {'src': 'Screen Shot 2021-01-03 at 06.20.54.png'},
    # Email in two screenshots: mail header (recipient names) and toolbars cropped
    {'stack': [('IMG_1924.jpg', (0, 352, 750, 1240)), ('IMG_1925.jpg', (0, 630, 750, 1215))]},
    {'src': 'Screen Shot 2020-01-22 at 20.05.27.png'},
    {'src': 'Screen Shot 2019-07-31 at 16.35.33.png'},
    {'src': 'מכתב תודה.pdf'},
    {'src': 'john-bryce-3.png'},
    {'src': 'Screen Shot 2017-07-13 at 13.01.58.png'},
    {'src': 'IMG_5825.jpg', 'photo': True},
    {'src': 'Screen Shot 2020-03-25 at 13.16.04.png'},
    # Feedback email: status bar (sender name behind it) and toolbar cropped
    {'src': 'IMG_8812.jpg', 'crop': (0, 115, 640, 850)},
    {'src': 'Screen Shot 2020-01-22 at 20.04.38.png'},
    {'src': 'Screen Shot 2017-08-19 at 12.49.34.png'},
    {'src': 'Screen Shot 2020-01-19 at 09.24.17.png', 'photo': True},
    # Cropped above the "Type a message" box
    {'src': 'Screen Shot 2020-03-25 at 13.16.12.png', 'crop': (0, 0, 496, 112)},
    {'src': 'מחזור 15.jpeg', 'photo': True},
]


def load(src):
    path = RAW_DIR / src
    if path.suffix.lower() == '.pdf':
        # Quick Look renders the PDF sharply at the size we ask for
        with tempfile.TemporaryDirectory() as tmp:
            subprocess.run(['qlmanage', '-t', '-s', '1600', '-o', tmp, str(path)],
                           check=True, capture_output=True)
            return Image.open(next(Path(tmp).glob('*.png'))).convert('RGB')
    return ImageOps.exif_transpose(Image.open(path)).convert('RGB')


def build(entry):
    parts = entry.get('stack') or [(entry['src'], entry.get('crop'))]
    images = []
    for src, crop in parts:
        img = load(src)
        images.append(img.crop(crop) if crop else img)
    if len(images) == 1:
        img = images[0]
    else:
        img = Image.new('RGB', (images[0].width, sum(i.height for i in images)), 'white')
        y = 0
        for part in images:
            img.paste(part, (0, y))
            y += part.height
    if img.width > MAX_WIDTH:
        img = img.resize((MAX_WIDTH, round(img.height * MAX_WIDTH / img.width)), Image.LANCZOS)
    return img


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for old in OUT_DIR.glob('testimonial-*'):
        old.unlink()

    listing = []
    for n, entry in enumerate(TESTIMONIALS, 1):
        img = build(entry)
        if entry.get('photo'):
            dest = OUT_DIR / f'testimonial-{n:02d}.jpg'
            img.save(dest, 'JPEG', quality=JPEG_QUALITY, optimize=True)
        else:
            dest = OUT_DIR / f'testimonial-{n:02d}.png'
            img.quantize(256, method=Image.MEDIANCUT, dither=Image.NONE).save(dest, 'PNG', optimize=True)
        listing.append({'file': dest.name, 'width': img.width, 'height': img.height})
        print(f'{dest.name}  {img.width}x{img.height}  {dest.stat().st_size // 1024} KB')

    JSON_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(JSON_PATH, 'w', encoding='utf-8') as f:
        json.dump(listing, f, indent=2)
    print(f'Wrote {len(listing)} testimonials to data/{JSON_PATH.name}')


if __name__ == '__main__':
    main()
