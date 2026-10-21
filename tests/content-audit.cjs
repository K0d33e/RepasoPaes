const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const ctx = { window: {}, console }; vm.createContext(ctx);
for (const file of ['content.js', 'questions.js', 'questions-plus.js', 'deep-content.js', 'clasico/banco-paes.js']) vm.runInContext(read(file), ctx);
vm.runInContext(read('clasico/app.js').split('const WEIGHTS=')[0] + ';globalThis.classicQ=Q;', ctx);
// Banco anterior conservado para reanudar intentos y revisar resultados previos.
const bank = ctx.window.PAES_TEST_BANK;

test('374 preguntas completas y claves estructuralmente válidas', () => {
  const short = Object.values(bank).flat(2), classic = ctx.classicQ;
  assert.equal(short.length, 270); assert.equal(classic.length, 104);
  for (const q of [...short.map(q => ({ choices: q.choices, answer: q.answer, why: q.why })), ...classic.map(q => ({ choices: q.opts, answer: q.k, why: q.why }))]) {
    assert.equal(q.choices.length, 4); assert.equal(new Set(q.choices).size, 4);
    assert.ok(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < 4); assert.ok(q.why);
  }
});
test('El ítem de 1991 tiene una sola respuesta temporal válida', () => {
  const q = ctx.classicQ[17];
  const years = [1945, 1914, 1989, 1776];
  const candidates = years.map((y, i) => ({ y, i })).filter(x => x.y < 1991);
  const correct = /más cercano|más cerca|inmediatamente/.test(q.q)
    ? candidates.filter(x => x.y === Math.max(...candidates.map(x => x.y))) : candidates;
  assert.equal(correct.length, 1, 'El enunciado acepta varias alternativas anteriores a 1991');
  assert.equal(q.k, correct[0].i);
});
test('Oferta contraída y demanda mayor: cantidad ambigua, precio al alza', () => {
  const q = bank.mercado[2][3];
  assert.match(q.text, /cantidad/);
  assert.match(q.why, /precio.*alza|precio.*aument/);
});
test('La cronología distingue ley de sufragio y primera votación', () => {
  assert.doesNotMatch(read('clasico/banco-paes.js'), /1934 · mujeres votan/);
  assert.match(read('clasico/banco-paes.js'), /1935/);
});
test('Comparar CAE requiere igual monto y plazo', () => {
  const q = ctx.classicQ.find(q => q.opts.some(o => /Carga Anual Equivalente/.test(o)));
  assert.match(q.q, /mismo monto y plazo|igual monto y plazo/);
  assert.match(q.why, /anual/);
});
test('Ciudadanía actualiza requisitos extranjeros y vigencia de datos', () => {
  const text = read('deep-content.js');
  assert.doesNotMatch(text, /Extranjeros avecindados por más de 5 años pueden votar/);
  assert.match(text, /diez años ininterrumpidos/);
  assert.match(text, /1 de diciembre de 2026/);
});
test('La distribución didáctica se identifica en las dos portadas', () => {
  for (const file of ['index.html', 'clasico/index.html']) {
    assert.match(read(file), /distribución (didáctica |educativa )?propia/i);
    assert.doesNotMatch(read(file), /proporción PAES \(36/);
  }
});
test('Cronología ampliada separa el fin de la guerra y la unificación formal de Vietnam', () => {
  const text = read('deep-content.js');
  assert.ok(text.includes('reunificación formal en 1976'), 'Vietnam requiere distinguir los hitos de 1975 y 1976');
  assert.ok(!text.includes('Su Consejo de Seguridad tiene cinco miembros permanentes con derecho a veto: EE. UU., URSS'), 'La URSS debe situarse en su contexto histórico');
});
test('La inferencia sobre migración dispone de evidencia migratoria en el enunciado', () => {
  assert.ok(bank.chilexx[2][7].text.includes('migración campo-ciudad'), 'La urbanización por sí sola no prueba migración');
});
test('La escala actual mantiene los extremos de 100 a 1000 puntos', () => {
  vm.runInContext(read('paes-score.js'), ctx);
  assert.equal(ctx.window.PAES_SCORE.TABLE.length,61);
  assert.equal(ctx.window.PAES_SCORE.score(0, 65), 100);
  assert.equal(ctx.window.PAES_SCORE.score(65, 65), 1000);
});
test('Las inferencias comerciales no dependen de datos de comunicación ausentes', () => {
  const q = bank.guerr_fria[2][7];
  assert.ok(!q.choices.some(x => /redes de comunicación/.test(x)), 'La alternativa D también era una inferencia indebida');
});
test('La secuencia que incluye 1789 no se limita al siglo XIX', () => {
  const q = bank.liberalismo[0][0];
  assert.ok(q.viz.entries.some(([year]) => year === '1789'));
  assert.match(q.text, /XVIII/);
});
test('La explicación de datos reconoce bases legales además del consentimiento', () => {
  assert.match(ctx.classicQ[99].why, /autorizaciones legales|bases legales/);
});
test('El caso de amparo describe una detención ilegal sin flagrancia', () => {
  assert.match(ctx.classicQ[92].q, /ilegalmente/);
  assert.match(ctx.classicQ[92].q, /flagrancia/);
});
