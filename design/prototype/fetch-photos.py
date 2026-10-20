"""Download each centre's NEA photo (the closures CSV `photourl` column) into out/photos/<id>.jpg.

Photos stay out of git: the licence for the images themselves is unverified.
Resizing uses macOS `sips`; elsewhere the originals are kept as downloaded.
"""
import csv, json, pathlib, shutil, subprocess, urllib.request

here = pathlib.Path(__file__).resolve().parent
rows = {r['name'].strip(): r['photourl'].strip() for r in csv.DictReader(open(here.parent.parent / 'scripts/fixtures/closures-2026-10-20.csv'))}
data = json.loads((here / 'out/data.js').read_text().strip()[len('window.DATA = '):].rstrip(';'))
centres = {c['id']: c['name'] for day in data.values() for c in day}
dest = here / 'out/photos'
dest.mkdir(parents=True, exist_ok=True)
for cid, name in centres.items():
    path = dest / f'{cid}.jpg'
    if path.exists():
        continue
    req = urllib.request.Request(rows[name].replace('http://', 'https://'), headers={'User-Agent': 'Mozilla/5.0'})
    raw = dest / f'{cid}.orig'
    raw.write_bytes(urllib.request.urlopen(req, timeout=30).read())
    if shutil.which('sips'):
        subprocess.run(['sips', '-s', 'format', 'jpeg', '-s', 'formatOptions', '55', '-Z', '520', str(raw), '--out', str(path)], check=True, capture_output=True)
        raw.unlink()
    else:
        raw.rename(path)
print(len(list(dest.glob('*.jpg'))), 'photos in', dest)
