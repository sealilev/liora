#!/usr/bin/env python3
"""Bake the "© Sea++ Liora Levi" watermark into catalog photos.

Takes the clean original from photography/originals/<name>.png (private,
gitignored), resizes it to the site width, stamps the watermark diagonally
across the center, and saves the public copy as a JPEG with an embedded
sRGB profile (untagged JPEGs looked washed out in some browsers) into
photography/pics/<category folder>/<name>.jpg, using the category from
photos.csv.

    python3 photography/tools/bake_watermark.py "שם תמונה" ["שם נוסף" ...]
    python3 photography/tools/bake_watermark.py --all

Then run csv_to_photos_json.py so photos.json picks the photos up.

Needs Pillow:  python3 -m pip install --user Pillow
"""

import argparse
import io
import sys
from pathlib import Path

from PIL import Image, ImageCms, ImageDraw, ImageFont

sys.path.insert(0, str(Path(__file__).resolve().parent))
from csv_to_photos_json import PHOTOGRAPHY_DIR, PICS_DIR, category_folder, read_active_rows  # noqa: E402

ORIGINALS_DIR = PHOTOGRAPHY_DIR / 'originals'

# Plain Latin text on purpose: Pillow has no RTL shaping, so Hebrew came out reversed.
WATERMARK_TEXT = '© Sea++ Liora Levi'
WATERMARK_OPACITY = 0.15
WATERMARK_ANGLE = 30          # degrees, rising left to right
WATERMARK_FONT_RATIO = 0.045  # font size as a fraction of image width
FONT_PATHS = [
    '/System/Library/Fonts/Supplemental/Arial.ttf',
    '/System/Library/Fonts/Helvetica.ttc',
]

TARGET_WIDTH = 1600
JPEG_QUALITY = 80


def load_font(size):
    for path in FONT_PATHS:
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def watermark(img):
    """Return img with the watermark composited over its center."""
    img = img.convert('RGBA')
    font = load_font(round(img.width * WATERMARK_FONT_RATIO))

    left, top, right, bottom = font.getbbox(WATERMARK_TEXT)
    text_layer = Image.new('RGBA', (right - left, bottom - top), (255, 255, 255, 0))
    alpha = round(255 * WATERMARK_OPACITY)
    ImageDraw.Draw(text_layer).text((-left, -top), WATERMARK_TEXT, font=font, fill=(255, 255, 255, alpha))
    text_layer = text_layer.rotate(WATERMARK_ANGLE, expand=True, resample=Image.BICUBIC)

    x = (img.width - text_layer.width) // 2
    y = (img.height - text_layer.height) // 2
    img.alpha_composite(text_layer, (x, y))
    return img.convert('RGB')


def bake(src, dest, width=TARGET_WIDTH):
    img = Image.open(src)
    height = round(img.height * width / img.width)
    img = img.convert('RGB').resize((width, height), Image.LANCZOS)
    img = watermark(img)

    srgb = ImageCms.ImageCmsProfile(ImageCms.createProfile('sRGB')).tobytes()
    dest.parent.mkdir(parents=True, exist_ok=True)
    img.save(dest, 'JPEG', quality=JPEG_QUALITY, optimize=True, icc_profile=srgb)
    print(f'Baked {dest.parent.name}/{dest.name} ({dest.stat().st_size // 1024} KB)')


def main():
    parser = argparse.ArgumentParser(description='Bake the watermark into catalog photos.')
    parser.add_argument('names', nargs='*', help='photo names as written in photos.csv')
    parser.add_argument('--all', action='store_true', help='re-bake every active photo in photos.csv')
    args = parser.parse_args()
    if not args.names and not args.all:
        parser.error('give one or more photo names, or --all')

    rows = {row['שם תמונה'].strip(): row['קטגוריה'].strip() for row in read_active_rows()}
    names = list(rows) if args.all else args.names

    failed = False
    for name in names:
        if name not in rows:
            print(f'ERROR: "{name}" is not an active row in photos.csv', file=sys.stderr)
            failed = True
            continue
        mapping = category_folder(rows[name])
        if mapping is None:
            print(f'ERROR: "{name}" has unknown category "{rows[name]}"', file=sys.stderr)
            failed = True
            continue
        src = ORIGINALS_DIR / f'{name}.png'
        if not src.exists():
            print(f'ERROR: no clean original at originals/{name}.png', file=sys.stderr)
            failed = True
            continue
        bake(src, PICS_DIR / mapping[0] / f'{name}.jpg')

    sys.exit(1 if failed else 0)


if __name__ == '__main__':
    main()
