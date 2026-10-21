/* Sorteo por intento y copias estables para conservar sesiones anteriores. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.PAES_EXAM=api;
})(typeof window==='object'?window:globalThis,function(){
  'use strict';
  const copy=value=>JSON.parse(JSON.stringify(value));
  function randomInt(max){
    if(globalThis.crypto?.getRandomValues){
      const range=0x100000000,limit=range-range%max,buffer=new Uint32Array(1);
      do{globalThis.crypto.getRandomValues(buffer);}while(buffer[0]>=limit);
      return buffer[0]%max;
    }
    return Math.floor(Math.random()*max);
  }
  function shuffle(values,draw=randomInt){
    const result=[...values];
    for(let i=result.length-1;i>0;i--){const j=draw(i+1);[result[i],result[j]]=[result[j],result[i]];}
    return result;
  }
  const makeOrders=(count,draw=randomInt)=>Array.from({length:count},()=>shuffle([0,1,2,3],draw));
  const isOrder=(order,count)=>Array.isArray(order)&&order.length===count&&new Set(order).size===count&&order.every(n=>Number.isInteger(n)&&n>=0&&n<count);
  const swapFirst=list=>{if(list.length>1)[list[0],list[1]]=[list[1],list[0]];return list;};
  const sameOrder=(a,b)=>a.every((n,i)=>n===b[i]);
  // Sin sorteos que regalen la respuesta: ni hitos ya ordenados ni definiciones alineadas fila a fila.
  function newLessonActivity(kind,count,draw=randomInt){
    const ids=Array.from({length:count},(_,i)=>i);
    if(kind==='match'){
      const terms=shuffle(ids,draw),definitions=shuffle(ids,draw);
      if(sameOrder(terms,definitions))swapFirst(definitions);
      return {done:false,terms,definitions,matched:[],selected:null};
    }
    if(kind==='order'){const order=shuffle(ids,draw);if(sameOrder(order,ids))swapFirst(order);return {done:false,order,picks:[]};}
    return {done:false,order:shuffle(ids,draw),chosen:null};
  }
  function newShort(questions,draw=randomInt){
    const questionOrder=shuffle(questions.map((_,i)=>i),draw);
    return {items:questionOrder.map(i=>copy(questions[i])),questionOrder,orders:makeOrders(questions.length,draw),bankVersion:'review-2027-v2'};
  }
  function restoreShort(saved,legacyQuestions){
    const result=copy(saved);
    if(!result.items)result.items=copy(legacyQuestions);
    if(!result.orders)result.orders=result.items.map(()=>[0,1,2,3]);
    if(result.items.length!==result.answers.length||result.orders.length!==result.items.length||result.orders.some(o=>!isOrder(o,4)))throw Error('La sesión guardada contiene un orden de alternativas inválido.');
    return result;
  }
  function newClassic(ids,bank,draw=randomInt){
    return {items:ids.map(id=>{
      const item=copy(bank[id]),order=shuffle([0,1,2,3],draw);
      item.opts=order.map(i=>item.opts[i]);item.k=order.indexOf(item.k);return item;
    }),bankVersion:'review-2027-v2'};
  }
  function restoreClassic(saved,legacyBank){
    const result=copy(saved);
    if(!result.items)result.items=result.ids.map(id=>copy(legacyBank[id]));
    if(result.items.length!==result.ids.length)throw Error('La sesión guardada no contiene todas sus preguntas.');
    return result;
  }
  function reviewShort(base,revisions={}){
    const bank=copy(base);
    for(const[id,patch]of Object.entries(revisions)){
      const[tid,level,n]=id.split('/');
      if(!bank[tid]?.[Number(level)-1]?.[Number(n)-1])throw Error('Revisión sin pregunta base: '+id);
      bank[tid][level-1][n-1]={...bank[tid][level-1][n-1],...copy(patch),answer:0};
    }
    return bank;
  }
  function reviewClassic(base,revisions={}){
    return base.map((item,i)=>{
      const patch=revisions[String(i+1)];if(!patch)return copy(item);
      const result={...copy(item),opts:copy(patch.choices),k:0};
      for(const key of ['why','viz','t','h','e'])if(patch[key]!==undefined)result[key]=copy(patch[key]);
      if(patch.text!==undefined)result.q=patch.text;
      if(patch.source!==undefined)result.src=patch.source;
      return result;
    });
  }
  return {randomInt,shuffle,makeOrders,isOrder,newShort,restoreShort,newClassic,restoreClassic,reviewShort,reviewClassic,newLessonActivity};
});
