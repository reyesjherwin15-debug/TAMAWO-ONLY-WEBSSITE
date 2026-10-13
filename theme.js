/* ================================================================
   theme.js
   TIMAWA — Shared theme system
   Loaded SYNCHRONOUSLY in <head> after theme.css, before page render.

   ★ v6.3 ★ Crimson = "Rose Park" (was Velvet Theatre), Maroon = "Wine Bar" (was Wine Cellar).
   EVERY theme now has its own unique animated cursor (THEME_CURSORS), and the cursor engine is
   zero-latency: the dot sits exactly on the pointer hotspot, the icon rides beside it (no easing).
   ★ v6.2 ★ Blossom = "Flower Conservatory" (places, like Café). Themed animated cursor
   (THEME_CURSORS + cursorKit; styles in theme.css).
   ★ v6.1 ★ NEW scenes for Blossom ("Bloom"), Sunshine ("Golden Hour") and Café ("Cozy Corner").
   Palettes unchanged; only their `sub` taglines were reworded.
   ★ v6 ★ Matches theme.css (modern depth layer: atmosphere, particles, colour grade).
   - NEW: soft scene cross-fade on theme switch, color-scheme sync, stricter lite-mode detection.
   ★ v5 ★ Matches theme.css.
   - THEME_SHAPES: every theme is a new scene, except forest / sakura / aurora
     (same concept, upgraded). Shapes are plain divs + tiny inline SVG.
   - Palettes (THEMES.light / THEMES.dark) are UNCHANGED; only the short `sub`
     taglines were reworded to describe the new scenes.
   - NEW (perf): animations pause while the tab is hidden (html[data-tw-paused])
     and are switched off on low-end / data-saver devices (html[data-tw-lite]).
   - applyTheme, storage, sync: UNCHANGED.
   ================================================================ */

