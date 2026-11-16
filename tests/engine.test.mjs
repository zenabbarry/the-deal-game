import test from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {decisions} from '../server/content.mjs';
import {newTeam,applyDecision,result,finances,newRoom,advance,tick,snapshot} from '../server/engine.mjs';
import {MemoryStore} from '../server/store.mjs';
import {createService} from '../server/service.mjs';
const perfect=decisions.map(d=>d.correct);
function play(overrides={}){const t=newTeam('one','AURA','hash');perfect.forEach((a,i)=>applyDecision(t,i+1,overrides[i+1]??a));return t;}
test('Four specified financial routes and all four endings',()=>{
 const routes=[ [{},54000,'empire'],[{10:1},38000,'rising'],[{10:1,12:1,15:1},3600,'ambition'],[{10:1,12:1,13:1,14:3,15:1},-14400,'fall'] ];
 for(const [choices,amount,ending] of routes){const r=result(play(choices));assert.equal(r.contribution,amount);assert.equal(r.ending.id,ending);}
});
test('Financial state is independent of pedagogical points and does not double-apply',()=>{
 const t=play({10:1,12:1});const before=structuredClone(t);applyDecision(t,10,1);assert.deepEqual(t,before);assert.equal(t.price,183600);assert.equal(t.events.filter(e=>e.id==='twist-discount').length,1);assert.equal(t.events.filter(e=>e.id==='twist-crisis').length,1);
 const r=result(t);assert.equal(r.signed,false);assert.equal(r.outcome,'Négociation ajournée');
});
test('No answer never invents a financial commitment',()=>{
 const t=newTeam('a','A','h');for(let i=1;i<=15;i++)applyDecision(t,i,0);assert.equal(t.price,240000);assert.equal(t.extra,0);assert.equal(t.financing,0);assert.equal(result(t).signed,false);assert.equal(t.summaries.length,3);
});
test('Refusing a viable contract adds 8 points penalty, a dangerous offer does not',()=>{
 assert.deepEqual(result(play({15:3})).penalties,[['Refus d’un contrat viable',8]]);
 assert.equal(result(play({10:1,12:1,15:3})).penalties.length,0);
});
test('Exact threshold and clamp boundaries',()=>{
 const t=play();t.scores=[50,50,65,65];t.price=200000;t.costs=160000;t.extra=0;t.financing=0;assert.equal(result(t).ending.id,'empire');t.costs=184000;assert.equal(result(t).signed,true);t.costs=184001;assert.equal(result(t).signed,false);
 assert.ok(play().scores.every(n=>n>=0&&n<=100));
});
test('Automatic schedule including 90-second lobby finishes within 20 minutes',()=>{
 const s=newRoom('ABCDEF12','h',0);s.teams=[1,2,3].map(n=>newTeam(''+n,'Team '+n,'h'+n));advance(s,0);let now=0,phases=[];
 while(s.deadline){now=s.deadline;phases.push(s.phase);tick(s,now);}
 assert.equal(s.phase,'COMPLETE');assert.ok(now+90000<=1200000,`Total ${(now+90000)/1000}s`);assert.equal(s.teams[0].summaries.length,3);assert.equal(Object.keys(s.teams[0].answers).length,15);
 assert.equal(phases.filter(p=>p==='CHAPTER_SUMMARY').length,3);
});
async function setup(){let now=1000;const store=new MemoryStore();const service=createService(store,'test-password',()=>now);const host=await service({action:'create',password:'test-password'});const tokens=[1,2,3].map(()=>randomBytes(32).toString('hex'));
 const teams=await Promise.all(tokens.map((joinToken,i)=>service({action:'join',code:host.code,name:'Team '+i,joinToken})));
 const h=async(action,extra={})=>{const st=await service({action:'state',code:host.code},host.token);return service({action,code:host.code,revision:st.revision,...extra},host.token);};
 return {store,service,host,tokens,teams,h,setNow:n=>now=n};}
test('Concurrent joins respect capacity and are idempotent',async()=>{
 const {service,host,tokens}=await setup();await assert.rejects(service({action:'join',code:host.code,name:'fourth',joinToken:randomBytes(32).toString('hex')}),/trois équipes/);
 await service({action:'join',code:host.code,name:'same',joinToken:tokens[0]});const s=await service({action:'state',code:host.code});assert.equal(s.teams.length,3);
});
test('Three independent clients: concurrent votes, duplicate rejection, private feedback and reconnect',async()=>{
 const {service,host,tokens,h}=await setup();await h('auto',{value:false});await h('next');await h('next');await h('next');
 const cast=(i,c)=>service({action:'vote',code:host.code,decision:1,choice:c},tokens[i]);
 await Promise.all([cast(0,1),cast(1,2),cast(2,3),cast(0,1)]);await assert.rejects(cast(0,2),/déjà validée/);
 const pub=await service({action:'state',code:host.code});assert.equal(pub.teams.filter(t=>t.voted).length,3);assert.equal(pub.host,undefined);assert.equal(pub.team,undefined);assert.equal(pub.results,undefined);assert.ok(!JSON.stringify(pub).includes('tokenHash'));
 await h('next');const clients=await Promise.all(tokens.map(t=>service({action:'state',code:host.code,view:'team'},t)));
 assert.equal(new Set(clients.map(c=>c.team.events[0].text)).size,3);for(const c of clients){assert.equal(c.scene,undefined);assert.equal(c.team.scores,undefined);assert.equal(c.host,undefined);}
 const again=await service({action:'state',code:host.code},tokens[0]);assert.deepEqual(again.team,clients[0].team);
 await assert.rejects(service({action:'next',code:host.code,revision:pub.revision},tokens[0]),/présentateur/);
 await assert.rejects(service({action:'state',code:host.code,view:'host'},tokens[0]),/présentateur/);
});
test('Late vote closes once and records neutral no-answer',async()=>{
 const {service,host,tokens,h,setNow,store}=await setup();await h('auto',{value:false});await h('next');await h('next');const open=await h('next');setNow(open.deadline);
 await assert.rejects(service({action:'vote',code:host.code,decision:1,choice:2},tokens[0]),/fermé/);
 const s=(await store.get(host.code)).state;assert.equal(s.phase,'FEEDBACK');assert.equal(s.teams[0].answers[1],0);assert.deepEqual(s.teams[0].scores,[47,50,48,46]);
});
test('Concurrent host transitions cannot skip a phase',async()=>{
 const {service,host,h}=await setup();await h('auto',{value:false});const before=await service({action:'state',code:host.code},host.token);
 const results=await Promise.allSettled([1,2].map(()=>service({action:'next',code:host.code,revision:before.revision},host.token)));
 assert.equal(results.filter(x=>x.status==='fulfilled').length,1);assert.equal((await service({action:'state',code:host.code})).phase,'BRIEFING');
});
test('Pause freezes server deadline and rejects votes until resumed',async()=>{
 const {service,host,tokens,h,setNow}=await setup();await h('next');await h('next');const voting=await h('next');await h('pause');setNow(voting.deadline+60000);await assert.rejects(service({action:'vote',code:host.code,decision:1,choice:2},tokens[0]),/fermé/);const r=await h('pause');assert.ok(r.deadline>voting.deadline);assert.equal(r.phase,'VOTING');
});
test('Cross-room credentials and wrong host password are refused',async()=>{
 const {service,tokens}=await setup();await assert.rejects(service({action:'create',password:'wrong'}),/refusé/);const b=await service({action:'create',password:'test-password'});await assert.rejects(service({action:'state',code:b.code},tokens[0]),/non reconnue/);
});
