/* ================================================================
   stories-shared.js  ·  TAMAWO / Barkada Stories   (v1.8)
   Tiny shared layer used by the viewer, composer and admin preview.
   The renderer produces IDENTICAL markup in every context, so what
   the composer shows is exactly what the viewer paints.
   ================================================================ */
(function () {
    'use strict';
    if (window.StoriesShared) return;

    const FONTS = {
        modern:  { label: 'Modern', css: "'Poppins',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif", normal: 500, bold: 800 },
        display: { label: 'Bold',   css: "'Bebas Neue',Impact,'Arial Narrow',sans-serif",                  normal: 400, bold: 400, upper: true },
        hand:    { label: 'Hand',   css: "'Caveat','Segoe Script','Bradley Hand',cursive",                 normal: 600, bold: 700 },
        serif:   { label: 'Serif',  css: "'Playfair Display',Georgia,'Times New Roman',serif",             normal: 600, bold: 800 }
    };
    const FONTS_HREF = 'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Caveat:wght@600;700&family=Playfair+Display:ital,wght@0,600;0,800;1,600;1,800&family=Poppins:ital,wght@0,500;0,800;1,500;1,800&display=swap';

    let fontsLoaded = false;
    function loadFonts() {
        if (fontsLoaded) return;
        fontsLoaded = true;
        const l = document.createElement('link');
        l.rel = 'stylesheet'; l.href = FONTS_HREF;
        document.head.appendChild(l);
    }

    function esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }

    function safeMediaUrl(u) {
        try { const x = new URL(u); return (x.protocol === 'https:' && x.hostname === 'res.cloudinary.com') ? x.href : ''; } catch (e) { return ''; }
    }
    function safeSpotifyUrl(u) {
        try { const x = new URL(u); return (x.protocol === 'https:' && x.hostname === 'open.spotify.com') ? x.href : ''; } catch (e) { return ''; }
    }
    function safeImgUrl(u) {
        try {
            const x = new URL(u);
            return (x.protocol === 'https:' && (x.hostname === 'res.cloudinary.com' || /(^|\.)scdn\.co$/.test(x.hostname) || /(^|\.)spotifycdn\.com$/.test(x.hostname) || /(^|\.)mzstatic\.com$/.test(x.hostname))) ? x.href : '';
        } catch (e) { return ''; }
    }
    function safeAudioUrl(u) {
        try { const x = new URL(u); return (x.protocol === 'https:' && /(^|\.)(mzstatic\.com|itunes\.apple\.com)$/.test(x.hostname)) ? x.href : ''; } catch (e) { return ''; }
    }
    function safeColor(c, fb) { return /^#[0-9a-f]{6}$/i.test(c || '') ? c : (fb || '#ffffff'); }
    function rgba(hex, a) {
        const h = safeColor(hex, '#000000');
        return `rgba(${parseInt(h.slice(1, 3), 16)},${parseInt(h.slice(3, 5), 16)},${parseInt(h.slice(5, 7), 16)},${a})`;
    }
    const clamp = (n, a, b) => Math.min(b, Math.max(a, Number(n) || 0));

    const SAFE = { xMin: 0.1, xMax: 0.9, yMin: 0.14, yMax: 0.8 };

    function textStyle(t) {
        const f = FONTS[t.font] || FONTS.modern;
        const bg = t.bg || 'none';
        const col = safeColor(t.color, '#ffffff');
        const bgc = safeColor(t.bgColor, '#000000');
        const align = ['left', 'center', 'right'].includes(t.align) ? t.align : 'center';
        let s = `left:${(clamp(t.x, 0, 1) * 100).toFixed(2)}%;top:${(clamp(t.y, 0, 1) * 100).toFixed(2)}%;` +
            `font-family:${f.css};font-size:calc(var(--stw,360px)*${clamp(t.size || 0.07, 0.03, 0.2).toFixed(4)});` +
            `color:${col};text-align:${align};font-weight:${t.bold ? f.bold : f.normal};font-style:${t.italic ? 'italic' : 'normal'};` +
            `transform:translate(-50%,-50%) rotate(${clamp(t.rot, -180, 180).toFixed(1)}deg);`;
        if (f.upper) s += 'text-transform:uppercase;letter-spacing:.04em;';
        if (bg === 'semi') s += `background:${rgba(bgc, 0.58)};`;
        else if (bg === 'solid' || bg === 'pill') s += `background:${bgc};`;
        else s += 'text-shadow:0 1px 2px rgba(0,0,0,.55),0 2px 14px rgba(0,0,0,.45);';
        return s;
    }
    function textHtml(t, extraClass, attrs) {
        const bg = ['none', 'semi', 'solid', 'pill'].includes(t.bg) ? t.bg : 'none';
        return `<div class="st-t st-t-${bg} ${extraClass || ''}" ${attrs || ''} style="${textStyle(t)}">${esc(t.text || '')}</div>`;
    }
    function renderTexts(container, overlays) {
        if (!container) return;
        container.innerHTML = (Array.isArray(overlays) ? overlays.slice(0, 8) : []).map(t => textHtml(t)).join('');
    }

    function observeStage(stage) {
        const set = () => stage.style.setProperty('--stw', stage.clientWidth + 'px');
        set();
        if (!('ResizeObserver' in window)) { window.addEventListener('resize', set); return () => window.removeEventListener('resize', set); }
        const ro = new ResizeObserver(set);
        ro.observe(stage);
        return () => ro.disconnect();
    }

    function timeAgo(ms) {
        const m = Math.floor((Date.now() - ms) / 60000);
        if (m < 1) return 'now';
        if (m < 60) return m + 'm';
        return Math.floor(m / 60) + 'h';
    }
    function cloudAvatar(url, size) {
        if (!url || !url.includes('res.cloudinary.com') || !url.includes('/upload/')) return url || '';
        const after = url.split('/upload/')[1] || '';
        if (/^[a-z]_/.test(after) || /^[a-z]+,[a-z]/.test(after)) return url;
        return url.replace('/upload/', `/upload/w_${size},h_${size},c_fill,g_face,q_auto:good,f_auto/`);
    }
    function cloudResize(url, w) {
        if (!url || !url.includes('res.cloudinary.com') || !url.includes('/upload/')) return url || '';
        const after = url.split('/upload/')[1] || '';
        if (/^[a-z]{1,2}_/.test(after) || /^[a-z]+,[a-z]/.test(after)) return url;
        return url.replace('/upload/', `/upload/w_${w},q_auto,f_auto/`);
    }
    const fmtSec = s => { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };

    function grid(c, r, n) {
        const cells = [];
        for (let i = 0; i < n; i++) cells.push([(i % c) / c, Math.floor(i / c) / r, 1 / c, 1 / r]);
        return cells;
    }
    const LAYOUTS = [
        { id: 'full', n: 1, label: 'Full', cells: [[0, 0, 1, 1]] },
        { id: 'v2', n: 2, label: 'Stacked', cells: grid(1, 2, 2) },
        { id: 'h2', n: 2, label: 'Side by side', cells: grid(2, 1, 2) },
        { id: 'w2', n: 2, label: 'Big + small', cells: [[0, 0, 1, 0.64], [0, 0.64, 1, 0.36]] },
        { id: 'r3', n: 3, label: 'Rows', cells: grid(1, 3, 3) },
        { id: 'c3', n: 3, label: 'Columns', cells: grid(3, 1, 3) },
        { id: 't1b2', n: 3, label: 'Top feature', cells: [[0, 0, 1, 0.56], [0, 0.56, 0.5, 0.44], [0.5, 0.56, 0.5, 0.44]] },
        { id: 'l1r2', n: 3, label: 'Side feature', cells: [[0, 0, 0.6, 1], [0.6, 0, 0.4, 0.5], [0.6, 0.5, 0.4, 0.5]] },
        { id: 'g4', n: 4, label: 'Grid', cells: grid(2, 2, 4) },
        { id: 't1b3', n: 4, label: 'Top feature', cells: [[0, 0, 1, 0.5], [0, 0.5, 1 / 3, 0.5], [1 / 3, 0.5, 1 / 3, 0.5], [2 / 3, 0.5, 1 / 3, 0.5]] },
        { id: 'l1r3', n: 4, label: 'Side feature', cells: [[0, 0, 0.62, 1], [0.62, 0, 0.38, 1 / 3], [0.62, 1 / 3, 0.38, 1 / 3], [0.62, 2 / 3, 0.38, 1 / 3]] },
        { id: 'r4', n: 4, label: 'Rows', cells: grid(1, 4, 4) },
        { id: 't2b3', n: 5, label: '2 + 3', cells: [[0, 0, 0.5, 0.5], [0.5, 0, 0.5, 0.5], [0, 0.5, 1 / 3, 0.5], [1 / 3, 0.5, 1 / 3, 0.5], [2 / 3, 0.5, 1 / 3, 0.5]] },
        { id: 't1b4', n: 5, label: '1 + 4', cells: [[0, 0, 1, 0.4], [0, 0.4, 0.5, 0.3], [0.5, 0.4, 0.5, 0.3], [0, 0.7, 0.5, 0.3], [0.5, 0.7, 0.5, 0.3]] },
        { id: 'g6', n: 6, label: '2 × 3', cells: grid(2, 3, 6) },
        { id: 'g6b', n: 6, label: '3 × 2', cells: grid(3, 2, 6) }
    ];
    const MAX_PHOTOS = 6;
    const layoutsFor = n => LAYOUTS.filter(l => l.n === n);
    function getLayout(id, n) {
        const list = layoutsFor(Math.max(1, Math.min(MAX_PHOTOS, n)));
        return list.find(l => l.id === id) || list[0];
    }
    const pc = v => (v * 100).toFixed(3) + '%';
    function collageHtml(items, layoutId, allowBlob) {
        const list = (items || []).slice(0, MAX_PHOTOS);
        const L = getLayout(layoutId, list.length);
        return L.cells.map((c, i) => {
            const it = list[i]; if (!it) return '';
            let u = safeMediaUrl(it.url);
            if (!u && allowBlob && /^blob:/.test(it.url || '')) u = it.url;
            if (!u) return '';
            return `<div class="st-cell" style="left:${pc(c[0])};top:${pc(c[1])};width:${pc(c[2])};height:${pc(c[3])}"><img src="${esc(cloudResize(u, 720))}" alt="" draggable="false"></div>`;
        }).join('');
    }
    function miniLayoutHtml(L) {
        return '<span class="m">' + L.cells.map(c => `<i style="left:${pc(c[0])};top:${pc(c[1])};width:${pc(c[2])};height:${pc(c[3])}"></i>`).join('') + '</span>';
    }

    let jsonpN = 0;
    function itunesJsonp(url) {
        return new Promise((res, rej) => {
            const cb = '__stItunes' + (++jsonpN) + '_' + Date.now(), sc = document.createElement('script');
            const done = () => { clearTimeout(t); delete window[cb]; sc.remove(); };
            const t = setTimeout(() => { done(); rej(new Error('timeout')); }, 9000);
            window[cb] = d => { done(); res(d); };
            sc.onerror = () => { done(); rej(new Error('blocked')); };
            sc.src = url + '&callback=' + cb;
            document.head.appendChild(sc);
        });
    }
    async function itunesQuery(url) {
        try { const r = await fetch(url); if (!r.ok) throw new Error('search ' + r.status); return await r.json(); }
        catch (e) { return itunesJsonp(url); }
    }
    async function searchMusic(term) {
        const base = 'https://itunes.apple.com/search?media=music&entity=song&limit=15&term=' + encodeURIComponent(term);
        const rs = await Promise.allSettled(['US', 'PH'].map(c => itunesQuery(base + '&country=' + c)));
        if (rs.every(r => r.status === 'rejected')) throw new Error('search failed');
        const seen = new Set(), out = [];
        const lists = rs.map(r => r.status === 'fulfilled' ? (r.value.results || []) : []);
        const max = Math.max(...lists.map(l => l.length));
        for (let i = 0; i < max; i++) lists.forEach(l => {
            const x = l[i]; if (!x) return;
            const prev = safeAudioUrl(x.previewUrl);
            if (!prev || !x.trackId) return;
            const key = (String(x.trackName) + '|' + String(x.artistName)).toLowerCase();
            if (seen.has(key)) return; seen.add(key);
            out.push({
                provider: 'itunes', trackId: String(x.trackId).slice(0, 20), title: String(x.trackName || 'Untitled').slice(0, 120), artist: String(x.artistName || '').slice(0, 80),
                thumbnail: safeImgUrl(String(x.artworkUrl100 || '').replace('100x100', '300x300')) || '', previewUrl: prev, previewSec: 30
            });
        });
        return out.slice(0, 20);
    }

    // ------------------------------------------------------------ music sticker
    const MUSIC_STYLES = [['none', 'None'], ['bar', 'Bar'], ['square', 'Square'], ['disc', 'Disc']];
    const normStyle = v => (MUSIC_STYLES.some(x => x[0] === v) ? v : 'bar');

    // Allow the sticker to be pushed off the frame; the center stays reachable.
    function cleanSticker(s) {
        if (!s || typeof s !== 'object') return { x: 0.5, y: 0.54, scale: 1, rot: 0 };
        return {
            x: clamp(s.x != null ? s.x : 0.5, -0.25, 1.25),
            y: clamp(s.y != null ? s.y : 0.54, -0.25, 1.25),
            scale: clamp(s.scale != null ? s.scale : 1, 0.25, 4),
            rot: clamp(s.rot != null ? s.rot : 0, -180, 180)
        };
    }

    function musicStickerInner(m, style) {
        style = normStyle(style);
        if (!m || style === 'none') return '';
        const art = safeImgUrl(m.thumbnail);
        const img = art ? `<img src="${esc(art)}" alt="">` : '<span class="ph">🎵</span>';
        const txt = `<span class="st-msk-t"><b>${esc(m.title)}</b><small>${esc(m.artist || 'Music')}</small></span>`;
        const eq = '<span class="st-eq" aria-hidden="true"><i></i><i></i><i></i></span>';
        return `<span class="st-msk-art">${img}</span>${txt}${style === 'bar' ? eq : ''}`;
    }

    // The sticker wrapper carries position + transform. The card is a
    // pointer-events:none child so the wrapper is the only interactive element.
    function musicSticker(m, style, sticker, opts) {
        style = normStyle(style);
        if (!m || style === 'none') return '';
        opts = opts || {};
        const tr = cleanSticker(sticker);
        const left = (tr.x * 100).toFixed(2);
        const top  = (tr.y * 100).toFixed(2);
        const transform = `translate(-50%,-50%) rotate(${tr.rot.toFixed(1)}deg) scale(${tr.scale.toFixed(3)})`;
        const handles = opts.showHandles
            ? '<i class="st-h rot" data-h="rot"></i>' +
              '<i class="st-h del" data-h="del"></i>' +
              '<i class="st-h tl"  data-h="tl"></i>' +
              '<i class="st-h tr"  data-h="tr"></i>' +
              '<i class="st-h bl"  data-h="bl"></i>' +
              '<i class="st-h br"  data-h="br"></i>'
            : '';
        return `<div class="st-mwrap" style="left:${left}%;top:${top}%;transform:${transform};" data-sticker="1">` +
            `<span class="st-msk st-msk-${style} st-ui" data-a="mute">${musicStickerInner(m, style)}</span>${handles}</div>`;
    }

    const musicLine = m => m ? ('♪ ' + String(m.title || '') + (m.artist ? ' · ' + m.artist : '')) : '';

    function cleanMusic(m) {
        if (!m || typeof m !== 'object') return null;
        const url = safeAudioUrl(m.previewUrl);
        if (!url) return null;
        const previewSec = clamp(m.previewSec || 30, 5, 30);
        const startSec   = clamp(m.startSec, 0, previewSec - 5);
        const clipSec    = clamp(m.clipSec || 15, 5, previewSec - startSec);
        return {
            provider: 'itunes', trackId: String(m.trackId || '').slice(0, 20), title: String(m.title || 'Song').slice(0, 120), artist: String(m.artist || '').slice(0, 80),
            thumbnail: safeImgUrl(m.thumbnail) || '', previewUrl: url, previewSec, startSec, clipSec, style: normStyle(m.style),
            sticker: cleanSticker(m.sticker)
        };
    }

    function attachClipLoop(audio, start, end) {
        const back = () => { try { audio.currentTime = start; } catch (e) {} };
        const onEnded = () => { back(); audio.play().catch(() => {}); };
        const timer = setInterval(() => { if (!audio.paused && audio.currentTime >= end - 0.05) back(); }, 100);
        audio.addEventListener('ended', onEnded);
        return () => { clearInterval(timer); audio.removeEventListener('ended', onEnded); };
    }


    // ------------------------------------------------------------ media size / position (photo or video, single-media stories)
    // scale 0.5-3, x / y = offset as a fraction of the story frame. Applied through CSS variables so the
    // composer preview, the viewer and the admin preview all draw it identically.
    function cleanMediaTransform(t) {
        t = t && typeof t === 'object' ? t : {};
        return { scale: clamp(t.scale || 1, 0.5, 3), x: clamp(t.x, -1, 1), y: clamp(t.y, -1, 1) };
    }
    function applyMediaTransform(el, t) {
        if (!el) return;
        const m = cleanMediaTransform(t);
        el.style.setProperty('--ms', m.scale.toFixed(3));
        el.style.setProperty('--mx', m.x.toFixed(4));
        el.style.setProperty('--my', m.y.toFixed(4));
    }

    // ------------------------------------------------------------ themed confirmation dialog
    // Replaces window.confirm everywhere in Stories (discard, delete, ...). Uses the site theme tokens,
    // sits above the viewer / composer, supports Esc, backdrop click, focus trap and returns a Promise<boolean>.
    let dlgActive = null;
    function confirmDialog(opts) {
        opts = opts || {};
        if (dlgActive) return dlgActive;
        const type = ['danger', 'warn', 'info'].includes(opts.type) ? opts.type : 'info';
        const icons = { danger: 'fa-trash-can', warn: 'fa-triangle-exclamation', info: 'fa-circle-info' };
        const okIcon = opts.confirmIcon || (type === 'danger' ? 'fa-trash-can' : 'fa-check');
        dlgActive = new Promise(resolve => {
            const prev = document.activeElement;
            const el = document.createElement('div');
            el.className = 'st-dlg';
            el.innerHTML = `<div class="st-dlg-bd"></div>
              <div class="st-dlg-card st-dlg-${type}" role="alertdialog" aria-modal="true" aria-labelledby="stDlgT" aria-describedby="stDlgM">
                <div class="st-dlg-ic" aria-hidden="true"><i class="fas ${opts.icon || icons[type]}"></i></div>
                <h3 id="stDlgT">${esc(opts.title || 'Are you sure?')}</h3>
                <p id="stDlgM">${esc(opts.message || '')}</p>
                <div class="st-dlg-act">
                  <button type="button" class="st-dlg-no">${esc(opts.cancelLabel || 'Cancel')}</button>
                  <button type="button" class="st-dlg-ok ${type === 'danger' ? 'danger' : ''}"><i class="fas ${okIcon}"></i> ${esc(opts.confirmLabel || 'Confirm')}</button>
                </div></div>`;
            document.body.appendChild(el);
            const no = el.querySelector('.st-dlg-no'), ok = el.querySelector('.st-dlg-ok');
            requestAnimationFrame(() => el.classList.add('in'));
            const finish = v => {
                window.removeEventListener('keydown', onKey, true);
                el.classList.remove('in');
                dlgActive = null;
                setTimeout(() => el.remove(), 180);
                if (prev && prev.focus) { try { prev.focus({ preventScroll: true }); } catch (e) { /* ignore */ } }
                resolve(v);
            };
            function onKey(e) {
                if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); finish(false); }
                else if (e.key === 'Tab') {                       // keep focus inside the dialog
                    e.preventDefault(); e.stopPropagation();
                    (document.activeElement === ok ? no : ok).focus();
                } else if (e.key.startsWith('Arrow') || e.key === ' ' || e.key === 'Enter') e.stopPropagation();   // never reach the viewer behind
            }
            window.addEventListener('keydown', onKey, true);
            no.addEventListener('click', () => finish(false));
            ok.addEventListener('click', () => finish(true));
            el.querySelector('.st-dlg-bd').addEventListener('click', () => finish(false));
            (type === 'danger' ? no : ok).focus({ preventScroll: true });   // destructive actions never default to "yes"
        });
        return dlgActive;
    }

    window.StoriesShared = {
        FONTS, SAFE, LAYOUTS, MAX_PHOTOS, loadFonts, esc, clamp, safeMediaUrl, safeSpotifyUrl, safeImgUrl, safeAudioUrl, safeColor, rgba,
        textStyle, textHtml, renderTexts, observeStage, timeAgo, cloudAvatar, cloudResize, fmtSec,
        layoutsFor, getLayout, collageHtml, miniLayoutHtml, searchMusic, cleanMusic, attachClipLoop,
        MUSIC_STYLES, normStyle, musicSticker, musicStickerInner, cleanSticker, musicLine,
        cleanMediaTransform, applyMediaTransform, confirm: confirmDialog,
        DURATION_MS: 24 * 60 * 60 * 1000,
        MIN_SHOW_MS: 15 * 1000, MAX_SHOW_MS: 60 * 1000
    };
})();