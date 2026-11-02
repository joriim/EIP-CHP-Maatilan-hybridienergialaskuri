"""Independent evaluator for this workbook's scalar formula subset.

This is a regression aid, not Excel or a general spreadsheet engine. Unsupported
functions fail explicitly. It checks actual saved formula text, not sim outputs.
Use: python malli/excel_tarkistus.py laskuri/Maatilan_hybridienergialaskuri.xlsx
"""
import re,sys,math,statistics,zipfile,json,xml.etree.ElementTree as ET
from pathlib import Path
NS='http://schemas.openxmlformats.org/spreadsheetml/2006/main';Q=lambda x:'{'+NS+'}'+x
ET.register_namespace('',NS)
ET.register_namespace('r','http://schemas.openxmlformats.org/officeDocument/2006/relationships')
TOKEN=re.compile(r'\s*(?:((?:\d+(?:\.\d*)?|\.\d+)(?:[Ee][+-]?\d+)?)|("(?:[^"]|"")*")|((?:(?:\'(?:[^\']|\'\')+\'|[\w]+)!)?\$?[A-Z]{1,3}\$?\d+\b)|([\w.]+)|(<[=>]|>=|<>|[=<>+*/^&(),:%-]))',re.UNICODE)


def colindex(s):
    n=0
    for c in s:n=n*26+ord(c)-64
    return n


def colname(n):
    out=''
    while n:n,r=divmod(n-1,26);out=chr(65+r)+out
    return out


class Parser:
    def __init__(self,s):
        self.ts=[];p=0
        while p<len(s):
            m=TOKEN.match(s,p)
            if not m:raise ValueError('Unsupported formula token: '+s[p:p+60])
            p=m.end();self.ts.append(next((i+1,x)for i,x in enumerate(m.groups())if x is not None))
        self.i=0
    def peek(self):return self.ts[self.i][1] if self.i<len(self.ts)else ''
    def pop(self):v=self.ts[self.i];self.i+=1;return v
    def expr(self,prec=0):
        typ,t=self.pop()
        if t in ['+','-']:a=('unary',t,self.expr(6))
        elif t=='(':
            a=self.expr();assert self.pop()[1]==')'
        elif typ==1:a=('value',float(t))
        elif typ==2:a=('value',t[1:-1].replace('""','"'))
        elif typ==3:a=('ref',t.replace('$',''))
        elif typ==4 and self.peek()=='(':
            self.pop();args=[]
            if self.peek()!=')':
                while True:
                    args.append(self.expr())
                    if self.peek()!=',':break
                    self.pop()
            assert self.pop()[1]==')';a=('call',t.upper().replace('_XLFN.',''),args)
        elif t.upper()in ['TRUE','FALSE']:a=('value',t.upper()=='TRUE')
        else:raise ValueError('Unsupported expression '+t)
        precedence={'=':1,'<>':1,'<':1,'>':1,'<=':1,'>=':1,'&':2,'+':3,'-':3,'*':4,'/':4,'^':5,':':7,'%':8}
        while self.peek()in precedence and precedence[self.peek()]>=prec:
            op=self.pop()[1]
            if op=='%':a=('bin','/',a,('value',100.));continue
            right=self.expr(precedence[op]+(0 if op=='^'else 1));a=('bin',op,a,right)
        return a
    def parse(self):
        out=self.expr()
        if self.i!=len(self.ts):raise ValueError('Trailing tokens '+str(self.ts[self.i:]))
        return out


REF=re.compile(r'(\$?)([A-Z]{1,3})(\$?)(\d+)\b')


def shift(formula,dr,dc):
    """Translate a shared-formula master to a child cell (relative refs only)."""
    out=[];p=0
    while p<len(formula):
        m=TOKEN.match(formula,p)
        if not m:raise ValueError('Unsupported formula token: '+formula[p:p+60])
        t=m.group(0)
        if m.group(3):
            sheet,_,ref=m.group(3).rpartition('!')
            r=REF.fullmatch(ref)
            col=r[2] if r[1] else colname(colindex(r[2])+dc)
            row=r[4] if r[3] else str(int(r[4])+dr)
            t=t[:len(t)-len(m.group(3))]+(sheet+'!' if sheet else '')+r[1]+col+r[3]+row
        out.append(t);p=m.end()
    return ''.join(out)


