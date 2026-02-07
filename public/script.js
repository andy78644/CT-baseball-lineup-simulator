/**
 * 台灣隊先發陣容預測 - Taiwan Baseball Lineup Selector
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
        pitchers: [], // Pitchers restricted to SP slots only (handled by logic)
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
            9: { player: null, pos: null },
            SP1_KR: { player: null, pos: 'SP' }, // Korea SP1
            SP2_KR: { player: null, pos: 'SP' }, // Korea SP2
            SP1_JP: { player: null, pos: 'SP' }, // Japan SP1
            SP2_JP: { player: null, pos: 'SP' }, // Japan SP2
            SP1_AU: { player: null, pos: 'SP' }, // Australia SP1
            SP2_AU: { player: null, pos: 'SP' }, // Australia SP2
            SP1_CZ: { player: null, pos: 'SP' }, // Czech SP1
            SP2_CZ: { player: null, pos: 'SP' }  // Czech SP2
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

        const isPitcherSlot = state.selectedSlot && PITCHER_SLOTS.includes(state.selectedSlot);
        const isBattingSlot = state.selectedSlot && !PITCHER_SLOTS.includes(state.selectedSlot);

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
                div.title = isPitcher ? '投手只能選擇先發投手位置' : '野手不能擔任投手';
            }

            div.addEventListener('click', () => {
                if (div.classList.contains('selected')) {
                    return;
                }
                if (div.classList.contains('disabled')) {
                    showToast(isPitcher ? '投手只能選擇先發投手位置' : '野手不能擔任投手', 'error');
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
            const isPitcherSlot = PITCHER_SLOTS.includes(slotId);
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
        const isPitcherSlot = PITCHER_SLOTS.includes(slotId);

        // Validation: Pitchers only in Pitcher slots
        if (category === 'pitchers' && !isPitcherSlot) {
            showToast('投手只能選擇先發投手位置', 'error');
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
        if (!PITCHER_SLOTS.includes(slotId)) {
            placeholder.hidden = true;
            playerInfo.hidden = false;

            const nameSpan = playerInfo.querySelector('.player-name');
            nameSpan.textContent = playerName;

            const select = playerInfo.querySelector('.pos-select');
            state.lineup[slotId].pos = null;
            select.value = "";

            updateDropdownOptions(slotId, category);

        } else {
            // Pitcher slots
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
            if (PITCHER_SLOTS.includes(id)) return;

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

    // Pitcher Slots Helper
    const PITCHER_SLOTS = ['SP1_KR', 'SP2_KR', 'SP1_JP', 'SP2_JP', 'SP1_AU', 'SP2_AU', 'SP1_CZ', 'SP2_CZ'];

    function clearSlot(slotId) {
        if (!state.lineup[slotId].player) return;

        const clearedPlayer = state.lineup[slotId].player;
        state.lineup[slotId].player = null;
        if (!PITCHER_SLOTS.includes(slotId)) {
            state.lineup[slotId].pos = null;
        }

        // Update UI
        const slotEl = document.querySelector(`.order-slot[data-slot="${slotId}"]`);

        if (PITCHER_SLOTS.includes(slotId)) {
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
    submitBtn.addEventListener('click', handleSubmit);

    // ============================================
    // Clear All Button Handler
    // ============================================
    const clearAllBtn = document.getElementById('clearAllBtn');
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', () => {
            // Reset state
            for (let i = 1; i <= 9; i++) {
                state.lineup[i] = { player: null, pos: null };
            }
            PITCHER_SLOTS.forEach(slot => {
                state.lineup[slot] = { player: null, pos: 'SP' };
            });

            // Reset UI - batting slots (1-9)
            for (let i = 1; i <= 9; i++) {
                const slotEl = document.querySelector(`.order-slot[data-slot="${i}"]`);
                if (!slotEl) continue;

                const placeholder = slotEl.querySelector('.placeholder');
                const playerInfo = slotEl.querySelector('.player-info');
                const clearBtn = slotEl.querySelector('.clear-btn');

                if (placeholder) placeholder.hidden = false;
                if (playerInfo) {
                    playerInfo.hidden = true;
                    playerInfo.querySelector('.player-name').textContent = '';
                    const select = playerInfo.querySelector('.pos-select');
                    if (select) select.value = '';
                }
                if (clearBtn) clearBtn.hidden = true;
            }

            // Reset UI - pitcher slots
            PITCHER_SLOTS.forEach(slot => {
                const slotEl = document.querySelector(`.order-slot[data-slot="${slot}"]`);
                if (!slotEl) return;

                const placeholder = slotEl.querySelector('.placeholder');
                const contentDiv = slotEl.querySelector('.slot-content');
                const clearBtn = slotEl.querySelector('.clear-btn');

                if (placeholder) placeholder.hidden = false;

                // Remove player name if exists
                const existingName = contentDiv.querySelector('.player-name');
                if (existingName) existingName.remove();

                if (clearBtn) clearBtn.hidden = true;
            });

            // Reset field view
            updateFieldView();

            // Refresh all dropdowns
            refreshAllDropdowns();

            showToast('已清空所有選擇', 'info');
        });
    }

    // ============================================
    // Search Handler
    // ============================================
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
        searchBtn.addEventListener('click', async () => {
            const name = document.getElementById('coachName').value.trim();
            const email = document.getElementById('coachEmail').value.trim();

            if (!name || !email) {
                showToast('請先輸入姓名和 Email 才能搜尋', 'error');
                return;
            }

            // Button loading state
            const originalContent = searchBtn.innerHTML;
            searchBtn.disabled = true;
            searchBtn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 1s linear infinite;">
                    <circle cx="12" cy="12" r="10" stroke-dasharray="60" stroke-dashoffset="20"></circle>
                </svg>
                搜尋中...
            `;

            try {
                const res = await fetch(`/api/lineups?name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}`);
                const data = await res.json();

                if (data.found && data.data) {
                    const loadedLineup = JSON.parse(data.data.lineup);

                    // Load into state
                    // Load into state with backward compatibility
                    // Ensure new slots (SP1/SP2) exist even if loading old data
                    const defaultStructure = {
                        SP1_KR: { player: null, pos: 'SP' },
                        SP2_KR: { player: null, pos: 'SP' },
                        SP1_JP: { player: null, pos: 'SP' },
                        SP2_JP: { player: null, pos: 'SP' },
                        SP1_AU: { player: null, pos: 'SP' },
                        SP2_AU: { player: null, pos: 'SP' },
                        SP1_CZ: { player: null, pos: 'SP' },
                        SP2_CZ: { player: null, pos: 'SP' }
                    };
                    for (let i = 1; i <= 9; i++) {
                        defaultStructure[i] = { player: null, pos: null };
                    }

                    state.lineup = { ...defaultStructure, ...loadedLineup };

                    // Update UI
                    updateFieldView();

                    // Refresh all slot UIs
                    Object.keys(state.lineup).forEach(slotId => {
                        const slotEl = document.querySelector(`.order-slot[data-slot="${slotId}"]`);
                        if (!slotEl) return;

                        const pData = state.lineup[slotId];
                        if (pData && pData.player) {
                            if (PITCHER_SLOTS.includes(slotId)) {
                                slotEl.querySelector('.placeholder').hidden = true;
                                const contentDiv = slotEl.querySelector('.slot-content');
                                const existingName = contentDiv.querySelector('.player-name');
                                if (existingName) existingName.remove();

                                const nameSpan = document.createElement('span');
                                nameSpan.className = 'player-name';
                                nameSpan.textContent = pData.player;
                                contentDiv.appendChild(nameSpan);
                            } else {
                                slotEl.querySelector('.placeholder').hidden = true;
                                const playerInfo = slotEl.querySelector('.player-info');
                                playerInfo.hidden = false;
                                playerInfo.querySelector('.player-name').textContent = pData.player;

                                const category = getPlayerCategory(pData.player);
                                updateDropdownOptions(slotId, category);

                                const select = playerInfo.querySelector('.pos-select');
                                select.value = pData.pos || "";
                            }

                            const clearBtn = slotEl.querySelector('.clear-btn');
                            if (clearBtn) clearBtn.hidden = false;
                        }
                    });

                    refreshAllDropdowns();
                    showToast('找到之前的陣容！已載入', 'success');

                    // Change Submit Button to "Update"
                    submitBtn.innerHTML = `
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align: middle; margin-right: 8px;">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="17 8 12 3 7 8"></polyline>
                            <line x1="12" y1="3" x2="12" y2="15"></line>
                        </svg>
                        更新陣容
                    `;
                } else {
                    showToast('查無資料，您可以提交新陣容', 'info');
                    // Reset Submit Status
                    submitBtn.innerHTML = `
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align: middle; margin-right: 8px;">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        提交陣容
                    `;
                }

                // Show Share Buttons if found
                const mainShareButtons = document.getElementById('mainShareButtons');
                if (mainShareButtons) {
                    mainShareButtons.hidden = false;
                }
            } catch (err) {
                console.error(err);
                showToast('搜尋發生錯誤', 'error');
            } finally {
                searchBtn.disabled = false;
                searchBtn.innerHTML = originalContent;
            }
        });
    }

    // ============================================
    // Submit Handler
    // ============================================
    async function handleSubmit() {
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

        if (PITCHER_SLOTS.some(slot => !state.lineup[slot].player)) {
            showToast('請完整選擇四場比賽的先發投手（每場2位）', 'error');
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
                if (data.message === 'updated') {
                    showToast('陣容更新成功！🎉', 'success', 4000);
                } else {
                    showToast('陣容提交成功！🎉', 'success', 4000);
                }

                // Show Share Buttons
                const mainShareButtons = document.getElementById('mainShareButtons');
                if (mainShareButtons) mainShareButtons.hidden = false;

                fetchHistory();
            }
        } catch (err) {
            showToast('網路錯誤，請稍後再試', 'error');
        } finally {
            // Re-enable button
            submitBtn.disabled = false;
            submitBtn.style.opacity = '1';

            // Check if we are in update mode or create mode
            // Actually, keep it simple for now, maybe reset?
            // User might want to update again. Let's keep "Update" if it was update.
            // Or just generic "Submit/Update"
            submitBtn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align: middle; margin-right: 8px;">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                提交 / 更新陣容
            `;
        }
    }

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

                        // Find key players (4th batter and SP)
                        const cleanLineup = lineup[4] ? lineup[4].player : '未定';
                        const sp = (lineup['SP1_KR'] && lineup['SP1_KR'].player)
                            || (lineup['SP_KR'] && lineup['SP_KR'].player)
                            || (lineup['SP'] && lineup['SP'].player)
                            || '未定';

                        card.innerHTML = `
                            <h3>${item.name}</h3>
                            <p style="color: var(--text-muted); font-size: 0.8rem;">${new Date(item.created_at).toLocaleString('zh-TW')}</p>
                            <p>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2" style="vertical-align: middle; margin-right: 4px;">
                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                                </svg>
                                第四棒: <span style="color: var(--accent); font-weight: 600;">${cleanLineup}</span>
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


                    // Populate Comparison Table (Transposed)
                    const tableHead = document.querySelector('#lineupTable thead');
                    const tableBody = document.querySelector('#lineupTable tbody');

                    if (tableHead && tableBody && res.data.length > 0) {
                        tableHead.innerHTML = '';
                        tableBody.innerHTML = '';

                        // 1. Build Header Row: [位置, Coach A, Coach B, ...]
                        const headerTr = document.createElement('tr');

                        // First col: Position Label
                        const thPos = document.createElement('th');
                        thPos.className = 'sticky-col';
                        thPos.textContent = '守備/棒次';
                        headerTr.appendChild(thPos);

                        // Coach columns
                        res.data.forEach(item => {
                            const th = document.createElement('th');
                            th.innerHTML = `
                                <div>${item.name}</div>
                                <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: normal; margin-top: 4px;">
                                    ${new Date(item.created_at).toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' })}
                                </div>
                            `;
                            headerTr.appendChild(th);
                        });
                        tableHead.appendChild(headerTr);

                        // 2. Build Data Rows (Positions)
                        const positions = [
                            { id: 1, label: '第一棒' },
                            { id: 2, label: '第二棒' },
                            { id: 3, label: '第三棒' },
                            { id: 4, label: '第四棒' },
                            { id: 5, label: '第五棒' },
                            { id: 6, label: '第六棒' },
                            { id: 7, label: '第七棒' },
                            { id: 8, label: '第八棒' },
                            { id: 9, label: '第九棒' },
                            // Duplicate 9th removed
                            { id: 'SP1_KR', label: '先發1(韓)' },
                            { id: 'SP2_KR', label: '先發2(韓)' },
                            { id: 'SP1_JP', label: '先發1(日)' },
                            { id: 'SP2_JP', label: '先發2(日)' },
                            { id: 'SP1_AU', label: '先發1(澳)' },
                            { id: 'SP2_AU', label: '先發2(澳)' },
                            { id: 'SP1_CZ', label: '先發1(捷)' },
                            { id: 'SP2_CZ', label: '先發2(捷)' }
                        ];

                        positions.forEach(pos => {
                            const tr = document.createElement('tr');

                            // Sticky Position Label Column
                            const tdLabel = document.createElement('td');
                            tdLabel.className = 'sticky-col';
                            tdLabel.textContent = pos.label;
                            tdLabel.style.fontWeight = '600';
                            tdLabel.style.color = 'var(--text-main)';
                            tr.appendChild(tdLabel);

                            // Data for each coach
                            res.data.forEach(item => {
                                let lineup;
                                try {
                                    lineup = JSON.parse(item.lineup);
                                } catch (e) { lineup = {}; }

                                const td = document.createElement('td');
                                const data = lineup[pos.id];

                                if (data && data.player) {
                                    if (PITCHER_SLOTS.includes(pos.id)) {
                                        td.innerHTML = `<span style="font-weight:500; color: var(--info);">${data.player}</span>`;
                                    } else {
                                        td.innerHTML = `
                                            <div style="font-weight:500;">${data.player}</div>
                                            <div style="font-size: 0.75rem; color: var(--accent); font-family: monospace;">${data.pos}</div>
                                        `;
                                    }
                                } else {
                                    td.textContent = '-';
                                    td.style.color = 'var(--border)';
                                }
                                tr.appendChild(td);
                            });
                            tableBody.appendChild(tr);
                        });
                    }


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
        PITCHER_SLOTS.forEach(role => {
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
        try {
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
            const item = new ClipboardItem({
                'image/png': blob
            });
            await navigator.clipboard.write([item]);
            showToast('守備圖已複製到剪貼簿！', 'success');
        } catch (err) {
            console.error('Copy failed:', err);
            showToast('複製失敗，請手動截圖', 'error');
        }
    }

    // New Function: Copy Lineup Text List as Image
    async function copyLineupAsTextListImage(coachName, lineup) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Canvas dimensions
        // Canvas dimensions
        const width = 500;
        const height = 800; // Taller for list
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
            ctx.fillText(player || '-', 150, currentY);

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
        PITCHER_SLOTS.forEach(role => {
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
        try {
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
            const item = new ClipboardItem({
                'image/png': blob
            });
            await navigator.clipboard.write([item]);
            showToast('打序表已複製到剪貼簿！', 'success');
        } catch (err) {
            console.error('Copy failed:', err);
            showToast('複製失敗，請手動截圖', 'error');
        }
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
            const battingLabel = data && data.battingOrder ? `${data.battingOrder}棒` : '';
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

    // ============================================
    // Main Page Share Buttons Logic
    // ============================================
    const mainShareFieldBtn = document.getElementById('mainShareFieldBtn');
    const mainShareListBtn = document.getElementById('mainShareListBtn');

    if (mainShareFieldBtn) {
        mainShareFieldBtn.addEventListener('click', () => {
            const name = document.getElementById('coachName').value.trim() || '鍵盤教練';
            // Need to ensure copyFieldAsImage is available. It is defined in this scope.
            copyFieldAsImage(name, state.lineup);
        });
    }

    if (mainShareListBtn) {
        mainShareListBtn.addEventListener('click', () => {
            const name = document.getElementById('coachName').value.trim() || '鍵盤教練';
            copyLineupAsTextListImage(name, state.lineup);
        });
    }
});
