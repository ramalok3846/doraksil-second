#!/usr/bin/env python3
"""빌드 도장: 앱 파일 내용으로 빌드 해시를 만들어 index.html 메타 · sw.js 캐시 이름 · version.json 에 넣어요.
사용:  python3 tools/stamp.py [버전 예: 1.0.1]   (앱 폴더 = 이 스크립트의 상위 폴더)
앱을 고친 뒤 커밋 전에 한 번 실행하세요. 내용이 같으면 해시도 같아서 불필요한 '업데이트' 알림이 안 떠요."""
import hashlib, json, re, sys, datetime, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
idx, sw = root/'index.html', root/'sw.js'
ver = sys.argv[1] if len(sys.argv) > 1 else None
t = idx.read_text(encoding='utf-8')
if ver:
    t = re.sub(r'(name="pq-ver" content=")[^"]*', r'\g<1>Doraksil v.%s' % ver, t)
m = re.search(r'name="pq-ver" content="Doraksil v\.([^"]+)"', t); ver = m.group(1)
norm = re.sub(r'(name="pq-build" content=")[^"]*', r'\1X', t)
norm = re.sub(r'(name="pq-date" content=")[^"]*', r'\1X', norm)
s = sw.read_text(encoding='utf-8')
snorm = re.sub(r"const V='dr-v'\+'[^']*'", "const V='X'", s)
h = hashlib.sha256((norm + snorm + (root/'manifest.webmanifest').read_text(encoding='utf-8')).encode()).hexdigest()[:12]
kst = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=9)
date = kst.strftime('%Y-%m-%d %H:%M KST')
old = json.loads((root/'version.json').read_text()) if (root/'version.json').exists() else {}
if old.get('build') == h and old.get('ver') == 'Doraksil v.' + ver:
    date = old.get('date', date)
t = re.sub(r'(name="pq-build" content=")[^"]*', r'\g<1>' + h, t)
t = re.sub(r'(name="pq-date" content=")[^"]*', r'\g<1>' + date, t)
idx.write_text(t, encoding='utf-8')
sw.write_text(re.sub(r"const V='dr-v'\+'[^']*'", "const V='dr-v'+'%s'" % h, s), encoding='utf-8')
(root/'version.json').write_text(json.dumps({'build': h, 'ver': 'Doraksil v.' + ver, 'date': date}, ensure_ascii=False), encoding='utf-8')
print('build', h, 'Doraksil v.' + ver, date)
