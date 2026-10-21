const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = path.resolve(__dirname, '../exam-engine.js');
function engine() { assert.ok(fs.existsSync(source), 'Falta el motor compartido de sorteos y sesiones'); return require(source); }
const short = Array.from({length:10}, (_,i) => ({ text:`Caso ${i}`, choices:[`Correcta ${i}`,`Error causal ${i}`,`Confusión temporal ${i}`,`Inferencia no respaldada ${i}`], answer:0, why:'La evidencia respalda la primera afirmación.' }));
test('Cada alternativa se sortea sin imponer cuotas de letras', () => {
  const E=engine();
  const orders=E.makeOrders(10, max=>max-1);
  assert.deepEqual(orders, Array.from({length:10},()=>[0,1,2,3]));
  for(const order of E.makeOrders(100)) assert.deepEqual([...order].sort(),[0,1,2,3]);
});
test('El sorteo de preguntas y alternativas conserva todos los ítems y su clave', () => {
  const E=engine(); const a=E.newShort(short, ()=>0);
  assert.equal(new Set(a.items.map(q=>q.text)).size,10);
  assert.notDeepEqual(a.items.map(q=>q.text),short.map(q=>q.text));
  for(const [i,q] of a.items.entries()) assert.equal(q.choices[a.orders[i][a.orders[i].indexOf(q.answer)]],q.choices[q.answer]);
  a.items[0].choices[0]='Copia'; assert.notEqual(short[1].choices[0],'Copia');
});
test('Retomar una prueba conserva respuestas, preguntas y letras pese a una actualización', () => {
  const E=engine(); const a={...E.newShort(short), answers:[2,...Array(9).fill(null)],flags:Array(10).fill(false),pos:4};
  const saved=JSON.parse(JSON.stringify(a));
  assert.deepEqual(E.restoreShort(saved,short.map(q=>({...q,text:'Texto actualizado'}))),a);
});
test('Las sesiones antiguas se migran con el banco anterior y sin volver a sortear', () => {
  const E=engine(); const old={answers:[0,...Array(9).fill(null)],flags:Array(10).fill(false),pos:3,orders:Array.from({length:10},()=>[2,0,3,1]),deadline:null,pausedRemaining:900000};
  const restored=E.restoreShort(old,short);
  assert.deepEqual(restored.items,short); assert.deepEqual(restored.orders,old.orders); assert.deepEqual(restored.answers,old.answers);
  assert.equal(restored.pausedRemaining,900000);
});
test('En el ensayo se mueve la clave junto con su texto, y la sesión antigua conserva sus posiciones', () => {
  const E=engine(); const bank=[{q:'Caso',opts:['Falsa1','Falsa2','Correcta','Falsa3'],k:2,why:'Evidencia',e:'H',h:'Análisis',t:'chile19'}];
  const a=E.newClassic([0],bank,()=>0);
  assert.equal(a.items[0].opts[a.items[0].k],'Correcta');
  const old=E.restoreClassic({ids:[0],answers:[2],flags:[true],pos:0,remaining:600,started:100,paused:true},bank);
  assert.deepEqual(old.items[0],bank[0]);assert.equal(old.answers[0],2);assert.equal(old.items[0].k,2);
});
test('Aplicar revisiones no modifica los bancos usados por las sesiones antiguas', () => {
  const E=engine(); const b={tema:[short]};const original=JSON.stringify(b);
  const r=E.reviewShort(b,{'tema/1/1':{choices:['Nueva correcta','Error1','Error2','Error3'],why:'Nueva evidencia'}});
  assert.equal(JSON.stringify(b),original); assert.equal(r.tema[0][0].choices[0],'Nueva correcta');
  const classic=E.reviewClassic([{q:'Antes',opts:['a','b','c','d'],k:3}],{'1':{text:'Después',choices:['d','c','a','b'],t:'chilexx'}});
  assert.equal(classic[0].k,0);assert.equal(classic[0].t,'chilexx');
});
