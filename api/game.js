import {SupabaseStore} from '../server/store.mjs';
import {createService} from '../server/service.mjs';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST'){res.status(405).json({error:'Utilisez POST.'});return;}
 const origin=req.headers.origin;if(origin&&new URL(origin).host!==req.headers.host){res.status(403).json({error:'Origine refusée.'});return;}
 if(!process.env.SUPABASE_URL||!process.env.SUPABASE_SERVICE_ROLE_KEY||!process.env.HOST_PASSWORD){res.status(503).json({error:'La préparation du serveur n’est pas terminée.'});return;}
 try{
  const input=typeof req.body==='string'?JSON.parse(req.body):req.body;
  if(!input||JSON.stringify(input).length>4096){res.status(400).json({error:'Requête invalide.'});return;}
  const service=createService(new SupabaseStore(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY),process.env.HOST_PASSWORD);
  const out=await service(input,(req.headers.authorization||'').replace(/^Bearer /,''));res.status(200).json(out);
 }catch(e){res.status(e.status||500).json({error:e.status?e.message:'Erreur momentanée. Vos données enregistrées sont conservées.'});}
}
