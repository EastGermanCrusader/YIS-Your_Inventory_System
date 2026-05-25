/**
 * YIS (Your Inventory System) – Frontend
 */
(function () {
  'use strict';

  var LOGO_FILE = 'preview_Logo.png';
  var SESSION_KEY = 'yis_sess';
  var MAX_FILE_BYTES = Math.floor(1.5 * 1024 * 1024);
  var items = [];
  var currentAkte = null;
  var currentDateien = [];
  var cfg = null;

  var $ = function (id) { return document.getElementById(id); };

  function initConfig() {
    if (typeof YIS_SHIELD === 'undefined') {
      throw new Error('shield.js fehlt. Bitte: npm run build (siehe SETUP.md).');
    }
    cfg = YIS_SHIELD.cfg();
    cfg._configured = YIS_SHIELD.configured !== false && !!cfg.loginHash;
    cfg.publicApiUrl = cfg._configured ? YIS_SHIELD.publicApiUrl() : '';
    cfg.apiUrl = null;
    try {
      var sess = sessionStorage.getItem('yis_url');
      if (sess && isLoggedIn()) cfg.apiUrl = sess;
    } catch (e) { /* ignore */ }
  }

  function resolveApiUrl(params) {
    if (!cfg._configured) {
      throw new Error('Installation nicht konfiguriert. Siehe SETUP.md (npm run setup && npm run build).');
    }
    if ((params.action === 'get' || params.action === 'getFileContent') && params.sn && !getToken()) {
      if (!cfg.publicApiUrl) throw new Error('Öffentliche API-URL fehlt. Bitte npm run build ausführen.');
      return cfg.publicApiUrl;
    }
    if (!cfg.apiUrl) {
      throw new Error('Bitte anmelden, um auf die API zuzugreifen.');
    }
    return cfg.apiUrl;
  }

  async function sha256(text) {
    var enc = new TextEncoder().encode(text);
    var buf = await crypto.subtle.digest('SHA-256', enc);
    return Array.from(new Uint8Array(buf)).map(function (b) {
      return b.toString(16).padStart(2, '0');
    }).join('');
  }

  function isLoggedIn() {
    try {
      var raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) return false;
      var data = JSON.parse(raw);
      return data && data.ok === true && data.exp > Date.now();
    } catch (e) {
      return false;
    }
  }

  function setSession(ok) {
    if (ok) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({
        ok: true,
        exp: Date.now() + 8 * 60 * 60 * 1000
      }));
    } else {
      sessionStorage.removeItem(SESSION_KEY);
    }
    updateAuthUI();
  }

  function getToken() {
    if (!cfg || !cfg.loginHash) return '';
    return cfg._loginToken || '';
  }

  async function deriveTokenFromLogin(password) {
    var hash = await sha256(password);
    if (hash !== cfg.loginHash) return false;
    try {
      cfg.apiUrl = await YIS_SHIELD.unlock(password);
      cfg._loginToken = password;
      sessionStorage.setItem('yis_url', cfg.apiUrl);
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  function logError(msg, opts) {
    if (window.YIS_ERRORS) {
      YIS_ERRORS.log('error', msg, opts || { source: 'app' });
    }
  }

  function logErrorFromErr(err, opts) {
    if (window.YIS_ERRORS) {
      YIS_ERRORS.logFromError(err, opts || { source: 'app' });
    }
  }

  function toast(msg, type) {
    var el = $('toast');
    el.textContent = msg;
    el.className = 'toast show' + (type ? ' ' + type : '');
    if (type === 'error') {
      logError(msg, { source: 'toast' });
    }
    clearTimeout(el._t);
    el._t = setTimeout(function () { el.classList.remove('show'); }, 3200);
  }

  function openModal(id) {
    $(id).classList.add('open');
  }

  function closeModal(id) {
    $(id).classList.remove('open');
  }

  function itemPublicUrl(serial) {
    var href = window.location.href.split('#')[0].split('?')[0];
    return href + '?sn=' + encodeURIComponent(serial);
  }

  /** JSONP – umgeht CORS (file://, GitHub Pages, Google Apps Script) */
  function apiRequest(params) {
    return new Promise(function (resolve, reject) {
      var baseUrl;
      try {
        baseUrl = resolveApiUrl(params);
      } catch (err) {
        reject(err);
        return;
      }
      if (getToken() && params.token === undefined) params.token = getToken();

      var cb = 'yiscb_' + Date.now() + '_' + Math.floor(Math.random() * 1e6);
      var url = new URL(baseUrl);

      Object.keys(params).forEach(function (k) {
        var v = params[k];
        if (v !== undefined && v !== null && v !== '') {
          url.searchParams.set(k, String(v));
        }
      });
      url.searchParams.set('callback', cb);

      var timeout = setTimeout(function () {
        cleanup();
        var err = new Error('API-Zeitüberschreitung – Web-App erreichbar?');
        logError(err.message, { source: 'api-jsonp-timeout' });
        reject(err);
      }, 45000);

      function cleanup() {
        clearTimeout(timeout);
        try { delete window[cb]; } catch (e) { window[cb] = undefined; }
        if (script && script.parentNode) script.parentNode.removeChild(script);
      }

      window[cb] = function (data) {
        cleanup();
        if (data && data.ok === false && data.error) {
          logError(data.error, { source: 'api-jsonp', detail: { action: params.action } });
        }
        resolve(data);
      };

      var script = document.createElement('script');
      script.src = url.toString();
      script.async = true;
      script.onerror = function () {
        cleanup();
        var err = new Error('API nicht erreichbar. Apps Script neu bereitgestellt?');
        logError(err.message, { source: 'api-jsonp', detail: { url: url.toString().split('callback')[0] } });
        reject(err);
      };
      document.head.appendChild(script);
    });
  }

  function apiGet(params) {
    return apiRequest(params);
  }

  function apiPost(body) {
    var params = {
      token: getToken(),
      action: body.action
    };
    if (body.seriennummer) params.seriennummer = body.seriennummer;
    if (body.item) params.data = JSON.stringify(body.item);
    if (body.dateiId) params.dateiId = body.dateiId;
    if (body.data !== undefined && body.data !== null) {
      params.data = typeof body.data === 'string' ? body.data : JSON.stringify(body.data);
    }
    return apiRequest(params);
  }

  /** POST mit JSON-Body (Uploads, große Daten) */
  function apiPostJson(body) {
    if (!cfg.apiUrl) {
      return Promise.reject(new Error('Bitte anmelden.'));
    }
    var sep = cfg.apiUrl.indexOf('?') >= 0 ? '&' : '?';
    var url = cfg.apiUrl + sep + 'token=' + encodeURIComponent(getToken());
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(body)
    }).then(function (res) {
      return res.text();
    }).then(function (text) {
      try {
        var parsed = JSON.parse(text);
        if (parsed && parsed.ok === false && parsed.error) {
          logError(parsed.error, { source: 'api-post', detail: body });
        }
        return parsed;
      } catch (e) {
        logError('Ungültige Server-Antwort', { source: 'api-post', detail: { raw: text.slice(0, 500) } });
        throw new Error('Ungültige Server-Antwort');
      }
    }).catch(function (err) {
      logErrorFromErr(err, { source: 'api-post-fetch', detail: body });
      throw err;
    });
  }

  function readFileAsBase64(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () {
        var result = reader.result || '';
        var base64 = String(result).split(',')[1] || '';
        resolve(base64);
      };
      reader.onerror = function () { reject(new Error('Datei konnte nicht gelesen werden')); };
      reader.readAsDataURL(file);
    });
  }

  function formatFileSize(bytes) {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function isImageMime(mime) {
    return mime && mime.indexOf('image/') === 0;
  }

  function dataUrlFromDatei(datei) {
    if (!datei) return '';
    if (datei.dataUrl) return datei.dataUrl;
    if (datei.contentBase64) {
      return 'data:' + (datei.mimeType || 'application/octet-stream') + ';base64,' + datei.contentBase64;
    }
    return '';
  }

  async function fetchDateiInhalt(dateiId, serial) {
    var data = await apiGet({
      action: 'getFileContent',
      dateiId: dateiId,
      sn: serial
    });
    if (!data.ok || !data.datei) throw new Error(data.error || 'Datei nicht ladbar');
    return data.datei;
  }

  async function loadDateiIntoCard(card, f, serial) {
    try {
      var datei = await fetchDateiInhalt(f.dateiId, serial);
      var url = dataUrlFromDatei(datei);
      if (!url) return;
      card.dataset.dataUrl = url;
      if (isImageMime(f.mimeType)) {
        var img = card.querySelector('.akte-file-thumb');
        if (img) img.src = url;
      }
      var openL = card.querySelector('.akte-file-open');
      var dlL = card.querySelector('.akte-file-dl');
      if (openL) openL.href = url;
      if (dlL) {
        dlL.href = url;
        dlL.setAttribute('download', f.dateiname || 'datei');
      }
    } catch (e) {
      var errEl = card.querySelector('.akte-file-load-err');
      if (errEl) errEl.textContent = 'Laden fehlgeschlagen';
    }
  }

  function renderAkteDateien(dateien, canEdit) {
    var list = $('akte-files-list');
    var uploadLabel = $('akte-upload-label');
    uploadLabel.hidden = !canEdit;
    var serial = currentAkte ? currentAkte.seriennummer : '';

    if (!dateien || !dateien.length) {
      list.innerHTML = '<p class="akte-files-empty">Keine Dateien vorhanden.</p>';
      return;
    }

    list.innerHTML = dateien.map(function (f) {
      var thumb = isImageMime(f.mimeType)
        ? '<img class="akte-file-thumb" src="" alt="" data-loading="1">'
        : '<div class="akte-file-icon">📄</div>';
      var delBtn = canEdit
        ? '<button type="button" class="btn-file-delete" data-datei-id="' + escapeHtml(f.dateiId) + '">Entfernen</button>'
        : '';
      return (
        '<article class="akte-file-card" data-datei-id="' + escapeHtml(f.dateiId) + '">' +
        thumb +
        '<div class="akte-file-meta">' +
        '<span class="akte-file-name" title="' + escapeHtml(f.dateiname) + '">' + escapeHtml(f.dateiname) + '</span>' +
        '<span class="akte-file-size">' + formatFileSize(f.groesse) + '</span>' +
        '<span class="akte-file-load-err"></span>' +
        '<div class="akte-file-actions">' +
        '<a href="#" class="akte-file-open" target="_blank" rel="noopener">Öffnen</a>' +
        '<a href="#" class="akte-file-dl">Download</a>' +
        delBtn +
        '</div></div></article>'
      );
    }).join('');

    list.querySelectorAll('.akte-file-card').forEach(function (card) {
      var id = card.getAttribute('data-datei-id');
      var meta = dateien.find(function (x) { return x.dateiId === id; });
      if (meta) loadDateiIntoCard(card, meta, serial);
    });

    list.querySelectorAll('.akte-file-open, .akte-file-dl').forEach(function (link) {
      link.addEventListener('click', async function (e) {
        var card = link.closest('.akte-file-card');
        if (card && card.dataset.dataUrl) return;
        e.preventDefault();
        var id = card.getAttribute('data-datei-id');
        var meta = dateien.find(function (x) { return x.dateiId === id; });
        if (meta) {
          await loadDateiIntoCard(card, meta, serial);
          if (card.dataset.dataUrl) {
            if (link.classList.contains('akte-file-open')) {
              window.open(card.dataset.dataUrl, '_blank');
            } else {
              var a = document.createElement('a');
              a.href = card.dataset.dataUrl;
              a.download = meta.dateiname;
              a.click();
            }
          }
        }
      });
    });

    if (canEdit) {
      list.querySelectorAll('.btn-file-delete').forEach(function (btn) {
        btn.addEventListener('click', function () {
          deleteAkteDatei(btn.getAttribute('data-datei-id'));
        });
      });
    }
  }

  async function refreshAkteDateien(serial, canEdit) {
    var list = $('akte-files-list');
    list.innerHTML = '<p class="akte-files-loading">Lade Anlagen…</p>';
    try {
      var data = await apiGet({ action: 'get', sn: serial });
      if (data.ok && data.item) {
        currentDateien = data.item.dateien || [];
      } else {
        currentDateien = [];
      }
    } catch (e) {
      currentDateien = [];
    }
    renderAkteDateien(currentDateien, canEdit);
  }

  function splitBase64(str, chunkSize) {
    var parts = [];
    for (var i = 0; i < str.length; i += chunkSize) {
      parts.push(str.slice(i, i + chunkSize));
    }
    return parts.length ? parts : [''];
  }

  async function uploadSingleAkteDatei(file, serial) {
    var b64 = await readFileAsBase64(file);
    var chunks = splitBase64(b64, 2000);
    var dateiId = null;

    for (var c = 0; c < chunks.length; c++) {
      var data = await apiPost({
        action: 'uploadFile',
        data: JSON.stringify({
          seriennummer: serial,
          dateiname: file.name,
          mimeType: file.type || 'application/octet-stream',
          groesse: file.size,
          teil: c + 1,
          teileGesamt: chunks.length,
          chunkBase64: chunks[c],
          dateiId: dateiId
        })
      });
      if (!data.ok) {
        var errMsg = data.error || 'Upload fehlgeschlagen (Teil ' + (c + 1) + '/' + chunks.length + ')';
        if (/Unbekannte Aktion/i.test(errMsg)) {
          errMsg = 'Upload-API fehlt auf dem Server: In Google Apps Script App.gs speichern und die Web-App neu bereitstellen (Zugriff: Jeder).';
        }
        throw new Error(errMsg);
      }
      if (data.datei && data.datei.dateiId) {
        dateiId = data.datei.dateiId;
      }
    }
  }

  async function uploadAkteDateien(fileList) {
    if (!currentAkte || !fileList || !fileList.length) return;
    var files = Array.prototype.slice.call(fileList);
    var serial = currentAkte.seriennummer;

    for (var i = 0; i < files.length; i++) {
      var file = files[i];
      if (file.size > MAX_FILE_BYTES) {
        toast(file.name + ': zu groß (max. 1,5 MB für Tabellen-Speicher)', 'error');
        continue;
      }
      toast('Lade hoch: ' + file.name + '…');
      try {
        await uploadSingleAkteDatei(file, serial);
      } catch (err) {
        logErrorFromErr(err, { source: 'upload', detail: { dateiname: file.name, serial: serial } });
        toast(file.name + ': ' + err.message, 'error');
      }
    }

    $('akte-file-input').value = '';
    await refreshAkteDateien(serial, true);
    toast('Upload abgeschlossen', 'success');
  }

  async function deleteAkteDatei(dateiId) {
    if (!dateiId || !confirm('Datei wirklich entfernen?')) return;
    try {
      var data = await apiPost({ action: 'deleteFile', dateiId: dateiId });
      if (!data.ok) throw new Error(data.error || 'Löschen fehlgeschlagen');
      toast('Datei entfernt', 'success');
      await refreshAkteDateien(currentAkte.seriennummer, true);
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  function renderPublicPlaceholder() {
    $('public-stats').innerHTML = '';
    $('public-items').innerHTML =
      '<div class="public-info-card">' +
      '<h3>Öffentliche Ansicht</h3>' +
      '<p>Gesamtinventar ist geschützt. Scanne einen QR-Code oder gib eine Seriennummer ein.</p>' +
      '<div class="public-sn-lookup">' +
      '<input type="text" class="search-input" id="public-sn-input" placeholder="Seriennummer, z.B. YIS-20260525-0001" autocomplete="off">' +
      '<button type="button" class="btn btn-primary" id="public-sn-open">Akte öffnen</button>' +
      '</div></div>';
    $('public-empty').hidden = true;
    $('public-search').closest('.toolbar').hidden = true;

    $('public-sn-open').addEventListener('click', function () {
      var sn = ($('public-sn-input').value || '').trim();
      if (sn) openAkte(sn, false);
      else toast('Seriennummer eingeben', 'error');
    });
    $('public-sn-input').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') $('public-sn-open').click();
    });
  }

  async function loadItems() {
    renderPublicPlaceholder();

    if (!isLoggedIn() || !cfg.apiUrl) {
      items = [];
      renderAll();
      return;
    }

    var gridE = $('edit-items');
    gridE.innerHTML = '<p class="loading">Lade Inventar…</p>';

    try {
      var data = await apiGet({ action: 'list', token: getToken() });
      if (!data.ok) throw new Error(data.error || 'Laden fehlgeschlagen');
      items = data.items || [];
      renderAll();
    } catch (err) {
      toast('Fehler beim Laden: ' + err.message, 'error');
      $('edit-empty').hidden = false;
      $('edit-empty').textContent = 'Inventar konnte nicht geladen werden.';
    }
  }

  function filterItems(q) {
    if (!q) return items.slice();
    var s = q.toLowerCase();
    return items.filter(function (it) {
      return (
        (it.bezeichnung || '').toLowerCase().indexOf(s) >= 0 ||
        (it.seriennummer || '').toLowerCase().indexOf(s) >= 0 ||
        (it.standort || '').toLowerCase().indexOf(s) >= 0 ||
        (it.kategorie || '').toLowerCase().indexOf(s) >= 0
      );
    });
  }

  function renderStats(containerId, list) {
    var el = $(containerId);
    var cats = {};
    list.forEach(function (it) {
      var c = it.kategorie || 'Allgemein';
      cats[c] = (cats[c] || 0) + 1;
    });
    el.innerHTML =
      '<div class="stat-card"><strong>' + list.length + '</strong><span>Gegenstände</span></div>' +
      '<div class="stat-card"><strong>' + Object.keys(cats).length + '</strong><span>Kategorien</span></div>' +
      '<div class="stat-card"><strong>' + list.filter(function (i) { return i.status === 'Aktiv'; }).length + '</strong><span>Aktiv</span></div>';
  }

  function cardHtml(it, editable) {
    return (
      '<article class="item-card" data-sn="' + escapeHtml(it.seriennummer) + '" data-edit="' + (editable ? '1' : '0') + '">' +
      '<p class="serial">' + escapeHtml(it.seriennummer) + '</p>' +
      '<h3>' + escapeHtml(it.bezeichnung || '—') + '</h3>' +
      '<p class="meta">' + escapeHtml(it.kategorie || '') + ' · ' + escapeHtml(it.standort || '—') + '</p>' +
      '<span class="badge ' + (it.status === 'Aktiv' ? 'active' : '') + '">' + escapeHtml(it.status || '') + '</span>' +
      '</article>'
    );
  }

  function escapeHtml(s) {
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function renderGrid(containerId, emptyId, list, editable) {
    var grid = $(containerId);
    var empty = $(emptyId);
    if (!list.length) {
      grid.innerHTML = '';
      empty.hidden = false;
      return;
    }
    empty.hidden = true;
    grid.innerHTML = list.map(function (it) { return cardHtml(it, editable); }).join('');
    grid.querySelectorAll('.item-card').forEach(function (card) {
      card.addEventListener('click', function () {
        var sn = card.getAttribute('data-sn');
        var edit = card.getAttribute('data-edit') === '1';
        openAkte(sn, edit);
      });
    });
  }

  function renderAll() {
    if (isLoggedIn() && cfg.apiUrl) {
      var qEdit = ($('edit-search').value || '').trim();
      var editList = filterItems(qEdit);
      renderStats('edit-stats', editList);
      renderGrid('edit-items', 'edit-empty', editList, true);
    }
  }

  function switchView(name) {
    document.querySelectorAll('.view-panel').forEach(function (p) {
      p.classList.remove('active');
    });
    document.querySelectorAll('.tab-btn').forEach(function (b) {
      b.classList.remove('active');
    });
    $('view-' + name).classList.add('active');
    document.querySelector('[data-view="' + name + '"]').classList.add('active');
  }

  function updateAuthUI() {
    var logged = isLoggedIn();
    $('btn-login').hidden = logged;
    $('btn-logout').hidden = !logged;
    $('tab-edit').classList.toggle('locked', !logged);
    $('session-info').hidden = !logged;
    if (!logged && $('view-edit').classList.contains('active')) {
      switchView('public');
    }
  }

  function renderQr(container, serial) {
    return new Promise(function (resolve) {
      var url = itemPublicUrl(serial);
      container.innerHTML = '';

      if (typeof QRCode === 'undefined') {
        container.textContent = 'QR-Bibliothek fehlt';
        resolve();
        return;
      }

      /* qrcodejs (lokal) */
      new QRCode(container, {
        text: url,
        width: 180,
        height: 180,
        colorDark: '#0f1419',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
      });

      setTimeout(function () {
        var target = container.querySelector('canvas') || container.querySelector('img');
        if (!target) {
          resolve();
          return;
        }

        var logo = new Image();
        logo.onload = function () {
          try {
            var cv = document.createElement('canvas');
            cv.width = 180;
            cv.height = 180;
            var ctx = cv.getContext('2d');
            if (target.tagName === 'CANVAS') {
              ctx.drawImage(target, 0, 0);
            } else {
              ctx.drawImage(target, 0, 0, 180, 180);
            }
            var size = 40;
            var pad = 6;
            var x = (180 - size) / 2;
            var y = (180 - size) / 2;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(x - pad, y - pad, size + pad * 2, size + pad * 2);
            ctx.drawImage(logo, x, y, size, size);
            container.innerHTML = '';
            cv.style.maxWidth = '100%';
            container.appendChild(cv);
          } catch (e) { /* Logo optional */ }
          resolve();
        };
        logo.onerror = function () { resolve(); };
        logo.src = LOGO_FILE;
      }, 120);
    });
  }

  function akteDetailsHtml(it) {
    return (
      '<dl>' +
      '<dt>Seriennummer</dt><dd><code>' + escapeHtml(it.seriennummer) + '</code></dd>' +
      '<dt>Bezeichnung</dt><dd>' + escapeHtml(it.bezeichnung) + '</dd>' +
      '<dt>Beschreibung</dt><dd>' + escapeHtml(it.beschreibung || '—') + '</dd>' +
      '<dt>Kategorie</dt><dd>' + escapeHtml(it.kategorie) + '</dd>' +
      '<dt>Standort</dt><dd>' + escapeHtml(it.standort || '—') + '</dd>' +
      '<dt>Status</dt><dd>' + escapeHtml(it.status) + '</dd>' +
      '<dt>Erstellt</dt><dd>' + formatDate(it.erstelltAm) + '</dd>' +
      '<dt>Geändert</dt><dd>' + formatDate(it.geaendertAm) + '</dd>' +
      '<dt>Erfasst von</dt><dd>' + escapeHtml(it.erfasstVon || '—') + '</dd>' +
      '</dl>'
    );
  }

  function formatDate(iso) {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleString('de-DE');
    } catch (e) {
      return iso;
    }
  }

  async function openAkte(serial, showEditActions) {
    var it = items.find(function (x) { return x.seriennummer === serial; });
    try {
      var data = await apiGet({ action: 'get', sn: serial });
      if (data.ok && data.item) it = data.item;
    } catch (e) { /* ignore */ }
    if (!it) {
      toast('Akte nicht gefunden', 'error');
      return;
    }
    currentAkte = it;
    currentDateien = it.dateien || [];
    $('akte-title').textContent = 'Akte: ' + it.bezeichnung;
    $('akte-details').innerHTML = akteDetailsHtml(it);
    $('akte-serial-label').textContent = it.seriennummer;
    $('akte-actions').hidden = !showEditActions;
    await renderQr($('akte-qr'), it.seriennummer);
    renderAkteDateien(currentDateien, showEditActions);
    openModal('akte-modal');
  }

  async function openNewAkteForm() {
    $('form-title').textContent = 'Neue Akte anlegen';
    $('item-form').reset();
    $('form-status-group').hidden = true;
    $('form-submit').textContent = 'Akte speichern';
    $('form-serial-preview').textContent = 'Seriennummer wird beim Speichern vergeben…';

    try {
      var data = await apiPost({ action: 'nextSerial' });
      if (data.ok && data.seriennummer) {
        $('form-serial').value = data.seriennummer;
        $('form-serial-preview').textContent = 'Vorgesehene Seriennummer: ' + data.seriennummer;
      }
    } catch (e) {
      var fallback = 'YIS-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-XXXX';
      $('form-serial').value = fallback;
      $('form-serial-preview').textContent = 'Seriennummer (offline-Vorschau): ' + fallback;
    }
    openModal('form-modal');
  }

  function openEditForm(it) {
    closeModal('akte-modal');
    $('form-title').textContent = 'Akte bearbeiten';
    $('form-serial').value = it.seriennummer;
    $('form-bezeichnung').value = it.bezeichnung || '';
    $('form-beschreibung').value = it.beschreibung || '';
    $('form-kategorie').value = it.kategorie || 'Allgemein';
    $('form-standort').value = it.standort || '';
    $('form-status').value = it.status || 'Aktiv';
    $('form-status-group').hidden = false;
    $('form-serial-preview').textContent = 'Seriennummer: ' + it.seriennummer;
    $('form-submit').textContent = 'Änderungen speichern';
    openModal('form-modal');
  }

  async function saveItem(e) {
    e.preventDefault();
    if (!isLoggedIn()) {
      toast('Bitte zuerst anmelden', 'error');
      return;
    }

    var serial = $('form-serial').value;
    var isNew = $('form-title').textContent.indexOf('Neue') >= 0;
    var payload = {
      seriennummer: serial,
      bezeichnung: $('form-bezeichnung').value.trim(),
      beschreibung: $('form-beschreibung').value.trim(),
      kategorie: $('form-kategorie').value,
      standort: $('form-standort').value.trim(),
      status: $('form-status').value || 'Aktiv',
      erfasstVon: 'Web-Editor'
    };

    if (!payload.bezeichnung) {
      toast('Bezeichnung ist Pflicht', 'error');
      return;
    }

    $('form-submit').disabled = true;
    try {
      var data = await apiPost({
        action: isNew ? 'create' : 'update',
        item: payload
      });
      if (!data.ok) throw new Error(data.error || 'Speichern fehlgeschlagen');
      closeModal('form-modal');
      toast(isNew ? 'Neue Akte angelegt' : 'Akte aktualisiert', 'success');
      await loadItems();
      openAkte(data.item.seriennummer, true);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      $('form-submit').disabled = false;
    }
  }

  async function deleteCurrentAkte() {
    if (!currentAkte || !confirm('Akte wirklich als entfernt markieren?')) return;
    try {
      var data = await apiPost({ action: 'delete', seriennummer: currentAkte.seriennummer });
      if (!data.ok) throw new Error(data.error);
      closeModal('akte-modal');
      toast('Akte entfernt', 'success');
      await loadItems();
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  function downloadQr() {
    var wrap = $('akte-qr');
    var canvas = wrap.querySelector('canvas');
    var img = wrap.querySelector('img');
    var a = document.createElement('a');
    a.download = (currentAkte ? currentAkte.seriennummer : 'qr') + '.png';
    if (canvas) {
      a.href = canvas.toDataURL('image/png');
    } else if (img) {
      a.href = img.src;
    } else {
      toast('QR noch nicht bereit', 'error');
      return;
    }
    a.click();
  }

  function bindEvents() {
    document.querySelectorAll('.tab-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var view = btn.getAttribute('data-view');
        if (view === 'edit' && !isLoggedIn()) {
          openModal('login-modal');
          return;
        }
        switchView(view);
      });
    });

    $('btn-login').addEventListener('click', function () { openModal('login-modal'); });
    $('btn-logout').addEventListener('click', function () {
      cfg._loginToken = '';
      cfg.apiUrl = null;
      try { sessionStorage.removeItem('yis_url'); } catch (e) { /* ignore */ }
      items = [];
      setSession(false);
      toast('Abgemeldet');
      switchView('public');
      loadItems();
    });

    $('login-form').addEventListener('submit', async function (e) {
      e.preventDefault();
      var pw = $('login-password').value;
      var ok = await deriveTokenFromLogin(pw);
      if (ok) {
        setSession(true);
        closeModal('login-modal');
        $('login-password').value = '';
        switchView('edit');
        toast('Angemeldet', 'success');
        await loadItems();
      } else {
        toast('Zugang verweigert', 'error');
      }
    });

    $('btn-new-item').addEventListener('click', openNewAkteForm);
    $('item-form').addEventListener('submit', saveItem);
    $('edit-search').addEventListener('input', renderAll);

    $('btn-edit-item').addEventListener('click', function () {
      if (currentAkte) openEditForm(currentAkte);
    });
    $('btn-delete-item').addEventListener('click', deleteCurrentAkte);
    $('btn-download-qr').addEventListener('click', downloadQr);

    $('akte-file-input').addEventListener('change', function (e) {
      if (e.target.files && e.target.files.length) {
        uploadAkteDateien(e.target.files);
      }
    });

    document.querySelectorAll('[data-close]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        closeModal(btn.getAttribute('data-close'));
      });
    });

    document.querySelectorAll('.modal-overlay').forEach(function (overlay) {
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) closeModal(overlay.id);
      });
    });
  }

  function splashProgress(pct, msg) {
    if (window.YIS_SPLASH) {
      if (msg) YIS_SPLASH.setStatus(msg);
      if (pct != null) YIS_SPLASH.setProgress(pct);
    }
  }

  function splashDone() {
    if (window.YIS_SPLASH) YIS_SPLASH.finish();
  }

  async function boot() {
    try {
      splashProgress(70, 'Module laden…');
      if (window.location.protocol === 'file:') {
        console.warn('YIS: Bitte über lokalen Webserver starten (./serve.sh), nicht per Datei-Protokoll');
      }
      splashProgress(78, 'Sicherheitsschicht…');
      initConfig();
      if (isLoggedIn() && !cfg.apiUrl) {
        setSession(false);
        try { sessionStorage.removeItem('yis_url'); } catch (e) { /* ignore */ }
      }
      bindEvents();
      updateAuthUI();
      splashProgress(85, 'Inventar abrufen…');
      await loadItems();

      var params = new URLSearchParams(window.location.search);
      var sn = params.get('sn');
      if (sn) await openAkte(sn, isLoggedIn());
    } catch (err) {
      logErrorFromErr(err, { source: 'boot' });
      toast(err.message, 'error');
      console.error(err);
    } finally {
      splashDone();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
