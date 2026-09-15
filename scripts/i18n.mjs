export function activeLanguages(data){return data.languages.filter(language=>language.enabled);}
export function resolveText(value,languageId,languages){
 if(typeof value==='string')return {text:value,language:languageId};
 const candidates=[],seen=new Set();let current=languageId;
 while(current&&!seen.has(current)){seen.add(current);candidates.push(current);current=languages.find(l=>l.id===current)?.fallback;}
 candidates.push('en','zh',...Object.keys(value||{}));
 for(const id of candidates)if(typeof value?.[id]==='string'&&value[id].trim())return {text:value[id],language:id};
 return {text:'',language:languageId};
}
export function certificateImage(record,language){
 return language.locale.toLowerCase().startsWith('zh')?(record.imageZh||record.imageEn):(record.imageEn||record.imageZh);
}
