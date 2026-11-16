import {randomBytes,createHash,timingSafeEqual} from 'node:crypto';
import {GameError,newRoom,newTeam,tick,command,snapshot} from './engine.mjs';
const hash=s=>createHash('sha256').update(s).digest('hex');
const token=()=>randomBytes(32).toString('hex');
const equal=(a,b)=>timingSafeEqual(Buffer.from(hash(a)),Buffer.from(hash(b)));
export function createService(store,password,clock=()=>Date.now()){
 return async function handle(input,bearer=''){
  const now=clock();
  if(input.action==='health')return {ok:true,storage:'persistent',version:'1.0.0'};
  if(input.action==='create'){
   if(!password||typeof input.password!=='string'||!equal(input.password,password))throw new GameError('Accès présentateur refusé.',403);
   const hostToken=token(),code=randomBytes(4).toString('hex').toUpperCase();const s=newRoom(code,hash(hostToken),now);
   await store.create(s);return {code,token:hostToken};
  }
  if(!/^[A-F0-9]{8}$/.test(input.code||''))throw new GameError('Code de salon invalide.');
  for(let attempt=0;attempt<20;attempt++){
   const row=await store.get(input.code);if(!row)throw new GameError('Salon introuvable.',404);
   const s=row.state;if(now>s.expiresAt)throw new GameError('Ce salon a expiré. Créez une nouvelle partie.',410);
   let actor={role:'public'},changed=false;
   if(bearer){const h=hash(bearer);if(h===s.hostHash)actor={role:'host'};else{const team=s.teams.find(t=>t.tokenHash===h);if(!team)throw new GameError('Session non reconnue.',403);actor={role:'team',team};}}
   if(input.action==='join'){
    if(!/^[a-f0-9]{64}$/.test(input.joinToken||''))throw new GameError('Identité de connexion invalide.');
    const h=hash(input.joinToken),existing=s.teams.find(t=>t.tokenHash===h);
    if(existing)return {code:s.code,teamId:existing.id};
    if(s.phase!=='LOBBY')throw new GameError('Cette partie a déjà commencé.',409);
    if(s.teams.length>=3)throw new GameError('Ce salon accueille déjà trois équipes.',409);
    const name=String(input.name||'').trim().replace(/[\u0000-\u001f]/g,'');if(name.length<2||name.length>28)throw new GameError('Choisissez un nom de 2 à 28 caractères.');
    if(s.teams.some(t=>t.name.toLocaleLowerCase()===name.toLocaleLowerCase()))throw new GameError('Ce nom est déjà utilisé.');
    const team=newTeam(randomBytes(8).toString('hex'),name,h);s.teams.push(team);
    if(await store.cas(s.code,row.version,s))return {code:s.code,teamId:team.id};continue;
   }
   if(input.action==='resumeHost'){
    if(!password||typeof input.password!=='string'||!equal(input.password,password))throw new GameError('Accès présentateur refusé.',403);
    const hostToken=token();s.hostHash=hash(hostToken);if(await store.cas(s.code,row.version,s))return {code:s.code,token:hostToken};continue;
   }
   if(input.view==='host'&&actor.role!=='host')throw new GameError('Accès réservé au présentateur.',403);
   if(input.view==='team'&&actor.role!=='team')throw new GameError('Reconnectez votre équipe.',403);
   changed=tick(s,now);
   let commandError;
   if(input.action!=='state'){
    try{command(s,actor,input,now);changed=true;}catch(e){commandError=e;}
   }
   // Persist timeout resolution even if the incoming vote was too late.
   if(changed&&!await store.cas(s.code,row.version,s))continue;
   if(commandError)throw commandError;
   return snapshot(s,actor,now);
  }
  throw new GameError('Synchronisation occupée. Réessayez dans un instant.',409);
 };
}
