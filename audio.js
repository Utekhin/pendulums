import Session from './session.js';

class AudioEngine {
    constructor() {
        this.audioContext = null;
        this.samples = new Array(16).fill(null);
        this.isLoaded = false;

        this.masterGainNode = null;
        this.activeSources = [];
        this.MAX_SIMULTANEOUS_SOUNDS = 4;

        this.sessionID = Session.getSessionID(); // Retrieve session ID
        console.log('Session ID for AudioEngine:', this.sessionID);
    }

    async load() {
        if (this.audioContext == null) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGainNode = this.audioContext.createGain();
            this.masterGainNode.connect(this.audioContext.destination);
            this.masterGainNode.gain.setValueAtTime(0.5, this.audioContext.currentTime);
        }

        if (this.isLoaded) return;

        console.log('AudioEngine loadSamples called');
        const loadPromises = Array.from({ length: 16 }, async (_, i) => {
            const path = `/samples/${(i + 1).toString().padStart(2, '0')}.mp3?session=${this.sessionID}`;
            try {
                const response = await fetch(path, { method: 'GET' });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const arrayBuffer = await response.arrayBuffer();
                const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

                this.normalizeSample(audioBuffer);
                this.samples[i] = audioBuffer;
                console.log(`Sample ${i + 1} loaded`);
            } catch (error) {
                console.error(`Error loading sample ${i + 1}:`, error);
            }
        });

        await Promise.all(loadPromises);
        this.isLoaded = true;
    }

    normalizeSample(audioBuffer) {
        const channelData = audioBuffer.getChannelData(0);
        let maxAmplitude = 0;

        for (let i = 0; i < channelData.length; i++) {
            maxAmplitude = Math.max(maxAmplitude, Math.abs(channelData[i]));
        }

        if (maxAmplitude > 0.5) {
            const scaleFactor = 0.5 / maxAmplitude;
            for (let i = 0; i < channelData.length; i++) {
                channelData[i] *= scaleFactor;
            }
        }
    }

    async play(sound, options = {}) {
        await this.load();

        this._cleanupSources();
        if (this.activeSources.length >= this.MAX_SIMULTANEOUS_SOUNDS) {
            const oldestSource = this.activeSources.shift();
            oldestSource.stop();
        }

        const index = Number(sound.slice(-6, -4)) - 1;
        if (index >= 0 && index < 16) {
            this.playSound(index, options.position || 0);
        }
    }

    playSound(sampleIndex, position = 0) {
        if (!this.audioContext || !this.samples[sampleIndex]) return;

        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        const pannerNode = this.audioContext.createStereoPanner();

        source.buffer = this.samples[sampleIndex];
        gainNode.gain.setValueAtTime(0.5, this.audioContext.currentTime);
        pannerNode.pan.setValueAtTime(position, this.audioContext.currentTime);

        source.connect(gainNode);
        gainNode.connect(pannerNode);
        pannerNode.connect(this.masterGainNode);

        source.start(0);
        this.activeSources.push(source);

        source.onended = () => {
            this.activeSources = this.activeSources.filter(s => s !== source);
        };
    }

    _cleanupSources() {
        this.activeSources = this.activeSources.filter(source => 
            source.playbackState !== source.FINISHED_STATE
        );
    }
}

export default AudioEngine;
