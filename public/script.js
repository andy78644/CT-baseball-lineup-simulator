/**
 * 中華隊先發陣容預測 - Taiwan Baseball Lineup Selector
 * UI/UX Pro Max Enhanced Version
 */

document.addEventListener('DOMContentLoaded', () => {
    // ============================================
    // Data
    // ============================================
    const rosterData = {
        pitchers: ['林昱珉', '陳柏毓', '沙子宸', '林維恩', '徐若熙', '陳冠宇', '孫易磊', '莊陳仲敖', '古林睿煬', '鄭浩均', '胡智爲', '林凱威', '張奕', '林詩翔', '曾峻岳', '張峻瑋'],
        catchers: ['林家正', '蔣少宏', '吉力吉撈．鞏冠'],
        infielders: ['張育成', '林子偉', '吳念庭', '江坤宇', '鄭宗哲', '李灝宇', 'Jonathon Long'],
        outfielders: ['陳傑憲', '林安可', '陳晨威', 'Stuart Fairchild']
    };

    // Helper to find player category
    function getPlayerCategory(name) {
        if (rosterData.pitchers.includes(name)) return 'pitchers';
        if (rosterData.catchers.includes(name)) return 'catchers';
        if (rosterData.infielders.includes(name)) return 'infielders';
        if (rosterData.outfielders.includes(name)) return 'outfielders';
        return null;
    }

    // Allowed positions mapping
    const allowedPositions = {
        pitchers: [], // Pitchers restricted to SP/RP/CP slots only
        catchers: ['C', 'DH', '1B'],
        infielders: ['1B', '2B', '3B', 'SS', 'DH'],
        outfielders: ['LF', 'CF', 'RF', 'DH']
    };

    // ============================================
    // State
    // ============================================
    const state = {
        lineup: {
            1: { player: null, pos: null },
            2: { player: null, pos: null },
            3: { player: null, pos: null },
            4: { player: null, pos: null },
            5: { player: null, pos: null },
            6: { player: null, pos: null },
            7: { player: null, pos: null },
            8: { player: null, pos: null },
            9: { player: null, pos: null },
            SP: { player: null, pos: 'SP' },
            RP: { player: null, pos: 'RP' },
            CP: { player: null, pos: 'CP' }
        },
        selectedSlot: null
    };

    // ============================================
    // Toast Notification System
    // ============================================
    const toastContainer = document.getElementById('toastContainer');

    function showToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        // Icon based on type
        const icons = {
            success: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>',
            error: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
            info: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>'
        };

        toast.innerHTML = `${icons[type] || icons.info}<span>${message}</span>`;
        toastContainer.appendChild(toast);

        // Auto remove
        setTimeout(() => {
            toast.style.animation = 'toastSlideOut 0.3s ease-in forwards';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    // Add slide out animation to CSS dynamically
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
        @keyframes toastSlideOut {
            from { opacity: 1; transform: translateX(0); }
            to { opacity: 0; transform: translateX(100%); }
        }
    `;
    document.head.appendChild(styleSheet);

    // ============================================
    // DOM Elements
    // ============================================
    const rosterList = document.getElementById('rosterList');
    const battingSlotsContainer = document.getElementById('battingSlots');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const submitBtn = document.getElementById('submitBtn');
    const fieldPositions = document.querySelectorAll('.field-pos');

    // ============================================
    // Init Batting Slots (1-9)
    // ============================================
    for (let i = 1; i <= 9; i++) {
        const slotDiv = document.createElement('div');
        slotDiv.className = 'order-slot';
        slotDiv.dataset.slot = i;
        slotDiv.setAttribute('tabindex', '0');
        slotDiv.innerHTML = `
            <span class="slot-num">${i}</span>
            <div class="slot-content">
                <span class="placeholder">請選擇球員</span>
                <div class="player-info" hidden>
                    <span class="player-name"></span>
                    <select class="pos-select" aria-label="選擇守備位置">
                        <option value="" disabled selected>守位</option>
                    </select>
                </div>
            </div>
            <button class="clear-btn" hidden aria-label="清除選擇">×</button>
        `;
        battingSlotsContainer.appendChild(slotDiv);
    }

    // ============================================
    // Event Listeners for Slots
    // ============================================
    document.querySelectorAll('.order-slot').forEach(slot => {
        slot.addEventListener('click', (e) => {
            if (e.target.tagName === 'SELECT' || e.target.closest('.clear-btn')) return;
            selectSlot(slot.dataset.slot);
        });

        // Keyboard support
        slot.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                selectSlot(slot.dataset.slot);
            }
        });

        const select = slot.querySelector('.pos-select');
        if (select) {
            select.addEventListener('change', (e) => {
                updatePosition(slot.dataset.slot, e.target.value);
            });
            select.addEventListener('click', (e) => e.stopPropagation());
        }

        const clearBtn = slot.querySelector('.clear-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                clearSlot(slot.dataset.slot);
            });
        }
    });

    // ============================================
    // Event Listeners for Tabs
    // ============================================
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-selected', 'false');
            });
            btn.classList.add('active');
            btn.setAttribute('aria-selected', 'true');
            renderRoster(btn.dataset.type);
        });
    });

    // ============================================
    // Initial Render
    // ============================================
    renderRoster('pitchers');
    fetchHistory();

    // ============================================
    // Render Functions
    // ============================================
    function renderRoster(type) {
        rosterList.innerHTML = '';

        const isPitcherSlot = state.selectedSlot && ['SP', 'RP', 'CP'].includes(state.selectedSlot);
        const isBattingSlot = state.selectedSlot && !['SP', 'RP', 'CP'].includes(state.selectedSlot);

        rosterData[type].forEach((player, index) => {
            const div = document.createElement('div');
            div.className = 'player-card';
            div.textContent = player;
            div.setAttribute('tabindex', '0');
            div.setAttribute('role', 'option');

            // Staggered animation
            div.style.animationDelay = `${index * 30}ms`;

            // Check if already selected
            const isSelected = Object.values(state.lineup).some(s => s.player === player);

            // Check if pitcher being shown for batting slot (should be disabled)
            const isPitcher = type === 'pitchers';
            const isDisabledForSlot = (isPitcher && isBattingSlot) || (!isPitcher && isPitcherSlot);

            if (isSelected) {
                div.classList.add('selected');
                div.setAttribute('aria-disabled', 'true');
            } else if (isDisabledForSlot) {
                div.classList.add('disabled');
                div.setAttribute('aria-disabled', 'true');
                div.title = isPitcher ? '投手只能選擇 SP/RP/CP 位置' : '野手不能擔任投手';
            }

            div.addEventListener('click', () => {
                if (div.classList.contains('selected')) {
                    return;
                }
                if (div.classList.contains('disabled')) {
                    showToast(isPitcher ? '投手只能選擇 SP/RP/CP 位置' : '野手不能擔任投手', 'error');
                    return;
                }
                if (!state.selectedSlot) {
                    showToast('請先點選一個打序位置', 'info');
                    return;
                }
                tryAssignPlayer(player, state.selectedSlot);
            });

            // Keyboard support
            div.addEventListener('keydown', (e) => {
                if ((e.key === 'Enter' || e.key === ' ') && !div.classList.contains('selected') && !div.classList.contains('disabled') && state.selectedSlot) {
                    e.preventDefault();
                    tryAssignPlayer(player, state.selectedSlot);
                }
            });

            rosterList.appendChild(div);
        });
    }

    function selectSlot(slotId) {
        state.selectedSlot = slotId;
        document.querySelectorAll('.order-slot').forEach(s => s.classList.remove('active'));
        const slotEl = document.querySelector(`.order-slot[data-slot="${slotId}"]`);
        if (slotEl) {
            slotEl.classList.add('active');

            // Give hint about which tab to use
            const isPitcherSlot = ['SP', 'RP', 'CP'].includes(slotId);
            if (isPitcherSlot) {
                showToast('請從「投手」分頁選擇球員', 'info');
            }
        }

        // Re-render roster to update disabled states
        const activeTab = document.querySelector('.tab-btn.active');
        if (activeTab) {
            renderRoster(activeTab.dataset.type);
        }
    }

    // ============================================
    // Position Logic
    // ============================================
    function getAvailablePositions(category, currentSlotId) {
        const allowed = allowedPositions[category] || ['DH'];
        const used = [];
        Object.entries(state.lineup).forEach(([id, data]) => {
            if (id !== currentSlotId.toString() && data.pos) {
                used.push(data.pos);
            }
        });
        return allowed.filter(pos => !used.includes(pos));
    }

    function tryAssignPlayer(playerName, slotId) {
        const category = getPlayerCategory(playerName);
        const isPitcherSlot = ['SP', 'RP', 'CP'].includes(slotId);

        // Validation: Pitchers only in Pitcher slots
        if (category === 'pitchers' && !isPitcherSlot) {
            showToast('投手只能選擇 SP, RP, CP 位置', 'error');
            return;
        }
        // Validation: Non-pitchers only in Batting slots
        if (category !== 'pitchers' && isPitcherSlot) {
            showToast('野手不能擔任投手', 'error');
            return;
        }

        assignPlayerToSlot(playerName, slotId, category);
    }

    function assignPlayerToSlot(playerName, slotId, category) {
        // Update State
        state.lineup[slotId].player = playerName;

        // Update UI
        const slotEl = document.querySelector(`.order-slot[data-slot="${slotId}"]`);
        const placeholder = slotEl.querySelector('.placeholder');
        const playerInfo = slotEl.querySelector('.player-info');

        // Batting Slots (1-9) have dropdowns
        if (!['SP', 'RP', 'CP'].includes(slotId)) {
            placeholder.hidden = true;
            playerInfo.hidden = false;

            const nameSpan = playerInfo.querySelector('.player-name');
            nameSpan.textContent = playerName;

            const select = playerInfo.querySelector('.pos-select');
            state.lineup[slotId].pos = null;
            select.value = "";

            updateDropdownOptions(slotId, category);

        } else {
            // Pitcher slots (SP/RP/CP)
            const contentDiv = slotEl.querySelector('.slot-content');
            const existingName = contentDiv.querySelector('.player-name');
            if (existingName) existingName.remove();

            placeholder.hidden = true;

            const nameSpan = document.createElement('span');
            nameSpan.className = 'player-name';
            nameSpan.textContent = playerName;
            contentDiv.appendChild(nameSpan);
        }

        // Show clear button with animation
        const clearBtn = slotEl.querySelector('.clear-btn');
        if (clearBtn) {
            clearBtn.hidden = false;
            clearBtn.style.animation = 'fadeIn 0.2s ease-out';
        }

        // Reset Selection state
        state.selectedSlot = null;
        slotEl.classList.remove('active');

        // Refresh Roster UI
        const activeTab = document.querySelector('.tab-btn.active').dataset.type;
        renderRoster(activeTab);

        updateFieldView();
        refreshAllDropdowns();

        // Show success toast
        showToast(`已選擇 ${playerName}`, 'success', 2000);
    }

    function updateDropdownOptions(slotId, category) {
        const slotEl = document.querySelector(`.order-slot[data-slot="${slotId}"]`);
        const select = slotEl.querySelector('.pos-select');
        if (!select) return;

        const currentVal = select.value;
        const available = getAvailablePositions(category, slotId);

        // Re-populate
        select.innerHTML = '<option value="" disabled>守位</option>';
        available.forEach(pos => {
            const opt = document.createElement('option');
            opt.value = pos;
            opt.textContent = pos;
            select.appendChild(opt);
        });

        // Restore value if still valid
        if (currentVal && (available.includes(currentVal) || currentVal === 'DH')) {
            select.value = currentVal;
        } else if (currentVal) {
            select.value = "";
            state.lineup[slotId].pos = null;
        } else {
            select.value = "";
        }
    }

    function refreshAllDropdowns() {
        Object.keys(state.lineup).forEach(id => {
            if (['SP', 'RP', 'CP'].includes(id)) return;

            const player = state.lineup[id].player;
            if (player) {
                const category = getPlayerCategory(player);
                updateDropdownOptions(id, category);
            }
        });
    }

    function updatePosition(slotId, pos) {
        state.lineup[slotId].pos = pos;
        updateFieldView();
        refreshAllDropdowns();
    }

    function clearSlot(slotId) {
        if (!state.lineup[slotId].player) return;

        const clearedPlayer = state.lineup[slotId].player;
        state.lineup[slotId].player = null;
        if (!['SP', 'RP', 'CP'].includes(slotId)) {
            state.lineup[slotId].pos = null;
        }

        // Update UI
        const slotEl = document.querySelector(`.order-slot[data-slot="${slotId}"]`);

        if (['SP', 'RP', 'CP'].includes(slotId)) {
            slotEl.querySelector('.placeholder').hidden = false;
            const nameSpan = slotEl.querySelector('.player-name');
            if (nameSpan) nameSpan.remove();
        } else {
            slotEl.querySelector('.placeholder').hidden = false;
            const playerInfo = slotEl.querySelector('.player-info');
            playerInfo.hidden = true;

            const select = playerInfo.querySelector('.pos-select');
            select.innerHTML = '<option value="" disabled selected>守位</option>';
        }

        const clearBtn = slotEl.querySelector('.clear-btn');
        if (clearBtn) clearBtn.hidden = true;

        // Refresh Roster
        const activeTab = document.querySelector('.tab-btn.active').dataset.type;
        renderRoster(activeTab);

        updateFieldView();
        refreshAllDropdowns();

        showToast(`已移除 ${clearedPlayer}`, 'info', 2000);
    }

    // ============================================
    // Field View Update
    // ============================================
    function updateFieldView() {
        // Reset all positions
        fieldPositions.forEach(el => {
            el.innerHTML = `<span>${el.dataset.pos}</span>`;
            el.classList.remove('filled');
            el.style.backgroundColor = '';
            el.style.color = '';
        });

        // Fill in positions with player info and batting order
        Object.entries(state.lineup).forEach(([slotId, data]) => {
            if (data.player && data.pos) {
                const el = document.querySelector(`.field-pos[data-pos="${data.pos}"]`);
                if (el) {
                    // For batting order slots (1-9), show the batting order number
                    const battingOrder = !isNaN(parseInt(slotId)) ? `${slotId}棒` : '';
                    el.innerHTML = `
                        <span>${battingOrder ? battingOrder + ' ' : ''}${data.pos}</span>
                        <strong>${data.player}</strong>
                    `;
                    el.classList.add('filled');
                }
            }
        });
    }

    // ============================================
    // Submit Handler
    // ============================================
    submitBtn.addEventListener('click', async () => {
        const name = document.getElementById('coachName').value.trim();
        const email = document.getElementById('coachEmail').value.trim();

        if (!name || !email) {
            showToast('請輸入鍵盤教練姓名和 Email', 'error');
            return;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showToast('請輸入有效的 Email 格式', 'error');
            return;
        }

        // Check lineup completeness
        const usedPos = [];
        let missing = false;

        for (let i = 1; i <= 9; i++) {
            if (!state.lineup[i].player || !state.lineup[i].pos) {
                missing = true;
            } else {
                usedPos.push(state.lineup[i].pos);
            }
        }

        if (missing) {
            showToast('先發 1-9 棒都需要選人並指定守位', 'error');
            return;
        }

        if (!state.lineup['SP'].player) {
            showToast('請選擇先發投手 (SP)', 'error');
            return;
        }

        // Duplicate Position Check
        const uniquePos = new Set(usedPos);
        if (uniquePos.size !== usedPos.length) {
            showToast('守備位置重複了！請檢查', 'error');
            return;
        }

        // Disable button during submit
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.7';
        submitBtn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align: middle; margin-right: 8px; animation: spin 1s linear infinite;">
                <circle cx="12" cy="12" r="10" stroke-dasharray="60" stroke-dashoffset="20"></circle>
            </svg>
            提交中...
        `;

        // Prepare Payload
        const payload = {
            name,
            email,
            lineup: state.lineup
        };

        try {
            const res = await fetch('/api/lineups', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (data.error) {
                showToast('錯誤: ' + data.error, 'error');
            } else {
                showToast('陣容提交成功！🎉', 'success', 4000);
                fetchHistory();
            }
        } catch (err) {
            showToast('網路錯誤，請稍後再試', 'error');
        } finally {
            // Re-enable button
            submitBtn.disabled = false;
            submitBtn.style.opacity = '1';
            submitBtn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align: middle; margin-right: 8px;">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                提交陣容
            `;
        }
    });

    // ============================================
    // Modal
    // ============================================
    const modal = document.getElementById('lineupModal');
    const modalBody = document.getElementById('modalBody');
    const closeModal = document.querySelector('.close-modal');

    closeModal.addEventListener('click', () => {
        modal.classList.add('hidden');
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.add('hidden');
        }
    });

    // Close on Escape key
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
            modal.classList.add('hidden');
        }
    });

    // ============================================
    // History
    // ============================================
    function fetchHistory() {
        const historyContainer = document.getElementById('lineupHistory');

        fetch('/api/lineups')
            .then(res => res.json())
            .then(res => {
                if (res.data && res.data.length > 0) {
                    historyContainer.innerHTML = '';
                    res.data.forEach((item, index) => {
                        let lineup;
                        try {
                            lineup = JSON.parse(item.lineup);
                        } catch (e) { return; }

                        const card = document.createElement('div');
                        card.className = 'history-item';
                        card.style.animationDelay = `${index * 50}ms`;

                        const fourth = lineup['4'] ? lineup['4'].player : '???';
                        const sp = lineup['SP'] ? lineup['SP'].player : '???';

                        card.innerHTML = `
                            <h3>${item.name} 的陣容</h3>
                            <p style="color: var(--text-muted); font-size: 0.8rem;">${new Date(item.created_at).toLocaleString('zh-TW')}</p>
                            <p>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2" style="vertical-align: middle; margin-right: 4px;">
                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                                </svg>
                                第四棒: <span style="color: var(--accent); font-weight: 600;">${fourth}</span>
                            </p>
                            <p>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--info)" stroke-width="2" style="vertical-align: middle; margin-right: 4px;">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <circle cx="12" cy="12" r="3"></circle>
                                </svg>
                                先發投手: <span style="color: var(--info); font-weight: 600;">${sp}</span>
                            </p>
                            <div style="margin-top: 12px; text-align: right; font-size: 0.85rem; color: var(--primary); display: flex; align-items: center; justify-content: flex-end; gap: 4px;">
                                點擊查看詳情
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="9 18 15 12 9 6"></polyline>
                                </svg>
                            </div>
                        `;

                        card.addEventListener('click', () => showLineupDetails(item.name, lineup));
                        card.setAttribute('tabindex', '0');
                        card.addEventListener('keydown', (e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                showLineupDetails(item.name, lineup);
                            }
                        });

                        historyContainer.appendChild(card);
                    });
                } else {
                    historyContainer.innerHTML = `
                        <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted);">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom: 12px; opacity: 0.5;">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                            <p>尚無其他鍵盤教練的陣容</p>
                            <p style="font-size: 0.9rem;">成為第一個提交陣容的鍵盤教練吧！</p>
                        </div>
                    `;
                }
            })
            .catch(err => {
                console.error('Failed to fetch history:', err);
            });
    }

    function showLineupDetails(name, lineup) {
        document.getElementById('modalTitle').textContent = `${name} 的完整陣容`;
        modalBody.innerHTML = '';

        // Create a container for side-by-side layout
        const container = document.createElement('div');
        container.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr; gap: 24px; align-items: start;';

        // Left side: Lineup list
        const listSection = document.createElement('div');

        // 1-9 batting order
        const battingTitle = document.createElement('h4');
        battingTitle.textContent = '打序';
        battingTitle.style.cssText = 'margin: 0 0 12px 0; color: var(--accent); font-size: 0.9rem;';
        listSection.appendChild(battingTitle);

        for (let i = 1; i <= 9; i++) {
            const row = document.createElement('div');
            row.className = 'modal-detail-row';
            const p = lineup[i];
            row.innerHTML = `
                <span style="color: var(--text-muted); font-family: 'Fira Code', monospace; font-weight: 600;">#${i}</span>
                <span style="font-weight: 500;">${p.player || '-'}</span>
                <span style="color: var(--accent); font-family: 'Fira Code', monospace; font-weight: 600;">${p.pos || '-'}</span>
            `;
            listSection.appendChild(row);
        }

        // Divider
        const divider = document.createElement('div');
        divider.style.cssText = 'height: 1px; background: var(--border); margin: 12px 0;';
        listSection.appendChild(divider);

        // Pitchers title
        const pitcherTitle = document.createElement('h4');
        pitcherTitle.textContent = '投手';
        pitcherTitle.style.cssText = 'margin: 0 0 12px 0; color: var(--info); font-size: 0.9rem;';
        listSection.appendChild(pitcherTitle);

        // Pitchers
        ['SP', 'RP', 'CP'].forEach(role => {
            const row = document.createElement('div');
            row.className = 'modal-detail-row';
            const p = lineup[role];
            row.innerHTML = `
                <span style="color: var(--info); font-family: 'Fira Code', monospace; font-weight: 600;">${role}</span>
                <span style="font-weight: 500;">${p.player || '-'}</span>
                <span></span>
            `;
            listSection.appendChild(row);
        });

        container.appendChild(listSection);

        // Right side: Field diagram
        const fieldSection = document.createElement('div');

        const fieldTitle = document.createElement('h4');
        fieldTitle.textContent = '守備位置';
        fieldTitle.style.cssText = 'margin: 0 0 12px 0; color: var(--success); font-size: 0.9rem;';
        fieldSection.appendChild(fieldTitle);

        // Create mini field diagram
        const miniField = document.createElement('div');
        miniField.className = 'mini-field';
        miniField.innerHTML = generateMiniFieldHTML(lineup);
        fieldSection.appendChild(miniField);

        // Add share buttons container
        const btnContainer = document.createElement('div');
        btnContainer.style.cssText = 'display: flex; gap: 12px; margin-top: 12px;';

        // Button 1: Copy Field Image
        const shareFieldBtn = document.createElement('button');
        shareFieldBtn.className = 'share-btn';
        shareFieldBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            複製守備圖
        `;
        shareFieldBtn.addEventListener('click', () => copyFieldAsImage(name, lineup));

        // Button 2: Copy List Image
        const shareListBtn = document.createElement('button');
        shareListBtn.className = 'share-btn';
        shareListBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            複製打序表
        `;
        shareListBtn.addEventListener('click', () => copyLineupAsTextListImage(name, lineup));

        btnContainer.appendChild(shareFieldBtn);
        btnContainer.appendChild(shareListBtn);
        fieldSection.appendChild(btnContainer);

        container.appendChild(fieldSection);
        modalBody.appendChild(container);

        modal.classList.remove('hidden');

        // Focus trap for accessibility
        closeModal.focus();
    }

    // Copy field diagram as image to clipboard
    async function copyFieldAsImage(coachName, lineup) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Canvas dimensions
        const width = 400;
        const height = 480;
        canvas.width = width;
        canvas.height = height;

        // Load field background image
        const fieldImg = new Image();
        fieldImg.crossOrigin = 'anonymous';

        // Create a promise to wait for image load
        await new Promise((resolve, reject) => {
            fieldImg.onload = resolve;
            fieldImg.onerror = reject;
            fieldImg.src = '/field.svg';
        });

        // Background
        ctx.fillStyle = '#0A0E27';
        ctx.fillRect(0, 0, width, height);

        // Title area
        ctx.fillStyle = '#1a1f3d';
        ctx.fillRect(0, 0, width, 60);

        // Title text
        ctx.fillStyle = '#FBBF24';
        ctx.font = 'bold 20px "Noto Sans TC", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${coachName} 鍵盤教練`, width / 2, 38);

        // Draw field background
        const fieldY = 70;
        const fieldSize = 320;
        const fieldX = (width - fieldSize) / 2;

        // Draw field image
        ctx.drawImage(fieldImg, fieldX, fieldY, fieldSize, fieldSize);

        // Position coordinates (relative to field)
        const positions = {
            'CF': { x: 0.50, y: 0.08 },
            'LF': { x: 0.22, y: 0.22 },
            'RF': { x: 0.78, y: 0.22 },
            'SS': { x: 0.40, y: 0.45 },
            '2B': { x: 0.60, y: 0.45 },
            '3B': { x: 0.28, y: 0.60 },
            '1B': { x: 0.72, y: 0.60 },
            'SP': { x: 0.50, y: 0.65 },
            'C': { x: 0.50, y: 0.92 },
            'DH': { x: 0.22, y: 0.92 }
        };

        // Build position map
        const positionMap = {};
        Object.entries(lineup).forEach(([slotId, data]) => {
            if (data.pos && data.player) {
                const battingOrder = !isNaN(parseInt(slotId)) ? slotId : '';
                positionMap[data.pos] = {
                    player: data.player,
                    battingOrder: battingOrder
                };
            }
        });

        // Draw position markers
        Object.entries(positions).forEach(([pos, coords]) => {
            const data = positionMap[pos];
            const x = fieldX + coords.x * fieldSize;
            const y = fieldY + coords.y * fieldSize;

            // Marker background
            if (data && data.player) {
                ctx.fillStyle = '#22C55E';
            } else {
                ctx.fillStyle = 'rgba(10, 14, 39, 0.9)';
            }

            const markerWidth = 50;
            const markerHeight = data ? 28 : 18;
            ctx.beginPath();
            ctx.roundRect(x - markerWidth / 2, y - markerHeight / 2, markerWidth, markerHeight, 4);
            ctx.fill();
            ctx.strokeStyle = data ? '#22C55E' : '#374151';
            ctx.lineWidth = 1;
            ctx.stroke();

            // Position label
            ctx.fillStyle = data ? 'rgba(255,255,255,0.85)' : '#FBBF24';
            ctx.font = 'bold 9px "Noto Sans TC", sans-serif';
            ctx.textAlign = 'center';
            const label = data && data.battingOrder ? `${data.battingOrder}棒 ${pos}` : pos;
            ctx.fillText(label, x, y - (data ? 4 : 0));

            // Player name
            if (data && data.player) {
                ctx.fillStyle = 'white';
                ctx.font = '10px "Noto Sans TC", sans-serif';
                ctx.fillText(data.player.substring(0, 4), x, y + 8);
            }
        });

        // Convert to blob and copy
        canvas.toBlob(blob => {
            const item = new ClipboardItem({ 'image/png': blob });
            navigator.clipboard.write([item]).then(() => {
                showToast('守備圖已複製到剪貼簿！', 'success');
            }).catch(() => {
                showToast('複製失敗，請手動截圖', 'error');
            });
        });
    }

    // New Function: Copy Lineup Text List as Image
    async function copyLineupAsTextListImage(coachName, lineup) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Canvas dimensions
        const width = 450;
        const height = 650; // Taller for list
        canvas.width = width;
        canvas.height = height;

        // Background
        ctx.fillStyle = '#0A0E27';
        ctx.fillRect(0, 0, width, height);

        // Header Background
        ctx.fillStyle = '#1a1f3d';
        ctx.fillRect(0, 0, width, 70);

        // Title text
        ctx.fillStyle = '#FBBF24';
        ctx.font = 'bold 24px "Noto Sans TC", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${coachName} 鍵盤教練`, width / 2, 35);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '16px "Noto Sans TC", sans-serif';
        ctx.fillText('台灣隊先發打序預測', width / 2, 60);

        // Content settings
        const startY = 110;
        const lineHeight = 38;
        let currentY = startY;

        ctx.textAlign = 'left';

        // Helper to draw row
        function drawRow(label, player, pos, isPitcher = false) {
            // Order/Role label
            ctx.fillStyle = isPitcher ? '#38bdf8' : '#94a3b8'; // Blue for pitchers, gray for batters
            ctx.font = 'bold 18px "Fira Code", monospace';
            ctx.fillText(label, 40, currentY);

            // Player Name
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 20px "Noto Sans TC", sans-serif';
            ctx.fillText(player || '-', 100, currentY);

            // Position
            if (pos) {
                ctx.fillStyle = '#f472b6'; // Pink/Accent
                ctx.font = 'bold 18px "Fira Code", monospace';
                ctx.textAlign = 'right';
                ctx.fillText(pos, width - 40, currentY);
                ctx.textAlign = 'left';
            }

            // Divider line
            ctx.beginPath();
            ctx.strokeStyle = '#1e293b';
            ctx.moveTo(40, currentY + 12);
            ctx.lineTo(width - 40, currentY + 12);
            ctx.stroke();

            currentY += lineHeight;
        }

        // Draw Batters 1-9
        for (let i = 1; i <= 9; i++) {
            const data = lineup[i];
            drawRow(`#${i}`, data.player, data.pos);
        }

        currentY += 10; // Extra spacer

        // Draw Pitchers
        ['SP', 'RP', 'CP'].forEach(role => {
            const data = lineup[role];
            drawRow(role, data.player, null, true);
        });

        // Current Time Footer
        currentY += 20;
        ctx.fillStyle = '#475569';
        ctx.font = '12px "Noto Sans TC", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`Generated at ${new Date().toLocaleString('zh-TW')}`, width / 2, height - 15);

        // Convert to blob and copy
        canvas.toBlob(blob => {
            const item = new ClipboardItem({ 'image/png': blob });
            navigator.clipboard.write([item]).then(() => {
                showToast('打序表已複製到剪貼簿！', 'success');
            }).catch(() => {
                showToast('複製失敗，請手動截圖', 'error');
            });
        });
    }

    // Helper function to generate mini field HTML
    function generateMiniFieldHTML(lineup) {
        const positions = ['C', 'SP', '1B', '2B', 'SS', '3B', 'LF', 'CF', 'RF', 'DH'];
        const positionMap = {};

        // Build a map of position -> { player, battingOrder }
        Object.entries(lineup).forEach(([slotId, data]) => {
            if (data.pos && data.player) {
                const battingOrder = !isNaN(parseInt(slotId)) ? slotId : '';
                positionMap[data.pos] = {
                    player: data.player,
                    battingOrder: battingOrder
                };
            }
        });

        let html = '<div class="mini-baseball-field">';

        positions.forEach(pos => {
            const data = positionMap[pos];
            const isFilled = data && data.player;
            const battingLabel = data && data.battingOrder ? `${data.battingOrder}棒 ` : '';
            const playerName = data ? data.player : '';

            html += `
                <div class="mini-field-pos mini-p-${pos.toLowerCase()} ${isFilled ? 'filled' : ''}">
                    <span>${battingLabel}${pos}</span>
                    ${isFilled ? `<strong>${playerName}</strong>` : ''}
                </div>
            `;
        });

        html += '</div>';
        return html;
    }
});
