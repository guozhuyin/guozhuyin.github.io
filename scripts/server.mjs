import http from 'node:http';
import {readFile,writeFile,mkdir,rename,rm,stat} from 'node:fs/promises';
import {randomBytes,randomUUID,createHash} from 'node:crypto';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {ROOT,DATA,loadContent,validate} from './content.mjs';
import {build} from './build.mjs';
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.gif':'image/gif','.pdf':'application/pdf'};
const digest=data=>createHash('sha256').update(JSON.stringify(data)).digest('hex');
function uploadType(buffer){
 if(buffer.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))return 'png';
 if(buffer[0]===255&&buffer[1]===216&&buffer[2]===255)return 'jpg';
 if(['GIF87a','GIF89a'].includes(buffer.subarray(0,6).toString()))return 'gif';
 if(buffer.subarray(0,4).toString()==='RIFF'&&buffer.subarray(8,12).toString()==='WEBP')return 'webp';
 if(/^%PDF-\d\.\d\s/.test(buffer.subarray(0,16).toString('ascii'))&&buffer.subarray(-1024).includes(Buffer.from('%%EOF')))return 'pdf';
 return null;
}
export async function startServer({port=4173,editor=true}={}){
 await build();const token=randomBytes(32).toString('hex');let saving=false,pendingUploads=0;
 const server=http.createServer(async(req,res)=>{
  const json=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
  const activePort=server.address().port;
  const origin=`http://127.0.0.1:${activePort}`;
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','same-origin');res.setHeader('X-Frame-Options','DENY');
  if(req.headers.host!==`127.0.0.1:${activePort}`){json(403,{error:'請使用終端機顯示的 127.0.0.1 網址。'});return;}
  if(req.headers['sec-fetch-site']==='cross-site'){json(403,{error:'禁止跨站請求'});return;}
  let pathname;try{pathname=decodeURIComponent(new URL(req.url,origin).pathname);}catch{json(400,{error:'無效網址'});return;}
  if(!editor&&(pathname==='/editor'||pathname.startsWith('/editor/')||pathname.startsWith('/api/'))){
   res.writeHead(404,{'Content-Type':mime['.html']});res.end(req.method==='HEAD'?'':await readFile(path.join(ROOT,'dist/404.html')));return;
  }
  if(pathname.startsWith('/api/')){
   if(req.headers['x-editor-token']!==token||req.method==='POST'&&req.headers.origin!==origin){json(403,{error:'編輯連線已失效，請重新開啟本機編輯器。'});return;}
   try{
    if(req.method==='GET'&&pathname==='/api/content'){const data=await loadContent();json(200,{data,revision:digest(data)});return;}
    if(req.method!=='POST'){json(405,{error:'不支援的操作'});return;}
    if(!req.headers['content-type']?.startsWith('application/json')){json(415,{error:'請使用 JSON 格式'});return;}
    let size=0;const chunks=[];for await(const chunk of req){size+=chunk.length;if(size>16*1024*1024){json(413,{error:'資料過大。圖片最多 6 MB，PDF 最多 10 MB。'});return;}chunks.push(chunk);}
    let body;try{body=JSON.parse(Buffer.concat(chunks).toString());}catch{json(400,{error:'資料不是有效的 JSON'});return;}
    if(pathname==='/api/upload'){
     if(typeof body.data!=='string'){json(400,{error:'缺少檔案內容'});return;}
     if(body.kind!==undefined&&!['image','pdf'].includes(body.kind)){json(400,{error:'不支援的上傳欄位'});return;}
     const buffer=Buffer.from(body.data,'base64'),ext=uploadType(buffer);
     if(!ext){json(400,{error:'檔案格式無法辨識。請選擇 PNG、JPEG、WebP、GIF 圖片或 PDF。'});return;}
     const kind=ext==='pdf'?'pdf':'image';
     if(body.kind&&body.kind!==kind){json(400,{error:body.kind==='pdf'?'這個欄位只能上傳 PDF。':'這個欄位只能上傳 PNG、JPEG、WebP 或 GIF 圖片。'});return;}
     if(buffer.length>(kind==='pdf'?10:6)*1024*1024){json(413,{error:kind==='pdf'?'PDF 上限為 10 MB。':'圖片上限為 6 MB。'});return;}
     if(saving){json(409,{error:'網站正在儲存，請完成後再上傳檔案。'});return;}
     const file=`uploads/${randomUUID()}.${ext}`;
     pendingUploads++;
     try{
      await mkdir(path.join(ROOT,'public/uploads'),{recursive:true});await writeFile(path.join(ROOT,'public',file),buffer);await mkdir(path.join(ROOT,'dist/uploads'),{recursive:true});await writeFile(path.join(ROOT,'dist',file),buffer);
      json(200,{path:file,type:ext,size:buffer.length});
     }finally{pendingUploads--;}
     return;
    }
    if(pathname==='/api/save'){
     if(saving){json(409,{error:'正在儲存，請稍後再試。'});return;}
     if(pendingUploads){json(409,{error:'檔案正在上傳，請完成後再儲存。'});return;}
     saving=true;const stage=path.join(ROOT,`.build-${randomUUID()}`);
     let original;
     try{
      original=await loadContent();
      if(body.revision!==digest(original)){json(409,{error:'內容已在其他視窗或檔案中變更。請先保留未儲存文字，再重新載入編輯器。'});return;}
      const errors=validate(body.data||{});if(errors.length){json(400,{error:errors.join('\n')});return;}
      await build({data:body.data,outDir:stage});
      for(const [key,value]of Object.entries(body.data)){const f=path.join(DATA,`${key}.json`);await writeFile(`${f}.tmp`,JSON.stringify(value,null,2)+'\n');await rename(`${f}.tmp`,f);}
      // Generated output is disposable; the independent content files are the source of truth.
      await rm(path.join(ROOT,'dist'),{recursive:true,force:true});await rename(stage,path.join(ROOT,'dist'));
      json(200,{revision:digest(body.data),message:'已儲存並更新本機預覽。尚未推送至 GitHub。'});
     }catch(err){
      if(original){for(const [key,value]of Object.entries(original))await writeFile(path.join(DATA,`${key}.json`),JSON.stringify(value,null,2)+'\n');await build({data:original}).catch(()=>{});}
      throw err;
     }finally{saving=false;await rm(stage,{recursive:true,force:true});}
     return;
    }
    json(404,{error:'找不到此功能'});return;
   }catch(err){json(500,{error:`無法完成操作：${err.message}`});return;}
  }
  if(!['GET','HEAD'].includes(req.method)){json(405,{error:'不支援的操作'});return;}
  try{
   let file;
   if(pathname==='/editor'||pathname==='/editor/'){
    const html=(await readFile(path.join(ROOT,'editor/index.html'),'utf8')).replace('__EDITOR_TOKEN__',token);
    res.writeHead(200,{'Content-Type':mime['.html'],'Cache-Control':'no-store','Content-Security-Policy':"default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'"});res.end(req.method==='HEAD'?'':html);return;
   }
   if(pathname.startsWith('/editor/')){
    if(!['/editor/editor.js','/editor/editor.css','/editor/schema.js','/editor/ui-schema.js'].includes(pathname)){json(404,{error:'找不到檔案'});return;}
    file=path.join(ROOT,pathname.slice(1));
   }else{
    const root=path.join(ROOT,'dist');file=path.resolve(root,'.'+pathname);
    if(file!==root&&!file.startsWith(root+path.sep)){json(403,{error:'無效路徑'});return;}
    if((await stat(file)).isDirectory())file=path.join(file,'index.html');
   }
   const content=await readFile(file),extension=path.extname(file).toLowerCase();
   if(extension==='.pdf'){res.setHeader('X-Frame-Options','SAMEORIGIN');res.setHeader('Content-Security-Policy',"frame-ancestors 'self'");}
   res.writeHead(200,{'Content-Type':mime[extension]||'application/octet-stream','Cache-Control':'no-store'});res.end(req.method==='HEAD'?'':content);
  }catch{res.writeHead(404,{'Content-Type':mime['.html']});res.end(await readFile(path.join(ROOT,'dist/404.html')));}
 });
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',resolve);});
 return server;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const editor=!process.argv.includes('--public');
 startServer({port:Number(process.env.MYPAGE_PORT||4173),editor}).then(server=>{
  const url=`http://127.0.0.1:${server.address().port}`;
  console.log(`\nWebsite: ${url}${editor?`\nEditor:  ${url}/editor/`:''}\n\nKeep this window open while previewing. Ctrl+C to stop.\n`);

 }).catch(err=>{console.error(err.code==='EADDRINUSE'?'Port 4173 is in use. Close the previous editor window, or set MYPAGE_PORT.':err.message);process.exitCode=1;});
}
