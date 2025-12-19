import { AudioController } from './Audio.js';
import { Generator } from '../logic/Generator.js';

export class TetonorGame {
    constructor() {
        // DOM Elements
        this.gridContainer = document.getElementById('grid-container');
        this.stripContainer = document.getElementById('strip-container');
        this.remainingCount = document.getElementById('remaining-count');
        this.scoreDisplay = document.getElementById('score-display');
        this.timeDisplay = document.getElementById('time-display');
        this.levelDisplay = document.getElementById('level-display');

        // Modals
        this.modal = document.getElementById('modal');
        this.modalTitle = document.getElementById('modal-title');
        this.modalMessage = document.getElementById('modal-message');
        this.closeModalBtn = document.getElementById('modal-close-btn');

        this.inputModal = document.getElementById('input-modal');
        this.inputConfirmBtn = document.getElementById('input-confirm-btn');
        this.inputCloseBtn = document.getElementById('input-close-btn');

        this.rulesModal = document.getElementById('rules-modal');
        this.closeRulesBtn = document.getElementById('rules-close-btn');
        this.helpBtn = document.getElementById('help-btn');

        // Panels
        this.mainMenu = document.getElementById('main-menu');
        this.gameUI = document.getElementById('game-ui');
        this.campaignHUD = document.getElementById('campaign-hud');
        this.sandboxControls = document.getElementById('sandbox-controls');

        // Buttons
        this.btnCampaign = document.getElementById('btn-campaign');
        this.btnSandbox = document.getElementById('btn-sandbox');
        this.btnUltra = document.getElementById('btn-ultra');
        this.newGameBtn = document.getElementById('new-game-btn');
        this.toggleModeBtn = document.getElementById('toggle-mode-btn');
        this.exitBtn = document.getElementById('exit-btn');
        this.difficultySelect = document.getElementById('difficulty-select');

        // State
        this.state = {
            mode: 'menu', // menu, sandbox, campaign, ultra
            level: 1,
            score: 0,
            timer: 0,
            timerInterval: null,
            difficulty: 4,
            stripNumbers: [],
            gridNumbers: [],
            selectedGridId: null,
            selectedStripIndices: [],
            isPuzzleMode: false,
            hiddenIndices: [],
            guessedNumbers: {},
            usedStatus: {}
        };

        this.currentInputIndex = null;
        this.currentInputValue = '';

        this.audio = new AudioController();
    }

    init() {
        this.setupListeners();
    }

    setupListeners() {
        // Menu
        this.btnCampaign.addEventListener('click', () => this.startCampaignMode());
        this.btnSandbox.addEventListener('click', () => this.startSandboxMode());
        if (this.btnUltra) this.btnUltra.addEventListener('click', () => this.startUltraMode());
        this.exitBtn.addEventListener('click', () => this.goToMenu());

        // Game Controls
        this.newGameBtn.addEventListener('click', () => {
            if (this.state.mode === 'sandbox' || this.state.mode === 'ultra') this.startNewGame();
            else this.startLevel(this.state.level);
        });

        this.toggleModeBtn.addEventListener('click', () => {
            this.state.isPuzzleMode = !this.state.isPuzzleMode;
            this.toggleModeBtn.textContent = `Modo Puzzle: ${this.state.isPuzzleMode ? 'ON' : 'OFF'}`;
            this.startNewGame();
        });

        this.difficultySelect.addEventListener('change', (e) => {
            this.state.difficulty = parseInt(e.target.value);
            this.startNewGame();
        });

        // Modals
        this.closeModalBtn.addEventListener('click', () => {
            this.modal.classList.add('hidden');
            if (this.state.mode === 'campaign' && this.state.level <= 25) {
                this.nextLevel();
            }
        });

        this.helpBtn.addEventListener('click', () => {
            this.rulesModal.classList.remove('hidden');
            this.rulesModal.classList.add('visible');
        });
        this.closeRulesBtn.addEventListener('click', () => {
            this.rulesModal.classList.remove('visible');
            setTimeout(() => this.rulesModal.classList.add('hidden'), 300);
        });

        // Input
        this.inputConfirmedHandler = () => this.confirmInput();
        this.inputConfirmBtn.addEventListener('click', this.inputConfirmedHandler);
        this.inputCloseBtn.addEventListener('click', () => this.hideInputModal());

        document.querySelectorAll('.num-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleNumpad(e.target.textContent));
        });

