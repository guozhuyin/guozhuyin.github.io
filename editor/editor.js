import {schemas,emptyRecord} from './schema.js';
const $=s=>document.querySelector(s),token=$('meta[name=editor-token]').content;
let data,revision,section='profile',dirty=false,busy=false,uploads=0;
const openRecords=new WeakSet(),visited=new Set();
const status=(text,error=false)=>{$('#status').textContent=text;$('#status').dataset.error=String(error);};
const updateSave=()=>{$('#save').disabled=!dirty||busy||uploads>0;};
const changed=()=>{dirty=true;updateSave();status('有尚未儲存的變更。儲存後，本機預覽才會更新。');};
function element(tag,attrs={},text){const n=document.createElement(tag);for(const[k,v]of Object.entries(attrs)){if(k==='class')n.className=v;else n.setAttribute(k,v);}if(text!==undefined)n.textContent=text;return n;}
function button(text,action,attrs={}){const b=element('button',{type:'button',...attrs},text);b.addEventListener('click',action);return b;}
async function api(url,body){const response=await fetch(url,{method:body?'POST':'GET',headers:{'X-Editor-Token':token,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});const result=await response.json();if(!response.ok)throw new Error(result.error||'無法完成操作');return result;}
function move(rows,index,delta){const next=index+delta;if(next<0||next>=rows.length)return;[rows[index],rows[next]]=[rows[next],rows[index]];changed();render();}
function controls(rows,index){const box=element('div',{class:'record-controls'});const up=button('↑ 上移',()=>move(rows,index,-1)),down=button('↓ 下移',()=>move(rows,index,1));up.disabled=index===0;down.disabled=index===rows.length-1;box.append(up,down,button('刪除',()=>{if(confirm('刪除此項目？儲存全部變更後才會生效。')){rows.splice(index,1);changed();render();}},{class:'danger'}));return box;}
let serial=0;
function renderFields(record,fields){
 const wrap=element('div',{class:'fields'});
 for(const[key,f]of Object.entries(fields)){
  const field=element('div',{class:'field'}),id=`field-${serial++}`;
  const label=element('label',{for:id},f.label);field.append(label);
  if(f.type==='localized'){
   label.removeAttribute('for');const pair=element('div',{class:'bilingual'});
   for(const language of data.languages){const lang=language.id;const box=element('div'),input=element(f.long?'textarea':'input',{id:`${id}-${lang}`,...(!f.long?{type:'text'}:{rows:'4'})});const l=element('label',{for:`${id}-${lang}`,class:'language-label'},language.label||language.id);input.value=record[key][lang]||'';input.addEventListener('input',()=>{record[key][lang]=input.value;changed();});box.append(l,input);pair.append(box);}field.append(pair);
  }else if(f.type==='blocks'){
   label.removeAttribute('for');record[key].forEach((block,i)=>{const box=element('section',{class:'block'});box.append(element('p',{class:'field-title'},`區塊 ${i+1}`),controls(record[key],i),renderFields(block,f.fields));field.append(box);});field.append(button('＋ 新增內容區塊',()=>{record[key].push(emptyRecord(f.fields,data.languages));changed();render();}));
  }else if(f.type==='links'){
   label.removeAttribute('for');record[key].forEach((link,i)=>{const box=element('section',{class:'block'});box.append(element('p',{class:'field-title'},`連結 ${i+1}`),controls(record[key],i),renderFields(link,f.fields));field.append(box);});field.append(button('＋ 新增學校／系所連結',()=>{record[key].push(emptyRecord(f.fields,data.languages));changed();render();}));
  }else if(f.type==='choice'){
   const input=element('select',{id});for(const value of f.options)input.append(element('option',{value},value==='ltr'?'由左至右':'由右至左'));input.value=record[key];input.addEventListener('change',()=>{record[key]=input.value;changed();});field.append(input);
  }else if(f.type==='boolean'){
   const input=element('input',{id,type:'checkbox'});input.checked=record[key];input.addEventListener('change',()=>{record[key]=input.checked;changed();});label.prepend(input);
  }else{
   const input=element('input',{id,type:f.type==='email'?'email':f.type==='link'?'text':'text'});input.value=f.type==='tags'?record[key].join(', '):record[key];input.addEventListener('input',()=>{record[key]=f.type==='tags'?input.value.split(/[,，]/).map(s=>s.trim()).filter(Boolean):input.value;changed();});field.append(input);
   if(f.type==='slug')field.append(element('p',{class:'hint'},'例如 ai-math。發布後變更代稱會改變作品網址，舊連結將失效。'));
   if(f.type==='image'){
    const preview=element('img',{class:'image-preview',alt:'目前選擇的圖片'});if(record[key])preview.src='/'+record[key];else preview.hidden=true;
    const upload=element('input',{type:'file',accept:'image/png,image/jpeg,image/webp,image/gif','aria-label':`上傳${f.label}`});
    upload.addEventListener('change',async()=>{const file=upload.files[0];if(!file)return;if(file.size>6*1024*1024){status('圖片上限為 6 MB。',true);return;}uploads++;updateSave();upload.disabled=true;status('正在上傳圖片…');try{const encoded=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=reject;reader.readAsDataURL(file);});const result=await api('/api/upload',{data:encoded});record[key]=result.path;input.value=result.path;preview.src='/'+result.path;preview.hidden=false;changed();}catch(e){status(e.message,true);}finally{uploads--;upload.disabled=false;updateSave();}});
    input.addEventListener('change',()=>{if(/^uploads\/[a-zA-Z0-9._-]+\.(png|jpe?g|webp|gif)$/i.test(input.value)){preview.src='/'+input.value;preview.hidden=false;}else preview.hidden=true;});field.append(upload,element('p',{class:'hint'},'支援 PNG、JPEG、WebP、GIF，最多 6 MB。清空上方路徑可隱藏圖片。'),preview);
   }
  }
  wrap.append(field);
 }
 return wrap;
}
function render(){
 document.querySelectorAll('details.record').forEach(d=>{if(d._record){if(d.open)openRecords.add(d._record);else openRecords.delete(d._record);}});
 serial=0;const schema=schemas[section];$('#title').textContent=schema.label;$('#add').hidden=!!schema.single;
 const hints={publications:'題名、姓名與會議名稱只存一份原文，切換網站語言不會改動；摘要可另外翻譯。正式連結會直接套在論文原文題名上。',certificates:'正式名稱保留原文。證照名稱本身是展開證明圖片的入口；中文頁優先中文版，英文與其他語言優先英文版，缺少時回退到另一版本。',awards:'競賽名稱本身是展開證明圖片的入口。若有對應作品，填入作品代稱（例如 ai-cup-2022），成果區會提供作品頁連結。',articles:'全文保留在 WordPress；這裡維護主站的標題、摘要、分類、日期與原文網址。勾選「放在首頁精選」後，首頁與文章頁最多顯示前三篇；完整與最新文章請從 WordPress 入口閱讀。',languages:'新增語言後，可先不啟用，在其他分類填寫翻譯。啟用後才會產生頁面；第一個啟用的語言是首頁預設。不要變更已有語言代稱，以免改變網址。',interface:'這裡管理導覽、按鈕與說明文字。未填的語言會使用替代語言；不會自動呼叫機器翻譯。',education:'求職頁面會先呈現大學與研究所；勾選「收合到早期教育（K–12）」的項目會放在可展開區塊。若有學歷證明，可填入證明名稱及中英文圖片，項目名稱會成為展開入口。學校／系所網站會直接套在右側名稱上，避免重複列出連結。'};$('#description').textContent=hints[section]||'一般內容可分別填寫各語言。空白翻譯保留另一語言的原文；不會改寫原始資料。';
 document.querySelectorAll('#sections button').forEach(b=>{if(b.dataset.section===section)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
 const form=$('#content');form.replaceChildren();
 if(schema.single){const box=element('div',{class:'single-fields'});box.append(renderFields(data[section],schema.fields));form.append(box);}
 else if(!data[section].length)form.append(element('p',{class:'empty'},`目前沒有${schema.label}。使用「新增項目」填入你的資料。`));
 else data[section].forEach((record,index)=>{const details=element('details',{class:'record'});details._record=record;if(openRecords.has(record)||record._new||(!visited.has(section)&&index===0))details.open=true;delete record._new;const title=record.originalTitle||record.officialName||record.label||Object.values(record.title||{}).find(Boolean)||`新${schema.label}`;details.append(element('summary',{},`${String(index+1).padStart(2,'0')}　${title}`));const body=element('div',{class:'record-body'});body.append(controls(data[section],index),renderFields(record,schema.fields));details.append(body);form.append(details);});
 visited.add(section);
}
$('#content').addEventListener('submit',e=>e.preventDefault());
$('#add').addEventListener('click',()=>{const record=emptyRecord(schemas[section].fields,data.languages);if(section==='projects')record.id=`project-${Date.now()}`;if(section==='languages'){record.id='';record.locale='en';record.fallback=data.languages.find(l=>l.enabled)?.id||'';}if(section==='publications'||section==='certificates')record.originalLanguage='zh-Hant';record._new=true;data[section].push(record);changed();render();});
$('#save').addEventListener('click',async()=>{
 if(busy||uploads)return;busy=true;updateSave();$('#content').inert=true;$('#add').disabled=true;$('#sections').inert=true;status('正在儲存並產生網頁…');
 try{const result=await api('/api/save',{data,revision});revision=result.revision;dirty=false;status(result.message);}catch(e){status(e.message,true);}finally{busy=false;$('#content').inert=false;$('#add').disabled=false;$('#sections').inert=false;updateSave();}
});
window.addEventListener('beforeunload',e=>{if(dirty||uploads){e.preventDefault();e.returnValue='';}});
try{const result=await api('/api/content');data=result.data;revision=result.revision;for(const[key,schema]of Object.entries(schemas)){const b=button(schema.label,()=>{section=key;render();});b.dataset.section=key;$('#sections').append(b);}render();status('已載入內容。選擇分類即可開始編輯。');}catch(e){status(e.message,true);}
