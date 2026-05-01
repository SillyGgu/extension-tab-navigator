
(function () {
    'use strict';

	const STORAGE_KEY  = 'etn_pinned_v2';
	const ACTIVE_KEY   = 'etn_active';
	const WIDTH_KEY    = 'etn_panel_width';
	const THEME_KEY    = 'etn_theme';
	const LABELS_KEY   = 'etn_custom_labels';
	const DUMMY_KEY    = 'etn_dummy_pins';

    let pinnedIds = loadPinned();
    let activeId  = null;
    let panels    = [];
    let track     = null;

    function loadPinned() {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
        catch { return []; }
    }
	function loadCustomLabels() {
		try { return JSON.parse(localStorage.getItem(LABELS_KEY)) || {}; }
		catch { return {}; }
	}
	function saveCustomLabels(obj) {
		try { localStorage.setItem(LABELS_KEY, JSON.stringify(obj)); }
		catch(e) {}
	}
	function loadDummyPins() {
		try { return JSON.parse(localStorage.getItem(DUMMY_KEY)) || []; }
		catch { return []; }
	}
	function saveDummyPins(arr) {
		try { localStorage.setItem(DUMMY_KEY, JSON.stringify(arr)); }
		catch(e) {}
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

        // ── .inline-drawer 전체 수집 ──────────────────────────
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

		var customLabels = loadCustomLabels();
		panels = allDrawers.map(function(item, i) {
			const label        = getLabel(item.drawer, i);
			const id           = slugify(label);
			const contentEl    = item.drawer.querySelector('.inline-drawer-content');
			const displayLabel = customLabels[id] || label;
			return { id: id, label: displayLabel, originalLabel: label, icon: guessIcon(label), contentEl: contentEl, drawerEl: item.drawer, col: item.col };
		});

        const currentTheme = loadTheme();

        // ── Build nav ────────────────────────────────────────────────────────
        const nav = document.createElement('div');
        nav.id = 'etn-nav';
        nav.classList.add('etn-theme-' + currentTheme);
		nav.innerHTML =
			'<div id="etn-toolbar">' +
				'<div class="etn-width-group">' +
					'<span class="etn-toolbar-label">너비</span>' +
					'<input id="etn-width-slider" type="range" min="30" max="100" step="1" value="' + loadWidth() + '" />' +
					'<span id="etn-width-value" class="etn-toolbar-value">' + loadWidth() + '%</span>' +
				'</div>' +
				'<div class="etn-toolbar-sep"></div>' +
				'<div class="etn-toolbar-actions">' +
					'<button id="etn-settings-btn" class="etn-toolbar-btn" title="설정 (고정/이름변경)">' +
						'<i class="fa-solid fa-sliders"></i>' +
					'</button>' +
					'<div class="etn-toolbar-divider"></div>' +
					'<button id="etn-theme-toggle" class="etn-toolbar-btn" title="' + (currentTheme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환') + '">' +
						'<i class="fa-solid ' + (currentTheme === 'dark' ? 'fa-sun' : 'fa-moon') + '"></i>' +
					'</button>' +
				'</div>' +
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

        // ── 헤더 hide + content class 토글 ────────────────────
        panels.forEach(function(p) {
            p.drawerEl.classList.add('etn-managed-drawer');
            p.contentEl.classList.add('etn-force-hide');
        });

        var registeredDrawers = new Set(panels.map(function(p) { return p.drawerEl; }));
        [col1, col2].forEach(function(col) {
            if (!col) return;
            Array.from(col.children).forEach(function(child) {
                if (child.tagName === 'STYLE' || child.tagName === 'SCRIPT' || child.tagName === 'HR') return;
                var hasRegistered = child.querySelector && Array.from(
                    child.querySelectorAll('.inline-drawer')
                ).some(function(d) { return registeredDrawers.has(d); });
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

        setupScrollInteractions(nav.querySelector('#etn-icon-track'));

        const slider   = nav.querySelector('#etn-width-slider');
        const widthVal = nav.querySelector('#etn-width-value');
        applyPanelWidth(loadWidth());
        slider.addEventListener('input', function() {
            const w = parseInt(this.value, 10);
            widthVal.textContent = w + '%';
            applyPanelWidth(w);
            saveWidth(w);
        });

        nav.querySelector('#etn-theme-toggle').addEventListener('click', function() {
            const isDark = document.getElementById('etn-nav').classList.contains('etn-theme-dark');
            const next = isDark ? 'light' : 'dark';
            saveTheme(next);
            applyTheme(next);
        });
		nav.querySelector('#etn-settings-btn').addEventListener('click', function(e) {
			e.stopPropagation();
			var existing = document.getElementById('etn-settings-popup');
			if (existing) {
				closeSettingsPopup();
			} else {
				openSettingsPopup();
			}
		});
	syncDummyPins();	
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
        const pinned   = pinnedIds.map(function(id) { return panels.find(function(p) { return p.id === id; }); }).filter(Boolean);
        const unpinned = panels.filter(function(p) { return !isPinned(p.id); });

        function makeAppIcon(p) {
            const btn = document.createElement('div');
            btn.className = 'etn-icon-btn' +
                (isPinned(p.id) ? ' etn-pinned' : '') +
                (p.id === activeId ? ' etn-active' : '');
            btn.dataset.id = p.id;
            btn.title = p.label;
            btn.setAttribute('tabindex', '0');
            btn.setAttribute('role', 'button');
            btn.innerHTML =
                '<div class="etn-pin-dot"></div>' +
                '<div class="etn-icon-inner"><i class="fa-solid ' + p.icon + '"></i></div>' +
                '<span class="etn-icon-label">' + p.label + '</span>';

            btn.addEventListener('click', function(e) { setActive(p.id); });
            btn.addEventListener('contextmenu', function(e) {
                e.preventDefault();
                togglePin(p.id);
            });
            btn.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') setActive(p.id);
            });
            return btn;
        }

        // 고정 아이콘
        pinned.forEach(function(p) { trackEl.appendChild(makeAppIcon(p)); });

        // 고정/미고정 사이 구분선 (점선 행 분리)
        if (pinned.length > 0 && unpinned.length > 0) {
            const divider = document.createElement('div');
            divider.id = 'etn-track-divider';
            trackEl.appendChild(divider);
        }

        // 미고정 아이콘
        unpinned.forEach(function(p) { trackEl.appendChild(makeAppIcon(p)); });
    }

    // ── Activate panel ──────────────────────────────────
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
	
	function openSettingsPopup() {
		if (document.getElementById('etn-settings-popup')) {
			closeSettingsPopup();
			return;
		}

		var customLabels = loadCustomLabels();
		var dummyPins    = loadDummyPins();

		// 현재 실제 패널 + 더미 합쳐서 목록 구성
		var allItems = panels.map(function(p) {
			return { id: p.id, label: customLabels[p.id] || p.label, originalLabel: p.label, isDummy: false };
		});
		dummyPins.forEach(function(d) {
			if (!allItems.find(function(x) { return x.id === d.id; })) {
				allItems.push({ id: d.id, label: customLabels[d.id] || d.label, originalLabel: d.label, isDummy: true });
			}
		});

		// 고정된 항목 순서대로 정렬 (고정된것 먼저, 나머지는 원래 순서)
		var orderedItems = [
			...pinnedIds.map(function(id) { return allItems.find(function(x) { return x.id === id; }); }).filter(Boolean),
			...allItems.filter(function(x) { return !isPinned(x.id); })
		];

		var popup = document.createElement('div');
		popup.id = 'etn-settings-popup';

		function renderPopupContent() {
			var customLabels = loadCustomLabels();
			var dummyPins    = loadDummyPins();

			var allItems = panels.map(function(p) {
				return { id: p.id, label: customLabels[p.id] || p.originalLabel, originalLabel: p.originalLabel, isDummy: false };
			});
			dummyPins.forEach(function(d) {
				if (!allItems.find(function(x) { return x.id === d.id; })) {
					allItems.push({ id: d.id, label: customLabels[d.id] || d.label, originalLabel: d.label, isDummy: true });
				}
			});

			var orderedItems = [
				...pinnedIds.map(function(id) { return allItems.find(function(x) { return x.id === id; }); }).filter(Boolean),
				...allItems.filter(function(x) { return !isPinned(x.id); })
			];

			popup.innerHTML =
				'<div id="etn-sp-header">' +
					'<span id="etn-sp-title"><i class="fa-solid fa-gear"></i> 설정</span>' +
					'<button id="etn-sp-close"><i class="fa-solid fa-xmark"></i></button>' +
				'</div>' +
				'<div id="etn-sp-body">' +
					'<p class="etn-sp-section-title">고정 항목 순서 / 이름 변경</p>' +
					'<p class="etn-sp-hint">고정된 항목은 위에 표시되며 드래그로 순서를 변경할 수 있습니다.<br>🔴 는 삭제된 extension의 더미 데이터입니다.</p>' +
					'<ul id="etn-sp-list">' +
					orderedItems.map(function(item) {
						var pinned = isPinned(item.id);
						var hasCustom = item.label !== item.originalLabel;
						var isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
						var moveButtons = '';
						if (isTouchDevice && pinned) {
							var isFirst = pinnedIds.indexOf(item.id) === 0;
							var isLast  = pinnedIds.indexOf(item.id) === pinnedIds.length - 1;
							moveButtons =
								'<button class="etn-sp-move-up" data-id="' + item.id + '" title="위로" style="' + (isFirst ? 'opacity:0.25;pointer-events:none;' : '') + '">' +
									'<i class="fa-solid fa-chevron-up"></i>' +
								'</button>' +
								'<button class="etn-sp-move-down" data-id="' + item.id + '" title="아래로" style="' + (isLast ? 'opacity:0.25;pointer-events:none;' : '') + '">' +
									'<i class="fa-solid fa-chevron-down"></i>' +
								'</button>';
						}
						return '<li class="etn-sp-item' + (item.isDummy ? ' etn-sp-dummy' : '') + (pinned ? ' etn-sp-pinned' : '') + '" data-id="' + item.id + '" draggable="' + (pinned && !isTouchDevice ? 'true' : 'false') + '">' +
							(isTouchDevice
								? moveButtons
								: '<span class="etn-sp-drag-handle' + (pinned ? '' : ' etn-sp-drag-disabled') + '" title="' + (pinned ? '드래그하여 순서 변경' : '고정된 항목만 순서 변경 가능') + '"><i class="fa-solid fa-grip-vertical"></i></span>'
							) +
							'<span class="etn-sp-badge">' + (item.isDummy ? '🔴' : (pinned ? '📌' : '')) + '</span>' +
							'<div class="etn-sp-label-wrap">' +
								'<span class="etn-sp-orig-label">' + escapeHtml(item.originalLabel) + '</span>' +
								'<input class="etn-sp-label-input" type="text" value="' + escapeHtml(item.label) + '" data-id="' + item.id + '" data-orig="' + escapeHtml(item.originalLabel) + '" placeholder="표시 이름 (비우면 원본 사용)" />' +
							'</div>' +
							'<button class="etn-sp-pin-btn' + (pinned ? ' active' : '') + '" data-id="' + item.id + '" title="' + (pinned ? '고정 해제' : '고정') + '">' +
								'<i class="fa-solid fa-thumbtack' + (pinned ? '' : ' fa-rotate-90') + '"></i>' +
							'</button>' +
							'<button class="etn-sp-del-btn" data-id="' + item.id + '" title="목록에서 제거">' +
								'<i class="fa-solid fa-trash"></i>' +
							'</button>' +
						'</li>';
					}).join('') +
					'</ul>' +
				'</div>' +
				'<div id="etn-sp-footer">' +
					'<button id="etn-sp-save"><i class="fa-solid fa-check"></i> 저장</button>' +
				'</div>';

			popup.querySelector('#etn-sp-close').addEventListener('click', closeSettingsPopup);

			// 이름 저장 (저장 버튼)
			popup.querySelector('#etn-sp-save').addEventListener('click', function() {
				var labels = loadCustomLabels();
				popup.querySelectorAll('.etn-sp-label-input').forEach(function(inp) {
					var id  = inp.dataset.id;
					var val = inp.value.trim();
					var panel = panels.find(function(p) { return p.id === id; });
					var orig  = panel ? panel.originalLabel : id;
					if (val && val !== orig) {
						labels[id] = val;
					} else {
						delete labels[id];
					}
				});
				saveCustomLabels(labels);
				panels.forEach(function(p) {
					if (labels[p.id]) p.label = labels[p.id];
					else p.label = p.originalLabel;
				});
				renderIcons(track);
				closeSettingsPopup();
			});
			popup.querySelectorAll('.etn-sp-pin-btn').forEach(function(btn) {
				btn.addEventListener('click', function(e) {
					e.stopPropagation();
					var id = btn.dataset.id;
					togglePin(id);
					renderPopupContent();
				});
			});

			// 삭제 버튼
			popup.querySelectorAll('.etn-sp-del-btn').forEach(function(btn) {
				btn.addEventListener('click', function(e) {
					e.stopPropagation();
					var id = btn.dataset.id;
					if (isPinned(id)) {
						pinnedIds = pinnedIds.filter(function(x) { return x !== id; });
						savePinned();
					}
					var dummies = loadDummyPins().filter(function(d) { return d.id !== id; });
					saveDummyPins(dummies);
					var lbl = loadCustomLabels();
					delete lbl[id];
					saveCustomLabels(lbl);
					renderIcons(track);
					renderPopupContent();
				});
			});

			// 드래그 앤 드롭
			var isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

			if (!isTouchDevice) {
				var dragSrcId = null;
				var allDraggables = popup.querySelectorAll('.etn-sp-item[draggable="true"]');

				function clearDropIndicators() {
					popup.querySelectorAll('.etn-sp-item').forEach(function(x) {
						x.classList.remove('etn-sp-dragover', 'etn-sp-drop-above', 'etn-sp-drop-below');
					});
				}

				allDraggables.forEach(function(li) {
					li.addEventListener('dragstart', function(e) {
						dragSrcId = li.dataset.id;
						li.classList.add('etn-sp-dragging');
						e.dataTransfer.effectAllowed = 'move';
					});
					li.addEventListener('dragend', function() {
						li.classList.remove('etn-sp-dragging');
						clearDropIndicators();
					});
					li.addEventListener('dragover', function(e) {
						e.preventDefault();
						if (li.dataset.id === dragSrcId || !isPinned(li.dataset.id)) return;
						clearDropIndicators();
						var rect = li.getBoundingClientRect();
						var midY = rect.top + rect.height / 2;
						if (e.clientY < midY) {
							li.classList.add('etn-sp-drop-above');
						} else {
							li.classList.add('etn-sp-drop-below');
						}
					});
					li.addEventListener('dragleave', function(e) {
						if (li.contains(e.relatedTarget)) return;
						li.classList.remove('etn-sp-drop-above', 'etn-sp-drop-below');
					});
					li.addEventListener('drop', function(e) {
						e.preventDefault();
						var isAbove = li.classList.contains('etn-sp-drop-above');
						clearDropIndicators();
						if (!dragSrcId || dragSrcId === li.dataset.id) return;
						var toId = li.dataset.id;
						if (!isPinned(toId)) return;
						var fromIdx = pinnedIds.indexOf(dragSrcId);
						var toIdx   = pinnedIds.indexOf(toId);
						if (fromIdx === -1 || toIdx === -1) return;
						pinnedIds.splice(fromIdx, 1);
						var newToIdx = pinnedIds.indexOf(toId);
						if (isAbove) {
							pinnedIds.splice(newToIdx, 0, dragSrcId);
						} else {
							pinnedIds.splice(newToIdx + 1, 0, dragSrcId);
						}
						savePinned();
						renderIcons(track);
						renderPopupContent();
					});
				});
			} else {
				// 모바일: 화살표 버튼으로 순서 변경
				popup.querySelectorAll('.etn-sp-move-up, .etn-sp-move-down').forEach(function(btn) {
					btn.addEventListener('click', function(e) {
						e.stopPropagation();
						var id  = btn.dataset.id;
						var dir = btn.classList.contains('etn-sp-move-up') ? -1 : 1;
						if (!isPinned(id)) return;
						var idx = pinnedIds.indexOf(id);
						if (idx === -1) return;
						var newIdx = idx + dir;
						if (newIdx < 0 || newIdx >= pinnedIds.length) return;
						pinnedIds.splice(idx, 1);
						pinnedIds.splice(newIdx, 0, id);
						savePinned();
						renderIcons(track);
						renderPopupContent();
					});
				});
			}
		}

		renderPopupContent();

		popup.addEventListener('click', function(e) { e.stopPropagation(); });
		popup.addEventListener('mousedown', function(e) { e.stopPropagation(); });
		popup.addEventListener('pointerdown', function(e) { e.stopPropagation(); });

		var nav = document.getElementById('etn-nav');
		nav.appendChild(popup);

		setTimeout(function() {
			document.addEventListener('pointerdown', outsideClickHandler, true);
		}, 0);
	}

	function outsideClickHandler(e) {
		var popup = document.getElementById('etn-settings-popup');
		if (!popup) { document.removeEventListener('pointerdown', outsideClickHandler, true); return; }
		var settingsBtn = document.getElementById('etn-settings-btn');
		if (settingsBtn && settingsBtn.contains(e.target)) return;
		if (!popup.contains(e.target)) {
			closeSettingsPopup();
		}
	}

	function closeSettingsPopup() {
		var popup = document.getElementById('etn-settings-popup');
		if (popup) popup.remove();
		document.removeEventListener('pointerdown', outsideClickHandler, true);
	}

	function escapeHtml(str) {
		return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
	}

	// 더미 데이터 동기화 
	function syncDummyPins() {
		var dummies = loadDummyPins();
		pinnedIds.forEach(function(id) {
			var panel = panels.find(function(p) { return p.id === id; });
			if (!panel && !dummies.find(function(d) { return d.id === id; })) {
				dummies.push({ id: id, label: id });
				saveDummyPins(dummies);
			}
		});
	}

    // ── Scroll interactions ────────────────────────────────────────────────────
    function setupScrollInteractions(scrollEl) {
        // PC: 휠 스크롤 (Shift 없이도 가로 스크롤)
        scrollEl.addEventListener('wheel', function(e) {
            scrollEl.scrollLeft += e.deltaY || e.deltaX;
            e.preventDefault();
        }, { passive: false });

        // 모바일 터치 스크롤
        var tx = 0, sx = 0;
        scrollEl.addEventListener('touchstart', function(e) {
            tx = e.touches[0].clientX;
            sx = scrollEl.scrollLeft;
        }, { passive: true });
        scrollEl.addEventListener('touchmove', function(e) {
            scrollEl.scrollLeft = sx - (e.touches[0].clientX - tx);
        }, { passive: true });

        // PC 마우스 드래그 스크롤
        var isDown = false, startX = 0, scrollStart = 0, didDrag = false;
        scrollEl.addEventListener('mousedown', function(e) {
            if (e.target.closest('input, textarea, select, button, a')) return;
            if (e.target.isContentEditable) return;
            isDown = true;
            didDrag = false;
            scrollEl.classList.add('dragging');
            startX = e.clientX;
            scrollStart = scrollEl.scrollLeft;
        });
        document.addEventListener('mouseup', function() {
            isDown = false;
            scrollEl.classList.remove('dragging');
        });
        scrollEl.addEventListener('mousemove', function(e) {
            if (!isDown) return;
            const delta = e.clientX - startX;
            if (Math.abs(delta) > 3) didDrag = true;
            if (!didDrag) return;
            e.preventDefault();
            scrollEl.scrollLeft = scrollStart - delta;
        });
        scrollEl.addEventListener('click', function(e) {
            if (didDrag) { e.stopPropagation(); didDrag = false; }
        }, true);
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

/* ═══════════════════════════════════════════════════════════════════════════
   QR UI Extension
   - Global QR Sets 검색
   - Edit QR 커스텀 드롭다운 (폴더 + 접기/열기)
   - 툴바 QR 버튼 → 설정 팝업 (폴더 관리 포함)
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
    'use strict';

    /* ── 스토리지 키 ──────────────────────────────────────────── */
    const QREXT_ENABLED_KEY = 'qrext_enabled';
    const QREXT_FOLDERS_KEY = 'qrext_folders';
    const QREXT_FOLDED_KEY  = 'qrext_folded';
    const QREXT_FOLDER_ORDER_KEY = 'qrext_folder_order';
	
    /* ── 상태 ────────────────────────────────────────────────── */
    let qrEnabled     = loadQrEnabled();
    let qrFolders     = loadQrFolders();
    let qrFolded      = loadQrFolded();
    let qrFolderOrder = loadQrFolderOrder();

    function loadQrEnabled()     { try { const v = localStorage.getItem(QREXT_ENABLED_KEY); return v === null ? true : v === 'true'; } catch { return true; } }
    function saveQrEnabled(v)    { try { localStorage.setItem(QREXT_ENABLED_KEY, String(v)); } catch {} }
    function loadQrFolders()     { try { return JSON.parse(localStorage.getItem(QREXT_FOLDERS_KEY)) || {}; } catch { return {}; } }
    function saveQrFolders()     { try { localStorage.setItem(QREXT_FOLDERS_KEY, JSON.stringify(qrFolders)); } catch {} }
    function loadQrFolded()      { try { return new Set(JSON.parse(localStorage.getItem(QREXT_FOLDED_KEY)) || []); } catch { return new Set(); } }
    function saveQrFolded()      { try { localStorage.setItem(QREXT_FOLDED_KEY, JSON.stringify([...qrFolded])); } catch {} }
    function loadQrFolderOrder() { try { return JSON.parse(localStorage.getItem(QREXT_FOLDER_ORDER_KEY)) || []; } catch { return []; } }
    function saveQrFolderOrder() { try { localStorage.setItem(QREXT_FOLDER_ORDER_KEY, JSON.stringify(qrFolderOrder)); } catch {} }

    function getOrderedFolderNames() {
        const allKeys = Object.keys(qrFolders);
        const ordered = qrFolderOrder.filter(n => allKeys.includes(n));
        const rest    = allKeys.filter(n => !ordered.includes(n));
        return [...ordered, ...rest];
    }

    function qrEscHtml(str) {
        return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    /* ── QR DOM 탐색 ─────────────────────────────────────────── */
    function getQrContainer()    { return document.getElementById('qr_container'); }
    function getEditorSetSelect(){ const c = getQrContainer(); return c && c.querySelector('#qr--editor #qr--set'); }
    function getAllSetNames() {
        const sel = getEditorSetSelect();
        if (!sel) return [];
        return Array.from(sel.options).map(o => o.value).filter(Boolean);
    }

    /* ─────────────────────────────────────────────────────────
       1. Global QR Sets 검색
    ───────────────────────────────────────────────────────── */
    function installGlobalSearch() {
        const cont = getQrContainer();
        if (!cont) return;
        const targetSections = ['#qr--global', '#qr--chat', '#qr--character'];
        let anyFound = false;
        targetSections.forEach(selector => {
            const sectionDiv = cont.querySelector(selector);
            if (!sectionDiv) return;
            const setListItems = sectionDiv.querySelectorAll('.qr--item');
            if (!setListItems.length) return;
            anyFound = true;
            setListItems.forEach(item => {
                const nativeSel = item.querySelector('select.qr--set');
                if (!nativeSel || nativeSel.dataset.qrextGlobalHooked) return;
                nativeSel.dataset.qrextGlobalHooked = '1';
                nativeSel.classList.add('qrext-hidden-select');

                const wrap = document.createElement('div');
                wrap.className = 'qrext-custom-dropdown qrext-global-dropdown';
                nativeSel.insertAdjacentElement('afterend', wrap);

            function buildGlobalDropdown() {
                const options = Array.from(nativeSel.options).map(o => o.value).filter(Boolean);
                const selectedText = nativeSel.selectedOptions[0] ? nativeSel.selectedOptions[0].text : (options[0] || '세트 선택...');

                wrap.innerHTML =
                    '<div class="qrext-dd-trigger" role="button" tabindex="0">' +
                        '<span class="qrext-dd-selected-text">' + qrEscHtml(selectedText) + '</span>' +
                        '<i class="fa-solid fa-chevron-down qrext-dd-arrow"></i>' +
                    '</div>' +
                    '<div class="qrext-dd-panel" style="display:none;">' +
                        '<div class="qrext-dd-search-wrap">' +
                            '<i class="fa-solid fa-magnifying-glass"></i>' +
                            '<input class="qrext-dd-search" type="text" placeholder="세트 검색..." autocomplete="off" />' +
                        '</div>' +
                        '<div class="qrext-dd-list"></div>' +
                    '</div>';

                const trigger  = wrap.querySelector('.qrext-dd-trigger');
                const panel    = wrap.querySelector('.qrext-dd-panel');
                const listEl   = wrap.querySelector('.qrext-dd-list');
                const searchEl = wrap.querySelector('.qrext-dd-search');
                const arrow    = wrap.querySelector('.qrext-dd-arrow');
                let isOpen = false;

                function openPanel()  { panel.style.display = 'block'; arrow.style.transform = 'rotate(180deg)'; isOpen = true; renderList(''); searchEl.value = ''; searchEl.focus(); }
                function closePanel() { panel.style.display = 'none';  arrow.style.transform = ''; isOpen = false; }

                trigger.addEventListener('click', () => isOpen ? closePanel() : openPanel());
                trigger.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); isOpen ? closePanel() : openPanel(); } });
                searchEl.addEventListener('input', () => renderList(searchEl.value));

                const outsideClose = e => { if (!wrap.contains(e.target)) closePanel(); };
                document.addEventListener('pointerdown', outsideClose);

                function selectOption(val) {
                    nativeSel.value = val;
                    nativeSel.dispatchEvent(new Event('change', { bubbles: true }));
                    const opt = Array.from(nativeSel.options).find(o => o.value === val);
                    wrap.querySelector('.qrext-dd-selected-text').textContent = opt ? opt.text : val;
                    closePanel();
                }

                function renderList(query) {
                    const q = query.trim().toLowerCase();
                    listEl.innerHTML = '';
                    const filtered = options.filter(v => !q || v.toLowerCase().includes(q));
                    if (!filtered.length) {
                        listEl.innerHTML = '<div class="qrext-dd-empty">검색 결과 없음</div>';
                        return;
                    }
                    filtered.forEach(val => {
                        const el = document.createElement('div');
                        el.className = 'qrext-dd-item' + (val === nativeSel.value ? ' qrext-dd-item-active' : '');
                        el.textContent = val;
                        el.addEventListener('click', () => selectOption(val));
                        listEl.appendChild(el);
                    });
                }

                nativeSel.addEventListener('change', () => {
                    const opt = nativeSel.selectedOptions[0];
                    const txt = wrap.querySelector('.qrext-dd-selected-text');
                    if (txt && opt) txt.textContent = opt.text;
                });

                const obs = new MutationObserver(() => {
                    wrap.remove();
                    delete nativeSel.dataset.qrextGlobalHooked;
                    nativeSel.classList.remove('qrext-hidden-select');
                    installGlobalSearch();
                });
                obs.observe(nativeSel, { childList: true });
            }

                buildGlobalDropdown();
            });
        });
    }

    /* ─────────────────────────────────────────────────────────
       2. Edit QR 커스텀 드롭다운
    ───────────────────────────────────────────────────────── */
    function installEditorDropdown() {
        const cont = getQrContainer();
        if (!cont) return;
        const editorDiv = cont.querySelector('#qr--editor');
        if (!editorDiv) return;
        const nativeSel = editorDiv.querySelector('#qr--set');
        if (!nativeSel || nativeSel.dataset.qrextHooked) return;
        nativeSel.dataset.qrextHooked = '1';
        nativeSel.classList.add('qrext-hidden-select');

        const customWrap = document.createElement('div');
        customWrap.className = 'qrext-custom-dropdown';
        customWrap.id = 'qrext-editor-dropdown';
        nativeSel.insertAdjacentElement('afterend', customWrap);

        function buildDropdown() {
            const allNames  = getAllSetNames();
            const inFolder  = new Set();
            Object.values(qrFolders).forEach(arr => arr.forEach(n => inFolder.add(n)));
            const ungrouped = allNames.filter(n => !inFolder.has(n));
            const selectedText = nativeSel.selectedOptions[0] ? nativeSel.selectedOptions[0].text : (nativeSel.value || '세트 선택...');

            customWrap.innerHTML =
                '<div class="qrext-dd-trigger" role="button" tabindex="0">' +
                    '<span class="qrext-dd-selected-text">' + qrEscHtml(selectedText) + '</span>' +
                    '<i class="fa-solid fa-chevron-down qrext-dd-arrow"></i>' +
                '</div>' +
                '<div class="qrext-dd-panel" style="display:none;">' +
                    '<div class="qrext-dd-search-wrap">' +
                        '<i class="fa-solid fa-magnifying-glass"></i>' +
                        '<input class="qrext-dd-search" type="text" placeholder="세트 검색..." autocomplete="off" />' +
                    '</div>' +
                    '<div class="qrext-dd-list"></div>' +
                '</div>';

            const trigger  = customWrap.querySelector('.qrext-dd-trigger');
            const panel    = customWrap.querySelector('.qrext-dd-panel');
            const listEl   = customWrap.querySelector('.qrext-dd-list');
            const searchEl = customWrap.querySelector('.qrext-dd-search');
            const arrow    = customWrap.querySelector('.qrext-dd-arrow');
            let isOpen = false;

            function openPanel()  { panel.style.display = 'block'; arrow.style.transform = 'rotate(180deg)'; isOpen = true; renderDdList(''); searchEl.value = ''; searchEl.focus(); }
            function closePanel() { panel.style.display = 'none';  arrow.style.transform = ''; isOpen = false; }

            trigger.addEventListener('click', () => isOpen ? closePanel() : openPanel());
            trigger.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); isOpen ? closePanel() : openPanel(); } });
            searchEl.addEventListener('input', () => renderDdList(searchEl.value));

            const outsideClose = e => { if (!customWrap.contains(e.target)) closePanel(); };
            document.addEventListener('pointerdown', outsideClose);

            function selectSet(name) {
                nativeSel.value = name;
                nativeSel.dispatchEvent(new Event('change', { bubbles: true }));
                const opt = Array.from(nativeSel.options).find(o => o.value === name);
                customWrap.querySelector('.qrext-dd-selected-text').textContent = opt ? opt.text : name;
                closePanel();
            }

            function renderDdList(query) {
                const q = query.trim().toLowerCase();
                listEl.innerHTML = '';

                Object.entries(qrFolders).forEach(([fname, sets]) => {
                    const filtered = sets.filter(s => allNames.includes(s) && (!q || s.toLowerCase().includes(q)));
                    if (!filtered.length) return;
                    const isFolded = qrFolded.has(fname);
                    const folderEl = document.createElement('div');
                    folderEl.className = 'qrext-dd-folder';
                    folderEl.innerHTML =
                        '<div class="qrext-dd-folder-header">' +
                            '<i class="fa-solid ' + (isFolded ? 'fa-folder' : 'fa-folder-open') + ' qrext-folder-icon"></i>' +
                            '<span class="qrext-dd-folder-name">' + qrEscHtml(fname) + '</span>' +
                            '<span class="qrext-dd-folder-count">' + filtered.length + '</span>' +
                            '<i class="fa-solid ' + (isFolded ? 'fa-chevron-right' : 'fa-chevron-down') + ' qrext-folder-chevron"></i>' +
                        '</div>';
                    const itemsEl = document.createElement('div');
                    itemsEl.className = 'qrext-dd-folder-items' + (isFolded && !q ? ' qrext-dd-folded' : '');
                    filtered.forEach(name => {
                        const item = document.createElement('div');
                        item.className = 'qrext-dd-item' + (name === nativeSel.value ? ' qrext-dd-item-active' : '');
                        item.textContent = name;
                        item.addEventListener('click', () => selectSet(name));
                        itemsEl.appendChild(item);
                    });
                    folderEl.appendChild(itemsEl);
                    folderEl.querySelector('.qrext-dd-folder-header').addEventListener('click', () => {
                        if (q) return;
                        if (qrFolded.has(fname)) qrFolded.delete(fname); else qrFolded.add(fname);
                        saveQrFolded();
                        renderDdList(searchEl.value);
                    });
                    listEl.appendChild(folderEl);
                });

                const ungroupedFiltered = ungrouped.filter(n => !q || n.toLowerCase().includes(q));
                if (ungroupedFiltered.length) {
                    if (Object.keys(qrFolders).length) {
                        const lbl = document.createElement('div');
                        lbl.className = 'qrext-dd-group-label';
                        lbl.textContent = '미분류';
                        listEl.appendChild(lbl);
                    }
                    ungroupedFiltered.forEach(name => {
                        const item = document.createElement('div');
                        item.className = 'qrext-dd-item' + (name === nativeSel.value ? ' qrext-dd-item-active' : '');
                        item.textContent = name;
                        item.addEventListener('click', () => selectSet(name));
                        listEl.appendChild(item);
                    });
                }
                if (!listEl.children.length) listEl.innerHTML = '<div class="qrext-dd-empty">검색 결과 없음</div>';
            }
        }

        buildDropdown();

        nativeSel.addEventListener('change', () => {
            const opt = nativeSel.selectedOptions[0];
            const dd = customWrap.querySelector('.qrext-dd-selected-text');
            if (dd && opt) dd.textContent = opt.text;
        });

        const obs = new MutationObserver(() => {
            customWrap.remove();
            delete nativeSel.dataset.qrextHooked;
            nativeSel.classList.remove('qrext-hidden-select');
            installEditorDropdown();
        });
        obs.observe(nativeSel, { childList: true });
    }

    /* ─────────────────────────────────────────────────────────
       3. 툴바 버튼
    ───────────────────────────────────────────────────────── */
    function installQrToolbarButton() {
        const toolbar = document.getElementById('etn-toolbar');
        if (!toolbar || toolbar.querySelector('#qrext-toggle-btn')) return;
        const settingsBtn = toolbar.querySelector('#etn-settings-btn');
        const btn = document.createElement('button');
        btn.id = 'qrext-toggle-btn';
        btn.className = 'etn-toolbar-btn' + (qrEnabled ? ' qrext-active' : '');
        btn.title = 'QR UI 확장 설정';
        btn.innerHTML = '<i class="fa-solid fa-qrcode"></i>';
        btn.addEventListener('click', e => {
            e.stopPropagation();
            document.getElementById('qrext-popup') ? closeQrextPopup() : openQrextPopup();
        });
        if (settingsBtn) settingsBtn.insertAdjacentElement('beforebegin', btn);
        else toolbar.appendChild(btn);
    }

    /* ─────────────────────────────────────────────────────────
       4. QR 확장 팝업
    ───────────────────────────────────────────────────────── */
    function openQrextPopup() {
        if (document.getElementById('qrext-popup')) return;
        const nav = document.getElementById('etn-nav');
        if (!nav) return;
        const popup = document.createElement('div');
        popup.id = 'qrext-popup';
        renderQrextPopup(popup);
        nav.appendChild(popup);
        setTimeout(() => document.addEventListener('pointerdown', qrextOutsideHandler, true), 0);
    }

    function renderQrextPopup(popup) {
        popup.innerHTML =
            '<div class="qrext-popup-header">' +
                '<span class="qrext-popup-title"><i class="fa-solid fa-qrcode"></i> QR UI 확장 설정</span>' +
                '<button class="qrext-popup-close"><i class="fa-solid fa-xmark"></i></button>' +
            '</div>' +
            '<div class="qrext-popup-body">' +
                '<div class="qrext-section">' +
                    '<div class="qrext-section-title">전체 기능</div>' +
                    '<label class="qrext-toggle-row">' +
                        '<span>QR UI 확장 활성화</span>' +
                        '<div class="qrext-toggle ' + (qrEnabled ? 'qrext-toggle-on' : '') + '" id="qrext-main-toggle" role="switch" tabindex="0" aria-checked="' + qrEnabled + '">' +
                            '<div class="qrext-toggle-knob"></div>' +
                        '</div>' +
                    '</label>' +
                '</div>' +
                '<div class="qrext-section">' +
                    '<div class="qrext-section-title">설정 백업 / 복원</div>' +
                    '<p class="qrext-backup-hint">폴더 구조, 순서, 활성화 여부를 JSON 파일로 내보내거나 불러옵니다.</p>' +
                    '<div class="qrext-backup-row">' +
                        '<button class="qrext-backup-btn qrext-backup-export" id="qrext-export-btn"><i class="fa-solid fa-download"></i> 내보내기</button>' +
                        '<button class="qrext-backup-btn qrext-backup-import" id="qrext-import-btn"><i class="fa-solid fa-upload"></i> 불러오기</button>' +
                        '<input type="file" id="qrext-import-file" accept=".json" style="display:none" />' +
                    '</div>' +
                '</div>' +
                '<div class="qrext-section">' +
                    '<div class="qrext-section-title">초기화</div>' +
                    '<button class="qrext-reset-btn" id="qrext-reset-btn"><i class="fa-solid fa-rotate-left"></i> 모든 QR 설정 초기화</button>' +
                '</div>' +
                '<div class="qrext-section">' +
                    '<div class="qrext-section-title">Edit QR 폴더 관리' +
                        '<button class="qrext-new-folder-btn" id="qrext-new-folder-btn"><i class="fa-solid fa-plus"></i> 새 폴더</button>' +
                    '</div>' +
                    '<div class="qrext-folder-hint">세트 항목을 드래그해서 폴더로 이동 / 같은 폴더 내에서 ↑↓ 순서 변경 가능합니다.</div>' +
                    '<div id="qrext-folder-list"></div>' +
                '</div>' +
            '</div>';

        popup.querySelector('.qrext-popup-close').addEventListener('click', closeQrextPopup);

        const toggle = popup.querySelector('#qrext-main-toggle');
        const doToggle = () => {
            qrEnabled = !qrEnabled;
            saveQrEnabled(qrEnabled);
            toggle.classList.toggle('qrext-toggle-on', qrEnabled);
            toggle.setAttribute('aria-checked', String(qrEnabled));
            document.getElementById('qrext-toggle-btn') && document.getElementById('qrext-toggle-btn').classList.toggle('qrext-active', qrEnabled);
            qrEnabled ? applyQrExtension() : removeQrExtension();
        };
        toggle.addEventListener('click', doToggle);
        toggle.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') doToggle(); });

        popup.querySelector('#qrext-new-folder-btn').addEventListener('click', () => {
            const name = prompt('새 폴더 이름:');
            if (!name || !name.trim()) return;
            const t = name.trim();
            if (qrFolders[t]) { alert('이미 존재하는 이름입니다.'); return; }
            qrFolders[t] = [];
            saveQrFolders();
            refreshQrFolderList(popup);
        });

        // ── 내보내기 ──────────────────────────────────────────────
        popup.querySelector('#qrext-export-btn').addEventListener('click', () => {
            const backup = {
                version: 1,
                exportedAt: new Date().toISOString(),
                qrEnabled: qrEnabled,
                qrFolders: qrFolders,
                qrFolderOrder: qrFolderOrder,
                qrFolded: [...qrFolded],
            };
            const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
            const url  = URL.createObjectURL(blob);
            const a    = document.createElement('a');
            a.href     = url;
            a.download = 'qrext_backup_' + new Date().toISOString().slice(0,10) + '.json';
            document.body.appendChild(a);
            a.click();
            setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1000);
        });

        // ── 불러오기 ──────────────────────────────────────────────
        const importFile = popup.querySelector('#qrext-import-file');
        popup.querySelector('#qrext-import-btn').addEventListener('click', () => {
            importFile.value = '';
            importFile.click();
        });
        importFile.addEventListener('change', () => {
            const file = importFile.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    if (!data || typeof data.qrFolders !== 'object') {
                        alert('올바른 백업 파일이 아닙니다.');
                        return;
                    }
                    if (!confirm('현재 설정을 백업 파일로 덮어씁니다. 계속할까요?')) return;
                    qrFolders = data.qrFolders || {};
                    qrFolderOrder = data.qrFolderOrder || [];
                    qrFolded = new Set(data.qrFolded || []);
                    saveQrFolders();
                    saveQrFolderOrder();
                    saveQrFolded();
                    if (typeof data.qrEnabled === 'boolean') {
                        qrEnabled = data.qrEnabled;
                        saveQrEnabled(qrEnabled);
                    }
                    renderQrextPopup(popup);
                } catch {
                    alert('파일을 읽는 중 오류가 발생했습니다.');
                }
            };
            reader.readAsText(file);
        });

        popup.addEventListener('click', e => e.stopPropagation());
        popup.addEventListener('pointerdown', e => e.stopPropagation());
        popup.querySelector('#qrext-reset-btn').addEventListener('click', () => {
            if (!confirm('QR 확장의 모든 설정(폴더, 순서, 활성화 여부)을 초기화할까요? 이 작업은 되돌릴 수 없습니다.')) return;
            qrFolders = {}; qrFolderOrder = []; qrFolded = new Set(); qrEnabled = true;
            saveQrFolders(); saveQrFolderOrder(); saveQrFolded(); saveQrEnabled(true);
            renderQrextPopup(popup);
        });
        refreshQrFolderList(popup);
    }

    function refreshQrFolderList(popup) {
        const listEl = popup.querySelector('#qrext-folder-list');
        if (!listEl) return;
        const allNames = getAllSetNames();
        const inFolder = new Set();
        Object.values(qrFolders).forEach(arr => arr.forEach(n => inFolder.add(n)));
        const ungrouped = allNames.filter(n => !inFolder.has(n));
        const orderedNames = getOrderedFolderNames();

        let html = '';
        orderedNames.forEach((fname, idx) => {
            const sets = qrFolders[fname];
            const valid = sets.filter(s => allNames.includes(s));
            const isFolded = qrFolded.has('popup_' + fname);
            const isFirst = idx === 0;
            const isLast  = idx === orderedNames.length - 1;
            html +=
                '<div class="qrext-folder-row" data-fname="' + qrEscHtml(fname) + '">' +
                    '<div class="qrext-folder-row-header">' +
                        '<i class="fa-solid ' + (isFolded ? 'fa-folder' : 'fa-folder-open') + ' qrext-fr-icon qrext-fr-fold-toggle" data-fname="' + qrEscHtml(fname) + '" title="접기/펼치기" style="cursor:pointer"></i>' +
                        '<span class="qrext-fr-name qrext-fr-fold-toggle" data-fname="' + qrEscHtml(fname) + '" style="cursor:pointer">' + qrEscHtml(fname) + '</span>' +
                        '<span class="qrext-fr-count">' + valid.length + '</span>' +
                        '<button class="qrext-fr-move-up" data-fname="' + qrEscHtml(fname) + '" title="폴더 위로" ' + (isFirst ? 'disabled' : '') + '><i class="fa-solid fa-chevron-up"></i></button>' +
                        '<button class="qrext-fr-move-down" data-fname="' + qrEscHtml(fname) + '" title="폴더 아래로" ' + (isLast ? 'disabled' : '') + '><i class="fa-solid fa-chevron-down"></i></button>' +
                        '<button class="qrext-fr-rename" data-fname="' + qrEscHtml(fname) + '" title="이름 변경"><i class="fa-solid fa-pencil"></i></button>' +
                        '<button class="qrext-fr-delete" data-fname="' + qrEscHtml(fname) + '" title="폴더 삭제"><i class="fa-solid fa-trash"></i></button>' +
                    '</div>' +
                    (isFolded ? '' :
                    '<div class="qrext-fr-sets">' +
                        valid.map((s, si) =>
                            '<div class="qrext-fr-set-item" draggable="true" data-set="' + qrEscHtml(s) + '" data-folder="' + qrEscHtml(fname) + '" data-sidx="' + si + '">' +
                                '<i class="fa-solid fa-grip-vertical qrext-fr-drag"></i>' +
                                '<span>' + qrEscHtml(s) + '</span>' +
                                '<button class="qrext-fr-set-move-up" data-set="' + qrEscHtml(s) + '" data-folder="' + qrEscHtml(fname) + '" title="위로" ' + (si === 0 ? 'disabled' : '') + '><i class="fa-solid fa-chevron-up"></i></button>' +
                                '<button class="qrext-fr-set-move-down" data-set="' + qrEscHtml(s) + '" data-folder="' + qrEscHtml(fname) + '" title="아래로" ' + (si === valid.length - 1 ? 'disabled' : '') + '><i class="fa-solid fa-chevron-down"></i></button>' +
                                '<button class="qrext-fr-remove-set" data-set="' + qrEscHtml(s) + '" data-folder="' + qrEscHtml(fname) + '" title="제거"><i class="fa-solid fa-xmark"></i></button>' +
                            '</div>'
                        ).join('') +
                        '<div class="qrext-fr-drop-zone" data-folder="' + qrEscHtml(fname) + '">여기에 드롭하여 추가</div>' +
                        '<button class="qrext-fr-add-set-btn" data-folder="' + qrEscHtml(fname) + '" title="세트 추가">' +
                            '<i class="fa-solid fa-plus"></i> 세트 추가' +
                        '</button>' +
                    '</div>') +
                '</div>';
        });

        if (ungrouped.length) {
            html +=
                '<div class="qrext-folder-row qrext-ungrouped">' +
                    '<div class="qrext-folder-row-header">' +
                        '<i class="fa-solid fa-layer-group qrext-fr-icon" style="color:var(--etn-text-dim)"></i>' +
                        '<span class="qrext-fr-name" style="color:var(--etn-text-dim)">미분류</span>' +
                        '<span class="qrext-fr-count">' + ungrouped.length + '</span>' +
                    '</div>' +
                    '<div class="qrext-fr-sets">' +
                        ungrouped.map(s =>
                            '<div class="qrext-fr-set-item" draggable="true" data-set="' + qrEscHtml(s) + '" data-folder="">' +
                                '<i class="fa-solid fa-grip-vertical qrext-fr-drag"></i>' +
                                '<span>' + qrEscHtml(s) + '</span>' +
                            '</div>'
                        ).join('') +
                    '</div>' +
                '</div>';
        }

        listEl.innerHTML = html || '<div class="qrext-empty-hint">QR 세트가 없습니다.</div>';
        bindQrFolderEvents(popup);

        const dd = document.getElementById('qrext-editor-dropdown');
        if (dd) { dd.remove(); const sel = document.querySelector('#qr--editor #qr--set'); if (sel) { delete sel.dataset.qrextHooked; sel.classList.remove('qrext-hidden-select'); } if (qrEnabled) installEditorDropdown(); }
    }

    function bindQrFolderEvents(popup) {
        const listEl = popup.querySelector('#qrext-folder-list');
        if (!listEl) return;
        // 접기/펼치기
        listEl.querySelectorAll('.qrext-fr-fold-toggle').forEach(el => {
            el.addEventListener('click', e => {
                e.stopPropagation();
                const fname = el.dataset.fname;
                const key = 'popup_' + fname;
                if (qrFolded.has(key)) qrFolded.delete(key); else qrFolded.add(key);
                saveQrFolded();
                refreshQrFolderList(popup);
            });
        });

        // 폴더 순서 변경
        listEl.querySelectorAll('.qrext-fr-move-up, .qrext-fr-move-down').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                const fname = btn.dataset.fname;
                const orderedNames = getOrderedFolderNames();
                qrFolderOrder = [...orderedNames];
                const idx = qrFolderOrder.indexOf(fname);
                if (idx === -1) return;
                const isUp = btn.classList.contains('qrext-fr-move-up');
                const swapIdx = isUp ? idx - 1 : idx + 1;
                if (swapIdx < 0 || swapIdx >= qrFolderOrder.length) return;
                [qrFolderOrder[idx], qrFolderOrder[swapIdx]] = [qrFolderOrder[swapIdx], qrFolderOrder[idx]];
                saveQrFolderOrder();
                refreshQrFolderList(popup);
            });
        });
        listEl.querySelectorAll('.qrext-fr-delete').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                const fname = btn.dataset.fname;
                if (!confirm('폴더 "' + fname + '"를 삭제할까요? (세트는 미분류로 이동됩니다)')) return;
                delete qrFolders[fname];
                saveQrFolders();
                refreshQrFolderList(popup);
            });
        });

        listEl.querySelectorAll('.qrext-fr-rename').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                const fname = btn.dataset.fname;
                const newName = prompt('새 폴더 이름:', fname);
                if (!newName || !newName.trim() || newName.trim() === fname) return;
                const t = newName.trim();
                if (qrFolders[t]) { alert('이미 존재하는 이름입니다.'); return; }
                qrFolders[t] = qrFolders[fname];
                delete qrFolders[fname];
                if (qrFolded.has(fname)) { qrFolded.delete(fname); qrFolded.add(t); saveQrFolded(); }
                saveQrFolders();
                refreshQrFolderList(popup);
            });
        });

        listEl.querySelectorAll('.qrext-fr-remove-set').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                const { set: setName, folder: fname } = btn.dataset;
                if (!qrFolders[fname]) return;
                qrFolders[fname] = qrFolders[fname].filter(s => s !== setName);
                saveQrFolders();
                refreshQrFolderList(popup);
            });
        });

        // ── 폴더 내 세트 순서 변경 ↑↓ ─────────────────────────────
        listEl.querySelectorAll('.qrext-fr-set-move-up, .qrext-fr-set-move-down').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                const { set: setName, folder: fname } = btn.dataset;
                if (!qrFolders[fname]) return;
                const arr = qrFolders[fname];
                const idx = arr.indexOf(setName);
                if (idx === -1) return;
                const isUp = btn.classList.contains('qrext-fr-set-move-up');
                const swapIdx = isUp ? idx - 1 : idx + 1;
                if (swapIdx < 0 || swapIdx >= arr.length) return;
                [arr[idx], arr[swapIdx]] = [arr[swapIdx], arr[idx]];
                saveQrFolders();
                refreshQrFolderList(popup);
            });
        });
        // + 버튼으로 세트 추가 (모달)
        listEl.querySelectorAll('.qrext-fr-add-set-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                const fname = btn.dataset.folder;
                openSetPickModal(fname, popup);
            });
        });

        let dragSet = null, dragFrom = null;
        listEl.querySelectorAll('.qrext-fr-set-item[draggable="true"]').forEach(item => {
            item.addEventListener('dragstart', e => {
                dragSet = item.dataset.set; dragFrom = item.dataset.folder;
                item.classList.add('qrext-fr-dragging');
                e.dataTransfer.effectAllowed = 'move';
            });
            item.addEventListener('dragend', () => {
                item.classList.remove('qrext-fr-dragging');
                listEl.querySelectorAll('.qrext-fr-drop-zone').forEach(z => z.classList.remove('qrext-drop-active'));
            });
        });

        listEl.querySelectorAll('.qrext-fr-drop-zone').forEach(zone => {
            zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('qrext-drop-active'); });
            zone.addEventListener('dragleave', () => zone.classList.remove('qrext-drop-active'));
            zone.addEventListener('drop', e => {
                e.preventDefault();
                zone.classList.remove('qrext-drop-active');
                const toFolder = zone.dataset.folder;
                if (!dragSet || !toFolder) return;
                if (dragFrom && qrFolders[dragFrom]) qrFolders[dragFrom] = qrFolders[dragFrom].filter(s => s !== dragSet);
                if (qrFolders[toFolder] && !qrFolders[toFolder].includes(dragSet)) qrFolders[toFolder].push(dragSet);
                saveQrFolders();
                refreshQrFolderList(popup);
                dragSet = null; dragFrom = null;
            });
        });
    }
	
    function openSetPickModal(fname, popup) {
        if (document.getElementById('qrext-set-pick-modal')) return;
        const allNames = getAllSetNames();
        const already  = new Set(qrFolders[fname] || []);
        const inOtherFolder = new Set();
        Object.entries(qrFolders).forEach(([f, sets]) => {
            if (f === fname) return;
            sets.forEach(s => inOtherFolder.add(s));
        });
        const pickableNames = allNames.filter(n => !inOtherFolder.has(n));

        const modal = document.createElement('div');
        modal.id = 'qrext-set-pick-modal';

		['click','pointerdown','mousedown','touchstart','touchend'].forEach(evtName => {
			modal.addEventListener(evtName, e => {
				if (e.target === modal) return;
				e.stopPropagation();
			});
		});

        function renderModal(query, preserveScroll) {
            const listEl = modal.querySelector('.qrext-set-pick-list');
            const scrollTop = (preserveScroll && listEl) ? listEl.scrollTop : 0;

            const q = query.trim().toLowerCase();
            const filtered = pickableNames.filter(n => !q || n.toLowerCase().includes(q));
            const listHtml = filtered.length
                ? filtered.map(n =>
                    '<div class="qrext-set-pick-item' + (already.has(n) ? ' qrext-pick-selected' : '') + '" data-set="' + qrEscHtml(n) + '">' +
                        '<i class="fa-solid ' + (already.has(n) ? 'fa-check' : 'fa-plus') + ' qrext-pick-icon"></i>' +
                        qrEscHtml(n) +
                    '</div>'
                ).join('')
                : '<div class="qrext-set-pick-empty">검색 결과 없음</div>';

            if (!modal.querySelector('.qrext-set-pick-inner')) {
                // 최초 렌더
                modal.innerHTML =
                    '<div class="qrext-set-pick-inner">' +
                        '<div class="qrext-set-pick-header">' +
                            '<span><i class="fa-solid fa-folder" style="margin-right:6px;color:var(--etn-accent)"></i>' + qrEscHtml(fname) + ' — 세트 추가</span>' +
                            '<button class="qrext-set-pick-close"><i class="fa-solid fa-xmark"></i></button>' +
                        '</div>' +
                        '<div class="qrext-set-pick-search-wrap">' +
                            '<i class="fa-solid fa-magnifying-glass"></i>' +
                            '<input class="qrext-set-pick-search" type="text" placeholder="세트 검색..." autocomplete="off" />' +
                        '</div>' +
                        '<div class="qrext-set-pick-list"></div>' +
                    '</div>';

                modal.querySelector('.qrext-set-pick-close').addEventListener('click', e => {
                    e.stopPropagation();
                    modal.remove();
                });
                modal.querySelector('.qrext-set-pick-search').addEventListener('input', function() {
                    renderModal(this.value, false);
                });
                modal.addEventListener('click', e => {
                    if (e.target === modal) modal.remove();
                });

                setTimeout(() => modal.querySelector('.qrext-set-pick-search').focus(), 0);
            }

            const newListEl = modal.querySelector('.qrext-set-pick-list');
            newListEl.innerHTML = listHtml;

            if (preserveScroll) newListEl.scrollTop = scrollTop;

            newListEl.querySelectorAll('.qrext-set-pick-item').forEach(item => {
                item.addEventListener('click', e => {
                    e.stopPropagation();
                    const setName = item.dataset.set;
                    if (!qrFolders[fname]) qrFolders[fname] = [];
                    if (already.has(setName)) {
                        qrFolders[fname] = qrFolders[fname].filter(s => s !== setName);
                        already.delete(setName);
                    } else {
                        qrFolders[fname].push(setName);
                        already.add(setName);
                    }
                    saveQrFolders();
                    refreshQrFolderList(popup);
                    renderModal(modal.querySelector('.qrext-set-pick-search').value, true);
                });
            });
        }

        renderModal('', false);
        const etnNav = document.getElementById('etn-nav');
        (etnNav || document.body).appendChild(modal);
    }


    function closeQrextPopup() {
        const p = document.getElementById('qrext-popup');
        if (p) p.remove();
        document.removeEventListener('pointerdown', qrextOutsideHandler, true);
    }
    function qrextOutsideHandler(e) {
        const popup = document.getElementById('qrext-popup');
        if (!popup) { document.removeEventListener('pointerdown', qrextOutsideHandler, true); return; }
        const toggleBtn = document.getElementById('qrext-toggle-btn');
        if (toggleBtn && toggleBtn.contains(e.target)) return;
        if (document.getElementById('qrext-set-pick-modal')) return;
        if (!popup.contains(e.target)) closeQrextPopup();
    }

    /* ── 적용 / 해제 ─────────────────────────────────────────── */
    function applyQrExtension() {
        installGlobalSearch();
        if (!document.getElementById('qrext-editor-dropdown')) installEditorDropdown();
    }

    function removeQrExtension() {
        document.querySelectorAll('.qrext-global-dropdown').forEach(el => {
            const parent = el.parentElement;
            const nativeSel = parent && parent.querySelector('select.qr--set.qrext-hidden-select');
            if (nativeSel) {
                nativeSel.classList.remove('qrext-hidden-select');
                delete nativeSel.dataset.qrextGlobalHooked;
            }
            el.remove();
        });

        const editorDd = document.getElementById('qrext-editor-dropdown');
        if (editorDd) {
            const nativeSel = document.querySelector('#qr--editor #qr--set');
            if (nativeSel) {
                nativeSel.classList.remove('qrext-hidden-select');
                delete nativeSel.dataset.qrextHooked;
            }
            editorDd.remove();
        }

        document.querySelectorAll('.qrext-search-wrap').forEach(el => el.remove());
    }

    /* ── 초기화 ──────────────────────────────────────────────── */
    function qrExtInit() {
        const toolbarWatcher = setInterval(() => {
            if (document.getElementById('etn-toolbar')) {
                clearInterval(toolbarWatcher);
                installQrToolbarButton();
            }
        }, 300);

        const observer = new MutationObserver(() => {
            if (!qrEnabled) return;
            installQrToolbarButton();
            const qrVisible = document.querySelector('#qr_container .inline-drawer-content.etn-force-show');
            if (qrVisible || document.querySelector('#qr_container')) {
                installGlobalSearch();
                if (!document.getElementById('qrext-editor-dropdown')) installEditorDropdown();
            }
        });
        observer.observe(document.getElementById('extensions_settings') || document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] });

        function attachQrContainerWatcher() {
            const qrRoot = document.getElementById('qr_container');
            if (!qrRoot || qrRoot._qrextContainerWatching) return;
            qrRoot._qrextContainerWatching = true;
            const w = new MutationObserver(() => {
                if (!qrEnabled) return;
                setTimeout(() => {
                    installGlobalSearch();
                    if (!document.getElementById('qrext-editor-dropdown')) installEditorDropdown();
                }, 150);
            });
            w.observe(qrRoot, { subtree: true, childList: true });
        }
        const qrContainerTimer = setInterval(() => {
            if (document.getElementById('qr_container')) {
                attachQrContainerWatcher();
                clearInterval(qrContainerTimer);
            }
        }, 300);

        function attachQrListWatcher() {
            const qrGlobal  = document.querySelector('#qr--global');
            const qrChat    = document.querySelector('#qr--chat');
            const qrCharacter = document.querySelector('#qr--character');
            [qrGlobal, qrChat, qrCharacter].forEach(el => {
                if (!el || el._qrextWatching) return;
                el._qrextWatching = true;
                const w = new MutationObserver(() => {
                    if (!qrEnabled) return;
                    setTimeout(() => {
                        installGlobalSearch();
                        if (!document.getElementById('qrext-editor-dropdown')) installEditorDropdown();
                    }, 150);
                });
                w.observe(el, { subtree: true, childList: true });
            });
        }

        const observer2 = new MutationObserver(() => {
            if (!qrEnabled) return;
            installQrToolbarButton();
            attachQrListWatcher();
            const qrVisible = document.querySelector('#qr_container .inline-drawer-content.etn-force-show');
            if (qrVisible || document.querySelector('#qr_container')) {
                installGlobalSearch();
                if (!document.getElementById('qrext-editor-dropdown')) installEditorDropdown();
            }
        });
        observer2.observe(document.getElementById('extensions_settings') || document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] });
        setTimeout(attachQrListWatcher, 1000);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', qrExtInit);
    else qrExtInit();
})();

