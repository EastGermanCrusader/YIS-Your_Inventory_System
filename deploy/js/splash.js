/**
 * YIS – Startseite / Splash (6 Sekunden + loading.mp3)
 */
(function () {
  'use strict';

  var MIN_MS = 6000;
  var startedAt = Date.now();
  var appReady = false;
  var hideScheduled = false;
  var splashAudio = null;
  var audioFadeTimer = null;

  function $(id) { return document.getElementById(id); }

  function setStatus(text) {
    var el = $('splash-status');
    if (el) el.textContent = text;
  }

  function setProgress(pct) {
    var bar = $('splash-progress-bar');
    if (bar) bar.style.width = Math.min(100, Math.max(0, pct)) + '%';
  }

  function injectLoader() {
    var mount = $('splash-loader');
    if (!mount) return;
    fetch('js/splash-loader.html')
      .then(function (r) { return r.text(); })
      .then(function (html) { mount.innerHTML = html; })
      .catch(function () {
        mount.innerHTML = '<div class="socket"><div class="gel center-gel"><div class="hex-brick h1"></div><div class="hex-brick h2"></div><div class="hex-brick h3"></div></div></div>';
      });
  }

  function playSplashAudio() {
    splashAudio = $('splash-audio');
    if (!splashAudio) return;

    splashAudio.volume = 0.9;
    splashAudio.currentTime = 0;

    var playPromise = splashAudio.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(function () {
        var splash = $('splash-screen');
        if (!splash) return;
        var hint = document.createElement('p');
        hint.className = 'splash-audio-hint';
        hint.textContent = 'Tippen/Klicken für Sound';
        splash.querySelector('.splash-content').appendChild(hint);
        splash.addEventListener('click', function onTap() {
          splash.removeEventListener('click', onTap);
          if (hint.parentNode) hint.parentNode.removeChild(hint);
          splashAudio.play().catch(function () { /* ignore */ });
        });
      });
    }
  }

  function fadeOutSplashAudio() {
    if (!splashAudio) return;
    clearInterval(audioFadeTimer);
    var steps = 12;
    var step = 0;
    var startVol = splashAudio.volume;
    audioFadeTimer = setInterval(function () {
      step++;
      splashAudio.volume = Math.max(0, startVol * (1 - step / steps));
      if (step >= steps) {
        clearInterval(audioFadeTimer);
        splashAudio.pause();
        splashAudio.currentTime = 0;
      }
    }, 50);
  }

  function hideSplash() {
    var splash = $('splash-screen');
    var root = $('app-root');
    setProgress(100);
    setStatus('Bereit');
    fadeOutSplashAudio();
    if (splash) {
      splash.classList.add('splash-screen--out');
      splash.setAttribute('aria-busy', 'false');
    }
    if (root) root.classList.remove('app-root--waiting');
    setTimeout(function () {
      if (splash && splash.parentNode) splash.parentNode.removeChild(splash);
    }, 700);
  }

  function tryHide() {
    if (!appReady || hideScheduled) return;
    hideScheduled = true;
    var elapsed = Date.now() - startedAt;
    var wait = Math.max(0, MIN_MS - elapsed);
    setTimeout(hideSplash, wait);
  }

  function finish() {
    appReady = true;
    setProgress(88);
    setStatus('Inventar wird geladen…');
    tryHide();
  }

  window.YIS_SPLASH = {
    setStatus: setStatus,
    setProgress: setProgress,
    finish: finish
  };

  injectLoader();
  playSplashAudio();
  setProgress(8);
  setStatus('System wird initialisiert…');

  setTimeout(function () { setProgress(22); setStatus('Konfiguration laden…'); }, 1000);
  setTimeout(function () { setProgress(42); setStatus('Verbindung vorbereiten…'); }, 2200);
  setTimeout(function () { setProgress(62); setStatus('Module laden…'); }, 3600);
  setTimeout(function () { setProgress(78); setStatus('Fast fertig…'); }, 4800);
})();
