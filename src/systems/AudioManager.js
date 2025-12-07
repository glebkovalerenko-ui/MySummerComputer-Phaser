import Phaser from 'phaser';

export default class AudioManager {
    constructor(scene) {
        this.scene = scene;
        // Используем нативный AudioContext для синтеза
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();
        
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.3; // Громкость 30%
        this.masterGain.connect(this.ctx.destination);
    }

    /**
     * Короткий клик для UI
     */
    playUiClick() {
        this._playTone(600, 'square', 0.05, 0.05);
    }

    /**
     * Низкий клик для наведения
     */
    playUiHover() {
        this._playTone(300, 'sine', 0.02, 0.02, 0.1);
    }

    /**
     * Звук установки детали (удар)
     */
    playSnap() {
        this._playNoise(0.1); // Щелчок шума
        this._playTone(150, 'sawtooth', 0.01, 0.1); // Низкий удар
    }

    /**
     * Звук закручивания винта (механический вжик)
     */
    playScrew() {
        // Быстрая смена частоты для имитации мотора/трения
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(50, this.ctx.currentTime + 0.1);
        
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.15);
    }

    /**
     * Звук получения денег (звон монет)
     */
    playCash() {
        // Два высоких тона
        this._playTone(1200, 'sine', 0.05, 0.1);
        setTimeout(() => {
            this._playTone(1600, 'sine', 0.05, 0.2);
        }, 100);
    }

    /**
     * Успешная загрузка (BIOS POST beep)
     */
    playBootSuccess() {
        this._playTone(800, 'square', 0.1, 0.2); // Одиночный пик
    }

    /**
     * Ошибка загрузки
     */
    playBootError() {
        // Три коротких низких пика
        const now = this.ctx.currentTime;
        [0, 0.15, 0.3].forEach(delay => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.value = 150;
            gain.gain.value = 0.3;
            gain.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.1);
            
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(now + delay);
            osc.stop(now + delay + 0.15);
        });
    }

    /**
     * Внутренний хелпер для простых тонов
     */
    _playTone(freq, type, attack, decay, vol = 0.5) {
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.value = freq;

        const now = this.ctx.currentTime;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(vol, now + attack);
        gain.gain.exponentialRampToValueAtTime(0.01, now + attack + decay);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + attack + decay + 0.1);
    }

    /**
     * Внутренний хелпер для шума (White Noise)
     */
    _playNoise(duration) {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const gain = this.ctx.createGain();
        gain.gain.value = 0.1;
        
        noise.connect(gain);
        gain.connect(this.masterGain);
        noise.start();
    }
}