const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const source=path.resolve(__dirname,'../study-storage.js');
function setup(){assert.ok(fs.existsSync(source),'Falta el guardado verificable');const data=new Map();let fail=false;const states=[];const storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>{if(fail)throw Error('Quota');data.set(k,v)},removeItem:k=>{if(fail)throw Error('Blocked');data.delete(k)}};const S=require(source).create(storage,s=>states.push(s));return {S,data,states,fail:()=>fail=true,recover:()=>fail=false};}
test('Un progreso guardado puede leerse sin cambiar su esquema existente',()=>{const{S,data}=setup();assert.equal(S.write('progress',{lessons:{a:{step:9}},results:{}}),true);assert.deepEqual(JSON.parse(data.get('progress')).lessons.a,{step:9});assert.equal(S.read('progress').lessons.a.step,9);});
test('Un error de almacenamiento se comunica y no pierde los cambios en memoria',()=>{const x=setup();x.fail();assert.equal(x.S.write('progress',{step:7}),false);assert.deepEqual(x.S.read('progress'),{step:7});assert.equal(x.states.at(-1).ok,false);x.recover();assert.equal(x.S.flush(),true);assert.deepEqual(JSON.parse(x.data.get('progress')),{step:7});assert.equal(x.states.at(-1).ok,true);});
test('La copia anterior permite recuperar datos cuando el JSON principal se corrompe',()=>{const x=setup();x.S.write('progress',{step:1});x.S.write('progress',{step:2});x.data.set('progress','{broken');assert.deepEqual(x.S.read('progress'),{step:1});});
test('No se sobrescribe silenciosamente un progreso corrupto sin respaldo',()=>{const x=setup();x.data.set('progress','{broken');assert.equal(x.S.read('progress'),null);assert.equal(x.S.write('progress',{step:0}),false);assert.equal(x.data.get('progress'),'{broken');assert.equal(x.states.at(-1).ok,false);});
test('Una eliminación fallida se reintenta sin resucitar la prueba terminada',()=>{const x=setup();x.S.write('exam',{answers:[0]});x.fail();assert.equal(x.S.remove('exam'),false);assert.equal(x.S.hasPending(),true);assert.equal(x.S.read('exam'),null);x.recover();assert.equal(x.S.flush(),true);assert.equal(x.data.has('exam'),false);});

test('Reintentar recupera un fallo transitorio de lectura sin sobrescribir datos corruptos',()=>{
  const data=new Map([['progress',JSON.stringify({step:9})]]);let denied=true;
  const storage={getItem:k=>{if(denied)throw Error('Denied');return data.get(k)??null;},setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};
  const store=require(source).create(storage);
  assert.equal(store.read('progress'),null);assert.equal(store.write('progress',{step:10}),false);
  denied=false;assert.equal(store.flush(),true);assert.deepEqual(store.read('progress'),{step:10});
  data.set('progress','{broken');data.delete('progress.backup');
  assert.equal(store.read('progress'),null);assert.equal(store.write('progress',{step:11}),false);
  assert.equal(store.flush(),false);assert.equal(data.get('progress'),'{broken');
});
