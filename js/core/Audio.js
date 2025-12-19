export class AudioController {
    constructor() {
        this.ctx = null;
        this.enabled = true;
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

        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        switch (type) {
            case 'click':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(800, t);
                gain.gain.setValueAtTime(0.3, t);
                osc.start(t);
                osc.stop(t + 0.05);
                break;
            case 'select':
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(400, t);
                gain.gain.setValueAtTime(0.3, t);
                osc.start(t);
                osc.stop(t + 0.1);
                break;
            case 'success':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(400, t);
                osc.frequency.exponentialRampToValueAtTime(800, t + 0.1);
                gain.gain.setValueAtTime(0.5, t);
                gain.gain.linearRampToValueAtTime(0, t + 0.3);
                osc.start(t);
                osc.stop(t + 0.3);
                break;
            case 'error':
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(150, t);
                osc.frequency.linearRampToValueAtTime(100, t + 0.2);
                gain.gain.setValueAtTime(0.4, t);
                gain.gain.linearRampToValueAtTime(0, t + 0.2);
                osc.start(t);
                osc.stop(t + 0.2);
                break;
            case 'unsolve':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(300, t);
                gain.gain.setValueAtTime(0.4, t);
                gain.gain.linearRampToValueAtTime(0, t + 0.2);
                osc.start(t);
                osc.stop(t + 0.2);
                break;
            case 'win':
                this.playNote(523.25, t, 0.1);
                this.playNote(659.25, t + 0.1, 0.1);
                this.playNote(783.99, t + 0.2, 0.2);
                this.playNote(1046.50, t + 0.4, 0.4);
                break;
        }
    }

    playNote(freq, time, dur) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.frequency.setValueAtTime(freq, time);
        gain.gain.setValueAtTime(0.5, time);
        gain.gain.linearRampToValueAtTime(0, time + dur);
        osc.start(time);
        osc.stop(time + dur);
    }
}
