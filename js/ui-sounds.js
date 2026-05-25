/**
 * YIS – UI-Sounds (hover / press / input)
 * Hover: nur solange die Maus über dem Knopf ist, sonst Stopp.
 * Input: bei jeder Eingabe, Instanzen dürfen sich überlagern.
 */
(function () {
  'use strict';

  var HOVER_SRC = 'hover.mp3';
  var PRESS_SRC = 'press.mp3';
  var INPUT_SRC = 'input.mp3';
  var VOLUME = 0.75;

  var hoverAudio = null;
  var pressAudio = null;
  var currentHoverEl = null;
  var enabled = true;

  var SELECTOR = [
    'button',
    '.btn',
    '.tab-btn',
    'label.btn-upload',
    '.akte-file-actions a',
    '.modal-close'
  ].join(', ');

  function initAudio() {
    hoverAudio = new Audio(HOVER_SRC);
    hoverAudio.preload = 'auto';
    hoverAudio.volume = VOLUME;
    hoverAudio.loop = false;

    pressAudio = new Audio(PRESS_SRC);
    pressAudio.preload = 'auto';
    pressAudio.volume = VOLUME;
  }

  function findButton(target) {
    if (!target || !target.closest) return null;
    if (target.closest('#splash-screen')) return null;
    var el = target.closest(SELECTOR);
    if (!el) return null;
    if (el.disabled || el.getAttribute('aria-disabled') === 'true') return null;
    return el;
  }

  function stopHover() {
    if (!hoverAudio) return;
    hoverAudio.pause();
    hoverAudio.currentTime = 0;
  }

  function startHover() {
    if (!enabled || !hoverAudio) return;
    stopHover();
    var p = hoverAudio.play();
    if (p && p.catch) p.catch(function () { /* Autoplay-Richtlinie */ });
  }

  function playPress() {
    if (!enabled || !pressAudio) return;
    pressAudio.currentTime = 0;
    var p = pressAudio.play();
    if (p && p.catch) p.catch(function () { /* ignore */ });
  }

  var SKIP_INPUT_TYPES = {
    hidden: 1,
    file: 1,
    checkbox: 1,
    radio: 1,
    button: 1,
    submit: 1,
    range: 1,
    color: 1
  };

  function findTextInput(target) {
    if (!target || !target.closest) return null;
    if (target.closest('#splash-screen')) return null;
    var el = target.closest('input, textarea');
    if (!el) return null;
    if (el.disabled || el.readOnly) return null;
    if (el.tagName === 'INPUT') {
      var type = (el.type || 'text').toLowerCase();
      if (SKIP_INPUT_TYPES[type]) return null;
    }
    return el;
  }

  function playInput() {
    if (!enabled) return;
    var a = new Audio(INPUT_SRC);
    a.volume = VOLUME;
    var p = a.play();
    if (p && p.catch) p.catch(function () { /* ignore */ });
  }

  function onInput(e) {
    if (!findTextInput(e.target)) return;
    playInput();
  }

  function onMouseOver(e) {
    var btn = findButton(e.target);
    if (!btn) return;
    if (btn === currentHoverEl) return;
    var from = e.relatedTarget;
    if (from && btn.contains(from)) return;

    if (currentHoverEl && currentHoverEl !== btn) {
      stopHover();
    }
    currentHoverEl = btn;
    startHover();
  }

  function onMouseOut(e) {
    if (!currentHoverEl) return;
    var btn = findButton(e.target);
    if (btn !== currentHoverEl) return;
    var to = e.relatedTarget;
    if (to && currentHoverEl.contains(to)) return;

    stopHover();
    currentHoverEl = null;
  }

  function onPointerDown(e) {
    if (e.button !== 0) return;
    var btn = findButton(e.target);
    if (!btn) return;
    stopHover();
    currentHoverEl = null;
    playPress();
  }

  function bind() {
    document.addEventListener('mouseover', onMouseOver, true);
    document.addEventListener('mouseout', onMouseOut, true);
    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('input', onInput, true);
  }

  initAudio();
  bind();

  window.YIS_UI_SOUNDS = {
    enable: function () { enabled = true; },
    disable: function () { enabled = false; stopHover(); },
    stopHover: stopHover
  };
})();
