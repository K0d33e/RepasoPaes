/* Puntaje PAES estimado e historial de ensayos, compartido entre el aula (index.html) y el simulador (clasico/).
   Escala: DEMRE, «Tabla de Transformación de Puntajes PAES Regular — Historia y Ciencias Sociales»,
   Proceso de Admisión 2025. En la PAES real, 60 de las 65 preguntas inciden en el puntaje.
   Las pruebas de otro largo se llevan proporcionalmente a esas 60 preguntas: es una estimación, no un puntaje oficial.
   El historial guarda SOLO ensayos ponderados completos (kind 'full'), con una copia de cada pregunta y la respuesta dada. */
(() => {
  'use strict';
  // TABLE[n] = puntaje PAES para n respuestas correctas de 60.
  const TABLE = [100,106,135,161,184,206,227,248,266,282,297,311,327,344,360,374,385,395,404,415,429,444,460,473,484,492,499,506,515,527,542,557,572,583,591,598,605,614,625,639,655,670,683,693,703,712,724,739,756,772,788,802,817,834,853,873,895,917,941,968,1000];
  const SCORED = 60;
  const KEY = 'historialab-paes-2027-history-v1';
  // Cada ensayo guardado pesa ~45 KB (65 preguntas con su explicación).
  const MAX_ENTRIES = 40;

  // Respuestas correctas llevadas a la escala de 60 preguntas (puede ser fraccionario).
  const equivalent = (correct, total) => total > 0 ? Math.max(0, Math.min(SCORED, correct / total * SCORED)) : 0;
  // Interpola linealmente entre filas de la tabla cuando el equivalente no es entero.
  function score(correct, total) {
    const x = equivalent(correct, total), lo = Math.floor(x), hi = Math.ceil(x);
    return Math.round(TABLE[lo] + (TABLE[hi] - TABLE[lo]) * (x - lo));
  }
  // Solo ensayos completos: versiones anteriores también guardaban pruebas por tema y prácticas cortas.
  function list() {
    try { const a = JSON.parse(localStorage.getItem(KEY)); return Array.isArray(a) ? a.filter(e => e && e.kind === 'full' && Number.isFinite(e.score)) : []; }
    catch (_) { return []; }
  }
  // Si el navegador no tiene espacio, se descartan los ensayos más antiguos hasta que quepa.
  function save(entries) {
    for (let n = Math.min(entries.length, MAX_ENTRIES); n > 0; n = Math.floor(n * 0.7)) {
      try { localStorage.setItem(KEY, JSON.stringify(entries.slice(0, n))); return true; } catch (_) {}
    }
    return false;
  }
  // Guarda un ensayo terminado. entry: {source, kind:'full', title, correct, total, questions, ...extra}
  function record(entry) {
    const e = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7), date: Date.now(), ...entry };
    e.score = score(e.correct, e.total);
    e.pct = e.total ? Math.round(100 * e.correct / e.total) : 0;
    save([e, ...list()]);
    return e;
  }
  const get = id => list().find(e => e.id === id) || null;
  function clear() { try { localStorage.removeItem(KEY); } catch (_) {} }
  const formatDate = ts => new Date(ts).toLocaleString('es-CL', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // Resumen + lista de ensayos (más recientes primero). href: página del simulador donde se abre la revisión.
  function historyHTML(limit = 12, href = '') {
    const all = list();
    if (!all.length) return `<p class="history-empty">Aún no has rendido ensayos completos. Cuando termines un ensayo PAES ponderado (65 preguntas · 120 min), aparecerá aquí con su puntaje y podrás revisar tus respuestas.</p>`;
    const recent = all.slice(0, 5), avg = Math.round(recent.reduce((s, e) => s + e.score, 0) / recent.length);
    const tiles = [
      [Math.max(...all.map(e => e.score)), 'Mejor puntaje'],
      [all[0].score, 'Último ensayo'],
      [avg, recent.length > 1 ? `Promedio últimos ${recent.length}` : 'Promedio'],
      [all.length, all.length === 1 ? 'Ensayo rendido' : 'Ensayos rendidos'],
    ];
    const rows = all.slice(0, limit).map((e, i) => {
      const prev = all[i + 1];
      const d = prev ? e.score - prev.score : null;
      const delta = d === null ? '' : `<em class="h-delta ${d > 0 ? 'up' : d < 0 ? 'down' : ''}" title="Cambio respecto del ensayo anterior">${d > 0 ? '▲ ' + d : d < 0 ? '▼ ' + Math.abs(d) : '= 0'}</em>`;
      const body = `<span class="h-date">${esc(formatDate(e.date))}</span><span class="h-title"><b>${esc(e.title)}</b><small>${e.correct}/${e.total} correctas (${e.pct}%)${e.timedOut ? ' · tiempo agotado' : ''}${e.questions ? '' : ' · sin detalle de respuestas'}</small></span><span class="h-score"><strong>${e.score}</strong><small>pts</small>${delta}</span>`;
      return e.questions
        ? `<li><a class="history-row is-link" href="${esc(href)}#ensayo=${esc(e.id)}" aria-label="Revisar ensayo del ${esc(formatDate(e.date))}: ${e.score} puntos">${body}<span class="h-go" aria-hidden="true">Revisar →</span></a></li>`
        : `<li><div class="history-row">${body}<span class="h-go" aria-hidden="true"></span></div></li>`;
    }).join('');
    return `<div class="history-summary">${tiles.map(([v, l]) => `<div><strong>${esc(v)}</strong><span>${esc(l)}</span></div>`).join('')}</div>`
      + `<ol class="history-list">${rows}</ol>`
      + (all.length > limit ? `<p class="history-more">Mostrando los ${limit} más recientes de ${all.length}.</p>` : '')
      + `<p class="history-note">Abre un ensayo para ver tus respuestas, por qué las incorrectas lo eran y qué unidades reforzar. Puntaje PAES estimado con la tabla oficial del DEMRE (Admisión 2025). Se guarda en este navegador.</p>`;
  }

  window.PAES_SCORE = { TABLE, SCORED, KEY, equivalent, score, list, get, record, save, clear, formatDate, historyHTML,
    SOURCE: 'Tabla de Transformación de Puntajes PAES Regular, Historia y Ciencias Sociales, Proceso de Admisión 2025 (DEMRE)' };
})();
