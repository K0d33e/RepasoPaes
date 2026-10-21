// Sin dependencias: servidor local y Chrome/Edge mediante DevTools Protocol.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const { spawn } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const delay = ms => new Promise(r => setTimeout(r, ms));

test('Pausa persistente en aula, ensayo y prácticas', { timeout: 60000 }, async t => {
  const server = http.createServer((req, res) => {
    const file = path.resolve(root, '.' + decodeURIComponent(req.url.split('?')[0] === '/' ? '/index.html' : req.url.split('?')[0]));
    if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    fs.readFile(file, (err, body) => {
      if (err) { res.writeHead(404).end(); return; }
      res.setHeader('Content-Type', file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : 'text/html');
      res.end(body);
    });
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  t.diagnostic('Servidor local preparado');
  const origin = `http://127.0.0.1:${server.address().port}`;
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'historialab-browser-'));
  const executable = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(fs.existsSync);
  assert.ok(executable, 'Chrome o Edge instalado');
  const browser = spawn(executable, ['--headless=new', '--disable-gpu', '--no-first-run', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { windowsHide: true });
  let socket;
  t.after(async () => {
    socket?.close(); browser.kill(); server.close();
    // El perfil temporal se conserva si el navegador todavía bloquea archivos.
  });
  const endpoint = await new Promise((resolve, reject) => {
    let output = '';
    const timer = setTimeout(() => reject(new Error('DevTools no inició')), 15000);
    browser.stderr.on('data', b => { output += b; const m = output.match(/DevTools listening on (ws:\/\/[^\s]+)/); if (m) { clearTimeout(timer); resolve(m[1]); } });
    browser.on('error', reject);
  });
  t.diagnostic('Navegador iniciado');
  socket = new WebSocket(endpoint);
  await new Promise(r => socket.addEventListener('open', r, { once: true }));
  const pending = new Map(); let seq = 0;
  socket.addEventListener('message', e => {
    const msg = JSON.parse(e.data); if (!msg.id) return;
    const p = pending.get(msg.id); pending.delete(msg.id);
    if (msg.error) p.reject(new Error(JSON.stringify(msg.error))); else p.resolve(msg.result);
  });
  const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
    const id = ++seq; pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params, sessionId }));
  });
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  const cmd = (method, params) => send(method, params, sessionId);
  const evaluate = async expression => {
    const r = await cmd('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
    return r.result.value;
  };
  await cmd('Page.enable');
  await cmd('Network.enable');
  await cmd('Network.setBlockedURLs', { urls: ['*fonts.googleapis.com*', '*fonts.gstatic.com*'] });
  await cmd('Page.addScriptToEvaluateOnNewDocument', { source: 'window.__now=Date.now(); Date.now=()=>window.__now;' });
  const ready = async (url, selector) => {
    // Cambiar solo el fragmento no recarga el documento: cada prueba necesita un arranque real.
    await cmd('Page.navigate', { url:'about:blank' });
    await cmd('Page.navigate', { url });
    for (let i = 0; i < 200; i++) {
      if (await evaluate(`location.origin===${JSON.stringify(new URL(url).origin)} && location.pathname===${JSON.stringify(new URL(url).pathname)} && !!document.querySelector(${JSON.stringify(selector)}) && document.readyState==='complete'`)) return;
      await delay(25);
    }
    throw new Error('La página no terminó de cargar: ' + url);
  };
  const check = async code => assert.equal(await evaluate(`(async()=>{${code};return true})()`), true);
  await t.test('10 preguntas: pausa, bloqueo, recarga, reanudación y tiempo agotado', async () => {
    await ready(origin, '#topicGrid .topic-card');
    await evaluate(`localStorage.clear();localStorage.setItem('historialab-paes-2027-progress-v3',JSON.stringify({lessons:{liberalismo:{completed:true}},results:{}}))`);
    await ready(origin + '/index.html#tema=liberalismo', '[data-test="0"]');
    await evaluate(`document.querySelector('[data-test="0"]').click();document.querySelector('[data-choice="0"]').click();document.getElementById('examFlag').click();document.getElementById('examNext').click();`);
    await check(`if(!document.getElementById('pauseExam'))throw Error('Falta Pausar en prueba corta');document.getElementById('pauseExam').click();if(!document.getElementById('examWorkspace').hidden)throw Error('Preguntas visibles durante pausa');window.__saved=JSON.parse(localStorage.getItem('historialab-paes-2027-exam-v3'));window.__now+=3600000;document.dispatchEvent(new KeyboardEvent('keydown',{key:'A',bubbles:true}));document.getElementById('examNext').click();document.getElementById('examFlag').click();document.getElementById('finishExam').click();if(JSON.stringify(__saved)!==localStorage.getItem('historialab-paes-2027-exam-v3'))throw Error('Se modificó la prueba pausada')`);
    await ready(origin + '/index.html#tema=liberalismo', '[data-test="0"]');
    await check(`document.querySelector('[data-test="0"]').click();if(!document.getElementById('examWorkspace').hidden)throw Error('Recarga reanudó automáticamente');const s=JSON.parse(localStorage.getItem('historialab-paes-2027-exam-v3'));if(s.pos!==1||s.answers[0]!==0||!s.flags[0])throw Error('Se perdió progreso');window.__now+=3600000;document.getElementById('resumeExam').click();const a=JSON.parse(localStorage.getItem('historialab-paes-2027-exam-v3'));if(a.deadline-__now!==s.pausedRemaining)throw Error('Se descontó el descanso');if(document.getElementById('examWorkspace').hidden)throw Error('No reanudó')`);
    await check(`window.__now+=1200001;document.getElementById('pauseExam').click();if(document.getElementById('view-result').classList.contains('hidden'))throw Error('Pausó después del vencimiento')`);
  });
  for (const mode of ['full', 'quick', 'topic']) {
    await t.test(`Simulador ${mode}: pausa y restauración`, async () => {
      await ready(origin + '/clasico/index.html', '#start');
      await evaluate('session=null;localStorage.clear()');
      await ready(origin + '/clasico/index.html', '#start');
      await evaluate(`document.querySelector('[data-mode="${mode}"]').click();document.getElementById('start').click();document.querySelector('#options button').click();document.getElementById('flag').click();document.getElementById('next').click();`);
      await check(`if(!document.getElementById('pauseTest'))throw Error('Falta Pausar en simulador');document.getElementById('pauseTest').click();if(!document.getElementById('testWorkspace').hidden)throw Error('Preguntas visibles');window.__saved=localStorage.getItem('paes-historia-2027-v1');window.__now+=3600000;document.getElementById('next').click();document.getElementById('flag').click();document.getElementById('finish').click();if(__saved!==localStorage.getItem('paes-historia-2027-v1'))throw Error('Se modificó la sesión pausada')`);
      await ready(origin + '/clasico/index.html', '#start');
      await check(`document.getElementById('resume').click();if(!document.getElementById('testWorkspace').hidden)throw Error('Recarga reanudó');const s=JSON.parse(localStorage.getItem('paes-historia-2027-v1'));if(s.pos!==1||s.answers[0]!==0||!s.flags[0])throw Error('Se perdió progreso');window.__now+=3600000;document.getElementById('resumeTest').click();const a=JSON.parse(localStorage.getItem('paes-historia-2027-v1'));if(a.paused||a.remaining!==s.remaining||a.started!==__now)throw Error('Reanudación incorrecta');if(document.getElementById('testWorkspace').hidden)throw Error('Preguntas ocultas al reanudar')`);
      if (mode === 'full') await check(`window.__now+=10000;document.getElementById('pauseTest').click();window.__now+=7200000;document.getElementById('resumeTest').click();window.__now+=15000;document.getElementById('pauseTest').click();window.__now+=3600000;document.getElementById('resumeTest').click();window.__now+=5000;await finish(true);const h=window.PAES_SCORE.list()[0];if(!h||h.seconds!==30)throw Error('Historial no acumula tiempo activo: '+h?.seconds)`);
      if (mode === 'full') await check(`await start();window.__now+=7200001;document.getElementById('pauseTest').click();if(!session.finished||session.paused)throw Error('Pausó el ensayo después de expirar');const h=window.PAES_SCORE.list()[0];if(h.seconds!==7200||!h.timedOut)throw Error('Vencimiento no registrado')`);
    });
  }
  await t.test('Pausa visible y accesible en móvil y notebook', async () => {
    await evaluate(`session=null;localStorage.clear();localStorage.setItem('historialab-paes-2027-progress-v3',JSON.stringify({lessons:{liberalismo:{completed:true}},results:{}}))`);
    for (const width of [390, 1366]) {
      await cmd('Emulation.setDeviceMetricsOverride', { width, height: 768, deviceScaleFactor: 1, mobile: false });
      await ready(origin + '/index.html#tema=liberalismo', '[data-test="0"]');
      await evaluate(`document.querySelector('[data-test="0"]').click();document.getElementById('pauseExam').click()`);
      await delay(250); // Esperar la transición de entrada antes de medir.
      await check(`const b=document.getElementById('resumeExam'),r=b.getBoundingClientRect();if(r.width<=0||r.top<0||r.bottom>innerHeight||r.right>innerWidth)throw Error('Reanudar fuera de pantalla');if(document.documentElement.scrollWidth>innerWidth)throw Error('Desbordamiento horizontal: '+JSON.stringify([...document.querySelectorAll('body *')].filter(e=>e.getBoundingClientRect().right>innerWidth+1).slice(0,8).map(e=>({id:e.id,cls:e.className,r:e.getBoundingClientRect().right}))));document.getElementById('exitExam').click();document.querySelector('[data-test="0"]').click();if(!document.getElementById('examWorkspace').hidden)throw Error('Salir reanudó la pausa')`);
      await ready(origin + '/clasico/index.html', '#start');
      await evaluate('session=null;localStorage.clear()');
      await ready(origin + '/clasico/index.html', '#start');
      await check(`document.getElementById('start').click();document.getElementById('pauseTest').click();const b=document.getElementById('resumeTest'),r=b.getBoundingClientRect();if(r.width<=0||r.top<0||r.bottom>innerHeight||r.right>innerWidth)throw Error('Reanudar fuera de pantalla');if(document.documentElement.scrollWidth>innerWidth)throw Error('Desbordamiento horizontal')`);
      // Se prepara nuevamente el progreso del aula para el siguiente ancho.
      await evaluate(`session=null;localStorage.clear();localStorage.setItem('historialab-paes-2027-progress-v3',JSON.stringify({lessons:{liberalismo:{completed:true}},results:{}}))`);
    }
  });
  await t.test('El historial conserva el puntaje calculado con la tabla anterior', async () => {
    await cmd('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
    await ready(origin+'/clasico/index.html','#start');
    await evaluate(`session=null;localStorage.clear();localStorage.setItem(PAES_SCORE.KEY,JSON.stringify([{id:'legacy',kind:'full',title:'Anterior',date:1,score:777,correct:1,total:1,questions:[{q:'Caso anterior',opts:['Correcta','Error1','Error2','Error3'],k:0,a:0,why:'Evidencia anterior',e:'H',h:'Análisis',t:'chile19',f:false}]}]))`);
    await ready(origin+'/clasico/index.html#ensayo=legacy','#scorePct');
    await check(`if(document.getElementById('scorePct').textContent!=='777')throw Error('Se recalculó el puntaje anterior con la tabla nueva')`);
  });
  await t.test('El último resultado de práctica rápida también sobrevive a la recarga', async () => {
    await evaluate('session=null;localStorage.clear()');
    await ready(origin+'/clasico/index.html','#start');
    await check(`document.querySelector('[data-mode="quick"]').click();await start();document.querySelector('#options button').click();await finish(true);if(!session.finished)throw Error('No terminó')`);
    await ready(origin+'/clasico/index.html','#start');
    await check(`if(document.getElementById('results').classList.contains('hidden')||!session?.finished||session.items.length!==15)throw Error('La recarga perdió el resultado de la práctica')`);
  });
  await t.test('Las 27 pruebas conservan sorteo, respuestas y resultados al recargar', async () => {
    await evaluate(`session=null;localStorage.clear();localStorage.setItem('historialab-paes-2027-progress-v3',JSON.stringify({lessons:Object.fromEntries(['liberalismo','chile19','crisisxx','guerr_fria','chilexx','democracia','ciudadania','mercado','trabajo'].map(id=>[id,{completed:true,step:15,maxSeen:15,passed:[0,1,2],games:{map:true,order:true,match:true,sourcegame:true}}])),results:{}}))`);
    for(const tid of ['liberalismo','chile19','crisisxx','guerr_fria','chilexx','democracia','ciudadania','mercado','trabajo'])for(let level=0;level<3;level++){
      await ready(origin+`/index.html#tema=${tid}`,'[data-test="0"]');
      await check(`document.querySelector('[data-test="${level}"]').click();const a=JSON.parse(localStorage.getItem('historialab-paes-2027-exam-v3'));if(a.items.length!==10||new Set(a.questionOrder).size!==10)throw Error('Faltan preguntas sorteadas');document.querySelector('[data-choice="'+a.items[0].answer+'"]').click();document.getElementById('examFlag').click();document.getElementById('pauseExam').click();window.__attempt=localStorage.getItem('historialab-paes-2027-exam-v3')`);
      const saved=await evaluate('window.__attempt');
      await ready(origin+`/index.html#tema=${tid}`,'[data-test="0"]');
      const actual=await evaluate(`document.querySelector('[data-test="${level}"]').click();JSON.stringify(JSON.parse(localStorage.getItem('historialab-paes-2027-exam-v3')))`);
      assert.equal(actual,saved,`${tid}/${level+1}: se modificó el intento al retomar`);
      await check(`document.getElementById('resumeExam').click();window.__now+=1200001;document.getElementById('pauseExam').click();const p=JSON.parse(localStorage.getItem('historialab-paes-2027-progress-v3'));const r=p.results['${tid}:${level}'];if(r.lastResult.correct!==1||!r.lastResult.flags[0]||r.lastResult.items.length!==10)throw Error('Corrección o persistencia incorrecta');if(Object.values(p.lessons).some(l=>!l.completed))throw Error('Se perdió progreso de lecciones')`);
    }
    await ready(origin+'/index.html#tema=trabajo','[data-review="2"]');
    await check(`document.querySelector('[data-review="2"]').click();if(document.getElementById('view-result').classList.contains('hidden'))throw Error('Resultado no recuperado');if(document.querySelectorAll('#resultReview .review-card').length!==10)throw Error('Solucionario incompleto')`);
  });
  await t.test('Un error de guardado se muestra y los cambios se recuperan al reintentar', async () => {
    await ready(origin+'/index.html#tema=liberalismo','[data-test="0"]');
    await check(`document.querySelector('[data-test="0"]').click();window.__originalSet=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw new DOMException('Sin espacio','QuotaExceededError')};document.querySelector('[data-choice="0"]').click();if(!document.getElementById('saveStatus').classList.contains('is-error')||!PAES_STORE.hasPending())throw Error('Error de guardado silencioso');Storage.prototype.setItem=window.__originalSet;document.getElementById('retrySave').click();if(PAES_STORE.hasPending()||document.getElementById('saveStatus').classList.contains('is-error'))throw Error('No recuperó guardado');const a=JSON.parse(localStorage.getItem('historialab-paes-2027-exam-v3'));if(a.answers[0]!==0)throw Error('Perdió respuesta pendiente');document.getElementById('pauseExam').click()`);
  });
  await t.test('Una prueba y resultados anteriores conservan sus preguntas y letras originales', async () => {
    await evaluate(`PAES_STORE.remove('historialab-paes-2027-exam-v3');localStorage.setItem('historialab-paes-2027-exam-v3',JSON.stringify({topicId:'liberalismo',testIdx:0,pos:0,answers:[2,...Array(9).fill(null)],flags:[true,...Array(9).fill(false)],orders:Array.from({length:10},()=>[3,2,1,0]),deadline:null,pausedRemaining:900000}))`);
    await ready(origin+'/index.html#tema=liberalismo','[data-test="0"]');
    await check(`document.querySelector('[data-test="0"]').click();document.getElementById('resumeExam').click();const a=JSON.parse(localStorage.getItem('historialab-paes-2027-exam-v3'));if(a.items[0].choices[0]!==window.PAES_TEST_BANK.liberalismo[0][0].choices[0]||a.orders[0].join()!=='3,2,1,0'||a.answers[0]!==2||!a.flags[0])throw Error('La migración alteró el intento anterior');document.getElementById('pauseExam').click()`);
    await ready(origin+'/clasico/index.html','#start');
    await evaluate(`session=null;localStorage.setItem('paes-historia-2027-v1',JSON.stringify({ids:[0,17,52],answers:[LEGACY_Q[0].k,LEGACY_Q[17].k,null],flags:[true,false,false],pos:1,mode:'quick',remaining:null,started:Date.now(),paused:true,finished:false}))`);
    await ready(origin+'/clasico/index.html','#start');
    await check(`document.getElementById('resume').click();if(session.items[0].opts.join()!==LEGACY_Q[0].opts.join()||session.items[1].k!==LEGACY_Q[17].k)throw Error('Cambió las letras antiguas del ensayo');document.getElementById('resumeTest').click();await finish(true);if(report.questions.filter(q=>q.a===q.k).length!==2)throw Error('Corrigió con claves del banco nuevo')`);
  });
});
