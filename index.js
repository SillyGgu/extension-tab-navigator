// Extension Tab Navigator for SillyTavern

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

        // label 탐색: b/strong
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
				'<span class="etn-toolbar-label">너비</span>' +
				'<input id="etn-width-slider" type="range" min="30" max="100" step="1" value="' + loadWidth() + '" />' +
				'<span id="etn-width-value" class="etn-toolbar-value">' + loadWidth() + '%</span>' +
				'<div class="etn-toolbar-sep"></div>' +
				'<button id="etn-settings-btn" class="etn-toolbar-btn" title="설정">' +
					'<i class="fa-solid fa-gear"></i>' +
				'</button>' +
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

        setupScrollInteractions(nav.querySelector('#etn-scroll-bar'));

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
		nav.querySelector('#etn-settings-btn').addEventListener('pointerdown', function(e) {
			e.stopPropagation();
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

        var isDown = false, startX = 0, scrollLeft = 0, didDrag = false;
        scrollEl.addEventListener('mousedown', function(e) {
            if (e.target.closest('.etn-icon-btn')) return;
            if (e.target.closest('input, textarea, select, button, a')) return;
            if (e.target.isContentEditable) return;
            isDown = true;
            didDrag = false;
            scrollEl.classList.add('dragging');
            startX = e.pageX - scrollEl.offsetLeft;
            scrollLeft = scrollEl.scrollLeft;
        });
        document.addEventListener('mouseup', function() {
            isDown = false;
            didDrag = false;
            scrollEl.classList.remove('dragging');
        });
        scrollEl.addEventListener('mousemove', function(e) {
            if (!isDown) return;
            const delta = e.pageX - scrollEl.offsetLeft - startX;
            if (Math.abs(delta) > 3) didDrag = true;
            if (!didDrag) return;
            e.preventDefault();
            scrollEl.scrollLeft = scrollLeft - delta;
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