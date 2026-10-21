const {test}=require('node:test');
const assert=require('node:assert/strict');
const E=require('../exam-engine.js');

test('Cada cronología sortea los hitos conservando sus IDs y empieza sin respuestas',()=>{
  const a=E.newLessonActivity('order',4,()=>0),b=E.newLessonActivity('order',4,n=>n-1);
  assert.deepEqual([...a.order].sort(),[0,1,2,3]);assert.notDeepEqual(a.order,b.order);
  assert.deepEqual(a.picks,[]);assert.equal(a.done,false);
});
test('Las dos columnas de asociaciones se sortean independientemente',()=>{
  const draws=[0,0,0,3,2,1];const a=E.newLessonActivity('match',4,()=>draws.shift());
  assert.notDeepEqual(a.terms,a.definitions);assert.deepEqual([...a.terms].sort(),[0,1,2,3]);
  assert.deepEqual([...a.definitions].sort(),[0,1,2,3]);assert.deepEqual(a.matched,[]);assert.equal(a.selected,null);
});
test('Los chequeos tienen intentos nuevos sin cuotas y se serializan sin perder el orden',()=>{
  const a=E.newLessonActivity('choice',3,n=>n-1);a.chosen=2;
  assert.deepEqual(a.order,[0,1,2]);assert.deepEqual(JSON.parse(JSON.stringify(a)),a);
  const b=E.newLessonActivity('choice',3,()=>0);assert.notDeepEqual(a.order,b.order);
  assert.equal(b.chosen,null);assert.equal(b.done,false);
});
test('La cronología nunca aparece ya ordenada, ni con un sorteo que la dejaría igual',()=>{
  assert.notDeepEqual(E.newLessonActivity('order',4,n=>n-1).order,[0,1,2,3]);
  for(let k=0;k<300;k++)assert.notDeepEqual(E.newLessonActivity('order',4).order,[0,1,2,3]);
});
test('Las definiciones nunca quedan alineadas fila a fila con sus conceptos',()=>{
  const a=E.newLessonActivity('match',4,n=>n-1);assert.notDeepEqual(a.terms,a.definitions);
  for(let k=0;k<300;k++){const b=E.newLessonActivity('match',4);assert.notDeepEqual(b.terms,b.definitions);}
});
test('Cada intento sortea de nuevo: los órdenes varían entre intentos',()=>{
  const seen=new Set(Array.from({length:60},()=>E.newLessonActivity('order',4).order.join()));
  assert.ok(seen.size>5);
  const right=new Set(Array.from({length:60},()=>E.newLessonActivity('choice',3).order.indexOf(0)));
  assert.equal(right.size,3);
});
