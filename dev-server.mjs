import {createServer as viteServer} from 'vite';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile,rename} from 'node:fs/promises';
import {MemoryStore} from './server/store.mjs';
import {createService} from './server/service.mjs';
// Local rehearsal survives restarts; never used by the deployed handler.
const store=new MemoryStore();
try{store.rooms=new Map(JSON.parse(await readFile('.local-data/rooms.json','utf8')));}catch{}
let saving=Promise.resolve();const original=store.cas.bind(store),create=store.create.bind(store);
function save(){const data=JSON.stringify([...store.rooms]);saving=saving.then(async()=>{await mkdir('.local-data',{recursive:true});await writeFile('.local-data/rooms.tmp',data);await rename('.local-data/rooms.tmp','.local-data/rooms.json');});return saving;}
store.cas=async(...args)=>{const ok=await original(...args);if(ok)await save();return ok;};store.create=async(...args)=>{await create(...args);await save();};
const service=createService(store,process.env.HOST_PASSWORD||'repetition-locale');
const vite=await viteServer({server:{middlewareMode:true},appType:'spa'});
createServer(async(req,res)=>{
 if(req.url==='/api/game'){
  res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');
  try{if(req.method!=='POST')throw new Error('POST requis');let body='';for await(const c of req){body+=c;if(body.length>4096)throw new Error('Requête trop grande');}const out=await service(JSON.parse(body),(req.headers.authorization||'').replace(/^Bearer /,''));res.end(JSON.stringify(out));}catch(e){res.statusCode=e.status||400;res.end(JSON.stringify({error:e.message}));}
 }else vite.middlewares(req,res);
}).listen(4173,'127.0.0.1',()=>console.log('THE DEAL rehearsal: http://127.0.0.1:4173'));