class Area:
    def __init__(self,model,sheet,start,end):
        self.m=model;self.s=sheet
        a=re.fullmatch(r'([A-Z]+)(\d+)',start);b=re.fullmatch(r'([A-Z]+)(\d+)',end)
        self.c1=colindex(a[1]);self.c2=colindex(b[1]);self.r1=int(a[2]);self.r2=int(b[2])
    def __iter__(self):
        for r in range(self.r1,self.r2+1):
            for c in range(self.c1,self.c2+1):yield self.m.get(self.s,colname(c)+str(r))
    def at(self,row,col=1):return self.m.get(self.s,colname(self.c1+int(col)-1)+str(self.r1+int(row)-1))


def num(x):
    # Empty cell counts as zero; an empty-string result gives #VALUE! as in Excel.
    if x is None:return 0.
    if x=='':raise ValueError('#VALUE! empty string in arithmetic')
    if isinstance(x,(int,float,bool)):return x
    raise ValueError('Non-numeric arithmetic: '+repr(x))


def txt(x):
    if x is None:return ''
    if isinstance(x,float)and x.is_integer():return str(int(x))
    return str(x)


def flat(xs):
    for x in xs:
        if isinstance(x,Area):yield from x
        else:yield x


def criterion(x,c):
    if not isinstance(c,str):return x==c
    m=re.match(r'^(<>|>=|<=|>|<|=)?(.*)$',c);op=m[1]or'=';v=m[2]
    try:v=float(v);a=num(x)
    except (ValueError,TypeError):a=txt(x).casefold();v=v.casefold()
    return {'=':lambda:a==v,'<>':lambda:a!=v,'>':lambda:a>v,'<':lambda:a<v,'>=':lambda:a>=v,'<=':lambda:a<=v}[op]()


