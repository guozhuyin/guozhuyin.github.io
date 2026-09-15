import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {schemas} from '../editor/schema.js';
export const ROOT=fileURLToPath(new URL('../',import.meta.url));
export const DATA=path.join(ROOT,'content');
export const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function safeLink(s){return typeof s==='string' && (/^https?:\/\/[^\s]+$/i.test(s)||/^uploads\/[a-zA-Z0-9._-]+$/.test(s));}
export function validate(data){
 const errors=[];
 function fields(record,defs,loc){
  if(!record||typeof record!=='object'||Array.isArray(record)){errors.push(`${loc}：格式錯誤`);return;}
  for(const k of Object.keys(record))if(!Object.hasOwn(defs,k))errors.push(`${loc}.${k}：未知欄位，請先更新表單與呈現設定`);
  for(const [k,f]of Object.entries(defs)){
   const v=record[k],l=`${loc}.${k}`;
   if(f.type==='localized'){
    if(!v||typeof v!=='object'||Array.isArray(v)){errors.push(`${l}：需要各語言文字`);continue;}
    if(Object.entries(v).some(([k,value])=>!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(k)||typeof value!=='string'||value.length>50000))errors.push(`${l}：翻譯欄位格式錯誤`);
   }else if(f.type==='boolean'){if(typeof v!=='boolean')errors.push(`${l}：需要勾選值`);}
   else if(f.type==='tags'){if(!Array.isArray(v)||v.length>40||v.some(s=>typeof s!=='string'||s.length>100))errors.push(`${l}：標籤格式錯誤`);}
   else if(f.type==='blocks'){if(!Array.isArray(v)||v.length>50)errors.push(`${l}：區塊格式錯誤`);else v.forEach((b,i)=>fields(b,f.fields,`${l}[${i}]`));}
   else if(f.type==='links'){if(!Array.isArray(v)||v.length>20)errors.push(`${l}：連結格式錯誤`);else v.forEach((item,i)=>fields(item,f.fields,`${l}[${i}]`));}
   else if(typeof v!=='string'){errors.push(`${l}：需要文字`);}
   else {
    if(v.length>50000)errors.push(`${l}：文字過長`);
    if(f.type==='choice'&&!f.options.includes(v))errors.push(`${l}：無效選項`);
    if(f.type==='languageTag'){try{if(!v)throw Error();Intl.getCanonicalLocales(v);}catch{errors.push(`${l}：請使用有效的語言代碼，例如 zh-Hant 或 en`);}}
    if(f.type==='slug'&&!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v))errors.push(`${l}：請使用小寫英數和連字號`);
    if(f.type==='image'&&v&&!/^uploads\/[a-zA-Z0-9._-]+\.(png|jpe?g|webp|gif|svg)$/i.test(v))errors.push(`${l}：請使用上傳功能或 uploads/ 內的圖片`);
    if(f.type==='link'&&v&&!safeLink(v))errors.push(`${l}：請填完整 https:// 網址或 uploads/ 檔案路徑`);
    if(f.type==='email'&&v&&!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(v))errors.push(`${l}：Email 格式錯誤`);
   }
  }
 }
 for(const k of Object.keys(data))if(!Object.hasOwn(schemas,k))errors.push(`未知內容分類：${k}`);
 for(const [k,s]of Object.entries(schemas)){
  if(s.single)fields(data[k],s.fields,k);
  else if(!Array.isArray(data[k])||data[k].length>500)errors.push(`${k}：需要清單，最多 500 筆`);
  else data[k].forEach((r,i)=>fields(r,s.fields,`${k}[${i}]`));
 }
 const ids=data.projects?.map(p=>p?.id)||[];
 if(new Set(ids).size!==ids.length)errors.push('作品網址代稱不可重複');
 for(const p of data.projects||[])if(!Object.values(p.title||{}).some(v=>typeof v==='string'&&v.trim()))errors.push('作品需要至少一個語言的名稱');
 for(const item of data.publications||[])if(item.project&&!ids.includes(item.project))errors.push('論文的相關作品代稱不存在：'+item.project);
 for(const item of data.awards||[])if(item.project&&!ids.includes(item.project))errors.push('競賽成果的相關作品代稱不存在：'+item.project);
 const languages=Array.isArray(data.languages)?data.languages:[];
 const languageIds=languages.map(l=>l.id);
 if(!languages.some(l=>l.enabled))errors.push('至少啟用一個網站語言');
 if(new Set(languageIds).size!==languageIds.length)errors.push('語言網址代稱不可重複');
 for(const lang of languages){
  if(['assets','uploads','editor','api','dist'].includes(lang.id))errors.push('語言代稱不可使用網站保留路徑');
  if(!lang.label?.trim())errors.push('語言需要顯示名稱');
  if(lang.fallback&&(!languageIds.includes(lang.fallback)||lang.fallback===lang.id))errors.push('替代語言必須是另一個已設定的語言');
 }
 for(const item of data.publications||[])if(!item.originalTitle?.trim())errors.push('論文需要原文題名');
 for(const item of data.certificates||[])if(!item.officialName?.trim())errors.push('證照需要正式名稱');
 return errors;
}
export async function loadContent(){const out={};for(const k of Object.keys(schemas))out[k]=JSON.parse(await readFile(path.join(DATA,`${k}.json`),'utf8'));return out;}
