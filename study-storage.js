/* Guardado local verificable, recuperación y aviso de cambios pendientes. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports){module.exports=api;return;}
  let storage;
  try{storage=root.localStorage;}catch(_){storage={getItem(){throw Error('No disponible')},setItem(){throw Error('No disponible')},removeItem(){throw Error('No disponible')}};}
  const update=state=>{
    const status=document.getElementById('saveStatus'),message=document.getElementById('saveMessage'),retry=document.getElementById('retrySave');
    if(!status)return;
    status.classList.toggle('is-error',!state.ok);
    const text=state.ok?(state.recovered?'Recuperamos una copia de tu progreso.':'Progreso guardado en este navegador.'):'No se pudo guardar. Mantén esta página abierta y reintenta.';
    if(message.textContent!==text)message.textContent=text;
    retry.hidden=state.ok;
  };
  root.PAES_STORE=api.create(storage,update);
  document.getElementById('retrySave')?.addEventListener('click',()=>root.PAES_STORE.flush());
  root.addEventListener('beforeunload',event=>{if(root.PAES_STORE.hasPending()){event.preventDefault();event.returnValue='';}});
  root.addEventListener('online',()=>root.PAES_STORE.flush());
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&root.PAES_STORE.hasPending())root.PAES_STORE.flush();});
})(typeof window==='object'?window:globalThis,function(){
  'use strict';
  function create(storage,onState=()=>{}){
    const pending=new Map(),blocked=new Set();
    const emit=extra=>onState({ok:pending.size===0&&blocked.size===0,...extra});
    function read(key){
      if(pending.has(key))return pending.get(key)===null?null:JSON.parse(pending.get(key));
      return readDisk(key);
    }
    function readDisk(key){
      let raw;
      try{raw=storage.getItem(key);const value=raw===null?null:JSON.parse(raw);if(blocked.delete(key))emit();return value;}
      catch(_){
        try{
          const backup=storage.getItem(key+'.backup');
          if(backup!==null){const value=JSON.parse(backup);storage.setItem(key,backup);blocked.delete(key);emit({recovered:true});return value;}
        }catch(_){}
        blocked.add(key);emit({ok:false});return null;
      }
    }
    function write(key,value){
      const encoded=JSON.stringify(value);pending.set(key,encoded);
      if(blocked.has(key)){emit({ok:false});return false;}
      try{
        const old=storage.getItem(key);
        if(old!==null&&old!==encoded){try{JSON.parse(old);storage.setItem(key+'.backup',old);}catch(_){}}
        try{storage.setItem(key,encoded);}catch(_){storage.removeItem(key+'.backup');storage.setItem(key,encoded);}
        if(storage.getItem(key)!==encoded)throw Error('Guardado no confirmado');
        pending.delete(key);emit();return true;
      }catch(_){emit({ok:false});return false;}
    }
    function remove(key){
      try{storage.removeItem(key);storage.removeItem(key+'.backup');pending.delete(key);blocked.delete(key);emit();return true;}
      catch(_){pending.set(key,null);emit({ok:false});return false;}
    }
    function flush(){for(const key of [...blocked])readDisk(key);for(const[key,value]of [...pending]){if(value===null)remove(key);else write(key,JSON.parse(value));}emit();return pending.size===0&&blocked.size===0;}
    return {read,write,remove,flush,hasPending:()=>pending.size>0||blocked.size>0};
  }
  return {create};
});
