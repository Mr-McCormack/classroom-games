import re, pathlib, sys
src = pathlib.Path(__file__).parent
out = pathlib.Path(sys.argv[1]); out.mkdir(parents=True, exist_ok=True)
SHELL = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<style>
{css}
</style>
</head>
<body>
<div id="setup">
  <h1 class="gtitle"></h1>
  <p id="tagline"></p>
  <div id="fields"></div>
  <button class="big" id="startBtn">Start game</button>
  <button class="ghost" id="resumeBtn" hidden>Resume saved game</button>
  <details class="how" id="how"></details>
</div>
<div id="game" hidden>
  <header><h1 class="gtitle"></h1><button id="undoBtn">↶ Undo</button><button id="newBtn">New game</button></header>
  <div id="banner"></div>
  <div id="buzz"></div>
  <div id="board"></div>
</div>
<script>
{js}
</script>
<script type="module">
{bz}
</script>
</body>
</html>
"""
core_css = (src/'core.css').read_text(); core_js = (src/'core.js').read_text()
bz_js = (src/'firebase.js').read_text() + '\n' + (src/'buzz-teacher.js').read_text()
for name, fname in [l.split() for l in (src/'games.txt').read_text().split('\n') if l.strip()]:
    gjs = (src/f'{name}.js').read_text(); gcss = (src/f'{name}.css').read_text()
    title = re.search(r"title:'([^']+)'", gjs).group(1)
    html = SHELL.replace('{title}', title).replace('{css}', core_css + gcss).replace('{js}', gjs + '\n' + core_js).replace('{bz}', bz_js)
    (out/fname).write_text(html)
    print('built', fname)
# Student buzz page
fb_js = (src/'firebase.js').read_text()
(out/'buzz.html').write_text((src/'buzz-student.html').read_text().replace('{fb}', fb_js))
print('built buzz.html')
