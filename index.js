
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
				var isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
				if (isTouchDevice) { e.stopPropagation(); return; }
                e.stopPropagation();
                togglePin(p.id);
            });
            btn.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') btn.click();
            });
            trackEl.appendChild(btn);
        });
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

    /* ── 상태 ────────────────────────────────────────────────── */
    let qrEnabled = loadQrEnabled();
    let qrFolders = loadQrFolders();
    let qrFolded  = loadQrFolded();

    function loadQrEnabled()  { try { const v = localStorage.getItem(QREXT_ENABLED_KEY); return v === null ? true : v === 'true'; } catch { return true; } }
    function saveQrEnabled(v) { try { localStorage.setItem(QREXT_ENABLED_KEY, String(v)); } catch {} }
    function loadQrFolders()  { try { return JSON.parse(localStorage.getItem(QREXT_FOLDERS_KEY)) || {}; } catch { return {}; } }
    function saveQrFolders()  { try { localStorage.setItem(QREXT_FOLDERS_KEY, JSON.stringify(qrFolders)); } catch {} }
    function loadQrFolded()   { try { return new Set(JSON.parse(localStorage.getItem(QREXT_FOLDED_KEY)) || []); } catch { return new Set(); } }
    function saveQrFolded()   { try { localStorage.setItem(QREXT_FOLDED_KEY, JSON.stringify([...qrFolded])); } catch {} }

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
        btn.addEventListener('pointerdown', e => e.stopPropagation());
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
                    '<div class="qrext-section-title">Edit QR 폴더 관리' +
                        '<button class="qrext-new-folder-btn" id="qrext-new-folder-btn"><i class="fa-solid fa-plus"></i> 새 폴더</button>' +
                    '</div>' +
                    '<div class="qrext-folder-hint">세트 항목을 드래그해서 폴더로 이동할 수 있습니다.</div>' +
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

        popup.addEventListener('click', e => e.stopPropagation());
        popup.addEventListener('pointerdown', e => e.stopPropagation());

        refreshQrFolderList(popup);
    }

    function refreshQrFolderList(popup) {
        const listEl = popup.querySelector('#qrext-folder-list');
        if (!listEl) return;
        const allNames = getAllSetNames();
        const inFolder = new Set();
        Object.values(qrFolders).forEach(arr => arr.forEach(n => inFolder.add(n)));
        const ungrouped = allNames.filter(n => !inFolder.has(n));

        let html = '';
        Object.entries(qrFolders).forEach(([fname, sets]) => {
            const valid = sets.filter(s => allNames.includes(s));
            html +=
                '<div class="qrext-folder-row" data-fname="' + qrEscHtml(fname) + '">' +
                    '<div class="qrext-folder-row-header">' +
                        '<i class="fa-solid fa-folder qrext-fr-icon"></i>' +
                        '<span class="qrext-fr-name">' + qrEscHtml(fname) + '</span>' +
                        '<span class="qrext-fr-count">' + valid.length + '</span>' +
                        '<button class="qrext-fr-rename" data-fname="' + qrEscHtml(fname) + '" title="이름 변경"><i class="fa-solid fa-pencil"></i></button>' +
                        '<button class="qrext-fr-delete" data-fname="' + qrEscHtml(fname) + '" title="폴더 삭제"><i class="fa-solid fa-trash"></i></button>' +
                    '</div>' +
                    '<div class="qrext-fr-sets">' +
                        valid.map(s =>
                            '<div class="qrext-fr-set-item" draggable="true" data-set="' + qrEscHtml(s) + '" data-folder="' + qrEscHtml(fname) + '">' +
                                '<i class="fa-solid fa-grip-vertical qrext-fr-drag"></i>' +
                                '<span>' + qrEscHtml(s) + '</span>' +
                                '<button class="qrext-fr-remove-set" data-set="' + qrEscHtml(s) + '" data-folder="' + qrEscHtml(fname) + '" title="제거"><i class="fa-solid fa-xmark"></i></button>' +
                            '</div>'
                        ).join('') +
                        '<div class="qrext-fr-drop-zone" data-folder="' + qrEscHtml(fname) + '">여기에 드롭하여 추가</div>' +
                        '<button class="qrext-fr-add-set-btn" data-folder="' + qrEscHtml(fname) + '" title="세트 추가">' +
                            '<i class="fa-solid fa-plus"></i> 세트 추가' +
                        '</button>' +
                    '</div>' +
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

        // 드롭다운도 갱신
        const dd = document.getElementById('qrext-editor-dropdown');
        if (dd) { dd.remove(); const sel = document.querySelector('#qr--editor #qr--set'); if (sel) { delete sel.dataset.qrextHooked; sel.classList.remove('qrext-hidden-select'); } if (qrEnabled) installEditorDropdown(); }
    }

    function bindQrFolderEvents(popup) {
        const listEl = popup.querySelector('#qrext-folder-list');
        if (!listEl) return;

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
            const filtered = allNames.filter(n => !q || n.toLowerCase().includes(q));
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