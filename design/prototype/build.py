import pathlib

here = pathlib.Path(__file__).resolve().parent
out = here / 'out'
tpl = (here / 'page.html').read_text()
data = (out / 'data.js').read_text().strip()
assert data.startswith('window.DATA = '), 'run make-data.ts first'
logo = (here / 'lockup.svg').read_text().strip()
logo = logo.replace(' xmlns="http://www.w3.org/2000/svg"', '').replace('height="40"', 'class="lockup" height="38" width="216"', 1)
page = tpl.replace('/*@DATA@*/', data).replace('<!--@LOGO@-->', logo)
assert '@DATA@' not in page and '@LOGO@' not in page
(out / 'uncle-says-closed.html').write_text(page)
# Local preview needs a document skeleton; the artifact host adds its own.
(out / 'preview.html').write_text('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>' + page + '</body></html>')
print(out / 'uncle-says-closed.html', len(page.encode()))
