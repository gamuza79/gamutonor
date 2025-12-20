class AudioController {
    constructor() {
        this.ctx = null;
        this.enabled = localStorage.getItem('audio_muted') !== 'true'; // Default true (not muted)
    }

    toggle() {
        this.enabled = !this.enabled;
        localStorage.setItem('audio_muted', (!this.enabled).toString());
        return this.enabled;
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
            console.log("AudioContext initialized", this.ctx.state);
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume().then(() => console.log("AudioContext resumed"));
        }
    }

    play(type) {
        if (!this.enabled) return;
        this.init();

        try {
            if (this.ctx && this.ctx.state !== 'running') {
                this.ctx.resume();
            }

            console.log("Playing sound:", type, this.ctx.state);

            const t = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.ctx.destination);

            switch (type) {
                case 'click':
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(800, t);
                    gain.gain.setValueAtTime(0.3, t); // Increased from 0.05
                    osc.start(t);
                    osc.stop(t + 0.05);
                    break;
                case 'select':
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(400, t);
                    gain.gain.setValueAtTime(0.3, t); // Increased
                    osc.start(t);
                    osc.stop(t + 0.1);
                    break;
                case 'success':
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(400, t);
                    osc.frequency.exponentialRampToValueAtTime(800, t + 0.1);
                    gain.gain.setValueAtTime(0.5, t); // Increased
                    gain.gain.linearRampToValueAtTime(0, t + 0.3);
                    osc.start(t);
                    osc.stop(t + 0.3);
                    break;
                case 'error':
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(150, t);
                    osc.frequency.linearRampToValueAtTime(100, t + 0.2);
                    gain.gain.setValueAtTime(0.4, t); // Increased
                    gain.gain.linearRampToValueAtTime(0, t + 0.2);
                    osc.start(t);
                    osc.stop(t + 0.2);
                    break;
                case 'unsolve':
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(300, t);
                    gain.gain.setValueAtTime(0.4, t); // Increased
                    gain.gain.linearRampToValueAtTime(0, t + 0.2);
                    osc.start(t);
                    osc.stop(t + 0.2);
                    break;
                case 'win':
                    // Arpeggio
                    this.playNote(523.25, t, 0.1);
                    this.playNote(659.25, t + 0.1, 0.1);
                    this.playNote(783.99, t + 0.2, 0.2);
                    this.playNote(1046.50, t + 0.4, 0.4);
                    break;
                case 'loss':
                    // Descending tones
                    this.playNote(400, t, 0.2);
                    this.playNote(300, t + 0.2, 0.2);
                    this.playNote(200, t + 0.4, 0.4);
                    break;
            }
        } catch (e) {
            console.error("Audio Error:", e);
        }
    }

    playNote(freq, time, dur) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.frequency.setValueAtTime(freq, time);
        gain.gain.setValueAtTime(0.5, time); // Increased
        gain.gain.linearRampToValueAtTime(0, time + dur);
        osc.start(time);
        osc.stop(time + dur);
    }
}

class GamutonorGame {
    constructor() {
        this.gridContainer = document.getElementById('grid-container');
        this.stripContainer = document.getElementById('strip-container');
        this.difficultyDisplay = document.getElementById('difficulty-display');
        this.remainingCount = document.getElementById('remaining-count');
        this.modal = document.getElementById('modal');
        this.modalTitle = document.getElementById('modal-title');
        this.modalMessage = document.getElementById('modal-message');
        this.closeModalBtn = document.getElementById('modal-close-btn');

        this.modalMessage = document.getElementById('modal-message');
        this.closeModalBtn = document.getElementById('modal-close-btn');

        // Menus
        this.mainMenu = document.getElementById('main-menu');
        this.gameUI = document.getElementById('game-ui');
        this.btnCampaign = document.getElementById('btn-campaign');
        this.btnSandbox = document.getElementById('btn-sandbox');

        // HUD & Controls
        this.campaignHUD = document.getElementById('campaign-hud');
        this.sandboxControls = document.getElementById('sandbox-controls');
        this.levelDisplay = document.getElementById('level-display');
        this.scoreDisplay = document.getElementById('score-display');
        this.timeDisplay = document.getElementById('time-display');
        this.timeDisplay = document.getElementById('time-display');
        this.sandboxTimeDisplay = document.getElementById('sandbox-timer');
        this.btnToggleTimer = document.getElementById('btn-toggle-timer');
        this.exitBtn = document.getElementById('exit-btn');

        this.newGameBtn = document.getElementById('new-game-btn');
        this.toggleModeBtn = document.getElementById('toggle-mode-btn');
        this.difficultySelect = document.getElementById('difficulty-select');
        this.difficultySelect = document.getElementById('difficulty-select');
        this.btnShowSolution = document.getElementById('btn-show-solution');
        this.btnSoundToggle = document.getElementById('btn-sound-toggle'); // New Button

        this.state = {
            stripNumbers: [],
            gridNumbers: [], // { value: number, solved: boolean, id: string }
            selectedGridId: null,
            selectedStripIndices: [], // [0, 2] indices in stripNumbers
            isPuzzleMode: false,
            difficulty: 4, // Number of strip items (3, 4, 5, 6)
            hiddenIndices: [], // Indices of numbers hidden in puzzle mode
            guessedNumbers: {}, // Key: index, Value: number (user guess)
            usedStatus: {} // Key: index, Value: { sum: boolean, product: boolean }
        };

        // State extension
        this.state = {
            ...this.state,
            mode: 'menu', // menu, sandbox, campaign
            level: 1,
            score: 0,
            timer: 0,
            timerInterval: null
        };

        this.inputModal = document.getElementById('input-modal');
        this.inputConfirmBtn = document.getElementById('input-confirm-btn');
        this.inputCloseBtn = document.getElementById('input-close-btn');
        this.currentInputIndex = null;
        this.currentInputValue = '';
        this.btnUltra = document.getElementById('btn-ultra');

        // History DOM
        this.highScoreDisplay = document.getElementById('high-score');
        this.highScoreLevelDisplay = document.getElementById('high-score-level');
        this.historyList = document.getElementById('history-list');

        // Extend State for History
        this.state.history = []; // { time: 'HH:MM', score: number, level: number, result: 'Win'|'Loss' }
        this.state.highScore = 0;
        this.state.highScoreLevel = 1;

        this.init();
    }