class Model:
    def __init__(self,path):
        self.path=Path(path);z=zipfile.ZipFile(path);self.parts={n:z.read(n)for n in z.namelist()}
        self.shared=[''.join(x.itertext())for x in ET.fromstring(self.parts['xl/sharedStrings.xml'])]
        book=ET.fromstring(self.parts['xl/workbook.xml']);self.names=[x.attrib['name']for x in book.find(Q('sheets'))]
        self.xml={};self.cells={};self.formulas={};self.cache={};self.busy=set();self.asts={}
        for i,name in enumerate(self.names,1):
            a=ET.fromstring(self.parts[f'xl/worksheets/sheet{i}.xml']);self.xml[name]=a;masters={}
            for row in a.find(Q('sheetData')):
                for c in row:
                    key=(name,c.attrib['r']);self.cells[key]=c;f=c.find(Q('f'))
                    if f is None:self.cache[key]=self.read(c);continue
                    if f.attrib.get('t')=='shared':
                        if f.text:masters[f.attrib['si']]=(c.attrib['r'],f.text)
                        else:
                            at,text=masters[f.attrib['si']]
                            m0=re.fullmatch(r'([A-Z]+)(\d+)',at);m1=re.fullmatch(r'([A-Z]+)(\d+)',c.attrib['r'])
                            self.formulas[key]=shift(text,int(m1[2])-int(m0[2]),colindex(m1[1])-colindex(m0[1]));continue
                    self.formulas[key]=f.text or ''
    def read(self,c):
        t=c.attrib.get('t');v=c.find(Q('v'))
        if t=='inlineStr':return ''.join(c.find(Q('is')).itertext())
        if v is None or v.text is None:return None
        if t=='s':return self.shared[int(v.text)]
        if t in ['str','e']:return v.text
        if t=='b':return v.text=='1'
        return float(v.text)
    def split(self,r,s):
        if '!'in r:
            s,r=r.rsplit('!',1);s=s.strip("'").replace("''", "'")
        return s,r
    def get(self,s,a):
        k=(s,a)
        if k in self.cache:return self.cache[k]
        if k not in self.formulas:return None
        if k in self.busy:raise ValueError('Circular reference '+str(k))
        self.busy.add(k)
        try:
            ast=self.asts.get(k)
            if ast is None:ast=Parser(self.formulas[k]).parse();self.asts[k]=ast
            v=self.ev(ast,s);self.cache[k]=v;return v
        except Exception as e:raise ValueError(f'{s}!{a}: {self.formulas[k]} -> {e}')from e
        finally:self.busy.discard(k)
    def ev(self,n,s):
        kind=n[0]
        if kind=='value':return n[1]
        if kind=='ref':return self.get(*self.split(n[1],s))
        if kind=='unary':return num(self.ev(n[2],s))*(1 if n[1]=='+'else -1)
        if kind=='bin':
            op=n[1]
            if op==':':
                ls,a=self.split(n[2][1],s)
                if n[3][0]=='call'and n[3][1]=='INDEX':
                    ar=self.ev(n[3][2][0],s);row=int(self.ev(n[3][2][1],s));rs=ar.s;b=colname(ar.c1)+str(ar.r1+row-1)
                else:rs,b=self.split(n[3][1],ls)
                assert ls==rs;return Area(self,ls,a,b)
            a=self.ev(n[2],s);b=self.ev(n[3],s)
            if op=='&':return txt(a)+txt(b)
            if op in ['=','<>','<','>','<=','>=']:
                if isinstance(a,str)and isinstance(b,str):a,b=a.casefold(),b.casefold()
                elif a is None:a=0
                elif b is None:b=0
                return {'=':lambda:a==b,'<>':lambda:a!=b,'<':lambda:a<b,'>':lambda:a>b,'<=':lambda:a<=b,'>=':lambda:a>=b}[op]()
            a,b=num(a),num(b)
            return {'+':lambda:a+b,'-':lambda:a-b,'*':lambda:a*b,'/':lambda:a/b,'^':lambda:a**b}[op]()
        name,args=n[1],n[2]
        if name=='IF':return self.ev(args[1]if self.ev(args[0],s)else(args[2]if len(args)>2 else('value',False)),s)
        if name=='IFERROR':
            try:return self.ev(args[0],s)
            except (ValueError,ZeroDivisionError):return self.ev(args[1],s)
        if name=='ISNUMBER':
            try:x=self.ev(args[0],s)
            except (ValueError,ZeroDivisionError):return False
            return isinstance(x,(int,float))and not isinstance(x,bool)
        if name=='SEARCH':
            a,b=[txt(self.ev(x,s)).casefold()for x in args[:2]];p=b.find(a)
            # Represent expected #VALUE as an error value recognized by ISNUMBER.
            return p+1 if p>=0 else '#VALUE!'
        xs=[self.ev(x,s)for x in args]
        if name=='AND':return all(xs)
        if name=='OR':return any(xs)
        if name=='ABS':return abs(num(xs[0]))
        if name=='INT':return math.floor(num(xs[0]))
        if name=='ROUNDUP':return math.copysign(math.ceil(abs(num(xs[0]))*10**num(xs[1]))/10**num(xs[1]),num(xs[0]))
        if name=='PV':
            r,n,p=map(num,xs[:3]);return -p*((1-(1+r)**-n)/r if r else n)
        if name=='TEXT':return f'{num(xs[0]):.{len(xs[1].split(".")[1])if "."in xs[1]else 0}f}'
        if name=='INDEX':
            a=xs[0]
            if len(xs)==2 and a.r1==a.r2:return a.at(1,xs[1])
            if len(xs)>2 and int(xs[1])==0:
                c=colname(a.c1+int(xs[2])-1);return Area(self,a.s,c+str(a.r1),c+str(a.r2))
            return a.at(xs[1],xs[2]if len(xs)>2 else 1)
        if name=='HYPERLINK':return xs[1]if len(xs)>1 else xs[0]
        if name=='COUNTBLANK':return sum(1 for x in xs[0] if x is None or x=='')
        if name=='COUNTA':return sum(1 for x in flat(xs) if x is not None and x!='')
        if name=='RANK':return 1+sum(1 for x in xs[1] if isinstance(x,(int,float))and not isinstance(x,bool)and x>num(xs[0]))
        if name=='FIXED':return f'{num(xs[0]):.{int(num(xs[1]))if len(xs)>1 else 2}f}'
        if name=='ROUND':return round(num(xs[0]),int(num(xs[1])))
        if name=='MATCH':
            target,area=xs[:2];values=list(area);mode=xs[2]if len(xs)>2 else 1
            if mode==0:
                for i,x in enumerate(values):
                    if (txt(x).casefold()==txt(target).casefold())or(x==target):return i+1
                raise ValueError('MATCH key missing '+repr(target))
            return max(i+1 for i,x in enumerate(values)if x<=target)
        if name in ['COUNTIF','COUNTIFS']:
            if name=='COUNTIF':return sum(criterion(x,xs[1])for x in xs[0])
            arrays=[list(xs[i])for i in range(0,len(xs),2)]
            return sum(all(criterion(arrays[j][i],xs[j*2+1])for j in range(len(arrays)))for i in range(len(arrays[0])))
        if name in ['SUMIFS','MAXIFS']:
            vals=list(xs[0]);arrays=[list(xs[i])for i in range(1,len(xs),2)]
            selected=[num(v)for i,v in enumerate(vals)if all(criterion(arrays[j][i],xs[j*2+2])for j in range(len(arrays)))]
            return sum(selected)if name=='SUMIFS'else max(selected,default=0)
        if name=='SUMPRODUCT':
            # Excel treats text (also "") in SUMPRODUCT arrays as zero.
            nz=lambda v:v if isinstance(v,(int,float))and not isinstance(v,bool)else 0.
            return sum(math.prod(nz(v)for v in values)for values in zip(*[list(x)for x in xs]))
        vals=list(flat(xs));numbers=[x for x in vals if isinstance(x,(int,float))and not isinstance(x,bool)]
        if name=='SUM':return sum(numbers)
        if name=='COUNT':return len(numbers)
        if name=='MIN':return min(numbers,default=0)
        if name=='MAX':return max(numbers,default=0)
        if name=='AVERAGE':
            if not numbers:raise ValueError('#DIV/0! AVERAGE of no numbers')
            return sum(numbers)/len(numbers)
        if name=='MEDIAN':return statistics.median(numbers)
        raise ValueError('Unsupported function '+name)
    def calculate(self):
        h='Tuntitase_8760h'
        for r in range(2,8762):
            for c in ['AB','AD','AF','AG','K','L','M','N','O','BR','T','AC','P','R','AH','AU','BA','BH','BI','Q','S','U','AY','X','V','AZ','W','Y','Z','AA','AI','AJ','AK','AL','AM','AN','AV','AW','AX','BB','BC','BD','BE','BF','BG','BP','BQ']:
                self.get(h,c+str(r))
        for k in self.formulas:self.get(*k)
        return self
    def save_caches(self,path=None):
        for key in self.formulas:
            c=self.cells[key];v=self.cache[key]
            for x in list(c):
                if x.tag in [Q('v'),Q('is')]:c.remove(x)
            c.attrib.pop('t',None);x=ET.SubElement(c,Q('v'))
            if isinstance(v,str):c.attrib['t']='str';x.text=v
            elif isinstance(v,bool):c.attrib['t']='b';x.text='1'if v else'0'
            elif v is not None:x.text=repr(v)
        for i,name in enumerate(self.names,1):self.parts[f'xl/worksheets/sheet{i}.xml']=ET.tostring(self.xml[name],encoding='utf-8',xml_declaration=True)
        target=Path(path)if path else self.path
        with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED)as z:
            for name,data in self.parts.items():z.writestr(name,data)


if __name__=='__main__':
    model=Model(sys.argv[1]).calculate();p='Ohjauspaneeli ja Tulokset'
    print(json.dumps({a:model.get(p,a)for a in ['K14','E48','E50','E51','E53','C59','C62','K36']},ensure_ascii=False,indent=2))
