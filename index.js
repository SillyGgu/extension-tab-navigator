// Extension Tab Navigator for SillyTavern
// 원본 V1 open/close 로직 기반 — 패널 표시는 inline-drawer-content 클래스 토글만 사용
(function () {
    'use strict';

    const STORAGE_KEY = 'etn_pinned_v2';
    const ACTIVE_KEY  = 'etn_active';
    const WIDTH_KEY   = 'etn_panel_width';
    const THEME_KEY   = 'etn_theme';

    let pinnedIds = loadPinned();
    let activeId  = null;
    let panels    = [];
    let track     = null;

    function loadPinned() {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
        catch { return []; }
    }
    function savePinned() {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(pinnedIds)); }
        catch(e) {}
    }
    function isPinned(id) { return pinnedIds.includes(id); }

    function loadWidth() {
        try { return parseInt(localStorage.getItem(WIDTH_KEY), 10) || 100; }
        catch { return 100; }
    }
    function saveWidth(w) {
        try { localStorage.setItem(WIDTH_KEY, String(w)); }
        catch(e) {}
    }
    function loadTheme() {
        try { return localStorage.getItem(THEME_KEY) || 'dark'; }
        catch { return 'dark'; }
    }
    function saveTheme(t) {
        try { localStorage.setItem(THEME_KEY, t); }
        catch(e) {}
    }

    function slugify(text) {
        return text.trim().replace(/\s+/g, '_').replace(/[^\w가-힣]/g, '').toLowerCase()
            || 'ext_' + Math.random().toString(36).slice(2, 7);
    }

    function guessIcon(label) {
        const l = label.toLowerCase();
        if (/asset|다운로드|download/i.test(l))                return 'fa-box-open';
        if (/preset|프리셋|quick.?preset/i.test(l))            return 'fa-sliders';
        if (/quick.?reply|qr\b/i.test(l))                      return 'fa-qrcode';
        if (/regex|정규/i.test(l))                             return 'fa-code';
        if (/memory|기억/i.test(l))                            return 'fa-brain';
        if (/image|이미지|img|오토픽|autopic|caption/i.test(l)) return 'fa-image';
        if (/tts|voice|음성|speech/i.test(l))                  return 'fa-microphone';
        if (/translat|번역|magic.?trans/i.test(l))             return 'fa-language';
        if (/server|api/i.test(l))                             return 'fa-server';
        if (/character|캐릭터|express|sticker|스티커/i.test(l)) return 'fa-user';
        if (/world|세계/i.test(l))                             return 'fa-earth-asia';
        if (/chapter/i.test(l))                                return 'fa-book-bookmark';
        if (/popup|팝업|memo|메모/i.test(l))                    return 'fa-window-restore';
        if (/hype|bot/i.test(l))                               return 'fa-robot';
        if (/web.?search|검색/i.test(l))                       return 'fa-magnifying-glass';
        if (/chat|채팅|record|기록|backup|恢复/i.test(l))       return 'fa-clock-rotate-left';
        if (/format|치환|포맷/i.test(l))                       return 'fa-file-code';
        if (/summar/i.test(l))                                 return 'fa-align-left';
        if (/vector/i.test(l))                                 return 'fa-database';
        if (/color|colour|coloriz/i.test(l))                   return 'fa-palette';
        if (/folder|폴더|목차/i.test(l))                       return 'fa-folder';
        if (/runner|javascript/i.test(l))                      return 'fa-terminal';
        if (/direction/i.test(l))                              return 'fa-arrows-up-down';
        if (/pre.?fill|prefill/i.test(l))                      return 'fa-pen';
        if (/prompt.?template/i.test(l))                       return 'fa-file-lines';
        if (/customizer/i.test(l))                             return 'fa-paintbrush';
        if (/helper/i.test(l))                                 return 'fa-circle-info';
        if (/mover|bulk/i.test(l))                             return 'fa-boxes-stacked';
        if (/greet|제목|greeting/i.test(l))                    return 'fa-address-card';
        if (/log|발췌/i.test(l))                               return 'fa-scroll';
        if (/game|flash|플래시/i.test(l))                      return 'fa-gamepad';
        if (/dice/i.test(l))                                   return 'fa-dice';
        if (/noass/i.test(l))                                  return 'fa-ban';
        return 'fa-puzzle-piece';
    }

    // ── Main builder ───────────────────────────────────────────────────────────
    function buildNavigator() {
        if (document.getElementById('etn-nav')) return;

        const col1 = document.getElementById('extensions_settings');
        const col2 = document.getElementById('extensions_settings2');
        if (!col1) return;

        // ── 원본 V1 방식: .inline-drawer 전체 수집 ──────────────────────────
        const allDrawers = [];
        [col1, col2].forEach(function(col) {
            if (!col) return;
            col.querySelectorAll('.inline-drawer').forEach(function(drawer) {
                const content = drawer.querySelector('.inline-drawer-content');
                if (!content || content.textContent.trim() === '') return;
                allDrawers.push({ drawer: drawer, col: col });
            });
        });

        if (allDrawers.length === 0) return;

        // label 탐색: b/strong → 직계 텍스트 노드 → data-i18n → fallback
        function getLabel(drawer, i) {
            const header = drawer.querySelector('.inline-drawer-header');
            if (!header) return 'Extension ' + (i + 1);
            const el = header.querySelector('b, strong');
            if (el && el.textContent.trim()) return el.textContent.trim();
            for (var n of header.childNodes) {
                if (n.nodeType === 3 && n.textContent.trim()) return n.textContent.trim();
            }
            const i18n = header.querySelector('[data-i18n]');
            if (i18n && i18n.textContent.trim()) return i18n.textContent.trim();
            return 'Extension ' + (i + 1);
        }

        panels = allDrawers.map(function(item, i) {
            const label     = getLabel(item.drawer, i);
            const id        = slugify(label) + '_' + i;
            const contentEl = item.drawer.querySelector('.inline-drawer-content');
            return { id: id, label: label, icon: guessIcon(label), contentEl: contentEl, drawerEl: item.drawer, col: item.col };
        });

        const currentTheme = loadTheme();

        // ── Build nav ────────────────────────────────────────────────────────
        const nav = document.createElement('div');
        nav.id = 'etn-nav';
        nav.classList.add('etn-theme-' + currentTheme);
        nav.innerHTML =
            '<div id="etn-toolbar">' +
                '<span class="etn-toolbar-label">너비</span>' +
                '<input id="etn-width-slider" type="range" min="30" max="100" step="1" value="' + loadWidth() + '" />' +
                '<span id="etn-width-value" class="etn-toolbar-value">' + loadWidth() + '%</span>' +
                '<div class="etn-toolbar-sep"></div>' +
                '<button id="etn-theme-toggle" class="etn-toolbar-btn" title="라이트 모드로 전환">' +
                    '<i class="fa-solid ' + (currentTheme === 'dark' ? 'fa-sun' : 'fa-moon') + '"></i>' +
                '</button>' +
            '</div>' +
            '<div id="etn-scroll-bar"><div id="etn-icon-track"></div></div>' +
            '<div id="etn-panel-area"></div>';

        const parent = col1.parentElement;
        parent.insertBefore(nav, col1);

        const panelArea = nav.querySelector('#etn-panel-area');
        panelArea.appendChild(col1);
        if (col2) panelArea.appendChild(col2);

        col1.classList.add('etn-col');
        if (col2) col2.classList.add('etn-col');

        // ── 원본 V1 방식: 헤더 hide + content class 토글 ────────────────────
        panels.forEach(function(p) {
            p.drawerEl.classList.add('etn-managed-drawer');
            p.contentEl.classList.add('etn-force-hide');
        });

        // ── 패널로 잡히지 않은 col 직계 자식 숨기기 (orphan) ────────────────
        // inline-drawer-content 를 건드리지 않고, wrapper 자체를 숨김
        var registeredDrawers = new Set(panels.map(function(p) { return p.drawerEl; }));
        [col1, col2].forEach(function(col) {
            if (!col) return;
            Array.from(col.children).forEach(function(child) {
                if (child.tagName === 'STYLE' || child.tagName === 'SCRIPT' || child.tagName === 'HR') return;
                // 이 child 안에 등록된 drawer가 하나도 없으면 orphan → 숨기기
                var hasRegistered = child.querySelector && Array.from(
                    child.querySelectorAll('.inline-drawer')
                ).some(function(d) { return registeredDrawers.has(d); });
                // child 자신이 등록된 drawer인 경우도 포함
                if (!hasRegistered && !registeredDrawers.has(child)) {
                    child.style.setProperty('display', 'none', 'important');
                }
            });
        });

        track = nav.querySelector('#etn-icon-track');
        renderIcons(track);

        const lastActive = sessionStorage.getItem(ACTIVE_KEY);
        const startId = (lastActive && panels.find(function(p) { return p.id === lastActive; }))
            ? lastActive
            : (pinnedIds.find(function(id) { return panels.find(function(p) { return p.id === id; }); }) || panels[0].id);
        setActive(startId);

        setupScrollInteractions(nav.querySelector('#etn-scroll-bar'));

        // 너비 슬라이더
        const slider   = nav.querySelector('#etn-width-slider');
        const widthVal = nav.querySelector('#etn-width-value');
        applyPanelWidth(loadWidth());
        slider.addEventListener('input', function() {
            const w = parseInt(this.value, 10);
            widthVal.textContent = w + '%';
            applyPanelWidth(w);
            saveWidth(w);
        });

        // 테마 토글
        nav.querySelector('#etn-theme-toggle').addEventListener('click', function() {
            const isDark = document.getElementById('etn-nav').classList.contains('etn-theme-dark');
            const next = isDark ? 'light' : 'dark';
            saveTheme(next);
            applyTheme(next);
        });
    }

    // ── Panel width ────────────────────────────────────────────────────────────
    function applyPanelWidth(pct) {
        const area = document.getElementById('etn-panel-area');
        if (!area) return;
        area.style.width       = pct + '%';
        area.style.marginLeft  = 'auto';
        area.style.marginRight = 'auto';
    }

    // ── Theme ──────────────────────────────────────────────────────────────────
    function applyTheme(theme) {
        const nav = document.getElementById('etn-nav');
        if (!nav) return;
        nav.classList.remove('etn-theme-dark', 'etn-theme-light');
        nav.classList.add('etn-theme-' + theme);
        const btn  = document.getElementById('etn-theme-toggle');
        const icon = btn && btn.querySelector('i');
        if (icon) icon.className = theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
        if (btn)  btn.title = theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환';
    }

    // ── Render icon bar ────────────────────────────────────────────────────────
    function renderIcons(trackEl) {
        trackEl.innerHTML = '';
        const ordered = [
            ...pinnedIds.map(function(id) { return panels.find(function(p) { return p.id === id; }); }).filter(Boolean),
            ...panels.filter(function(p) { return !isPinned(p.id); }),
        ];
        ordered.forEach(function(p) {
            const btn = document.createElement('div');
            btn.className = 'etn-icon-btn' +
                (isPinned(p.id) ? ' etn-pinned' : '') +
                (p.id === activeId ? ' etn-active' : '');
            btn.dataset.id = p.id;
            btn.title = p.label;
            btn.setAttribute('tabindex', '0');
            btn.setAttribute('role', 'button');
            btn.innerHTML =
                '<div class="etn-icon-inner">' +
                    '<i class="fa-solid ' + p.icon + '"></i>' +
                    '<div class="etn-pin-dot" title="고정 / 해제">' +
                        '<i class="fa-solid fa-thumbtack' + (isPinned(p.id) ? '' : ' fa-rotate-90') + '"></i>' +
                    '</div>' +
                '</div>' +
                '<span class="etn-icon-label">' + p.label + '</span>';

            btn.addEventListener('click', function(e) {
                if (e.target.closest('.etn-pin-dot')) return;
                setActive(p.id);
            });
            btn.querySelector('.etn-pin-dot').addEventListener('click', function(e) {
                e.stopPropagation();
                togglePin(p.id);
            });
            btn.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') btn.click();
            });
            trackEl.appendChild(btn);
        });
    }

    // ── Activate panel — 원본 V1 방식 그대로 ──────────────────────────────────
    function setActive(id) {
        activeId = id;
        sessionStorage.setItem(ACTIVE_KEY, id);

        panels.forEach(function(p) {
            if (p.id === id) {
                p.contentEl.classList.remove('etn-force-hide');
                p.contentEl.classList.add('etn-force-show');
            } else {
                p.contentEl.classList.remove('etn-force-show');
                p.contentEl.classList.add('etn-force-hide');
            }
        });

        if (!track) return;
        track.querySelectorAll('.etn-icon-btn').forEach(function(btn) {
            btn.classList.toggle('etn-active', btn.dataset.id === id);
        });
        const activeBtn = track.querySelector('.etn-icon-btn[data-id="' + id + '"]');
        if (activeBtn) activeBtn.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
    }

    // ── Pin / unpin ────────────────────────────────────────────────────────────
    function togglePin(id) {
        if (isPinned(id)) {
            pinnedIds = pinnedIds.filter(function(x) { return x !== id; });
        } else {
            pinnedIds.unshift(id);
        }
        savePinned();
        renderIcons(track);
        setActive(activeId);
    }

    // ── Scroll interactions ────────────────────────────────────────────────────
    function setupScrollInteractions(scrollEl) {
        scrollEl.addEventListener('wheel', function(e) {
            if (e.shiftKey) { scrollEl.scrollLeft += e.deltaY; e.preventDefault(); }
        }, { passive: false });

        var tx = 0, sx = 0;
        scrollEl.addEventListener('touchstart', function(e) {
            tx = e.touches[0].clientX; sx = scrollEl.scrollLeft;
        }, { passive: true });
        scrollEl.addEventListener('touchmove', function(e) {
            scrollEl.scrollLeft = sx - (e.touches[0].clientX - tx);
        }, { passive: true });

        var isDown = false, startX = 0, scrollLeft = 0;
        scrollEl.addEventListener('mousedown', function(e) {
            if (e.target.closest('.etn-icon-btn')) return;
            isDown = true; scrollEl.classList.add('dragging');
            startX = e.pageX - scrollEl.offsetLeft;
            scrollLeft = scrollEl.scrollLeft;
        });
        document.addEventListener('mouseup', function() {
            isDown = false; scrollEl.classList.remove('dragging');
        });
        scrollEl.addEventListener('mousemove', function(e) {
            if (!isDown) return;
            e.preventDefault();
            scrollEl.scrollLeft = scrollLeft - (e.pageX - scrollEl.offsetLeft - startX);
        });
    }

    // ── Init ───────────────────────────────────────────────────────────────────
    function init() {
        var attempts = 0;
        var check = setInterval(function() {
            attempts++;
            var col1 = document.getElementById('extensions_settings');
            var hasContent = col1 && col1.querySelector('.inline-drawer .inline-drawer-content');
            if (hasContent) { clearInterval(check); setTimeout(buildNavigator, 400); }
            if (attempts > 60) clearInterval(check);
        }, 300);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    setTimeout(function() {
        if (!document.getElementById('etn-nav')) buildNavigator();
    }, 3000);

})();