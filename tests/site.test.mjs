import test from 'node:test';
import http from 'node:http';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile,readdir,stat,cp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {ROOT,loadContent,validate} from '../scripts/content.mjs';
import {build} from '../scripts/build.mjs';

test('Content rejects script links, traversal, and duplicate project addresses',async()=>{
 const source=await loadContent();assert.deepEqual(validate(source),[]);
 for(const bad of ['javascript:alert(1)','//evil.example','uploads/../../secrets']){const data=structuredClone(source);data.profile.github=bad;assert.ok(validate(data).length);}
 const dup=structuredClone(source);dup.projects.push(dup.projects[0]);assert.ok(validate(dup).some(x=>x.includes('重複')));
});

test('Bilingual HTML contains readable math content, escaped input, and working relative links',async()=>{
 const out=await mkdtemp(path.join(tmpdir(),'mypage-build-'));
 try{
  const data=await loadContent();data.profile.name.zh='<script>alert(1)</script>';
  const result=await build({outDir:out,data});assert.equal(result.count,1+data.languages.filter(l=>l.enabled).length*(4+data.projects.length));
  const html=await readFile(path.join(out,'zh/projects/ai-math/index.html'),'utf8');
  assert.ok(html.includes('數學問題解決'));assert.ok(html.includes('<article'));assert.ok(html.includes('我的角色'));assert.ok(!html.includes('<script>alert(1)</script>'));assert.ok(html.includes('&lt;script&gt;'));
  async function walk(dir){const files=[];for(const name of await readdir(dir)){const p=path.join(dir,name);if((await stat(p)).isDirectory())files.push(...await walk(p));else files.push(p);}return files;}
  for(const privatePath of ['editor','content','old','.private','.private-backups'])await assert.rejects(stat(path.join(out,privatePath)));
  for(const file of (await walk(out)).filter(f=>f.endsWith('.html'))){
   const text=await readFile(file,'utf8');
   assert.ok(!/\/mnt\/[a-z]\//.test(text),`${file}: local filesystem path leaked`);
   assert.ok(!/(?:href|src)="http:\/\//.test(text),`${file}: insecure external link`);
   for(const[,ref]of text.matchAll(/(?:href|src)="([^"]+)"/g)){
    if(/^(https?:|mailto:|data:)/.test(ref))continue;
    const [target,fragment]=ref.split('#');
    assert.ok(!target.startsWith('/'),`Root-relative path breaks project hosting: ${ref}`);
    const dest=target?path.resolve(path.dirname(file),target):file;
    assert.ok(dest.startsWith(out),`Path escapes site: ${ref}`);
    assert.ok((await stat(dest)).isFile(),`${file}: ${ref}`);
    if(fragment)assert.ok((await readFile(dest,'utf8')).includes(`id="${fragment}"`),`Missing anchor ${ref}`);
   }
  }
 }finally{await rm(out,{recursive:true,force:true});}
});

test('Education keeps the broader study scope and groups K-12 as optional detail',async()=>{
 const out=await mkdtemp(path.join(tmpdir(),'mypage-education-'));
 try{
  const data=await loadContent();assert.deepEqual(validate(data),[]);await build({outDir:out,data});
  const zh=await readFile(path.join(out,'zh/about/index.html'),'utf8');
  assert.ok(zh.includes('修習網頁建置、程式設計、資料庫、人工智慧、Unity／XR、多媒體與數位學習等課程'));
  assert.ok(zh.includes('CRM、ERP、MIS 的定位與基本用途'));
  assert.ok(zh.includes('<strong>居住地：</strong>新竹，臺灣（中華民國）'));
  assert.ok(zh.includes('國小有了自己的電腦後'));
  assert.ok(zh.includes('高中畢業後，我完成期待已久的單車環島'));
  assert.ok(zh.includes('粘巴達假日學校的竹北樹屋遊戲空間於 2011 年建立'));
  assert.ok(zh.includes('我從 2019 年開始擔任兒童營隊助教'));
  assert.ok(!zh.includes('黏巴達'));
  for(const schoolUrl of ['https://www.lst.ncu.edu.tw/NLT_new/index.php','https://mcma.asia.edu.tw/','https://csie.asia.edu.tw/'])assert.ok(zh.includes(schoolUrl));
  assert.ok(zh.includes('class="education-title-link"'));assert.ok(!zh.includes('education-links'));assert.ok(zh.includes('class="publication-title-link"'));assert.ok(!zh.includes('閱讀論文'));assert.ok(!zh.includes('保留完整教育背景'));assert.ok(!zh.includes('一般內容可切換語言'));assert.ok(!zh.includes('論文題名與作者依原文列示'));
  assert.ok(zh.includes('<details class="early-education-disclosure">'));
  assert.ok(zh.includes('大學以前（K–12）'));for(const school of ['湖口高中','民雄國中','民雄國小'])assert.ok(zh.includes(`<li>${school}</li>`));
  const proofData=structuredClone(data);proofData.education[0].proofTitle={zh:'碩士學位證書',en:'Master diploma'};proofData.education[0].proofImageZh='uploads/master-diploma.png';proofData.education[0].proofImageAlt={zh:'碩士學位證書',en:'Master diploma'};await build({outDir:out,data:proofData});const proofZh=await readFile(path.join(out,'zh/about/index.html'),'utf8');assert.ok(proofZh.includes('碩士學位證書'));assert.ok(proofZh.includes('uploads/master-diploma.png'));assert.ok(proofZh.includes('education-proof'));assert.ok(!proofZh.includes('<details class="proof-disclosure education-proof" open'));
  assert.ok(zh.indexOf('id="project-evidence"')<zh.indexOf('>學歷<'));
  const en=await readFile(path.join(out,'en/about/index.html'),'utf8');assert.ok(en.includes('Before university (K–12)'));assert.ok(en.includes('coursework in web development, programming, databases, artificial intelligence, Unity/XR, multimedia, and digital learning'));
  assert.ok(en.includes('<strong>Residence:</strong> Hsinchu, Taiwan (R.O.C.)'));
  assert.ok(en.includes('was established in Zhubei in 2011'));assert.ok(en.includes('I began assisting at its children’s camps in 2019'));
  const game=await readFile(path.join(out,'zh/projects/learning-game/index.html'),'utf8');
  for(const topic of ['Digital game-based learning','Analogy-based learning','Interdisciplinary learning','Role-playing game'])assert.ok(game.includes(topic));
 }finally{await rm(out,{recursive:true,force:true});}
});

test('WordPress articles provide a curated index of external links',async()=>{
 const out=await mkdtemp(path.join(tmpdir(),'mypage-articles-'));
 try{
  const data=await loadContent();assert.equal(data.articles.length,19);assert.equal(data.articles.filter(item=>item.featured).length,3);await build({outDir:out,data});
  const home=await readFile(path.join(out,'zh/index.html'),'utf8'),writing=await readFile(path.join(out,'zh/writing/index.html'),'utf8');
  assert.equal((home.match(/class="writing-row"/g)||[]).length,3);assert.equal((writing.match(/class="writing-row"/g)||[]).length,3);
  for(const item of data.articles.filter(item=>item.featured))assert.ok(writing.includes(item.url));
  for(const item of data.articles.filter(item=>!item.featured))assert.ok(!writing.includes(item.url));
  assert.ok(writing.includes('文章全文原刊於 WordPress'));
  assert.deepEqual(data.articles.filter(item=>item.featured).map(item=>item.category.zh),['個人故事 · 單車環島','科技觀察 · Android','實作筆記 · Android']);
  assert.ok(home.includes('2019/08/10'));assert.ok(home.includes('系統（ROM）介紹'));assert.ok(home.includes('總結刷機流程'));
  assert.equal(data.resources.at(-1).url,'http://onclass.mypressonline.com/');
  const projects=await readFile(path.join(out,'zh/projects/index.html'),'utf8');
  assert.ok(projects.includes('其他網站作品'));assert.ok(!projects.includes('href="http://'));
 }finally{await rm(out,{recursive:true,force:true});}
});

test('NSTC VR project records development leadership without overstating research authorship',async()=>{
 const out=await mkdtemp(path.join(tmpdir(),'mypage-vr-project-'));
 try{
  const data=await loadContent();await build({outDir:out,data});
  const zh=await readFile(path.join(out,'zh/projects/unity-sustainability/index.html'),'utf8');
  assert.ok(zh.includes('我主導 Unity／VRChat SDK 學習環境開發'));
  assert.ok(zh.includes('一位協作者'));assert.ok(zh.includes('Meta Quest 2'));assert.ok(zh.includes('Acknowledgements'));assert.ok(!zh.includes('不代表'));
  assert.ok(!zh.includes('Unity 開發參與者；負責模組待補充'));
 }finally{await rm(out,{recursive:true,force:true});}
});

test('Removing a project removes its previous generated pages',async()=>{
 const out=await mkdtemp(path.join(tmpdir(),'mypage-clean-'));
 try{const data=await loadContent();await build({outDir:out,data});data.projects=data.projects.slice(1);await build({outDir:out,data});await assert.rejects(stat(path.join(out,'zh/projects/ai-math/index.html')));}finally{await rm(out,{recursive:true,force:true});}
});

test('Certificate language follows Chinese-first with English fallback for other languages',async()=>{
 const out=await mkdtemp(path.join(tmpdir(),'mypage-cert-'));
 try{const data=await loadContent();data.certificates[0].imageZh='uploads/chinese.png';data.certificates[0].imageEn='uploads/english.png';await build({outDir:out,data});const zh=await readFile(path.join(out,'zh/about/index.html'),'utf8'),en=await readFile(path.join(out,'en/about/index.html'),'utf8');assert.ok(zh.includes('uploads/chinese.png'));assert.ok(en.includes('uploads/english.png'));assert.ok(!en.includes('uploads/chinese.png'));for(const item of data.certificates.slice(1))assert.ok(zh.includes(item.imageEn));assert.equal((zh.match(/class="proof-disclosure"/g)||[]).length,8);assert.ok(zh.includes('TAECT 數位媒體實作競賽'));assert.ok(zh.includes('MOS Excel'));assert.ok(zh.includes('projects/ai-cup-2022/index.html'));assert.ok(!zh.includes('查看證書'));assert.ok(!zh.includes('查看競賽證明圖片'));assert.ok(!zh.includes('<details class="proof-disclosure" open'));}finally{await rm(out,{recursive:true,force:true});}
});

test('Local editor persists changes, rejects conflicts and unsafe requests, and validates uploads',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'mypage-editor-'));let server;
 try{
  for(const item of ['scripts','content','editor','public','package.json'])await cp(path.join(ROOT,item),path.join(dir,item),{recursive:true});
  const {startServer}=await import(pathToFileURL(path.join(dir,'scripts/server.mjs')).href);server=await startServer({port:0});const base=`http://127.0.0.1:${server.address().port}`;
  const html=await (await fetch(base+'/editor/')).text();const token=html.match(/name="editor-token" content="([^"]+)"/)[1];
  const headers={'X-Editor-Token':token,'Content-Type':'application/json','Origin':base};
  assert.equal((await fetch(base+'/api/content')).status,403);
  const hostStatus=await new Promise((resolve,reject)=>{const req=http.get(base+'/api/content',{headers:{...headers,Host:'untrusted.example'}},res=>{res.resume();resolve(res.statusCode);});req.on('error',reject);});assert.equal(hostStatus,403);
  const original=await (await fetch(base+'/api/content',{headers})).json();assert.equal(original.data.articles.length,19);
  const invalid=structuredClone(original);invalid.data.projects[0].repo='javascript:alert(1)';
  assert.equal((await fetch(base+'/api/save',{method:'POST',headers,body:JSON.stringify(invalid)})).status,400);
  original.data.profile.name.zh='儲存測試';
  const saved=await fetch(base+'/api/save',{method:'POST',headers,body:JSON.stringify(original)});assert.equal(saved.status,200);
  assert.ok((await (await fetch(base+'/zh/index.html')).text()).includes('儲存測試'));
  assert.equal((await (await fetch(base+'/api/content',{headers})).json()).data.articles.length,19);
  assert.equal((await fetch(base+'/api/save',{method:'POST',headers,body:JSON.stringify(original)})).status,409);
  assert.equal((await fetch(base+'/api/save',{method:'POST',headers:{...headers,Origin:'https://untrusted.example'},body:'{}'})).status,403);
  const upload=body=>fetch(base+'/api/upload',{method:'POST',headers,body:JSON.stringify({data:body})});
  assert.equal((await upload(Buffer.from('<script>alert(1)</script>').toString('base64'))).status,400);
  const png='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZQmcAAAAASUVORK5CYII=';
  const uploaded=await upload(png);assert.equal(uploaded.status,200);const image=await uploaded.json();assert.equal((await fetch(base+'/'+image.path)).status,200);
  assert.equal((await fetch(base+'/content/profile.json')).status,404);
  assert.equal((await fetch(base+'/editor/../scripts/server.mjs')).status,404);
 }finally{if(server){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}await rm(dir,{recursive:true,force:true});}
});
