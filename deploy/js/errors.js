/**
 * YIS – Fehlerprotokoll (Debug)
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'yis_error_log';
  var MAX_ENTRIES = 80;
  var logs = [];
  var panelBound = false;

  function $(id) { return document.getElementById(id); }

  function loadLogs() {
    try {
      var raw = sessionStorage.getItem(STORAGE_KEY);
      logs = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(logs)) logs = [];
    } catch (e) {
      logs = [];
    }
  }

  function saveLogs() {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(logs.slice(0, MAX_ENTRIES)));
    } catch (e) { /* Speicher voll */ }
  }

  function formatTime(iso) {
    try {
      return new Date(iso).toLocaleString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (e) {
      return iso;
    }
  }

  function entryToText(entry, index) {
    var lines = [];
    lines.push('=== YIS Fehler #' + (index != null ? index + 1 : '?') + ' ===');
    lines.push('Zeit:      ' + formatTime(entry.time));
    lines.push('Level:     ' + (entry.level || 'error').toUpperCase());
    lines.push('Quelle:    ' + (entry.source || '—'));
    lines.push('Meldung:   ' + entry.message);
    if (entry.stack) lines.push('Stack:\n' + entry.stack);
    if (entry.detail) {
      try {
        lines.push('Details:\n' + JSON.stringify(entry.detail, null, 2));
      } catch (e) {
        lines.push('Details:   ' + String(entry.detail));
      }
    }
    lines.push('URL:       ' + (entry.url || ''));
    lines.push('');
    return lines.join('\n');
  }

  function allToText() {
    if (!logs.length) return 'Keine Fehler im Protokoll.';
    var header = 'YIS – Fehlerprotokoll (' + logs.length + ' Einträge)\n' +
      'Exportiert: ' + formatTime(new Date().toISOString()) + '\n' +
      'User-Agent: ' + navigator.userAgent + '\n\n';
    return header + logs.map(function (e, i) { return entryToText(e, i); }).join('\n');
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    return Promise.resolve();
  }

  function updateBadge() {
    var btn = $('btn-error-log');
    var badge = $('error-log-badge');
    if (!btn || !badge) return;
    var n = logs.length;
    badge.textContent = n > 99 ? '99+' : String(n);
    badge.hidden = n === 0;
    btn.classList.toggle('has-errors', n > 0);
  }

  function log(level, message, opts) {
    opts = opts || {};
    var entry = {
      id: 'E' + Date.now() + Math.floor(Math.random() * 1e4),
      time: new Date().toISOString(),
      level: level || 'error',
      source: opts.source || 'app',
      message: String(message || 'Unbekannter Fehler'),
      stack: opts.stack || null,
      detail: opts.detail || null,
      url: window.location.href
    };
    logs.unshift(entry);
    if (logs.length > MAX_ENTRIES) logs.length = MAX_ENTRIES;
    saveLogs();
    updateBadge();
    if ($('error-log-modal') && $('error-log-modal').classList.contains('open')) {
      renderList();
    }
    return entry;
  }

  function logFromError(err, opts) {
    opts = opts || {};
    if (!err) return log('error', opts.message || 'Unbekannter Fehler', opts);
    return log(opts.level || 'error', err.message || String(err), {
      source: opts.source || 'exception',
      stack: err.stack || null,
      detail: opts.detail || null
    });
  }

  function renderList() {
    var list = $('error-log-list');
    var empty = $('error-log-empty');
    if (!list) return;

    if (!logs.length) {
      list.innerHTML = '';
      if (empty) empty.hidden = false;
      return;
    }
    if (empty) empty.hidden = true;

    list.innerHTML = logs.map(function (entry, idx) {
      var level = (entry.level || 'error').toLowerCase();
      var detailPreview = '';
      if (entry.detail) {
        try {
          detailPreview = JSON.stringify(entry.detail);
          if (detailPreview.length > 120) detailPreview = detailPreview.slice(0, 120) + '…';
        } catch (e) {
          detailPreview = String(entry.detail);
        }
      }
      return (
        '<article class="error-log-item error-log-item--' + level + '" data-id="' + entry.id + '">' +
        '<div class="error-log-item-head">' +
        '<span class="error-log-level">' + level.toUpperCase() + '</span>' +
        '<time class="error-log-time">' + formatTime(entry.time) + '</time>' +
        '<span class="error-log-source">' + (entry.source || 'app') + '</span>' +
        '</div>' +
        '<p class="error-log-msg">' + escapeHtml(entry.message) + '</p>' +
        (entry.stack ? '<pre class="error-log-stack">' + escapeHtml(entry.stack) + '</pre>' : '') +
        (detailPreview ? '<pre class="error-log-detail">' + escapeHtml(detailPreview) + '</pre>' : '') +
        '<div class="error-log-item-actions">' +
        '<button type="button" class="btn btn-secondary btn-error-copy-one" data-id="' + entry.id + '">Kopieren</button>' +
        '</div></article>'
      );
    }).join('');

    list.querySelectorAll('.btn-error-copy-one').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-id');
        var entry = logs.find(function (x) { return x.id === id; });
        var idx = logs.indexOf(entry);
        if (entry) {
          copyText(entryToText(entry, idx)).then(notifyCopied).catch(notifyCopyFail);
        }
      });
    });
  }

  function escapeHtml(s) {
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function notifyCopied() {
    if (window.toast && typeof toast === 'function') {
      /* app toast not global */
    }
    var hint = $('error-log-copy-hint');
    if (hint) {
      hint.textContent = 'In Zwischenablage kopiert.';
      hint.hidden = false;
      setTimeout(function () { hint.hidden = true; }, 2000);
    }
  }

  function notifyCopyFail() {
    var hint = $('error-log-copy-hint');
    if (hint) {
      hint.textContent = 'Kopieren fehlgeschlagen.';
      hint.hidden = false;
    }
  }

  function openPanel() {
    var modal = $('error-log-modal');
    if (modal) {
      modal.classList.add('open');
      renderList();
    }
  }

  function closePanel() {
    var modal = $('error-log-modal');
    if (modal) modal.classList.remove('open');
  }

  function clearLogs() {
    if (!logs.length) return;
    if (!confirm('Gesamtes Fehlerprotokoll löschen?')) return;
    logs = [];
    saveLogs();
    updateBadge();
    renderList();
  }

  function bindPanel() {
    if (panelBound) return;
    panelBound = true;

    var btn = $('btn-error-log');
    if (btn) btn.addEventListener('click', openPanel);

    var copyAll = $('btn-error-copy-all');
    if (copyAll) {
      copyAll.addEventListener('click', function () {
        copyText(allToText()).then(notifyCopied).catch(notifyCopyFail);
      });
    }

    var clearBtn = $('btn-error-clear');
    if (clearBtn) clearBtn.addEventListener('click', clearLogs);

    document.querySelectorAll('[data-close="error-log-modal"]').forEach(function (el) {
      el.addEventListener('click', closePanel);
    });

    var modal = $('error-log-modal');
    if (modal) {
      modal.addEventListener('click', function (e) {
        if (e.target === modal) closePanel();
      });
    }
  }

  function installGlobalHandlers() {
    window.addEventListener('error', function (ev) {
      log('error', ev.message || 'Script-Fehler', {
        source: 'window.onerror',
        stack: ev.error && ev.error.stack ? ev.error.stack : (ev.filename ? ev.filename + ':' + ev.lineno + ':' + ev.colno : null),
        detail: { file: ev.filename, line: ev.lineno, col: ev.colno }
      });
    });

    window.addEventListener('unhandledrejection', function (ev) {
      var reason = ev.reason;
      if (reason instanceof Error) {
        logFromError(reason, { source: 'unhandledrejection' });
      } else {
        log('error', String(reason), { source: 'unhandledrejection', detail: reason });
      }
    });
  }

  loadLogs();
  installGlobalHandlers();

  window.YIS_ERRORS = {
    log: log,
    logFromError: logFromError,
    getAll: function () { return logs.slice(); },
    clear: clearLogs,
    open: openPanel,
    copyAll: function () { return copyText(allToText()); },
    refresh: renderList
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      bindPanel();
      updateBadge();
    });
  } else {
    bindPanel();
    updateBadge();
  }
})();
