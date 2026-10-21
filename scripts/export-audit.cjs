// Exporta una matriz curricular de los bancos activos; no certifica claves DEMRE.
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const ctx = { window: {}, console }; vm.createContext(ctx);
for (const f of ['content.js', 'questions.js', 'questions-plus.js', 'clasico/banco-paes.js','exam-engine.js','review-history.js','review-citizenship.js','review-economy.js']) vm.runInContext(read(f), ctx);
vm.runInContext(read('clasico/app.js').split('const WEIGHTS=')[0] + ';globalThis.classicQ=Q;', ctx);
const pages = { liberalismo: 6, chile19: 6, crisisxx: 6, guerr_fria: 7, chilexx: 7, democracia: 8, ciudadania: 8, mercado: 9, trabajo: 9 };
const reference = 'https://acceso.mineduc.cl/wp-content/uploads/2026/03/Temario-PAESRegular-2026-Historia-v2.pdf';
const rows = [['ID estable del banco', 'Unidad didáctica', 'Eje', 'Página de conocimientos del temario 2027', 'Enunciado', 'Alternativa correcta antes de barajar', 'Texto de respuesta correcta', 'Explicación', 'Fuente del ejercicio', 'Referencia curricular', 'Alcance']];
function add(id, tid, text, opts, k, why, src) {
  const t = ctx.window.PAES_TOPICS.find(t => t.id === tid);
  if (!t) throw new Error('Unidad no encontrada: ' + id);
  rows.push([id, t.title, t.axis, pages[tid], text, 'ABCD'[k], opts[k], why, src || 'Ejercicio original', reference, 'Vinculación por unidad; habilidades transversales pp. 4–5. Pregunta y clave originales, no oficiales.']);
}
const activeBank=ctx.window.PAES_EXAM.reviewShort(ctx.window.PAES_TEST_BANK,ctx.window.PAES_REVIEW.short);
for (const [tid, tests] of Object.entries(activeBank)) for (const [level, qs] of tests.entries()) for (const [n, q] of qs.entries()) add(`${tid}/${level + 1}/${n + 1}`, tid, q.text, q.choices, q.answer, q.why, q.source);
for (const [i, q] of ctx.classicQ.entries()) add(`ensayo/${i + 1}`, q.t, q.q, q.opts, q.k, q.why, q.src);
const quote = value => '"' + String(value).replaceAll('"', '""') + '"';
fs.mkdirSync(path.join(root, 'docs'), { recursive: true });
fs.writeFileSync(path.join(root, 'docs/matriz-curricular.csv'), '\ufeff' + rows.map(r => r.map(quote).join(';')).join('\r\n'), 'utf8');
console.log(`Matriz exportada: ${rows.length - 1} preguntas originales.`);
