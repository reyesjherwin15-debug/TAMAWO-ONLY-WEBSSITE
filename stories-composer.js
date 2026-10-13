/* ================================================================
   stories-composer.js · TAMAWO / Barkada Stories  (lazy-loaded, v1.10)
   ================================================================ */
(function () {
    'use strict';
    if (window.StoriesComposer) return;
    const S = window.StoriesShared;
    const MAX_TEXTS = 8, MAX_TEXT_LEN = 120, MAX_CAPTION = 200, MAX_IMG = 15 * 1024 * 1024, MAX_VID = 50 * 1024 * 1024, MAX_VID_S = 60;
    const MAX_PHOTOS = S.MAX_PHOTOS, MIN_DUR = S.MIN_SHOW_MS / 1000, MAX_DUR = S.MAX_SHOW_MS / 1000, MIN_CLIP = 5;
    const rid = () => Math.random().toString(36).slice(2, 8);

    const TAP_SLOP = 6;
    const TAP_MS = 220;
    // Wide bounds: the sticker can be pushed past the edges; only the centre stays reachable.
    const STICKER_X_MIN = -0.25, STICKER_X_MAX = 1.25;
    const STICKER_Y_MIN = -0.25, STICKER_Y_MAX = 1.25;

    let C = null, root = null, q = {};
    const M = {
        sheet: null, items: [], video: null, layout: '', fit: 'fill', dur: MIN_DUR,
        texts: [], sel: null, caption: '', track: null, spotify: null, mstyle: 'bar',
        mpos: { x: 0.5, y: 0.54, scale: 1, rot: 0 },
        mt: { scale: 1, x: 0, y: 0 }, pan: null,
        mSel: false, dragS: null,
        query: '', spq: '', changing: false,
        hist: [], preview: false, xhr: null, busy: false, results: [], msg: '', searching: false, playing: '', drag: null, lastTap: null, tl: null
    };
    let PALETTE = ['#ffffff', '#111111', '#ffd23f', '#ff5a6e', '#4ade80', '#38bdf8', '#c084fc'];

    const $ = (s, r) => (r || root).querySelector(s);
    const find = id => M.texts.find(t => t.id === id);
    const selT = () => find(M.sel);
    const hex = v => { v = (v || '').trim(); return /^#[0-9a-f]{6}$/i.test(v) ? v.toLowerCase() : null; };
    const hasMedia = () => M.items.length > 0 || !!M.video;
    // touch screens: pinch / twist + drag. Mouse screens: sliders (size, rotate, zoom) in the sheets.
    const coarse = () => !!(window.matchMedia && matchMedia('(pointer: coarse)').matches);
    const canMT = () => !!M.video || M.items.length === 1;     // size/position only applies to single photo or video
    const vidSec = () => M.video ? Math.min(MAX_DUR, Math.round(M.video.dur || 0)) : 0;
    const storyDur = () => M.video ? vidSec() : (M.track ? M.track.clipSec : M.dur);
    const clampStickerX = v => S.clamp(v, STICKER_X_MIN, STICKER_X_MAX);
    const clampStickerY = v => S.clamp(v, STICKER_Y_MIN, STICKER_Y_MAX);

    // ---------------- preview audio ----------------
    let aud = null, audStop = null;
    function stopAudio() {
        if (audStop) { audStop(); audStop = null; }
        if (aud) { try { aud.pause(); aud.removeAttribute('src'); aud.load(); } catch (e) {} aud = null; }
        const was = M.playing; M.playing = '';
        return was;
    }
    function playAudio(url, key, start, end, loop) {
        stopAudio();
        const a = new Audio(); aud = a; a.preload = 'auto'; a.src = url;
        a.addEventListener('loadedmetadata', () => { try { a.currentTime = start || 0; } catch (e) {} });
        if (loop) audStop = S.attachClipLoop(a, start || 0, end);
        else a.addEventListener('ended', () => { if (aud === a) { M.playing = ''; if (M.sheet === 'music') renderSheet(); } });
        M.playing = key;
        a.play().catch(() => { if (aud === a) { M.playing = ''; C.toast('Your browser blocked the audio. Tap play again.', 'info'); if (M.sheet === 'music') renderSheet(); } });
    }
    const clipEnd = t => Math.min(t.startSec + t.clipSec, t.previewSec || 30);
    const playClip = () => { if (M.track) playAudio(M.track.previewUrl, 'clip', M.track.startSec, clipEnd(M.track), true); };
    function toggleClip() { if (M.playing === 'clip') stopAudio(); else playClip(); renderSheet(); }

    // ---------------- DOM ----------------
    function build() {
        if (root) return;
        S.loadFonts();
        root = document.createElement('div');
        root.className = 'st-comp'; root.hidden = true;
        root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', 'Create story');
        root.innerHTML = `
          <div class="st-ch">
            <button class="st-ib" style="background:var(--theme-primary-soft,#e0f2fe);color:var(--theme-primary,#1089d3)" type="button" data-k="close" aria-label="Discard story"><i class="fas fa-xmark"></i></button>
            <h3>New story</h3>
            <button class="st-btn ghost sm" type="button" data-k="preview"><i class="fas fa-eye"></i> Preview</button>
          </div>
          <div class="st-cbody">
            <div class="st-stagewrap"><div class="st-cstage">
              <div class="st-bgblur"></div><div class="st-media-wrap"></div><div class="st-texts"></div><div class="st-msticker"></div>
              <div class="st-safe" style="top:14%"></div><div class="st-safe" style="top:80%"></div>
              <div class="st-scrim-t" hidden></div><div class="st-scrim-b" hidden></div>
              <div class="st-song" hidden></div>
              <div class="st-capv" hidden></div>
              <div class="st-tools" role="toolbar" aria-label="Story tools"></div>
              <div class="st-pv" hidden style="position:absolute;left:12px;right:12px;bottom:12px;z-index:4;color:#fff;display:flex;flex-direction:column;gap:8px;pointer-events:none"></div>
            </div></div>
          </div>
          <div class="st-bb"><button class="st-btn" type="button" data-k="publish"><i class="fas fa-paper-plane"></i> Share to your story</button><div class="st-bar" hidden><i></i></div></div>
          <div class="st-sheet" hidden role="dialog" aria-label="Story options"><div class="st-sh-h"><b></b><button class="st-btn sm" type="button" data-k="done">Done</button></div><div class="st-sh-b"></div></div>
          <input type="file" hidden>`;
        document.body.appendChild(root);
        q = { head: $('.st-ch'), stage: $('.st-cstage'), mw: $('.st-media-wrap'), bg: $('.st-bgblur'), tx: $('.st-texts'), tools: $('.st-tools'), sheet: $('.st-sheet'),
              sht: $('.st-sh-h b'), shb: $('.st-sh-b'), file: $('input[type=file]'), bar: $('.st-bar'), barI: $('.st-bar i'), pub: $('[data-k=publish]'),
              pv: $('.st-pv'), msk: $('.st-msticker'), song: $('.st-song'), capv: $('.st-capv'), sT: $('.st-scrim-t'), sB: $('.st-scrim-b'), prevB: $('[data-k=preview]') };
        S.observeStage(q.stage);
        if ('ResizeObserver' in window) new ResizeObserver(measure).observe(q.sheet);

        root.addEventListener('click', onClick);
        q.shb.addEventListener('input', onInput);
        q.shb.addEventListener('change', e => {
            if (e.target.type !== 'range') return;
            if (e.target.dataset.in === 'size' || e.target.dataset.in === 'rot') pushHist();
        });
        q.shb.addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                if (e.target.dataset.in === 'music') { e.preventDefault(); musicSearch(); }
                else if (e.target.dataset.in === 'spotify') { e.preventDefault(); spotifyGo(); }
            }
            if (e.target.classList && e.target.classList.contains('st-win') && M.track && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
                e.preventDefault(); setStart(M.track.startSec + (e.key === 'ArrowRight' ? 1 : -1)); if (M.playing === 'clip') playClip();
            }
        });
        wireStage();
        wireStickerInteraction();
        wirePinch();
        wireTimeline();
        document.addEventListener('keydown', e => {
            if (!root || root.hidden || e.key !== 'Escape' || e.target.isContentEditable) return;
            M.sheet ? closeSheet() : tryClose();
        });
    }

    async function open(ctx, files) {
        C = ctx;
        // TAMAWO defaults — Cloudinary cloud "x7i7vzvo" + unsigned preset "t-amawo".
        C.cfg = Object.assign({ cloudName: 'x7i7vzvo', uploadPreset: 't-amawo' }, C.cfg);
        build();
        const cs = getComputedStyle(document.documentElement);
        PALETTE = ['#ffffff', '#111111', hex(cs.getPropertyValue('--theme-primary')), hex(cs.getPropertyValue('--theme-accent')), '#ffd23f', '#ff5a6e', '#4ade80', '#38bdf8', '#c084fc'].filter(Boolean);
        reset();
        root.hidden = false; document.documentElement.classList.add('st-lock');
        renderAll();
        await addFiles(files || []);
        if (!hasMedia()) { closeNow(); return; }
        const c = root.querySelector('[data-k=close]'); if (c) c.focus({ preventScroll: true });
    }
    function revokeAll() {
        M.items.forEach(i => { try { URL.revokeObjectURL(i.url); } catch (e) {} });
        if (M.video) { try { URL.revokeObjectURL(M.video.url); } catch (e) {} }
    }
    function reset() {
        stopAudio(); revokeAll();
        Object.assign(M, {
            sheet: null, items: [], video: null, layout: '', fit: 'fill', dur: MIN_DUR,
            texts: [], sel: null, caption: '', track: null, spotify: null, mstyle: 'bar',
            mpos: { x: 0.5, y: 0.54, scale: 1, rot: 0 },
            mt: { scale: 1, x: 0, y: 0 }, pan: null,
            mSel: false, dragS: null,
            query: '', spq: '', changing: false,
            hist: [], preview: false, busy: false, results: [], msg: '', searching: false, playing: '', tl: null
        });
    }
    function dirty() { return !!(hasMedia() || M.texts.length || M.track || M.spotify); }
    let closing = false;
    async function tryClose() {
        if (closing) return;
        closing = true;
        try {
            if (M.busy) {
                const ok = await S.confirm({ title: 'Cancel the upload?', message: 'Your story is still uploading. If you cancel now it will not be shared.', confirmLabel: 'Cancel upload', cancelLabel: 'Keep uploading', type: 'warn', confirmIcon: 'fa-xmark' });
                if (!ok) return;
                if (M.xhr) M.xhr.abort();
            } else if (dirty()) {
                const ok = await S.confirm({ title: 'Discard this story?', message: 'Your photos or video and all your edits will be removed. This can\u2019t be undone.', confirmLabel: 'Discard', cancelLabel: 'Keep editing', type: 'danger' });
                if (!ok) return;
            }
            closeNow();
        } finally { closing = false; }
    }
    function closeNow() {
        reset(); root.hidden = true; root.classList.remove('sheet'); document.documentElement.classList.remove('st-lock');
        q.mw.innerHTML = ''; q.bg.innerHTML = ''; q.tx.innerHTML = ''; q.bar.hidden = true;
    }

    // ---------------- media ----------------
    function readImage(f) {
        return new Promise((res, rej) => {
            const url = URL.createObjectURL(f), im = new Image();
            im.onload = () => res({ id: rid(), file: f, url, w: im.naturalWidth, h: im.naturalHeight });
            im.onerror = () => { URL.revokeObjectURL(url); rej(new Error('read')); };
            im.src = url;
        });
    }
    function readVideo(f) {
        return new Promise((res, rej) => {
            const url = URL.createObjectURL(f), v = document.createElement('video'); v.preload = 'metadata';
            v.onloadedmetadata = () => {
                if (v.duration > MAX_VID_S + 0.5) { URL.revokeObjectURL(url); return rej(new Error('long')); }
                res({ file: f, url, w: v.videoWidth, h: v.videoHeight, dur: v.duration || 0 });
            };
            v.onerror = () => { URL.revokeObjectURL(url); rej(new Error('format')); };
            v.src = url;
        });
    }
    function fixLayout() { M.layout = M.items.length >= 2 ? S.getLayout(M.layout, M.items.length).id : ''; }
    async function addFiles(files) {
        const vids = files.filter(f => f.type.startsWith('video/')), imgs = files.filter(f => f.type.startsWith('image/'));
        if (!vids.length && !imgs.length) return C.toast('Please choose photos or a video.', 'warn');
        if (vids.length) {
            if (files.length > 1) return C.toast('A video story can only have one video. Choose a video on its own, or only photos.', 'warn');
            const f = vids[0];
            if (f.size > MAX_VID) return C.toast('Videos can be up to 50 MB.', 'warn');
            try { M.video = await readVideo(f); }
            catch (e) { C.toast(e.message === 'long' ? 'Videos can be up to 1 minute.' : 'That video format is not supported by your browser.', e.message === 'long' ? 'warn' : 'error'); }
        } else {
            if (imgs.length > MAX_PHOTOS) C.toast('Only the first ' + MAX_PHOTOS + ' photos were added (max ' + MAX_PHOTOS + ').', 'warn');
            for (const f of imgs.slice(0, MAX_PHOTOS)) {
                if (f.size > MAX_IMG) { C.toast('“' + f.name + '” is over 15 MB, skipped.', 'warn'); continue; }
                try { M.items.push(await readImage(f)); } catch (e) { C.toast('Could not read “' + f.name + '”.', 'error'); }
            }
            fixLayout();
        }
        renderAll();
    }

    function renderStage() {
        q.mw.innerHTML = ''; q.bg.innerHTML = '';
        const n = M.items.length;
        q.mw.className = 'st-media-wrap' + (n > 1 ? ' collage' : (M.fit === 'fit' ? ' fit' : ''));
        if (M.video) {
            const v = document.createElement('video'); v.src = M.video.url; v.muted = true; v.loop = true; v.autoplay = true; v.playsInline = true; v.setAttribute('playsinline', '');
            q.mw.appendChild(v); v.play().catch(() => {});
            if (M.fit === 'fit') q.mw.classList.add('fit');
        } else if (n > 1) {
            q.mw.innerHTML = S.collageHtml(M.items, M.layout, true);
        } else if (n === 1) {
            const i = new Image(); i.src = M.items[0].url; i.alt = ''; q.mw.appendChild(i);
            const b = new Image(); b.src = M.items[0].url; b.alt = ''; q.bg.appendChild(b);
        }
        applyMT(); renderCaption(); renderTexts(); renderPv();
    }
    function applyMT() { S.applyMediaTransform(q.mw, canMT() ? M.mt : null); }
    function renderCaption() {
        const c = (M.caption || '').trim();
        q.capv.textContent = c; q.capv.hidden = !c;
    }
    function renderTexts() {
        q.tx.innerHTML = M.texts.map(t => S.textHtml(t, t.id === M.sel && !M.preview ? 'sel' : '', `data-id="${t.id}"`)).join('');
    }
    function refreshEl(t) {
        const el = q.tx.querySelector(`[data-id="${t.id}"]`); if (!el) return;
        const keep = el.getAttribute('contenteditable');
        el.style.cssText = S.textStyle(t);
        el.className = 'st-t st-t-' + (t.bg || 'none') + (t.id === M.sel && !M.preview ? ' sel' : '');
        if (keep) el.setAttribute('contenteditable', keep);
    }
    function musicCard(tr, spotify) {
        const art = S.safeImgUrl(tr.thumbnail);
        return `<div class="st-music-card playing">${art ? `<img src="${S.esc(art)}" alt="">` : '<span class="ph">🎵</span>'}<div class="st-mt"><b>${S.esc(tr.title)}</b><small>${S.esc(tr.artist || (spotify ? 'Spotify' : 'Music'))}</small></div>${spotify ? '<span class="st-mbtn">▶ Play</span>' : '<span class="st-eq" aria-hidden="true"><i></i><i></i><i></i></span>'}</div>`;
    }

    function renderSticker() {
        const m = M.track;
        if (!m) { q.msk.innerHTML = ''; q.song.textContent = ''; q.song.hidden = true; return; }
        const showHandles = M.mSel && !M.preview;
        q.msk.innerHTML = S.musicSticker(m, M.mstyle, M.mpos, { showHandles });
        q.song.textContent = S.musicLine(m);
        q.song.hidden = !(M.preview && m);
    }
    function renderPv() {
        renderSticker();
        q.stage.classList.toggle('pv', M.preview);
        q.sT.hidden = q.sB.hidden = q.pv.hidden = !M.preview;
        q.tx.style.pointerEvents = M.preview ? 'none' : '';
        if (!M.preview) { q.pv.innerHTML = ''; return; }
        q.pv.innerHTML = (M.spotify && !M.track ? musicCard(M.spotify, true) : '');
    }
    function setPreview(on) {
        M.preview = on;
        if (on) {
            M.sel = null; M.mSel = false;
            if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
            M.sheet = null; if (M.track) playClip(); else stopAudio();
        } else stopAudio();
        renderTexts(); renderPv(); renderSheet();
    }

    function renderTools() {
        const n = M.items.length, tools = [
            ['text', 'Aa', 'Text', M.texts.length > 0],
            ['music', '<i class="fas fa-music"></i>', 'Music', !!(M.track || M.spotify)],
            n >= 2 ? ['layout', '<i class="fas fa-table-cells-large"></i>', 'Layout', false] : ['layout', '<i class="fas fa-expand"></i>', 'Framing', M.fit === 'fit'],
            ...(!M.video ? [['time', '<i class="far fa-clock"></i>', 'Timing', false]] : []),
            ['caption', '<i class="far fa-message"></i>', 'Caption', !!M.caption]
        ];
        q.tools.innerHTML = tools.map(([k, ic, lab, dot]) => `<button type="button" class="st-tool ${M.sheet === k ? 'on' : ''}" data-k="tool" data-v="${k}" aria-label="${lab}" aria-pressed="${M.sheet === k}">${ic}${dot ? '<span class="dot"></span>' : ''}<span class="st-tool-lab">${lab}</span></button>`).join('');
    }

    const SHEET_TITLES = { text: 'Text', music: 'Music', layout: '', time: 'Story length', caption: 'Caption' };
    function openSheet(name) {
        if (M.preview) setPreview(false);
        if (M.sheet === 'music' && name !== 'music') stopAudio();
        M.sheet = name;
        if (name === 'text') { if (!M.texts.length) { addText(); return; } }
        renderSheet();
    }
    function closeSheet() {
        if (!M.sheet) return;
        if (document.activeElement && document.activeElement.isContentEditable) document.activeElement.blur();
        if (M.sheet === 'music') { stopAudio(); M.changing = false; }
        if (M.sheet === 'text') { M.sel = null; renderTexts(); }
        M.sheet = null; renderSheet();
    }
    function measure() {
        if (!root) return;
        root.style.setProperty('--sh', (M.sheet ? q.sheet.offsetHeight : 0) + 'px');
        root.style.setProperty('--hh', q.head.offsetHeight + 'px');
    }
    function renderAll() { renderStage(); renderSheet(); }
    function renderSheet() {
        const open = !!M.sheet && !M.preview;
        root.classList.toggle('sheet', open);
        q.sheet.hidden = !open;
        q.prevB.innerHTML = M.preview ? '<i class="fas fa-pen"></i> Edit' : '<i class="fas fa-eye"></i> Preview';
        q.pub.disabled = M.busy || !hasMedia();
        renderTools();
        if (!open) { root.style.setProperty('--sh', '0px'); return; }
        q.sht.textContent = M.sheet === 'layout' ? (M.items.length >= 2 ? 'Layout' : 'Framing') : SHEET_TITLES[M.sheet];
        q.shb.innerHTML = M.sheet === 'text' ? textSheet() : M.sheet === 'music' ? musicSheet() : M.sheet === 'layout' ? layoutSheet() : M.sheet === 'time' ? timeSheet() : captionSheet();
        requestAnimationFrame(measure);
    }

    function sw(list, cur, k) { return list.map(c => `<button type="button" class="st-sw ${c === cur ? 'on' : ''}" data-k="${k}" data-v="${c}" style="background:${c}" aria-label="Colour ${c}"></button>`).join(''); }
    function chips(list, cur, k) { return list.map(([v, l]) => `<button type="button" class="st-chip ${v === cur ? 'on' : ''}" data-k="${k}" data-v="${v}">${l}</button>`).join(''); }

    function textSheet() {
        const t = selT();
        let h = `<div class="st-row2"><button class="st-btn sm" type="button" data-k="addText"><i class="fas fa-plus"></i> Add text</button>
            <button class="st-btn ghost sm" type="button" data-k="editText" ${t ? '' : 'disabled'}><i class="fas fa-pen"></i> Edit</button>
            <button class="st-btn ghost sm" type="button" data-k="dup" ${t ? '' : 'disabled'}><i class="far fa-clone"></i> Duplicate</button>
            <button class="st-btn danger sm" type="button" data-k="del" ${t ? '' : 'disabled'} aria-label="Delete text"><i class="fas fa-trash"></i></button>
            <button class="st-btn ghost sm" type="button" data-k="undo" ${M.hist.length > 1 ? '' : 'disabled'}><i class="fas fa-rotate-left"></i> Undo</button>
            <button class="st-btn ghost sm" type="button" data-k="resetText" ${M.texts.length ? '' : 'disabled'}>Reset</button></div>`;
        if (!t) return h + `<p class="st-hint">Tap a text on the story to style it. Double-tap a text to edit it, drag to move it${coarse() ? ', pinch to resize and rotate it' : ''}.</p>`;
        return h + `<div class="st-lab">Font</div><div class="st-row2">${Object.entries(S.FONTS).map(([k, f]) => `<button type="button" class="st-chip ${t.font === k ? 'on' : ''}" data-k="font" data-v="${k}" style="font-family:${f.css}">${f.label}</button>`).join('')}</div>
          ${coarse() ? '' : `<div class="st-row2 st-desk-only"><label class="st-range">Size <input type="range" min="35" max="180" value="${Math.round(t.size * 1000)}" data-in="size"></label>
            <label class="st-range">Rotate <input type="range" min="-180" max="180" value="${Math.round(t.rot)}" data-in="rot"></label></div>`}
          <div class="st-row2">${chips([['left', '<i class="fas fa-align-left"></i>'], ['center', '<i class="fas fa-align-center"></i>'], ['right', '<i class="fas fa-align-right"></i>']], t.align, 'align')}
            <button type="button" class="st-chip ${t.bold ? 'on' : ''}" data-k="bold"><b>B</b></button><button type="button" class="st-chip ${t.italic ? 'on' : ''}" data-k="italic"><i>I</i></button></div>
          <div class="st-lab">Text colour</div><div class="st-row2">${sw(PALETTE, t.color, 'color')}</div>
          <div class="st-lab">Background</div><div class="st-row2">${chips([['none', 'None'], ['semi', 'Soft'], ['solid', 'Solid'], ['pill', 'Pill']], t.bg, 'bg')}</div>
          ${t.bg !== 'none' ? `<div class="st-row2">${sw(PALETTE, t.bgColor, 'bgColor')}</div>` : ''}`;
    }

    function waveHtml(seed, n) {
        let h = 7; for (const c of String(seed)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
        let out = '';
        for (let i = 0; i < n; i++) { h = (h * 1664525 + 1013904223) >>> 0; out += `<i style="height:${20 + ((h >>> 9) % 72)}%"></i>`; }
        return out;
    }
    function musicSheet() {
        const tr = M.track, sp = M.spotify, searching = !tr || M.changing;
        let h = '';
        if (tr) {
            const P = tr.previewSec || 30, lens = [5, 10, 15, 20, 30].filter(v => v <= P);
            h += `<div class="st-track" style="margin-top:0">${S.safeImgUrl(tr.thumbnail) ? `<img src="${S.esc(S.safeImgUrl(tr.thumbnail))}" alt="">` : '<span class="ph" style="width:44px;height:44px;border-radius:8px;background:#1db954;display:grid;place-items:center">🎵</span>'}
                <div class="st-mt"><b>${S.esc(tr.title)}</b><small>${S.esc(tr.artist || 'Music')}</small></div>
                <button class="st-btn ghost sm" type="button" data-k="playClip" aria-label="${M.playing === 'clip' ? 'Pause' : 'Play'} clip">${M.playing === 'clip' ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>'}</button>
                <button class="st-btn danger sm" type="button" data-k="rmTrack" aria-label="Remove song"><i class="fas fa-xmark"></i></button></div>
              <div class="st-lab" style="margin-top:12px">Choose the part of the song</div>
              <div class="st-tl" aria-label="Song timeline"><div class="st-wave">${waveHtml(tr.trackId || tr.title, 64)}</div>
                <div class="st-win" role="slider" tabindex="0" aria-label="Clip start" aria-valuemin="0" aria-valuemax="${(P - tr.clipSec).toFixed(1)}" aria-valuenow="${tr.startSec}" style="left:${(tr.startSec / P * 100).toFixed(2)}%;width:${(tr.clipSec / P * 100).toFixed(2)}%"></div></div>
              <div class="st-tlab"><span>0:00</span><b class="st-cliplabel">${S.fmtSec(tr.startSec)} – ${S.fmtSec(tr.startSec + tr.clipSec)} · ${tr.clipSec}s</b><span>${S.fmtSec(P)}</span></div>
              ${M.video ? `<p class="st-note2">Your video is ${S.fmtSec(vidSec())} long, so the clip follows it (${tr.clipSec}s). The video's own sound is muted while a song is attached.</p>`
                : `<div class="st-lab" style="margin-top:10px">Clip length = story length</div><div class="st-lenrow">${lens.map(v => `<button type="button" class="st-chip ${tr.clipSec === v ? 'on' : ''}" data-k="clipLen" data-v="${v}">${v}s</button>`).join('')}</div>`}
              ${M.changing ? '' : `<div class="st-lab" style="margin-top:12px">Show on story</div>
              <div class="st-row2">${chips(S.MUSIC_STYLES, S.normStyle(M.mstyle), 'mstyle')}</div>`}
              ${M.changing ? '' : `
                <div class="st-lab" style="margin-top:12px">Sticker on story</div>
                <div class="st-row2" style="margin-top:6px">
                  <button type="button" class="st-btn ghost sm" data-k="resetSticker"><i class="fas fa-rotate-left"></i> Reset position & size</button>
                  <button type="button" class="st-btn ghost sm" data-k="centerSticker"><i class="fas fa-crosshairs"></i> Center</button>
                </div>
                ${coarse() ? '' : `<div class="st-row2 st-desk-only" style="margin-top:6px">
                  <label class="st-range">Size <input type="range" min="25" max="400" step="1" value="${Math.round(M.mpos.scale * 100)}" data-in="stickerScale"></label>
                </div>
                <div class="st-row2 st-desk-only">
                  <label class="st-range">Rotate <input type="range" min="-180" max="180" step="1" value="${Math.round(M.mpos.rot)}" data-in="stickerRot"></label>
                </div>`}
                <div class="st-row2" style="margin-top:10px"><button class="st-btn ghost sm" type="button" data-k="changeSong"><i class="fas fa-arrows-rotate"></i> Change song</button></div>`}`;
        }
        if (searching) {
            h += `<div class="st-lab"${tr ? ' style="margin-top:12px"' : ''}>${tr ? 'Search another song' : 'Search a song'}</div>
              <div class="st-row2" style="flex-wrap:nowrap"><input class="st-input" data-in="music" placeholder="Song or artist…" aria-label="Search songs" value="${S.esc(M.query)}"><button class="st-btn sm" type="button" data-k="musicGo" ${M.searching ? 'disabled' : ''} aria-label="Search"><i class="fas fa-magnifying-glass"></i></button></div>
              ${M.searching ? '<p class="st-hint">Searching…</p>' : M.msg ? `<p class="st-hint">${S.esc(M.msg)}</p>` : '<p class="st-hint">Plays automatically for viewers. You\'ll pick which part of the song goes with your story.</p>'}
              ${M.results.map((r, i) => `<div class="st-track">${r.thumbnail ? `<img src="${S.esc(r.thumbnail)}" alt="">` : ''}<div class="st-mt"><b>${S.esc(r.title)}</b><small>${S.esc(r.artist || '')}</small></div>
                <button class="st-btn ghost sm" type="button" data-k="playRes" data-v="${i}" aria-label="Preview">${M.playing === 'r' + i ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>'}</button>
                <button class="st-btn sm" type="button" data-k="pickTrack" data-v="${i}">Select</button></div>`).join('')}
              ${M.changing ? `<div class="st-row2" style="margin-top:10px"><button class="st-btn ghost sm" type="button" data-k="keepSong">Keep current song</button></div>` : ''}`;
        }
        if (sp) {
            h += `<div class="st-lab" style="margin-top:12px">Attached Spotify link</div>
                <div class="st-track">${S.safeImgUrl(sp.thumbnail) ? `<img src="${S.esc(S.safeImgUrl(sp.thumbnail))}" alt="">` : '<span class="ph" style="width:44px;height:44px;border-radius:8px;background:#1db954;display:grid;place-items:center">🎵</span>'}
                  <div class="st-mt"><b>${S.esc(sp.title)}</b><small>${S.esc(sp.artist || 'Spotify')}</small></div>
                  <a class="st-btn ghost sm" href="${S.esc(sp.url)}" target="_blank" rel="noopener noreferrer">Open</a>
                  <button class="st-btn danger sm" type="button" data-k="rmSpotify" aria-label="Remove link"><i class="fas fa-xmark"></i></button></div>
                <p class="st-hint">Spotify links show a Play button for viewers. They can\'t auto-play or be clipped; search above for that.</p>`;
        }
        if (searching) h += `<details class="st-det"${sp && !tr ? ' open' : ''}><summary>Use a Spotify link instead</summary>
            <div class="st-row2" style="flex-wrap:nowrap;margin-top:8px"><input class="st-input" data-in="spotify" placeholder="Paste a Spotify track link" aria-label="Spotify link" value="${S.esc(M.spq)}"><button class="st-btn sm" type="button" data-k="spotifyGo">Add</button></div></details>`;
        return h;
    }

    function layoutSheet() {
        const n = M.items.length;
        if (n >= 2) return `<div class="st-row2">${S.layoutsFor(n).map(L => `<button type="button" class="st-lay ${L.id === M.layout ? 'on' : ''}" data-k="layout" data-v="${L.id}" title="${S.esc(L.label)}" aria-label="Layout: ${S.esc(L.label)}">${S.miniLayoutHtml(L)}</button>`).join('')}</div>
            <p class="st-hint">Photos appear in the order you selected them. To change photos, discard this story and pick again.</p>`;
        const z = Math.round(M.mt.scale * 100);
        return `<div class="st-row2">${chips([['fill', 'Fill screen'], ['fit', 'Fit whole']], M.fit, 'fit')}</div>
            ${coarse() ? '' : `<div class="st-lab">Zoom</div><div class="st-row2 st-desk-only"><label class="st-range">Size <input type="range" min="50" max="300" step="1" value="${z}" data-in="mediaScale" aria-label="Zoom"><b class="st-zoomv" style="min-width:42px">${z}%</b></label><button type="button" class="st-btn ghost sm" data-k="resetMedia">Reset</button></div>`}
            <p class="st-hint">"Fit whole" shows the entire ${M.video ? 'video' : 'photo'} with a soft background.${coarse() ? ' Pinch to resize it, then drag to move it.' : ' Zoom, then drag the ' + (M.video ? 'video' : 'photo') + ' to move it.'}</p>`;
    }
    function timeSheet() {
        if (M.track) return `<p class="st-hint" style="margin:0">With music attached your story lasts exactly as long as the song clip: <b>${M.track.clipSec}s</b>. Change the clip length in <b>Music</b>.</p>`;
        return `<div class="st-row2" style="margin-bottom:4px">${[15, 30, 45, 60].map(v => `<button type="button" class="st-chip ${M.dur === v ? 'on' : ''}" data-k="dur" data-v="${v}">${v}s</button>`).join('')}</div>
            <div class="st-row2"><label class="st-range">Custom <input type="range" min="${MIN_DUR}" max="${MAX_DUR}" step="1" value="${M.dur}" data-in="dur" aria-label="Story duration in seconds"><b class="st-durv" style="min-width:34px">${M.dur}s</b></label></div>
            <p class="st-hint">How long viewers see this story (15 s – 1 min).</p>`;
    }
    function captionSheet() {
        return `<input class="st-input" data-in="caption" maxlength="${MAX_CAPTION}" placeholder="Say something about this moment…" value="${S.esc(M.caption)}" aria-label="Caption"><p class="st-hint">Shown at the bottom of your story. Up to ${MAX_CAPTION} characters.</p>`;
    }

    const snap = () => JSON.stringify(M.texts);
    function pushHist() { const s = snap(); if (M.hist[M.hist.length - 1] !== s) { M.hist.push(s); if (M.hist.length > 40) M.hist.shift(); } }
    function undo() {
        if (M.hist.length < 2) { if (M.hist.length === 1 && M.texts.length) { M.texts = JSON.parse(M.hist[0]); } else return; }
        else { M.hist.pop(); M.texts = JSON.parse(M.hist[M.hist.length - 1]); }
        if (!find(M.sel)) M.sel = null;
        renderTexts(); renderSheet();
    }
    function addText() {
        if (!hasMedia()) return;
        if (M.texts.length >= MAX_TEXTS) return C.toast('You can add up to ' + MAX_TEXTS + ' text elements.', 'warn');
        if (!M.hist.length) M.hist.push('[]');
        const t = { id: rid(), text: 'Your text', x: 0.5, y: 0.5, size: 0.075, rot: 0, font: 'modern', color: '#ffffff', bg: 'none', bgColor: '#000000', align: 'center', bold: true, italic: false };
        M.texts.push(t); M.sel = t.id; M.sheet = 'text';
        renderTexts(); renderSheet(); pushHist(); edit(t.id, true);
    }
    function dup() {
        const t = selT(); if (!t) return;
        if (M.texts.length >= MAX_TEXTS) return C.toast('Text limit reached.', 'warn');
        const n = Object.assign({}, t, { id: rid(), x: S.clamp(t.x + 0.05, S.SAFE.xMin, S.SAFE.xMax), y: S.clamp(t.y + 0.06, S.SAFE.yMin, S.SAFE.yMax) });
        M.texts.push(n); M.sel = n.id; renderTexts(); renderSheet(); pushHist();
    }
    function del() {
        if (!M.sel) return;
        M.texts = M.texts.filter(t => t.id !== M.sel); M.sel = null; renderTexts(); renderSheet(); pushHist();
    }
    function select(id) {
        if (M.sel === id) return;
        M.sel = id;
        q.tx.querySelectorAll('.st-t').forEach(el => el.classList.toggle('sel', el.dataset.id === id));
        if (id && M.sheet !== 'text') { if (M.sheet === 'music') stopAudio(); M.sheet = 'text'; }
        renderSheet();
    }
    function edit(id, selectAll) {
        const el = q.tx.querySelector(`[data-id="${id}"]`); if (!el) return;
        el.setAttribute('contenteditable', 'true'); el.setAttribute('role', 'textbox'); el.setAttribute('aria-label', 'Story text'); el.focus();
        const r = document.createRange(); r.selectNodeContents(el); if (!selectAll) r.collapse(false);
        const s = getSelection(); s.removeAllRanges(); s.addRange(r);
        const t = find(id);
        const onIn = () => { if (el.innerText.length > MAX_TEXT_LEN) { el.innerText = el.innerText.slice(0, MAX_TEXT_LEN); } };
        const onPaste = e => { e.preventDefault(); document.execCommand('insertText', false, (e.clipboardData.getData('text/plain') || '').slice(0, MAX_TEXT_LEN)); };
        const onBlur = () => {
            el.removeEventListener('input', onIn); el.removeEventListener('paste', onPaste); el.removeEventListener('blur', onBlur);
            el.removeAttribute('contenteditable'); el.removeAttribute('role');
            const v = el.innerText.replace(/\u00a0/g, ' ').trim().slice(0, MAX_TEXT_LEN);
            if (!find(id)) return;
            if (!v) { M.texts = M.texts.filter(x => x.id !== id); if (M.sel === id) M.sel = null; renderTexts(); renderSheet(); pushHist(); return; }
            if (v !== t.text) { t.text = v; pushHist(); }
            el.textContent = t.text;
        };
        el.addEventListener('input', onIn); el.addEventListener('paste', onPaste); el.addEventListener('blur', onBlur);
    }

    // ---------------- text interaction (unchanged) ----------------
    function wireStage() {
        const st = q.stage;
        st.addEventListener('pointerdown', e => {
            if (M.preview || e.target.closest('.st-tools')) return;
            if (e.target.closest('.st-mwrap')) return;   // sticker session handles it
            const el = e.target.closest('.st-t');
            if (!el) {
                if (document.activeElement && document.activeElement.isContentEditable) document.activeElement.blur();
                if (M.sheet === 'text') closeSheet(); else select(null);
                if (M.mSel) { M.mSel = false; renderSticker(); }
                return;
            }
            if (el.isContentEditable) return;
            const t = find(el.dataset.id); if (!t) return;
            select(t.id);
            if (M.mSel) { M.mSel = false; renderSticker(); }
            const nowT = Date.now();
            if (M.lastTap && M.lastTap.id === t.id && nowT - M.lastTap.t < 320) { M.lastTap = null; edit(t.id); return; }
            M.lastTap = { id: t.id, t: nowT };
            const r = st.getBoundingClientRect();
            M.drag = { id: t.id, sx: e.clientX, sy: e.clientY, ox: t.x, oy: t.y, w: r.width, h: r.height, moved: false };
            try { el.setPointerCapture(e.pointerId); } catch (err) {}
            e.preventDefault();
        });
        st.addEventListener('pointermove', e => {
            const d = M.drag; if (!d) return;
            const dx = e.clientX - d.sx, dy = e.clientY - d.sy;
            if (!d.moved && Math.hypot(dx, dy) < 4) return;
            d.moved = true; st.classList.add('drag');
            const t = find(d.id); if (!t) return;
            t.x = S.clamp(d.ox + dx / d.w, S.SAFE.xMin, S.SAFE.xMax);
            t.y = S.clamp(d.oy + dy / d.h, S.SAFE.yMin, S.SAFE.yMax);
            refreshEl(t);
        });
        const end = () => { const d = M.drag; M.drag = null; st.classList.remove('drag'); if (d && d.moved) pushHist(); };
        st.addEventListener('pointerup', end); st.addEventListener('pointercancel', end);
    }

    // ---------------- sticker interaction ----------------
    // The wrapper is dragged from ANYWHERE on its surface (both axes).
    // Listeners are on `window` in capture phase so a drag that leaves the
    // stage still tracks, and pointercancel (from a browser scroll attempt)
    // is caught so the sticker never freezes.
    function wireStickerInteraction() {
        const st = q.stage;
        let session = null;
        let moved = false;
        let downAt = 0;

        function detach() {
            window.removeEventListener('pointermove', onMove, true);
            window.removeEventListener('pointerup', onUp, true);
            window.removeEventListener('pointercancel', onUp, true);
            st.classList.remove('sticker-dragging');
        }

        function endSession(e) {
            if (!session) return;
            const s = session; session = null;
            detach();
            const wasTap = s.kind === 'move' && !moved && (performance.now() - downAt) < TAP_MS;
            if (s.kind === 'move') {
                if (wasTap) { M.mSel = true; renderSticker(); }
                else pushHist();
            } else pushHist();
            if (M.sheet === 'music') renderSheet();
            if (e && e.pointerId != null) { try { st.releasePointerCapture(e.pointerId); } catch (err) {} }
        }

        function onMove(e) {
            const s = session;
            if (!s || (s.pointerId != null && e.pointerId !== s.pointerId)) return;
            const sr = s.stageRect || st.getBoundingClientRect();
            if (s.kind === 'move') {
                const dxPx = e.clientX - s.sx;
                const dyPx = e.clientY - s.sy;
                if (!moved && Math.hypot(dxPx, dyPx) > TAP_SLOP) moved = true;
                if (!moved) { e.preventDefault(); e.stopPropagation(); return; }
                const dx = dxPx / sr.width;
                const dy = dyPx / sr.height;
                M.mpos.x = clampStickerX(s.ox + dx);
                M.mpos.y = clampStickerY(s.oy + dy);
                renderSticker();
            } else if (s.mode === 'rot') {
                const ang = Math.atan2(e.clientY - s.cy, e.clientX - s.cx);
                let deg = (ang - s.startAngle) * 180 / Math.PI + s.orot;
                deg = Math.round(deg / 5) * 5;
                if (deg > 180) deg -= 360;
                if (deg < -180) deg += 360;
                M.mpos.rot = S.clamp(deg, -180, 180);
                renderSticker();
            } else {
                const cx = s.rect.left + s.rect.width / 2;
                const cy = s.rect.top + s.rect.height / 2;
                const dist = Math.hypot(e.clientX - cx, e.clientY - cy);
                const startDist = Math.hypot(s.sx - cx, s.sy - cy) || 1;
                M.mpos.scale = S.clamp(s.oscale * (dist / startDist), 0.25, 4);
                renderSticker();
            }
            e.preventDefault();
            e.stopPropagation();
        }

        function onUp(e) {
            const s = session;
            if (!s || (s.pointerId != null && e.pointerId !== s.pointerId)) return;
            endSession(e);
        }

        M.stickerCancel = () => { if (!session) return; session = null; detach(); };
        M.stickerOn = () => !!session;

        st.addEventListener('pointerdown', e => {
            if (M.preview) return;
            if (!M.track || S.normStyle(M.mstyle) === 'none') return;
            const wrap = e.target.closest('.st-mwrap');
            if (!wrap) return;
            if (e.target.closest('a, button')) return;

            const handle = e.target.closest('.st-h');
            const rect = wrap.getBoundingClientRect();
            const stageRect = st.getBoundingClientRect();

            if (handle) {
                const mode = handle.dataset.h;
                if (mode === 'del') { e.preventDefault(); e.stopPropagation(); deleteSticker(); return; }
                session = {
                    kind: 'handle', mode,
                    sx: e.clientX, sy: e.clientY,
                    ox: M.mpos.x, oy: M.mpos.y,
                    oscale: M.mpos.scale, orot: M.mpos.rot,
                    rect, stageRect, pointerId: e.pointerId
                };
                if (mode === 'rot') {
                    session.cx = rect.left + rect.width / 2;
                    session.cy = rect.top + rect.height / 2;
                    session.startAngle = Math.atan2(e.clientY - session.cy, e.clientX - session.cx);
                }
            } else {
                session = {
                    kind: 'move',
                    sx: e.clientX, sy: e.clientY,
                    ox: M.mpos.x, oy: M.mpos.y,
                    stageRect, pointerId: e.pointerId
                };
            }

            moved = false;
            downAt = performance.now();
            st.classList.add('sticker-dragging');

            try { wrap.setPointerCapture(e.pointerId); } catch (err) {}
            try { st.setPointerCapture(e.pointerId); } catch (err) {}

            window.addEventListener('pointermove', onMove, true);
            window.addEventListener('pointerup', onUp, true);
            window.addEventListener('pointercancel', onUp, true);

            e.preventDefault();
            e.stopPropagation();
        }, { passive: false });
    }

    // ---------------- pinch / twist / pan ----------------
    // Two fingers on the story: pinch = size, twist = rotate. The target is whatever the first finger
    // is holding (a text or the song sticker); otherwise the photo / video itself.
    // One finger on the bare photo / video moves it once it has been resized or set to "Fit whole".
    function wirePinch() {
        const st = q.stage, ptrs = new Map();
        let P = null;
        const pts = () => [...ptrs.values()];
        const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
        const ang = (a, b) => Math.atan2(b.y - a.y, b.x - a.x);
        const wrap = d => ((d + 180) % 360 + 360) % 360 - 180;
        const targetOf = el => {
            const t = el.closest && el.closest('.st-t'); if (t) return { k: 'text', id: t.dataset.id };
            if (el.closest && el.closest('.st-mwrap')) return { k: 'sticker' };
            return { k: 'bg' };
        };
        function begin() {
            const [a, b] = pts();
            let tg = [a.tgt, b.tgt].find(x => x.k !== 'bg') || (canMT() ? { k: 'media' } : null);
            if (!tg) return false;
            M.drag = null; q.stage.classList.remove('drag'); M.pan = null;
            if (M.stickerCancel) M.stickerCancel();
            const t = tg.k === 'text' ? find(tg.id) : null;
            if (tg.k === 'text' && !t) return false;
            P = { tg, d0: dist(a, b) || 1, a0: ang(a, b), size0: t ? t.size : 0, rot0: t ? t.rot : 0, sc0: tg.k === 'sticker' ? M.mpos.scale : M.mt.scale, sr0: M.mpos.rot };
            if (t && M.sel !== t.id) { M.sel = t.id; q.tx.querySelectorAll('.st-t').forEach(el => el.classList.toggle('sel', el.dataset.id === t.id)); }
            return true;
        }
        function apply() {
            const [a, b] = pts();
            const k = dist(a, b) / P.d0, dr = (ang(a, b) - P.a0) * 180 / Math.PI;
            if (P.tg.k === 'text') {
                const t = find(P.tg.id); if (!t) return;
                t.size = S.clamp(P.size0 * k, 0.035, 0.18); t.rot = S.clamp(Math.round(wrap(P.rot0 + dr)), -180, 180); refreshEl(t);
            } else if (P.tg.k === 'sticker') {
                M.mpos.scale = S.clamp(P.sc0 * k, 0.25, 4); M.mpos.rot = S.clamp(Math.round(wrap(P.sr0 + dr)), -180, 180); renderSticker();
            } else { M.mt.scale = S.clamp(P.sc0 * k, 0.5, 3); applyMT(); }
        }
        st.addEventListener('pointerdown', e => {
            if (M.preview || e.target.closest('.st-tools')) return;
            ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY, tgt: targetOf(e.target) });
            if (ptrs.size === 2 && !P) { if (begin()) { e.stopPropagation(); e.preventDefault(); } return; }
            if (P) { e.stopPropagation(); e.preventDefault(); return; }
            // first finger on the bare photo / video: prepare to move it (only when it has been resized or is "Fit whole")
            const p = ptrs.get(e.pointerId);
            if (p.tgt.k === 'bg' && canMT() && (M.mt.scale !== 1 || M.fit === 'fit')) {
                const r = st.getBoundingClientRect();
                M.pan = { id: e.pointerId, sx: e.clientX, sy: e.clientY, ox: M.mt.x, oy: M.mt.y, w: r.width, h: r.height, moved: false };
            }
        }, true);
        st.addEventListener('pointermove', e => {
            const p = ptrs.get(e.pointerId); if (!p) return;
            p.x = e.clientX; p.y = e.clientY;
            if (P) { if (ptrs.size >= 2) apply(); e.stopPropagation(); e.preventDefault(); return; }
            const pn = M.pan;
            if (pn && pn.id === e.pointerId) {
                const dx = e.clientX - pn.sx, dy = e.clientY - pn.sy;
                if (!pn.moved && Math.hypot(dx, dy) < 5) return;
                pn.moved = true; st.classList.add('drag');
                M.mt.x = S.clamp(pn.ox + dx / pn.w, -1, 1); M.mt.y = S.clamp(pn.oy + dy / pn.h, -1, 1); applyMT();
                e.preventDefault();
            }
        }, true);
        const up = e => {
            if (!ptrs.has(e.pointerId)) return;
            ptrs.delete(e.pointerId);
            if (M.pan && M.pan.id === e.pointerId) { M.pan = null; st.classList.remove('drag'); }
            if (P && ptrs.size < 2) { const was = P; P = null; pushHist(); if (was.tg.k !== 'media') renderSheet(); else if (M.sheet === 'layout') renderSheet(); }
        };
        st.addEventListener('pointerup', up, true);
        st.addEventListener('pointercancel', up, true);
    }

    function deleteSticker() {
        if (!M.track) return;
        stopAudio();
        M.track = null;
        M.mSel = false;
        M.changing = false;
        renderSticker();
        renderSheet();
    }

    function setStart(v) {
        const t = M.track; if (!t) return;
        const P = t.previewSec || 30;
        t.startSec = Math.round(S.clamp(v, 0, P - t.clipSec) * 10) / 10;
        updateClipUI();
    }
    function updateClipUI() {
        const t = M.track; if (!t) return;
        const P = t.previewSec || 30, win = $('.st-win'), lbl = $('.st-cliplabel');
        if (win) { win.style.left = (t.startSec / P * 100).toFixed(2) + '%'; win.style.width = (t.clipSec / P * 100).toFixed(2) + '%'; win.setAttribute('aria-valuenow', String(t.startSec)); win.setAttribute('aria-valuemax', (P - t.clipSec).toFixed(1)); }
        if (lbl) lbl.textContent = `${S.fmtSec(t.startSec)} – ${S.fmtSec(t.startSec + t.clipSec)} · ${t.clipSec}s`;
    }
    function wireTimeline() {
        q.shb.addEventListener('pointerdown', e => {
            const tl = e.target.closest('.st-tl'); if (!tl || !M.track) return;
            const r = tl.getBoundingClientRect(), P = M.track.previewSec || 30, x = e.clientX - r.left;
            const winL = (M.track.startSec / P) * r.width, winW = (M.track.clipSec / P) * r.width;
            let grab = x - winL;
            if (x < winL || x > winL + winW) { grab = winW / 2; setStart(((x - grab) / r.width) * P); }
            M.tl = { r, P, grab }; stopAudio();
            try { tl.setPointerCapture(e.pointerId); } catch (err) {}
            e.preventDefault();
        });
        q.shb.addEventListener('pointermove', e => { if (M.tl) setStart(((e.clientX - M.tl.r.left - M.tl.grab) / M.tl.r.width) * M.tl.P); });
        const end = () => { if (!M.tl) return; M.tl = null; if (M.track) { playClip(); renderSheet(); } };
        q.shb.addEventListener('pointerup', end); q.shb.addEventListener('pointercancel', end);
    }

    function onInput(e) {
        const k = e.target.dataset.in, t = selT();
        if (k === 'caption') { M.caption = e.target.value.slice(0, MAX_CAPTION); renderTools(); renderCaption(); }
        else if (k === 'mediaScale') { M.mt.scale = S.clamp(Number(e.target.value) / 100, 0.5, 3); applyMT(); const z = $('.st-zoomv'); if (z) z.textContent = Math.round(M.mt.scale * 100) + '%'; }
        else if (k === 'music') { M.query = e.target.value; }
        else if (k === 'spotify') { M.spq = e.target.value; }
        else if (k === 'dur') { M.dur = S.clamp(Math.round(e.target.value), MIN_DUR, MAX_DUR); const b = $('.st-durv'); if (b) b.textContent = M.dur + 's'; }
        else if (k === 'stickerScale') { M.mpos.scale = S.clamp(Number(e.target.value) / 100, 0.25, 4); renderSticker(); }
        else if (k === 'stickerRot') { M.mpos.rot = S.clamp(Math.round(Number(e.target.value)), -180, 180); renderSticker(); }
        else if (t && k === 'size') { t.size = S.clamp(e.target.value / 1000, 0.035, 0.18); refreshEl(t); }
        else if (t && k === 'rot') { t.rot = Number(e.target.value); refreshEl(t); }
    }
    function onClick(e) {
        const b = e.target.closest('[data-k]'); if (!b) return;
        const k = b.dataset.k, v = b.dataset.v, t = selT();
        const style = (fn) => { if (!t) return; fn(t); refreshEl(t); pushHist(); renderSheet(); };
        switch (k) {
            case 'close': tryClose(); break;
            case 'done': closeSheet(); break;
            case 'tool': M.sheet === v ? closeSheet() : openSheet(v); break;
            case 'preview': setPreview(!M.preview); break;
            case 'layout': M.layout = v; renderStage(); renderSheet(); break;
            case 'resetMedia': M.mt = { scale: 1, x: 0, y: 0 }; applyMT(); renderSheet(); break;
            case 'fit': M.fit = v; renderStage(); renderSheet(); break;
            case 'dur': M.dur = S.clamp(Number(v), MIN_DUR, MAX_DUR); renderSheet(); break;
            case 'addText': addText(); break;
            case 'editText': if (t) edit(t.id); break;
            case 'dup': dup(); break;
            case 'del': del(); break;
            case 'undo': undo(); break;
            case 'resetText': if (M.texts.length) S.confirm({ title: 'Remove all text?', message: 'Every text on this story will be removed.', confirmLabel: 'Remove all', cancelLabel: 'Keep text', type: 'warn', confirmIcon: 'fa-eraser' }).then(ok => { if (!ok) return; if (!M.hist.length) M.hist.push(snap()); M.texts = []; M.sel = null; renderTexts(); renderSheet(); pushHist(); }); break;
            case 'font': style(x => { x.font = v; }); break;
            case 'align': style(x => { x.align = v; }); break;
            case 'bold': style(x => { x.bold = !x.bold; }); break;
            case 'italic': style(x => { x.italic = !x.italic; }); break;
            case 'color': style(x => { x.color = v; }); break;
            case 'bg': style(x => { x.bg = v; }); break;
            case 'bgColor': style(x => { x.bgColor = v; }); break;
            case 'mstyle': M.mstyle = v; renderPv(); renderSheet(); break;
            case 'musicGo': musicSearch(); break;
            case 'playRes': {
                const r = M.results[Number(v)]; if (!r) break;
                if (M.playing === 'r' + v) stopAudio(); else playAudio(r.previewUrl, 'r' + v, 0, 30, false);
                renderSheet(); break;
            }
            case 'pickTrack': {
                const r = M.results[Number(v)]; if (!r) break;
                const P = r.previewSec || 30;
                const clip = M.video ? Math.max(MIN_CLIP, Math.min(P, vidSec() || 15)) : S.clamp(Math.round(M.dur), MIN_CLIP, P);
                M.track = Object.assign({}, r, { startSec: 0, clipSec: clip });
                M.spotify = null; M.results = []; M.msg = ''; M.changing = false;
                M.mSel = true;
                renderSticker(); renderSheet(); playClip(); renderSheet();
                break;
            }
            case 'clipLen': if (M.track) { const P = M.track.previewSec || 30; M.track.clipSec = Math.min(Number(v), P); setStart(M.track.startSec); renderSheet(); renderPv(); if (M.playing === 'clip') playClip(); } break;
            case 'playClip': toggleClip(); break;
            case 'changeSong': stopAudio(); M.changing = true; M.results = []; M.msg = ''; renderSheet(); break;
            case 'keepSong': stopAudio(); M.changing = false; renderSheet(); break;
            case 'rmTrack': stopAudio(); M.track = null; M.mSel = false; M.changing = false; renderSticker(); renderSheet(); break;
            case 'spotifyGo': spotifyGo(); break;
            case 'rmSpotify': M.spotify = null; renderSheet(); renderPv(); break;
            case 'resetSticker': M.mpos = { x: 0.5, y: 0.54, scale: 1, rot: 0 }; M.mSel = true; renderSticker(); renderSheet(); break;
            case 'centerSticker': M.mpos.x = 0.5; M.mpos.y = 0.54; renderSticker(); renderSheet(); break;
            case 'publish': publish(); break;
        }
    }

    async function musicSearch() {
        const term = (M.query || '').trim();
        if (term.length < 2 || M.searching) { if (term.length < 2) { M.msg = 'Type at least 2 characters.'; renderSheet(); } return; }
        stopAudio(); M.searching = true; M.msg = ''; M.results = []; renderSheet();
        try {
            M.results = await S.searchMusic(term);
            M.msg = M.results.length ? '' : 'No songs found. Try the artist name or a different spelling.';
        } catch (e) { M.msg = 'Song search is unavailable right now. Check your connection and try again.'; }
        M.searching = false; renderSheet();
        const inp = $('[data-in=music]'); if (inp && !M.results.length) inp.focus({ preventScroll: true });
    }
    function spotifyId(v) {
        v = (v || '').trim();
        let m = v.match(/^spotify:track:([A-Za-z0-9]{22})$/); if (m) return m[1];
        try { const u = new URL(v); if (u.hostname !== 'open.spotify.com') return null; m = u.pathname.match(/\/(?:intl-[a-z-]+\/)?track\/([A-Za-z0-9]{22})/); return m ? m[1] : null; } catch (e) { return null; }
    }
    async function spotifyGo() {
        const val = (M.spq || '').trim(); if (!val) return;
        const id = spotifyId(val);
        if (!id) { M.msg = 'That doesn\'t look like a Spotify track link. Open a song in Spotify → Share → Copy link.'; renderSheet(); return; }
        M.msg = 'Looking up…'; renderSheet();
        const url = 'https://open.spotify.com/track/' + id;
        let title = 'Spotify track', thumbnail = '';
        try {
            const r = await fetch('https://open.spotify.com/oembed?url=' + encodeURIComponent(url));
            if (r.ok) { const j = await r.json(); title = String(j.title || title).slice(0, 120); thumbnail = S.safeImgUrl(j.thumbnail_url) || ''; }
        } catch (e) {}
        stopAudio(); M.track = null; M.changing = false; M.spq = '';
        M.spotify = { trackId: id, url, title, artist: '', thumbnail }; M.msg = '';
        renderSheet(); renderPv();
    }

    const ymd = ms => { const d = new Date(ms); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
    function upload(file, onProg) {
        return new Promise((res, rej) => {
            const fd = new FormData();
            // TAMAWO Cloudinary: cloud "x7i7vzvo", unsigned preset "t-amawo", folder "t-amawo/stories".
            fd.append('file', file); fd.append('upload_preset', C.cfg.uploadPreset); fd.append('folder', 't-amawo/stories');
            fd.append('tags', 'story,expires_' + ymd(Date.now() + 86400000));
            const x = new XMLHttpRequest(); M.xhr = x;
            x.open('POST', `https://api.cloudinary.com/v1_1/${C.cfg.cloudName}/auto/upload`);
            x.upload.onprogress = e => { if (e.lengthComputable) onProg(e.loaded / e.total); };
            x.onload = () => {
                let j = {}; try { j = JSON.parse(x.responseText); } catch (e) {}
                x.status === 200 ? res(j) : rej(new Error((j.error && j.error.message) || 'Upload failed (' + x.status + ')'));
            };
            x.onerror = () => rej(new Error('Network error during upload'));
            x.onabort = () => rej(new Error('cancelled'));
            x.send(fd);
        });
    }
    async function discardUploads(list) {
        for (const up of list) {
            try {
                if (!up || !up.delete_token) continue;
                const fd = new FormData(); fd.append('token', up.delete_token);
                await fetch(`https://api.cloudinary.com/v1_1/${C.cfg.cloudName}/delete_by_token`, { method: 'POST', body: fd });
            } catch (e) {}
        }
    }
    async function publish() {
        if (M.busy || !hasMedia()) return;
        if (M.texts.some(t => !t.text)) M.texts = M.texts.filter(t => t.text);
        stopAudio(); M.busy = true; M.preview = false; M.sheet = null; renderPv(); renderSheet();
        q.bar.hidden = false; q.barI.style.width = '3%';
        const ups = [];
        try {
            const files = M.video ? [M.video.file] : M.items.map(i => i.file);
            for (let i = 0; i < files.length; i++) {
                ups.push(await upload(files[i], p => { q.barI.style.width = Math.max(3, Math.round(((i + p) / files.length) * 92)) + '%'; }));
            }
            const urls = ups.map(u => S.safeMediaUrl(u.secure_url));
            if (urls.some(u => !u)) throw new Error('Unexpected upload response');
            const first = ups[0], url = urls[0];
            const isV = first.resource_type === 'video';
            const thumb = isV ? url.replace('/video/upload/', '/video/upload/so_0,w_480,h_854,c_fill,f_jpg/').replace(/\.[a-z0-9]+$/i, '.jpg') : url.replace('/image/upload/', '/image/upload/w_480,q_auto,f_auto/');
            const ref = C.db.collection('stories').doc();
            const exp = firebase.firestore.Timestamp.fromMillis((C.now ? C.now() : Date.now()) + S.DURATION_MS);
            const multi = !isV && ups.length > 1;
            const vSec = Math.min(MAX_DUR, first.duration || (M.video && M.video.dur) || 0);
            const doc = {
                ownerUid: C.me.uid, ownerName: C.me.name, ownerPhoto: C.me.photo || '',
                mediaType: isV ? 'video' : 'image', mediaUrl: url, mediaPublicId: first.public_id || '', thumbUrl: S.safeMediaUrl(thumb),
                mediaFit: M.fit, mediaW: first.width || 0, mediaH: first.height || 0,
                mediaTransform: canMT() ? { scale: +M.mt.scale.toFixed(3), x: +M.mt.x.toFixed(4), y: +M.mt.y.toFixed(4) } : { scale: 1, x: 0, y: 0 },
                durationMs: isV ? Math.round(vSec * 1000) : Math.round(storyDur() * 1000),
                caption: M.caption.trim().slice(0, MAX_CAPTION),
                textOverlays: M.texts.slice(0, MAX_TEXTS).map(t => ({ id: t.id, text: t.text.slice(0, MAX_TEXT_LEN), x: +t.x.toFixed(4), y: +t.y.toFixed(4), size: +t.size.toFixed(4), rot: Math.round(t.rot), font: t.font, color: t.color, bg: t.bg, bgColor: t.bgColor, align: t.align, bold: !!t.bold, italic: !!t.italic })),
                spotifyTrack: M.spotify ? { trackId: M.spotify.trackId, url: M.spotify.url, title: M.spotify.title, artist: (M.spotify.artist || '').slice(0, 80), thumbnail: M.spotify.thumbnail || '' } : null,
                music: M.track ? {
                    provider: 'itunes', trackId: M.track.trackId, title: M.track.title,
                    artist: (M.track.artist || '').slice(0, 80), thumbnail: M.track.thumbnail || '',
                    previewUrl: M.track.previewUrl, previewSec: M.track.previewSec || 30,
                    startSec: M.track.startSec, clipSec: M.track.clipSec,
                    style: S.normStyle(M.mstyle),
                    sticker: {
                        x: +M.mpos.x.toFixed(4),
                        y: +M.mpos.y.toFixed(4),
                        scale: +M.mpos.scale.toFixed(4),
                        rot: Math.round(M.mpos.rot)
                    }
                } : null,
                muteVideo: !!(isV && M.track),
                mediaPublicIds: ups.map(u => u.public_id || '').filter(Boolean),
                status: 'active',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                expiresAt: exp
            };
            if (multi) { doc.mediaItems = ups.map((u, i) => ({ url: urls[i], w: u.width || 0, h: u.height || 0 })); doc.layout = S.getLayout(M.layout, ups.length).id; }
            q.barI.style.width = '96%';
            try { await ref.set(doc); }
            catch (we) { await discardUploads(ups); throw we; }
            try { const s = await ref.get({ source: 'server' }); const c = s.data().createdAt; if (c && c.toMillis) C.onPublished(c.toMillis() - Date.now()); } catch (e) {}
            q.barI.style.width = '100%';
            C.toast('Story shared! It will disappear in 24 hours.', 'success');
            M.busy = false; closeNow();
        } catch (e) {
            if (!e.code) await discardUploads(ups);
            M.busy = false; q.bar.hidden = true;
            if (e.message === 'cancelled') { renderSheet(); return; }
            console.warn('publish failed', e);
            C.toast(e.code === 'permission-denied' ? 'Couldn\'t publish. Check that you\'re signed in and your device clock/time zone is correct.' : ('Couldn\'t publish: ' + e.message), 'error');
            renderSheet();
        }
    }

    window.StoriesComposer = { open };
})();