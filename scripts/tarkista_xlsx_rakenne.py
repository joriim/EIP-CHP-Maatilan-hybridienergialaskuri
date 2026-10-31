"""Check style schema order and package XML before shipping this workbook.

This supplements native-application validation; XML well-formedness alone does
not prove Excel compatibility. Usage: python scripts/tarkista_xlsx_rakenne.py PATH
"""
import sys
import zipfile
import xml.etree.ElementTree as ET


def check(path):
    with zipfile.ZipFile(path) as z:
        assert z.testzip() is None, 'ZIP CRC error'
        for name in z.namelist():
            if name.endswith(('.xml', '.rels')):
                ET.fromstring(z.read(name))
        ns='{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'
        styles=ET.fromstring(z.read('xl/styles.xml'))
        order=['numFmts','fonts','fills','borders','cellStyleXfs','cellXfs',
               'cellStyles','dxfs','tableStyles','colors','extLst']
        tags=[x.tag.removeprefix(ns) for x in styles]
        assert [order.index(t) for t in tags]==sorted(order.index(t) for t in tags), tags
        for node in styles:
            if 'count' in node.attrib:
                assert int(node.attrib['count'])==len(node), node.tag
        for tag in ['cellStyleXfs','cellXfs']:
            for style in styles.find(ns+tag):
                for attr,target in [('fontId','fonts'),('fillId','fills'),
                                    ('borderId','borders'),('xfId','cellStyleXfs')]:
                    if attr in style.attrib:
                        assert int(style.attrib[attr])<len(styles.find(ns+target)), (tag,attr)
        errors=[]
        for name in z.namelist():
            if name.startswith('xl/worksheets/') and name.endswith('.xml'):
                sheet=ET.fromstring(z.read(name))
                for cell in sheet.findall('.//'+ns+'c'):
                    if cell.attrib.get('t')=='e':
                        errors.append((name,cell.attrib['r']))
        assert not errors, errors[:20]
    print('ZIP/XML, style order, counts/references and cached error scan passed.')


if __name__=='__main__':check(sys.argv[1])
