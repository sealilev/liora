#!/usr/bin/env python3
"""Convert photography/data/photos.csv into photography/data/photos.json.

photos.csv is the source of truth for the photography catalog. Run this
after every change to it:

    python3 photography/tools/csv_to_photos_json.py

Rules:
- Only the rows above the first fully empty row are active. Anything below
  it (e.g. the "להתעלם" block) is parked and never published.
- Category is dual-purpose: a number 1-5 puts the photo in that slot of the
  weekly carousel (pics/weekly/); a name puts it in that gallery section.
- A row with a missing or non-numeric price is skipped with a warning
  instead of guessing a price.
- Euro prices are derived from the NIS prices at a fixed peg, not a live rate.
"""

import csv
import json
import sys
from pathlib import Path

PHOTOGRAPHY_DIR = Path(__file__).resolve().parent.parent
CSV_PATH = PHOTOGRAPHY_DIR / 'data' / 'photos.csv'
JSON_PATH = PHOTOGRAPHY_DIR / 'data' / 'photos.json'
PICS_DIR = PHOTOGRAPHY_DIR / 'pics'

NIS_PER_EUR = 4.0

# Hebrew category name -> (folder under pics/, English category name)
CATEGORIES = {
    'עולם הים': ('sea', 'Sea'),
    'ים יבשה': ('coast', 'Coast'),
    'עולם החי': ('animals', 'Animals'),
    'עולם הטעם': ('taste', 'Taste'),
    'עולם היבשה': ('land', 'Land'),
}
WEEKLY_FOLDER = 'weekly'

# CSV column -> JSON field
PRICE_COLUMNS = [
    ('מחיר דיגיטלי אישי', 'priceDigitalPersonal'),
    ('מחיר דיגיטלי מסחרי', 'priceDigitalCommercial'),
    ('מחיר 1015', 'price1015'),
    ('מחיר 1521', 'price1521'),
    ('מחיר 2030', 'price2030'),
    ('מחיר 3040', 'price3040'),
]


def warn(msg):
    print(f'WARNING: {msg}', file=sys.stderr)


def category_folder(category):
    """Return (folder, categoryEn) for a CSV category, or None if unknown."""
    if category.isdigit():
        return WEEKLY_FOLDER, None
    return CATEGORIES.get(category)


def find_image(folder, name):
    """Prefer .jpg (the current format), fall back to any existing extension."""
    for ext in ('.jpg', '.jpeg', '.png'):
        if (PICS_DIR / folder / f'{name}{ext}').exists():
            return f'{folder}/{name}{ext}'
    return None


def convert_row(row):
    name = row['שם תמונה'].strip()
    category = row['קטגוריה'].strip()

    mapping = category_folder(category)
    if mapping is None:
        warn(f'"{name}": unknown category "{category}" - skipped')
        return None
    folder, category_en = mapping

    prices = {}
    for column, field in PRICE_COLUMNS:
        value = row[column].strip()
        try:
            prices[field] = int(value)
        except ValueError:
            warn(f'"{name}": "{column}" is blank or not a number ("{value}") - skipped')
            return None

    file = find_image(folder, name)
    if file is None:
        file = f'{folder}/{name}.jpg'
        warn(f'"{name}": no image at pics/{file} - run bake_watermark.py for it')

    photo = {
        'name': name,
        'nameEn': row['שם באנגלית'].strip(),
        'file': file,
        'category': category,
        'categoryEn': category_en,
    }
    photo.update(prices)
    for _, field in PRICE_COLUMNS:
        photo[f'{field}EUR'] = round(prices[field] / NIS_PER_EUR)
    return photo


def read_active_rows():
    with open(CSV_PATH, encoding='utf-8-sig', newline='') as f:
        for row in csv.DictReader(f):
            if not any((v or '').strip() for v in row.values()):
                break
            yield row


def main():
    photos = [p for p in map(convert_row, read_active_rows()) if p]
    with open(JSON_PATH, 'w', encoding='utf-8') as f:
        json.dump(photos, f, ensure_ascii=False, indent=2)
    print(f'Wrote {len(photos)} photos to {JSON_PATH.relative_to(PHOTOGRAPHY_DIR.parent)}')


if __name__ == '__main__':
    main()
