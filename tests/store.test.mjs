import test from 'node:test';
import assert from 'node:assert/strict';
import {SupabaseStore} from '../server/store.mjs';
test('Supabase empty insert responses and modern secret authentication',async()=>{
 const old=globalThis.fetch;let headers;
 globalThis.fetch=async(url,options)=>{headers=options.headers;return new Response(null,{status:201});};
 try{await new SupabaseStore('https://example.test','sb_secret_test').create({code:'ABCDEF12'});assert.equal(headers.apikey,'sb_secret_test');assert.equal(headers.Authorization,undefined);}finally{globalThis.fetch=old;}
});
