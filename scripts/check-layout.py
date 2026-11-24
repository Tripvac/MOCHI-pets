"""Validate actual Noto Sans Cyrillic advances in the responsive control layouts.
This is a metric check, not a browser/device visual test.
"""
from PIL import ImageFont
from pathlib import Path
root = Path(__file__).resolve().parent.parent
regular = lambda size: ImageFont.truetype(str(root/'public/fonts/noto-sans.ttf'), size)
bold = lambda size: ImageFont.truetype(str(root/'public/fonts/noto-sans-bold.ttf'), size)
for width in [260, 280, 320, 360, 375, 390, 400, 414, 430, 480, 600]:
    narrow = width < 360
    inset = 11 if narrow else 15
    gap = 5 if narrow else 8
    pad = 5 if narrow else 8
    available = ((width - 2*inset - 2*gap)/3) - 2*pad - 4
    value = bold(14).getlength('100') + bold(12).getlength('%')
    for label in ['Еда', 'Сон', 'Игры']:
        text = regular(14).getlength(label)
        needed = max(text, value) if width < 320 else text + value + (20 if width >= 400 else 4)
        assert needed <= available + .2, (width, label, needed, available)
    care_inset = 10 if narrow else 15
    care_padding = 6 if narrow else 8
    care_gap = 4 if narrow else 7
    count = 2 if width < 320 else 4
    button = (width - care_inset*2 - care_padding*2 - 4 - care_gap*(count-1))/count
    for label in ['Кормить', 'Играть', 'Спать', 'Будить', 'Гладить']:
        needed = regular(14).getlength(label)
        assert needed <= button-6+.2, (width, label, needed, button-6)
# The landscape care cluster has two columns, each at least 79px wide.
for label in ['Кормить', 'Играть', 'Спать', 'Будить', 'Гладить']:
    assert regular(14).getlength(label) <= 73
print('Noto Sans status and care labels fit 11 widths (260–600px), plus landscape controls.')