/* ═══════════════════════════════════════════════════════════════════════════
   QR 제작 도우미  (qr-maker.js)
   - QR 세트 파일(.json) 생성 도우미
   - /input, setvar, buttons labels, /send 구조를 GUI로 조립
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
    'use strict';

    const STORAGE_KEY = 'qrmaker_drafts';

    /* ── 저장 / 불러오기 ─────────────────────────────────────── */
    function loadDrafts() {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
        catch { return []; }
    }
    function saveDrafts(arr) {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(arr)); } catch {}
    }

    function esc(str) {
        return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    /* ── 상태 ────────────────────────────────────────────────── */
    let state = {
        setName: '',
        useInput: false,
        inputPrompt: '사용자 입력, 필요 없으면 취소',
        varName: 'order',
        mainTitle: '',
        items: []      
    };

    /* ── 팝업 열기/닫기 ──────────────────────────────────────── */
    function getNav() { return document.getElementById('etn-nav'); }

    function toggle() {
        const existing = document.getElementById('qrmaker-popup');
        if (existing) { close(); return; }
        open();
    }

    function close() {
        const p = document.getElementById('qrmaker-popup');
        if (p) p.remove();
        document.removeEventListener('pointerdown', outsideHandler, true);
        const btn = document.getElementById('qrmaker-open-btn');
        if (btn) btn.classList.remove('qrext-active');
    }

    function outsideHandler(e) {
        const p = document.getElementById('qrmaker-popup');
        if (!p) { document.removeEventListener('pointerdown', outsideHandler, true); return; }
        const makerBtn = document.getElementById('qrmaker-open-btn');
        if (makerBtn && makerBtn.contains(e.target)) return;
        if (!p.contains(e.target)) close();
    }

    function open() {
        const nav = getNav();
        if (!nav) return;
        const popup = document.createElement('div');
        popup.id = 'qrmaker-popup';
        popup.addEventListener('click', e => e.stopPropagation());
        popup.addEventListener('pointerdown', e => e.stopPropagation());
        nav.appendChild(popup);
        render(popup);
        setTimeout(() => document.addEventListener('pointerdown', outsideHandler, true), 0);
        const btn = document.getElementById('qrmaker-open-btn');
        if (btn) btn.classList.add('qrext-active');
    }

    /* ── 메인 렌더 ───────────────────────────────────────────── */
    function render(popup) {
        popup.innerHTML =
            '<div class="qrmaker-header">' +
                '<span class="qrmaker-title"><i class="fa-solid fa-wand-magic-sparkles"></i> QR 제작 도우미</span>' +
                '<button class="qrmaker-close-btn" id="qrmaker-close"><i class="fa-solid fa-xmark"></i></button>' +
            '</div>' +
            '<div class="qrmaker-body">' +

                /* ── 세트 이름 ── */
                '<div class="qrmaker-section">' +
                    '<div class="qrmaker-section-title" style="display:flex;align-items:center;justify-content:space-between;">' +
                        '<span>세트 이름</span>' +
                        '<div style="display:flex;gap:5px;">' +
                            '<button class="qrmaker-add-item-btn" id="qrm-load-set" title="기존 QR 세트 파일 불러오기"><i class="fa-solid fa-folder-open"></i> 세트 불러오기</button>' +
                            '<input type="file" id="qrm-load-set-file" accept=".json" style="display:none" />' +
                            '<button class="qrmaker-add-item-btn" id="qrm-reset" title="전체 초기화"><i class="fa-solid fa-rotate-left"></i> 초기화</button>' +
                        '</div>' +
                    '</div>' +
                    '<input class="qrmaker-input text_pole" id="qrm-set-name" placeholder="예: 일반 스토리 컨트롤" value="' + esc(state.setName) + '" />' +
                '</div>' +

                /* ── 메인 QR 설정 ── */
                '<div class="qrmaker-section">' +
                    '<div class="qrmaker-section-title">메인 QR 설정</div>' +
                    '<input class="qrmaker-input text_pole" id="qrm-main-title" placeholder="메인 버튼 표시 제목 (예: 일반 스토리 컨트롤)" value="' + esc(state.mainTitle) + '" />' +
                    '<label class="qrmaker-check-row">' +
                        '<input type="checkbox" id="qrm-use-input" ' + (state.useInput ? 'checked' : '') + ' />' +
                        '<span>/input 추가 (사용자 자유 입력)</span>' +
                    '</label>' +
                    '<div id="qrm-input-options" style="' + (state.useInput ? '' : 'display:none') + '">' +
                        '<input class="qrmaker-input text_pole" id="qrm-input-prompt" placeholder="입력 안내 문구" value="' + esc(state.inputPrompt) + '" />' +
                        '<input class="qrmaker-input text_pole" id="qrm-var-name" placeholder="setvar 변수명 (예: order)" value="' + esc(state.varName) + '" />' +
                    '</div>' +
                '</div>' +

                /* ── 버튼 목록 ── */
                '<div class="qrmaker-section">' +
                    '<div class="qrmaker-section-title" style="display:flex;align-items:center;justify-content:space-between;">' +
                        '<span>버튼 항목</span>' +
                        '<div style="display:flex;gap:5px;">' +
                            '<button class="qrmaker-add-item-btn" id="qrm-import-qr" title="QR 파일에서 항목 가져오기"><i class="fa-solid fa-file-import"></i> 파일 임포트</button>' +
                            '<input type="file" id="qrm-import-file" accept=".json" style="display:none" />' +
                            '<button class="qrmaker-add-item-btn" id="qrm-add-item"><i class="fa-solid fa-plus"></i> 추가</button>' +
                        '</div>' +
                    '</div>' +
                    '<div id="qrm-item-list">' + renderItemList() + '</div>' +
                '</div>' +

                /* ── 미리보기 ── */
                '<div class="qrmaker-section">' +
                    '<div class="qrmaker-section-title" style="display:flex;align-items:center;justify-content:space-between;">' +
                        '<span>미리보기</span>' +
                        '<button class="qrmaker-add-item-btn" id="qrm-preview-btn"><i class="fa-solid fa-eye"></i> 생성</button>' +
                    '</div>' +
                    '<div id="qrm-preview-area"></div>' +
                '</div>' +

                /* ── 다운로드 ── */
                '<div class="qrmaker-footer">' +
                    '<button class="qrmaker-dl-btn" id="qrm-download"><i class="fa-solid fa-file-export"></i> QR 세트 파일 다운로드</button>' +
                '</div>' +

            '</div>';

        bindEvents(popup);
    }

    /* ── 버튼 항목 렌더 ──────────────────────────────────────── */
    function renderItemList() {
        if (!state.items.length) {
            return '<div class="qrmaker-empty-hint">버튼 항목이 없습니다. 추가 버튼을 눌러 시작하세요.</div>';
        }
        const inputHint = state.useInput
            ? '<div class="qrmaker-var-hint"><i class="fa-solid fa-circle-info"></i> 사용자 입력값 변수: <code>{{getvar::' + esc(state.varName || 'order') + '}}</code> — 내용에 직접 삽입해 사용하세요</div>'
            : '';
        return inputHint + state.items.map((item, idx) =>
            '<div class="qrmaker-item-row" data-idx="' + idx + '">' +
                '<div class="qrmaker-item-header">' +
                    '<span class="qrmaker-item-num">' + (idx + 1) + '</span>' +
                    '<input class="qrmaker-input qrmaker-item-label text_pole" data-idx="' + idx + '" placeholder="버튼 라벨 (예: 보통 이어쓰기)" value="' + esc(item.label) + '" />' +
                    '<select class="qrmaker-send-type" data-idx="' + idx + '">' +
                        '<option value="send"' + (item.sendType !== 'gen' ? ' selected' : '') + '>/send</option>' +
                        '<option value="gen"' + (item.sendType === 'gen' ? ' selected' : '') + '>/gen</option>' +
                    '</select>' +
                    '<button class="qrmaker-item-del" data-idx="' + idx + '" title="삭제"><i class="fa-solid fa-trash-can"></i></button>' +
                '</div>' +
                '<textarea class="qrmaker-item-send text_pole" data-idx="' + idx + '" rows="3" placeholder="전송할 내용을 입력하세요' + (state.useInput ? ' ({{getvar::' + (state.varName || 'order') + '}} 로 입력값 사용 가능)' : '') + '">' + esc(item.sendContent) + '</textarea>' +
            '</div>'
        ).join('');
    }
    /* ── 이벤트 바인딩 ───────────────────────────────────────── */
    function bindEvents(popup) {
        popup.querySelector('#qrmaker-close').addEventListener('click', close);

        popup.querySelector('#qrm-set-name').addEventListener('input', e => { state.setName = e.target.value; });
        popup.querySelector('#qrm-main-title').addEventListener('input', e => { state.mainTitle = e.target.value; });

        popup.querySelector('#qrm-load-set').addEventListener('click', () => {
            popup.querySelector('#qrm-load-set-file').click();
        });

        popup.querySelector('#qrm-load-set-file').addEventListener('change', function() {
            const file = this.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = e => {
                try {
                    const data = JSON.parse(e.target.result);
                    loadSetIntoState(data, popup);
                } catch {
                    alert('JSON 파싱 실패: ' + file.name);
                }
                this.value = '';
            };
            reader.readAsText(file);
        });

        popup.querySelector('#qrm-reset').addEventListener('click', () => {
            if (!confirm('현재 작업 내용을 모두 초기화할까요?')) return;
            state.setName    = '';
            state.mainTitle  = '';
            state.useInput   = false;
            state.inputPrompt = '사용자 입력, 필요 없으면 취소';
            state.varName    = 'order';
            state.items      = [];
            render(popup);
        });

        const useInputCb = popup.querySelector('#qrm-use-input');
        useInputCb.addEventListener('change', () => {
            state.useInput = useInputCb.checked;
            popup.querySelector('#qrm-input-options').style.display = state.useInput ? '' : 'none';
            refreshItemList(popup);
        });
        popup.querySelector('#qrm-input-prompt').addEventListener('input', e => { state.inputPrompt = e.target.value; });
        popup.querySelector('#qrm-var-name').addEventListener('input', e => { state.varName = e.target.value; });

        popup.querySelector('#qrm-add-item').addEventListener('click', () => {
            state.items.push({ label: '', sendContent: '', sendType: 'send' });
            refreshItemList(popup);
        });

        popup.querySelector('#qrm-import-qr').addEventListener('click', () => {
            popup.querySelector('#qrm-import-file').click();
        });

        popup.querySelector('#qrm-import-file').addEventListener('change', function() {
            const files = Array.from(this.files);
            if (!files.length) return;
            let remaining = files.length;
            files.forEach(file => {
                const reader = new FileReader();
                reader.onload = e => {
                    try {
                        const data = JSON.parse(e.target.result);
                        importQrItem(data);
                    } catch {
                        alert(file.name + ' — JSON 파싱 실패');
                    }
                    remaining--;
                    if (remaining === 0) {
                        refreshItemList(popup);
                        this.value = '';
                    }
                };
                reader.readAsText(file);
            });
        });

        popup.querySelector('#qrm-preview-btn').addEventListener('click', () => {
            const preview = buildQrScript();
            const area = popup.querySelector('#qrm-preview-area');
            area.innerHTML =
                '<textarea class="qrmaker-preview-ta text_pole" readonly rows="10">' + esc(preview.mainQr) + '</textarea>' +
                (preview.subQrs.length
                    ? '<div class="qrmaker-section-title" style="margin-top:8px">하위 QR들</div>' +
                      preview.subQrs.map((s, i) =>
                          '<div class="qrmaker-sub-label">' + esc(state.items[i] ? state.items[i].label : '') + '</div>' +
                          '<textarea class="qrmaker-preview-ta text_pole" readonly rows="4">' + esc(s) + '</textarea>'
                      ).join('')
                    : ''
                );
        });

        popup.querySelector('#qrm-download').addEventListener('click', () => {
            const json = buildQrJson();
            downloadJson(json, (state.setName || 'qr_set') + '.json');
        });

        refreshItemList(popup);
    }

    function refreshItemList(popup) {
        const listEl = popup.querySelector('#qrm-item-list');
        listEl.innerHTML = renderItemList();

        listEl.querySelectorAll('.qrmaker-item-label').forEach(input => {
            input.addEventListener('input', e => {
                state.items[+e.target.dataset.idx].label = e.target.value;
            });
        });
        listEl.querySelectorAll('.qrmaker-item-send').forEach(ta => {
            ta.addEventListener('input', e => {
                state.items[+e.target.dataset.idx].sendContent = e.target.value;
            });
        });
        listEl.querySelectorAll('.qrmaker-send-type').forEach(sel => {
            sel.addEventListener('change', e => {
                state.items[+e.target.dataset.idx].sendType = e.target.value;
            });
        });
        listEl.querySelectorAll('.qrmaker-item-del').forEach(btn => {
            btn.addEventListener('click', e => {
                state.items.splice(+btn.dataset.idx, 1);
                refreshItemList(popup);
            });
        });
    }

    /* ── QR 세트 파일 → state 복원 ──────────────────────────── */
    function loadSetIntoState(data, popup) {
        if (!data.qrList || !Array.isArray(data.qrList)) {
            alert('QR 세트 파일 형식이 아닙니다.');
            return;
        }

        state.setName   = data.name || '';
        state.items     = [];

        // 메인 QR: /buttons labels=[...] 가 있는 첫 번째 항목
        const mainEntry = data.qrList.find(q => /\/buttons\s+labels=/.test(q.message));
        if (mainEntry) {
            state.mainTitle = mainEntry.label || '';

            const msg = mainEntry.message;

            // /input 여부 감지
            if (/\/input\s/.test(msg)) {
                state.useInput = true;
                const inputMatch = msg.match(/\/input\s+([^\|]+)\|/);
                if (inputMatch) state.inputPrompt = inputMatch[1].trim();
                // setvar 변수명 감지
                const varMatch = msg.match(/\/setvar\s+key=(\S+)\s+\{\{pipe\}\}/);
                if (varMatch) state.varName = varMatch[1];
            } else {
                state.useInput = false;
            }
        }

        // 하위 QR: 메인 제외 나머지
        const subEntries = mainEntry
            ? data.qrList.filter(q => q.id !== mainEntry.id)
            : data.qrList;

        subEntries.forEach(entry => {
            if (!entry.label) return;
            const msg = entry.message || '';
            let sendType = 'send';
            let sendContent = '';

            const lines = msg.split('\n');
            const sendLineIdx = lines.findIndex(l => /^\/(send|gen)\s/.test(l.trim()));
            if (sendLineIdx !== -1) {
                const match = lines[sendLineIdx].trim().match(/^\/(send|gen)\s+([\s\S]*)/);
                if (match) {
                    sendType = match[1];
                    const afterLines = [match[2], ...lines.slice(sendLineIdx + 1)];
                    const contentLines = afterLines.filter(l => !/^\|\|?\s*\//.test(l.trim()));
                    sendContent = contentLines.join('\n').trim();
                }
            } else {
                sendContent = msg.trim();
            }

            state.items.push({ label: entry.label, sendContent, sendType });
        });

        // UI 전체 재렌더
        render(popup);
        alert('"' + state.setName + '" 세트를 불러왔습니다. 메인 QR 설정과 버튼 항목을 확인 후 수정하세요.');
    }

    /* ── QR 파일 임포트 ──────────────────────────────────────── */
    function importQrItem(data) {
        // 단일 QR 항목 { label, message, ... } 또는
        // QR 세트 { qrList: [...] } 둘 다 처리
        const entries = data.qrList
            ? data.qrList
            : (data.label !== undefined ? [data] : []);

        entries.forEach(entry => {
            if (!entry.label) return;
            const msg = entry.message || '';

            // /send 또는 /gen 으로 시작하는 줄 찾기
            // 해당 명령어 제거 후 나머지를 sendContent로
            let sendType = 'send';
            let sendContent = '';

            const lines = msg.split('\n');
            const sendLineIdx = lines.findIndex(l => /^\/(send|gen)\s/.test(l.trim()));
            if (sendLineIdx !== -1) {
                const match = lines[sendLineIdx].trim().match(/^\/(send|gen)\s+([\s\S]*)/);
                if (match) {
                    sendType = match[1];
                    // /send 줄 이후 내용도 포함 (멀티라인 내용 대응)
                    const afterLines = [match[2], ...lines.slice(sendLineIdx + 1)];
                    // | /flushvar ... 나 || /trigger 같은 파이프 후처리 줄은 제외
                    const contentLines = afterLines.filter(l => !/^\|\|?\s*\//.test(l.trim()));
                    sendContent = contentLines.join('\n').trim();
                }
            } else {
                // /send, /gen 없으면 전체를 그대로
                sendContent = msg.trim();
            }

            state.items.push({ label: entry.label, sendContent, sendType });
        });
    }

    /* ── QR 스크립트 생성 ────────────────────────────────────── */
    function buildQrScript() {
        const inputVarName  = state.varName || 'order';
        const buttonVarName = 'option';
        const mainTitle     = state.mainTitle || state.setName || '메뉴';
        const labels        = state.items.map(i => i.label).filter(Boolean);

        /* 메인 QR */
        let mainLines = [];
        if (state.useInput) {
            mainLines.push('/input ' + (state.inputPrompt || '사용자 입력, 필요 없으면 취소') + ' |');
            mainLines.push('/setvar key=' + inputVarName + ' {{pipe}} ||');
        }
        if (labels.length) {
            mainLines.push('/buttons labels=["' + labels.join('","') + '"] ' + mainTitle + ' |');
            mainLines.push('/setvar key=' + buttonVarName + ' ||');
            mainLines.push('/if left={{getvar::' + buttonVarName + '}} rule=eq right="" {: /flushvar ' + buttonVarName + (state.useInput ? ' | /flushvar ' + inputVarName : '') + ' | /abort :} ||');
            labels.forEach((label, idx) => {
                const safeLabel = label.replace(/"/g, '\\"');
                const isLast    = idx === labels.length - 1;
                mainLines.push('/if left={{getvar::' + buttonVarName + '}} rule=eq right="' + safeLabel + '" {: /flushvar ' + buttonVarName + ' | /run ' + (state.setName || 'SET') + '.' + safeLabel + ' :}' + (isLast ? '' : ' ||'));
            });
        }
        const mainQr = mainLines.join('\n');

        /* 하위 QR들 */
        const subQrs = state.items.map(item => {
            if (!item.label) return '';
            const cmd = item.sendType === 'gen' ? '/gen ' : '/send ';
            const content = item.sendContent.trim();
            const flushLine = state.useInput ? '| /flushvar ' + inputVarName : '';
            if (!content && !flushLine) return '';
            const lines = [];
            if (content) lines.push(cmd + content);
            if (state.useInput) lines.push('| /flushvar ' + inputVarName);
            lines.push('|| /trigger');
            return lines.join('\n');
        });

        return { mainQr, subQrs };
    }
    /* ── QR JSON 생성 ─────────────── */
    function buildQrJson() {
        const { mainQr, subQrs } = buildQrScript();
        const setName = state.setName || 'QR세트';
        const qrList = [];
        let idCounter = 1;

        /* 메인 QR */
        qrList.push({
            id: idCounter++,
            showLabel: true,
            label: state.mainTitle || setName,
            title: state.mainTitle || setName,
            message: mainQr,
            contextList: [],
            preventAutoExecute: true,
            isHidden: false,
            executeOnStartup: false,
            executeOnUser: false,
            executeOnAi: false,
            executeOnChatChange: false,
            executeOnGroupMemberDraft: false,
            executeOnNewChat: false,
            executeBeforeGeneration: false,
            automationId: ''
        });

        /* 하위 QR들 */
        state.items.forEach((item, i) => {
            if (!item.label) return;
            qrList.push({
                id: idCounter++,
                showLabel: true,
                label: item.label,
                title: item.label,
                message: subQrs[i] || '',
                contextList: [],
                preventAutoExecute: true,
                isHidden: false,
                executeOnStartup: false,
                executeOnUser: false,
                executeOnAi: false,
                executeOnChatChange: false,
                executeOnGroupMemberDraft: false,
                executeOnNewChat: false,
                executeBeforeGeneration: false,
                automationId: ''
            });
        });

        return {
            version: 2,
            name: setName,
            disableSend: false,
            placeBeforeInput: false,
            injectInput: false,
            color: 'rgba(0, 0, 0, 0)',
            onlyBorderColor: false,
            qrList: qrList,
            idIndex: idCounter
        };
    }

    /* ── 파일 다운로드 ───────────────────────────────────────── */
    function downloadJson(obj, filename) {
        const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1000);
    }

    /* ── 공개 API ────────────────────────────────────────────── */
    window.QRMaker = { toggle, open, close };

    /* ── 초기화 ────────── */
    function installMakerBtn() {
        const toolbar = document.getElementById('etn-toolbar');
        if (!toolbar || toolbar.querySelector('#qrmaker-open-btn')) return;
        const settingsBtn = toolbar.querySelector('#etn-settings-btn');
        const btn = document.createElement('button');
        btn.id = 'qrmaker-open-btn';
        btn.className = 'etn-toolbar-btn';
        btn.title = 'QR 제작 도우미';
        btn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i>';
        btn.addEventListener('click', e => { e.stopPropagation(); toggle(); });
        if (settingsBtn) settingsBtn.insertAdjacentElement('beforebegin', btn);
        else toolbar.appendChild(btn);
    }

    const initTimer = setInterval(() => {
        if (document.getElementById('etn-toolbar')) {
            installMakerBtn();
            clearInterval(initTimer);
        }
    }, 300);

    const toolbarObserver = new MutationObserver(() => installMakerBtn());
    toolbarObserver.observe(document.body, { subtree: true, childList: true });


/* ══════════════════════════════════════════════════════════════
       PRESET MANAGER
    ══════════════════════════════════════════════════════════════ */

    const PRESET_FOLDERS_KEY     = 'prmgr_folders';
    const PRESET_FOLDED_KEY      = 'prmgr_folded';
    const PRESET_FOLDER_ORDER_KEY= 'prmgr_folder_order';

    let prmFolders     = prmLoadFolders();
    let prmFolded      = prmLoadFolded();
    let prmFolderOrder = prmLoadFolderOrder();

    function prmLoadFolders()     { try { return JSON.parse(localStorage.getItem(PRESET_FOLDERS_KEY)) || {}; } catch { return {}; } }
    function prmSaveFolders()     { try { localStorage.setItem(PRESET_FOLDERS_KEY, JSON.stringify(prmFolders)); } catch {} }
    function prmLoadFolded()      { try { return new Set(JSON.parse(localStorage.getItem(PRESET_FOLDED_KEY)) || []); } catch { return new Set(); } }
    function prmSaveFolded()      { try { localStorage.setItem(PRESET_FOLDED_KEY, JSON.stringify([...prmFolded])); } catch {} }
    function prmLoadFolderOrder() { try { return JSON.parse(localStorage.getItem(PRESET_FOLDER_ORDER_KEY)) || []; } catch { return []; } }
    function prmSaveFolderOrder() { try { localStorage.setItem(PRESET_FOLDER_ORDER_KEY, JSON.stringify(prmFolderOrder)); } catch {} }
	
    const PRESET_ENABLED_KEY = 'prmgr_enabled';
    let prmEnabled = (() => { try { const v = localStorage.getItem(PRESET_ENABLED_KEY); return v === null ? true : v === 'true'; } catch { return true; } })();
    function prmSaveEnabled(v) { try { localStorage.setItem(PRESET_ENABLED_KEY, String(v)); } catch {} }

    function prmEsc(str) { return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

    function prmGetAllPresets() {
        const sel = document.getElementById('settings_preset_openai');
        if (!sel) return [];
        return Array.from(sel.options).map(o => ({ value: o.value, text: o.text.trim() })).filter(o => o.text);
    }

    function prmGetOrderedFolderNames() {
        const allKeys = Object.keys(prmFolders);
        const ordered = prmFolderOrder.filter(n => allKeys.includes(n));
        allKeys.forEach(n => { if (!ordered.includes(n)) ordered.push(n); });
        return ordered;
    }

    /* ── 커스텀 드롭다운 (Preset select 대체) ─────────────────── */
    function prmInstallDropdown() {
        const nativeSel = document.getElementById('settings_preset_openai');
        if (!nativeSel || nativeSel.dataset.prmHooked) return;
        nativeSel.dataset.prmHooked = '1';
        nativeSel.style.position = 'absolute';
        nativeSel.style.visibility = 'hidden';
        nativeSel.style.pointerEvents = 'none';
        nativeSel.style.width = '0';
        nativeSel.style.height = '0';
        nativeSel.style.overflow = 'hidden';
        nativeSel.style.opacity = '0';
		
        const wrap = document.createElement('div');
        wrap.id = 'prm-custom-dropdown';
        wrap.className = 'qrext-custom-dropdown';
        nativeSel.insertAdjacentElement('afterend', wrap);

        function buildDropdown() {
            const allPresets = prmGetAllPresets();
            const inFolder   = new Set();
            Object.values(prmFolders).forEach(arr => arr.forEach(v => inFolder.add(v)));
            const ungrouped  = allPresets.filter(p => !inFolder.has(p.value));
            const currentOpt = nativeSel.selectedOptions[0];
            const selectedText = currentOpt ? currentOpt.text.trim() : (nativeSel.value || 'Preset 선택...');

            wrap.innerHTML =
                '<div class="qrext-dd-trigger" role="button" tabindex="0">' +
                    '<span class="qrext-dd-selected-text">' + prmEsc(selectedText) + '</span>' +
                    '<i class="fa-solid fa-chevron-down qrext-dd-arrow"></i>' +
                '</div>' +
                '<div class="qrext-dd-panel" style="display:none;">' +
                    '<div class="qrext-dd-search-wrap">' +
                        '<i class="fa-solid fa-magnifying-glass"></i>' +
                        '<input class="qrext-dd-search" type="text" placeholder="Preset 검색..." autocomplete="off" />' +
                    '</div>' +
                    '<div class="qrext-dd-list"></div>' +
                '</div>';

            const trigger  = wrap.querySelector('.qrext-dd-trigger');
            const panel    = wrap.querySelector('.qrext-dd-panel');
            const listEl   = wrap.querySelector('.qrext-dd-list');
            const searchEl = wrap.querySelector('.qrext-dd-search');
            const arrow    = wrap.querySelector('.qrext-dd-arrow');
            let isOpen = false;

            function openPanel() {
                const rect = trigger.getBoundingClientRect();
                panel.style.top    = (rect.bottom + 4) + 'px';
                panel.style.left   = rect.left + 'px';
                panel.style.width  = Math.max(rect.width, 280) + 'px';
                panel.style.display = 'block';
                arrow.style.transform = 'rotate(180deg)';
                isOpen = true;
                const nav = document.getElementById('etn-nav');
                if (nav) {
                    const isDark = nav.classList.contains('etn-theme-dark');
                    panel.style.background = isDark ? 'rgba(22, 24, 30, 0.92)' : 'rgba(245, 247, 252, 0.97)';
                    panel.style.borderColor = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)';
                    panel.style.color = isDark ? '#e0e4ef' : '#1e2233';
                }
                renderList('');
                searchEl.value = '';
                searchEl.focus();
            }
            function closePanel() { panel.style.display = 'none'; arrow.style.transform = ''; isOpen = false; }

            trigger.addEventListener('click', () => isOpen ? closePanel() : openPanel());
            trigger.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); isOpen ? closePanel() : openPanel(); } });
            searchEl.addEventListener('input', () => renderList(searchEl.value));

            const outsideClose = e => { if (!wrap.contains(e.target)) closePanel(); };
            document.addEventListener('pointerdown', outsideClose);
            wrap._outsideClose = outsideClose;
			
            function selectPreset(value) {
                nativeSel.value = value;
                nativeSel.dispatchEvent(new Event('change', { bubbles: true }));
                closePanel();
            }

            function renderList(query) {
                const q = query.trim().toLowerCase();
                listEl.innerHTML = '';
                const orderedFolders = prmGetOrderedFolderNames();

                const allP = prmGetAllPresets();
                orderedFolders.forEach(fname => {
                    const values  = prmFolders[fname] || [];
                    const filtered = values.map(v => allP.find(p => p.value === v)).filter(p => p && (!q || p.text.toLowerCase().includes(q)));
                    if (!filtered.length) return;
                    const isFolded = prmFolded.has(fname);
                    const folderEl = document.createElement('div');
                    folderEl.className = 'qrext-dd-folder';
                    folderEl.innerHTML =
                        '<div class="qrext-dd-folder-header">' +
                            '<i class="fa-solid ' + (isFolded ? 'fa-folder' : 'fa-folder-open') + ' qrext-folder-icon prm-folder-icon"></i>' +
                            '<span class="qrext-dd-folder-name">' + prmEsc(fname) + '</span>' +
                            '<span class="qrext-dd-folder-count">' + filtered.length + '</span>' +
                            '<i class="fa-solid ' + (isFolded ? 'fa-chevron-right' : 'fa-chevron-down') + ' qrext-folder-chevron"></i>' +
                        '</div>';
                    const itemsEl = document.createElement('div');
                    itemsEl.className = 'qrext-dd-folder-items' + (isFolded && !q ? ' qrext-dd-folded' : '');
                    filtered.forEach(p => {
                        const item = document.createElement('div');
                        item.className = 'qrext-dd-item' + (p.value === nativeSel.value ? ' qrext-dd-item-active' : '');
                        item.textContent = p.text;
                        item.addEventListener('click', () => selectPreset(p.value));
                        itemsEl.appendChild(item);
                    });
                    folderEl.appendChild(itemsEl);
                    folderEl.querySelector('.qrext-dd-folder-header').addEventListener('click', () => {
                        if (q) return;
                        if (prmFolded.has(fname)) prmFolded.delete(fname); else prmFolded.add(fname);
                        prmSaveFolded();
                        renderList(searchEl.value);
                    });
                    listEl.appendChild(folderEl);
                });

                const ungroupedFiltered = ungrouped.filter(p => !q || p.text.toLowerCase().includes(q));
                if (ungroupedFiltered.length) {
                    if (orderedFolders.length) {
                        const lbl = document.createElement('div');
                        lbl.className = 'qrext-dd-group-label';
                        lbl.textContent = '미분류';
                        listEl.appendChild(lbl);
                    }
                    ungroupedFiltered.forEach(p => {
                        const item = document.createElement('div');
                        item.className = 'qrext-dd-item' + (p.value === nativeSel.value ? ' qrext-dd-item-active' : '');
                        item.textContent = p.text;
                        item.addEventListener('click', () => selectPreset(p.value));
                        listEl.appendChild(item);
                    });
                }
                if (!listEl.children.length) listEl.innerHTML = '<div class="qrext-dd-empty">검색 결과 없음</div>';
            }
        }

        buildDropdown();

        const syncDisplayText = () => {
            const opt = nativeSel.selectedOptions[0];
            const dd  = wrap.querySelector('.qrext-dd-selected-text');
            if (dd && opt) dd.textContent = opt.text.trim();
        };
        nativeSel.addEventListener('change', syncDisplayText);

        // jQuery trigger('change') 대응 (Quick Preset 등 외부 확장 호환)
        if (window.jQuery) {
            window.jQuery(nativeSel).on('change.prmSync', syncDisplayText);
        }

        const obs = new MutationObserver(() => {
            obs.disconnect();
            if (wrap._outsideClose) document.removeEventListener('pointerdown', wrap._outsideClose);
            wrap.remove();
            delete nativeSel.dataset.prmHooked;
            nativeSel.style.position = '';
            nativeSel.style.visibility = '';
            nativeSel.style.pointerEvents = '';
            nativeSel.style.width = '';
            nativeSel.style.height = '';
            nativeSel.style.overflow = '';
            nativeSel.style.opacity = '';
            if (window.jQuery) window.jQuery(nativeSel).off('change.prmSync');
            if (prmEnabled) prmInstallDropdown();
        });
        obs.observe(nativeSel, { childList: true });
    }

    function prmRemoveDropdown() {
        const wrap = document.getElementById('prm-custom-dropdown');
        if (wrap) {
            if (wrap._outsideClose) document.removeEventListener('pointerdown', wrap._outsideClose);
            wrap.remove();
        }
        const sel = document.getElementById('settings_preset_openai');
        if (sel) {
            delete sel.dataset.prmHooked;
            sel.style.position = '';
            sel.style.visibility = '';
            sel.style.pointerEvents = '';
            sel.style.width = '';
            sel.style.height = '';
            sel.style.overflow = '';
            sel.style.opacity = '';
            if (window.jQuery) window.jQuery(sel).off('change.prmSync');
        }
    }

    function prmRebuildDropdown() {
        prmRemoveDropdown();
        prmInstallDropdown();
    }

    /* ── 툴바 버튼 ────────────────────────────────────────────── */
    function installPresetBtn() {
        const toolbar = document.getElementById('etn-toolbar');
        if (!toolbar || toolbar.querySelector('#etn-preset-btn')) return;
        const settingsBtn = toolbar.querySelector('#etn-settings-btn');
        const btn = document.createElement('button');
		btn.id = 'etn-preset-btn';
		btn.className = 'etn-toolbar-btn' + (prmEnabled ? ' qrext-active' : '');
		btn.title = 'Preset 폴더 관리';
        btn.innerHTML = '<i class="fa-solid fa-layer-group"></i>';
        btn.addEventListener('click', e => {
            e.stopPropagation();
            document.getElementById('etn-preset-popup') ? closePresetPopup() : openPresetPopup();
        });
        if (settingsBtn) settingsBtn.insertAdjacentElement('beforebegin', btn);
        else toolbar.appendChild(btn);
    }

    /* ── 팝업 ─────────────────────────────────────────────────── */
    var prmOutsideHandler = null;

    function openPresetPopup() {
        if (document.getElementById('etn-preset-popup')) return;
        const nav = document.getElementById('etn-nav');
        if (!nav) return;
        const popup = document.createElement('div');
        popup.id = 'etn-preset-popup';
        renderPresetPopup(popup);
        nav.appendChild(popup);
        setTimeout(() => {
            prmOutsideHandler = e => {
                const p = document.getElementById('etn-preset-popup');
                if (!p) { document.removeEventListener('pointerdown', prmOutsideHandler, true); return; }
                if (document.getElementById('prm-pick-modal')) return;
                const presetBtn = document.getElementById('etn-preset-btn');
                if (presetBtn && presetBtn.contains(e.target)) return;
                if (!p.contains(e.target)) closePresetPopup();
            };
            document.addEventListener('pointerdown', prmOutsideHandler, true);
        }, 0);
    }

    function closePresetPopup() {
        const p = document.getElementById('etn-preset-popup');
        if (p) p.remove();
        if (prmOutsideHandler) { document.removeEventListener('pointerdown', prmOutsideHandler, true); prmOutsideHandler = null; }
    }

    function renderPresetPopup(popup) {
        popup.innerHTML =
            '<div class="qrext-popup-header">' +
                '<span class="qrext-popup-title"><i class="fa-solid fa-layer-group"></i> Preset 폴더 관리</span>' +
                '<button class="qrext-popup-close"><i class="fa-solid fa-xmark"></i></button>' +
            '</div>' +
            '<div class="qrext-popup-body">' +
                '<div class="qrext-section">' +
                    '<div class="qrext-section-title">전체 기능</div>' +
                    '<label class="qrext-toggle-row">' +
                        '<span>Preset 폴더 UI 활성화</span>' +
                        '<div class="qrext-toggle ' + (prmEnabled ? 'qrext-toggle-on' : '') + '" id="prm-main-toggle" role="switch" tabindex="0" aria-checked="' + prmEnabled + '">' +
                            '<div class="qrext-toggle-knob"></div>' +
                        '</div>' +
                    '</label>' +
                '</div>' +
                '<div class="qrext-section">' +
                    '<div class="qrext-section-title">설정 백업 / 복원</div>' +
                    '<p class="qrext-backup-hint">폴더 구조와 순서를 JSON 파일로 내보내거나 불러옵니다.</p>' +
                    '<div class="qrext-backup-row">' +
                        '<button class="qrext-backup-btn qrext-backup-export" id="prm-export-btn"><i class="fa-solid fa-download"></i> 내보내기</button>' +
                        '<button class="qrext-backup-btn qrext-backup-import" id="prm-import-btn"><i class="fa-solid fa-upload"></i> 불러오기</button>' +
                        '<input type="file" id="prm-import-file" accept=".json" style="display:none" />' +
                    '</div>' +
                '</div>' +
                '<div class="qrext-section">' +
                    '<div class="qrext-section-title">초기화</div>' +
                    '<button class="qrext-reset-btn" id="prm-reset-btn"><i class="fa-solid fa-rotate-left"></i> 모든 Preset 설정 초기화</button>' +
                '</div>' +
                '<div class="qrext-section">' +
                    '<div class="qrext-section-title">Preset 폴더 관리' +
                        '<button class="qrext-new-folder-btn" id="prm-new-folder-btn"><i class="fa-solid fa-plus"></i> 새 폴더</button>' +
                    '</div>' +
                    '<div class="qrext-folder-hint">Preset 항목을 드래그해서 폴더로 이동 / 폴더 내에서 ↑↓ 순서 변경 가능합니다.</div>' +
                    '<div id="prm-folder-list"></div>' +
                '</div>' +
            '</div>';

        popup.querySelector('.qrext-popup-close').addEventListener('click', closePresetPopup);

        const toggle = popup.querySelector('#prm-main-toggle');
        const doToggle = () => {
            prmEnabled = !prmEnabled;
            prmSaveEnabled(prmEnabled);
            toggle.classList.toggle('qrext-toggle-on', prmEnabled);
            toggle.setAttribute('aria-checked', String(prmEnabled));
            const presetBtn = document.getElementById('etn-preset-btn');
            if (presetBtn) presetBtn.classList.toggle('qrext-active', prmEnabled);
            if (prmEnabled) prmInstallDropdown(); else prmRemoveDropdown();
        };
        toggle.addEventListener('click', doToggle);
        toggle.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') doToggle(); });

        popup.querySelector('#prm-export-btn').addEventListener('click', () => {
            const backup = { version: 1, exportedAt: new Date().toISOString(), prmEnabled, prmFolders, prmFolderOrder, prmFolded: [...prmFolded] };
            const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = 'preset_backup_' + new Date().toISOString().slice(0,10) + '.json';
            document.body.appendChild(a); a.click();
            setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1000);
        });

        const importFile = popup.querySelector('#prm-import-file');
        popup.querySelector('#prm-import-btn').addEventListener('click', () => { importFile.value = ''; importFile.click(); });
        importFile.addEventListener('change', () => {
            const file = importFile.files[0]; if (!file) return;
            const reader = new FileReader();
            reader.onload = e => {
                try {
                    const data = JSON.parse(e.target.result);
                    if (!data || typeof data.prmFolders !== 'object') { alert('올바른 백업 파일이 아닙니다.'); return; }
                    if (!confirm('현재 설정을 백업 파일로 덮어씁니다. 계속할까요?')) return;
                    prmFolders = data.prmFolders || {};
                    prmFolderOrder = data.prmFolderOrder || [];
                    prmFolded = new Set(data.prmFolded || []);
                    prmSaveFolders(); prmSaveFolderOrder(); prmSaveFolded();
                    if (typeof data.prmEnabled === 'boolean') { prmEnabled = data.prmEnabled; prmSaveEnabled(prmEnabled); }
                    renderPresetPopup(popup);
                } catch { alert('파일을 읽는 중 오류가 발생했습니다.'); }
            };
            reader.readAsText(file);
        });

        popup.querySelector('#prm-new-folder-btn').addEventListener('click', () => {
            const name = prompt('새 폴더 이름:');
            if (!name || !name.trim()) return;
            const t = name.trim();
            if (prmFolders[t]) { alert('이미 존재하는 이름입니다.'); return; }
            prmFolders[t] = [];
            prmSaveFolders();
            refreshPresetFolderList(popup);
        });

        popup.addEventListener('click', e => e.stopPropagation());
        popup.addEventListener('pointerdown', e => e.stopPropagation());
        popup.querySelector('#prm-reset-btn').addEventListener('click', () => {
            if (!confirm('Preset 확장의 모든 설정(폴더, 순서, 활성화 여부)을 초기화할까요? 이 작업은 되돌릴 수 없습니다.')) return;
            prmFolders = {}; prmFolderOrder = []; prmFolded = new Set(); prmEnabled = true;
            prmSaveFolders(); prmSaveFolderOrder(); prmSaveFolded(); prmSaveEnabled(true);
            renderPresetPopup(popup);
        });
        refreshPresetFolderList(popup);
    }
    function refreshPresetFolderList(popup) {
        const listEl = popup.querySelector('#prm-folder-list');
        if (!listEl) return;
        const allPresets = prmGetAllPresets();
        const inFolder   = new Set();
        Object.values(prmFolders).forEach(arr => arr.forEach(v => inFolder.add(v)));
        const ungrouped  = allPresets.filter(p => !inFolder.has(p.value));
        const orderedNames = prmGetOrderedFolderNames();

        let html = '';
        orderedNames.forEach((fname, idx) => {
            const values  = prmFolders[fname] || [];
            const valid   = values.map(v => allPresets.find(p => p.value === v)).filter(Boolean);
            const isFolded = prmFolded.has('popup_' + fname);
            const isFirst  = idx === 0;
            const isLast   = idx === orderedNames.length - 1;
            html +=
                '<div class="qrext-folder-row" data-fname="' + prmEsc(fname) + '">' +
                    '<div class="qrext-folder-row-header">' +
                        '<i class="fa-solid ' + (isFolded ? 'fa-folder' : 'fa-folder-open') + ' qrext-fr-icon qrext-fr-fold-toggle" data-fname="' + prmEsc(fname) + '" title="접기/펼치기" style="cursor:pointer"></i>' +
                        '<span class="qrext-fr-name qrext-fr-fold-toggle" data-fname="' + prmEsc(fname) + '" style="cursor:pointer">' + prmEsc(fname) + '</span>' +
                        '<span class="qrext-fr-count">' + valid.length + '</span>' +
                        '<button class="qrext-fr-move-up" data-fname="' + prmEsc(fname) + '" title="폴더 위로" ' + (isFirst ? 'disabled' : '') + '><i class="fa-solid fa-chevron-up"></i></button>' +
                        '<button class="qrext-fr-move-down" data-fname="' + prmEsc(fname) + '" title="폴더 아래로" ' + (isLast ? 'disabled' : '') + '><i class="fa-solid fa-chevron-down"></i></button>' +
                        '<button class="qrext-fr-rename" data-fname="' + prmEsc(fname) + '" title="이름 변경"><i class="fa-solid fa-pencil"></i></button>' +
                        '<button class="qrext-fr-delete" data-fname="' + prmEsc(fname) + '" title="폴더 삭제"><i class="fa-solid fa-trash"></i></button>' +
                    '</div>' +
                    (isFolded ? '' :
                    '<div class="qrext-fr-sets">' +
                        valid.map((p, si) =>
                            '<div class="qrext-fr-set-item" draggable="true" data-set="' + prmEsc(p.value) + '" data-folder="' + prmEsc(fname) + '" data-sidx="' + si + '">' +
                                '<i class="fa-solid fa-grip-vertical qrext-fr-drag"></i>' +
                                '<span>' + prmEsc(p.text) + '</span>' +
                                '<button class="qrext-fr-set-move-up" data-set="' + prmEsc(p.value) + '" data-folder="' + prmEsc(fname) + '" title="위로" ' + (si === 0 ? 'disabled' : '') + '><i class="fa-solid fa-chevron-up"></i></button>' +
                                '<button class="qrext-fr-set-move-down" data-set="' + prmEsc(p.value) + '" data-folder="' + prmEsc(fname) + '" title="아래로" ' + (si === valid.length - 1 ? 'disabled' : '') + '><i class="fa-solid fa-chevron-up"></i></button>' +
                                '<button class="qrext-fr-remove-set" data-set="' + prmEsc(p.value) + '" data-folder="' + prmEsc(fname) + '" title="제거"><i class="fa-solid fa-xmark"></i></button>' +
                            '</div>'
                        ).join('') +
                        '<div class="qrext-fr-drop-zone" data-folder="' + prmEsc(fname) + '">여기에 드롭하여 추가</div>' +
                        '<button class="qrext-fr-add-set-btn" data-folder="' + prmEsc(fname) + '" title="Preset 추가"><i class="fa-solid fa-plus"></i> Preset 추가</button>' +
                    '</div>') +
                '</div>';
        });

        if (ungrouped.length) {
            html +=
                '<div class="qrext-folder-row qrext-ungrouped">' +
                    '<div class="qrext-folder-row-header">' +
                        '<i class="fa-solid fa-layer-group qrext-fr-icon" style="color:var(--etn-text-dim)"></i>' +
                        '<span class="qrext-fr-name" style="color:var(--etn-text-dim)">미분류</span>' +
                        '<span class="qrext-fr-count">' + ungrouped.length + '</span>' +
                    '</div>' +
                    '<div class="qrext-fr-sets">' +
                        ungrouped.map(p =>
                            '<div class="qrext-fr-set-item" draggable="true" data-set="' + prmEsc(p.value) + '" data-folder="">' +
                                '<i class="fa-solid fa-grip-vertical qrext-fr-drag"></i>' +
                                '<span>' + prmEsc(p.text) + '</span>' +
                            '</div>'
                        ).join('') +
                    '</div>' +
                '</div>';
        }

        listEl.innerHTML = html || '<div class="qrext-empty-hint">Preset이 없습니다.</div>';
        bindPresetFolderEvents(popup);
        if (prmEnabled) prmRebuildDropdown(); else prmRemoveDropdown();
    }

    function bindPresetFolderEvents(popup) {
        const listEl = popup.querySelector('#prm-folder-list');
        if (!listEl) return;

        listEl.querySelectorAll('.qrext-fr-fold-toggle').forEach(el => {
            el.addEventListener('click', e => {
                e.stopPropagation();
                const key = 'popup_' + el.dataset.fname;
                if (prmFolded.has(key)) prmFolded.delete(key); else prmFolded.add(key);
                prmSaveFolded();
                refreshPresetFolderList(popup);
            });
        });

        listEl.querySelectorAll('.qrext-fr-move-up, .qrext-fr-move-down').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                const fname = btn.dataset.fname;
                prmFolderOrder = [...prmGetOrderedFolderNames()];
                const idx = prmFolderOrder.indexOf(fname);
                if (idx === -1) return;
                const isUp = btn.classList.contains('qrext-fr-move-up');
                const swapIdx = isUp ? idx - 1 : idx + 1;
                if (swapIdx < 0 || swapIdx >= prmFolderOrder.length) return;
                [prmFolderOrder[idx], prmFolderOrder[swapIdx]] = [prmFolderOrder[swapIdx], prmFolderOrder[idx]];
                prmSaveFolderOrder();
                refreshPresetFolderList(popup);
            });
        });

        listEl.querySelectorAll('.qrext-fr-delete').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                const fname = btn.dataset.fname;
                if (!confirm('폴더 "' + fname + '"를 삭제할까요? (Preset은 미분류로 이동됩니다)')) return;
                delete prmFolders[fname];
                prmSaveFolders();
                refreshPresetFolderList(popup);
            });
        });

        listEl.querySelectorAll('.qrext-fr-rename').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                const fname = btn.dataset.fname;
                const newName = prompt('새 폴더 이름:', fname);
                if (!newName || !newName.trim() || newName.trim() === fname) return;
                const t = newName.trim();
                if (prmFolders[t]) { alert('이미 존재하는 이름입니다.'); return; }
                prmFolders[t] = prmFolders[fname];
                delete prmFolders[fname];
                if (prmFolded.has('popup_' + fname)) { prmFolded.delete('popup_' + fname); prmFolded.add('popup_' + t); prmSaveFolded(); }
                prmSaveFolders();
                refreshPresetFolderList(popup);
            });
        });

        listEl.querySelectorAll('.qrext-fr-remove-set').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                const { set: val, folder: fname } = btn.dataset;
                if (!prmFolders[fname]) return;
                prmFolders[fname] = prmFolders[fname].filter(v => v !== val);
                prmSaveFolders();
                refreshPresetFolderList(popup);
            });
        });

        listEl.querySelectorAll('.qrext-fr-set-move-up, .qrext-fr-set-move-down').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                const { set: val, folder: fname } = btn.dataset;
                if (!prmFolders[fname]) return;
                const arr = prmFolders[fname];
                const idx = arr.indexOf(val);
                if (idx === -1) return;
                const isUp = btn.classList.contains('qrext-fr-set-move-up');
                const swapIdx = isUp ? idx - 1 : idx + 1;
                if (swapIdx < 0 || swapIdx >= arr.length) return;
                [arr[idx], arr[swapIdx]] = [arr[swapIdx], arr[idx]];
                prmSaveFolders();
                refreshPresetFolderList(popup);
            });
        });

        listEl.querySelectorAll('.qrext-fr-add-set-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                openPresetPickModal(btn.dataset.folder, popup);
            });
        });

        let dragVal = null, dragFrom = null;
        listEl.querySelectorAll('.qrext-fr-set-item[draggable="true"]').forEach(item => {
            item.addEventListener('dragstart', e => {
                dragVal = item.dataset.set; dragFrom = item.dataset.folder;
                item.classList.add('qrext-fr-dragging');
                e.dataTransfer.effectAllowed = 'move';
            });
            item.addEventListener('dragend', () => {
                item.classList.remove('qrext-fr-dragging');
                listEl.querySelectorAll('.qrext-fr-drop-zone').forEach(z => z.classList.remove('qrext-drop-active'));
            });
        });

        listEl.querySelectorAll('.qrext-fr-drop-zone').forEach(zone => {
            zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('qrext-drop-active'); });
            zone.addEventListener('dragleave', () => zone.classList.remove('qrext-drop-active'));
            zone.addEventListener('drop', e => {
                e.preventDefault();
                zone.classList.remove('qrext-drop-active');
                const toFolder = zone.dataset.folder;
                if (!dragVal || !toFolder) return;
                if (dragFrom && prmFolders[dragFrom]) prmFolders[dragFrom] = prmFolders[dragFrom].filter(v => v !== dragVal);
                if (prmFolders[toFolder] && !prmFolders[toFolder].includes(dragVal)) prmFolders[toFolder].push(dragVal);
                prmSaveFolders();
                refreshPresetFolderList(popup);
                dragVal = null; dragFrom = null;
            });
        });
    }

    function openPresetPickModal(fname, popup) {
        if (document.getElementById('prm-pick-modal')) return;
        const allPresets = prmGetAllPresets();
        const already    = new Set(prmFolders[fname] || []);
        const inOther    = new Set();
        Object.entries(prmFolders).forEach(([f, vals]) => { if (f === fname) return; vals.forEach(v => inOther.add(v)); });
        const pickable   = allPresets.filter(p => !inOther.has(p.value));

        const modal = document.createElement('div');
        modal.id = 'prm-pick-modal';
        modal.className = 'qrext-set-pick-modal';

        ['click','pointerdown','mousedown','touchstart','touchend'].forEach(evtName => {
            modal.addEventListener(evtName, e => { if (e.target !== modal) e.stopPropagation(); });
        });

        function renderModal(query, preserveScroll) {
            const listEl = modal.querySelector('.qrext-set-pick-list');
            const scrollTop = (preserveScroll && listEl) ? listEl.scrollTop : 0;
            const q = query.trim().toLowerCase();
            const filtered = pickable.filter(p => !q || p.text.toLowerCase().includes(q));
            const listHtml = filtered.length
                ? filtered.map(p =>
                    '<div class="qrext-set-pick-item' + (already.has(p.value) ? ' qrext-pick-selected' : '') + '" data-value="' + prmEsc(p.value) + '">' +
                        '<i class="fa-solid ' + (already.has(p.value) ? 'fa-check' : 'fa-plus') + ' qrext-pick-icon"></i>' +
                        prmEsc(p.text) +
                    '</div>'
                ).join('')
                : '<div class="qrext-set-pick-empty">검색 결과 없음</div>';

            if (!modal.querySelector('.qrext-set-pick-inner')) {
                modal.innerHTML =
                    '<div class="qrext-set-pick-inner">' +
                        '<div class="qrext-set-pick-header">' +
                            '<span><i class="fa-solid fa-folder" style="margin-right:6px;color:var(--etn-accent)"></i>' + prmEsc(fname) + ' — Preset 추가</span>' +
                            '<button class="qrext-set-pick-close"><i class="fa-solid fa-xmark"></i></button>' +
                        '</div>' +
                        '<div class="qrext-set-pick-search-wrap">' +
                            '<i class="fa-solid fa-magnifying-glass"></i>' +
                            '<input class="qrext-set-pick-search" type="text" placeholder="Preset 검색..." autocomplete="off" />' +
                        '</div>' +
                        '<div class="qrext-set-pick-list"></div>' +
                    '</div>';

                modal.querySelector('.qrext-set-pick-close').addEventListener('click', e => { e.stopPropagation(); modal.remove(); });
                modal.querySelector('.qrext-set-pick-search').addEventListener('input', function() { renderModal(this.value, false); });
                modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
                setTimeout(() => modal.querySelector('.qrext-set-pick-search').focus(), 0);
            }

            const newListEl = modal.querySelector('.qrext-set-pick-list');
            newListEl.innerHTML = listHtml;
            if (preserveScroll) newListEl.scrollTop = scrollTop;

            newListEl.querySelectorAll('.qrext-set-pick-item').forEach(item => {
                item.addEventListener('click', e => {
                    e.stopPropagation();
                    const val = item.dataset.value;
                    if (!prmFolders[fname]) prmFolders[fname] = [];
                    if (already.has(val)) {
                        prmFolders[fname] = prmFolders[fname].filter(v => v !== val);
                        already.delete(val);
                    } else {
                        prmFolders[fname].push(val);
                        already.add(val);
                    }
                    prmSaveFolders();
                    refreshPresetFolderList(popup);
                    renderModal(modal.querySelector('.qrext-set-pick-search').value, true);
                });
            });
        }

        renderModal('', false);
        const etnNav = document.getElementById('etn-nav');
        (etnNav || document.body).appendChild(modal);
    }

    /* ── 초기화 ───────────────────────────────────────────────── */
    const presetInitTimer = setInterval(() => {
        if (document.getElementById('etn-toolbar') && document.getElementById('settings_preset_openai')) {
            installPresetBtn();
            if (prmEnabled) prmInstallDropdown();
            clearInterval(presetInitTimer);
        }
    }, 300);

    const presetObserver = new MutationObserver(() => {
        installPresetBtn();
        if (prmEnabled && document.getElementById('settings_preset_openai') && !document.getElementById('prm-custom-dropdown')) {
            prmInstallDropdown();
        }
    });
    presetObserver.observe(document.body, { subtree: true, childList: true });

})();