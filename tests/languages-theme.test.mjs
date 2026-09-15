import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,rm} from 'node:fs/promises';
import path from 'node:path';
import {tmpdir} from 'node:os';
import vm from 'node:vm';
import {ROOT,loadContent,validate} from '../scripts/content.mjs';
import {build} from '../scripts/build.mjs';
import {resolveText,certificateImage} from '../scripts/i18n.mjs';

test('A third language gets routes and editable UI while original citations remain unchanged',async()=>{
 const out=await mkdtemp(path.join(tmpdir(),'zhuyin-languages-'));
 try{
  const data=await loadContent();data.languages.push({id:'ja',locale:'ja',label:'日本語',enabled:true,fallback:'en',direction:'ltr'});
  data.interface.navHome.ja='ホーム';data.profile.name.ja='Zhuyin';data.profile.summary.ja='ソフトウェア開発と学習について。';
  data.interface.footer.ja='<script>malicious()</script>';
  assert.deepEqual(validate(data),[]);
  const result=await build({outDir:out,data});assert.equal(result.count,1+3*(4+data.projects.length));
  const home=await readFile(path.join(out,'ja/index.html'),'utf8'),about=await readFile(path.join(out,'ja/about/index.html'),'utf8'),en=await readFile(path.join(out,'en/about/index.html'),'utf8');
  assert.ok(home.includes('lang="ja"'));assert.ok(home.includes('ホーム'));assert.ok(home.includes('永遠相信美好的事即將發生'));assert.ok(home.includes('data-theme-toggle'));assert.ok(!home.includes('data-theme-reset'));assert.ok(about.includes('<details class="publication-disclosure">'));assert.ok(about.indexOf('id="project-evidence"')<about.indexOf('id="publications"'));assert.ok(!home.includes('data-theme-select'));assert.ok(!home.includes('<script>malicious()'));assert.ok(home.includes('&lt;script&gt;'));
  for(const r of data.publications){for(const html of [about,en]){assert.ok(html.includes(r.originalTitle));if(r.authors)assert.ok(html.includes(r.authors));assert.ok(html.includes(`lang="${r.originalLanguage}" translate="no"`));}}
  const nested=await readFile(path.join(out,'ja/projects/ai-math/index.html'),'utf8');assert.ok(nested.includes('../../../en/projects/ai-math/index.html'));
  assert.equal(resolveText({zh:'原文',en:'Original'},'ja',data.languages).text,'Original');
  data.languages.find(l=>l.id==='ja').enabled=false;await build({outDir:out,data});await assert.rejects(readFile(path.join(out,'ja/index.html')));
 }finally{await rm(out,{recursive:true,force:true});}
});

test('Certificate file choice is independent from the number of website languages',()=>{
 const record={imageZh:'uploads/zh.png',imageEn:'uploads/en.png'};
 assert.equal(certificateImage(record,{locale:'zh-Hant'}),'uploads/zh.png');
 for(const locale of ['en','ja','fr','de'])assert.equal(certificateImage(record,{locale}),'uploads/en.png');
 assert.equal(certificateImage({...record,imageEn:''},{locale:'ja'}),'uploads/zh.png');
 assert.equal(certificateImage({...record,imageZh:''},{locale:'zh-Hant'}),'uploads/en.png');
});

test('Language configuration rejects conflicting routes and missing fallback targets',async()=>{
 const data=await loadContent();data.languages.push({...data.languages[0]});assert.ok(validate(data).some(e=>e.includes('不可重複')));
 data.languages=data.languages.slice(0,2);data.languages[0].fallback='missing';assert.ok(validate(data).some(e=>e.includes('替代語言')));
 data.languages[0].fallback='en';data.languages.forEach(l=>l.enabled=false);assert.ok(validate(data).some(e=>e.includes('至少啟用')));
});

test('A single theme button toggles both system defaults and resumes system tracking',async()=>{
 const source=await readFile(path.join(ROOT,'public/assets/site.js'),'utf8');
 for(const initialDark of [true,false]){
  const handlers={},attributes={},icon={textContent:''},root={dataset:{}},store=new Map(),windowEvents={};
  const toggle={hidden:true,dataset:{lightLabel:'Light',darkLabel:'Dark',systemLabel:'System'},setAttribute:(k,v)=>attributes[k]=v,querySelector:()=>icon,addEventListener:(k,fn)=>handlers['toggle:'+k]=fn};
  const system={matches:initialDark,addEventListener:(k,fn)=>handlers['system:'+k]=fn};
  const context={document:{documentElement:root,querySelector:s=>s==='[data-theme-toggle]'?toggle:null,querySelectorAll:()=>[]},window:{matchMedia:()=>system,addEventListener:(k,fn)=>windowEvents[k]=fn},localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)}};
  vm.runInNewContext(source,context);
  assert.equal(root.dataset.theme,undefined);assert.equal(attributes['aria-pressed'],String(initialDark));assert.equal(toggle.hidden,false);
  handlers['toggle:click']();assert.equal(root.dataset.theme,initialDark?'light':'dark');assert.equal(store.get('mypage-theme'),initialDark?'light':'dark');
  handlers['toggle:click']();assert.equal(root.dataset.theme,undefined);assert.equal(store.has('mypage-theme'),false);
  system.matches=!initialDark;handlers['system:change']();assert.equal(root.dataset.theme,undefined);assert.equal(attributes['aria-pressed'],String(!initialDark));
  handlers['toggle:click']();system.matches=initialDark;handlers['system:change']();assert.equal(root.dataset.theme,undefined);assert.equal(store.has('mypage-theme'),false);
  windowEvents.storage({key:'mypage-theme',newValue:initialDark?'light':'dark'});assert.equal(root.dataset.theme,initialDark?'light':'dark');
  windowEvents.storage({key:'mypage-theme',newValue:null});assert.equal(root.dataset.theme,undefined);
  store.set('mypage-theme',initialDark?'dark':'light');vm.runInNewContext(source,context);assert.equal(root.dataset.theme,undefined);assert.equal(store.has('mypage-theme'),false);
 }
});