        // Audio Unlock
        document.addEventListener('click', () => {
            if (this.audio.ctx && this.audio.ctx.state === 'suspended') this.audio.ctx.resume();
            else if (!this.audio.ctx) this.audio.init();
        }, { once: false });
    }

    // MODES
    startSandboxMode() {
        this.state.mode = 'sandbox';
        this.transitionToGame();
        this.sandboxControls.classList.remove('hidden');
        this.campaignHUD.classList.add('hidden');
        this.toggleModeBtn.style.display = 'block';
        this.startNewGame();
    }

    startCampaignMode() {
        this.state.mode = 'campaign';
        this.state.level = 1;
        this.state.score = 0;
        this.transitionToGame();
        this.gameUI.classList.remove('mode-ultra');
        this.sandboxControls.classList.add('hidden');
        this.campaignHUD.classList.remove('hidden');
        this.toggleModeBtn.style.display = 'none';
        this.startLevel(1);
    }

    startUltraMode() {
        this.state.mode = 'ultra';
        this.transitionToGame();
        this.gameUI.classList.add('mode-ultra');
        this.sandboxControls.classList.add('hidden');
        this.campaignHUD.classList.add('hidden');
        this.toggleModeBtn.style.display = 'none';
        this.startNewGame();
    }

    transitionToGame() {
        this.mainMenu.style.display = 'none';
        this.gameUI.classList.remove('hidden');
    }

    goToMenu() {
        this.stopTimer();
        this.mainMenu.style.display = 'flex';
        this.gameUI.classList.add('hidden');
        this.state.mode = 'menu';
    }

    // GAME LOOP
    startLevel(level) {
        // Curve Logic
        let diff = 4;
        let hidden = 0;
        let time = 100;

        if (level <= 5) { diff = 4; hidden = 1; }
        else if (level <= 10) { diff = 4; hidden = 1; }
        else if (level <= 15) { diff = 6; hidden = 2; }
        else if (level <= 20) { diff = 6; hidden = 2; }
        else if (level <= 24) { diff = 8; hidden = 3; }
        else { diff = 8; hidden = 4; }

        this.state.difficulty = diff;
        this.state.isPuzzleMode = (hidden > 0);
        this.state.levelHiddenCount = hidden;

        this.levelDisplay.textContent = level;
        this.scoreDisplay.textContent = this.state.score;

        this.startNewGame();
        this.startTimer(time);
    }

    startNewGame() {
        if (this.state.mode === 'sandbox') this.stopTimer();

        // 1. Difficulty
        let count = 8;
        if (this.state.mode === 'ultra') count = 16;
        else if (this.state.mode === 'sandbox') count = parseInt(this.difficultySelect.value);
        else count = this.state.difficulty; // Campaign

        // 2. Generate
        const data = Generator.generateLevel(this.state.mode, count);
        this.state.stripNumbers = data.strip;
        this.state.gridNumbers = data.targets;

        // 3. Shuffle Grid Display
        Generator.shuffleArray(this.state.gridNumbers);

        // 4. Hidden Items
        this.state.hiddenIndices = [];
        if (this.state.isPuzzleMode || this.state.mode === 'ultra') {
            let hideCount = 0;
            if (this.state.mode === 'campaign') hideCount = this.state.levelHiddenCount;
            else if (this.state.mode === 'ultra') hideCount = 6;
            else {
                // Sandbox
                if (count === 4) hideCount = 2;
                else if (count > 4) hideCount = 3;
            }

            const indices = Array.from({ length: count }, (_, i) => i);
            this.state.hiddenIndices = indices.slice(0, hideCount);
        }

        // 5. Reset State
        this.state.selectedGridId = null;
        this.state.selectedStripIndices = [];
        this.state.guessedNumbers = {};
        this.state.usedStatus = {};
        for (let k = 0; k < count; k++) {
            this.state.usedStatus[k] = { sum: false, product: false, diff: false, div: false };
        }

        this.currentStreak = 0;
        this.render();
    }

    // CHECKING
    checkSolution() {
        const targetId = this.state.selectedGridId;
        const targetItem = this.state.gridNumbers.find(g => g.id === targetId);

        const idx1 = this.state.selectedStripIndices[0];
        const idx2 = this.state.selectedStripIndices[1];

        const num1 = this.getStripValue(idx1);
        const num2 = this.getStripValue(idx2);

        if (num1 === null || num2 === null) {
            this.flashError();
            this.resetSelection();
            return;
        }

        const pair = [num1, num2].sort((a, b) => a - b);
        const sum = pair[0] + pair[1];
        const prod = pair[0] * pair[1];
        const diff = pair[1] - pair[0];
        const div = (pair[0] !== 0 && pair[1] % pair[0] === 0) ? (pair[1] / pair[0]) : null;

        let matchType = null;
        if (sum === targetItem.value) matchType = 'sum';
        else if (prod === targetItem.value) matchType = 'product';

        // Ultra Logic
        if (this.state.mode === 'ultra') {
            if (diff === targetItem.value) matchType = 'diff';
            if (div === targetItem.value) matchType = 'div';
        }

        if (matchType) {
            const u1 = this.state.usedStatus[idx1];
            const u2 = this.state.usedStatus[idx2];

            let used = false;
            if (matchType === 'sum') used = (u1.sum || u2.sum);
            else if (matchType === 'product') used = (u1.product || u2.product);
            else if (matchType === 'diff') used = (u1.diff || u2.diff);
            else if (matchType === 'div') used = (u1.div || u2.div);

            if (used) {
                alert(`¡Ya usado para ${matchType}!`);
                this.flashError();
                this.resetSelection();
                return;
            }

            // Apply
            const setUsed = (u) => {
                if (matchType === 'sum') u.sum = true;
                else if (matchType === 'product') u.product = true;
                else if (matchType === 'diff') u.diff = true;
                else if (matchType === 'div') u.div = true;
            };
            setUsed(u1);
            setUsed(u2);

            targetItem.solved = true;
            targetItem.parents = pair;
            targetItem.type = matchType;
            targetItem.solvedIndices = [idx1, idx2];

            // Reveal
            this.state.hiddenIndices = this.state.hiddenIndices.filter(i => i !== idx1 && i !== idx2);

            this.audio.play('success');
            this.state.selectedGridId = null;
            this.state.selectedStripIndices = [];
            this.render();
            this.checkWinCondition();
        } else {
            this.audio.play('error');
            this.flashError();
            this.resetSelection();
        }
    }

    unsolveItem(item) {
        item.solved = false;
        if (item.solvedIndices) {
            const idx1 = item.solvedIndices[0];
            const idx2 = item.solvedIndices[1];
            const type = item.type;

            if (this.state.usedStatus[idx1]) this.state.usedStatus[idx1][type] = false;
            if (this.state.usedStatus[idx2]) this.state.usedStatus[idx2][type] = false;

            item.solvedIndices = null;
        }
        this.audio.play('unsolve');
        this.render();
    }

    // UI HELPERS
    handleGridClick(id) {
        const item = this.state.gridNumbers.find(g => g.id === id);
        if (item.solved) {
            this.unsolveItem(item);
            return;
        }
        this.audio.play('click');
        if (this.state.selectedGridId === id) {
            this.state.selectedGridId = null;
        } else {
            this.state.selectedGridId = id;
            this.state.selectedStripIndices = [];
        }
        this.render();
    }

    handleStripClick(index) {
        if (!this.state.selectedGridId) return;

        const current = this.state.selectedStripIndices;
        if (current.includes(index)) {
            this.state.selectedStripIndices = current.filter(i => i !== index);
        } else {
            if (current.length < 2) {
                this.state.selectedStripIndices.push(index);
                this.audio.play('select');
            }
        }
        this.render();

        if (this.state.selectedStripIndices.length === 2) {
            setTimeout(() => this.checkSolution(), 100);
        }
    }

    getStripValue(index) {
        if (this.state.hiddenIndices.includes(index)) {
            const g = this.state.guessedNumbers[index];
            return (g !== undefined) ? parseInt(g) : null;
        }
        return this.state.stripNumbers[index];
    }

    openInputModal(index) {
        this.currentInputIndex = index;
        this.currentInputValue = '';
        this.inputModal.querySelector('h3').textContent = 'Ingresa el número';
        this.inputModal.classList.remove('hidden');
        this.inputModal.classList.add('visible');
    }

    handleNumpad(val) {
        if (val === 'Borrar') this.currentInputValue = this.currentInputValue.slice(0, -1);
        else if (val === 'Confirmar') return;
        else if (this.currentInputValue.length < 2) this.currentInputValue += val;

        const title = this.inputModal.querySelector('h3');
        title.textContent = this.currentInputValue ? `Valor: ${this.currentInputValue}` : 'Ingresa el número';
    }

    confirmInput() {
        if (this.currentInputIndex !== null && this.currentInputValue !== '') {
            this.state.guessedNumbers[this.currentInputIndex] = parseInt(this.currentInputValue);
            this.render();
            // Auto Select
            if (this.state.selectedGridId) this.handleStripClick(this.currentInputIndex);
        }
        this.hideInputModal();
    }

    hideInputModal() {
        this.inputModal.classList.remove('visible');
        setTimeout(() => this.inputModal.classList.add('hidden'), 300);
        this.currentInputIndex = null;
    }

    flashError() {
        const el = document.querySelector('.cell.selected');
        if (el) {
            el.style.borderColor = 'red'; // Quick visual
            setTimeout(() => el.style.borderColor = '', 500);
        }
    }

    resetSelection() {
        setTimeout(() => {
            this.state.selectedStripIndices = [];
            this.render();
        }, 500);
    }

    // TIMING
    startTimer(seconds) {
        this.stopTimer();
        this.state.timer = seconds;
        this.updateTimeDisplay();
        this.state.timerInterval = setInterval(() => {
            this.state.timer--;
            this.updateTimeDisplay();
            if (this.state.timer <= 0) {
                this.stopTimer();
                alert("¡Tiempo agotado!");
                this.startLevel(this.state.level);
            }
        }, 1000);
    }

    stopTimer() {
        if (this.state.timerInterval) clearInterval(this.state.timerInterval);
    }
    updateTimeDisplay() {
        this.timeDisplay.textContent = this.state.timer;
    }

    nextLevel() {
        this.state.score += (this.state.level * 100) + (this.state.timer * 10);
        this.state.level++;
        if (this.state.level > 25) {
            alert("¡Campaña Completada!");
            this.goToMenu();
        } else {
            this.startLevel(this.state.level);
        }
    }
    checkWinCondition() {
        if (this.state.gridNumbers.every(g => g.solved)) {
            this.stopTimer();
            if (this.state.mode === 'campaign') {
                // Show modal via DOM
                this.modalTitle.textContent = `¡Nivel ${this.state.level} Superado!`;
                this.modalMessage.textContent = `Puntos: ${this.state.score}`;
                this.modal.classList.remove('hidden');
            } else {
                alert("¡Victoria!");
            }
        }
    }

    // RENDER
    render() {
        this.remainingCount.textContent = this.state.gridNumbers.filter(g => !g.solved).length;

        // GRID
        this.gridContainer.innerHTML = '';
        let cols = Math.ceil(this.state.gridNumbers.length / 2);
        if (cols > 4) cols = 4;
        this.gridContainer.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

        this.state.gridNumbers.forEach(item => {
            const el = document.createElement('div');
            el.className = `cell ${item.solved ? 'solved' : ''} ${this.state.selectedGridId === item.id ? 'selected' : ''}`;

            if (item.solved) {
                el.classList.add('show-calc');
                const val = document.createElement('span');
                val.className = 'cell-value';
                val.textContent = item.value;

                const calc = document.createElement('span');
                calc.className = 'cell-calc';
                let sym = '?';
                if (item.type === 'sum') sym = '+';
                else if (item.type === 'product') sym = '×';
                else if (item.type === 'diff') sym = '-';
                else if (item.type === 'div') sym = '÷';

                calc.textContent = `${item.parents[0]}${sym}${item.parents[1]}`;
                el.appendChild(val);
                el.appendChild(calc);
            } else {
                el.textContent = item.value;
            }

            el.onclick = () => this.handleGridClick(item.id);
            this.gridContainer.appendChild(el);
        });

        // STRIP
        this.stripContainer.innerHTML = '';
        const knowns = [];
        const unknowns = [];

        this.state.stripNumbers.forEach((num, index) => {
            const el = document.createElement('div');
            const isSelected = this.state.selectedStripIndices.includes(index);
            const isHidden = this.state.hiddenIndices.includes(index);
            const status = this.state.usedStatus[index] || {};

            el.className = `strip-item ${isSelected ? 'selected' : ''}`;

            if (isHidden) {
                el.classList.add('hidden-value');
                const guess = this.state.guessedNumbers[index];
                if (guess !== undefined) {
                    el.textContent = guess;
                    el.classList.add('guessed');
                } else {
                    el.textContent = '?';
                }
                el.onclick = (e) => {
                    e.stopPropagation();
                    this.audio.play('click');
                    if (guess !== undefined) {
                        this.handleStripClick(index);
                        if (!this.state.selectedGridId) this.openInputModal(index);
                    } else {
                        this.openInputModal(index);
                    }
                }
            } else {
                el.textContent = num;
                el.onclick = () => {
                    this.audio.play('click');
                    this.handleStripClick(index);
                }
            }

            // Indicators
            const indicators = document.createElement('div');
            indicators.className = 'usage-indicators';

            const addDot = (type, sym) => {
                const d = document.createElement('div');
                d.className = `usage-dot ${status[type] ? 'active' : ''}`;
                d.textContent = sym;
                indicators.appendChild(d);
            };

            addDot('sum', '+');
            addDot('product', '×');
            if (this.state.mode === 'ultra') {
                addDot('diff', '-');
                addDot('div', '÷');
            }

            el.appendChild(indicators);

            if (isHidden) unknowns.push(el);
            else knowns.push(el);
        });

        knowns.forEach(e => this.stripContainer.appendChild(e));
        unknowns.forEach(e => this.stripContainer.appendChild(e));
    }
}