(function () {
    'use strict';

    window.THEME_STORAGE_KEY = 'timawa_theme';
    window.THEME_EVENT = 'timawa-theme-change';

    // ★ v6.3 — one unique themed cursor per theme (styled by theme.css "THEMED CURSOR")
    // ocean = whale + spout; sunset = setting sun; pink = conservatory flower; forest = pine + fireflies; sunshine = sun; starry = sparkle; cafe = coffee mug; crimson = rose; maroon = wine glass; sakura = cherry blossom; nebula = ringed planet; ember = paper lantern; autumn = maple leaf; glacier = snowflake; tropic = palm tree; moonlit = crescent moon; aurora = aurora ribbons; matcha = matcha bowl
    window.THEME_CURSORS = {
        ocean: '<svg viewBox="0 0 34 34"><g class="spt"><path class="k1" d="M13 12V7M13 7Q10.5 4.5 8.5 6.5M13 7Q15.5 4.5 17.5 6.5"/></g><g class="bob"><path class="f1 o2" d="M3 22C3 15 10 12 18 13.6C23 14.6 25 18.4 31 16.4C31.6 21 29.6 25 25 26.6C19 29 6 28.6 3 22Z"/><path class="fw" opacity=".55" d="M6 24.4C12 27 20 26.8 25 25L24 26.6C19 28.6 9 28 6 24.4Z"/><circle class="f2" cx="9.5" cy="20.4" r="1.4"/></g></svg>',
        sunset: '<svg viewBox="0 0 34 34"><g class="ry"><path class="k1" d="M29.5 22H33M27.8 15.8L30.9 14M23.3 11.2L25 8.1M17 9.5V6M10.7 11.2L9 8.1M6.2 15.8L3.1 14M4.5 22H1"/></g><path class="f1 o2" d="M6 23A11 11 0 0 1 28 23Z"/><path class="k2" d="M2 26.5H32M7 30.5H27"/></svg>',
        pink: '<svg viewBox="0 0 34 34"><g class="spin"><g class="pet"><ellipse cx="17" cy="9" rx="4.6" ry="6.4" transform="rotate(0 17 17)"/><ellipse cx="17" cy="9" rx="4.6" ry="6.4" transform="rotate(60 17 17)"/><ellipse cx="17" cy="9" rx="4.6" ry="6.4" transform="rotate(120 17 17)"/><ellipse cx="17" cy="9" rx="4.6" ry="6.4" transform="rotate(180 17 17)"/><ellipse cx="17" cy="9" rx="4.6" ry="6.4" transform="rotate(240 17 17)"/><ellipse cx="17" cy="9" rx="4.6" ry="6.4" transform="rotate(300 17 17)"/></g><circle class="ct" cx="17" cy="17" r="3.8"/></g><circle class="tw" cx="30" cy="6" r="1.7"/><circle class="tw d" cx="4" cy="29" r="1.3"/></svg>',
        forest: '<svg viewBox="0 0 34 34"><g class="tsw"><rect class="f2" x="15" y="27" width="4" height="5" rx="1"/><path class="f1 o2" d="M17 2L24 12H20.5L26.5 20H21.5L28 28H6L12.5 20H7.5L13.5 12H10Z"/></g><circle class="fy stw" cx="29" cy="8" r="1.8"/><circle class="fy stw d" cx="5" cy="13" r="1.4"/></svg>',
        sunshine: '<svg viewBox="0 0 34 34"><g class="spin"><path class="k1" d="M27 17H31.5M24.07 9.93L27.26 6.74M17 7V2.5M9.93 9.93L6.74 6.74M7 17H2.5M9.93 24.07L6.74 27.26M17 27V31.5M24.07 24.07L27.26 27.26"/></g><circle class="f1 o2" cx="17" cy="17" r="6.5"/><circle class="fy" cx="17" cy="17" r="3"/></svg>',
        starry: '<svg viewBox="0 0 34 34"><path class="f1 ow sp1" d="M17 2Q18.4 15.6 32 17Q18.4 18.4 17 32Q15.6 18.4 2 17Q15.6 15.6 17 2Z"/><path class="fw stw" d="M28 3Q28.4 6.6 32 7Q28.4 7.4 28 11Q27.6 7.4 24 7Q27.6 6.6 28 3Z"/><path class="fw stw d" d="M6 24Q6.3 26.7 9 27Q6.3 27.3 6 30Q5.7 27.3 3 27Q5.7 26.7 6 24Z"/></svg>',
        cafe: '<svg viewBox="0 0 34 34"><g class="steam"><path d="M11 12C8 9 14 7 11 3"/><path d="M17 12C14 9 20 7 17 3"/><path d="M23 12C20 9 26 7 23 3"/></g><path class="hd" d="M25 18H27.5Q31.5 18 31.5 22T27.5 26H24"/><path class="bd" d="M5 15H26V23C26 28 22.5 31.5 15.5 31.5S5 28 5 23Z"/><ellipse class="cf" cx="15.5" cy="15" rx="10.5" ry="2.6"/><path class="ht" d="M15.5 25C11 22 12 19 14 19.5C15 19.8 15.5 20.6 15.5 20.6S16 19.8 17 19.5C19 19 20 22 15.5 25Z"/></svg>',
        crimson: '<svg viewBox="0 0 34 34"><ellipse class="fg o2" cx="8" cy="27" rx="6" ry="3" transform="rotate(-28 8 27)"/><ellipse class="fg o2" cx="26" cy="27" rx="6" ry="3" transform="rotate(28 26 27)"/><g class="rb"><circle class="f1 o2" cx="17.00" cy="8.00" r="6.2"/><circle class="f1 o2" cx="23.66" cy="12.84" r="6.2"/><circle class="f1 o2" cx="21.11" cy="20.66" r="6.2"/><circle class="f1 o2" cx="12.89" cy="20.66" r="6.2"/><circle class="f1 o2" cx="10.34" cy="12.84" r="6.2"/><circle class="f2 o2" cx="17" cy="15" r="6.4"/><circle class="f1 o2" cx="17" cy="15" r="3.8"/><path class="kt" d="M14.6 15.4Q15 12.6 17.8 13Q20 14 19 16.6Q17.4 18 15.4 17"/></g><ellipse class="f1 fp" cx="29" cy="5" rx="2.2" ry="1.4"/></svg>',
        maroon: '<svg viewBox="0 0 34 34"><defs><clipPath id="twcWine"><path d="M9 4H25C25 14.5 22 20.5 17 20.5S9 14.5 9 4Z"/></clipPath></defs><path class="gg" d="M9 4H25C25 14.5 22 20.5 17 20.5S9 14.5 9 4Z"/><g clip-path="url(#twcWine)"><g class="slosh"><path class="wn" d="M4 10Q10.5 7 17 10T30 10V26H4Z"/></g></g><path class="gb" d="M9 4H25C25 14.5 22 20.5 17 20.5S9 14.5 9 4Z"/><path class="gs" d="M17 20.5V29.5M11 30.5H23"/><circle class="tw" cx="29" cy="5" r="1.6"/><path class="hl" d="M12 6Q12.5 12 15 16"/></svg>',
        sakura: '<svg viewBox="0 0 34 34"><g class="sk"><path class="f1 ow" transform="rotate(0 17 17)" d="M17 17C11.6 12.6 11 5.6 14.6 4L17 6.6L19.4 4C23 5.6 22.4 12.6 17 17Z"/><path class="f1 ow" transform="rotate(72 17 17)" d="M17 17C11.6 12.6 11 5.6 14.6 4L17 6.6L19.4 4C23 5.6 22.4 12.6 17 17Z"/><path class="f1 ow" transform="rotate(144 17 17)" d="M17 17C11.6 12.6 11 5.6 14.6 4L17 6.6L19.4 4C23 5.6 22.4 12.6 17 17Z"/><path class="f1 ow" transform="rotate(216 17 17)" d="M17 17C11.6 12.6 11 5.6 14.6 4L17 6.6L19.4 4C23 5.6 22.4 12.6 17 17Z"/><path class="f1 ow" transform="rotate(288 17 17)" d="M17 17C11.6 12.6 11 5.6 14.6 4L17 6.6L19.4 4C23 5.6 22.4 12.6 17 17Z"/><circle class="fy" cx="17" cy="17" r="2.2"/></g><ellipse class="f1 fp" cx="29" cy="5" rx="2" ry="1.3"/></svg>',
        nebula: '<svg viewBox="0 0 34 34"><circle class="f1 o2" cx="17" cy="17" r="8"/><path class="fw" opacity=".3" d="M11 13.5A8 8 0 0 1 20 9.2Q13 11 11 13.5Z"/><ellipse class="ko" cx="17" cy="17" rx="15" ry="5" transform="rotate(-22 17 17)"/><g class="orb"><circle class="fa" cx="17" cy="1.8" r="1.8"/></g></svg>',
        ember: '<svg viewBox="0 0 34 34"><circle class="gwl" cx="17" cy="16" r="15"/><path class="k2" d="M17 1V5"/><g class="lsw"><rect class="fo o2" x="11" y="4.6" width="12" height="3.4" rx="1"/><ellipse class="f1 o2" cx="17" cy="16" rx="10" ry="8.6"/><path class="kt" d="M17 7.4C12.4 11 12.4 21 17 24.6M17 7.4C21.6 11 21.6 21 17 24.6M8 16H26"/><rect class="fo o2" x="11" y="24" width="12" height="3.4" rx="1"/><path class="k1" d="M17 27.4V31"/><circle class="fy" cx="17" cy="31.6" r="1.6"/></g></svg>',
        autumn: '<svg viewBox="0 0 34 34"><g class="lfs"><path class="f1 o2" d="M17 2L19.8 8.5L24.5 6.5L23.3 13L29.5 11.5L26 17.5L30 20L22 22L22.3 24.5L17.8 23.5V31H16.2V23.5L11.7 24.5L12 22L4 20L8 17.5L4.5 11.5L10.7 13L9.5 6.5L14.2 8.5Z"/><path class="kt" d="M17 24V9M17 18L11 14M17 18L23 14M17 21L9 20M17 21L25 20"/></g></svg>',
        glacier: '<svg viewBox="0 0 34 34"><g class="spin"><path class="k1" transform="rotate(0 17 17)" d="M17 3V31M12.5 7.5L17 12L21.5 7.5M12.5 26.5L17 22L21.5 26.5"/><path class="k1" transform="rotate(60 17 17)" d="M17 3V31M12.5 7.5L17 12L21.5 7.5M12.5 26.5L17 22L21.5 26.5"/><path class="k1" transform="rotate(120 17 17)" d="M17 3V31M12.5 7.5L17 12L21.5 7.5M12.5 26.5L17 22L21.5 26.5"/><circle class="fw o2" cx="17" cy="17" r="2.4"/></g></svg>',
        tropic: '<svg viewBox="0 0 34 34"><path class="tk" d="M15.6 32Q19 23 17 14"/><g class="psw"><path class="fgn o2" d="M17 14C12.5 5 5.5 5.5 2.5 10C8.5 8.4 13.5 10.4 17 14Z"/><path class="fgn o2" d="M17 14C21.5 5 28.5 5.5 31.5 10C25.5 8.4 20.5 10.4 17 14Z"/><path class="fgn o2" d="M17 14C14 7 15.4 3 17 1.5C18.6 3 20 7 17 14Z"/><path class="fgn o2" d="M17 14C10 12.6 6 16.6 5 21C9.4 17.2 13 16 17 14Z"/><path class="fgn o2" d="M17 14C24 12.6 28 16.6 29 21C24.6 17.2 21 16 17 14Z"/><circle class="fb" cx="15.4" cy="15.6" r="1.7"/><circle class="fb" cx="18.8" cy="16" r="1.7"/></g></svg>',
        moonlit: '<svg viewBox="0 0 34 34"><defs><mask id="twcMoon"><rect width="34" height="34" fill="#fff"/><circle cx="23.5" cy="12" r="10.5" fill="#000"/></mask></defs><g class="bob"><circle class="f1" cx="15" cy="18" r="13" mask="url(#twcMoon)"/></g><path class="fy stw" d="M24 7Q24.4 10.6 28 11Q24.4 11.4 24 15Q23.6 11.4 20 11Q23.6 10.6 24 7Z"/><circle class="fy stw d" cx="30" cy="26" r="1.3"/></svg>',
        aurora: '<svg viewBox="0 0 34 34"><path class="wv k1" d="M2 11Q9.5 3 17 11T32 11"/><path class="wv ka w2" d="M2 18Q9.5 10 17 18T32 18"/><path class="wv k1 w3" d="M2 25Q9.5 17 17 25T32 25"/><circle class="fw stw" cx="28" cy="4" r="1.1"/><circle class="fw stw d" cx="5" cy="31" r="1"/></svg>',
        matcha: '<svg viewBox="0 0 34 34"><g class="steam"><path d="M12 11C9.6 8.6 14 7.2 12 4"/><path d="M19 11C16.6 8.6 21 7.2 19 4"/></g><path class="bowl o2" d="M4 15H30C30 24.6 24.6 29.6 17 29.6S4 24.6 4 15Z"/><ellipse class="f1 o2" cx="17" cy="15" rx="13" ry="3.2"/><circle class="fw" opacity=".6" cx="11" cy="15.2" r="1"/><circle class="fw" opacity=".6" cx="17.5" cy="16" r="1.3"/><circle class="fw" opacity=".6" cx="23" cy="14.8" r=".9"/><path class="f2" d="M12.5 29.5H21.5V32H12.5Z"/></svg>'
    };

    window.THEME_SHAPES = {

        // ★ OCEAN — "Deep Dive"
        ocean: `
            <div class="shape oc-rays"></div>
            <div class="shape oc-whale"><svg viewBox="0 0 400 170"><path class="wb" d="M8 96C30 44 120 16 214 42C262 56 300 82 346 90C358 70 376 46 396 34C398 60 392 80 380 96C392 112 398 134 398 156C376 146 358 120 346 106C300 118 250 134 200 138C120 146 40 142 8 96Z"/><path class="wl" d="M20 104C80 126 180 134 250 126C290 120 320 108 346 106C310 118 250 140 190 142C110 146 44 134 20 104Z"/><path class="wb" d="M140 124C150 148 172 160 196 162C186 146 180 134 178 126Z"/><circle class="we" cx="48" cy="90" r="3.4"/></svg></div>
            <svg class="shape oc-jelly opt" viewBox="0 0 60 110"><path d="M8 42C8 8 52 8 52 42Z"/><path class="t" d="M16 44C12 64 20 70 15 96M26 44C24 66 32 74 27 104M36 44C38 66 30 72 35 100M45 44C48 62 40 72 46 92"/></svg>
            <div class="shape oc-bubbles"></div>
            <svg class="shape oc-kelp k1" viewBox="0 0 100 300" preserveAspectRatio="xMinYMax meet"><path d="M22 300C8 250 36 214 20 168S34 88 24 30"/><path class="b" d="M50 300C40 262 64 232 52 190S62 120 54 84"/><path d="M76 300C68 270 84 248 76 214S84 170 80 150"/></svg>
            <svg class="shape oc-kelp k2" viewBox="0 0 100 300" preserveAspectRatio="xMaxYMax meet"><path d="M30 300C20 262 44 230 32 192S44 124 36 90"/><path class="b" d="M62 300C52 250 80 214 64 164S74 78 66 36"/></svg>
            <div class="shape oc-floor"></div>
        `,

        // ★ SUNSET — "Savanna Sunset"
        sunset: `
            <div class="shape sy-glow"></div>
            <div class="shape sy-sun"></div>
            <svg class="shape sy-birds" viewBox="0 0 160 60"><path d="M4 20Q10 10 16 20Q22 10 28 20M44 8Q50 -2 56 8Q62 -2 68 8M70 34Q76 24 82 34Q88 24 94 34M104 16Q110 6 116 16Q122 6 128 16M130 42Q136 32 142 42Q148 32 154 42"/></svg>
            <div class="shape sy-ground"></div>
            <svg class="shape sy-tree t2" viewBox="0 0 160 124"><path d="M6 40Q30 20 80 24Q130 20 154 40Q120 52 80 46Q40 52 6 40ZM76 46Q80 74 70 120H88Q84 76 84 46ZM80 64Q60 54 38 46L36 50Q60 60 78 72Z"/></svg>
            <svg class="shape sy-tree t1" viewBox="0 0 160 124"><path d="M6 40Q30 20 80 24Q130 20 154 40Q120 52 80 46Q40 52 6 40ZM76 46Q80 74 70 120H88Q84 76 84 46ZM80 64Q60 54 38 46L36 50Q60 60 78 72Z"/></svg>
            <svg class="shape sy-tree t3 opt" viewBox="0 0 160 124"><path d="M6 40Q30 20 80 24Q130 20 154 40Q120 52 80 46Q40 52 6 40ZM76 46Q80 74 70 120H88Q84 76 84 46ZM80 64Q60 54 38 46L36 50Q60 60 78 72Z"/></svg>
            <div class="shape sy-grass"></div>
        `,

        // ★ PINK — "Flower Conservatory" (glazed arches, hanging baskets, potted flowers, tiled floor; light shafts = ::before, petals = ::after)
        pink: `
            <svg class="shape bl-arch" viewBox="0 0 300 200" preserveAspectRatio="none">
            <path class="pn" d="M3 200V64C3 22 26 5 50 5S97 22 97 64V200Z"/>
            <path class="fr" d="M3 200V64C3 22 26 5 50 5S97 22 97 64V200Z"/>
            <path class="fr" d="M50 5V200M3 78H97M3 140H97"/>
            <path class="pn" d="M103 200V64C103 22 126 5 150 5S197 22 197 64V200Z"/>
            <path class="fr" d="M103 200V64C103 22 126 5 150 5S197 22 197 64V200Z"/>
            <path class="fr" d="M150 5V200M103 78H197M103 140H197"/>
            <path class="pn" d="M203 200V64C203 22 226 5 250 5S297 22 297 64V200Z"/>
            <path class="fr" d="M203 200V64C203 22 226 5 250 5S297 22 297 64V200Z"/>
            <path class="fr" d="M250 5V200M203 78H297M203 140H297"/>
            </svg>
            <svg class="shape bl-hang h1" viewBox="0 0 120 200">
            <path class="cd" d="M60 0V30M60 30L14 70M60 30L106 70"/>
            <path class="vn" d="M22 104Q16 140 20 182M40 116Q36 148 40 172M82 116Q88 150 84 190M100 104Q106 134 102 168"/>
            <g class="lf">
            <ellipse cx="19" cy="130" rx="8" ry="3.4" transform="rotate(-50 19 130)"/>
            <ellipse cx="22" cy="156" rx="8" ry="3.4" transform="rotate(50 22 156)"/>
            <ellipse cx="38" cy="140" rx="7" ry="3" transform="rotate(-50 38 140)"/>
            <ellipse cx="86" cy="140" rx="8" ry="3.4" transform="rotate(50 86 140)"/>
            <ellipse cx="87" cy="168" rx="8" ry="3.4" transform="rotate(-50 87 168)"/>
            <ellipse cx="102" cy="150" rx="7" ry="3" transform="rotate(50 102 150)"/>
            </g>
            <circle class="f1" cx="20" cy="184" r="5"/>
            <circle class="f3" cx="40" cy="174" r="4.2"/>
            <circle class="f2" cx="84" cy="192" r="5"/>
            <circle class="f1" cx="102" cy="170" r="4.2"/>
            <path class="po" d="M8 68H112C112 106 88 128 60 128S8 106 8 68Z"/>
            <path class="po2" d="M10 80Q60 92 110 80M14 94Q60 108 106 94M24 108Q60 120 96 108" fill="none"/>
            <rect class="po2" x="5" y="64" width="110" height="9" rx="4"/>
            <g class="lf">
            <ellipse cx="26" cy="62" rx="12" ry="5" transform="rotate(-25 26 62)"/>
            <ellipse cx="94" cy="62" rx="12" ry="5" transform="rotate(25 94 62)"/>
            <ellipse cx="60" cy="58" rx="10" ry="4"/>
            </g>
            <circle class="f1" cx="30" cy="54" r="14"/>
            <circle class="f3" cx="90" cy="54" r="14"/>
            <circle class="f2" cx="60" cy="44" r="16"/>
            <circle class="f4" cx="44" cy="36" r="10"/>
            <circle class="f1" cx="78" cy="34" r="10"/>
            <circle class="fc" cx="60" cy="44" r="4.4"/>
            <circle class="fc" cx="30" cy="54" r="3.4"/>
            <circle class="fc" cx="90" cy="54" r="3.4"/>
            </svg>
            <svg class="shape bl-hang h2" viewBox="0 0 120 200">
            <path class="cd" d="M60 0V30M60 30L14 70M60 30L106 70"/>
            <path class="vn" d="M22 104Q16 140 20 182M40 116Q36 148 40 172M82 116Q88 150 84 190M100 104Q106 134 102 168"/>
            <g class="lf">
            <ellipse cx="19" cy="130" rx="8" ry="3.4" transform="rotate(-50 19 130)"/>
            <ellipse cx="22" cy="156" rx="8" ry="3.4" transform="rotate(50 22 156)"/>
            <ellipse cx="38" cy="140" rx="7" ry="3" transform="rotate(-50 38 140)"/>
            <ellipse cx="86" cy="140" rx="8" ry="3.4" transform="rotate(50 86 140)"/>
            <ellipse cx="87" cy="168" rx="8" ry="3.4" transform="rotate(-50 87 168)"/>
            <ellipse cx="102" cy="150" rx="7" ry="3" transform="rotate(50 102 150)"/>
            </g>
            <circle class="f1" cx="20" cy="184" r="5"/>
            <circle class="f3" cx="40" cy="174" r="4.2"/>
            <circle class="f2" cx="84" cy="192" r="5"/>
            <circle class="f1" cx="102" cy="170" r="4.2"/>
            <path class="po" d="M8 68H112C112 106 88 128 60 128S8 106 8 68Z"/>
            <path class="po2" d="M10 80Q60 92 110 80M14 94Q60 108 106 94M24 108Q60 120 96 108" fill="none"/>
            <rect class="po2" x="5" y="64" width="110" height="9" rx="4"/>
            <g class="lf">
            <ellipse cx="26" cy="62" rx="12" ry="5" transform="rotate(-25 26 62)"/>
            <ellipse cx="94" cy="62" rx="12" ry="5" transform="rotate(25 94 62)"/>
            <ellipse cx="60" cy="58" rx="10" ry="4"/>
            </g>
            <circle class="f1" cx="30" cy="54" r="14"/>
            <circle class="f3" cx="90" cy="54" r="14"/>
            <circle class="f2" cx="60" cy="44" r="16"/>
            <circle class="f4" cx="44" cy="36" r="10"/>
            <circle class="f1" cx="78" cy="34" r="10"/>
            <circle class="fc" cx="60" cy="44" r="4.4"/>
            <circle class="fc" cx="30" cy="54" r="3.4"/>
            <circle class="fc" cx="90" cy="54" r="3.4"/>
            </svg>
            <svg class="shape bl-hang h3 opt" viewBox="0 0 120 200">
            <path class="cd" d="M60 0V30M60 30L14 70M60 30L106 70"/>
            <path class="vn" d="M22 104Q16 140 20 182M40 116Q36 148 40 172M82 116Q88 150 84 190M100 104Q106 134 102 168"/>
            <g class="lf">
            <ellipse cx="19" cy="130" rx="8" ry="3.4" transform="rotate(-50 19 130)"/>
            <ellipse cx="22" cy="156" rx="8" ry="3.4" transform="rotate(50 22 156)"/>
            <ellipse cx="38" cy="140" rx="7" ry="3" transform="rotate(-50 38 140)"/>
            <ellipse cx="86" cy="140" rx="8" ry="3.4" transform="rotate(50 86 140)"/>
            <ellipse cx="87" cy="168" rx="8" ry="3.4" transform="rotate(-50 87 168)"/>
            <ellipse cx="102" cy="150" rx="7" ry="3" transform="rotate(50 102 150)"/>
            </g>
            <circle class="f1" cx="20" cy="184" r="5"/>
            <circle class="f3" cx="40" cy="174" r="4.2"/>
            <circle class="f2" cx="84" cy="192" r="5"/>
            <circle class="f1" cx="102" cy="170" r="4.2"/>
            <path class="po" d="M8 68H112C112 106 88 128 60 128S8 106 8 68Z"/>
            <path class="po2" d="M10 80Q60 92 110 80M14 94Q60 108 106 94M24 108Q60 120 96 108" fill="none"/>
            <rect class="po2" x="5" y="64" width="110" height="9" rx="4"/>
            <g class="lf">
            <ellipse cx="26" cy="62" rx="12" ry="5" transform="rotate(-25 26 62)"/>
            <ellipse cx="94" cy="62" rx="12" ry="5" transform="rotate(25 94 62)"/>
            <ellipse cx="60" cy="58" rx="10" ry="4"/>
            </g>
            <circle class="f1" cx="30" cy="54" r="14"/>
            <circle class="f3" cx="90" cy="54" r="14"/>
            <circle class="f2" cx="60" cy="44" r="16"/>
            <circle class="f4" cx="44" cy="36" r="10"/>
            <circle class="f1" cx="78" cy="34" r="10"/>
            <circle class="fc" cx="60" cy="44" r="4.4"/>
            <circle class="fc" cx="30" cy="54" r="3.4"/>
            <circle class="fc" cx="90" cy="54" r="3.4"/>
            </svg>
            <svg class="shape bl-pots l" viewBox="0 0 260 200">
            <g class="lf2">
            <path d="M75 146Q70 108 74 74"/>
            <path d="M70 146Q54 120 46 98"/>
            <path d="M80 146Q96 120 104 96"/>
            <path d="M151 154Q148 120 150 92"/>
            <path d="M146 155Q132 130 128 108"/>
            <path d="M156 155Q170 128 174 106"/>
            <path d="M214 168Q206 142 206 116"/>
            <path d="M220 168Q228 134 226 102"/>
            </g>
            <g class="lf">
            <ellipse cx="62" cy="120" rx="12" ry="4.6" transform="rotate(-35 62 120)"/>
            <ellipse cx="90" cy="118" rx="12" ry="4.6" transform="rotate(35 90 118)"/>
            <ellipse cx="72" cy="100" rx="10" ry="4" transform="rotate(-20 72 100)"/>
            <path d="M151 158Q130 142 124 124Q146 134 151 158Z"/>
            <path d="M151 158Q172 142 178 124Q156 134 151 158Z"/>
            <ellipse cx="210" cy="140" rx="9" ry="3.6" transform="rotate(-40 210 140)"/>
            <ellipse cx="224" cy="132" rx="9" ry="3.6" transform="rotate(40 224 132)"/>
            </g>
            <rect class="po2" x="40" y="142" width="70" height="11" rx="3"/>
            <path class="po" d="M45 152H105L99 200H51Z"/>
            <rect class="po2" x="124" y="152" width="58" height="10" rx="3"/>
            <path class="po" d="M128 161H178L173 200H133Z"/>
            <rect class="po2" x="194" y="166" width="44" height="9" rx="3"/>
            <path class="po" d="M198 174H234L230 200H202Z"/>
            <circle class="p1" cx="74" cy="70" r="21"/>
            <circle class="p2" cx="74" cy="70" r="14.7"/>
            <circle class="p3" cx="74" cy="70" r="8.4"/>
            <circle class="p1" cx="45" cy="94" r="17"/>
            <circle class="p2" cx="45" cy="94" r="11.9"/>
            <circle class="p3" cx="45" cy="94" r="6.8"/>
            <circle class="p1" cx="104" cy="92" r="17"/>
            <circle class="p2" cx="104" cy="92" r="11.9"/>
            <circle class="p3" cx="104" cy="92" r="6.8"/>
            <path class="f1" transform="translate(150 92) rotate(0)" d="M0 0C-10 -2 -11 -18 -6 -27L-2 -19L0 -29L2 -19L6 -27C11 -18 10 -2 0 0Z"/>
            <path class="f2" transform="translate(128 108) rotate(-14)" d="M0 0C-10 -2 -11 -18 -6 -27L-2 -19L0 -29L2 -19L6 -27C11 -18 10 -2 0 0Z"/>
            <path class="f4" transform="translate(174 106) rotate(14)" d="M0 0C-10 -2 -11 -18 -6 -27L-2 -19L0 -29L2 -19L6 -27C11 -18 10 -2 0 0Z"/>
            <g class="f2" transform="translate(206 114)">
            <ellipse rx="3.6" ry="8" cy="-8.5" transform="rotate(0)"/>
            <ellipse rx="3.6" ry="8" cy="-8.5" transform="rotate(45)"/>
            <ellipse rx="3.6" ry="8" cy="-8.5" transform="rotate(90)"/>
            <ellipse rx="3.6" ry="8" cy="-8.5" transform="rotate(135)"/>
            <ellipse rx="3.6" ry="8" cy="-8.5" transform="rotate(180)"/>
            <ellipse rx="3.6" ry="8" cy="-8.5" transform="rotate(225)"/>
            <ellipse rx="3.6" ry="8" cy="-8.5" transform="rotate(270)"/>
            <ellipse rx="3.6" ry="8" cy="-8.5" transform="rotate(315)"/>
            </g>
            <circle class="fc" cx="206" cy="114" r="4.5"/>
            <g class="f2" transform="translate(226 100)">
            <ellipse rx="3.1" ry="6.8" cy="-7.2" transform="rotate(0)"/>
            <ellipse rx="3.1" ry="6.8" cy="-7.2" transform="rotate(45)"/>
            <ellipse rx="3.1" ry="6.8" cy="-7.2" transform="rotate(90)"/>
            <ellipse rx="3.1" ry="6.8" cy="-7.2" transform="rotate(135)"/>
            <ellipse rx="3.1" ry="6.8" cy="-7.2" transform="rotate(180)"/>
            <ellipse rx="3.1" ry="6.8" cy="-7.2" transform="rotate(225)"/>
            <ellipse rx="3.1" ry="6.8" cy="-7.2" transform="rotate(270)"/>
            <ellipse rx="3.1" ry="6.8" cy="-7.2" transform="rotate(315)"/>
            </g>
            <circle class="fc" cx="226" cy="100" r="3.8"/>
            </svg>
            <svg class="shape bl-pots r opt" viewBox="0 0 260 200">
            <g class="lf2">
            <path d="M75 146Q70 108 74 74"/>
            <path d="M70 146Q54 120 46 98"/>
            <path d="M80 146Q96 120 104 96"/>
            <path d="M151 154Q148 120 150 92"/>
            <path d="M146 155Q132 130 128 108"/>
            <path d="M156 155Q170 128 174 106"/>
            <path d="M214 168Q206 142 206 116"/>
            <path d="M220 168Q228 134 226 102"/>
            </g>
            <g class="lf">
            <ellipse cx="62" cy="120" rx="12" ry="4.6" transform="rotate(-35 62 120)"/>
            <ellipse cx="90" cy="118" rx="12" ry="4.6" transform="rotate(35 90 118)"/>
            <ellipse cx="72" cy="100" rx="10" ry="4" transform="rotate(-20 72 100)"/>
            <path d="M151 158Q130 142 124 124Q146 134 151 158Z"/>
            <path d="M151 158Q172 142 178 124Q156 134 151 158Z"/>
            <ellipse cx="210" cy="140" rx="9" ry="3.6" transform="rotate(-40 210 140)"/>
            <ellipse cx="224" cy="132" rx="9" ry="3.6" transform="rotate(40 224 132)"/>
            </g>
            <rect class="po2" x="40" y="142" width="70" height="11" rx="3"/>
            <path class="po" d="M45 152H105L99 200H51Z"/>
            <rect class="po2" x="124" y="152" width="58" height="10" rx="3"/>
            <path class="po" d="M128 161H178L173 200H133Z"/>
            <rect class="po2" x="194" y="166" width="44" height="9" rx="3"/>
            <path class="po" d="M198 174H234L230 200H202Z"/>
            <circle class="p1" cx="74" cy="70" r="21"/>
            <circle class="p2" cx="74" cy="70" r="14.7"/>
            <circle class="p3" cx="74" cy="70" r="8.4"/>
            <circle class="p1" cx="45" cy="94" r="17"/>
            <circle class="p2" cx="45" cy="94" r="11.9"/>
            <circle class="p3" cx="45" cy="94" r="6.8"/>
            <circle class="p1" cx="104" cy="92" r="17"/>
            <circle class="p2" cx="104" cy="92" r="11.9"/>
            <circle class="p3" cx="104" cy="92" r="6.8"/>
            <path class="f1" transform="translate(150 92) rotate(0)" d="M0 0C-10 -2 -11 -18 -6 -27L-2 -19L0 -29L2 -19L6 -27C11 -18 10 -2 0 0Z"/>
            <path class="f2" transform="translate(128 108) rotate(-14)" d="M0 0C-10 -2 -11 -18 -6 -27L-2 -19L0 -29L2 -19L6 -27C11 -18 10 -2 0 0Z"/>
            <path class="f4" transform="translate(174 106) rotate(14)" d="M0 0C-10 -2 -11 -18 -6 -27L-2 -19L0 -29L2 -19L6 -27C11 -18 10 -2 0 0Z"/>
            <g class="f2" transform="translate(206 114)">
            <ellipse rx="3.6" ry="8" cy="-8.5" transform="rotate(0)"/>
            <ellipse rx="3.6" ry="8" cy="-8.5" transform="rotate(45)"/>
            <ellipse rx="3.6" ry="8" cy="-8.5" transform="rotate(90)"/>
            <ellipse rx="3.6" ry="8" cy="-8.5" transform="rotate(135)"/>
            <ellipse rx="3.6" ry="8" cy="-8.5" transform="rotate(180)"/>
            <ellipse rx="3.6" ry="8" cy="-8.5" transform="rotate(225)"/>
            <ellipse rx="3.6" ry="8" cy="-8.5" transform="rotate(270)"/>
            <ellipse rx="3.6" ry="8" cy="-8.5" transform="rotate(315)"/>
            </g>
            <circle class="fc" cx="206" cy="114" r="4.5"/>
            <g class="f2" transform="translate(226 100)">
            <ellipse rx="3.1" ry="6.8" cy="-7.2" transform="rotate(0)"/>
            <ellipse rx="3.1" ry="6.8" cy="-7.2" transform="rotate(45)"/>
            <ellipse rx="3.1" ry="6.8" cy="-7.2" transform="rotate(90)"/>
            <ellipse rx="3.1" ry="6.8" cy="-7.2" transform="rotate(135)"/>
            <ellipse rx="3.1" ry="6.8" cy="-7.2" transform="rotate(180)"/>
            <ellipse rx="3.1" ry="6.8" cy="-7.2" transform="rotate(225)"/>
            <ellipse rx="3.1" ry="6.8" cy="-7.2" transform="rotate(270)"/>
            <ellipse rx="3.1" ry="6.8" cy="-7.2" transform="rotate(315)"/>
            </g>
            <circle class="fc" cx="226" cy="100" r="3.8"/>
            </svg>
            <div class="shape bl-floor">
            </div>
            <svg class="shape bl-fly opt" viewBox="0 0 40 30">
            <g class="wg">
            <path class="w1" d="M20 15C14 2 2 2 3 11C4 18 14 19 20 15Z"/>
            <path class="w1" d="M20 15C26 2 38 2 37 11C36 18 26 19 20 15Z"/>
            <path class="w2" d="M20 16C13 18 6 24 10 28C14 30 19 24 20 16Z"/>
            <path class="w2" d="M20 16C27 18 34 24 30 28C26 30 21 24 20 16Z"/>
            </g>
            <path class="bd" d="M20 10V24"/>
            </svg>
        `,

        // ★ FOREST — "Canopy Window (upgraded)"
        forest: `

            <div class="shape forest-glow"></div>
            <div class="shape forest-ridge r1"></div>
            <div class="shape forest-ridge r2"></div>
            <div class="shape forest-mist"></div>
            <div class="shape forest-ridge r3"></div>
            <div class="shape forest-rays"></div>
            <div class="shape forest-canopy c2"></div>
            <div class="shape forest-canopy c1"></div>
            <svg class="shape forest-vines opt" viewBox="0 0 200 260"><path class="v" d="M34 0C22 62 48 108 30 176M96 0C84 52 108 96 92 140M160 0C150 70 172 120 156 200"/><g class="lv"><ellipse cx="28" cy="50" rx="11" ry="5" transform="rotate(-30 28 50)"/><ellipse cx="40" cy="98" rx="11" ry="5" transform="rotate(25 40 98)"/><ellipse cx="32" cy="150" rx="11" ry="5" transform="rotate(-20 32 150)"/><ellipse cx="92" cy="44" rx="11" ry="5" transform="rotate(30 92 44)"/><ellipse cx="100" cy="100" rx="11" ry="5" transform="rotate(-25 100 100)"/><ellipse cx="94" cy="128" rx="11" ry="5" transform="rotate(20 94 128)"/><ellipse cx="154" cy="60" rx="11" ry="5" transform="rotate(-30 154 60)"/><ellipse cx="166" cy="112" rx="11" ry="5" transform="rotate(28 166 112)"/><ellipse cx="158" cy="170" rx="11" ry="5" transform="rotate(-18 158 170)"/><ellipse cx="162" cy="196" rx="11" ry="5" transform="rotate(22 162 196)"/></g></svg>
            <div class="shape forest-trunk t3"></div>
            <div class="shape forest-trunk t1"></div>
            <div class="shape forest-trunk t2"></div>
            <div class="shape forest-ferns"></div>
            <svg class="shape forest-shroom" viewBox="0 0 140 90"><g class="st"><rect x="28" y="50" width="9" height="36" rx="3"/><rect x="74" y="42" width="11" height="44" rx="3"/><rect x="108" y="62" width="7" height="24" rx="3"/></g><g class="cp"><path d="M8 54Q8 28 32 28Q56 28 56 54Z"/><path d="M52 46Q52 16 80 16Q108 16 108 46Z"/><path d="M96 66Q96 48 112 48Q128 48 128 66Z"/></g><g class="sp"><circle cx="22" cy="42" r="3"/><circle cx="38" cy="38" r="2.4"/><circle cx="68" cy="30" r="3.4"/><circle cx="90" cy="26" r="2.6"/><circle cx="108" cy="58" r="2"/></g></svg>
            <div class="shape forest-firefly"></div>
            <div class="shape forest-firefly f2"></div>
            <div class="shape forest-firefly f3 opt"></div>
        `,

        // ★ SUNSHINE — "Golden Hour" (sunburst + halo + hills; flare = ::before, dust = ::after)
        sunshine: `
            <div class="shape sn-rays"></div>
            <div class="shape sn-halo"></div>
            <div class="shape sn-sun"></div>
            <div class="shape sn-hills"></div>
        `,

        // ★ STARRY — "Campsite"
        starry: `
            <div class="shape st-milky"></div>
            <div class="shape st-stars"></div>
            <div class="shape st-stars t"></div>
            <div class="shape st-shoot"></div>
            <div class="shape st-mtn m1"></div>
            <div class="shape st-mtn m2"></div>
            <div class="shape st-ground"></div>
            <svg class="shape st-pine p1" viewBox="0 0 120 160"><path d="M60 4L86 50H72L98 96H78L110 148H10L42 96H22L48 50H34Z"/></svg>
            <svg class="shape st-pine p2" viewBox="0 0 120 160"><path d="M60 4L86 50H72L98 96H78L110 148H10L42 96H22L48 50H34Z"/></svg>
            <svg class="shape st-pine p3 opt" viewBox="0 0 120 160"><path d="M60 4L86 50H72L98 96H78L110 148H10L42 96H22L48 50H34Z"/></svg>
            <svg class="shape st-pine p4" viewBox="0 0 120 160"><path d="M60 4L86 50H72L98 96H78L110 148H10L42 96H22L48 50H34Z"/></svg>
            <svg class="shape st-tent" viewBox="0 0 160 100"><path class="t" d="M80 6L156 96H4Z"/><path class="s" d="M80 6L156 96H112Z"/><path class="d" d="M80 38L106 96H54Z"/></svg>
            <div class="shape st-fire"></div>
            <svg class="shape st-flame" viewBox="0 0 30 40"><path class="f1" d="M15 2C22 14 28 20 26 30C24 38 6 38 4 30C2 22 10 18 15 2Z"/><path class="f2" d="M15 18C19 24 22 28 20 33C18 37 12 37 10 33C8 28 13 26 15 18Z"/></svg>
        `,

        // ★ CAFE — "Cozy Corner" (lamps, string lights, shelf, counter, latte, sleeping cat; light spill = ::before)
        cafe: `
            <div class="shape cf-panel"></div>
            <div class="shape cf-lights"></div>
            <svg class="shape cf-shelf opt" viewBox="0 0 240 150"><rect class="w" x="0" y="116" width="240" height="12" rx="3"/><path class="w" d="M20 128V146L44 128ZM196 128V146L220 128Z"/><rect x="14" y="52" width="17" height="64" rx="2" fill="#b5543c"/><rect x="33" y="64" width="14" height="52" rx="2" fill="#5f7f6a"/><rect x="49" y="46" width="18" height="70" rx="2" fill="#d9a441"/><rect x="69" y="60" width="13" height="56" rx="2" fill="#7a5a8c"/><rect x="86" y="56" width="13" height="60" rx="2" fill="#c97c5d" transform="rotate(-14 98 116)"/><path d="M152 116L188 116L182 88L158 88Z" fill="#c9784f"/><g fill="#5f9a5a"><ellipse cx="170" cy="62" rx="7" ry="24" transform="rotate(-24 170 88)"/><ellipse cx="170" cy="60" rx="7" ry="26"/><ellipse cx="170" cy="62" rx="7" ry="24" transform="rotate(26 170 88)"/><ellipse cx="170" cy="70" rx="6" ry="18" transform="rotate(52 170 88)" fill="#74b06b"/></g><rect x="204" y="98" width="22" height="18" rx="4" fill="#f3e9db"/><path d="M226 103H232C238 103 238 113 230 113H226" fill="none" stroke="#f3e9db" stroke-width="3"/></svg>
            <div class="shape cf-lamp l1"></div>
            <div class="shape cf-lamp l2 opt"></div>
            <div class="shape cf-lamp l3"></div>
            <div class="shape cf-counter"></div>
            <svg class="shape cf-cat" viewBox="0 0 250 120"><path class="cu" d="M8 98C8 84 32 80 125 80C218 80 242 84 242 98C242 112 218 118 125 118C32 118 8 112 8 98Z"/><circle class="cu2" cx="125" cy="99" r="3"/><g class="b"><path class="tl" d="M208 90C238 88 240 62 214 56"/><path class="c" d="M34 90C34 56 82 40 134 46C188 52 220 70 214 90C206 96 64 98 34 90Z"/><path class="s" d="M104 47Q110 62 102 78M130 46Q136 62 128 80M156 49Q162 64 154 80M182 56Q186 68 180 82"/><path class="c" d="M44 56L42 32L62 48ZM72 48L88 32L84 58Z"/><circle class="c" cx="62" cy="72" r="24"/><ellipse class="c" cx="48" cy="92" rx="13" ry="7"/><ellipse class="c" cx="74" cy="94" rx="11" ry="6"/><path class="e" d="M50 72Q55 77 60 72M66 72Q71 77 76 72"/><path d="M60 80L65 80L62.5 83Z" fill="#d98a8a"/></g></svg>
            <svg class="shape cf-mug" viewBox="0 0 230 130"><ellipse cx="52" cy="119" rx="48" ry="8" fill="#f3e9db"/><path d="M18 112C20 88 46 80 62 84C80 88 90 100 88 112C78 106 70 102 60 102C46 102 30 106 18 112Z" fill="#d79a4b"/><path d="M34 100L38 108M48 96L50 106M62 98L62 106M74 102L72 108" stroke="#a8692a" stroke-width="2" stroke-linecap="round" fill="none"/><ellipse cx="150" cy="120" rx="62" ry="9" fill="#f3e9db"/><path class="m" d="M104 52H196V88C196 108 182 118 150 118C118 118 104 108 104 88Z"/><path class="h" d="M196 62H208C226 62 226 98 204 98H196"/><ellipse class="c" cx="150" cy="52" rx="46" ry="9"/><path d="M140 52C140 47 148 47 150 51C152 47 160 47 160 52C160 56 150 60 150 60C150 60 140 56 140 52Z" fill="#f4e2c4" fill-opacity=".85"/><path d="M114 62V88" stroke="#fff" stroke-opacity=".5" stroke-width="4" stroke-linecap="round"/></svg>
            <div class="shape cf-steam"></div>
        `,

        // ★ CRIMSON — "Rose Park" (rose arbour, flowering hedge, rose bushes, blossom trees, lamp posts, bench, stone path; petals = ::after)
        crimson: `
            <svg class="shape" width="0" height="0" style="position:absolute"><defs><g id="rpRa" class="rr-a"><circle class="o" r="10"/><circle class="m" r="7"/><circle class="o" r="4.2"/><path class="v" d="M-3.5 .5Q-2 -4 2.5 -2.2Q4.5 1.5 0 3Q-3.5 3 -2.5 -.5"/></g><g id="rpRb" class="rr-b"><circle class="o" r="10"/><circle class="m" r="7"/><circle class="o" r="4.2"/><path class="v" d="M-3.5 .5Q-2 -4 2.5 -2.2Q4.5 1.5 0 3Q-3.5 3 -2.5 -.5"/></g><g id="rpRc" class="rr-c"><circle class="o" r="10"/><circle class="m" r="7"/><circle class="o" r="4.2"/><path class="v" d="M-3.5 .5Q-2 -4 2.5 -2.2Q4.5 1.5 0 3Q-3.5 3 -2.5 -.5"/></g><path id="rpL" d="M0 0C4 -6 12 -6 16 0C12 6 4 6 0 0Z"/></defs></svg>
            <div class="shape rp-sun"></div>
            <div class="shape rp-hill h1"></div>
            <div class="shape rp-hill h2"></div>
            <svg class="shape rp-tree t2" viewBox="0 0 120 170"><rect class="tk" x="54" y="96" width="12" height="74" rx="3"/><circle class="cn" cx="60" cy="58" r="44"/><circle class="cn" cx="32" cy="84" r="30"/><circle class="cn" cx="88" cy="84" r="30"/><circle class="cs" cx="70" cy="92" r="28"/><circle class="bl" cx="45" cy="50" r="3.6"/><circle class="bl" cx="78" cy="66" r="3.6"/><circle class="bl" cx="60" cy="84" r="3.6"/><circle class="bl" cx="34" cy="88" r="3.6"/><circle class="bl" cx="90" cy="92" r="3.6"/><circle class="bl" cx="70" cy="40" r="3.6"/></svg>
            <svg class="shape rp-tree t1 opt" viewBox="0 0 120 170"><rect class="tk" x="54" y="96" width="12" height="74" rx="3"/><circle class="cn" cx="60" cy="58" r="44"/><circle class="cn" cx="32" cy="84" r="30"/><circle class="cn" cx="88" cy="84" r="30"/><circle class="cs" cx="70" cy="92" r="28"/><circle class="bl" cx="40" cy="46" r="3.6"/><circle class="bl" cx="82" cy="58" r="3.6"/><circle class="bl" cx="58" cy="80" r="3.6"/><circle class="bl" cx="30" cy="84" r="3.6"/><circle class="bl" cx="92" cy="90" r="3.6"/></svg>
            <div class="shape rp-hedge"></div>
            <div class="shape rp-ground"></div>
            <div class="shape rp-path"></div>
            <svg class="shape rp-lamp l2 opt" viewBox="0 0 60 260"><circle class="gw a" cx="30" cy="38" r="66"/><circle class="gw b" cx="30" cy="38" r="42"/><circle class="gw c" cx="30" cy="38" r="24"/><path class="ir" d="M30 2L17 16H43Z"/><path class="gl" d="M19 18H41L44 54H16Z"/><path class="ir2" d="M19 18L16 54M41 18L44 54M30 18V54"/><path class="ir" d="M14 54H46L42 62H18Z"/><rect class="ir" x="28.5" y="62" width="3" height="186"/><circle class="ir" cx="30" cy="68" r="3.4"/><path class="ir" d="M20 248H40L44 258H16Z"/></svg>
            <svg class="shape rp-lamp l1" viewBox="0 0 60 260"><circle class="gw a" cx="30" cy="38" r="66"/><circle class="gw b" cx="30" cy="38" r="42"/><circle class="gw c" cx="30" cy="38" r="24"/><path class="ir" d="M30 2L17 16H43Z"/><path class="gl" d="M19 18H41L44 54H16Z"/><path class="ir2" d="M19 18L16 54M41 18L44 54M30 18V54"/><path class="ir" d="M14 54H46L42 62H18Z"/><rect class="ir" x="28.5" y="62" width="3" height="186"/><circle class="ir" cx="30" cy="68" r="3.4"/><path class="ir" d="M20 248H40L44 258H16Z"/></svg>
            <svg class="shape rp-arb" viewBox="0 0 200 300"><rect class="pt" x="10" y="92" width="12" height="208" rx="2"/><rect class="pt" x="178" y="92" width="12" height="208" rx="2"/><path class="ar" d="M16 100C16 24 184 24 184 100"/><use href="#rpL" class="rp-lf" transform="translate(14 118) rotate(-70) scale(1)"/><use href="#rpL" class="rp-lf" transform="translate(22 150) rotate(20) scale(1)"/><use href="#rpL" class="rp-lf" transform="translate(12 176) rotate(-100) scale(1)"/><use href="#rpL" class="rp-lf" transform="translate(22 206) rotate(30) scale(1)"/><use href="#rpL" class="rp-lf" transform="translate(14 240) rotate(-80) scale(1)"/><use href="#rpL" class="rp-lf" transform="translate(30 78) rotate(-80) scale(1)"/><use href="#rpL" class="rp-lf" transform="translate(52 52) rotate(-50) scale(1)"/><use href="#rpL" class="rp-lf" transform="translate(86 36) rotate(-20) scale(1)"/><use href="#rpL" class="rp-lf" transform="translate(114 34) rotate(20) scale(1)"/><use href="#rpL" class="rp-lf" transform="translate(148 44) rotate(45) scale(1)"/><use href="#rpL" class="rp-lf" transform="translate(170 64) rotate(75) scale(1)"/><use href="#rpL" class="rp-lf" transform="translate(186 120) rotate(-110) scale(1)"/><use href="#rpL" class="rp-lf" transform="translate(178 160) rotate(-150) scale(1)"/><use href="#rpL" class="rp-lf" transform="translate(188 196) rotate(-80) scale(1)"/><use href="#rpL" class="rp-lf" transform="translate(176 230) rotate(-30) scale(1)"/><use href="#rpL" class="rp-lf" transform="translate(186 262) rotate(-100) scale(1)"/><use href="#rpRa" transform="translate(17 132) scale(1.1)"/><use href="#rpRb" transform="translate(19 196) scale(1)"/><use href="#rpRc" transform="translate(15 252) scale(0.95)"/><use href="#rpRb" transform="translate(34 70) scale(1)"/><use href="#rpRa" transform="translate(66 44) scale(1.15)"/><use href="#rpRc" transform="translate(100 32) scale(1.2)"/><use href="#rpRa" transform="translate(134 42) scale(1.1)"/><use href="#rpRb" transform="translate(166 66) scale(1)"/><use href="#rpRc" transform="translate(183 128) scale(1)"/><use href="#rpRa" transform="translate(181 190) scale(1.15)"/><use href="#rpRb" transform="translate(186 250) scale(1)"/></svg>
            <svg class="shape rp-bench opt" viewBox="0 0 200 110"><rect class="bw" x="12" y="10" width="176" height="9" rx="3"/><rect class="bw" x="12" y="24" width="176" height="9" rx="3"/><rect class="bw" x="12" y="38" width="176" height="9" rx="3"/><rect class="bw2" x="6" y="58" width="188" height="9" rx="3"/><rect class="bw2" x="6" y="70" width="188" height="9" rx="3"/><path class="bi" d="M22 8V104M178 8V104M22 56Q6 56 6 44"/></svg>
            <svg class="shape rp-bush b3 opt" viewBox="0 0 220 140"><circle class="bs" cx="48" cy="102" r="40"/><circle class="bs" cx="110" cy="84" r="50"/><circle class="bs" cx="172" cy="102" r="40"/><circle class="bs" cx="78" cy="120" r="30"/><circle class="bs" cx="142" cy="120" r="30"/><circle class="bs" cx="110" cy="118" r="36"/><ellipse class="bs2" cx="110" cy="134" rx="104" ry="12"/><use href="#rpL" class="rp-lf" transform="translate(18 96) rotate(-150) scale(1.1)"/><use href="#rpL" class="rp-lf" transform="translate(202 98) rotate(-30) scale(1.1)"/><use href="#rpRc" transform="translate(44 90) scale(1.1)"/><use href="#rpRa" transform="translate(82 60) scale(1.2)"/><use href="#rpRb" transform="translate(118 74) scale(1.2)"/><use href="#rpRb" transform="translate(150 56) scale(1.1)"/><use href="#rpRa" transform="translate(176 88) scale(1.1)"/><use href="#rpRb" transform="translate(64 112) scale(0.95)"/><use href="#rpRc" transform="translate(130 108) scale(1)"/><use href="#rpRa" transform="translate(102 40) scale(0.9)"/><use href="#rpRc" transform="translate(156 112) scale(0.95)"/></svg>
            <svg class="shape rp-bush b1" viewBox="0 0 220 140"><circle class="bs" cx="48" cy="102" r="40"/><circle class="bs" cx="110" cy="84" r="50"/><circle class="bs" cx="172" cy="102" r="40"/><circle class="bs" cx="78" cy="120" r="30"/><circle class="bs" cx="142" cy="120" r="30"/><circle class="bs" cx="110" cy="118" r="36"/><ellipse class="bs2" cx="110" cy="134" rx="104" ry="12"/><use href="#rpL" class="rp-lf" transform="translate(18 96) rotate(-150) scale(1.1)"/><use href="#rpL" class="rp-lf" transform="translate(202 98) rotate(-30) scale(1.1)"/><use href="#rpRa" transform="translate(40 88) scale(1.1)"/><use href="#rpRb" transform="translate(80 62) scale(1.2)"/><use href="#rpRa" transform="translate(114 76) scale(1.25)"/><use href="#rpRc" transform="translate(146 54) scale(1.1)"/><use href="#rpRb" transform="translate(178 86) scale(1.1)"/><use href="#rpRc" transform="translate(62 110) scale(0.95)"/><use href="#rpRb" transform="translate(128 106) scale(1)"/><use href="#rpRc" transform="translate(100 42) scale(0.9)"/><use href="#rpRa" transform="translate(158 112) scale(0.95)"/><use href="#rpRb" transform="translate(22 112) scale(0.8)"/></svg>
            <svg class="shape rp-bush b2" viewBox="0 0 220 140"><circle class="bs" cx="48" cy="102" r="40"/><circle class="bs" cx="110" cy="84" r="50"/><circle class="bs" cx="172" cy="102" r="40"/><circle class="bs" cx="78" cy="120" r="30"/><circle class="bs" cx="142" cy="120" r="30"/><circle class="bs" cx="110" cy="118" r="36"/><ellipse class="bs2" cx="110" cy="134" rx="104" ry="12"/><use href="#rpL" class="rp-lf" transform="translate(18 96) rotate(-150) scale(1.1)"/><use href="#rpL" class="rp-lf" transform="translate(202 98) rotate(-30) scale(1.1)"/><use href="#rpRb" transform="translate(36 92) scale(1.1)"/><use href="#rpRa" transform="translate(76 66) scale(1.2)"/><use href="#rpRc" transform="translate(112 80) scale(1.2)"/><use href="#rpRa" transform="translate(148 58) scale(1.1)"/><use href="#rpRc" transform="translate(180 90) scale(1.05)"/><use href="#rpRa" transform="translate(58 112) scale(0.95)"/><use href="#rpRa" transform="translate(130 108) scale(1)"/><use href="#rpRb" transform="translate(98 44) scale(0.9)"/><use href="#rpRb" transform="translate(160 114) scale(0.95)"/><use href="#rpRa" transform="translate(200 112) scale(0.8)"/></svg>
        `,

        // ★ MAROON — "Wine Bar" (brick wall, back-bar shelves of wine + a few spirits, pendant lamps, neon wine glass, wooden counter, stools; dust = ::after)
        maroon: `
            <svg class="shape" width="0" height="0" style="position:absolute"><defs><g id="wbW"><path d="M-6 0V-31Q-6 -37 -2.3 -41V-53H2.3V-41Q6 -37 6 -31V0Z"/><rect class="wb-cap" x="-2.6" y="-55" width="5.2" height="9" rx="1"/><rect class="wb-lb" x="-6" y="-24" width="12" height="13"/><path class="wb-hl" d="M-4 -30V-4H-2.4V-30Z"/></g><g id="wbC"><path d="M-7 0V-26Q-7 -33 -3 -38V-52H3V-38Q7 -33 7 -26V0Z"/><rect class="wb-gold" x="-3.4" y="-53" width="6.8" height="15" rx="1"/><rect class="wb-lb" x="-7" y="-20" width="14" height="12"/><path class="wb-hl" d="M-5 -26V-3H-3.4V-26Z"/></g><g id="wbS"><path d="M-8 0V-27Q-8 -30 -5 -31V-36H5V-31Q8 -30 8 -27V0Z"/><rect class="wb-cork" x="-3.6" y="-41" width="7.2" height="6" rx="1"/><rect class="wb-lb" x="-8" y="-22" width="16" height="14"/><path class="wb-hl" d="M-6 -26V-3H-4.4V-26Z"/></g><g id="wbT"><path d="M-5 0V-34Q-5 -40 -2.4 -43V-56H2.4V-43Q5 -40 5 -34V0Z"/><rect class="wb-cork" x="-2.8" y="-60" width="5.6" height="5" rx="1"/><rect class="wb-lb" x="-5" y="-28" width="10" height="16"/><path class="wb-hl" d="M-3.6 -33V-3H-2.2V-33Z"/></g><g id="wbR"><path d="M-9 0V-20Q-9 -29 -3.4 -32V-44H3.4V-32Q9 -29 9 -20V0Z"/><rect class="wb-cork" x="-3.2" y="-48" width="6.4" height="5" rx="1"/><rect class="wb-lb" x="-9" y="-18" width="18" height="12"/><path class="wb-hl" d="M-7 -20V-3H-5.4V-20Z"/></g><g id="wbG"><path class="wb-gs" d="M-8 0H8M0 0V-10"/><path class="wb-gb" d="M-13 -46H13C13 -24 8 -10 0 -10S-13 -24 -13 -46Z"/><path class="wb-liq" d="M-11.6 -32H11.6C10.8 -20 7 -12.6 0 -12.6S-10.8 -20 -11.6 -32Z"/></g><g id="wbD"><path class="wb-gb" d="M-10 0H10L12 -26H-12Z"/><path class="wb-liq" d="M-10.4 -3H10.4L11.2 -15H-11.2Z"/><rect class="wb-cube" x="-6" y="-19" width="7" height="7" rx="1.4" transform="rotate(-12 -3 -15)"/></g></defs></svg>
            <div class="shape wb-wall"></div>
            <svg class="shape wb-shelf l" viewBox="0 0 300 230"><rect class="sp" x="6" y="0" width="288" height="220"/><rect class="sl" x="6" y="65" width="288" height="3"/><rect class="sl" x="6" y="135" width="288" height="3"/><rect class="sl" x="6" y="205" width="288" height="3"/><use href="#wbW" class="bw1" transform="translate(25 70)"/><use href="#wbW" class="bw2" transform="translate(50 70)"/><use href="#wbW" class="bw3" transform="translate(75 70)"/><use href="#wbW" class="bw1" transform="translate(100 70)"/><use href="#wbW" class="bw4" transform="translate(125 70)"/><use href="#wbW" class="bw2" transform="translate(150 70)"/><use href="#wbW" class="bw1" transform="translate(175 70)"/><use href="#wbW" class="bw3" transform="translate(200 70)"/><use href="#wbW" class="bw2" transform="translate(225 70)"/><use href="#wbW" class="bw1" transform="translate(250 70)"/><use href="#wbW" class="bw4" transform="translate(275 70)"/><use href="#wbW" class="bw2" transform="translate(25 140)"/><use href="#wbW" class="bw1" transform="translate(50 140)"/><use href="#wbW" class="bw3" transform="translate(75 140)"/><use href="#wbW" class="bw1" transform="translate(100 140)"/><use href="#wbC" class="bw4" transform="translate(125 140)"/><use href="#wbW" class="bw2" transform="translate(150 140)"/><use href="#wbW" class="bw1" transform="translate(175 140)"/><use href="#wbW" class="bw3" transform="translate(200 140)"/><use href="#wbW" class="bw1" transform="translate(225 140)"/><use href="#wbW" class="bw2" transform="translate(250 140)"/><use href="#wbW" class="bw3" transform="translate(275 140)"/><use href="#wbW" class="bw1" transform="translate(25 210)"/><use href="#wbW" class="bw3" transform="translate(50 210)"/><use href="#wbW" class="bw1" transform="translate(75 210)"/><use href="#wbS" class="bs1" transform="translate(100 210)"/><use href="#wbT" class="bs2" transform="translate(125 210)"/><use href="#wbR" class="bs5" transform="translate(150 210)"/><use href="#wbS" class="bs4" transform="translate(175 210)"/><use href="#wbT" class="bs3" transform="translate(200 210)"/><use href="#wbW" class="bw2" transform="translate(225 210)"/><use href="#wbW" class="bw1" transform="translate(250 210)"/><use href="#wbW" class="bw3" transform="translate(275 210)"/><rect class="sb" x="2" y="70" width="296" height="8" rx="2"/><rect class="sh" x="2" y="70" width="296" height="2"/><rect class="sb" x="2" y="140" width="296" height="8" rx="2"/><rect class="sh" x="2" y="140" width="296" height="2"/><rect class="sb" x="2" y="210" width="296" height="8" rx="2"/><rect class="sh" x="2" y="210" width="296" height="2"/><rect class="sf" x="0" y="0" width="7" height="232"/><rect class="sf" x="293" y="0" width="7" height="232"/><rect class="sf" x="0" y="0" width="300" height="6"/></svg>
            <svg class="shape wb-shelf r" viewBox="0 0 300 230"><rect class="sp" x="6" y="0" width="288" height="220"/><rect class="sl" x="6" y="65" width="288" height="3"/><rect class="sl" x="6" y="135" width="288" height="3"/><rect class="sl" x="6" y="205" width="288" height="3"/><use href="#wbT" class="bs2" transform="translate(25 70)"/><use href="#wbS" class="bs1" transform="translate(50 70)"/><use href="#wbR" class="bs5" transform="translate(75 70)"/><use href="#wbT" class="bs3" transform="translate(100 70)"/><use href="#wbS" class="bs4" transform="translate(125 70)"/><use href="#wbR" class="bs6" transform="translate(150 70)"/><use href="#wbS" class="bs1" transform="translate(175 70)"/><use href="#wbW" class="bw1" transform="translate(200 70)"/><use href="#wbW" class="bw2" transform="translate(225 70)"/><use href="#wbW" class="bw3" transform="translate(250 70)"/><use href="#wbW" class="bw1" transform="translate(275 70)"/><use href="#wbW" class="bw1" transform="translate(25 140)"/><use href="#wbW" class="bw3" transform="translate(50 140)"/><use href="#wbW" class="bw2" transform="translate(75 140)"/><use href="#wbW" class="bw4" transform="translate(100 140)"/><use href="#wbW" class="bw1" transform="translate(125 140)"/><use href="#wbC" class="bw4" transform="translate(150 140)"/><use href="#wbW" class="bw2" transform="translate(175 140)"/><use href="#wbW" class="bw1" transform="translate(200 140)"/><use href="#wbW" class="bw3" transform="translate(225 140)"/><use href="#wbW" class="bw1" transform="translate(250 140)"/><use href="#wbW" class="bw2" transform="translate(275 140)"/><use href="#wbW" class="bw2" transform="translate(25 210)"/><use href="#wbW" class="bw1" transform="translate(50 210)"/><use href="#wbW" class="bw3" transform="translate(75 210)"/><use href="#wbW" class="bw1" transform="translate(100 210)"/><use href="#wbW" class="bw4" transform="translate(125 210)"/><use href="#wbW" class="bw1" transform="translate(150 210)"/><use href="#wbW" class="bw2" transform="translate(175 210)"/><use href="#wbW" class="bw3" transform="translate(200 210)"/><use href="#wbW" class="bw1" transform="translate(225 210)"/><use href="#wbW" class="bw2" transform="translate(250 210)"/><use href="#wbW" class="bw1" transform="translate(275 210)"/><rect class="sb" x="2" y="70" width="296" height="8" rx="2"/><rect class="sh" x="2" y="70" width="296" height="2"/><rect class="sb" x="2" y="140" width="296" height="8" rx="2"/><rect class="sh" x="2" y="140" width="296" height="2"/><rect class="sb" x="2" y="210" width="296" height="8" rx="2"/><rect class="sh" x="2" y="210" width="296" height="2"/><rect class="sf" x="0" y="0" width="7" height="232"/><rect class="sf" x="293" y="0" width="7" height="232"/><rect class="sf" x="0" y="0" width="300" height="6"/></svg>
            <svg class="shape wb-neon opt" viewBox="0 0 90 116"><g class="halo"><path d="M20 12H70C70 38 60 54 45 54S20 38 20 12ZM45 54V90M30 94H60M12 106Q45 114 78 106"/></g><g class="tube"><path d="M20 12H70C70 38 60 54 45 54S20 38 20 12Z"/><path d="M45 54V90M30 94H60"/><path d="M24 26Q34 22 45 26T66 26"/><path d="M12 106Q45 114 78 106"/><circle cx="38" cy="38" r="1.6"/><circle cx="50" cy="42" r="1.3"/><circle cx="45" cy="33" r="1.1"/></g></svg>
            <svg class="shape wb-lamp p1" viewBox="0 0 80 130"><circle class="gw a" cx="40" cy="98" r="74"/><circle class="gw b" cx="40" cy="98" r="48"/><circle class="gw c" cx="40" cy="98" r="26"/><path class="cd" d="M40 0V46"/><path class="shd" d="M14 88L27 46H53L66 88Z"/><rect class="rim" x="12" y="86" width="56" height="5" rx="2.5"/><circle class="bu" cx="40" cy="96" r="6"/></svg>
            <svg class="shape wb-lamp p2" viewBox="0 0 80 130"><circle class="gw a" cx="40" cy="98" r="74"/><circle class="gw b" cx="40" cy="98" r="48"/><circle class="gw c" cx="40" cy="98" r="26"/><path class="cd" d="M40 0V46"/><path class="shd" d="M14 88L27 46H53L66 88Z"/><rect class="rim" x="12" y="86" width="56" height="5" rx="2.5"/><circle class="bu" cx="40" cy="96" r="6"/></svg>
            <div class="shape wb-counter"></div>
            <svg class="shape wb-ice opt" viewBox="0 0 120 130"><use href="#wbW" class="bw1" transform="translate(88 76) rotate(13) scale(1.25)"/><use href="#wbC" class="bw4" transform="translate(54 74) scale(1.3)"/><path class="bk" d="M20 66H100L92 124H28Z"/><path class="bk2" d="M20 66H100L99 72H21Z"/><rect class="bk2" x="16" y="62" width="88" height="8" rx="3"/><rect class="ic" x="26" y="56" width="13" height="11" rx="2.4" transform="rotate(-10 32 61)"/><rect class="ic" x="42" y="58" width="12" height="10" rx="2.4" transform="rotate(8 48 63)"/><rect class="ic" x="66" y="57" width="13" height="11" rx="2.4" transform="rotate(-6 72 62)"/><rect class="ic" x="82" y="58" width="12" height="10" rx="2.4" transform="rotate(12 88 63)"/><path class="bhl" d="M34 76L38 116"/></svg>
            <svg class="shape wb-pour" viewBox="0 0 260 110"><use href="#wbW" class="bw1" transform="translate(34 104) scale(1.7)"/><use href="#wbS" class="bs1" transform="translate(78 104) scale(1.7)"/><use href="#wbG" class="gw1" transform="translate(132 104) scale(1.5)"/><use href="#wbG" class="gw2" transform="translate(170 104) scale(1.5)"/><use href="#wbD" class="gw3" transform="translate(220 104) scale(1.5)"/></svg>
            <div class="shape wb-stools"></div>
        `,

        // ★ SAKURA — "Torii at Dawn (upgraded)"
        sakura: `

            <div class="shape sakura-stars opt"></div>
            <div class="shape sakura-sun"></div>
            <div class="shape sakura-mount"></div>
            <div class="shape sakura-mist"></div>
            <div class="shape sakura-water"></div>
            <div class="shape sakura-sunpath"></div>
            <div class="shape sakura-torii-ref"></div>
            <div class="shape sakura-ripples"></div>
            <div class="shape sakura-torii"></div>
            <div class="shape sakura-lantern"><svg viewBox="0 0 60 122"><path class="s" d="M18 122h24v-9H18zM25 113h10V78H25z"/><path class="s" d="M14 78h32V50H14z"/><path class="w" d="M22 58h16v14H22z"/><path class="s" d="M6 50L30 30L54 50z"/><circle class="s" cx="30" cy="25" r="5"/></svg></div>
            <div class="shape sakura-floaters"></div>
            <div class="shape sakura-bough"><i class="sk-wood"></i><i class="sk-bl b1"></i><i class="sk-bl b2"></i><i class="sk-bl b3"></i><i class="sk-bl b4"></i><i class="sk-bl b5"></i><i class="sk-bl b6"></i><i class="sk-bl b7"></i><i class="sk-bl b8"></i></div>
            <div class="shape sakura-petal p1"></div>
            <div class="shape sakura-petal p2"></div>
            <div class="shape sakura-petal p3 opt"></div>
        `,

        // ★ NEBULA — "Orbital System"
        nebula: `
            <div class="shape nb-haze h1"></div>
            <div class="shape nb-haze h2"></div>
            <div class="shape nb-stars"></div>
            <div class="shape nb-sys"><i class="nb-ring r1"></i><i class="nb-ring r2"></i><i class="nb-ring r3"></i><i class="nb-ring r4"></i><i class="nb-sun"></i></div>
        `,

        // ★ EMBER — "Lantern Festival"
        ember: `
            <div class="shape em-dots"></div>
            <div class="shape em-lantern a" style="--x:20%;--d:52s;--dl:-10s"></div>
            <div class="shape em-lantern a" style="--x:62%;--d:64s;--dl:-34s"></div>
            <div class="shape em-lantern a opt" style="--x:84%;--d:58s;--dl:-48s"></div>
            <div class="shape em-water"></div>
            <svg class="shape em-temple" viewBox="0 0 240 232"><path d="M120 40V14"/><circle cx="120" cy="12" r="3"/><path d="M74 76Q94.7 85 120 60Q145.3 85 166 76Q120 92 74 76Z"/><rect x="92" y="78" width="56" height="30"/><path d="M56 126Q84.8 135 120 110Q155.2 135 184 126Q120 142 56 126Z"/><rect x="82" y="128" width="76" height="34"/><path d="M38 182Q74.9 191 120 166Q165.1 191 202 182Q120 198 38 182Z"/><rect x="66" y="184" width="108" height="26"/><rect x="40" y="210" width="160" height="20"/></svg>
        `,

        // ★ AUTUMN — "Birch Grove"
        autumn: `
            <div class="shape bi-sun"></div>
            <div class="shape bi-trunk t5 opt"></div>
            <div class="shape bi-fog"></div>
            <div class="shape bi-trunk t2"></div>
            <div class="shape bi-trunk t4 opt"></div>
            <div class="shape bi-trunk t1"></div>
            <div class="shape bi-trunk t3"></div>
            <div class="shape bi-canopy"></div>
            <div class="shape bi-ground"></div>
            <div class="shape bi-leaf" style="--x:12%;--d:22s;--dl:-4s;--c:var(--bi-l1)"></div>
            <div class="shape bi-leaf" style="--x:46%;--d:28s;--dl:-15s;--c:var(--bi-l2)"></div>
            <div class="shape bi-leaf" style="--x:78%;--d:25s;--dl:-9s;--c:var(--bi-l3)"></div>
            <div class="shape bi-leaf opt" style="--x:30%;--d:31s;--dl:-22s;--c:var(--bi-l2)"></div>
        `,

        // ★ GLACIER — "Alpine Gondola"
        glacier: `
            <div class="shape gl-sun"></div>
            <div class="shape gl-mtn m1"></div>
            <div class="shape gl-mtn m2"></div>
            <div class="shape gl-cable"><i class="gl-gond"><svg viewBox="0 0 40 46"><path class="w" d="M20 0V10"/><rect class="b" x="6" y="10" width="28" height="22" rx="4"/><rect class="g" x="10" y="15" width="8" height="8" rx="1.5"/><rect class="g" x="22" y="15" width="8" height="8" rx="1.5"/></svg></i></div>
            <div class="shape gl-snow"></div>
            <svg class="shape gl-pine p1" viewBox="0 0 120 160"><path d="M60 4L86 50H72L98 96H78L110 148H10L42 96H22L48 50H34Z"/></svg>
            <svg class="shape gl-pine p2" viewBox="0 0 120 160"><path d="M60 4L86 50H72L98 96H78L110 148H10L42 96H22L48 50H34Z"/></svg>
            <svg class="shape gl-pine p3 opt" viewBox="0 0 120 160"><path d="M60 4L86 50H72L98 96H78L110 148H10L42 96H22L48 50H34Z"/></svg>
            <div class="shape gl-flakes"></div>
        `,

        // ★ TROPIC — "Palm Fronds"
        tropic: `
            <svg class="shape" width="0" height="0" style="position:absolute"><defs><g id="tr-fr"><path class="lf" d="M48 5L79 -9L54 6ZM48 5L69 49L54 6ZM63 8L102 -8L69 9ZM63 8L86 63L69 9ZM79 11L124 -5L84 13ZM79 11L103 76L84 13ZM94 15L146 -1L99 17ZM94 15L118 89L99 17ZM109 20L167 5L114 22ZM109 20L132 102L114 22ZM124 26L187 12L129 28ZM124 26L146 114L129 28ZM138 32L206 20L144 35ZM138 32L158 126L144 35ZM153 39L225 29L158 42ZM153 39L170 137L158 42ZM167 46L242 39L172 49ZM167 46L182 147L172 49ZM181 55L258 51L186 58ZM181 55L193 156L186 58ZM195 63L272 62L200 67ZM195 63L204 165L200 67ZM209 73L286 75L214 76ZM209 73L214 174L214 76ZM223 83L298 88L227 87ZM223 83L225 181L227 87ZM236 94L310 101L241 98ZM236 94L236 188L241 98ZM250 105L320 114L254 109ZM250 105L247 195L254 109ZM263 117L329 128L267 121ZM263 117L258 202L267 121ZM276 130L337 142L280 134ZM276 130L270 208L280 134ZM289 143L344 157L293 148ZM289 143L282 214L293 148ZM301 158L351 171L305 162ZM301 158L294 220L305 162ZM314 172L357 185L318 177ZM314 172L307 227L318 177ZM326 188L362 200L330 192ZM326 188L319 233L330 192ZM338 204L367 215L342 209ZM338 204L333 240L342 209ZM350 221L371 230L354 225ZM350 221L346 247L354 225ZM362 238L374 244L365 243ZM362 238L360 253L365 243Z"/><path style="fill:none;stroke:var(--tr-rb);stroke-width:4;stroke-linecap:round" d="M0 0Q215 8 370 250"/></g></defs></svg>
            <div class="shape tr-sun"></div>
            <div class="shape tr-sea"></div>
            <div class="shape tr-wave"></div>
            <svg class="shape tr-frond f2" viewBox="-10 -10 420 330"><use href="#tr-fr"/></svg>
            <svg class="shape tr-frond f1" viewBox="-10 -10 420 330"><use href="#tr-fr"/></svg>
            <svg class="shape tr-frond f3" viewBox="-10 -10 420 330"><use href="#tr-fr"/></svg>
            <svg class="shape tr-hib opt" viewBox="0 0 100 100"><g><ellipse cx="50" cy="22" rx="14" ry="22" transform="rotate(0 50 50)"/><ellipse cx="50" cy="22" rx="14" ry="22" transform="rotate(72 50 50)"/><ellipse cx="50" cy="22" rx="14" ry="22" transform="rotate(144 50 50)"/><ellipse cx="50" cy="22" rx="14" ry="22" transform="rotate(216 50 50)"/><ellipse cx="50" cy="22" rx="14" ry="22" transform="rotate(288 50 50)"/></g><circle cx="50" cy="50" r="7" class="c"/><path class="c" d="M50 50L66 30" stroke-width="3"/></svg>
        `,

        // ★ MOONLIT — "Desert Moon"
        moonlit: `
            <div class="shape mo-stars"></div>
            <div class="shape mo-moon"></div>
            <div class="shape mo-cloud c1"></div>
            <div class="shape mo-cloud c2 opt"></div>
            <div class="shape mo-dune d1"></div>
            <div class="shape mo-dune d2"></div>
            <svg class="shape mo-cac k2 opt" viewBox="0 0 80 160"><path d="M34 160V50Q34 36 40 36Q46 36 46 50V160Z"/><path d="M34 102H20Q12 102 12 92V72Q12 64 18 64Q24 64 24 72V88H34Z"/><path d="M46 86H60Q68 86 68 76V56Q68 48 62 48Q56 48 56 56V72H46Z"/></svg>
            <div class="shape mo-dune d3"></div>
            <svg class="shape mo-cac k1" viewBox="0 0 80 160"><path d="M34 160V50Q34 36 40 36Q46 36 46 50V160Z"/><path d="M34 102H20Q12 102 12 92V72Q12 64 18 64Q24 64 24 72V88H34Z"/><path d="M46 86H60Q68 86 68 76V56Q68 48 62 48Q56 48 56 56V72H46Z"/></svg>
        `,

        // ★ AURORA — "Arctic Cabin (upgraded)"
        aurora: `

            <div class="shape aurora-stars"></div>
            <div class="shape aurora-ribbon a1"></div>
            <div class="shape aurora-ribbon a2"></div>
            <div class="shape aurora-peaks"></div>
            <div class="shape aurora-ridge"></div>
            <div class="shape aurora-ice"></div>
            <div class="shape aurora-reflect"></div>
            <div class="shape aurora-snow s1"></div>
            <div class="shape aurora-snow s2"></div>
            <div class="shape aurora-pines p1"></div>
            <div class="shape aurora-pines p2"></div>
            <div class="shape aurora-cabin"><i class="au-chimney"></i><i class="au-smoke"></i></div>
            <div class="shape aurora-flakes opt"></div>
        `,

        // ★ MATCHA — "Zen Garden"
        matcha: `
            <div class="shape mt-enso"></div>
            <div class="shape mt-sand"></div>
            <div class="shape mt-ripple r1"></div>
            <div class="shape mt-ripple r2"></div>
            <div class="shape mt-rock k1"></div>
            <div class="shape mt-rock k2"></div>
            <div class="shape mt-rock k3 opt"></div>
            <div class="shape mt-bamboo b1"></div>
            <div class="shape mt-bamboo b2"></div>
            <div class="shape mt-bamboo b3 opt"></div>
            <i class="shape mt-leaf a"></i><i class="shape mt-leaf b opt"></i>
        `
    };

    // ================================================================
    // ===== THEMES (palettes) — UNCHANGED =====
    // ================================================================
    window.THEMES = {
        ocean: {
            name: 'Ocean', sub: 'Deep · Calm', emoji: '🌊',
            preview: { primary: '#1089d3', gradient: 'linear-gradient(135deg, #1089d3 0%, #12b1d1 100%)' },
            light: {
                '--theme-primary': '#1089d3', '--theme-accent': '#12b1d1', '--theme-primary-dark': '#0c6ca8',
                '--theme-primary-soft': '#e0f2fe', '--theme-primary-soft-2': '#f0f7ff',
                '--theme-bg': '#ffffff', '--theme-bg-soft': '#f8faff', '--theme-card': '#ffffff',
                '--theme-text': '#1a1a2e', '--theme-text-muted': '#555', '--theme-text-dim': '#888', '--theme-text-faint': '#aaa',
                '--theme-border': '#eef2f7', '--theme-border-soft': '#f0f4ff', '--theme-border-input': '#e0e7ff',
                '--theme-gradient': 'linear-gradient(45deg, #1089d3 0%, #12b1d1 100%)',
                '--theme-shadow': 'rgba(133, 189, 215, 0.15)', '--theme-shadow-soft': '#cff0ff',
                '--theme-nav-bg': 'rgba(255, 255, 255, 0.98)'
            },
            dark: {
                '--theme-primary': '#4dabf7', '--theme-accent': '#5ac8fa', '--theme-primary-dark': '#339af0',
                '--theme-primary-soft': '#1a2b3d', '--theme-primary-soft-2': '#0f1a26',
                '--theme-bg': '#0a1118', '--theme-bg-soft': '#131b24', '--theme-card': '#131b24',
                '--theme-text': '#e6f0f9', '--theme-text-muted': '#a0b3c5', '--theme-text-dim': '#7a8fa3', '--theme-text-faint': '#5a6b7d',
                '--theme-border': '#1f2a37', '--theme-border-soft': '#16202b', '--theme-border-input': '#1f2a37',
                '--theme-gradient': 'linear-gradient(45deg, #4dabf7 0%, #5ac8fa 100%)',
                '--theme-shadow': 'rgba(77, 171, 247, 0.2)', '--theme-shadow-soft': 'rgba(77, 171, 247, 0.15)',
                '--theme-nav-bg': 'rgba(10, 17, 24, 0.98)'
            }
        },
        sunset: {
            name: 'Sunset', sub: 'Savanna · Warm', emoji: '🌅',
            preview: { primary: '#f5576c', gradient: 'linear-gradient(135deg, #f5576c 0%, #f093fb 100%)' },
            light: {
                '--theme-primary': '#f5576c', '--theme-accent': '#f093fb', '--theme-primary-dark': '#c73a52',
                '--theme-primary-soft': '#ffe4e6', '--theme-primary-soft-2': '#fff1f2',
                '--theme-bg': '#ffffff', '--theme-bg-soft': '#fff8f9', '--theme-card': '#ffffff',
                '--theme-text': '#3a1418', '--theme-text-muted': '#6b3038', '--theme-text-dim': '#8a5560', '--theme-text-faint': '#b08890',
                '--theme-border': '#fdeef0', '--theme-border-soft': '#fef5f6', '--theme-border-input': '#fde0e3',
                '--theme-gradient': 'linear-gradient(45deg, #f5576c 0%, #f093fb 100%)',
                '--theme-shadow': 'rgba(245, 87, 108, 0.15)', '--theme-shadow-soft': 'rgba(245, 87, 108, 0.2)',
                '--theme-nav-bg': 'rgba(255, 255, 255, 0.98)'
            },
            dark: {
                '--theme-primary': '#ff6b7e', '--theme-accent': '#ff9db0', '--theme-primary-dark': '#e04458',
                '--theme-primary-soft': '#3d1f26', '--theme-primary-soft-2': '#1e0f13',
                '--theme-bg': '#1a0e11', '--theme-bg-soft': '#241318', '--theme-card': '#241318',
                '--theme-text': '#fbe5e8', '--theme-text-muted': '#c9a0a7', '--theme-text-dim': '#a57a82', '--theme-text-faint': '#7d5a61',
                '--theme-border': '#3a1f26', '--theme-border-soft': '#2a151b', '--theme-border-input': '#3a1f26',
                '--theme-gradient': 'linear-gradient(45deg, #ff6b7e 0%, #ff9db0 100%)',
                '--theme-shadow': 'rgba(255, 107, 126, 0.25)', '--theme-shadow-soft': 'rgba(255, 107, 126, 0.18)',
                '--theme-nav-bg': 'rgba(26, 14, 17, 0.98)'
            }
        },
        pink: {
            name: 'Blossom', sub: 'Conservatory · Dreamy', emoji: '🌸',
            preview: { primary: '#ec4899', gradient: 'linear-gradient(135deg, #ec4899 0%, #f9a8d4 100%)' },
            light: {
                '--theme-primary': '#ec4899', '--theme-accent': '#f9a8d4', '--theme-primary-dark': '#be185d',
                '--theme-primary-soft': '#fce7f3', '--theme-primary-soft-2': '#fdf2f8',
                '--theme-bg': '#ffffff', '--theme-bg-soft': '#fff7fb', '--theme-card': '#ffffff',
                '--theme-text': '#2e1a26', '--theme-text-muted': '#6b4a5c', '--theme-text-dim': '#9c7a8c', '--theme-text-faint': '#c4a5b4',
                '--theme-border': '#fde8f1', '--theme-border-soft': '#fef3f9', '--theme-border-input': '#fbd5e5',
                '--theme-gradient': 'linear-gradient(45deg, #ec4899 0%, #f9a8d4 100%)',
                '--theme-shadow': 'rgba(236, 72, 153, 0.15)', '--theme-shadow-soft': 'rgba(236, 72, 153, 0.2)',
                '--theme-nav-bg': 'rgba(255, 255, 255, 0.98)'
            },
            dark: {
                '--theme-primary': '#f472b6', '--theme-accent': '#fbcfe8', '--theme-primary-dark': '#db2777',
                '--theme-primary-soft': '#3d1f30', '--theme-primary-soft-2': '#1e0f1a',
                '--theme-bg': '#1a0e16', '--theme-bg-soft': '#241320', '--theme-card': '#241320',
                '--theme-text': '#fbe5f0', '--theme-text-muted': '#c9a0b8', '--theme-text-dim': '#a57a95', '--theme-text-faint': '#7d5a70',
                '--theme-border': '#3a1f30', '--theme-border-soft': '#2a1522', '--theme-border-input': '#3a1f30',
                '--theme-gradient': 'linear-gradient(45deg, #f472b6 0%, #fbcfe8 100%)',
                '--theme-shadow': 'rgba(244, 114, 182, 0.25)', '--theme-shadow-soft': 'rgba(244, 114, 182, 0.18)',
                '--theme-nav-bg': 'rgba(26, 14, 22, 0.98)'
            }
        },
        forest: {
            name: 'Forest', sub: 'Misty · Canopy', emoji: '🌲',
            preview: { primary: '#16a34a', gradient: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)' },
            light: {
                '--theme-primary': '#16a34a', '--theme-accent': '#22c55e', '--theme-primary-dark': '#15803d',
                '--theme-primary-soft': '#dcfce7', '--theme-primary-soft-2': '#f0fdf4',
                '--theme-bg': '#ffffff', '--theme-bg-soft': '#f8fdf9', '--theme-card': '#ffffff',
                '--theme-text': '#0a2418', '--theme-text-muted': '#2a5040', '--theme-text-dim': '#4a7a60', '--theme-text-faint': '#7aa890',
                '--theme-border': '#e8f5ec', '--theme-border-soft': '#f0f9f2', '--theme-border-input': '#d1e7d8',
                '--theme-gradient': 'linear-gradient(45deg, #16a34a 0%, #22c55e 100%)',
                '--theme-shadow': 'rgba(22, 163, 74, 0.15)', '--theme-shadow-soft': 'rgba(22, 163, 74, 0.2)',
                '--theme-nav-bg': 'rgba(255, 255, 255, 0.98)'
            },
            dark: {
                '--theme-primary': '#4ade80', '--theme-accent': '#86efac', '--theme-primary-dark': '#22c55e',
                '--theme-primary-soft': '#14281a', '--theme-primary-soft-2': '#0a1810',
                '--theme-bg': '#08140d', '--theme-bg-soft': '#0f1e15', '--theme-card': '#0f1e15',
                '--theme-text': '#e0f2e6', '--theme-text-muted': '#a0c4ad', '--theme-text-dim': '#7a9c86', '--theme-text-faint': '#5a7c66',
                '--theme-border': '#1c3524', '--theme-border-soft': '#122319', '--theme-border-input': '#1c3524',
                '--theme-gradient': 'linear-gradient(45deg, #4ade80 0%, #86efac 100%)',
                '--theme-shadow': 'rgba(74, 222, 128, 0.25)', '--theme-shadow-soft': 'rgba(74, 222, 128, 0.18)',
                '--theme-nav-bg': 'rgba(8, 20, 13, 0.98)'
            }
        },
        sunshine: {
            name: 'Sunshine', sub: 'Golden · Cheery', emoji: '☀️',
            preview: { primary: '#f59e0b', gradient: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)' },
            light: {
                '--theme-primary': '#f59e0b', '--theme-accent': '#fbbf24', '--theme-primary-dark': '#d97706',
                '--theme-primary-soft': '#fef3c7', '--theme-primary-soft-2': '#fffbeb',
                '--theme-bg': '#ffffff', '--theme-bg-soft': '#fffdf5', '--theme-card': '#ffffff',
                '--theme-text': '#2e2410', '--theme-text-muted': '#6b5a30', '--theme-text-dim': '#9c8a5c', '--theme-text-faint': '#c4b588',
                '--theme-border': '#fdf3dc', '--theme-border-soft': '#fef9ec', '--theme-border-input': '#fce8b3',
                '--theme-gradient': 'linear-gradient(45deg, #f59e0b 0%, #fbbf24 100%)',
                '--theme-shadow': 'rgba(245, 158, 11, 0.15)', '--theme-shadow-soft': 'rgba(245, 158, 11, 0.2)',
                '--theme-nav-bg': 'rgba(255, 255, 255, 0.98)'
            },
            dark: {
                '--theme-primary': '#fbbf24', '--theme-accent': '#fcd34d', '--theme-primary-dark': '#f59e0b',
                '--theme-primary-soft': '#3d3018', '--theme-primary-soft-2': '#1f1808',
                '--theme-bg': '#171207', '--theme-bg-soft': '#221a0c', '--theme-card': '#221a0c',
                '--theme-text': '#fbf3d9', '--theme-text-muted': '#c9baa0', '--theme-text-dim': '#a59578', '--theme-text-faint': '#7d7058',
                '--theme-border': '#3a2e15', '--theme-border-soft': '#2a210f', '--theme-border-input': '#3a2e15',
                '--theme-gradient': 'linear-gradient(45deg, #fbbf24 0%, #fcd34d 100%)',
                '--theme-shadow': 'rgba(251, 191, 36, 0.25)', '--theme-shadow-soft': 'rgba(251, 191, 36, 0.18)',
                '--theme-nav-bg': 'rgba(23, 18, 7, 0.98)'
            }
        },
        starry: {
            name: 'Starry', sub: 'Campsite · Night', emoji: '✨',
            preview: { primary: '#8b5cf6', gradient: 'linear-gradient(135deg, #1e1b4b 0%, #6d28d9 50%, #c4b5fd 100%)' },
            light: {
                '--theme-primary': '#a78bfa', '--theme-accent': '#c4b5fd', '--theme-primary-dark': '#8b5cf6',
                '--theme-primary-soft': '#2a1e3d', '--theme-primary-soft-2': '#150e26',
                '--theme-bg': '#0a0714', '--theme-bg-soft': '#0e0818', '--theme-card': '#17102a',
                '--theme-text': '#e8e0ff', '--theme-text-muted': '#cfc4f0', '--theme-text-dim': '#b0a2d8', '--theme-text-faint': '#9486c4',
                '--theme-border': '#281e3d', '--theme-border-soft': '#1a1229', '--theme-border-input': '#281e3d',
                '--theme-gradient': 'linear-gradient(45deg, #a78bfa 0%, #c4b5fd 100%)',
                '--theme-shadow': 'rgba(167, 139, 250, 0.3)', '--theme-shadow-soft': 'rgba(167, 139, 250, 0.2)',
                '--theme-nav-bg': 'rgba(10, 7, 20, 0.98)'
            },
            dark: {
                '--theme-primary': '#a78bfa', '--theme-accent': '#c4b5fd', '--theme-primary-dark': '#8b5cf6',
                '--theme-primary-soft': '#2a1e3d', '--theme-primary-soft-2': '#150e26',
                '--theme-bg': '#0a0714', '--theme-bg-soft': '#0e0818', '--theme-card': '#17102a',
                '--theme-text': '#e8e0ff', '--theme-text-muted': '#b0a0d0', '--theme-text-dim': '#8878b0', '--theme-text-faint': '#665a88',
                '--theme-border': '#281e3d', '--theme-border-soft': '#1a1229', '--theme-border-input': '#281e3d',
                '--theme-gradient': 'linear-gradient(45deg, #a78bfa 0%, #c4b5fd 100%)',
                '--theme-shadow': 'rgba(167, 139, 250, 0.3)', '--theme-shadow-soft': 'rgba(167, 139, 250, 0.2)',
                '--theme-nav-bg': 'rgba(10, 7, 20, 0.98)'
            }
        },
        cafe: {
            name: 'Café', sub: 'Lamplit · Cozy', emoji: '☕',
            preview: { primary: '#8B5E3C', gradient: 'linear-gradient(135deg, #8B5E3C 0%, #D2B48C 100%)' },
            light: {
                '--theme-primary': '#8B5E3C', '--theme-accent': '#D2B48C', '--theme-primary-dark': '#6B4226',
                '--theme-primary-soft': '#F5E6D3', '--theme-primary-soft-2': '#FAF3E8',
                '--theme-bg': '#FDF8F2', '--theme-bg-soft': '#F9F1E7', '--theme-card': '#FFFFFF',
                '--theme-text': '#3E2C1C', '--theme-text-muted': '#6B5A4A', '--theme-text-dim': '#9C8A7A', '--theme-text-faint': '#C4B5A5',
                '--theme-border': '#EDE0D0', '--theme-border-soft': '#F5EDE2', '--theme-border-input': '#DCC8B0',
                '--theme-gradient': 'linear-gradient(45deg, #8B5E3C 0%, #D2B48C 100%)',
                '--theme-shadow': 'rgba(139, 94, 60, 0.15)', '--theme-shadow-soft': 'rgba(139, 94, 60, 0.2)',
                '--theme-nav-bg': 'rgba(253, 248, 242, 0.98)'
            },
            dark: {
                '--theme-primary': '#C49A6C', '--theme-accent': '#D2B48C', '--theme-primary-dark': '#A67B5B',
                '--theme-primary-soft': '#3D2E1E', '--theme-primary-soft-2': '#1E150E',
                '--theme-bg': '#1A120B', '--theme-bg-soft': '#241A12', '--theme-card': '#241A12',
                '--theme-text': '#F0E6D8', '--theme-text-muted': '#C4B5A0', '--theme-text-dim': '#A09080', '--theme-text-faint': '#7D6E60',
                '--theme-border': '#3A2C1E', '--theme-border-soft': '#2A1E14', '--theme-border-input': '#3A2C1E',
                '--theme-gradient': 'linear-gradient(45deg, #C49A6C 0%, #D2B48C 100%)',
                '--theme-shadow': 'rgba(196, 154, 108, 0.25)', '--theme-shadow-soft': 'rgba(196, 154, 108, 0.18)',
                '--theme-nav-bg': 'rgba(26, 18, 11, 0.98)'
            }
        },
        crimson: {
            name: 'Crimson', sub: 'Rose Park · Bold', emoji: '🌹',
            preview: { primary: '#dc2626', gradient: 'linear-gradient(135deg, #dc2626 0%, #f87171 100%)' },
            light: {
                '--theme-primary': '#dc2626', '--theme-accent': '#f87171', '--theme-primary-dark': '#b91c1c',
                '--theme-primary-soft': '#fee2e2', '--theme-primary-soft-2': '#fef2f2',
                '--theme-bg': '#ffffff', '--theme-bg-soft': '#fff5f5', '--theme-card': '#ffffff',
                '--theme-text': '#3a1018', '--theme-text-muted': '#6b2530', '--theme-text-dim': '#8a4550', '--theme-text-faint': '#b0808a',
                '--theme-border': '#fde8e8', '--theme-border-soft': '#fef3f3', '--theme-border-input': '#fbd5d5',
                '--theme-gradient': 'linear-gradient(45deg, #dc2626 0%, #f87171 100%)',
                '--theme-shadow': 'rgba(220, 38, 38, 0.15)', '--theme-shadow-soft': 'rgba(220, 38, 38, 0.2)',
                '--theme-nav-bg': 'rgba(255, 255, 255, 0.98)'
            },
            dark: {
                '--theme-primary': '#ef4444', '--theme-accent': '#fca5a5', '--theme-primary-dark': '#dc2626',
                '--theme-primary-soft': '#3d1a1a', '--theme-primary-soft-2': '#1e0e0e',
                '--theme-bg': '#1a0a0a', '--theme-bg-soft': '#241010', '--theme-card': '#241010',
                '--theme-text': '#fbe5e5', '--theme-text-muted': '#c9a0a0', '--theme-text-dim': '#a57a7a', '--theme-text-faint': '#7d5a5a',
                '--theme-border': '#3a1a1a', '--theme-border-soft': '#2a1010', '--theme-border-input': '#3a1a1a',
                '--theme-gradient': 'linear-gradient(45deg, #ef4444 0%, #fca5a5 100%)',
                '--theme-shadow': 'rgba(239, 68, 68, 0.25)', '--theme-shadow-soft': 'rgba(239, 68, 68, 0.18)',
                '--theme-nav-bg': 'rgba(26, 10, 10, 0.98)'
            }
        },
        maroon: {
            name: 'Maroon', sub: 'Wine Bar · Classic', emoji: '🍷',
            preview: { primary: '#800000', gradient: 'linear-gradient(135deg, #800000 0%, #a52a2a 100%)' },
            light: {
                '--theme-primary': '#800000', '--theme-accent': '#a52a2a', '--theme-primary-dark': '#5c0000',
                '--theme-primary-soft': '#f5e6e6', '--theme-primary-soft-2': '#faf0f0',
                '--theme-bg': '#fdf8f8', '--theme-bg-soft': '#f9f0f0', '--theme-card': '#ffffff',
                '--theme-text': '#3a1010', '--theme-text-muted': '#6b2525', '--theme-text-dim': '#8a4545', '--theme-text-faint': '#b08080',
                '--theme-border': '#e8d5d5', '--theme-border-soft': '#f0e0e0', '--theme-border-input': '#d4b5b5',
                '--theme-gradient': 'linear-gradient(45deg, #800000 0%, #a52a2a 100%)',
                '--theme-shadow': 'rgba(128, 0, 0, 0.15)', '--theme-shadow-soft': 'rgba(128, 0, 0, 0.2)',
                '--theme-nav-bg': 'rgba(253, 248, 248, 0.98)'
            },
            dark: {
                '--theme-primary': '#a52a2a', '--theme-accent': '#c04040', '--theme-primary-dark': '#800000',
                '--theme-primary-soft': '#2a1515', '--theme-primary-soft-2': '#1a0d0d',
                '--theme-bg': '#120808', '--theme-bg-soft': '#1a0f0f', '--theme-card': '#1a0f0f',
                '--theme-text': '#f0e0e0', '--theme-text-muted': '#c4a0a0', '--theme-text-dim': '#a08080', '--theme-text-faint': '#7d6060',
                '--theme-border': '#2e1a1a', '--theme-border-soft': '#221212', '--theme-border-input': '#2e1a1a',
                '--theme-gradient': 'linear-gradient(45deg, #a52a2a 0%, #c04040 100%)',
                '--theme-shadow': 'rgba(165, 42, 42, 0.25)', '--theme-shadow-soft': 'rgba(165, 42, 42, 0.18)',
                '--theme-nav-bg': 'rgba(18, 8, 8, 0.98)'
            }
        },
        sakura: {
            name: 'Sakura', sub: 'Shrine · Dawn', emoji: '🌸',
            preview: { primary: '#ff8fab', gradient: 'linear-gradient(135deg, #ffb7c5 0%, #ff8fab 100%)' },
            light: {
                '--theme-primary': '#ff8fab', '--theme-accent': '#ffb7c5', '--theme-primary-dark': '#e57399',
                '--theme-primary-soft': '#ffe4ec', '--theme-primary-soft-2': '#fff0f5',
                '--theme-bg': '#fff9fb', '--theme-bg-soft': '#fff5f8', '--theme-card': '#ffffff',
                '--theme-text': '#3a1f2b', '--theme-text-muted': '#7a5563', '--theme-text-dim': '#a88091', '--theme-text-faint': '#d4b3bf',
                '--theme-border': '#ffe0ea', '--theme-border-soft': '#ffeef4', '--theme-border-input': '#ffd0dd',
                '--theme-gradient': 'linear-gradient(45deg, #ff8fab 0%, #ffb7c5 100%)',
                '--theme-shadow': 'rgba(255, 143, 171, 0.18)', '--theme-shadow-soft': 'rgba(255, 143, 171, 0.22)',
                '--theme-nav-bg': 'rgba(255, 249, 251, 0.98)'
            },
            dark: {
                '--theme-primary': '#ffa5b8', '--theme-accent': '#ffc8d4', '--theme-primary-dark': '#e57a94',
                '--theme-primary-soft': '#3d1f2c', '--theme-primary-soft-2': '#1e0f17',
                '--theme-bg': '#1a0e14', '--theme-bg-soft': '#241420', '--theme-card': '#241420',
                '--theme-text': '#fbe5ed', '--theme-text-muted': '#c9a0b3', '--theme-text-dim': '#a57a8f', '--theme-text-faint': '#7d5a6c',
                '--theme-border': '#3a1f2c', '--theme-border-soft': '#2a1520', '--theme-border-input': '#3a1f2c',
                '--theme-gradient': 'linear-gradient(45deg, #ffa5b8 0%, #ffc8d4 100%)',
                '--theme-shadow': 'rgba(255, 165, 184, 0.28)', '--theme-shadow-soft': 'rgba(255, 165, 184, 0.20)',
                '--theme-nav-bg': 'rgba(26, 14, 20, 0.98)'
            }
        },
        nebula: {
            name: 'Nebula', sub: 'Orbit · Cosmic', emoji: '🌌',
            preview: { primary: '#7c3aed', gradient: 'linear-gradient(135deg, #1e1b4b 0%, #7c3aed 50%, #ec4899 100%)' },
            light: {
                '--theme-primary': '#7c3aed', '--theme-accent': '#ec4899', '--theme-primary-dark': '#6d28d9',
                '--theme-primary-soft': '#f3e8ff', '--theme-primary-soft-2': '#fdf2f8',
                '--theme-bg': '#fdf7ff', '--theme-bg-soft': '#f9f0ff', '--theme-card': '#ffffff',
                '--theme-text': '#2a1e4d', '--theme-text-muted': '#5a4b80', '--theme-text-dim': '#8a7ca8', '--theme-text-faint': '#beb5d4',
                '--theme-border': '#ecdff5', '--theme-border-soft': '#f5eafb', '--theme-border-input': '#dcc8ee',
                '--theme-gradient': 'linear-gradient(45deg, #7c3aed 0%, #ec4899 100%)',
                '--theme-shadow': 'rgba(124, 58, 237, 0.2)', '--theme-shadow-soft': 'rgba(236, 72, 153, 0.18)',
                '--theme-nav-bg': 'rgba(253, 247, 255, 0.98)'
            },
            dark: {
                '--theme-primary': '#a78bfa', '--theme-accent': '#f472b6', '--theme-primary-dark': '#8b5cf6',
                '--theme-primary-soft': '#2a1e4d', '--theme-primary-soft-2': '#150e26',
                '--theme-bg': '#06030f', '--theme-bg-soft': '#0e0720', '--theme-card': '#150a28',
                '--theme-text': '#ede5ff', '--theme-text-muted': '#b8a8e0', '--theme-text-dim': '#8878b0', '--theme-text-faint': '#665a88',
                '--theme-border': '#2a1e4d', '--theme-border-soft': '#1a1229', '--theme-border-input': '#2a1e4d',
                '--theme-gradient': 'linear-gradient(45deg, #a78bfa 0%, #f472b6 100%)',
                '--theme-shadow': 'rgba(167, 139, 250, 0.4)', '--theme-shadow-soft': 'rgba(244, 114, 182, 0.28)',
                '--theme-nav-bg': 'rgba(6, 3, 15, 0.98)'
            }
        },
        ember: {
            name: 'Ember', sub: 'Lantern · Glow', emoji: '🔥',
            preview: { primary: '#f97316', gradient: 'linear-gradient(135deg, #7c2d12 0%, #f97316 50%, #dc2626 100%)' },
            light: {
                '--theme-primary': '#ea580c', '--theme-accent': '#dc2626', '--theme-primary-dark': '#c2410c',
                '--theme-primary-soft': '#ffedd5', '--theme-primary-soft-2': '#fff7ed',
                '--theme-bg': '#fff8f2', '--theme-bg-soft': '#fef3e8', '--theme-card': '#ffffff',
                '--theme-text': '#3a1f0f', '--theme-text-muted': '#6b4a30', '--theme-text-dim': '#a57852', '--theme-text-faint': '#d4b096',
                '--theme-border': '#f5e0c8', '--theme-border-soft': '#faecd8', '--theme-border-input': '#e8c8a8',
                '--theme-gradient': 'linear-gradient(45deg, #ea580c 0%, #dc2626 100%)',
                '--theme-shadow': 'rgba(234, 88, 12, 0.2)', '--theme-shadow-soft': 'rgba(220, 38, 38, 0.18)',
                '--theme-nav-bg': 'rgba(255, 248, 242, 0.98)'
            },
            dark: {
                '--theme-primary': '#fb923c', '--theme-accent': '#ef4444', '--theme-primary-dark': '#f97316',
                '--theme-primary-soft': '#3d1a0a', '--theme-primary-soft-2': '#1e0e05',
                '--theme-bg': '#0f0805', '--theme-bg-soft': '#1a0f0a', '--theme-card': '#1a0f0a',
                '--theme-text': '#fbe8d9', '--theme-text-muted': '#c9b0a0', '--theme-text-dim': '#a58a78', '--theme-text-faint': '#7d6858',
                '--theme-border': '#3a2015', '--theme-border-soft': '#2a1a10', '--theme-border-input': '#3a2015',
                '--theme-gradient': 'linear-gradient(45deg, #fb923c 0%, #ef4444 100%)',
                '--theme-shadow': 'rgba(251, 146, 60, 0.4)', '--theme-shadow-soft': 'rgba(239, 68, 68, 0.3)',
                '--theme-nav-bg': 'rgba(15, 8, 5, 0.98)'
            }
        },
        autumn: {
            name: 'Autumn', sub: 'Birch · Harvest', emoji: '🍁',
            preview: { primary: '#ea580c', gradient: 'linear-gradient(135deg, #dc2626 0%, #ea580c 50%, #f59e0b 100%)' },
            light: {
                '--theme-primary': '#ea580c', '--theme-accent': '#f59e0b', '--theme-primary-dark': '#c2410c',
                '--theme-primary-soft': '#fee8d4', '--theme-primary-soft-2': '#fff5ea',
                '--theme-bg': '#fffbf5', '--theme-bg-soft': '#fdf5ea', '--theme-card': '#ffffff',
                '--theme-text': '#3a1f0f', '--theme-text-muted': '#6b4a30', '--theme-text-dim': '#a57852', '--theme-text-faint': '#d4b096',
                '--theme-border': '#f5e0c8', '--theme-border-soft': '#faecd8', '--theme-border-input': '#e8c8a8',
                '--theme-gradient': 'linear-gradient(45deg, #ea580c 0%, #f59e0b 100%)',
                '--theme-shadow': 'rgba(234, 88, 12, 0.18)', '--theme-shadow-soft': 'rgba(245, 158, 11, 0.22)',
                '--theme-nav-bg': 'rgba(255, 251, 245, 0.98)'
            },
            dark: {
                '--theme-primary': '#fb923c', '--theme-accent': '#fbbf24', '--theme-primary-dark': '#f97316',
                '--theme-primary-soft': '#3d2010', '--theme-primary-soft-2': '#1e1008',
                '--theme-bg': '#1a0f08', '--theme-bg-soft': '#241812', '--theme-card': '#241812',
                '--theme-text': '#fbe8d8', '--theme-text-muted': '#c9b0a0', '--theme-text-dim': '#a58a78', '--theme-text-faint': '#7d6858',
                '--theme-border': '#3a2015', '--theme-border-soft': '#2a1a10', '--theme-border-input': '#3a2015',
                '--theme-gradient': 'linear-gradient(45deg, #fb923c 0%, #fbbf24 100%)',
                '--theme-shadow': 'rgba(251, 146, 60, 0.3)', '--theme-shadow-soft': 'rgba(251, 191, 36, 0.22)',
                '--theme-nav-bg': 'rgba(26, 15, 8, 0.98)'
            }
        },
        glacier: {
            name: 'Glacier', sub: 'Alpine · Crisp', emoji: '🧊',
            preview: { primary: '#67e8f9', gradient: 'linear-gradient(135deg, #67e8f9 0%, #bae6fd 100%)' },
            light: {
                '--theme-primary': '#0891b2', '--theme-accent': '#67e8f9', '--theme-primary-dark': '#0e7490',
                '--theme-primary-soft': '#e0f7fa', '--theme-primary-soft-2': '#f0fbfd',
                '--theme-bg': '#f8fdff', '--theme-bg-soft': '#effaff', '--theme-card': '#ffffff',
                '--theme-text': '#0f2a35', '--theme-text-muted': '#3d5c6a', '--theme-text-dim': '#6b8a99', '--theme-text-faint': '#a0bcc7',
                '--theme-border': '#d8f0f7', '--theme-border-soft': '#e8f7fb', '--theme-border-input': '#bfe6f0',
                '--theme-gradient': 'linear-gradient(45deg, #0891b2 0%, #67e8f9 100%)',
                '--theme-shadow': 'rgba(8, 145, 178, 0.15)', '--theme-shadow-soft': 'rgba(103, 232, 249, 0.22)',
                '--theme-nav-bg': 'rgba(248, 253, 255, 0.98)'
            },
            dark: {
                '--theme-primary': '#22d3ee', '--theme-accent': '#67e8f9', '--theme-primary-dark': '#06b6d4',
                '--theme-primary-soft': '#0f2a35', '--theme-primary-soft-2': '#08181e',
                '--theme-bg': '#061217', '--theme-bg-soft': '#0f1e24', '--theme-card': '#0f1e24',
                '--theme-text': '#e0f7fc', '--theme-text-muted': '#a0c4d0', '--theme-text-dim': '#7a9ca8', '--theme-text-faint': '#5a7c88',
                '--theme-border': '#1a3040', '--theme-border-soft': '#122028', '--theme-border-input': '#1a3040',
                '--theme-gradient': 'linear-gradient(45deg, #22d3ee 0%, #67e8f9 100%)',
                '--theme-shadow': 'rgba(34, 211, 238, 0.3)', '--theme-shadow-soft': 'rgba(103, 232, 249, 0.22)',
                '--theme-nav-bg': 'rgba(6, 18, 23, 0.98)'
            }
        },
        tropic: {
            name: 'Tropic', sub: 'Fronds · Island', emoji: '🌴',
            preview: { primary: '#f43f5e', gradient: 'linear-gradient(135deg, #f43f5e 0%, #fbbf24 100%)' },
            light: {
                '--theme-primary': '#f43f5e', '--theme-accent': '#fbbf24', '--theme-primary-dark': '#e11d48',
                '--theme-primary-soft': '#ffe4e6', '--theme-primary-soft-2': '#fff1f2',
                '--theme-bg': '#fffaf0', '--theme-bg-soft': '#fff5e6', '--theme-card': '#ffffff',
                '--theme-text': '#3a1f2b', '--theme-text-muted': '#6b4a50', '--theme-text-dim': '#9c7a80', '--theme-text-faint': '#c4a5aa',
                '--theme-border': '#ffe4d0', '--theme-border-soft': '#fff0e0', '--theme-border-input': '#fdd0b8',
                '--theme-gradient': 'linear-gradient(45deg, #f43f5e 0%, #fbbf24 100%)',
                '--theme-shadow': 'rgba(244, 63, 94, 0.18)', '--theme-shadow-soft': 'rgba(251, 191, 36, 0.22)',
                '--theme-nav-bg': 'rgba(255, 250, 240, 0.98)'
            },
            dark: {
                '--theme-primary': '#fb7185', '--theme-accent': '#fbbf24', '--theme-primary-dark': '#f43f5e',
                '--theme-primary-soft': '#3d1f2b', '--theme-primary-soft-2': '#1e0f15',
                '--theme-bg': '#1a0f10', '--theme-bg-soft': '#241818', '--theme-card': '#241818',
                '--theme-text': '#fbe5e8', '--theme-text-muted': '#c9a0a5', '--theme-text-dim': '#a57a82', '--theme-text-faint': '#7d5a62',
                '--theme-border': '#3a1f26', '--theme-border-soft': '#2a151b', '--theme-border-input': '#3a1f26',
                '--theme-gradient': 'linear-gradient(45deg, #fb7185 0%, #fbbf24 100%)',
                '--theme-shadow': 'rgba(251, 113, 133, 0.3)', '--theme-shadow-soft': 'rgba(251, 191, 36, 0.22)',
                '--theme-nav-bg': 'rgba(26, 15, 16, 0.98)'
            }
        },
        moonlit: {
            name: 'Moonlit', sub: 'Serene · Desert', emoji: '🌙',
            preview: { primary: '#94a3b8', gradient: 'linear-gradient(135deg, #1e293b 0%, #94a3b8 50%, #e2e8f0 100%)' },
            light: {
                '--theme-primary': '#64748b', '--theme-accent': '#94a3b8', '--theme-primary-dark': '#475569',
                '--theme-primary-soft': '#e2e8f0', '--theme-primary-soft-2': '#f1f5f9',
                '--theme-bg': '#f8fafc', '--theme-bg-soft': '#f1f5f9', '--theme-card': '#ffffff',
                '--theme-text': '#0f172a', '--theme-text-muted': '#3a4759', '--theme-text-dim': '#64748b', '--theme-text-faint': '#94a3b8',
                '--theme-border': '#e2e8f0', '--theme-border-soft': '#eef2f6', '--theme-border-input': '#cbd5e1',
                '--theme-gradient': 'linear-gradient(45deg, #64748b 0%, #94a3b8 100%)',
                '--theme-shadow': 'rgba(100, 116, 139, 0.15)', '--theme-shadow-soft': 'rgba(148, 163, 184, 0.22)',
                '--theme-nav-bg': 'rgba(248, 250, 252, 0.98)'
            },
            dark: {
                '--theme-primary': '#cbd5e1', '--theme-accent': '#e2e8f0', '--theme-primary-dark': '#94a3b8',
                '--theme-primary-soft': '#1e293b', '--theme-primary-soft-2': '#0f172a',
                '--theme-bg': '#0a1020', '--theme-bg-soft': '#141c30', '--theme-card': '#141c30',
                '--theme-text': '#e2e8f0', '--theme-text-muted': '#a0aec4', '--theme-text-dim': '#7a8aa0', '--theme-text-faint': '#5a6a80',
                '--theme-border': '#1f2a44', '--theme-border-soft': '#162036', '--theme-border-input': '#1f2a44',
                '--theme-gradient': 'linear-gradient(45deg, #cbd5e1 0%, #e2e8f0 100%)',
                '--theme-shadow': 'rgba(203, 213, 225, 0.25)', '--theme-shadow-soft': 'rgba(226, 232, 240, 0.18)',
                '--theme-nav-bg': 'rgba(10, 16, 32, 0.98)'
            }
        },
        aurora: {
            name: 'Aurora', sub: 'Arctic · Night', emoji: '🌠',
            preview: { primary: '#34d399', gradient: 'linear-gradient(135deg, #0f172a 0%, #34d399 50%, #a78bfa 100%)' },
            light: {
                '--theme-primary': '#059669', '--theme-accent': '#7c3aed', '--theme-primary-dark': '#047857',
                '--theme-primary-soft': '#d1fae5', '--theme-primary-soft-2': '#ecfdf5',
                '--theme-bg': '#f0fdfa', '--theme-bg-soft': '#f7fefb', '--theme-card': '#ffffff',
                '--theme-text': '#0f2a25', '--theme-text-muted': '#3d5c55', '--theme-text-dim': '#6b8a82', '--theme-text-faint': '#a0bcc4',
                '--theme-border': '#d5efe6', '--theme-border-soft': '#e6f6f0', '--theme-border-input': '#bfe4d8',
                '--theme-gradient': 'linear-gradient(45deg, #059669 0%, #7c3aed 100%)',
                '--theme-shadow': 'rgba(5, 150, 105, 0.18)', '--theme-shadow-soft': 'rgba(124, 58, 237, 0.15)',
                '--theme-nav-bg': 'rgba(240, 253, 250, 0.98)'
            },
            dark: {
                '--theme-primary': '#34d399', '--theme-accent': '#c4b5fd', '--theme-primary-dark': '#10b981',
                '--theme-primary-soft': '#0f2a25', '--theme-primary-soft-2': '#08181a',
                '--theme-bg': '#04100f', '--theme-bg-soft': '#0a1818', '--theme-card': '#0a1818',
                '--theme-text': '#e0fff4', '--theme-text-muted': '#a0d4c4', '--theme-text-dim': '#7aa89c', '--theme-text-faint': '#5a7c72',
                '--theme-border': '#1a3028', '--theme-border-soft': '#122019', '--theme-border-input': '#1a3028',
                '--theme-gradient': 'linear-gradient(45deg, #34d399 0%, #c4b5fd 100%)',
                '--theme-shadow': 'rgba(52, 211, 153, 0.4)', '--theme-shadow-soft': 'rgba(196, 181, 253, 0.3)',
                '--theme-nav-bg': 'rgba(4, 16, 15, 0.98)'
            }
        },
        matcha: {
            name: 'Matcha', sub: 'Garden · Zen', emoji: '🍵',
            preview: { primary: '#84cc16', gradient: 'linear-gradient(135deg, #65a30d 0%, #a3e635 100%)' },
            light: {
                '--theme-primary': '#65a30d', '--theme-accent': '#a3e635', '--theme-primary-dark': '#4d7c0f',
                '--theme-primary-soft': '#ecfccb', '--theme-primary-soft-2': '#f7fee7',
                '--theme-bg': '#fefdf7', '--theme-bg-soft': '#f7f8ed', '--theme-card': '#ffffff',
                '--theme-text': '#1f2a0f', '--theme-text-muted': '#4a5c2a', '--theme-text-dim': '#7a8a5c', '--theme-text-faint': '#b5c096',
                '--theme-border': '#e8f0d0', '--theme-border-soft': '#f0f5e0', '--theme-border-input': '#d4e0a8',
                '--theme-gradient': 'linear-gradient(45deg, #65a30d 0%, #a3e635 100%)',
                '--theme-shadow': 'rgba(101, 163, 13, 0.15)', '--theme-shadow-soft': 'rgba(163, 230, 53, 0.22)',
                '--theme-nav-bg': 'rgba(254, 253, 247, 0.98)'
            },
            dark: {
                '--theme-primary': '#a3e635', '--theme-accent': '#bef264', '--theme-primary-dark': '#84cc16',
                '--theme-primary-soft': '#1a2810', '--theme-primary-soft-2': '#0d1a08',
                '--theme-bg': '#0a1408', '--theme-bg-soft': '#131f10', '--theme-card': '#131f10',
                '--theme-text': '#e8f7d9', '--theme-text-muted': '#a8c490', '--theme-text-dim': '#7a9c60', '--theme-text-faint': '#5a7c40',
                '--theme-border': '#1f3518', '--theme-border-soft': '#162510', '--theme-border-input': '#1f3518',
                '--theme-gradient': 'linear-gradient(45deg, #a3e635 0%, #bef264 100%)',
                '--theme-shadow': 'rgba(163, 230, 53, 0.3)', '--theme-shadow-soft': 'rgba(190, 242, 100, 0.22)',
                '--theme-nav-bg': 'rgba(10, 20, 8, 0.98)'
            }
        }
    };

    // ── themed cursor (v6.3) — icons live in THEME_CURSORS; styles in theme.css ──
    // ZERO-LAG: the exact pointer position is written straight from the pointer event (no
    // easing / no rAF queue), and the icon rides beside the pointer instead of covering it,
    // so the small dot is always the true hotspot and the element under it stays visible.
    (function cursorKit() {
        const root = document.documentElement;
        let fine = false;
        try { fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches; } catch (e) { /* ignore */ }
        window.__twCursorSync = function () { };
        if (!fine) return;
        const CLICKABLE = 'a,button,summary,label,[role="button"],[role="tab"],[role="link"],[role="menuitem"],[role="switch"],input[type="button"],input[type="submit"],input[type="reset"],input[type="checkbox"],input[type="radio"],[onclick],[tabindex]:not([tabindex="-1"]),.btn,[class*="btn-"],[class*="-btn"],[class*="clickable"]';
        const NATIVE = 'input:not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="checkbox"]):not([type="radio"]),textarea,select,[contenteditable=""],[contenteditable="true"]';
        const SIZE = 30, GAP = 8;               // icon box + distance from the hotspot
        const RAW = ('onpointerrawupdate' in window);
        let ring = null, dot = null, key = '', seen = false, lx = -1, ly = -1;

        function paint() {
            if (!ring) return;
            ring.firstChild.innerHTML = (key && window.THEME_CURSORS[key]) || '';
        }
        function build() {
            if (ring || !document.body) return;
            ring = document.createElement('div');
            ring.id = 'twCur';
            ring.setAttribute('aria-hidden', 'true');
            ring.innerHTML = '<div class="ic"></div>';
            dot = document.createElement('div');
            dot.id = 'twCurDot';
            dot.setAttribute('aria-hidden', 'true');
            document.body.appendChild(ring);
            document.body.appendChild(dot);
            ring.addEventListener('animationend', (e) => { if (e.animationName === 'twcPop') ring.classList.remove('pop'); });
            paint();
        }
        // dot = exact hotspot; icon flips to the other side near the right / bottom viewport edge
        function place(x, y) {
            lx = x; ly = y;
            dot.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
            const ox = (x + GAP + SIZE > window.innerWidth) ? -(GAP + SIZE) : GAP;
            const oy = (y + GAP + SIZE > window.innerHeight) ? -(GAP + SIZE) : GAP;
            ring.style.transform = 'translate3d(' + (x + ox) + 'px,' + (y + oy) + 'px,0)';
        }
        function sync(presetKey) {
            key = (window.THEME_CURSORS && window.THEME_CURSORS[presetKey]) ? presetKey : '';
            if (!key) root.removeAttribute('data-tw-cursor');
            else if (seen) root.setAttribute('data-tw-cursor', key);
            paint();
        }
        window.__twCursorSync = sync;

        const onMove = (e) => {
            if (e.pointerType && e.pointerType !== 'mouse') return;
            if (!seen) {
                seen = true;
                build();
                if (key) root.setAttribute('data-tw-cursor', key);
            }
            if (!ring) return;
            place(e.clientX, e.clientY);
            if (ring.classList.contains('out')) { ring.classList.remove('out'); dot.classList.remove('out'); }
        };
        document.addEventListener('pointermove', onMove, { passive: true });
        // Chromium: un-coalesced, un-throttled position updates (secure contexts) = even less latency
        if (RAW) document.addEventListener('pointerrawupdate', onMove, { passive: true });
        document.addEventListener('mouseover', (e) => {
            if (!ring || !(e.target instanceof Element)) return;
            const nat = !!e.target.closest(NATIVE);
            const hov = !nat && !!e.target.closest(CLICKABLE);
            ring.classList.toggle('nat', nat);
            dot.classList.toggle('nat', nat);
            ring.classList.toggle('hov', hov);
            dot.classList.toggle('hov', hov);
        }, { passive: true });
        document.addEventListener('pointerdown', (e) => {
            if (!ring || (e.pointerType && e.pointerType !== 'mouse')) return;
            ring.classList.add('dn');
            dot.classList.add('dn');
            ring.classList.remove('pop');
            void ring.offsetWidth;
            ring.classList.add('pop');
        }, { passive: true });
        const up = () => { if (ring) { ring.classList.remove('dn'); dot.classList.remove('dn'); } };
        document.addEventListener('pointerup', up, { passive: true });
        document.addEventListener('pointercancel', up, { passive: true });
        window.addEventListener('resize', () => { if (ring && lx >= 0) place(lx, ly); }, { passive: true });
        root.addEventListener('mouseleave', () => { if (ring) { ring.classList.add('out'); dot.classList.add('out'); } });
        root.addEventListener('mouseenter', () => { if (ring) { ring.classList.remove('out'); dot.classList.remove('out'); } });
    })();

    window.DEFAULT_THEME = { preset: 'ocean', mode: 'light' };
    window.selectedTheme = { ...window.DEFAULT_THEME };

    window.injectThemeShapes = function (presetKey) {
        const container = document.getElementById('themeBgShapes');
        if (!container) return;
        if (!presetKey || !window.THEME_SHAPES[presetKey]) {
            console.warn('injectThemeShapes: unknown preset "' + presetKey + '"');
            return;
        }
        if (container.dataset.activeTheme !== presetKey) {
            const hadScene = !!container.dataset.activeTheme;
            container.innerHTML = window.THEME_SHAPES[presetKey];
            container.dataset.activeTheme = presetKey;
            // v6: soft cross-fade when the user switches scenes (not on first paint)
            if (hadScene) {
                container.classList.remove('tw-swap');
                void container.offsetWidth;
                container.classList.add('tw-swap');
                setTimeout(() => container.classList.remove('tw-swap'), 900);
            }
        }
    };

    window.applyTheme = function (theme) {
        const safeTheme = (theme && typeof theme === 'object') ? theme : {};
        const presetKey = (safeTheme.preset && window.THEMES[safeTheme.preset])
            ? safeTheme.preset
            : window.DEFAULT_THEME.preset;
        const mode = safeTheme.mode === 'dark' ? 'dark' : 'light';
        const preset = window.THEMES[presetKey];
        const palette = preset[mode];
        const root = document.documentElement;
        Object.keys(palette).forEach(key => {
            root.style.setProperty(key, palette[key]);
        });
        root.setAttribute('data-timawa-theme', presetKey);
        root.setAttribute('data-timawa-mode', mode);
        root.style.colorScheme = mode; // v6: native form controls / scrollbars follow the mode
        window.injectThemeShapes(presetKey);
        if (window.__twCursorSync) window.__twCursorSync(presetKey);
        let meta = document.querySelector('meta[name="theme-color"]');
        if (!meta) {
            meta = document.createElement('meta');
            meta.name = 'theme-color';
            document.head.appendChild(meta);
        }
        meta.content = palette['--theme-bg'];
        window.selectedTheme = { preset: presetKey, mode };
    };

    window.readThemeFromStorage = function () {
        try {
            const raw = localStorage.getItem(window.THEME_STORAGE_KEY);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            if (parsed && parsed.preset && window.THEMES[parsed.preset]) {
                return { preset: parsed.preset, mode: parsed.mode === 'dark' ? 'dark' : 'light' };
            }
        } catch (e) { /* ignore */ }
        return null;
    };

    window.persistThemeLocally = function (theme) {
        if (!theme || typeof theme !== 'object') return;
        if (!theme.preset || !window.THEMES[theme.preset]) return;
        try {
            localStorage.setItem(window.THEME_STORAGE_KEY, JSON.stringify({
                preset: theme.preset,
                mode: theme.mode === 'dark' ? 'dark' : 'light'
            }));
        } catch (e) { /* ignore */ }
    };

    window.broadcastThemeChange = function (theme) {
        if (!theme || typeof theme !== 'object') return;
        if (!theme.preset || !window.THEMES[theme.preset]) return;
        const safe = {
            preset: theme.preset,
            mode: theme.mode === 'dark' ? 'dark' : 'light'
        };
        try {
            if ('BroadcastChannel' in window) {
                const bc = new BroadcastChannel('timawa_theme_sync');
                bc.postMessage({ type: 'theme-change', theme: safe });
                bc.close();
            }
        } catch (e) { /* ignore */ }
        try {
            window.dispatchEvent(new CustomEvent(window.THEME_EVENT, { detail: safe }));
        } catch (e) { /* ignore */ }
    };

    (function bootTheme() {
        const cached = window.readThemeFromStorage();
        if (cached) window.selectedTheme = cached;
        window.applyTheme(window.selectedTheme);
    })();

    try {
        if ('BroadcastChannel' in window) {
            const bc = new BroadcastChannel('timawa_theme_sync');
            bc.addEventListener('message', (event) => {
                if (event.data && event.data.type === 'theme-change' && event.data.theme) {
                    const incoming = event.data.theme;
                    if (!incoming.preset || !window.THEMES[incoming.preset]) return;
                    window.selectedTheme = {
                        preset: incoming.preset,
                        mode: incoming.mode === 'dark' ? 'dark' : 'light'
                    };
                    window.applyTheme(window.selectedTheme);
                    try {
                        localStorage.setItem(window.THEME_STORAGE_KEY, JSON.stringify(window.selectedTheme));
                    } catch (e) { /* ignore */ }
                }
            });
        }
    } catch (e) { /* ignore */ }

    function ensureShapesInjected() {
        const container = document.getElementById('themeBgShapes');
        if (!container) return;
        const currentPreset = document.documentElement.getAttribute('data-timawa-theme')
            || window.selectedTheme.preset
            || window.DEFAULT_THEME.preset;
        const currentMode = document.documentElement.getAttribute('data-timawa-mode')
            || window.selectedTheme.mode
            || window.DEFAULT_THEME.mode;
        container.dataset.activeTheme = '';
        window.applyTheme({ preset: currentPreset, mode: currentMode });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', ensureShapesInjected);
    } else {
        ensureShapesInjected();
    }

    window.addEventListener('load', () => {
        setTimeout(ensureShapesInjected, 100);
    });

    // ── perf hooks: pause when hidden, lite mode on weak devices ──
    (function perfHooks() {
        const root = document.documentElement;
        try {
            const c = navigator.connection || {};
            if ((navigator.deviceMemory && navigator.deviceMemory <= 2) ||
                (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) || c.saveData)
                root.setAttribute('data-tw-lite', '');
        } catch (e) { /* ignore */ }
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) root.setAttribute('data-tw-paused', '');
            else root.removeAttribute('data-tw-paused');
        });
    })();
})();