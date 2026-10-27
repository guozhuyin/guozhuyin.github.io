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
const fileStates=new WeakMap();
const hasFiles=event=>Array.from(event.dataTransfer?.types||[]).includes('Files');
function uploadField(record,key,f,id){
 const isPdf=f.type==='pdf',kind=isPdf?'pdf':'image',maxSize=(isPdf?10:6)*1024*1024;
 let states=fileStates.get(record);if(!states){states=new Map();fileStates.set(record,states);}
 if(!states.has(key))states.set(key,{path:record[key],name:'',size:null,uploading:false,message:'',error:false});
 const state=states.get(key);
 const root=element('div',{class:'file-uploader','data-upload-field':key,'data-upload-kind':kind});
 const zone=element('div',{class:'upload-zone',role:'group','aria-labelledby':`${id}-label`});
 const choose=button(isPdf?'選擇 PDF':'選擇圖片',()=>picker.click(),{class:'primary','aria-label':`選擇${f.label}`});
 const picker=element('input',{type:'file',hidden:'',accept:isPdf?'.pdf,application/pdf':'image/png,image/jpeg,image/webp,image/gif','aria-label':`上傳${f.label}`});
 const help=element('p',{class:'hint',id:`${id}-help`},isPdf?'支援 PDF，最多 10 MB。':'支援 PNG、JPEG、WebP、GIF，最多 6 MB。');
 zone.append(element('p',{class:'upload-title'},isPdf?'將 PDF 拖曳到這裡':'將圖片拖曳到這裡'),help,choose,picker);
 const message=element('p',{class:'upload-message',id:`${id}-message`,role:'status','aria-live':'polite',hidden:''});
 const selected=element('div',{class:'selected-file',hidden:''}),info=element('div',{class:'file-info'});
 const details=element('div',{class:'file-details'}),name=element('p',{class:'file-name'}),size=element('p',{class:'file-size'});
 details.append(name,size);
 const actions=element('div',{class:'file-actions'}),open=element('a',{class:'upload-open',target:'_blank',rel:'noopener'},'開啟檔案 ↗');
 const clear=button('清除選擇',()=>{record[key]='';Object.assign(state,{path:'',name:'',size:null,message:'',error:false});state.refresh();changed();choose.focus();});
 actions.append(open,clear);info.append(details,actions);
 const preview=isPdf?element('iframe',{class:'pdf-preview',title:`${f.label}內容預覽`,loading:'lazy',referrerpolicy:'no-referrer'}):element('img',{class:'image-preview',alt:`${f.label}預覽`});
 const external=element('p',{class:'hint',hidden:''},'目前使用外部網址，可按「開啟檔案」查看內容，或上傳 PDF 在這裡預覽。');
 selected.append(info,preview,external);
 const pathLabel=element('label',{for:id,class:'file-path-label'},isPdf?'檔案路徑或網址':'檔案路徑');
 const input=element('input',{id,type:'text','aria-describedby':`${id}-help ${id}-message`,placeholder:isPdf?'上傳後自動填入；也可貼上既有 PDF 路徑或 HTTPS 網址':'上傳後自動填入'});
 root.append(zone,message,selected,pathLabel,input);
 state.refresh=()=>{
  const value=record[key];
  if(state.path!==value)Object.assign(state,{path:value,name:'',size:null,message:'',error:false});
  const local=isPdf?/^uploads\/[a-zA-Z0-9._-]+\.pdf$/i.test(value):/^uploads\/[a-zA-Z0-9._-]+\.(png|jpe?g|webp|gif|svg)$/i.test(value);
  const remote=isPdf&&/^https:\/\/[^\s]+$/i.test(value);
  if(input.value!==value)input.value=value;input.disabled=state.uploading;choose.disabled=state.uploading;clear.disabled=state.uploading;
  root.setAttribute('aria-busy',String(state.uploading));
  message.textContent=state.message;message.hidden=!state.message;message.dataset.error=String(state.error);
  selected.hidden=!value;open.hidden=!local&&!remote;
  if(local||remote)open.href=local?'/'+value:value;else open.removeAttribute('href');
  name.textContent=state.name||(isPdf?'目前選擇的 PDF':'目前選擇的圖片');
  size.hidden=state.size===null;
  size.textContent=state.size===null?'':state.size>=1024*1024?`${(state.size/1024/1024).toFixed(1)} MB`:`${Math.ceil(state.size/1024)} KB`;
  preview.hidden=!local;external.hidden=!remote;
  if(local){const source='/'+value+(isPdf?'#view=FitH&navpanes=0':'');if(preview.getAttribute('src')!==source)preview.src=source;}
  else preview.removeAttribute('src');
 };
 function error(text){state.message=text;state.error=true;state.refresh();status(text,true);}
 async function uploadFiles(files){
  if(state.uploading){status('這個欄位正在上傳，請稍候。');return;}
  if(files.length!==1){error('一次請選擇或拖曳一個檔案。');return;}
  const file=files[0];
  const accepted=isPdf?file.type==='application/pdf'||/\.pdf$/i.test(file.name):/^image\/(png|jpeg|webp|gif)$/.test(file.type)||/\.(png|jpe?g|webp|gif)$/i.test(file.name);
  if(!accepted){error(isPdf?'請選擇 PDF 檔案。':'請選擇 PNG、JPEG、WebP 或 GIF 圖片。');return;}
  if(file.size>maxSize){error(isPdf?'PDF 上限為 10 MB。':'圖片上限為 6 MB。');return;}
  state.uploading=true;state.message=`正在上傳「${file.name}」…`;state.error=false;uploads++;updateSave();state.refresh();
  try{
   const encoded=await new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=()=>resolve(String(reader.result).split(',')[1]);
    reader.onerror=()=>reject(new Error('無法讀取檔案，請重新選擇。'));
    reader.onabort=()=>reject(new Error('檔案讀取已取消。'));
    reader.readAsDataURL(file);
   });
   const result=await api('/api/upload',{data:encoded,kind});
   record[key]=result.path;Object.assign(state,{path:result.path,name:file.name,size:result.size,message:'已上傳。按「儲存全部變更」更新網站。',error:false});changed();
  }catch(e){state.message=e.message||'上傳失敗，請再試一次。';state.error=true;status(state.message,true);}
  finally{state.uploading=false;uploads--;state.refresh();updateSave();}
 }
 picker.addEventListener('change',()=>{const files=Array.from(picker.files);picker.value='';if(files.length)uploadFiles(files);});
 input.addEventListener('input',()=>{record[key]=input.value;Object.assign(state,{path:input.value,name:'',size:null,message:'',error:false});state.refresh();changed();});
 let dragDepth=0;
 root.addEventListener('dragenter',event=>{if(!hasFiles(event))return;event.preventDefault();if(!root.classList.contains('is-dragging'))dragDepth=0;dragDepth++;root.classList.add('is-dragging');});
 root.addEventListener('dragover',event=>{if(!hasFiles(event))return;event.preventDefault();event.dataTransfer.dropEffect=state.uploading?'none':'copy';});
 root.addEventListener('dragleave',event=>{if(!hasFiles(event))return;dragDepth=Math.max(0,dragDepth-1);if(!dragDepth)root.classList.remove('is-dragging');});
 root.addEventListener('drop',event=>{if(!hasFiles(event))return;event.preventDefault();event.stopPropagation();dragDepth=0;root.classList.remove('is-dragging');uploadFiles(Array.from(event.dataTransfer.files));});
 state.refresh();return root;
}
document.addEventListener('dragover',event=>{if(hasFiles(event))event.preventDefault();});
document.addEventListener('drop',event=>{
 if(!hasFiles(event))return;event.preventDefault();
 document.querySelectorAll('.file-uploader.is-dragging').forEach(node=>node.classList.remove('is-dragging'));
 status('請將檔案拖曳到對應的圖片或 PDF 上傳區。',true);
});
function renderFields(record,fields){
 const wrap=element('div',{class:'fields'});
 let parent=wrap,group='';
 for(const[key,f]of Object.entries(fields)){
  if(f.group&&f.group!==group){const details=element('details',{class:'interface-group'});details.open=group==='';details.append(element('summary',{},f.group));parent=element('div',{class:'fields'});details.append(parent);wrap.append(details);group=f.group;}
  const field=element('div',{class:'field'}),id=`field-${serial++}`;
  const label=element('label',{for:id},f.label);field.append(label);if(f.help)field.append(element('p',{class:'hint field-help'},f.help));
  if(f.type==='localized'){
   label.removeAttribute('for');const pair=element('div',{class:'bilingual'});
   for(const language of data.languages){const lang=language.id;const box=element('div'),input=element(f.long?'textarea':'input',{id:`${id}-${lang}`,...(!f.long?{type:'text'}:{rows:'4'})});const l=element('label',{for:`${id}-${lang}`,class:'language-label'},language.label||language.id);input.value=record[key][lang]||'';input.addEventListener('input',()=>{record[key][lang]=input.value;changed();});box.append(l,input);pair.append(box);}field.append(pair);
  }else if(f.type==='blocks'){
   label.removeAttribute('for');record[key].forEach((block,i)=>{const box=element('section',{class:'block'});box.append(element('p',{class:'field-title'},`區塊 ${i+1}`),controls(record[key],i),renderFields(block,f.fields));field.append(box);});field.append(button('＋ 新增內容區塊',()=>{record[key].push(emptyRecord(f.fields,data.languages));changed();render();}));
  }else if(f.type==='links'){
   label.removeAttribute('for');record[key].forEach((link,i)=>{const box=element('section',{class:'block'});box.append(element('p',{class:'field-title'},`連結 ${i+1}`),controls(record[key],i),renderFields(link,f.fields));field.append(box);});field.append(button(f.addLabel||'＋ 新增學校 / 系所連結',()=>{record[key].push(emptyRecord(f.fields,data.languages));changed();render();}));
  }else if(f.type==='choice'){
   const input=element('select',{id});for(const value of f.options)input.append(element('option',{value},value==='ltr'?'由左至右':'由右至左'));input.value=record[key];input.addEventListener('change',()=>{record[key]=input.value;changed();});field.append(input);
  }else if(f.type==='boolean'){
   const input=element('input',{id,type:'checkbox'});input.checked=record[key];input.addEventListener('change',()=>{record[key]=input.checked;changed();});label.prepend(input);
  }else if(f.type==='image'||f.type==='pdf'){
   label.removeAttribute('for');label.id=`${id}-label`;field.append(uploadField(record,key,f,id));
  }else{
   const input=element('input',{id,type:f.type==='email'?'email':f.type==='link'?'text':'text'});input.value=f.type==='tags'?record[key].join(', '):record[key];input.addEventListener('input',()=>{record[key]=f.type==='tags'?input.value.split(/[,，]/).map(s=>s.trim()).filter(Boolean):input.value;changed();});field.append(input);
   if(f.type==='slug')field.append(element('p',{class:'hint'},'例如 mathai 或 bioutopia；只產生這個代稱的作品網址。'));
  }
  parent.append(field);
 }
 return wrap;
}
function render(){
 document.querySelectorAll('details.record').forEach(d=>{if(d._record){if(d.open)openRecords.add(d._record);else openRecords.delete(d._record);}});
 serial=0;const schema=schemas[section];$('#title').textContent=schema.label;$('#add').hidden=!!schema.single;
 const maps={profile:'首頁：名稱、介紹、簡介與照片；關於頁：自傳、技術清單與生活興趣；頁尾：信箱與社群連結。',projects:'首頁與作品清單：標題、摘要、封面及我的角色；首頁不顯示技術標籤，作品清單與詳細頁會顯示。作品詳細頁另有完整內容區塊，可在「其他作品連結」維護關卡與官方成果入口。勾選首頁精選後，依排列順序顯示前三件作品。',articles:'首頁保留文章頁入口，精選文章的圖片與摘要顯示在文章頁。',interface:'首頁各區的標題與說明，以及導覽、按鈕與頁尾短句，可在這裡分別維護。',languages:'網站上方顯示目前語言名稱，展開選單後列出所有啟用語言；入口頁會依裝置偏好選擇可用語言。',education:'關於頁的學歷區。',experience:'關於頁的經歷區。',certificates:'關於頁的證照區。',publications:'關於頁的論文發表區。',awards:'關於頁的競賽成果區。',resources:'作品頁下方的其他連結。'};$('#page-map').textContent=maps[section]||'內容會出現在對應的公開頁面。';
 const hints={publications:'題名、姓名與會議名稱只存一份原文，切換網站語言不會改動；摘要可另外翻譯。正式連結會直接套在論文原文題名上。',certificates:'正式名稱保留原文。證照名稱本身是展開證明圖片的入口；中文頁優先中文版，英文與其他語言優先英文版，缺少時回退到另一版本。',awards:'競賽名稱本身是展開證明圖片的入口。若有對應作品，填入作品代稱（例如 ai-cup-2022），成果區會提供作品頁連結。',articles:'全文保留在 WordPress；這裡保存每篇文章的標題、摘要、分類、日期與原文網址。勾選「列為文章頁精選」後，文章頁最多顯示前三篇；首頁只保留文章頁入口，未精選的文章仍保留在此清單。',resources:'勾選「暫時隱藏此作品」後，公開頁面不會顯示；資料仍保留，日後可重新啟用。公開網站只提供 HTTPS 連結。',languages:'新增語言後，可先不啟用，在其他分類填寫翻譯。啟用後才會產生頁面；入口頁會先採用手動選擇，再比對裝置語言；沒有支援的語言時優先使用英文。建議保留英文啟用。不要變更已有語言代稱，以免改變網址。',interface:'這裡管理導覽、按鈕與說明文字。未填的語言會使用替代語言；不會自動呼叫機器翻譯。',education:'求職頁面會先呈現大學與研究所；勾選「收合到早期教育（K–12）」的項目會放在可展開區塊。若有學歷證明，可填入證明名稱及中英文圖片，項目名稱會成為展開入口。學校 / 系所網站會直接套在右側名稱上，避免重複列出連結。'};$('#description').textContent=hints[section]||'一般內容可分別填寫各語言。空白翻譯保留另一語言的原文；不會改寫原始資料。';
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
