const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const vm=require('node:vm');
const read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
const ctx={window:{},console};vm.createContext(ctx);
for(const f of ['content.js','questions.js','questions-plus.js','clasico/banco-paes.js','exam-engine.js','review-history.js','review-citizenship.js','review-economy.js'])vm.runInContext(read(f),ctx);
vm.runInContext(read('clasico/app.js').split('const WEIGHTS=')[0]+';globalThis.classicQ=Q;globalThis.legacyQ=LEGACY_Q;',ctx);
const bank=ctx.window.PAES_EXAM.reviewShort(ctx.window.PAES_TEST_BANK,ctx.window.PAES_REVIEW.short);
const classic=ctx.classicQ;
test('Se revisaron las 374 preguntas y todos los IDs corresponden a su banco',()=>{
 assert.equal(Object.keys(ctx.window.PAES_REVIEW.short).length,270);assert.equal(Object.keys(ctx.window.PAES_REVIEW.classic).length,104);
 for(const [id,p]of Object.entries(ctx.window.PAES_REVIEW.short)){const[t,l,n]=id.split('/');assert.ok(ctx.window.PAES_TEST_BANK[t]?.[l-1]?.[n-1],id);assert.equal(p.choices.length,4,id);}
 for(const id of Object.keys(ctx.window.PAES_REVIEW.classic))assert.ok(ctx.legacyQ[Number(id)-1],id);
});
test('Todos los ítems actuales conservan cuatro alternativas distintas y explicación',()=>{
 const all=[...Object.values(bank).flat(2).map(q=>({text:q.text,choices:q.choices,k:q.answer,why:q.why})),...classic.map(q=>({text:q.q,choices:q.opts,k:q.k,why:q.why}))];assert.equal(all.length,374);
 for(const q of all){assert.ok(q.text.trim());assert.equal(q.choices.length,4);assert.equal(new Set(q.choices.map(x=>x.trim().toLocaleLowerCase('es-CL'))).size,4,q.text);assert.ok(q.choices.every(x=>typeof x==='string'&&x.trim()));assert.equal(q.k,0);assert.ok(q.why.trim());}
});
test('Se distinguen volumen comercial, distribución de beneficios e ideales compartidos',()=>{
 assert.match(bank.guerr_fria[2][7].text,/volumen real/);
 assert.match(bank.liberalismo[2][6].text,/compartieron ideales/);
 assert.match(bank.guerr_fria[2][3].text,/objeción metodológica/);
 assert.match(bank.guerr_fria[0][2].why,/guerra general directa/);
});
test('Las dos clasificaciones históricas discordantes se vinculan a Chile del siglo XX',()=>{
 assert.equal(classic[29].t,'chilexx');assert.equal(classic[82].t,'chilexx');
 assert.match(classic[29].src,/cincuenta|1950/);
});
test('Los modelos económicos explicitan las condiciones que sostienen sus claves',()=>{
 assert.match(bank.mercado[2][3].text,/marginales/);
 assert.match(bank.mercado[2][3].choices[0],/precio.*aumenta.*cantidad/);
 assert.match(classic[102].q,/mismo monto y plazo/);
});
test('No hay un recurso general a anacronismos ajenos al tema para descartar alternativas',()=>{
 const words=/satélites|inteligencia artificial|5G|fibra óptica|Unión Europea/;
 for(const id of ['liberalismo','chile19'])for(const qs of bank[id])for(const q of qs)assert.ok(!q.choices.slice(1).some(x=>words.test(x)),q.text);
});