    init() {
        // Menu Listeners
        this.btnCampaign.addEventListener('click', () => this.startCampaignMode());
        this.btnSandbox.addEventListener('click', () => this.startSandboxMode());
        if (this.btnUltra) this.btnUltra.addEventListener('click', () => this.startUltraMode());
        this.exitBtn.addEventListener('click', () => this.goToMenu());

        // Game Listeners
        this.newGameBtn.addEventListener('click', () => {
            if (this.state.mode === 'sandbox') {
                this.startNewGame();
            } else {
                // Campaign or Ultra
                if (this.state.gameOver) {
                    // Restart Campaign from Level 1
                    this.state.level = 1;
                    this.state.score = 0;
                    this.startLevel(1);
                } else {
                    // Just restart current level (penalty? or just retry)
                    // Usually restart level resets time.
                    this.startLevel(this.state.level);
                }
            }
        });
        this.toggleModeBtn.addEventListener('click', () => this.toggleMode());
        this.closeModalBtn.addEventListener('click', () => {
            this.hideModal();
            if (this.state.mode === 'campaign' && this.state.level <= 25) {
                this.nextLevel();
            }
        });

        this.audio = new AudioController();
        // Unlock audio on EVERY click just to be safe
        document.addEventListener('click', () => {
            if (this.audio.ctx && this.audio.ctx.state === 'suspended') {
                this.audio.ctx.resume();
            } else if (!this.audio.ctx) {
                this.audio.init();
            }
        }, { once: false }); // Keep listening nicely or just use specific handlers



        this.difficultySelect.addEventListener('change', (e) => {
            this.state.difficulty = parseInt(e.target.value);
            this.startNewGame();
        });

        if (this.btnShowSolution) {
            this.btnShowSolution.addEventListener('click', () => {
                this.solveGame();
            });
        }

        if (this.btnSoundToggle) {
            this.updateSoundIcon();
            this.btnSoundToggle.addEventListener('click', () => this.toggleSound());
        }

        if (this.btnToggleTimer) {
            this.btnToggleTimer.addEventListener('click', () => {
                this.sandboxTimeDisplay.classList.toggle('hidden');
                const isHidden = this.sandboxTimeDisplay.classList.contains('hidden');
                this.btnToggleTimer.title = isHidden ? "Mostrar Tiempo" : "Ocultar Tiempo";
                this.btnToggleTimer.style.opacity = isHidden ? '0.5' : '1';
            });
        }

        // Numpad Listeners
        document.querySelectorAll('.num-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleNumpad(e.target.textContent));
        });
        this.inputCloseBtn.addEventListener('click', () => this.hideInputModal());
        this.inputConfirmBtn.addEventListener('click', () => this.confirmInput());

