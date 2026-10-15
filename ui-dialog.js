/* Diálogo de confirmación con el estilo del sitio (reemplaza window.confirm). Compartido por el aula y clasico/.
   uiConfirm({title, message, stats, confirmText, cancelText, tone, icon}) -> Promise<boolean>
   tone: 'primary' (acción principal) | 'danger' (acción destructiva: el foco inicial queda en «Cancelar»). */
(() => {
  'use strict';
  let current = null; // {dialog, resolve, opener}
  let seq = 0; // ids únicos aunque un diálogo anterior siga cerrándose

  function close(result) {
    if (!current) return;
    const { dialog, resolve, opener } = current;
    current = null;
    dialog.classList.add('is-closing');
    const finish = () => { dialog.close(); dialog.remove(); opener?.focus?.({ preventScroll: true }); };
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) finish();
    else setTimeout(finish, 160);
    resolve(result);
  }

  function uiConfirm(opts = {}) {
    const { title = '¿Continuar?', message = '', stats = [], confirmText = 'Aceptar', cancelText = 'Cancelar', tone = 'primary', icon } = opts;
    if (typeof HTMLDialogElement !== 'function') return Promise.resolve(window.confirm([title, message].filter(Boolean).join('\n\n')));
    if (current) close(false);

    const uid = 'uiDialog' + (++seq);
    const dialog = document.createElement('dialog');
    dialog.className = `ui-dialog tone-${tone}`;
    dialog.setAttribute('aria-labelledby', uid + 'Title');
    if (message) dialog.setAttribute('aria-describedby', uid + 'Msg');
    const card = document.createElement('div');
    card.className = 'ui-dialog-card';
    dialog.append(card);
    const mark = document.createElement('div');
    mark.className = 'ui-dialog-mark';
    mark.setAttribute('aria-hidden', 'true');
    mark.textContent = icon || (tone === 'danger' ? '!' : '✓');
    const h = document.createElement('h2');
    h.id = uid + 'Title';
    h.textContent = title;
    card.append(mark, h);
    if (message) {
      const p = document.createElement('p');
      p.id = uid + 'Msg';
      p.textContent = message;
      card.append(p);
    }
    if (stats.length) {
      const list = document.createElement('div');
      list.className = 'ui-dialog-stats';
      stats.forEach(([value, label, kind]) => {
        const item = document.createElement('div');
        if (kind) item.className = 'is-' + kind;
        const b = document.createElement('strong'); b.textContent = value;
        const s = document.createElement('span'); s.textContent = label;
        item.append(b, s);
        list.append(item);
      });
      card.append(list);
    }
    const actions = document.createElement('div');
    actions.className = 'ui-dialog-actions';
    const cancel = document.createElement('button');
    cancel.type = 'button'; cancel.className = 'ui-dialog-btn ui-dialog-cancel'; cancel.textContent = cancelText;
    const ok = document.createElement('button');
    ok.type = 'button'; ok.className = 'ui-dialog-btn ui-dialog-ok'; ok.textContent = confirmText;
    actions.append(cancel, ok);
    card.append(actions);

    return new Promise(resolve => {
      current = { dialog, resolve, opener: document.activeElement };
      cancel.addEventListener('click', () => close(false));
      ok.addEventListener('click', () => close(true));
      dialog.addEventListener('cancel', e => { e.preventDefault(); close(false); }); // tecla Esc
      dialog.addEventListener('click', e => { if (e.target === dialog) close(false); }); // clic en el fondo
      document.body.append(dialog);
      dialog.showModal();
      (tone === 'danger' ? cancel : ok).focus();
    });
  }

  window.uiConfirm = uiConfirm;
  // Cierra el diálogo abierto (p. ej. cuando el tiempo de la prueba se agota mientras se está preguntando).
  window.uiDismiss = () => close(false);
})();
