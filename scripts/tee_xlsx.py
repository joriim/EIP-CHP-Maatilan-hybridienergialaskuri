"""Make the macro-free .xlsx variant from the public .xlsm (same formulas and cached results).

Käyttö: python scripts/tee_xlsx.py laskuri/Maatilan_hybridienergialaskuri.xlsm laskuri/Maatilan_hybridienergialaskuri.xlsx
Poistaa makron ja optimointipainikkeen; kaavat ja tallennetut tulokset säilyvät.
"""
import re, sys, zipfile
from xml.sax.saxutils import escape

src, dst = sys.argv[1:3]
zin = zipfile.ZipFile(src)
DROP = {'xl/vbaProject.bin', 'xl/worksheets/_rels/sheet2.xml.rels', 'xl/drawings/drawing1.xml',
        'xl/drawings/vmlDrawing1.vml', 'xl/ctrlProps/ctrlProp1.xml'}
zout = zipfile.ZipFile(dst, 'w', zipfile.ZIP_DEFLATED)
for info in zin.infolist():
    if info.filename in DROP:
        continue
    d = zin.read(info.filename)
    if info.filename == '[Content_Types].xml':
        s = d.decode('utf-8')
        s = s.replace('<Default Extension="bin" ContentType="application/vnd.ms-office.vbaProject"/>', '')
        s = s.replace('application/vnd.ms-excel.sheet.macroEnabled.main+xml',
                      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml')
        for p in ['/xl/drawings/drawing1.xml', '/xl/ctrlProps/ctrlProp1.xml']:
            s, k = re.subn(r'<Override PartName="%s" [^>]*/>' % re.escape(p), '', s)
            assert k == 1, p
        assert 'vbaProject' not in s and 'macroEnabled' not in s
        d = s.encode('utf-8')
    elif info.filename == 'xl/_rels/workbook.xml.rels':
        s, k = re.subn(r'<Relationship Id="rId\d+" Type="[^"]*vbaProject" Target="vbaProject.bin"/>', '', d.decode('utf-8'))
        assert k == 1
        d = s.encode('utf-8')
    elif info.filename == 'xl/worksheets/sheet2.xml':
        s = d.decode('utf-8')
        s = s.replace('<drawing r:id="rId1"/><legacyDrawing r:id="rId2"/>', '')
        s, k = re.subn(r'<mc:AlternateContent xmlns:mc="[^"]*"><mc:Choice Requires="x14"><controls>.*?</controls></mc:Choice></mc:AlternateContent>', '', s, flags=re.S)
        assert k == 1 and 'r:id=' not in s
        txt = ('Haku käy läpi ehdokasarvot teknologia kerrallaan (koordinaattihaku). Haku vaatii makroversion '
               'Maatilan_hybridienergialaskuri.xlsm. Tässä makrottomassa versiossa voit vertailla kokoonpanoja '
               'muuttamalla Ohjauspaneelin rivejä 9–15 käsin.')
        s, k = re.subn(r'<c r="B3"([^>]*?) t="inlineStr"><is><t xml:space="preserve">[^<]*</t></is></c>',
                       lambda m: '<c r="B3"%s t="inlineStr"><is><t xml:space="preserve">%s</t></is></c>' % (m.group(1), escape(txt)), s)
        assert k == 1
        d = s.encode('utf-8')
    zi = zipfile.ZipInfo(info.filename, date_time=info.date_time)
    zi.compress_type = zipfile.ZIP_DEFLATED
    zout.writestr(zi, d)
zout.close()
print('written', dst)
