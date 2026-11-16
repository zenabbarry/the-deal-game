import {GameError} from './engine.mjs';
export class SupabaseStore {
 constructor(url,key){this.url=url.replace(/\/$/,'')+'/rest/v1';this.key=key;}
 async request(path,options={}){const r=await fetch(this.url+path,{...options,signal:AbortSignal.timeout(10000),headers:{apikey:this.key,...(this.key.startsWith('sb_secret_')?{}:{Authorization:`Bearer ${this.key}`}), 'Content-Type':'application/json',...options.headers}});if(!r.ok)throw new GameError('Le service de sauvegarde est momentanément indisponible.',503);const body=await r.text();return body?JSON.parse(body):null;}
 async get(code){return (await this.request(`/deal_rooms?code=eq.${encodeURIComponent(code)}&select=version,state`))[0]||null;}
 async create(state){await this.request('/deal_rooms',{method:'POST',body:JSON.stringify({code:state.code,state,version:0}),headers:{Prefer:'return=minimal'}});}
 async cas(code,version,state){const rows=await this.request(`/deal_rooms?code=eq.${encodeURIComponent(code)}&version=eq.${version}`,{method:'PATCH',body:JSON.stringify({state,version:version+1}),headers:{Prefer:'return=representation'}});return rows.length===1;}
}
export class MemoryStore {
 constructor(){this.rooms=new Map();}
 async get(code){return structuredClone(this.rooms.get(code)||null);}
 async create(state){if(this.rooms.has(state.code))throw new Error('Collision');this.rooms.set(state.code,{state:structuredClone(state),version:0});}
 async cas(code,version,state){if(this.rooms.get(code)?.version!==version)return false;this.rooms.set(code,{state:structuredClone(state),version:version+1});return true;}
}
