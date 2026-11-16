import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {decisions} from '../server/content.mjs';
const base=process.env.GAME_URL||'http://127.0.0.1:4173';
const password=process.env.GAME_URL?JSON.parse(await readFile('.local-data/host-access.json','utf8')).password:'repetition-locale';
async function api(data,token=''){
 const r=await fetch(base+'/api/game',{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify(data),signal:AbortSignal.timeout(20000)});
 const out=await r.json();if(!r.ok)throw Object.assign(new Error(out.error),{status:r.status});return out;
}
const host=await api({action:'create',password});const code=host.code;
const tokens=[0,1,2].map(()=>randomBytes(32).toString('hex'));
await Promise.all(tokens.map((joinToken,i)=>api({action:'join',code,joinToken,name:`TEST ${['OR','ROSE','NUIT'][i]}`})));
const h=async(action,extra={})=>{const s=await api({action:'state',code,view:'host'},host.token);return api({action,code,revision:s.revision,...extra},host.token);};
await h('auto',{value:false});await h('next');await h('next');
let state;let maxSync=0;
for(let d=1;d<=15;d++){
 state=await h('next');assert.equal(state.phase,'VOTING');assert.equal(state.decision,d);
 const options=[decisions[d-1].correct,({10:1,12:1,15:1})[d]||decisions[d-1].correct,({14:3,15:1})[d]||decisions[d-1].correct];
 const start=Date.now();await Promise.all(tokens.map((token,i)=>api({action:'vote',code,decision:d,choice:options[i]},token)));
 const pub=await api({action:'state',code,view:'display'});maxSync=Math.max(maxSync,Date.now()-start);
 assert.equal(pub.teams.filter(t=>t.voted).length,3);assert.equal(pub.host,undefined);assert.equal(pub.results,undefined);
 await h('next');const privateStates=await Promise.all(tokens.map(token=>api({action:'state',code,view:'team'},token)));
 for(const s of privateStates){assert.equal(s.team.events.filter(e=>e.id===`d${d}`).length,1);assert.equal(s.scene,undefined);assert.equal(s.team.scores,undefined);}
 await assert.rejects(api({action:'vote',code,decision:d,choice:1},tokens[0]),e=>e.status===409);
 state=await h('next');if(d%5===0){assert.equal(state.phase,'CHAPTER_SUMMARY');state=await h('next');}
}
assert.equal(state.phase,'ENDINGS');assert.deepEqual(state.results.map(r=>r.ending.id),['empire','ambition','fall']);
assert.deepEqual(state.results.map(r=>r.contribution),[54000,3600,38000]);
state=await h('next');assert.deepEqual(state.leaderboard.map(r=>r.place),[3]);
state=await h('next');assert.deepEqual(state.leaderboard.map(r=>r.place),[2,3]);
state=await h('next');assert.deepEqual(state.leaderboard.map(r=>r.place),[1,2,3]);
state=await h('next');assert.equal(state.review.length,15);assert.equal(state.review.every(q=>q.answers.length===3),true);
state=await h('next');assert.equal(state.phase,'COMPLETE');
await assert.rejects(api({action:'state',code,view:'host'},tokens[0]),e=>e.status===403);
const report={url:base,date:new Date().toISOString(),decisions:15,clients:5,endings:state.results.map(r=>r.ending.id),maxConcurrentVoteRoundTripMs:maxSync,status:'PASS'};
await mkdir('.local-data',{recursive:true});await writeFile('.local-data/last-verification.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
