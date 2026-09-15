import {interfaceFields} from './ui-schema.js';
const bi = (label, long = false) => ({ label, type: 'localized', long });
const text = label => ({ label, type: 'text' });
const image = label => ({ label, type: 'image' });
const link = label => ({ label, type: 'link' });
export const blockFields = { heading: bi('區塊標題'), body: bi('內容', true), image: image('圖片'), caption: bi('圖片說明') };
export const schemas = {
 profile: { label: '基本資料', single: true, fields: {
  name: bi('公開名稱／綽號'), intro: bi('首頁標題', true), summary: bi('首頁簡介', true), focus: bi('求職方向'), about: bi('關於我', true), quote: text('個人名言（保留原文）'), quoteLanguage:{label:'名言原文語言（例如 zh-Hant）',type:'languageTag'},
  photo: image('個人照片'), photoAlt: bi('個人照片說明'), landscape: image('生活／風景照片'), landscapeAlt: bi('風景照片說明'),
  email: {label:'聯絡 Email',type:'email'}, github: link('GitHub 網址'), blog: link('WordPress 網址'), facebook: link('Facebook 網址'), instagram: link('Instagram 網址'),
  resumeZh: link('中文履歷檔案連結'), resumeEn: link('英文履歷檔案連結'), skills: {label:'接觸過的技術（以逗號分隔）',type:'tags'}, tools: {label:'開發與創作工具（以逗號分隔）',type:'tags'}, interests: bi('生活興趣')
 }},
 projects: {label:'作品',fields:{id:{label:'網址代稱（小寫英數與連字號）',type:'slug'},title:bi('作品名稱'),category:bi('專案類型'),summary:bi('作品摘要',true),role:bi('我的角色／負責範圍',true),date:text('日期／期間'),tags:{label:'技術或主題（以逗號分隔）',type:'tags'},featured:{label:'放在首頁精選',type:'boolean'},cover:image('封面圖片'),coverAlt:bi('封面圖片說明'),repo:link('原始碼網址'),demo:link('展示網址'),paper:link('論文網址'),blocks:{label:'內容區塊',type:'blocks',fields:blockFields}}},
 experience:{label:'經歷',fields:{title:bi('角色／職稱'),organization:bi('單位'),date:text('期間'),location:bi('工作／服務地區'),description:bi('經歷說明',true)}},
 education:{label:'學歷',fields:{early:{label:'收合到早期教育（K–12）',type:'boolean'},title:bi('學位／系所'),organization:bi('學校'),date:text('期間'),location:bi('學校地區'),links:{label:'學校／系所網站',type:'links',fields:{label:bi('連結名稱'),url:link('網址')}},description:bi('補充說明',true),proofTitle:bi('學歷證明名稱（例如學士證書）'),proofImageZh:image('中文／學歷證明圖片'),proofImageEn:image('英文／學歷證明圖片'),proofImageAlt:bi('學歷證明圖片說明')}},
 certificates:{label:'證照',fields:{officialName:text('證照正式名稱（不翻譯）'),originalLanguage:{label:'正式名稱語言（例如 zh-Hant 或 en）',type:'languageTag'},issuer:text('發證單位'),date:text('取得日期'),imageZh:image('中文版證書'),imageEn:image('英文／國際版證書'),note:bi('補充說明')}},
 articles:{label:'精選文章',fields:{title:bi('文章標題'),summary:bi('文章摘要',true),category:bi('分類'),date:text('日期'),featured:{label:'放在首頁精選',type:'boolean'},url:link('WordPress 原文網址'),cover:image('封面圖片'),coverAlt:bi('封面圖片說明')}},
 publications:{label:'論文發表',fields:{originalTitle:text('論文原文題名（不翻譯）'),authors:text('原文作者姓名（依發表順序）'),originalLanguage:{label:'論文原文語言（例如 zh-Hant 或 en）',type:'languageTag'},venue:text('研討會／期刊原文名稱'),kind:bi('發表類型'),date:text('發表日期'),location:bi('研討會地點'),summary:bi('研究摘要',true),url:link('正式論文／出版連結'),project:text('相關作品代稱（可留白）')}},
 awards:{label:'競賽成果',fields:{title:bi('競賽名稱'),result:bi('名次／成果'),date:text('年份'),description:bi('參賽說明',true),image:image('競賽證明圖片'),imageAlt:bi('競賽證明圖片說明'),url:link('成果連結'),project:text('相關作品代稱（可留白）')}},
 resources:{label:'其他作品連結',fields:{title:bi('作品名稱'),summary:bi('簡介',true),url:link('作品網址')}},
 languages:{label:'語言設定',fields:{id:{label:'網址代稱（例如 ja、fr）',type:'slug'},locale:{label:'HTML 語言代碼（例如 ja、fr、zh-Hant）',type:'languageTag'},label:text('語言選單顯示名稱'),enabled:{label:'啟用並產生此語言的公開頁面',type:'boolean'},fallback:text('缺少翻譯時的替代語言代稱'),direction:{label:'文字方向',type:'choice',options:['ltr','rtl']}}},
 interface:{label:'介面文字',single:true,fields:interfaceFields}
};
export function emptyRecord(fields, languages = [{id:'zh'},{id:'en'}]) {
 return Object.fromEntries(Object.entries(fields).map(([k,f])=>[k,f.type==='localized'?Object.fromEntries(languages.map(l=>[l.id,''])):f.type==='boolean'?false:f.type==='choice'?f.options[0]:['blocks','links','tags'].includes(f.type)?[]:'']));
}
