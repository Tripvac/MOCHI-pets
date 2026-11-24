"""Local OFL-compatible bitmap derivative, renamed Mochi Pixel.
Builds crisp rectangular outlines with Cyrillic from the bundled Noto Sans.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen
root=Path(__file__).resolve().parent.parent
font=ImageFont.truetype(str(root/'public/fonts/noto-sans.ttf'),13)
chars=''.join(chr(i) for i in range(32,127))+''.join(chr(i) for i in range(0x400,0x500))+'…•—–♡♥↗×°₸₽✓'
chars=''.join(dict.fromkeys(chars));glyphs=['.notdef']+[f'u{ord(c):04X}' for c in chars]
fb=FontBuilder(1600,isTTF=True);fb.setupGlyphOrder(glyphs);cmap={};out={};metrics={}
for c,name in [('?', '.notdef')]+[(c,f'u{ord(c):04X}') for c in chars]:
 im=Image.new('L',(28,25));draw=ImageDraw.Draw(im);draw.text((2,18),c,font=font,fill=255,anchor='ls')
 pen=TTGlyphPen(None)
 for y in range(25):
  x=0
  while x<28:
   if im.getpixel((x,y))<118:x+=1;continue
   start=x
   while x<28 and im.getpixel((x,y))>=118:x+=1
   x0=(start-2)*100;x1=(x-2)*100;y0=(18-y)*100;y1=y0-100
   pen.moveTo((x0,y1));pen.lineTo((x1,y1));pen.lineTo((x1,y0));pen.lineTo((x0,y0));pen.closePath()
 out[name]=pen.glyph();metrics[name]=(max(4,round(font.getlength(c))+1)*100,0)
 if name!='.notdef':cmap[ord(c)]=name
fb.setupCharacterMap(cmap);fb.setupGlyf(out);fb.setupHorizontalMetrics(metrics);fb.setupHorizontalHeader(ascent=1500,descent=-400)
fb.setupNameTable({'familyName':'Mochi Pixel','styleName':'Regular','uniqueFontIdentifier':'MochiPixel-Regular-v1','fullName':'Mochi Pixel Regular','psName':'MochiPixel-Regular','version':'Version 1.0','copyright':'Bitmap derivative of Noto Sans. Licensed under SIL Open Font License 1.1.'})
fb.setupOS2(sTypoAscender=1500,sTypoDescender=-400,usWinAscent=1700,usWinDescent=500,sxHeight=700,sCapHeight=1000);fb.setupPost();fb.setupMaxp()
fb.save(str(root/'public/fonts/mochi-pixel.ttf'));print('Pixel font:',len(cmap),'characters')
