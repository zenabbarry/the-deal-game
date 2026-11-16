import {decisions,chapters,cast,endings} from './content.mjs';
export class GameError extends Error {constructor(message,status=400){super(message);this.status=status;}}
const fail=(s,status)=>{throw new GameError(s,status)};
const clamp=n=>Math.max(0,Math.min(100,n));
export function newTeam(id,name,tokenHash){return {id,name,tokenHash,scores:[50,50,50,50],answers:{},events:[],summaries:[],flags:{},price:240000,costs:174000,extra:0,financing:0,seenAt:0,ready:false};}
export function finances(t){const contribution=t.price-t.costs-t.extra-t.financing;return {price:t.price,costs:t.costs,extra:t.extra,financing:t.financing,contribution,rate:contribution/t.price};}
export function result(t){
 const f=finances(t),choice=t.answers[15],concealed=!!t.flags.crisisConcealed;
 const viable=f.price<=230000 && f.rate>=.08 && t.scores[2]>=35 && !concealed;
 const signed=!concealed && f.price<=230000 && (choice===1 || (choice===2 && viable));
 let ending=1;
 if(concealed || (signed&&f.contribution<=0) || (!signed&&t.scores[2]<25)) ending=3;
 else if(signed&&f.rate<.08)ending=2;
 else if(signed&&f.rate>=.20&&t.scores[2]>=65&&t.scores[3]>=65)ending=0;
 const penalties=[];
 if(signed&&f.contribution<=0)penalties.push(['Contrat déficitaire',25]);
 else if(signed&&f.rate<.08)penalties.push(['Contribution inférieure à 8 %',12]);
 if(concealed)penalties.push(['Crise dissimulée',15]);
 if(choice===3&&viable)penalties.push(['Refus d’un contrat viable',8]);
 const base=t.scores.reduce((a,b)=>a+b)/4;
 return {id:t.id,name:t.name,...f,scores:t.scores,base,penalties,score:clamp(base-penalties.reduce((s,p)=>s+p[1],0)),signed,viable,outcome:signed?'Contrat conclu':choice===3?'Projet refusé':concealed?'Rupture de confiance':'Négociation ajournée',ending:endings[ending]};
}
export function rank(teams){return teams.map(result).sort((a,b)=>b.score-a.score||b.scores[3]-a.scores[3]||b.contribution-a.contribution||b.scores[2]-a.scores[2]||a.id.localeCompare(b.id));}
const event=(t,id,text)=>{if(!t.events.some(e=>e.id===id))t.events.push({id,text,read:false});};
export function applyDecision(t,n,choice){
 if(Object.hasOwn(t.answers,n))return;
 const q=decisions[n-1];t.answers[n]=choice;t.ready=false;
 const delta=choice===0?[-3,0,-2,-4]:q.impacts[choice-1];
 t.scores=t.scores.map((v,i)=>clamp(v+delta[i]));
 event(t,`d${n}`,choice===0?'Votre équipe n’a pas pris de décision à temps. Cette absence a ralenti le processus commercial et réduit votre capacité à défendre votre position.':q.messages[choice-1]);
 const flags={1:{2:['contactQualified']},2:{3:['gatekeeperConflict']},3:{2:['pricePromise']},4:{2:['followUpAgreed','earlyOperationsSignal']},5:{3:['professionalFollowUp']},6:{1:['needsExplored']},7:{2:['operationalPriorityKnown']},8:{1:['budgetUnderstood']},9:{3:['valueDemonstrated']},10:{1:['earlyDiscount'],2:['scopeDiscussionOpened']},11:{1:['alignmentPromised'],2:['competitorScopeVerified']},12:{2:['scopeOptimized']},14:{2:['crisisManaged'],3:['crisisConcealed']}};
 for(const flag of flags[n]?.[choice]||[])t.flags[flag]=true;
 if(n===9&&choice===3&&t.flags.operationalPriorityKnown)t.scores[2]=clamp(t.scores[2]+3);
 if(n===10&&choice===1)t.price=Math.round(t.price*.85);
 if(n===12&&choice===1)t.price=Math.round(t.price*.9);
 if(n===12&&choice===2){t.price=t.flags.earlyDiscount?204000:220000;t.costs=160000;}
 if(n===13&&choice===1)t.financing=2000;
 if(n===14&&choice)t.extra=[18000,6000,22000][choice-1];
 if(n===11)event(t,'twist-discount',t.flags.earlyDiscount?'FINANCE ALERT — Votre remise a ramené l’offre à 204 000 € HT. À coûts inchangés, la contribution est passée de 66 000 € à 30 000 €, avant même de comparer les prestations.':'Votre marge n’a pas été affectée par une remise automatique de 15 %. Les prochaines décisions détermineront sa viabilité.');
 if(n===14&&t.flags.scopeOptimized)event(t,'twist-crisis','L’ajustement précédent du périmètre a réduit vos coûts directs. Vous disposez de davantage de marge de manœuvre pour gérer cette difficulté.');
 else if(n===14&&t.flags.earlyDiscount)event(t,'twist-crisis','Votre marge était déjà réduite par une concession tarifaire. Ce nouvel imprévu fragilise désormais votre capacité à livrer le projet.');
 if(n%5===0){
  const c=n/5-1,points=Array.from({length:5},(_,i)=>t.answers[c*5+i+1]===decisions[c*5+i].correct?2:0).reduce((a,b)=>a+b);
  const titles=[['MISSED OPPORTUNITY','SECOND CHANCE','FIRST IMPRESSION'],['THE BLIND SPOT','PARTIAL UNDERSTANDING','CLIENT INSIGHT']];
  const messages=[['Votre prospection n’a pas permis de décrocher directement un rendez-vous. Votre crédibilité doit être reconstruite.','Votre prospection a été irrégulière. Votre candidature reste envisageable.','Vous avez obtenu un rendez-vous grâce à une prospection structurée.'],['Vous négociez avec trop d’hypothèses et pas assez d’informations vérifiées.','Votre compréhension du client reste incomplète. Certains points pourraient fragiliser votre proposition.','Vous avez identifié les priorités de VESPER et ses contraintes.']];
  const band=points>=8?2:points>=4?1:0;
  t.summaries.push(c<2?{chapter:c+1,title:titles[c][band],text:messages[c][band],notes:c===1?[t.flags.operationalPriorityKnown?'Priorité opérationnelle identifiée.':'Priorité opérationnelle insuffisamment approfondie.','Budget commun confirmé : 230 000 € HT.',t.flags.earlyDiscount?'Remise de 15 % engagée.':'Aucune remise anticipée.']:t.flags.pricePromise?['Votre promesse tarifaire reste à justifier.']:[]}:{chapter:3,title:'FINAL BUSINESS REPORT',text:'Vos décisions ont construit cette offre. Une contribution directe ne constitue pas un bénéfice net.',notes:[]});
 }
}
export function newRoom(code,hostHash,now){return {code,hostHash,createdAt:now,expiresAt:now+86400000,phase:'LOBBY',decision:1,line:0,teams:[],votes:{},revision:0,auto:true,paused:false,phaseAt:now,deadline:null,startedAt:null,reveal:0};}
const duration=s=>({BRIEFING:15,DIALOGUE:decisions[s.decision-1].lines.length===4?20:16,VOTING:decisions[s.decision-1].seconds,FEEDBACK:7,CHAPTER_SUMMARY:s.decision===15?10:20,ENDINGS:45,LEADERBOARD:45,REVIEW:120}[s.phase]||0)*1000;
function phase(s,p,now){s.phase=p;s.phaseAt=now;s.deadline=duration({...s,phase:p})?now+duration({...s,phase:p}):null;s.line=0;}
export function advance(s,now){
 switch(s.phase){
 case 'LOBBY':if(s.teams.length!==3)fail('Les trois équipes doivent être inscrites.');s.startedAt=now;phase(s,'BRIEFING',now);break;
 case 'BRIEFING':phase(s,'DIALOGUE',now);break;
 case 'DIALOGUE':phase(s,'VOTING',now);s.votes={};break;
 case 'VOTING':for(const t of s.teams)applyDecision(t,s.decision,s.votes[t.id]??0);phase(s,'FEEDBACK',now);break;
 case 'FEEDBACK':if(s.decision%5===0)phase(s,'CHAPTER_SUMMARY',now);else{s.decision++;phase(s,'DIALOGUE',now);}break;
 case 'CHAPTER_SUMMARY':if(s.decision===15)phase(s,'ENDINGS',now);else{s.decision++;phase(s,'DIALOGUE',now);}break;
 case 'ENDINGS':phase(s,'LEADERBOARD',now);s.reveal=1;break;
 case 'LEADERBOARD':if(s.reveal<3){s.reveal++;s.deadline=now+15000;}else phase(s,'REVIEW',now);break;
 case 'REVIEW':phase(s,'COMPLETE',now);break;
 default:fail('La partie est terminée.');
 }
 s.revision++;
}
export function tick(s,now){
 if(s.paused||!s.deadline)return false;
 let changed=false;
 // Timers are server authoritative; no client can extend a voting window.
 if(s.phase==='VOTING'&&now>=s.deadline){advance(s,s.deadline);changed=true;}
 if(!s.auto)return changed;
 for(let i=0;i<100&&s.deadline&&now>=s.deadline;i++){advance(s,s.deadline);changed=true;}
 return changed;
}
export function command(s,actor,input,now){
 if(input.action==='vote'){
  const team=actor.role==='host'?s.teams.find(t=>t.id===input.teamId):actor.team;
  if(!team)fail('Équipe non autorisée.',403);
  if(input.decision!==s.decision||s.phase!=='VOTING'||s.paused||now>=s.deadline)fail('Ce vote est fermé.',409);
  if(![1,2,3].includes(input.choice))fail('Réponse invalide.');
  if(Object.hasOwn(s.votes,team.id)){if(s.votes[team.id]===input.choice)return;fail('Votre réponse est déjà validée.',409);}
  s.votes[team.id]=input.choice;team.seenAt=now;return;
 }
 if(input.action==='ready'){
  if(actor.role!=='team')fail('Équipe requise.',403);
  if(input.decision!==s.decision||!['FEEDBACK','CHAPTER_SUMMARY'].includes(s.phase))fail('Ce retour est terminé.',409);
  actor.team.ready=true;actor.team.events.forEach(e=>e.read=true);return;
 }
 if(actor.role!=='host')fail('Accès réservé au présentateur.',403);
 if(input.revision!==s.revision)fail('La partie a avancé. Votre écran a été actualisé.',409);
 if(input.action==='next'){if(s.paused)fail('Reprenez la partie avant de continuer.');advance(s,now);}
 else if(input.action==='line'){if(s.phase!=='DIALOGUE')fail('Aucun dialogue en cours.');s.line=Math.min(decisions[s.decision-1].lines.length-1,s.line+1);s.revision++;}
 else if(input.action==='pause'){s.paused=!s.paused;if(s.paused)s.pausedAt=now;else{const d=now-s.pausedAt;s.phaseAt+=d;if(s.deadline)s.deadline+=d;s.pausedTotal=(s.pausedTotal||0)+d;}s.revision++;}
 else if(input.action==='auto'){s.auto=!!input.value;s.revision++;if(s.auto&&s.deadline&&s.deadline<now)s.deadline=now+duration(s);}
 else fail('Commande inconnue.');
}
export function snapshot(s,actor,now){
 const q=decisions[s.decision-1],final=['ENDINGS','LEADERBOARD','REVIEW','COMPLETE'].includes(s.phase),review=['REVIEW','COMPLETE'].includes(s.phase);
 const line=s.phase==='VOTING'?q.lines.length-1:s.auto&&s.phase==='DIALOGUE'?Math.max(s.line,Math.min(q.lines.length-1,Math.floor(((s.paused?s.pausedAt:now)-s.phaseAt)/((duration(s))/q.lines.length)))):s.line;
 const out={code:s.code,phase:s.phase,decision:s.decision,chapter:Math.ceil(s.decision/5),chapterTitle:chapters[Math.ceil(s.decision/5)-1],revision:s.revision,auto:s.auto,paused:s.paused,deadline:s.deadline,serverNow:now,startedAt:s.startedAt,line,reveal:s.reveal,role:actor.role,teams:s.teams.map(t=>({id:t.id,name:t.name,voted:Object.hasOwn(s.votes,t.id),ready:t.ready})),cast};
 if(actor.role!=='team')out.scene={title:q.title,lines:q.lines,options:q.options,document:q.document};
 if(actor.role==='team'){
  const t=actor.team;out.team={id:t.id,name:t.name,vote:s.votes[t.id]??null,ready:t.ready,events:t.events,summaries:t.summaries};
  if(s.decision===15||final)out.team.finances={...finances(t),extra:t.flags.crisisConcealed&&!final?null:t.extra,contribution:t.flags.crisisConcealed&&!final?null:finances(t).contribution,rate:t.flags.crisisConcealed&&!final?null:finances(t).rate};
  if(final)out.team.result=result(t);
 }
 if(actor.role==='host'){
  out.host={teams:s.teams.map(t=>({id:t.id,name:t.name,answers:t.answers,scores:t.scores,finances:finances(t),vote:s.votes[t.id]??null})),review:decisions.map((d,i)=>({n:i+1,title:d.title,skill:d.skill,correct:d.correct,review:d.review,options:d.options,lines:d.lines}))};
 }
 if(final){const ranking=rank(s.teams);out.results=actor.role==='team'?[result(actor.team)]:s.teams.map(result);if(s.phase!=='ENDINGS')out.leaderboard=s.phase==='LEADERBOARD'?ranking.slice(3-s.reveal).map((r,i)=>({...r,place:4-s.reveal+i})):ranking.map((r,i)=>({...r,place:i+1}));}
 if(review&&actor.role!=='team')out.review=decisions.map((d,i)=>({n:i+1,title:d.title,skill:d.skill,correct:d.correct,review:d.review,options:d.options,lines:d.lines,answers:s.teams.map(t=>({name:t.name,choice:t.answers[i+1]}))}));
 return out;
}
