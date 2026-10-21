(() => {
  'use strict';
  const TOPICS = window.PAES_TOPICS || [];
  const LEGACY_BANK = window.PAES_TEST_BANK || {};
  const ENGINE = window.PAES_EXAM;
  const BANK = ENGINE.reviewShort(LEGACY_BANK,window.PAES_REVIEW?.short);
  const INTERACTIVE = window.PAES_INTERACTIVE || {};
  const DEEP = window.PAES_DEEP || {};
  const SCORE = window.PAES_SCORE || null;
  const STORAGE_PROGRESS = 'historialab-paes-2027-progress-v3';
  const STORAGE_EXAM = 'historialab-paes-2027-exam-v3';
  const TEST_META = [
    { name:'Conceptos clave', note:'Construye tus bases y reconoce los procesos.', skill:'Comprensión de conceptos' },
    { name:'Análisis de fuentes', note:'Interpreta textos, situaciones, datos y cronologías.', skill:'Análisis de fuentes' },
    { name:'Desafío PAES', note:'Evalúa evidencias y relaciones de causa y efecto.', skill:'Pensamiento crítico' },
  ];
  const SLIDES = [
    {type:'cover',name:'Comienza aquí'},
    {type:'overview',name:'Entiende el contexto'},
    {type:'map',name:'Explora el mapa'},
    {type:'timeline',name:'Los grandes hitos'},
    {type:'order',name:'Juego: ordena la historia'},
    {type:'flash',name:'Conceptos esenciales'},
    {type:'challenge',name:'Chequeo 1',quiz:0},
    {type:'compare',name:'Contrasta perspectivas'},
    {type:'match',name:'Juego: relaciona conceptos'},
    {type:'process',name:'Causas y efectos'},
    {type:'challenge',name:'Chequeo 2',quiz:1},
    {type:'source',name:'Detective de fuentes'},
    {type:'sourcegame',name:'Juego: interpreta evidencia'},
    {type:'challenge',name:'Chequeo 3',quiz:2},
    {type:'takeaways',name:'Síntesis para la PAES'},
    {type:'finish',name:'Desbloquea tus pruebas'},
  ];
  const GATED = new Set(['map','order','match','sourcegame']);
  const countSlides = () => SLIDES.length;
  // Pesos didácticos propios para orientar el estudio; DEMRE no fija estos porcentajes en el temario 2027.
  const AXIS = {
    Historia:{color:'#a63d2f',soft:'#f7e6df',name:'Historia: Mundo, América y Chile',short:'Historia',weight:56,q:36,priority:'Prioridad alta',level:'high'},
    Ciudadanía:{color:'#2b5c8a',soft:'#e2ecf6',name:'Formación ciudadana',short:'Formación ciudadana',weight:31,q:20,priority:'Prioridad media',level:'mid'},
    Economía:{color:'#4f6b2c',soft:'#ebf0de',name:'Sistema económico',short:'Economía',weight:13,q:9,priority:'Complementario',level:'base'}
  };
  const REDUCED = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = id => document.getElementById(id);
  const safe = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const attr = safe;
  const clamp = (x,low,high) => Math.max(low,Math.min(high,x));
  const topic = id => TOPICS.find(t=>t.id===id);
  let progress = { lessons:{}, results:{} };
  let exam = null;
  let activeTopic = null;
  let slideIndex = 0;
  let slideUI = {};
  let selectedFilter = 'Todos';
  let toastTimer = 0;
  let ticker = null;
  let lastReviewOnlyWrong = false;
  let resultLocation = null;
  let pendingFx = [];
  let autoTimer = null;
  let enterDir = 'fwd';

  if(TOPICS.length !== 9 || TOPICS.some(t => !(BANK[t.id] && BANK[t.id].length === 3 && BANK[t.id].every(a => a.length === 10)))) {
    $('topicGrid').textContent = 'No se pudo cargar el banco completo de contenidos. Verifica que content.js y questions.js estén junto a index.html.';
    return;
  }
  function read(key) { return window.PAES_STORE.read(key); }
  function write(key,data) { return window.PAES_STORE.write(key,data); }
  function restore() {
    const saved = read(STORAGE_PROGRESS);
    if(saved && typeof saved === 'object') {
      progress.lessons = (saved.lessons && typeof saved.lessons === 'object') ? saved.lessons : {};
      progress.results = (saved.results && typeof saved.results === 'object') ? saved.results : {};
    }
    const pending = read(STORAGE_EXAM);
    if(pending && topic(pending.topicId) && Number.isInteger(pending.testIdx) && pending.testIdx >= 0 && pending.testIdx < 3 && Array.isArray(pending.answers) && pending.answers.length === 10 && Array.isArray(pending.flags) && pending.flags.length === 10) {
      try{exam = ENGINE.restoreShort(pending,LEGACY_BANK[pending.topicId][pending.testIdx]);}
      catch(_){notify('No se pudo recuperar la prueba guardada. Conservamos los datos originales.');return;}
      exam.pos = clamp(Number(exam.pos)||0,0,9);
      if(exam.deadline === null || typeof exam.deadline !== 'number') {
        exam.deadline = null;
        exam.pausedRemaining = Math.max(0,Number(exam.pausedRemaining)||0);
      }
    }
  }
  function saveProgress() { write(STORAGE_PROGRESS,progress); updateTopProgress(); }
  function saveExam() { if(exam) write(STORAGE_EXAM,exam); else window.PAES_STORE.remove(STORAGE_EXAM); }
  function lessonState(tid) {
    if(!progress.lessons[tid] || typeof progress.lessons[tid] !== 'object') progress.lessons[tid] = {step:0,maxSeen:0,passed:[],completed:false};
    const p = progress.lessons[tid];
    p.step = clamp(Number(p.step)||0,0,SLIDES.length-1);
    p.maxSeen = clamp(Number(p.maxSeen)||0,0,SLIDES.length-1);
    if(!Array.isArray(p.passed)) p.passed = [];
    if(!p.games || typeof p.games !== 'object') p.games = {map:false,order:false,match:false,sourcegame:false};
    p.completed = p.completed === true;
    return p;
  }
  function testInfo(tid,index) { return progress.results[tid+':'+index] || null; }
  const unitsIn = ax => TOPICS.filter(t=>t.axis===ax).length;
  const unitQuestions = t => AXIS[t.axis].q/unitsIn(t.axis);
  function topicMastery(tid) { return [0,1,2].reduce((a,i)=>a+(testInfo(tid,i)?.best||0),0)/3; }
  function axisMastery(ax) { const list=TOPICS.filter(t=>t.axis===ax); return list.reduce((a,t)=>a+topicMastery(t.id),0)/(list.length||1); }
  function weightedScore() { return Object.keys(AXIS).reduce((a,k)=>a+AXIS[k].weight*axisMastery(k)/100,0); }
  function priorityTopic() {
    // Lo que más pesa y menos dominas va primero: peso del eje × brecha de dominio de la unidad.
    let pick=TOPICS[0],score=-1;
    TOPICS.forEach((t,i)=>{
      const st=lessonState(t.id),gap=100-topicMastery(t.id);
      const inProgress=st.maxSeen>0&&!st.completed?6:0;
      const value=AXIS[t.axis].weight*gap/100+inProgress-i*0.01;
      if(value>score){score=value;pick=t;}
    });
    return pick;
  }
  function countUp(el,to,suffix='') {
    if(!el)return;
    if(REDUCED()){el.textContent=Math.round(to)+suffix;return;}
    const from=Number(el.dataset.shown||0),start=performance.now(),dur=700;
    el.dataset.shown=String(to);
    const step=now=>{const k=Math.min(1,(now-start)/dur),e=1-Math.pow(1-k,3);el.textContent=Math.round(from+(to-from)*e)+suffix;if(k<1)requestAnimationFrame(step);};
    requestAnimationFrame(step);
  }
  function stopAuto(){ if(autoTimer){clearInterval(autoTimer);autoTimer=null;} }
  function applyFx(){
    const frame=$('slideFrame');
    pendingFx.forEach(([sel,cls])=>{frame.querySelectorAll(sel).forEach(el=>{el.classList.remove(cls);void el.offsetWidth;el.classList.add(cls);});});
    pendingFx=[];
  }
  function displayView(name) {
    ['home','topic','lesson','exam','result'].forEach(id=> $('view-'+id).classList.toggle('hidden',id!==name));
    document.body.dataset.view=name;
    if(name!=='exam') stopTimer();
    if(name!=='lesson') stopAuto();
    const v=$('view-'+name);v.classList.remove('view-enter');void v.offsetWidth;v.classList.add('view-enter');
    window.scrollTo({top:0,behavior:'instant'});
  }
  function notify(message) {
    const el = $('toast'); el.textContent = message; el.classList.add('visible'); clearTimeout(toastTimer);
    toastTimer = setTimeout(()=>el.classList.remove('visible'),3400);
  }
  function counts() {
    let lessons = 0,tests = 0;
    TOPICS.forEach(t=>{
      if(lessonState(t.id).completed) lessons++;
      for(let n=0;n<3;n++) if(testInfo(t.id,n)) tests++;
    });
    return {lessons,tests};
  }
  function updateTopProgress() {
    const {lessons,tests}=counts();
    const pct=Math.round(weightedScore());
    // Indicador del encabezado: anillo con unidades completadas y un segmento por unidad (completa / en curso / pendiente).
    const unitState=TOPICS.map(t=>{const s=lessonState(t.id);return {t,done:s.completed,p:s.completed?100:Math.round(Math.min(s.maxSeen,15)/15*100)};});
    const doing=unitState.filter(u=>!u.done&&u.p>0).length;
    $('headerCount').textContent=lessons;
    $('headerRing').style.setProperty('--hp',(lessons/TOPICS.length*100)+'%');
    $('headerFinished').textContent=`${lessons} de ${TOPICS.length} ${TOPICS.length===1?'unidad':'unidades'}`;
    $('headerSub').textContent=lessons===TOPICS.length?'¡Todas completadas!':doing?`${doing} en curso`:lessons?'Sigue con la próxima':'Empieza tu recorrido';
    $('headerSegs').innerHTML=unitState.map(u=>`<i class="${u.done?'done':u.p?'doing':''}" style="--sp:${u.p}%" title="Unidad ${safe(u.t.number)} · ${safe(u.t.title)}: ${u.done?'completada':u.p?`en curso (${u.p}%)`:'pendiente'}"></i>`).join('');
    $('headerProgress').setAttribute('aria-label',`Avance: ${lessons} de ${TOPICS.length} unidades completadas${doing?`, ${doing} en curso`:''}`);
    $('heroFinished').textContent=`${lessons} / 9`;
    $('heroProgressLine').style.width=lessons/9*100+'%';
    $('overallLabel').textContent=tests===0?(lessons===0?'Empieza tu recorrido':'Rinde tu primera prueba'):(pct>=70?'Preparación sólida':'Vas por buen camino');
    countUp($('overallPct'),pct,'%');countUp($('weightedScore'),pct,'%');
    $('overallBar').style.width=pct+'%';
    $('overallRing').style.setProperty('--progress',pct+'%');
    const next = priorityTopic();
    const phase=lessonState(next.id),ax=AXIS[next.axis];
    $('nextLessonReason').textContent=`RUTA PROPIA · PESO DE ESTUDIO ${ax.weight}%`;
    $('nextLessonTitle').textContent=next.title;
    $('nextLessonMeta').textContent=phase.completed?`Tu mejor promedio aquí es ${Math.round(topicMastery(next.id))}%. Es el tema que nuestra ruta de estudio te recomienda reforzar.`:(phase.maxSeen>0?`Sigue desde la escena ${phase.step+1} de 16 · ${ax.short}`:`Unidad ${next.number} · ${ax.short} · 16 escenas interactivas`);
    $('studyNext').style.setProperty('--axis',ax.color);
    $('nextLessonBtn').dataset.nextTopic=next.id;
    $('nextLessonBtn').innerHTML=phase.maxSeen>0&&!phase.completed?'Retomar clase <span aria-hidden="true">→</span>':(phase.completed?'Practicar este tema <span aria-hidden="true">→</span>':'Explorar unidad <span aria-hidden="true">→</span>');
    renderAxisCards();
    $('overallNote').textContent=`${lessons} lecciones y ${tests} pruebas completadas`;
  }
  function renderAxisCards() {
    const box=$('axisCards');if(!box)return;
    box.innerHTML=Object.entries(AXIS).map(([key,a],i)=>{
      const m=Math.round(axisMastery(key)),n=unitsIn(key),done=TOPICS.filter(t=>t.axis===key&&lessonState(t.id).completed).length;
      return `<article class="axis-card lvl-${a.level}" style="--axis:${a.color};--axis-soft:${a.soft};--i:${i}"><div class="axis-card-top"><span class="axis-prio">${safe(a.priority)}</span><span class="axis-weight">${a.weight}<small>%</small></span></div><h3>${safe(a.name)}</h3><p>≈ <strong>${a.q} de 65</strong> preguntas en nuestro ensayo · ${n} unidades · ${done}/${n} lecciones</p><div class="axis-meter" role="img" aria-label="Dominio del eje: ${m}%"><i style="width:${m}%"></i></div><div class="axis-card-foot"><span>Dominio <strong>${m}%</strong></span><button type="button" class="axis-go" data-axis-filter="${attr(key)}">Ver unidades <span aria-hidden="true">→</span></button></div></article>`;
    }).join('');
  }
  function renderHome() {
    updateTopProgress();
    const search = $('topicSearch').value.trim().toLocaleLowerCase('es-CL');
    const found = TOPICS.filter(t => (selectedFilter==='Todos'||t.axis===selectedFilter) && (t.title+' '+t.subtitle+' '+t.period+' '+t.concepts.map(c=>c[0]).join(' ')).toLocaleLowerCase('es-CL').includes(search));
    const cards=found.map(t=>{
      const s=lessonState(t.id), n=[0,1,2].filter(i=>testInfo(t.id,i)).length+(s.completed?1:0);
      const axis=AXIS[t.axis];
      return `<button type="button" class="topic-card lvl-${axis.level}" data-topic="${attr(t.id)}" style="--topic-accent:${axis.color};--topic-soft:${axis.soft};--card-order:${found.indexOf(t)}"><span class="tape" aria-hidden="true"></span><span class="topic-card-top"><span class="topic-card-icon" aria-hidden="true">${safe(t.icon)}</span><span class="topic-card-head"><span class="topic-card-meta">${safe(axis.short)} · ${safe(t.period)}</span><h3>${safe(t.title)}</h3></span><span class="topic-card-num">${safe(t.number)}</span></span><p>${safe(t.subtitle)}</p><span class="topic-card-footer"><span class="card-progress"><b>${n} / 4</b> actividades<span class="card-dots">${Array.from({length:4},(_,i)=>`<i class="${i<n?'active':''}"></i>`).join('')}</span></span><span class="topic-weight" title="Peso didáctico propio, no oficial del DEMRE">Estudio ${axis.weight}%</span><span class="card-arrow" aria-hidden="true">↗</span></span></button>`;
    }).join('');
    $('catalogCount').textContent=`${found.length} ${found.length===1?'unidad disponible':'unidades disponibles'}`;
    $('topicGrid').innerHTML=cards || `<div class="empty-search">No se encontraron temas con ese filtro. Prueba otro término.</div>`;
    renderHistory();
  }
  function goHome(scrollToTopics=false) {
    displayView('home'); renderHome();
    if(scrollToTopics) setTimeout(()=>$('temas').scrollIntoView({behavior:'smooth',block:'start'}),45);
  }
  function openTopic(tid) {
    const t = topic(tid); if(!t) return;
    activeTopic=tid;
    const state=lessonState(tid);
    displayView('topic');
    $('topicCrumb').textContent=t.title;
    $('topicHero').dataset.number=t.number;
    $('topicHero').style.setProperty('--axis',AXIS[t.axis].color);
    $('topicHero').innerHTML=`<div><div class="small-tag">UNIDAD ${safe(t.number)} / ${safe(AXIS[t.axis].name.toUpperCase())}</div><h1>${safe(t.title)}</h1><p>${safe(t.subtitle)}. ${safe(t.hook)}</p><div class="topic-hero-meta"><span class="hero-weight" style="--axis:${AXIS[t.axis].color}">Peso propio de estudio: ${AXIS[t.axis].weight}%</span><span>◷ ${t.duration} min de lección</span><span>${countSlides()} escenas + juegos</span><span>3 pruebas · 30 preguntas</span></div></div><div class="topic-hero-side"><div class="big-icon" aria-hidden="true">${safe(t.icon)}</div><strong>${safe(t.period)}</strong></div>`;
    const lessonButton=state.completed?'Repasar presentación ↗':(state.maxSeen>0?'Continuar presentación →':'Iniciar presentación →');
    $('lessonLauncher').innerHTML=`<div class="lesson-launch"><div class="lesson-launch-icon" aria-hidden="true">${state.completed?'✓':'▶'}</div><div class="lesson-launch-content"><strong>Clase interactiva · ${safe(t.title)}</strong><p>${countSlides()} escenas con mapas, línea de tiempo, juegos de secuencia y asociación, fuentes, animaciones y 3 chequeos de comprensión.</p></div><div class="lesson-launch-action"><small>${state.completed?'Lección completada':(state.maxSeen>0?`Diapositiva ${state.step+1} de ${countSlides()}`:'Primero la explicación')}</small><button class="btn ${state.completed?'btn-outline':'btn-mint'}" id="beginLesson" type="button">${lessonButton}</button></div></div>`;
    $('beginLesson').onclick=()=>openLesson(tid);
    $('testsHint').textContent=state.completed?'Pruebas desbloqueadas: elige cualquier nivel.':'Explora el mapa, resuelve 3 juegos y supera los 3 chequeos para abrir las pruebas.';
    $('topicTests').innerHTML=TEST_META.map((meta,i)=>{
      const res=testInfo(tid,i), unlocked=state.completed;
      const isCurrent=!!(exam && exam.topicId===tid && exam.testIdx===i);
      const label=isCurrent?'Reanudar prueba →':(res?'Volver a intentar →':unlocked?'Comenzar prueba →':'🔒 Bloqueada');
      return `<div class="test-card ${unlocked?'':'locked'}"><div class="test-card-number">PRUEBA 0${i+1} / NIVEL ${i+1}</div><h3>${safe(meta.name)}</h3><p>${safe(meta.note)}</p><div class="test-state">${res?`Mejor: ${res.best}% · ${res.attempts} intento${res.attempts===1?'':'s'}`:unlocked?'10 preguntas · 20 min':'Completa primero la lección'}</div><button class="btn ${unlocked?'btn-dark':'btn-outline'}" type="button" data-test="${i}" ${unlocked?'':'disabled'}>${label}</button>${res?`<button type="button" class="btn btn-outline" data-review="${i}">Ver última corrección</button>`:''}</div>`;
    }).join('');
    $('topicAside').innerHTML=`<div class="aside-header">Lo que aprenderás</div><ul>${t.concepts.map(c=>`<li>${safe(c[0])}</li>`).join('')}</ul><div class="aside-sep"></div><div class="aside-header">Tu meta</div><div class="quote">${safe(t.hook)}</div><div class="aside-sep"></div><div class="aside-header">Tu progreso</div><ul><li>${state.completed?'Presentación completada':'Presentación por completar'}</li>${[0,1,2].map(i=>`<li>${testInfo(tid,i)?`Prueba ${i+1} rendida · ${testInfo(tid,i).best}% mejor`:`Prueba ${i+1} pendiente`}</li>`).join('')}</ul>`;
  }
  const newSlideUI = () => ({tab:0,timeline:0,flips:[],compare:0,process:0,hints:[],revealSource:false,chosen:null,wrong:false,mapVisits:[],orderSelected:[],orderError:'',matched:[],matchTerm:null,matchError:'',sourceAnswer:null});
  function hash(s){let h=2166136261>>>0;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0;}
  function randomInt(max) {
    if(window.crypto && window.crypto.getRandomValues) {const buf=new Uint32Array(1);window.crypto.getRandomValues(buf);return buf[0]%max;}
    return Math.floor(Math.random()*max);
  }
  function shuffle(a) {for(let i=a.length-1;i>0;i--){const j=randomInt(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;}
  function orderedMicroOptions(tid,quiz,choices,correctIndex) {
    const state=lessonState(tid);
    if(!state.microOrders||typeof state.microOrders!=='object')state.microOrders={};
    if(!ENGINE.isOrder(state.microOrders[quiz],choices.length)){
      state.microOrders[quiz]=ENGINE.shuffle(choices.map((_,i)=>i));saveProgress();
    }
    return state.microOrders[quiz].map(i=>({index:i,label:choices[i]}));
  }
  function burst() {
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    const shell=document.createElement('div');shell.className='paper-confetti';shell.setAttribute('aria-hidden','true');
    const colors=['#a63d2f','#2b5c8a','#4f6b2c','#c08a2e','#e9dcc2'];
    for(let i=0;i<26;i++){const node=document.createElement('i');node.style.setProperty('--x',`${Math.round((randomInt(200)-100)*3.2)}px`);node.style.setProperty('--r',`${randomInt(720)-360}deg`);node.style.setProperty('--d',`${randomInt(220)}ms`);node.style.background=colors[i%colors.length];shell.appendChild(node);}
    document.body.appendChild(shell);setTimeout(()=>shell.remove(),1500);
  }
  function completeGame(key) {
    const state=lessonState(activeTopic);
    if(state.games[key])return;
    state.games[key]=true;saveProgress();burst();notify('Misión superada. Ya puedes continuar.');
  }
  function openLesson(tid) {
    const t=topic(tid); if(!t) return;
    activeTopic=tid;
    const s=lessonState(tid);
    slideIndex=s.completed?0:s.step;
    slideUI=newSlideUI();
    displayView('lesson');
    $('lessonTopicTitle').textContent=t.title;
    $('lessonTip').textContent=t.trick;
    $('lessonWeight').textContent=`Peso propio de estudio: ${AXIS[t.axis].weight}%`;
    $('lessonWeight').style.setProperty('--axis',AXIS[t.axis].color);
    enterDir='fwd';stopAuto();
    renderLesson();
  }
  function canPassSlide(index) {
    const entry=SLIDES[index];if(!entry)return false;
    const s=lessonState(activeTopic);
    if(entry.type==='challenge')return s.passed.includes(entry.quiz);
    if(GATED.has(entry.type))return s.games[entry.type]===true;
    return true;
  }
  function goSlide(target) {
    const s=lessonState(activeTopic);
    target=clamp(target,0,SLIDES.length-1);
    if(target>slideIndex && !canPassSlide(slideIndex)) { notify('Responde correctamente la actividad para continuar.'); return; }
    if(target>s.maxSeen+1 && !s.completed) return;
    if(target>slideIndex && !s.completed) {
      const firstGate=SLIDES.findIndex((_,i)=>i<target&&!canPassSlide(i));
      if(firstGate !== -1) {notify('Completa los desafíos anteriores antes de avanzar.');return;}
    }
    stopAuto();
    enterDir=target>=slideIndex?'fwd':'back';
    slideIndex=target;s.step=slideIndex;s.maxSeen=Math.max(s.maxSeen,slideIndex);
    $('slideFrame').scrollTop=0;
    saveProgress();slideUI=newSlideUI();renderLesson();
    window.scrollTo({top:0,behavior:'instant'});
  }
  function nextSlide() {
    if(!canPassSlide(slideIndex)){notify('Primero supera esta minipregunta. Puedes volver a intentarlo.');return;}
    if(slideIndex===SLIDES.length-1) {
      const s=lessonState(activeTopic);s.completed=true;s.step=countSlides()-1;s.maxSeen=countSlides()-1;
      saveProgress();notify('¡Lección dominada! Desbloqueaste las 3 pruebas.');burst();openTopic(activeTopic);
      return;
    }
    goSlide(slideIndex+1);
  }
  function slideHead(tag,title,lead='') {
    return `<div class="slide-topline">${safe(tag)}</div><h2 class="slide-heading">${safe(title)}</h2>${lead?`<p class="slide-lead">${safe(lead)}</p>`:''}`;
  }
  function tabsHTML(labels,cur) {
    return `<div class="slide-tabs" role="tablist">${labels.map((l,i)=>`<button type="button" role="tab" data-tab="${i}" class="slide-tab ${i===cur?'active':''}" aria-selected="${i===cur}">${safe(l)}</button>`).join('')}</div>`;
  }
  // Ficha ampliada de un hito: contexto, causas, efectos y foco PAES (deep-content.js).
  function timelineDetail(t,i) {
    const h=t.timeline[i],d=DEEP[t.id]?.timeline?.[i];
    const list=xs=>`<ul>${xs.map(x=>`<li>${safe(x)}</li>`).join('')}</ul>`;
    return `<span>${safe(h[0])}</span><h3>${safe(h[1])}</h3><p class="tl-lead">${safe(h[2])}</p>${d?`<p class="tl-more">${safe(d.more)}</p><div class="tl-cause-effect"><div><strong>¿Por qué ocurre?</strong>${list(d.causes)}</div><div><strong>¿Qué provocó?</strong>${list(d.effects)}</div></div><p class="tl-paes"><b>CLAVE PAES</b>${safe(d.paes)}</p>`:''}<div class="timeline-fact">✦ ${i+1} / ${t.timeline.length} HITOS</div>`;
  }
  function mapSvg(type) {
    if(type==='chile') return `<svg class="map-svg" viewBox="0 0 900 440" role="img" aria-label="Mapa de Chile, esquemático y no a escala" preserveAspectRatio="none"><defs><linearGradient id="sea" x1="0" x2="1"><stop stop-color="#0d2543"/><stop offset="1" stop-color="#15334b"/></linearGradient></defs><rect width="900" height="440" fill="url(#sea)"/><g opacity=".18" stroke="#5db9b3" stroke-width="1">${Array.from({length:13},(_,i)=>`<path d="M0 ${i*38}H900"/>`).join('')}${Array.from({length:21},(_,i)=>`<path d="M${i*46} 0V440"/>`).join('')}</g><path d="M468 12 L486 12 467 72 477 102 467 142 481 177 478 205 463 232 481 268 476 289 489 323 478 361 492 393 479 427 468 414 458 374 453 337 449 308 453 281 443 246 444 220 434 190 445 163 430 127 441 93 434 61 450 31 Z" fill="#42d8bc" stroke="#c4fff0" stroke-width="4"/><path d="M490 12 L760 12 760 427 503 427 508 380 500 315 502 242 489 180 498 100Z" fill="#325577" opacity=".37"/><g fill="#b0c8d5" font-size="16" font-weight="800" letter-spacing="3"><text x="105" y="65">OCÉANO PACÍFICO</text><text x="650" y="65">CORDILLERA</text><text x="300" y="100">NORTE</text><text x="300" y="218">CENTRO</text><text x="300" y="366">SUR</text></g><path d="M460 60 C460 145 465 260 477 383" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="6 12" opacity=".52"/></svg>`;
    return `<svg class="map-svg" viewBox="0 0 900 440" role="img" aria-label="Mapamundi ilustrativo, sin fronteras políticas precisas" preserveAspectRatio="none"><defs><linearGradient id="ocean" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#0b2440"/><stop offset="1" stop-color="#123957"/></linearGradient></defs><rect width="900" height="440" fill="url(#ocean)"/><g stroke="#6ab5ca" opacity=".16" fill="none">${Array.from({length:9},(_,i)=>`<path d="M0 ${i*55}H900"/>`).join('')}${Array.from({length:16},(_,i)=>`<path d="M${i*60} 0V440"/>`).join('')}</g><g fill="#2b7590" stroke="#76bbbc" stroke-width="2.1" stroke-linejoin="round"><path d="M48 94L104 55 177 62 216 88 243 124 219 163 191 166 176 218 142 224 112 190 74 177 47 136Z"/><path d="M230 218L278 210 317 249 324 295 302 352 270 399 249 370 242 320 221 272Z"/><path d="M413 108L459 84 509 93 528 123 509 152 476 148 452 161 424 143Z"/><path d="M440 174L498 165 527 215 518 277 480 338 443 318 415 249Z"/><path d="M511 101L587 74 692 69 768 106 832 134 827 175 788 210 727 216 706 174 669 186 638 177 613 214 578 190 547 151Z"/><path d="M723 315L768 304 798 325 790 357 744 371 715 350Z"/></g><g fill="#b5c9d7" font-size="14" font-weight="800" letter-spacing="2"><text x="70" y="52">AMÉRICA DEL NORTE</text><text x="247" y="422">AMÉRICA DEL SUR</text><text x="446" y="61">EUROPA</text><text x="451" y="363">ÁFRICA</text><text x="647" y="56">ASIA</text><text x="717" y="400">OCEANÍA</text></g></svg>`;
  }
  function mapMarkup(t) {
    const m=INTERACTIVE[t.id].map;
    const state=lessonState(t.id),all=state.games.map;
    const visited=all?m.points.map((_,i)=>i):slideUI.mapVisits;
    const current=slideUI.mapActive??0,pt=m.points[current];
    return `<div class="slide slide-padding slide-map">${slideHead('Geografía interactiva · 03',m.title,'Toca los puntos luminosos para descubrir la relación entre territorio e historia.')}
      <div class="map-shell">${mapSvg(m.type)}${m.points.map((p,i)=>`<button type="button" class="map-pin ${visited.includes(i)?'explored':''} ${current===i?'selected':''}" style="left:${p[1]}%;top:${p[2]}%" data-map="${i}" aria-label="Explorar ${safe(p[0])}" aria-pressed="${current===i}"><span>${i+1}</span></button>`).join('')}<div class="map-compass" aria-hidden="true">N ↑</div></div>
      <div class="map-detail"><div><span class="map-label">PUNTO ${String(current+1).padStart(2,'0')} · ${safe(pt[0])}</span><h3>${safe(pt[3])}</h3><p>${safe(pt[4])}</p></div><div class="map-count"><strong>${visited.length}/${m.points.length}</strong><span>explorados</span></div></div>
      <div class="map-places" aria-label="Lugares para explorar">${m.points.map((p,i)=>`<button type="button" data-map="${i}" class="map-place ${visited.includes(i)?'done':''} ${current===i?'active':''}">${visited.includes(i)?'✓':'○'} ${safe(p[0])}</button>`).join('')}</div><p class="map-caption">${safe(m.caption)}</p>
      ${all?'<div class="mission-success">✓ Mapa explorado: ya puedes avanzar</div>':''}</div>`;
  }
  function orderMarkup(t) {
    const done=lessonState(t.id).games.order;
    const picks=slideUI.orderSelected;
    const scramble=[2,0,3,1].map(i=>t.timeline[i]);
    return `<div class="slide slide-padding">${slideHead('Minijuego · cronología','Reconstruye la secuencia.','Toca los hitos en orden, del más antiguo al más reciente. Las fechas se revelan cuando ubicas cada hito.')}
      <div class="game-banner"><span>RETO 01 / 03</span><strong>${done?'COMPLETADO':`PASO ${Math.min(4,picks.length+1)} DE 4`}</strong></div>
      <div class="order-track">${Array.from({length:4},(_,i)=>`<div class="order-slot ${i<picks.length||done?'filled':''}"><small>0${i+1}${done||i<picks.length?` · ${safe(t.timeline[i][0])}`:''}</small><span>${done||i<picks.length?safe(t.timeline[i][1]):'Selecciona un hito'}</span></div>`).join('')}</div>
      <div class="order-options">${scramble.map((h,i)=>{const original=t.timeline.indexOf(h);const selected=picks.includes(original)||done;return `<button type="button" data-order="${original}" ${selected?'disabled':''} class="order-tile ${selected?'picked':''}"><small class="${selected?'':'order-year-hidden'}">${selected?safe(h[0]):'¿Cuándo ocurrió?'}</small><strong>${safe(h[1])}</strong><span>${selected?'✓ Añadido':'Tocar para ordenar ↗'}</span></button>`}).join('')}</div>
      ${slideUI.orderError?`<p class="game-feedback bad">${safe(slideUI.orderError)}</p>`:''}${done?'<p class="game-feedback good">✓ Excelente: la secuencia histórica está completa.</p>':''}
      <p class="slide-end-note">Tip PAES: distinguir secuencia, continuidad y ruptura ayuda a interpretar procesos.</p></div>`;
  }
  function matchMarkup(t) {
    const done=lessonState(t.id).games.match;const matched=done?[0,1,2,3]:slideUI.matched;
    const cols=[2,0,3,1];
    return `<div class="slide slide-padding">${slideHead('Minijuego · conexiones','Une los conceptos con su significado.','Primero toca un concepto y después la definición que le corresponde.')}
      <div class="game-banner"><span>RETO 02 / 03</span><strong>${matched.length} / 4 PAREJAS</strong></div>
      <div class="match-board"><div class="match-col"><strong class="match-col-heading">CONCEPTO</strong>${t.concepts.map((c,i)=>`<button type="button" data-match-term="${i}" class="match-card ${matched.includes(i)?'matched':''} ${slideUI.matchTerm===i?'selected':''}" ${matched.includes(i)?'disabled':''}><span>${matched.includes(i)?'✓':'0'+(i+1)}</span><strong>${safe(c[0])}</strong></button>`).join('')}</div><div class="match-col"><strong class="match-col-heading">DEFINICIÓN</strong>${cols.map((i,j)=>`<button type="button" data-match-def="${i}" class="match-card match-definition ${matched.includes(i)?'matched':''}" ${matched.includes(i)?'disabled':''}><span>${matched.includes(i)?'✓':'↗'}</span><small>${safe(t.concepts[i][1])}</small></button>`).join('')}</div></div>
      ${slideUI.matchError?`<div class="game-feedback bad">${safe(slideUI.matchError)}</div>`:''}${done?'<div class="game-feedback good">✓ ¡Conexiones correctas! Ya distingues estos cuatro conceptos.</div>':''}
      <p class="slide-end-note">No basta con memorizar términos: identifica qué evidencia demuestra cada idea.</p></div>`;
  }
  function sourceGameMarkup(t) {
    const g=INTERACTIVE[t.id].sourceGame;const done=lessonState(t.id).games.sourcegame;
    const opts=orderedMicroOptions(t.id,'source',g.options,g.answer);
    return `<div class="slide slide-padding">${slideHead('Minijuego · evidencia','Decide como historiador.','Usa la fuente anterior y selecciona la interpretación mejor fundamentada.')}
      <div class="game-banner"><span>RETO 03 / 03</span><strong>${done?'RESUELTO':'PENSAMIENTO CRÍTICO'}</strong></div>
      <div class="source-mission"><span class="source-mission-icon">◎</span><h3>${safe(g.prompt)}</h3><div class="check-options">${opts.map((o,i)=>`<button type="button" data-source-choice="${o.index}" class="check-option ${done&&o.index===g.answer?'correct':slideUI.sourceAnswer===o.index&&!done?'wrong':''}" ${done?'disabled':''}><span>${'ABC'[i]}</span>${safe(o.label)}</button>`).join('')}</div>${done?`<p class="game-feedback good">✓ ${safe(g.explain)}</p>`:slideUI.sourceAnswer!==null?'<p class="game-feedback bad">No es la inferencia más sólida. Pregúntate qué información respalda cada afirmación y vuelve a elegir.</p>':''}</div></div>`;
  }
  function renderViz(v) {
    if(!v)return '';
    if(v.kind==='table')return `<div class="q-visual q-table"><div class="q-visual-label">LECTURA DE DATOS</div><div class="q-visual-scroll"><table><thead><tr>${v.heads.map(h=>`<th>${safe(h)}</th>`).join('')}</tr></thead><tbody>${v.rows.map(r=>`<tr>${r.map(c=>`<td>${safe(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div>`;
    if(v.kind==='steps')return `<div class="q-visual"><div class="q-visual-label">ESQUEMA DE PROCESO</div><div class="q-flow">${v.entries.map((x,i)=>`<span>${safe(x)}</span>${i<v.entries.length-1?'<i aria-hidden="true">→</i>':''}`).join('')}</div></div>`;
    if(v.kind==='timeline')return `<div class="q-visual"><div class="q-visual-label">EVIDENCIA CRONOLÓGICA</div><div class="q-timeline">${v.entries.map(e=>`<div><b>${safe(e[0])}</b><span>${safe(e[1])}</span></div>`).join('')}</div></div>`;
    if(v.kind==='bars'){
      const max=Math.max(...v.values,1);return `<div class="q-visual"><div class="q-visual-label">${safe(v.title||'GRÁFICO DE DATOS')}</div><div class="q-bars">${v.values.map((x,i)=>`<div class="q-bar"><strong>${safe(x)}</strong><div class="q-bar-track"><div style="height:${Math.max(5,Math.round(x/max*100))}%"></div></div><span>${safe(v.labels[i])}</span></div>`).join('')}</div></div>`;
    }
    return '';
  }
  function slideHTML(t,entry) {
    const {type}=entry;
    if(type==='cover') return `<div class="slide slide-cover" style="--axis:${AXIS[t.axis].color}"><div class="cover-arc"></div><div class="cover-polaroid" aria-hidden="true"><span class="tape"></span><span class="cover-icon">${safe(t.icon)}</span><em>${safe(t.period)}</em></div><div class="cover-stamp" aria-hidden="true"><small>EJE</small>${AXIS[t.axis].weight}%<small>ESTUDIO</small></div><div class="slide-cover-content"><div class="slide-kicker">UNIDAD ${safe(t.number)} / HISTORIA LAB</div><h2>${safe(t.title)}.</h2><p>${safe(t.hook)}</p><div class="slide-cover-footer"><span></span> PREPÁRATE PARA ENTENDER, EXPLORAR Y DECIDIR</div></div></div>`;
    if(type==='overview') {
      const ctx=[['Panorama general',t.overview.context],...(DEEP[t.id]?.context||[])],c=Math.min(slideUI.tab,ctx.length-1);
      return `<div class="slide slide-padding">${slideHead('02 · Comprende el contexto',t.overview.title,t.overview.lead)}<div class="overview-grid"><div class="overview-main">${ctx.length>1?tabsHTML(ctx.map(x=>x[0]),c):'<h3>¿Qué estaba pasando?</h3>'}<div class="tab-panel" role="tabpanel"><p>${safe(ctx[c][1])}</p></div>${ctx.length>1?`<div class="tab-steps">${c+1} / ${ctx.length} · Revisa todas las pestañas</div>`:''}</div><div class="overview-callout"><strong>PISTA IMPORTANTE</strong><p>${safe(t.overview.spotlight)}</p></div></div><p class="slide-end-note">Tip: primero identifica el contexto y luego interpreta los hechos.</p></div>`;
    }
    if(type==='timeline') return `<div class="slide slide-padding">${slideHead('04 · Explora los hechos','Así evoluciona el proceso.','Selecciona cada hito o reproduce la cronología completa.')}<div class="tl-player"><button type="button" class="tl-play ${autoTimer?'playing':''}" data-tlplay="1" aria-pressed="${!!autoTimer}">${autoTimer?'❚❚ Pausar':'▶ Reproducir cronología'}</button><div class="tl-rail" aria-hidden="true"><i style="width:${(slideUI.timeline+.5)/t.timeline.length*100}%"></i>${t.timeline.map((x,i)=>`<b class="${i<=slideUI.timeline?'on':''} ${i===slideUI.timeline?'current':''}" style="left:${(i+.5)/t.timeline.length*100}%"></b>`).join('')}</div></div><div class="timeline-wrap"><div class="timeline-menu">${t.timeline.map((x,i)=>`<button type="button" data-timeline="${i}" class="timeline-point ${slideUI.timeline===i?'active':''}" aria-pressed="${slideUI.timeline===i}"><span>${safe(x[0])}</span>${safe(x[1])}</button>`).join('')}</div><div class="timeline-detail">${timelineDetail(t,slideUI.timeline)}</div></div></div>`;
    if(type==='flash') return `<div class="slide slide-padding">${slideHead('06 · Activa tu memoria','Cuatro conceptos que debes manejar.','Toca las tarjetas para descubrir la definición y un ejemplo.')}<div class="flash-grid">${t.concepts.map((c,i)=>{const yes=slideUI.flips.includes(i);return `<button type="button" data-flip="${i}" class="flashcard flip3d ${yes?'revealed':''}" aria-pressed="${yes}" aria-label="${safe(c[0])}: ${yes?'mostrar concepto':'mostrar definición'}"><span class="flip-inner"><span class="flip-face flip-front" ${yes?'aria-hidden="true"':''}><span class="flash-label">CONCEPTO ${String(i+1).padStart(2,'0')} · TOCA PARA GIRAR</span><strong>${safe(c[0])}</strong><span class="flash-chevron" aria-hidden="true">↻</span></span><span class="flip-face flip-back" ${yes?'':'aria-hidden="true"'}><span class="flash-label">${safe(c[0])}</span><p>${safe(c[1])}</p><span class="flash-example">Ejemplo: ${safe(c[2])}</span></span></span></button>`}).join('')}</div><div class="flash-count" aria-live="polite">${slideUI.flips.length} / ${t.concepts.length} tarjetas giradas</div><p class="slide-end-note">Prueba recordarlo antes de tocar cada tarjeta.</p></div>`;
    if(type==='map') return mapMarkup(t);
    if(type==='order') return orderMarkup(t);
    if(type==='match') return matchMarkup(t);
    if(type==='sourcegame') return sourceGameMarkup(t);
    if(type==='challenge') {
      const i=entry.quiz,ch=t.checks[i],done=lessonState(t.id).passed.includes(i);
      const opts=orderedMicroOptions(t.id,i,ch[1],ch[2]);
      return `<div class="slide slide-padding">${slideHead('Chequeo de comprensión · '+(i+1)+'/3','Piensa antes de responder.','La alternativa correcta cambia de posición. Esta pregunta no aparece en tus pruebas.')}
      <div class="check-card question-level"><div class="challenge-head"><span>DESAFÍO DE COMPRENSIÓN</span><strong>${String(i+1).padStart(2,'0')} / 03</strong></div><h3>${safe(ch[0])}</h3><div class="check-options">${opts.map((o,j)=>`<button type="button" data-check="${o.index}" class="check-option ${done&&o.index===ch[2]?'correct':(!done&&slideUI.chosen===o.index?'wrong':'')}" ${done?'disabled':''}><span>${'ABC'[j]}</span>${safe(o.label)}</button>`).join('')}</div>${done?`<div class="check-feedback good">✓ ${safe(ch[3])}</div>`:(slideUI.wrong?`<div class="check-feedback">Vuelve a leer el contexto: una alternativa resulta más precisa que las otras. Inténtalo de nuevo.</div>`:'')}</div>
      <p class="slide-end-note">Para continuar debes resolver correctamente este chequeo. Las letras no siguen un patrón fijo.</p></div>`;
    }
    if(type==='compare') {
      const side=t.compare[slideUI.compare? 'b':'a'];
      return `<div class="slide slide-padding">${slideHead('08 · Compara ideas','Dos modelos, dos lógicas.','Selecciona cada alternativa y descubre en qué se diferencian.')}<div class="compare-tabs"><button type="button" data-compare="0" class="compare-tab ${slideUI.compare===0?'active':''}" aria-pressed="${slideUI.compare===0}">01 · ${safe(t.compare.a[0])}</button><button type="button" data-compare="1" class="compare-tab ${slideUI.compare===1?'active':''}" aria-pressed="${slideUI.compare===1}">02 · ${safe(t.compare.b[0])}</button></div><div class="compare-body"><div class="compare-card"><h3>${safe(side[0])}</h3><p>${safe(side[1])}</p><ul>${side[2].map(b=>`<li>${safe(b)}</li>`).join('')}</ul></div><div class="compare-side"><strong>PARA NO CONFUNDIR</strong><p>${safe(t.compare.insight)}</p></div></div></div>`;
    }
    if(type==='process') {
      const item=t.process[slideUI.process];
      return `<div class="slide slide-padding">${slideHead('10 · Piensa en procesos','No es un hecho aislado.','Toca cada etapa. Las preguntas PAES suelen pedir relaciones de causa y efecto.')}<div class="process-grid" style="--p:${t.process.length>1?slideUI.process/(t.process.length-1)*100:0}%">${t.process.map((p,i)=>`<button type="button" data-process="${i}" class="process-step ${slideUI.process===i?'active':''} ${i<slideUI.process?'passed':''}" aria-pressed="${slideUI.process===i}"><span class="process-n">0${i+1}</span><strong>${safe(p[0])}</strong></button>`).join('')}</div><div class="process-detail"><strong>0${slideUI.process+1} · ${safe(item[0])}:</strong> ${safe(item[1])}</div></div>`;
    }
    if(type==='source') return `<div class="slide slide-padding">${slideHead('12 · Entrena una habilidad PAES','Detective de fuentes.','Lee la evidencia, interpreta lo que permite afirmar y utiliza pistas si las necesitas.')}<div class="source-sheet"><span>${safe(t.source.label.toUpperCase())}</span><blockquote>${safe(t.source.text)}</blockquote></div><p class="source-question">${safe(t.source.task)}</p><div class="source-actions">${t.source.clues.map((x,i)=>`<button type="button" data-hint="${i}" class="hint-btn ${slideUI.hints.includes(i)?'used':''}">${slideUI.hints.includes(i)?'✓':'✦'} Pista ${i+1}</button>`).join('')}<button type="button" data-reveal="1" class="hint-btn ${slideUI.revealSource?'used':''}">${slideUI.revealSource?'✓ Conclusión vista':'Ver conclusión ↗'}</button></div><div class="source-hints">${slideUI.hints.map(i=>`<p>→ ${safe(t.source.clues[i])}</p>`).join('')}</div>${slideUI.revealSource?`<div class="source-takeaway">✓ ${safe(t.source.takeaway)}</div>`:''}<p class="slide-end-note">Fuente pedagógica recreada; no es una transcripción documental ni una pregunta oficial.</p></div>`;
    if(type==='takeaways') {
      const d=DEEP[t.id]||{},keys=[...t.takeaways,...(d.keys||[])];
      const tabs=[['Ideas clave',keys.length]];
      if(d.dates?.length)tabs.push(['Fechas clave',d.dates.length]);
      if(d.mistakes?.length)tabs.push(['Errores frecuentes',d.mistakes.length]);
      const c=Math.min(slideUI.tab,tabs.length-1),cur=tabs[c][0];
      const body=cur==='Fechas clave'?`<ol class="key-dates">${d.dates.map(x=>`<li><b>${safe(x[0])}</b><span>${safe(x[1])}</span></li>`).join('')}</ol>`
        :cur==='Errores frecuentes'?`<div class="mistake-grid">${d.mistakes.map(x=>`<div class="mistake-card"><p class="mistake-wrong"><i aria-hidden="true">✗</i><span><b class="sr-only">Error: </b>${safe(x[0])}</span></p><p class="mistake-right"><i aria-hidden="true">✓</i><span><b class="sr-only">Corrección: </b>${safe(x[1])}</span></p></div>`).join('')}</div>`
        :`<div class="insight-grid ${keys.length>4?'insight-grid-2':''}">${keys.map((x,i)=>`<div class="insight-row"><span>${String(i+1).padStart(2,'0')}</span><p>${safe(x)}</p></div>`).join('')}</div><div class="overview-callout takeaway-trick"><strong>CONSEJO DE ANÁLISIS</strong><p>${safe(t.trick)}</p></div>`;
      return `<div class="slide slide-padding">${slideHead('15 · Organiza tus ideas','Tu mapa mental del tema.','Repasa las ideas, las fechas y los errores típicos: si puedes explicarlos con un ejemplo, vas bien preparado.')}${tabs.length>1?tabsHTML(tabs.map(x=>`${x[0]} · ${x[1]}`),c):''}<div class="tab-panel" role="tabpanel">${body}</div></div>`;
    }
    return `<div class="slide slide-padding"><div class="finish-card"><div class="finish-badge wax-seal" aria-hidden="true"><span>✓</span></div><div class="slide-kicker">16 / 16 · LECCIÓN COMPLETADA</div><h2>¡Ya tienes<br>las bases!</h2><p>Exploraste el territorio, reconstruiste una secuencia, relacionaste conceptos e interpretaste evidencias, además de superar tres chequeos de comprensión. Ahora puedes desbloquear las <strong>tres pruebas exclusivas</strong> de «${safe(t.title)}».</p><div class="finish-mini"><span>Prueba 1 · Conceptos</span><span>Prueba 2 · Fuentes</span><span>Prueba 3 · Desafío PAES</span></div></div></div>`;
  }
  // The rail is re-rendered on every step: start the new fill from the previous width so it glides.
  function animateTimelineRail(rail,fromWidth,fromOn) {
    const fill=rail?.querySelector('i');
    if(!fill||!fromWidth||fill.style.width===fromWidth)return;
    const target=fill.style.width;
    fill.style.transition='none';fill.style.width=fromWidth;void fill.offsetWidth;
    fill.style.transition='';fill.style.width=target;
    // Each node lights up roughly when the fill reaches it.
    const lit=rail.querySelectorAll('b.on'),added=lit.length-fromOn;
    lit.forEach((b,i)=>{if(i>=fromOn){b.classList.add('tl-arrive');b.style.animationDelay=(.12+.66*(i-fromOn+1)/added)+'s';}});
  }
  // Shrink a slide (down to 80%) when it does not fit the notebook stage, so no inner scrolling is needed.
  function fitSlide() {
    const frame=$('slideFrame'),slide=frame.firstElementChild;
    if(!slide||$('view-lesson').classList.contains('hidden'))return;
    slide.style.zoom='';
    if(window.innerWidth<900||getComputedStyle(frame).overflowY!=='auto')return;
    // Entry animations translate children and would inflate scrollHeight; measure without them.
    frame.classList.add('fit-measure');
    let z=1;
    for(let k=0;k<4&&frame.scrollHeight>frame.clientHeight+2&&z>.8;k++){z=Math.max(.8,z*frame.clientHeight/frame.scrollHeight);slide.style.zoom=z;}
    frame.classList.remove('fit-measure');
  }
  function updateLessonScrollHint() {
    if($('view-lesson').classList.contains('hidden')) return;
    const frame=$('slideFrame'),hint=$('slideHelper');
    const more=frame.scrollHeight > frame.clientHeight+15 && frame.scrollTop+frame.clientHeight < frame.scrollHeight-12;
    hint.classList.toggle('needs-scroll',more);
    hint.textContent=more?'↓ Desplázate para ver más':(hint.dataset.baseText||'Interactúa y continúa.');
  }
  // Igual que fitSlide: reduce la pregunta (hasta 80%) si no cabe en el área disponible.
  function fitExam() {
    const box=$('examScroll'),fit=$('examFit');
    if(!box||!fit||$('view-exam').classList.contains('hidden'))return;
    fit.style.zoom='';
    if(window.innerWidth<900||getComputedStyle(box).overflowY!=='auto')return;
    box.classList.add('fit-measure');
    // Si no cabe, primero se prueban las alternativas en 2 columnas y después se reduce el tamaño.
    if(box.scrollHeight>box.clientHeight+2)$('examOptions').classList.add('options-2col');
    let z=1;
    for(let k=0;k<4&&box.scrollHeight>box.clientHeight+2&&z>.8;k++){z=Math.max(.8,z*box.clientHeight/box.scrollHeight);fit.style.zoom=z;}
    box.classList.remove('fit-measure');
  }
  function updateExamScrollHint() {
    if($('view-exam').classList.contains('hidden')) return;
    const panel=$('examScroll'),hint=$('examScrollHint');
    if(!panel || !hint) return;
    const more=panel.scrollHeight > panel.clientHeight+15 && panel.scrollTop+panel.clientHeight < panel.scrollHeight-12;
    hint.classList.toggle('needs-scroll',more);
    hint.textContent=more?'↓ Desplázate para ver todas las alternativas':'Selecciona una sola respuesta.';
  }
  function renderLesson(animate=true) {
    const t=topic(activeTopic),state=lessonState(activeTopic),entry=SLIDES[slideIndex];
    if(!t) return;
    $('lessonCounter').textContent=`${String(slideIndex+1).padStart(2,'0')} / ${SLIDES.length}`;
    $('lessonStatus').textContent=entry.type==='challenge'?'PREGUNTA INTERACTIVA':'PRESENTACIÓN INTERACTIVA';
    $('lessonRailFill').style.width=((slideIndex+1)/SLIDES.length*100)+'%';
    $('lessonRail').setAttribute('aria-valuenow',Math.round((slideIndex+1)/SLIDES.length*100));
    // Replacing children reruns small, intentional transitions.
    const frame=$('slideFrame');
    const oldRail=!animate&&frame.dataset.slideType==='timeline'?frame.querySelector('.tl-rail'):null;
    const oldFill=oldRail?.querySelector('i').style.width,oldOn=oldRail?oldRail.querySelectorAll('b.on').length:0;
    frame.dataset.slideType=entry.type;
    frame.innerHTML=slideHTML(t,entry);
    frame.style.animation='none';
    frame.classList.remove('enter-fwd','enter-back');
    if(animate&&!REDUCED()){void frame.offsetWidth;frame.classList.add('enter-'+enterDir);}
    if(oldRail&&!REDUCED())animateTimelineRail(frame.querySelector('.tl-rail'),oldFill,oldOn);
    fitSlide();
    applyFx();
    // Entry animations translate children and briefly inflate scrollHeight; re-check once they settle.
    if(animate)setTimeout(updateLessonScrollHint,700);
    $('lessonViewed').textContent=`${slideIndex+1} de ${countSlides()} escenas`;
    $('lessonAgenda').innerHTML=[['Contexto y mapas',0,3],['Cronología y retos',4,6],['Relaciona y compara',7,10],['Fuentes y evidencias',11,13],['Síntesis y pruebas',14,15]].map(([txt,a,b],i)=>`<div class="agenda-item ${slideIndex>=a&&slideIndex<=b?'active':slideIndex>b?'done':''}"><i>${slideIndex>b?'✓':i+1}</i>${safe(txt)}</div>`).join('');
    $('slideDots').innerHTML=SLIDES.map((s,i)=>`<button type="button" class="slide-dot ${i===slideIndex?'current':i<slideIndex?'done':''}" data-slide="${i}" aria-label="Ir a diapositiva ${i+1}: ${safe(s.name)}" ${!state.completed&&i>state.maxSeen?'disabled':''}></button>`).join('');
    $('prevSlide').disabled=slideIndex===0;
    $('nextSlide').disabled=!canPassSlide(slideIndex);
    $('nextSlide').innerHTML=slideIndex===SLIDES.length-1?'Desbloquear 3 pruebas <span aria-hidden="true">↗</span>':`Continuar <span aria-hidden="true">→</span>`;
    $('lessonControlText').textContent=!canPassSlide(slideIndex)?'Completa esta actividad para avanzar.':'Una idea a la vez. Sigue a tu ritmo.';
    $('slideHelper').textContent=entry.type==='challenge'?'Chequeo con respuesta razonada.':entry.type==='timeline'||entry.type==='flash'||entry.type==='compare'||entry.type==='process'||entry.type==='source'||GATED.has(entry.type)?'Toca los elementos para explorar.':'Desliza la ruta a tu ritmo.';
    $('slideHelper').dataset.baseText=$('slideHelper').textContent;
    requestAnimationFrame(updateLessonScrollHint);
  }
  function handleSlideInteraction(e) {
    const b=e.target.closest('button');if(!b)return;
    const t=topic(activeTopic),entry=SLIDES[slideIndex];
    if(b.hasAttribute('data-tlplay')) {
      if(autoTimer){stopAuto();}
      else{
        if(slideUI.timeline>=t.timeline.length-1)slideUI.timeline=0;
        autoTimer=setInterval(()=>{
          if(SLIDES[slideIndex].type!=='timeline'||$('view-lesson').classList.contains('hidden')){stopAuto();return;}
          if(slideUI.timeline>=t.timeline.length-1){stopAuto();renderLesson(false);return;}
          slideUI.timeline++;pendingFx.push(['.timeline-detail','fx-swap'],['.timeline-point.active','fx-pop']);renderLesson(false);
        },2300);
      }
      pendingFx.push(['.timeline-detail','fx-swap']);
    } else if(b.hasAttribute('data-map')) {
      const i=Number(b.dataset.map);slideUI.mapActive=i;pendingFx.push(['.map-detail','fx-swap'],['.map-pin.selected','fx-ripple']);
      if(!slideUI.mapVisits.includes(i))slideUI.mapVisits.push(i);
      if(slideUI.mapVisits.length===INTERACTIVE[t.id].map.points.length)completeGame('map');
    } else if(b.hasAttribute('data-timeline')){stopAuto();slideUI.timeline=Number(b.dataset.timeline);pendingFx.push(['.timeline-detail','fx-swap'],['.timeline-point.active','fx-pop']);}
    else if(b.hasAttribute('data-order')) {
      if(lessonState(t.id).games.order)return;
      const n=Number(b.dataset.order),next=slideUI.orderSelected.length;
      if(n===next){slideUI.orderSelected.push(n);slideUI.orderError='';pendingFx.push([`.order-slot:nth-child(${n+1})`,'fx-pop']);if(slideUI.orderSelected.length===4)completeGame('order');}
      else{slideUI.orderSelected=[];slideUI.orderError='Todavía no. Reiniciamos la secuencia: vuelve a elegir desde el primer hito.';pendingFx.push(['.order-track','fx-shake']);}
    } else if(b.hasAttribute('data-match-term')) {
      slideUI.matchTerm=Number(b.dataset.matchTerm);slideUI.matchError='';
    } else if(b.hasAttribute('data-match-def')) {
      if(lessonState(t.id).games.match)return;
      const n=Number(b.dataset.matchDef);
      if(slideUI.matchTerm===null)slideUI.matchError='Elige un concepto de la columna izquierda primero.';
      else if(slideUI.matchTerm===n){if(!slideUI.matched.includes(n))slideUI.matched.push(n);slideUI.matchTerm=null;slideUI.matchError='';pendingFx.push([`[data-match-term="${n}"]`,'fx-pop'],[`[data-match-def="${n}"]`,'fx-pop']);if(slideUI.matched.length===4)completeGame('match');}
      else{slideUI.matchError='La definición no corresponde a ese concepto. Inténtalo con otra evidencia.';slideUI.matchTerm=null;pendingFx.push([`[data-match-def="${n}"]`,'fx-shake']);}
    } else if(b.hasAttribute('data-source-choice')) {
      if(lessonState(t.id).games.sourcegame)return;
      const n=Number(b.dataset.sourceChoice);slideUI.sourceAnswer=n;
      if(n===INTERACTIVE[t.id].sourceGame.answer){completeGame('sourcegame');pendingFx.push(['.source-mission','fx-stamp']);}
      else pendingFx.push([`[data-source-choice="${n}"]`,'fx-shake']);
    } else if(b.hasAttribute('data-flip')) {const i=Number(b.dataset.flip);slideUI.flips=slideUI.flips.includes(i)?slideUI.flips.filter(n=>n!==i):[...slideUI.flips,i];pendingFx.push([`[data-flip="${i}"]`,'just-flipped']);}
    else if(b.hasAttribute('data-compare')) {slideUI.compare=Number(b.dataset.compare);pendingFx.push(['.compare-card','fx-swap'],['.compare-side','fx-swap']);}
    else if(b.hasAttribute('data-process')) {slideUI.process=Number(b.dataset.process);pendingFx.push(['.process-detail','fx-swap']);}
    else if(b.hasAttribute('data-tab')) {slideUI.tab=Number(b.dataset.tab);pendingFx.push(['.tab-panel','fx-swap']);}
    else if(b.hasAttribute('data-hint')) {const i=Number(b.dataset.hint);if(!slideUI.hints.includes(i)){slideUI.hints.push(i);pendingFx.push(['.source-hints p:last-child','fx-in']);}}
    else if(b.hasAttribute('data-reveal')) {slideUI.revealSource=!slideUI.revealSource;pendingFx.push(['.source-takeaway','fx-in']);}
    else if(b.hasAttribute('data-check')) {
      if(entry.type!=='challenge')return;
      const n=Number(b.dataset.check),i=entry.quiz;
      if(lessonState(activeTopic).passed.includes(i))return;
      if(n===t.checks[i][2]) {const s=lessonState(activeTopic);s.passed.push(i);saveProgress();notify('¡Correcto! Entendiste el concepto.');burst();slideUI.wrong=false;pendingFx.push(['.check-card','fx-stamp']);}
      else{slideUI.chosen=n;slideUI.wrong=true;pendingFx.push(['.check-option.wrong','fx-shake']);}
    } else return;
    renderLesson(false);
  }
  function optionsFor(tid,level,n,orders,items) {
    const item=items?.[n]||LEGACY_BANK[tid][level][n];
    const order=orders?.[n] || [0,1,2,3];
    return order.map((orig,i)=>({orig,letter:'ABCD'[i],text:item.choices[orig]}));
  }
  function resultOrders(tid,idx) {return testInfo(tid,idx)?.lastResult?.orders;}
  async function startExam(tid,idx) {
    if(!lessonState(tid).completed){notify('Completa primero la presentación interactiva.');return;}
    if(exam && (exam.topicId!==tid || exam.testIdx!==idx)) {
      const answered=exam.answers.filter(a=>a!==null).length;
      if(!await uiConfirm({title:'Ya tienes otra prueba en curso',message:`Si comienzas esta, se descartarán tus ${answered} respuesta${answered===1?'':'s'} de «${testTitle(exam.topicId,exam.testIdx)}».`,confirmText:'Descartar y comenzar',cancelText:'Conservar la otra',tone:'danger'})) return;
      exam=null;saveExam();
    }
    if(!exam) {
      exam={topicId:tid,testIdx:idx,pos:0,answers:Array(10).fill(null),flags:Array(10).fill(false),...ENGINE.newShort(BANK[tid][idx]),deadline:Date.now()+20*60*1000,pausedRemaining:null};
      saveExam();
    }
    activeTopic=tid;displayView('exam');
    $('examTitle').textContent=TEST_META[idx].name;
    $('examSubtitle').textContent=`${topic(tid).title} · PRUEBA 0${idx+1} DE 03`;
    renderExam();stopTimer();if(exam.deadline!==null)ticker=setInterval(tickExam,1000);tickExam();
  }
  function stopTimer(){if(ticker){clearInterval(ticker);ticker=null;}}
  function tickExam(){
    if(!exam) return;
    const rem=Math.max(0,Math.ceil((exam.deadline===null?exam.pausedRemaining:exam.deadline-Date.now())/1000));
    $('examTimer').textContent=`${String(Math.floor(rem/60)).padStart(2,'0')}:${String(rem%60).padStart(2,'0')}`;
    $('examTimer').classList.toggle('low',rem<=180);
    if(rem===0 && exam.deadline!==null) finishExam(true);
  }
  function renderExam(resetScroll=false) {
    if(!exam)return;
    const paused=exam.deadline===null;
    $('examWorkspace').hidden=paused;
    $('examPausePanel').hidden=!paused;
    $('pauseExam').hidden=paused;
    if(paused){tickExam();$('resumeExam').focus();return;}
    const n=exam.pos, item=exam.items[n], opts=optionsFor(exam.topicId,exam.testIdx,n,exam.orders,exam.items);
    const filled=exam.answers.filter(a=>a!==null).length;
    $('examQnumber').textContent=`PREGUNTA ${String(n+1).padStart(2,'0')} / 10`;
    $('examQskill').textContent=TEST_META[exam.testIdx].skill;
    $('examQuestion').textContent=item.text;
    $('examSource').innerHTML=(item.viz?renderViz(item.viz):'')+(item.source?`<div class="exam-source"><strong>FUENTE DIDÁCTICA RECREADA</strong>${safe(item.source)}</div>`:'');
    $('examOptions').innerHTML=opts.map(o=>`<button type="button" data-choice="${o.orig}" class="exam-option ${exam.answers[n]===o.orig?'selected':''}" aria-pressed="${exam.answers[n]===o.orig}"><span class="opt-letter">${o.letter}</span><span>${safe(o.text)}</span></button>`).join('');
    $('examFlag').textContent=exam.flags[n]?'★ Quitar marca':'☆ Marcar para revisar';
    $('examFlag').classList.toggle('active',exam.flags[n]);
    $('examAnswered').textContent=`${filled} / 10 respondidas`;
    $('examProgressFill').style.width=(filled*10)+'%';
    $('examNumbers').innerHTML=exam.answers.map((a,i)=>`<button type="button" data-qpos="${i}" class="exam-num ${a!==null?'answered':''} ${exam.flags[i]?'flagged':''} ${i===n?'current':''}" aria-label="Pregunta ${i+1}${a!==null?', respondida':''}${exam.flags[i]?', marcada para revisar':''}" aria-current="${i===n?'step':'false'}">${i+1}</button>`).join('');
    $('examPrev').disabled=n===0;
    $('examNext').textContent=n===9?'Ir a la primera ↺':'Siguiente →';
    // Alternativas cortas en 2 columnas: la pregunta completa cabe sin desplazarse.
    $('examOptions').classList.toggle('options-2col',opts.every(o=>o.text.length<=90));
    if(resetScroll) $('examScroll').scrollTop=0;
    fitExam();
    requestAnimationFrame(updateExamScrollHint);
  }
  function pauseExam() {
    if(!exam)return false;
    if(exam.deadline!==null){
      const remaining=exam.deadline-Date.now();
      if(remaining<=0){finishExam(true);return false;}
      exam.pausedRemaining=remaining;exam.deadline=null;
    }
    stopTimer();saveExam();renderExam();return true;
  }
  function resumeExam() {
    if(!exam || exam.deadline!==null)return;
    exam.deadline=Date.now()+Math.max(0,exam.pausedRemaining||0);exam.pausedRemaining=null;
    saveExam();renderExam();stopTimer();ticker=setInterval(tickExam,1000);tickExam();$('pauseExam').focus();
  }
  function pauseExamAndExit() {
    if(!pauseExam()) return;
    openTopic(exam.topicId);
    notify('Prueba pausada. Puedes continuar cuando quieras.');
  }
  async function finishExam(force=false) {
    if(!exam || exam.deadline===null) return;
    if(force) window.uiDismiss?.();
    const empty=exam.answers.filter(a=>a===null).length,flagged=exam.flags.filter(Boolean).length;
    if(!force && !await uiConfirm({title:'¿Finalizar y corregir la prueba?',
      message:empty?`Te ${empty===1?'queda 1 pregunta':`quedan ${empty} preguntas`} sin responder: contarán como incorrectas.`:'Respondiste todas las preguntas. Después verás la corrección comentada y tu puntaje estimado.',
      stats:[[exam.answers.length-empty,'Respondidas','ok'],[empty,'Sin responder',empty?'warn':''],[flagged,'Marcadas',flagged?'warn':'']],
      confirmText:'Finalizar y corregir',cancelText:'Seguir respondiendo'})) return;
    if(!exam || exam.deadline===null) return; // el estado pudo cambiar mientras se confirmaba
    stopTimer();
    const curr=exam,correct=curr.answers.filter((a,i)=>a===curr.items[i].answer).length;
    const percentage=correct*10;
    const key=curr.topicId+':'+curr.testIdx;
    const old=testInfo(curr.topicId,curr.testIdx);
    progress.results[key]={best:Math.max(old?.best||0,percentage),last:percentage,attempts:(old?.attempts||0)+1,lastResult:{answers:[...curr.answers],flags:[...curr.flags],orders:curr.orders.map(a=>[...a]),items:curr.items,bankVersion:curr.bankVersion,questionOrder:curr.questionOrder,correct,submittedAt:Date.now(),timedOut:force}};
    saveProgress();
    resultLocation={topicId:curr.topicId,testIdx:curr.testIdx};
    exam=null;saveExam();
    lastReviewOnlyWrong=false;
    showResult();
    if(force) notify('Terminó el tiempo: corregimos las respuestas marcadas.');
  }
  function showResult(tid=resultLocation?.topicId,idx=resultLocation?.testIdx) {
    if(!tid || idx===undefined || !testInfo(tid,idx)) return;
    const t=topic(tid),r=testInfo(tid,idx),last=r.lastResult;
    activeTopic=tid;resultLocation={topicId:tid,testIdx:idx};
    displayView('result');
    $('resultCrumb').textContent=`${t.title} · Prueba ${idx+1}`;
    const motivational=last.correct===10?'¡Dominio sobresaliente!':last.correct>=7?'¡Tema dominado!':last.correct>=4?'Estás construyendo una base.':'Refuerza y vuelve a intentarlo.';
    $('resultTop').innerHTML=`<div><div class="small-label">PRUEBA 0${idx+1} · CORRECCIÓN DISPONIBLE</div><h1>${motivational}</h1><p>${safe(t.title)} · ${safe(TEST_META[idx].name)}. Meta de dominio: 70% o más. Revisa cada explicación y vuelve a intentarlo. Para obtener tu puntaje PAES estimado, rinde el ensayo ponderado completo.</p></div><div class="result-score"><strong>${r.last}%</strong><span>ACIERTO</span></div>`;
    const unanswered=last.answers.filter(a=>a===null).length;
    const values=[[last.correct,'Correctas'],[10-last.correct-unanswered,'Incorrectas'],[unanswered,'Sin responder'],[r.best+'%','Mejor resultado']];
    $('resultMetrics').innerHTML=values.map(([n,label])=>`<div class="result-stat"><strong>${safe(n)}</strong><span>${safe(label)}</span></div>`).join('');
    $('filterReviewAll').classList.toggle('selected',!lastReviewOnlyWrong);
    $('filterReviewWrong').classList.toggle('selected',lastReviewOnlyWrong);
    renderResultReview();
    const sc=document.querySelector('.result-score strong');if(sc){sc.dataset.shown='0';countUp(sc,r.last,'%');}
  }
  function renderResultReview() {
    if(!resultLocation)return;
    const {topicId:tid,testIdx:idx}=resultLocation;
    const answers=testInfo(tid,idx).lastResult.answers;
    const items=testInfo(tid,idx).lastResult.items;
    $('resultReview').innerHTML=answers.map((a,n)=>{
      const item=items?.[n]||LEGACY_BANK[tid][idx][n],opts=optionsFor(tid,idx,n,resultOrders(tid,idx),items),correct=a===item.answer;
      if(lastReviewOnlyWrong&&correct)return '';
      const chosen=opts.find(o=>o.orig===a);
      const right=opts.find(o=>o.orig===item.answer);
      return `<article class="review-card"><div class="review-head"><span class="review-number">PREGUNTA ${String(n+1).padStart(2,'0')}</span><span class="review-status ${correct?'correct':'incorrect'}">${correct?'✓ Correcta':a===null?'— Sin responder':'✕ Incorrecta'}</span></div>${item.viz?renderViz(item.viz):''}${item.source?`<div class="review-source">${safe(item.source)}</div>`:''}<h3>${safe(item.text)}</h3><p class="review-answer">Tu respuesta: <strong>${chosen?`${chosen.letter}) ${safe(chosen.text)}`:'Sin responder'}</strong></p><p class="review-answer">Respuesta correcta: <strong>${right.letter}) ${safe(right.text)}</strong></p><div class="review-explain"><strong>¿Por qué?</strong> ${safe(item.why)}</div></article>`;
    }).join('') || `<div class="empty-search">¡No hay errores en esta prueba! Todas tus respuestas fueron correctas.</div>`;
  }
  function exportCSV() {
    if(!resultLocation)return;
    const {topicId:tid,testIdx:idx}=resultLocation;
    const answers=testInfo(tid,idx).lastResult.answers;
    const items=testInfo(tid,idx).lastResult.items;
    const rows=[['N°','Tema','Prueba','Pregunta','Tu alternativa','Alternativa correcta','Estado','Explicación']];
    answers.forEach((a,n)=>{
      const item=items?.[n]||LEGACY_BANK[tid][idx][n],opts=optionsFor(tid,idx,n,resultOrders(tid,idx),items),sel=opts.find(o=>o.orig===a),right=opts.find(o=>o.orig===item.answer);
      rows.push([n+1,topic(tid).title,idx+1,item.text,sel?.letter||'',right.letter,a===item.answer?'Correcta':'Incorrecta o pendiente',item.why]);
    });
    const csv='\ufeff'+rows.map(row=>row.map(val=>'"'+String(val).replace(/"/g,'""')+'"').join(';')).join('\r\n');
    const blob=new Blob([csv],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),anchor=document.createElement('a');
    anchor.href=url;anchor.download=`paes-2027-${tid}-prueba-${idx+1}.csv`;document.body.append(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function events() {
    $('homeBrand').addEventListener('click',()=>goHome());
    $('headerTopics').addEventListener('click',()=>goHome(true));
    $('heroExplore').addEventListener('click',()=>$('topicGrid').scrollIntoView({behavior:'smooth',block:'start'}));
    $('nextLessonBtn').addEventListener('click',e=>openTopic(e.currentTarget.dataset.nextTopic));
    $('filterControls').addEventListener('click',e=>{
      const btn=e.target.closest('[data-filter]');if(!btn)return;
      selectedFilter=btn.dataset.filter;
      document.querySelectorAll('.filter').forEach(el=>{el.classList.toggle('active',el===btn);el.setAttribute('aria-pressed',String(el===btn));});
      renderHome();
    });
    $('topicSearch').addEventListener('input',renderHome);
    $('topicGrid').addEventListener('click',e=>{const card=e.target.closest('[data-topic]');if(card)openTopic(card.dataset.topic);});
    $('topicBack').onclick=()=>goHome(true);
    $('topicTests').addEventListener('click',e=>{
      const btn=e.target.closest('button');if(!btn)return;
      if(btn.hasAttribute('data-test'))startExam(activeTopic,Number(btn.dataset.test));
      if(btn.hasAttribute('data-review')){lastReviewOnlyWrong=false;showResult(activeTopic,Number(btn.dataset.review));}
    });
    $('exitLesson').onclick=()=>openTopic(activeTopic);
    $('prevSlide').onclick=()=>goSlide(slideIndex-1);
    $('nextSlide').onclick=nextSlide;
    $('slideDots').addEventListener('click',e=>{const b=e.target.closest('[data-slide]');if(b&&!b.disabled)goSlide(Number(b.dataset.slide));});
    const toggleFocusMode = () => {
      const enabled = !$('view-lesson').classList.contains('is-focused');
      $('view-lesson').classList.toggle('is-focused',enabled);
      $('lessonFocusToggle').setAttribute('aria-pressed',String(enabled));
      $('lessonFocusToggle').setAttribute('aria-label',enabled?'Desactivar modo enfoque y mostrar la ruta':'Activar modo enfoque y ocultar el panel de ruta');
      $('lessonFocusText').textContent=enabled?'Mostrar ruta':'Modo enfoque';
      fitSlide();updateLessonScrollHint();
    };
    $('lessonFocusToggle').addEventListener('click',toggleFocusMode);

    $('slideFrame').addEventListener('click',handleSlideInteraction);
    $('slideFrame').addEventListener('scroll',updateLessonScrollHint,{passive:true});
    let fitTimer;
    window.addEventListener('resize',()=>{clearTimeout(fitTimer);fitTimer=setTimeout(()=>{fitSlide();updateLessonScrollHint();fitExam();updateExamScrollHint();},150);});
    document.fonts?.ready.then(()=>{fitSlide();updateLessonScrollHint();});
    $('examScroll').addEventListener('scroll',updateExamScrollHint,{passive:true});
    document.addEventListener('keydown',e=>{
      if($('view-lesson').classList.contains('hidden')||['INPUT','TEXTAREA','BUTTON','SELECT'].includes(document.activeElement?.tagName)||e.altKey||e.ctrlKey||e.metaKey)return;
      if(e.key==='ArrowRight'){e.preventDefault();nextSlide();}if(e.key==='ArrowLeft'){e.preventDefault();goSlide(slideIndex-1);}
    });
    $('exitExam').onclick=pauseExamAndExit;
    $('pauseExam').onclick=pauseExam;
    $('resumeExam').onclick=resumeExam;
    $('examOptions').addEventListener('click',e=>{
      const btn=e.target.closest('[data-choice]');if(!btn||!exam||exam.deadline===null)return;
      exam.answers[exam.pos]=Number(btn.dataset.choice);saveExam();renderExam();
      const sel=document.querySelector('#examOptions .exam-option.selected');if(sel){sel.classList.add('fx-pop');}
    });
    $('axisCards').addEventListener('click',e=>{
      const b=e.target.closest('[data-axis-filter]');if(!b)return;
      const btn=document.querySelector(`.filter[data-filter="${b.dataset.axisFilter}"]`);if(btn)btn.click();
      $('topicGrid').scrollIntoView({behavior:REDUCED()?'auto':'smooth',block:'start'});
    });
    let touch=null;
    $('slideFrame').addEventListener('touchstart',e=>{const p=e.changedTouches[0];touch={x:p.clientX,y:p.clientY,t:Date.now()};},{passive:true});
    $('slideFrame').addEventListener('touchend',e=>{
      if(!touch)return;const p=e.changedTouches[0],dx=p.clientX-touch.x,dy=p.clientY-touch.y,dt=Date.now()-touch.t;touch=null;
      if(dt<600&&Math.abs(dx)>70&&Math.abs(dy)<45){if(dx<0)nextSlide();else goSlide(slideIndex-1);}
    },{passive:true});
    document.addEventListener('keydown',e=>{
      if($('view-exam').classList.contains('hidden')||!exam||exam.deadline===null||e.altKey||e.ctrlKey||e.metaKey||['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))return;
      const k=e.key.toUpperCase(),idx='ABCD'.indexOf(k);
      if(idx>=0&&k.length===1){const opt=$('examOptions').children[idx];if(opt){e.preventDefault();opt.click();}}
      else if(e.key==='ArrowRight'){e.preventDefault();$('examNext').click();}
      else if(e.key==='ArrowLeft'&&exam.pos>0){e.preventDefault();$('examPrev').click();}
    });
    $('examNumbers').addEventListener('click',e=>{const btn=e.target.closest('[data-qpos]');if(!btn||!exam||exam.deadline===null)return;exam.pos=Number(btn.dataset.qpos);saveExam();renderExam(true);});
    $('examPrev').onclick=()=>{if(!exam||exam.deadline===null)return;exam.pos=Math.max(0,exam.pos-1);saveExam();renderExam(true);};
    $('examNext').onclick=()=>{if(!exam||exam.deadline===null)return;exam.pos=(exam.pos+1)%10;saveExam();renderExam(true);};
    $('examFlag').onclick=()=>{if(!exam||exam.deadline===null)return;exam.flags[exam.pos]=!exam.flags[exam.pos];saveExam();renderExam();};
    $('finishExam').onclick=()=>finishExam(false);
    $('resultTopicBack').onclick=()=>goBackResult();
    $('resultGoTopic').onclick=()=>goBackResult();
    $('filterReviewAll').onclick=()=>{lastReviewOnlyWrong=false;showResult();};
    $('filterReviewWrong').onclick=()=>{lastReviewOnlyWrong=true;showResult();};
    $('exportResult').onclick=exportCSV;
    document.addEventListener('visibilitychange',()=>{if(!document.hidden && !$('view-exam').classList.contains('hidden'))tickExam();});
  }
  function goBackResult(){if(resultLocation)openTopic(resultLocation.topicId);else goHome();}
  function testTitle(tid,idx){return `${topic(tid).title} · Prueba ${idx+1}: ${TEST_META[idx].name}`;}
  function renderHistory(){
    if(!SCORE||!$('historyHome'))return;
    $('historyHome').innerHTML=SCORE.historyHTML(10,'clasico/index.html');
    $('clearHistory').classList.toggle('hidden',!SCORE.list().length);
  }
  restore();events();renderHome();displayView('home');
  // Enlace directo a una unidad (p. ej. desde «Qué reforzar» del ensayo): index.html#tema=<id>
  const linked=location.hash.match(/^#tema=([\w-]+)$/);
  if(linked&&topic(linked[1])){history.replaceState(null,'',location.pathname);openTopic(linked[1]);}
  $('clearHistory')?.addEventListener('click',async()=>{
    if(SCORE&&await uiConfirm({title:'¿Borrar tu historial de ensayos?',message:`Se eliminará${SCORE.list().length===1?' el único ensayo guardado':`n los ${SCORE.list().length} ensayos guardados`} en este navegador, con sus puntajes y respuestas. Tu avance en las lecciones no se borra. No se puede deshacer.`,confirmText:'Borrar historial',cancelText:'Cancelar',tone:'danger'})){SCORE.clear();renderHistory();notify('Historial borrado.');}
  });
  if('IntersectionObserver' in window && !REDUCED()){
    const io=new IntersectionObserver(list=>list.forEach(en=>{if(en.isIntersecting){en.target.classList.add('in');io.unobserve(en.target);}}),{threshold:.12});
    document.querySelectorAll('.weight-board,.study-next,.filters-bar,.bottom-banner,.dashboard-intro').forEach(el=>{el.classList.add('reveal');io.observe(el);});
  }
  document.querySelectorAll('[data-count]').forEach(el=>{const n=Number(el.dataset.count);el.dataset.shown='0';countUp(el,n);});
  console.info(`Historia Lab Pro: ${TOPICS.length} temas, ${TOPICS.length*3} pruebas, ${TOPICS.length*30} preguntas originales.`);
})();
