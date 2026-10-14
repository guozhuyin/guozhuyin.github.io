import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, readFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {ROOT, loadContent, validate} from '../scripts/content.mjs';
import {build} from '../scripts/build.mjs';
import {startServer} from '../scripts/server.mjs';

test('Public preview returns HTTP 404 for source and editor paths', async () => {
  const server = await startServer({port: 0, editor: false});
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    assert.equal((await fetch(base + '/')).status, 200);
    for (const route of ['/editor', '/editor/', '/editor/index.html', '/content/', '/content/profile.json', '/scripts/build.mjs', '/api/content', '/zh/projects/ai-math/', '/zh/projects/learning-game/', '/en/projects/ai-math/', '/en/projects/learning-game/']) {
      const response = await fetch(base + route);
      assert.equal(response.status, 404, route);
      assert.ok((await response.text()).includes('找不到這個頁面'));
    }
    assert.equal((await fetch(base + '/assets/favicon.svg')).status, 200);
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
});

test('Requested project routes replace the old routes and expose intended public work', async () => {
  const out = await mkdtemp(path.join(tmpdir(), 'zhuyin-routes-'));
  try {
    const data = await loadContent();
    await build({outDir: out, data});
    for (const language of data.languages.filter(row => row.enabled)) {
      for (const oldRoute of ['ai-math', 'learning-game']) {
        await assert.rejects(readFile(path.join(out, language.id, 'projects', oldRoute, 'index.html')), {code: 'ENOENT'});
      }
      for (const requestedRoute of ['mathai', 'bioutopia']) {
        assert.ok((await readFile(path.join(out, language.id, 'projects', requestedRoute, 'index.html'), 'utf8')).includes('<h1>'));
      }
    }
    const math = await readFile(path.join(out, 'zh/projects/mathai/index.html'), 'utf8');
    assert.ok(math.includes('uploads/mathai-interface.png'));
    assert.ok(!math.includes('math-companion-architecture.png'));
    assert.ok(!math.includes('github.com/guozhuyin/mathai'));
    const game = await readFile(path.join(out, 'zh/projects/bioutopia/index.html'), 'utf8');
    assert.ok(game.includes('https://github.com/guozhuyin/BioUtopia'));
    const projects = await readFile(path.join(out, 'zh/projects/index.html'), 'utf8');
    assert.ok(!projects.includes('onclass.mypressonline.com'));
    assert.ok(!projects.includes('其他網站作品'));
    const invalid = structuredClone(data);
    invalid.projects[1].id = 'mathai';
    assert.ok(validate(invalid).some(error => error.includes('不可重複')));
  } finally {
    await rm(out, {recursive: true, force: true});
  }
});

test('Canonical metadata, sitemap and attributed motto use public identity', async () => {
  const out = await mkdtemp(path.join(tmpdir(), 'zhuyin-metadata-'));
  try {
    const data = await loadContent();
    data.profile.fullName.zh = '</script><script>untrusted</script>';
    await build({outDir: out, data});
    const home = await readFile(path.join(out, 'index.html'), 'utf8');
    assert.ok(home.includes('<title>注音｜軟體與互動系統</title>'));
    assert.ok(home.includes('rel="canonical" href="https://guozhuyin.github.io/"'));
    assert.ok(home.includes('hreflang="en" href="https://guozhuyin.github.io/en/"'));
    assert.ok(home.includes('雷軍，小米創辦人'));
    assert.ok(home.includes('class="brand-symbol" aria-hidden="true"'));
    const about = await readFile(path.join(out, 'zh/about/index.html'), 'utf8');
    assert.ok(about.includes('"@type":"ProfilePage"'));
    assert.ok(!about.includes('</script><script>untrusted'));
    const sitemap = await readFile(path.join(out, 'sitemap.xml'), 'utf8');
    assert.ok(sitemap.includes('https://guozhuyin.github.io/zh/projects/mathai/'));
    assert.ok(!sitemap.includes('/dist/'));
    assert.ok(!sitemap.includes('/ai-math/'));
    const editor = await readFile(path.join(ROOT, 'editor/index.html'), 'utf8');
    assert.ok(editor.includes('data-theme-toggle'));
    assert.ok(editor.includes('/assets/site.js'));
  } finally {
    await rm(out, {recursive: true, force: true});
  }
});