        // Key Listener for Enter
        document.addEventListener('keydown', (e) => {
            if (this.inputModal.classList.contains('visible')) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.confirmInput();
                } else if (!isNaN(e.key)) {
                    // Optional: Support keyboard numbers too?
                    this.handleNumpad(e.key);
                } else if (e.key === 'Backspace') {
                    this.handleNumpad('Borrar');
                }
            }
        });

        // Click Outside Listener
        this.inputModal.addEventListener('click', (e) => {
            if (e.target === this.inputModal) {
                // Clicked backdrop
                this.confirmInput();
            }
        });

        // Toggle Listener for Input Mode (Logic inside handleNumpad)
        this.inputModeToggle = document.getElementById('input-mode-toggle');

        this.btnShareScore = document.getElementById('btn-share-score');
        if (this.btnShareScore) {
            this.btnShareScore.addEventListener('click', () => this.shareScore());
        }

        this.startNewGame();
    }

    addToHistory(result) {
        // Safety check if history sidebar is removed from DOM
        if (!this.historyList) return;

        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        // Update High Score
        if (this.state.score > this.state.highScore) {
            this.state.highScore = this.state.score;
            this.state.highScoreLevel = this.state.level; // Track level too

            if (this.highScoreDisplay) {
                this.highScoreDisplay.textContent = this.state.highScore;
            }
            if (this.highScoreLevelDisplay) {
                this.highScoreLevelDisplay.textContent = this.state.highScoreLevel;
            }
        }

        // Add Run
        const run = {
            time: timeStr,
            score: this.state.score,
            level: this.state.level,
            result: result // 'win' or 'loss'
        };
        this.state.history.unshift(run); // Newest first

        this.renderHistory();
    }

    renderHistory() {
        if (!this.historyList) return;

        this.historyList.innerHTML = '';
        if (this.state.history.length === 0) {
            this.historyList.innerHTML = '<div class="history-placeholder">Sin partidas aún</div>';
            return;
        }

        this.state.history.forEach(run => {
            const card = document.createElement('div');
            card.className = `history-card ${run.result === 'win' ? 'win' : 'loss'}`;

            card.innerHTML = `
                <div class="history-info">
                    <span class="history-time">${run.time}</span>
                    <span style="font-size: 0.8rem;">Nivel ${run.level}</span>
                </div>
                <div class="history-score">${run.score} pts</div>
            `;
            this.historyList.appendChild(card);
        });
    }

    // ... (rest of methods)

    toggleSound() {
        const isEnabled = this.audio.toggle();
        this.updateSoundIcon();
        this.showToast(isEnabled ? "Sonido Activado" : "Sonido Desactivado", 'success');
    }

    updateSoundIcon() {
        if (!this.btnSoundToggle) return;
        // Simple text/emoji toggle or SVG replacement
        if (this.audio.enabled) {
            this.btnSoundToggle.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                </svg>
            `;
            this.btnSoundToggle.title = "Silenciar";
            this.btnSoundToggle.classList.remove('muted');
        } else {
            this.btnSoundToggle.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                    <line x1="23" y1="9" x2="17" y2="15"></line>
                    <line x1="17" y1="9" x2="23" y2="15"></line>
                </svg>
            `;
            this.btnSoundToggle.title = "Activar Sonido";
            this.btnSoundToggle.classList.add('muted');
        }
    }

    handleNumpad(val) {
        if (val === 'Borrar') {
            this.currentInputValue = this.currentInputValue.slice(0, -1);
        } else if (val === 'Confirmar') {
            this.confirmInput();
        } else {
            // Append value
            if (this.currentInputValue.length < 2) {
                this.currentInputValue += val;
            }

            // Auto-Confirm Logic
            const isTwoDigitMode = this.inputModeToggle.checked;

            if (isTwoDigitMode) {
                // Confirm if length is 2
                if (this.currentInputValue.length === 2) {
                    this.confirmInput();
                    return; // Return to avoid double update of title if modal closes
                }
            } else {
                // Confirm logic for 1 digit: Confirm immediately
                // Wait, if I type 1, it confirms. I can't type 2 digits here.
                this.confirmInput();
                return;
            }
        }

        const title = this.inputModal.querySelector('h3');
        title.textContent = this.currentInputValue ? `Valor: ${this.currentInputValue}` : 'Ingresa el número';
    }

    toggleMode() {
        this.state.isPuzzleMode = !this.state.isPuzzleMode;
        this.toggleModeBtn.textContent = `Modo Puzzle: ${this.state.isPuzzleMode ? 'ON' : 'OFF'}`;

        // Restart logic to apply changes
        this.startNewGame();
    }

    goToMenu() {
        this.stopTimer();
        this.mainMenu.style.display = 'flex';
        this.gameUI.classList.add('hidden');
        this.state.mode = 'menu';
    }

    startSandboxMode() {
        this.state.mode = 'sandbox';
        this.state.score = 0;
        this.state.isPuzzleMode = false; // Default OFF
        this.mainMenu.style.display = 'none';
        this.gameUI.classList.remove('hidden');
        this.campaignHUD.classList.add('hidden');
        this.sandboxControls.classList.remove('hidden');
        this.toggleModeBtn.style.display = 'block';
        this.toggleModeBtn.textContent = 'Modo Puzzle: OFF'; // Sync text
        this.startNewGame();
    }

    startCampaignMode() {
        this.state.mode = 'campaign';
        this.state.level = 1;
        this.state.score = 0;
        this.mainMenu.style.display = 'none';
        this.gameUI.classList.remove('hidden');
        this.campaignHUD.classList.remove('hidden');
        this.sandboxControls.classList.add('hidden');
        this.toggleModeBtn.style.display = 'none'; // Force hide completely
        this.startLevel(1);
    }

    startUltraMode() {
        this.state.mode = 'ultra';
        this.mainMenu.style.display = 'none';
        this.gameUI.classList.remove('hidden');
        this.gameUI.classList.add('mode-ultra');
        this.campaignHUD.classList.add('hidden');
        this.sandboxControls.classList.add('hidden');
        this.toggleModeBtn.style.display = 'none';

        this.startNewGame();
        this.startTimer(60);
    }

    showMessage(msg, type = 'error') {
        const el = document.getElementById('game-message');
        const divider = document.querySelector('.divider');

        if (!el || !divider) return; // Safety

        el.textContent = msg;
        el.className = 'game-message visible';
        divider.classList.add('has-message');

        if (type === 'success') el.style.color = 'var(--success-color)';
        else el.style.color = '#ef4444';

        if (this.messageTimeout) clearTimeout(this.messageTimeout);

        this.messageTimeout = setTimeout(() => {
            el.className = 'game-message';
            divider.classList.remove('has-message');
        }, 2000);
    }

    showToast(msg, type = 'success') {
        const toast = document.getElementById('toast');
        if (!toast) return;

        toast.textContent = msg;
        toast.className = `toast visible ${type === 'error' ? 'error' : ''}`;

        setTimeout(() => {
            toast.className = 'toast hidden';
        }, 3000);
    }

    shareScore() {
        const score = this.state.highScore;
        const level = this.state.highScoreLevel;

        if (score === 0) {
            this.showToast("Juega primero para compartir", 'error');
            return;
        }

        const text = `🏆 Gamutonor Récord\nNivel: ${level}\nPuntos: ${score}`;

        navigator.clipboard.writeText(text).then(() => {
            this.showToast("¡Copiado al portapapeles!", 'success');
            this.audio.play('select');
        }).catch(err => {
            console.error('Error copying text: ', err);
            this.showToast("Error al copiar", 'error');
        });
    }

    startLevel(level) {
        this.state.gameOver = false; // Reset Game Over status

        // Disable Show Solution in Campaign/Competitive Mode initially
        if (this.state.mode === 'campaign') {
            if (this.btnShowSolution) {
                this.btnShowSolution.disabled = true;
                this.btnShowSolution.classList.add('disabled-btn');
                this.btnShowSolution.style.opacity = '0.5';
                this.btnShowSolution.style.cursor = 'not-allowed';
            }
        } else {
            // In sandbox or others, ensure enabled
            if (this.btnShowSolution) {
                this.btnShowSolution.disabled = false;
                this.btnShowSolution.classList.remove('disabled-btn');
                this.btnShowSolution.style.opacity = '1';
                this.btnShowSolution.style.cursor = 'pointer';
            }
        }

        // Config Curve
        let diff = 4;
        let hidden = 0;
        let time = 60;

        // "No Puzzle Mode Off" -> Always hidden items in Campaign
        if (level <= 5) { diff = 4; hidden = 1; }
        else if (level <= 10) { diff = 4; hidden = 1; }
        else if (level <= 15) { diff = 6; hidden = 2; }
        else if (level <= 20) { diff = 6; hidden = 2; }
        else if (level <= 24) { diff = 8; hidden = 3; }
        else { diff = 8; hidden = 4; }

        // Apply
        this.state.difficulty = diff;
        this.state.isPuzzleMode = (hidden > 0);
        this.state.levelHiddenCount = hidden;

        this.levelDisplay.textContent = level;
        this.scoreDisplay.textContent = this.state.score;

        this.startNewGame();
        this.startTimer(time);
    }

    applyPenalty() {
        // this.audio.play('error'); // Removed per user request
        if (this.state.mode === 'sandbox') {
            // No time penalty in sandbox
            // Score Penalty
            this.state.score = Math.max(0, this.state.score - 50);
            this.scoreDisplay.textContent = this.state.score;
            this.showMessage("¡Número Incorrecto!", 'error');
        } else {
            // Time Penalty for Campaign
            this.state.timer = Math.max(0, this.state.timer - 3);
            this.updateTimeDisplay();
            // Score Penalty
            this.state.score = Math.max(0, this.state.score - 50);
            this.scoreDisplay.textContent = this.state.score;
            // Feedback
            this.showMessage("¡Número Incorrecto! -3 seg", 'error');
        }

        // Shake Timer (optional in sandbox, but keeps feedback consistent visually)
        this.timeDisplay.classList.remove('shake'); // Reset anim
        void this.timeDisplay.offsetWidth; // Trigger reflow
        this.timeDisplay.classList.add('shake');
    }

    startTimer(seconds) {
        this.stopTimer();
        this.state.timer = seconds;
        this.updateTimeDisplay();
        this.state.timerInterval = setInterval(() => {
            this.state.timer--;
            this.updateTimeDisplay();
            if (this.state.timer <= 0) {
                this.stopTimer();
                this.addToHistory('loss');

                // Game Over Logic
                this.state.gameOver = true;
                this.audio.play('loss');

                // Enable Show Solution button if it was disabled
                if (this.btnShowSolution) {
                    this.btnShowSolution.disabled = false;
                    this.btnShowSolution.classList.remove('disabled-btn');
                    this.btnShowSolution.style.opacity = '1';
                    this.btnShowSolution.style.cursor = 'pointer';
                }

                this.showModal("¡Se acabó el tiempo!", `Llegaste al Nivel ${this.state.level}. Puntuación final: ${this.state.score}. Puedes ver la solución o reintentar.`);

                // Do NOT reset level immediately. User stays on screen.
            }
        }, 1000);
    }

    startStopwatch() {
        this.stopTimer(); // Clear any existing interval
        this.state.timer = 0;
        this.updateStopwatchDisplay();
        this.state.timerInterval = setInterval(() => {
            this.state.timer++;
            this.updateStopwatchDisplay();
        }, 1000);
    }

    updateStopwatchDisplay() {
        if (!this.sandboxTimeDisplay) return;
        const minutes = Math.floor(this.state.timer / 60).toString().padStart(2, '0');
        const seconds = (this.state.timer % 60).toString().padStart(2, '0');
        this.sandboxTimeDisplay.textContent = `${minutes}:${seconds}`;
    }

    // ... (stopTimer, updateTimeDisplay, nextLevel kept same) ...
    stopTimer() {
        if (this.state.timerInterval) clearInterval(this.state.timerInterval);
    }

    updateTimeDisplay() {
        this.timeDisplay.textContent = this.state.timer;
        if (this.state.timer <= 10) this.timeDisplay.style.color = '#ef4444';
        else this.timeDisplay.style.color = 'var(--accent-color)';
    }

    nextLevel() {
        // If Game Over, do not advance.
        if (this.state.gameOver) {
            // Maybe show a message confirming they finished but lost?
            this.showModal("Tablero Completado", "Has completado el tablero, pero el tiempo se había agotado. Inicia una Nueva Partida para reintentar.");
            return;
        }

        this.state.score += (this.state.level * 100) + (this.state.timer * 10);
        this.state.level++;
        if (this.state.level > 25) {
            this.addToHistory('win');
            this.showModal('¡JUEGO COMPLETADO!', `Puntuación Final: ${this.state.score}`);
            // Logic to go to menu handled by modal close or manual exit? 
            // Previous code used alert then goToMenu. Modal is async-ish.
            // We'll let user click Exit or close modal.
        } else {
            this.startLevel(this.state.level);
        }
    }

    startNewGame() {
        this.stopTimer();
        if (this.state.mode === 'sandbox') {
            this.startStopwatch();
        }

        this.gridContainer.innerHTML = '';
        this.stripContainer.innerHTML = '';
        this.remainingCount.textContent = '0';

        // Fix: Do NOT reset score here unconditionally.
        // Score is managed by startCampaign/startSandbox or persisted.
        // this.state.score = 0; 

        this.currentStreak = 0;
        this.scoreDisplay.textContent = this.state.score;

        // DIFFICULTY & MODE LOGIC
        let count = 8;
        if (this.state.mode === 'ultra') {
            count = 16;
            this.state.difficulty = 16;
        } else if (this.state.mode === 'sandbox') {
            count = parseInt(this.difficultySelect.value);
        } else {
            if (this.state.difficulty === 4) count = 4;
            else if (this.state.difficulty === 6) count = 6;
            else count = 8;
        }



        // GENERATION
        const strip = [];
        if (count <= 9) {
            // Unique Numbers Logic (User Request)
            const candidates = [1, 2, 3, 4, 5, 6, 7, 8, 9];
            this.shuffleArray(candidates);
            for (let i = 0; i < count; i++) {
                strip.push(candidates[i]);
            }
        } else {
            // Fallback for Ultra (16 items > 9)
            while (strip.length < count) {
                strip.push(Math.floor(Math.random() * 9) + 1);
            }
        }
        this.state.stripNumbers = [...strip];

        let targetIdCounter = 0;
        const targets = [];

        if (this.state.mode === 'ultra') {
            // Ultra Mode: 4 Ops. Logic is complex for "Complete Coverage".
            // For now, let's keep Ultra random mix (User focused on Campaign)
            // Or improve it slightly: Generate N/2 targets, but try to use variety.
            // Reverting Ultra to Simple Random Pairing for now to prioritize Campaign fix.
            const pool = [...strip];
            this.shuffleArray(pool);
            const numPairs = count / 2;

            for (let i = 0; i < numPairs; i++) {
                const p1 = pool.pop();
                const p2 = pool.pop();
                const pair = [p1, p2].sort((a, b) => a - b);

                const validOps = ['sum', 'product', 'diff'];
                if (pair[0] !== 0 && pair[1] % pair[0] === 0) validOps.push('div');
                const opType = validOps[Math.floor(Math.random() * validOps.length)];

                let value;
                if (opType === 'sum') value = pair[0] + pair[1];
                else if (opType === 'product') value = pair[0] * pair[1];
                else if (opType === 'diff') value = pair[1] - pair[0];
                else if (opType === 'div') value = pair[1] / pair[0];

                targets.push({ id: `g-${targetIdCounter++}`, value, type: opType, parents: pair, solved: false, solvedIndices: null });
            }
        } else {
            // CAMPAIGN / STANDARD: DUAL USAGE RULE
            // 1. Sums: Use ALL numbers in pairs
            const poolSum = [...strip];
            this.shuffleArray(poolSum);
            while (poolSum.length >= 2) {
                const p1 = poolSum.pop();
                const p2 = poolSum.pop();
                const pair = [p1, p2].sort((a, b) => a - b);
                targets.push({
                    id: `g-${targetIdCounter++}`,
                    value: pair[0] + pair[1],
                    type: 'sum',
                    parents: pair,
                    solved: false,
                    solvedIndices: null
                });
            }

            // 2. Products: Use ALL numbers in pairs (reshuffled)
            // Retry shuffle if we get same pairs? Not strictly necessary but nicer.
            const poolProd = [...strip];
            this.shuffleArray(poolProd);
            // Avoid exact same pairs? Complicated. Let's strictly just ensure Prod usage.
            while (poolProd.length >= 2) {
                const p1 = poolProd.pop();
                const p2 = poolProd.pop();
                const pair = [p1, p2].sort((a, b) => a - b);
                targets.push({
                    id: `g-${targetIdCounter++}`,
                    value: pair[0] * pair[1],
                    type: 'product',
                    parents: pair,
                    solved: false,
                    solvedIndices: null
                });
            }
        }

        this.state.gridNumbers = targets; // Now contains N targets (Start: 4)

        // 3. Puzzle Mode Hiding
        this.state.hiddenIndices = [];
        if (this.state.isPuzzleMode || this.state.mode === 'ultra') {
            let hideCount = 0;
            if (this.state.mode === 'campaign') hideCount = this.state.levelHiddenCount;
            else if (this.state.mode === 'ultra') hideCount = 6;
            else {
                if (this.state.difficulty === 4) hideCount = 1;
                else if (this.state.difficulty === 6) hideCount = 2;
                else if (this.state.difficulty > 6) hideCount = 3;
            }
            const indices = Array.from({ length: count }, (_, i) => i);
            this.state.hiddenIndices = indices.slice(0, hideCount);
        }

        // Final Shuffle of Grid displayed
        this.shuffleArray(this.state.gridNumbers);

        this.state.selectedGridId = null;
        this.state.selectedStripIndices = [];
        this.state.guessedNumbers = {};
        this.state.usedStatus = {};
        for (let k = 0; k < this.state.stripNumbers.length; k++) {
            this.state.usedStatus[k] = { sum: false, product: false, diff: false, div: false };
        }

        this.render();
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    handleGridClick(id) {
        const item = this.state.gridNumbers.find(g => g.id === id);

        if (item.solved) {
            this.unsolveItem(item);
            return;
        }

        if (this.state.selectedGridId === id) {
            this.state.selectedGridId = null;
        } else {
            this.state.selectedGridId = id;
            this.state.selectedStripIndices = [];
        }
        this.render();
    }

    unsolveItem(item) {
        item.solved = false;

        // Robust Unsolve using stored indices
        if (item.solvedIndices) {
            const idx1 = item.solvedIndices[0];
            const idx2 = item.solvedIndices[1];

            if (item.type === 'sum') {
                if (this.state.usedStatus[idx1]) this.state.usedStatus[idx1].sum = false;
                if (this.state.usedStatus[idx2]) this.state.usedStatus[idx2].sum = false;
            } else {
                if (this.state.usedStatus[idx1]) this.state.usedStatus[idx1].product = false;
                if (this.state.usedStatus[idx2]) this.state.usedStatus[idx2].product = false;
            }
            // Clear stored indices
            item.solvedIndices = null;
        } else {
            // Fallback for legacy state (should not happen with new logic)
            // Restore functionality just in case
            const p1 = item.parents[0];
            const p2 = item.parents[1];
            const idx1 = this.state.stripNumbers.indexOf(p1);
            const idx2 = this.state.stripNumbers.indexOf(p2);

            if (idx1 !== -1) {
                if (item.type === 'sum') this.state.usedStatus[idx1].sum = false;
                else this.state.usedStatus[idx1].product = false;
            }
            if (idx2 !== -1) {
                if (item.type === 'sum') this.state.usedStatus[idx2].sum = false;
                else this.state.usedStatus[idx2].product = false;
            }
        }

        this.render();
    }

    trySwapHidden(neededVal, targetIdx, otherIdx) {
        // If current slot already has it, do nothing
        if (this.state.stripNumbers[targetIdx] === neededVal) return;

        // Only swap if target is Hidden (mutable state)
        // If target is visible fixed number, we can't magically change it.
        // Or if it IS guessed but conceptually hidden geometry.
        // Actually, logic is: "If I put 7 in a hidden box".
        // Use hiddenIndices to check if target is a "hidden box"
        if (!this.state.hiddenIndices.includes(targetIdx)) return;

        // Find a donor
        const donorIdx = this.state.stripNumbers.findIndex((val, idx) => {
            if (val !== neededVal) return false;
            // Must be hidden
            if (!this.state.hiddenIndices.includes(idx)) return false;
            // Must be unused OR be the other currently selected active item
            if (idx === otherIdx) return true;

            const u = this.state.usedStatus[idx];
            if (u.sum || u.product || u.diff || u.div) return false;

            return true;
        });

        if (donorIdx !== -1) {
            // SWAP
            const temp = this.state.stripNumbers[targetIdx];
            this.state.stripNumbers[targetIdx] = this.state.stripNumbers[donorIdx];
            this.state.stripNumbers[donorIdx] = temp;
            console.log(`Swapped hidden values between ${targetIdx} and ${donorIdx} to match guess ${neededVal}`);
        }
    }

    handleStripClick(index) {
        if (!this.state.selectedGridId) return;

        const selectedIdx = this.state.selectedStripIndices;
        if (selectedIdx.includes(index)) {
            this.state.selectedStripIndices = selectedIdx.filter(i => i !== index);
        } else {
            if (selectedIdx.length < 2) {
                this.state.selectedStripIndices.push(index);
            }
        }
        this.render();

        if (this.state.selectedStripIndices.length === 2) {
            setTimeout(() => this.checkSolution(), 50);
        }
    }

    solveGame() {
        // 1. Reveal all hidden properties by filling them as "guesses"
        // This keeps the visual style of the unknown box but shows the number.
        this.state.hiddenIndices.forEach(idx => {
            this.state.guessedNumbers[idx] = this.state.stripNumbers[idx];
        });
        // this.state.hiddenIndices = []; // REMOVED: Keep indices as hidden to maintain style

        // 2. Solve remaining items
        this.state.gridNumbers.forEach(item => {
            if (item.solved) return;

            item.solved = true;

            const p1 = item.parents[0];
            const p2 = item.parents[1];
            const type = item.type; // 'sum' or 'product'

            // Search for an unused index that matches the value
            // We verify that the specific operation (sum/product) hasn't been used yet for this index.

            // Find idx1
            let idx1 = this.state.stripNumbers.findIndex((val, i) =>
                val === p1 && !this.state.usedStatus[i][type]
            );

            // Fallback (defensive)
            if (idx1 === -1) idx1 = this.state.stripNumbers.findIndex((val, i) => val === p1);

            // Mark as tentatively used for this loop to prevent idx2 from picking it if p1==p2
            // Actually, we can just pass i !== idx1 to the second search.

            // Find idx2
            let idx2 = this.state.stripNumbers.findIndex((val, i) =>
                val === p2 && !this.state.usedStatus[i][type] && i !== idx1
            );

            // Fallback
            if (idx2 === -1) idx2 = this.state.stripNumbers.findIndex((val, i) => val === p2 && i !== idx1);

            if (idx1 !== -1 && idx2 !== -1) {
                item.solvedIndices = [idx1, idx2];

                // Update Used Status
                if (!this.state.usedStatus[idx1]) this.state.usedStatus[idx1] = {};
                if (!this.state.usedStatus[idx2]) this.state.usedStatus[idx2] = {};

                if (type === 'sum') {
                    this.state.usedStatus[idx1].sum = true;
                    this.state.usedStatus[idx2].sum = true;
                } else if (type === 'product') {
                    this.state.usedStatus[idx1].product = true;
                    this.state.usedStatus[idx2].product = true;
                }
            }
        });

        // 4. Render
        this.render();
        this.showMessage('Solución Revelada', 'success');
        this.stopTimer();
    }

    checkSolution() {
        const targetId = this.state.selectedGridId;
        const targetItem = this.state.gridNumbers.find(g => g.id === targetId);

        const idx1 = this.state.selectedStripIndices[0];
        const idx2 = this.state.selectedStripIndices[1];

        const num1 = this.getStripValue(idx1);
        const num2 = this.getStripValue(idx2);

        if (num1 === null || num2 === null) {
            this.flashError();
            setTimeout(() => {
                this.state.selectedStripIndices = [];
                this.render();
            }, 500);
            return;
        }

        // QUANTUM LOGIC: Swap hidden values if guess matches another hidden slot
        // "No importa el casillero"
        this.trySwapHidden(num1, idx1, idx2);
        this.trySwapHidden(num2, idx2, idx1);

        // Validate Guesses against Real Values
        const real1 = this.state.stripNumbers[idx1];
        const real2 = this.state.stripNumbers[idx2];

        if (num1 !== real1 || num2 !== real2) {
            this.showMessage("¡Número incorrecto! Revisa.", 'error');
            this.applyPenalty(); // Penalty
            this.flashError();
            this.state.selectedStripIndices = [];
            this.state.selectedGridId = null;
            this.render();
            return;
        }

        // Flexible Math
        const pair = [num1, num2].sort((a, b) => a - b); // [Small, Big]

        const sum = pair[0] + pair[1];
        const prod = pair[0] * pair[1];
        const diff = pair[1] - pair[0];
        const div = (pair[0] !== 0 && pair[1] % pair[0] === 0) ? (pair[1] / pair[0]) : null;

        let matchType = null;
        if (sum === targetItem.value) matchType = 'sum';
        else if (prod === targetItem.value) matchType = 'product';

        if (matchType) {
            // 2. Check Usage Limits
            const u1 = this.state.usedStatus[idx1];
            const u2 = this.state.usedStatus[idx2];

            // Check based on the operation we are performing
            const alreadyUsed = matchType === 'sum' ? (u1.sum || u2.sum) : (u1.product || u2.product);

            if (alreadyUsed) {
                this.showMessage(`¡Ya usado para ${matchType === 'sum' ? 'sumar' : 'multiplicar'}!`, 'error');
                this.flashError();
                this.state.selectedStripIndices = [];
                this.state.selectedGridId = null;
                this.render();
                return;
            }

            // Success - Apply Changes
            if (matchType === 'sum') {
                this.state.usedStatus[idx1].sum = true;
                this.state.usedStatus[idx2].sum = true;
            } else {
                this.state.usedStatus[idx1].product = true;
                this.state.usedStatus[idx2].product = true;
            }

            // Update Target with ACTUAL interactions
            targetItem.solved = true;
            targetItem.parents = [num1, num2].sort((a, b) => a - b);
            targetItem.type = matchType;
            targetItem.solvedIndices = [idx1, idx2]; // Critical for unsolving duplicates

            // Score Logic (FIX: Was missing)
            // Only add points if Game Over hasn't happened yet
            if (!this.state.gameOver) {
                this.state.score += 100;
                this.scoreDisplay.textContent = this.state.score;
            }
            this.audio.play('success');

            // Reveal Mechanics REMOVED per user request
            // Numbers remain "hidden" (guessed style) even after solving.
            /*
            if (this.state.hiddenIndices.includes(idx1)) {
                this.state.hiddenIndices = this.state.hiddenIndices.filter(i => i !== idx1);
            }
            if (this.state.hiddenIndices.includes(idx2)) {
                this.state.hiddenIndices = this.state.hiddenIndices.filter(i => i !== idx2);
            }
            */

            this.state.selectedGridId = null;
            this.state.selectedStripIndices = [];

            // Auto-Select Logic (User Request)
            const remaining = this.state.gridNumbers.filter(g => !g.solved);
            if (remaining.length === 1) {
                this.state.selectedGridId = remaining[0].id;
            }

            this.render();
            this.checkWinCondition();

        } else {
            // Math incorrect
            this.showMessage("¡El resultado no coincide!", 'error');
            this.applyPenalty();
            this.flashError();
            setTimeout(() => {
                this.state.selectedStripIndices = [];
                this.state.selectedGridId = null;
                this.render();
            }, 500);
        }
    }

    markSolved(id) {
        // Redundant with new logic, but kept if called elsewhere (unlikely)
        const item = this.state.gridNumbers.find(g => g.id === id);
        item.solved = true;
        this.render();
    }

    checkWinCondition() {
        const allSolved = this.state.gridNumbers.every(g => g.solved);
        if (allSolved) {
            this.stopTimer();
            this.audio.play('win'); // Sound on level pass

            // If Game Over (played after loss), do not show modal
            if (this.state.gameOver) return;

            if (this.state.mode === 'campaign') {
                this.showModal(`¡Nivel ${this.state.level} Completado!`, `Puntos del nivel: ${this.state.level * 100 + this.state.timer * 10}`);
            } else {
                this.showModal('¡Felicidades!', 'Has completado el tablero.');
            }
        }
    }

    flashError() {
        const gridEl = document.querySelector(`.cell.selected`);
        if (gridEl) {
            gridEl.animate([
                { transform: 'translateX(0)' },
                { transform: 'translateX(-5px)' },
                { transform: 'translateX(5px)' },
                { transform: 'translateX(0)' }
            ], { duration: 300 });
            gridEl.style.borderColor = '#ef4444';
        }
    }

    render() {
        // Update Stats
        this.remainingCount.textContent = this.state.gridNumbers.filter(g => !g.solved).length;

        // Render Grid
        this.gridContainer.innerHTML = '';
        // Adjust Columns
        // Grid Size is N. (4, 6, 8...).
        // 4 -> 2x2. 6 -> 3x2. 8 -> 4x2.
        let cols = Math.ceil(this.state.gridNumbers.length / 2);
        if (cols < 2) cols = 2; // Fixed: Ensure at least 2 columns
        this.gridContainer.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

        this.state.gridNumbers.forEach(item => {
            const el = document.createElement('div');
            el.className = `cell ${item.solved ? 'solved' : ''} ${this.state.selectedGridId === item.id ? 'selected' : ''}`;

            // Content
            if (item.solved) {
                el.classList.add('show-calc');
                const valSpan = document.createElement('span');
                valSpan.className = 'cell-value';
                valSpan.textContent = item.value;

                const calcSpan = document.createElement('span');
                calcSpan.className = 'cell-calc';
                const p1 = item.parents[0];
                const p2 = item.parents[1];
                const sym = item.type === 'sum' ? '+' : '×';
                calcSpan.textContent = `${p1}${sym}${p2}`;

                el.appendChild(valSpan);
                el.appendChild(calcSpan);
            } else {
                el.textContent = item.value;
            }

            el.onclick = () => this.handleGridClick(item.id);
            this.gridContainer.appendChild(el);
        });

        // Render Strip
        this.stripContainer.innerHTML = '';

        // Groups for ordering: Knowns Left, Unknowns Right
        const knownEls = [];
        const unknownEls = [];

        this.state.stripNumbers.forEach((num, index) => {
            const el = document.createElement('div');
            const isSelected = this.state.selectedStripIndices.includes(index);
            const isHidden = this.state.hiddenIndices.includes(index);
            const guessedVal = this.state.guessedNumbers[index];
            // Check strictly for undefined, as 0 is a valid number
            const hasGuess = (guessedVal !== undefined && guessedVal !== null);
            const status = this.state.usedStatus[index] || { sum: false, product: false };

            el.className = `strip-item ${isSelected ? 'selected' : ''}`;

            // Content Logic
            if (isHidden) {
                el.classList.add('hidden-value');
                if (hasGuess) {
                    el.textContent = guessedVal;
                    el.classList.add('guessed');
                    // Style Note: 'guessed' class separates style from selection
                } else {
                    el.textContent = '?';
                }

                el.onclick = (e) => {
                    e.stopPropagation();
                    // Fix: If it has a value, we treat it as a number selection (unless we want to edit?)
                    // If user wants to edit, they might be blocked if we force selection.
                    // Heuristic: If we are 'solving' (grid selected), we SELECT.
                    // If nothing selected, maybe we allow edit?
                    // But handleStripClick checks for selectedGridId.

                    if (hasGuess) {
                        // Priority: Use it for game
                        this.handleStripClick(index);

                        // Fallback: If handleStripClick ignored it (no grid selected), open modal?
                        if (!this.state.selectedGridId) {
                            this.openInputModal(index);
                        }
                    } else {
                        this.openInputModal(index);
                    }
                };
            } else {
                el.textContent = num;
                el.onclick = () => {
                    this.handleStripClick(index);
                };
            }

            // Usage Indicators
            const indicators = document.createElement('div');
            indicators.className = 'usage-indicators';
            // Force active class logic
            const sumDot = document.createElement('div');
            sumDot.className = status.sum ? 'usage-dot active' : 'usage-dot';
            sumDot.textContent = '+';
            const prodDot = document.createElement('div');
            prodDot.className = status.product ? 'usage-dot active' : 'usage-dot';
            prodDot.textContent = '×';

            indicators.appendChild(sumDot);
            indicators.appendChild(prodDot);
            el.appendChild(indicators);

            if (isHidden) {
                unknownEls.push(el);
            } else {
                knownEls.push(el);
            }
        });

        // Append in order: Knowns then Unknowns
        knownEls.forEach(el => this.stripContainer.appendChild(el));
        unknownEls.forEach(el => this.stripContainer.appendChild(el));
    }

    getStripValue(index) {
        if (this.state.hiddenIndices.includes(index)) {
            // It's hidden. Return guess if exists, or null.
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

    hideInputModal() {
        this.inputModal.classList.remove('visible');
        setTimeout(() => this.inputModal.classList.add('hidden'), 300);
        this.currentInputIndex = null;

        // Reset Toggle (User Request: Single Use)
        if (this.inputModeToggle) {
            this.inputModeToggle.checked = false;
        }
    }



    confirmInput() {
        if (this.currentInputIndex !== null && this.currentInputValue !== '') {
            const newVal = parseInt(this.currentInputValue);
            const idx = this.currentInputIndex;

            // Check if value changed
            if (this.state.guessedNumbers[idx] !== newVal) {
                this.state.guessedNumbers[idx] = newVal;

                // IMPORTANT: Unsolve any targets that used this index!
                this.state.gridNumbers.forEach(g => {
                    if (g.solvedIndices && g.solvedIndices.includes(idx)) {
                        this.unsolveItem(g);
                    }
                });
            }
            this.render();
        }
        this.hideInputModal();
    }

    showModal(title, msg) {
        this.modalTitle.textContent = title;
        this.modalMessage.textContent = msg;
        this.modal.classList.add('visible');
        this.modal.classList.remove('hidden');
    }

    hideModal() {
        this.modal.classList.remove('visible');
        setTimeout(() => this.modal.classList.add('hidden'), 300);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    new GamutonorGame();
});
