/*======================= AUDIO ENGINE CLASS =======================*/
export default class AudioEngine {

    webkitAudioContext = window.AudioContext || window.webkitAudioContext;
    vcaVolume;

    constructor(debug) {
        this.debug = false;
        // these are initialised in initAudioEngine, to avoid cases where audio is not allowed until the user has interacted with the page
        this.audioContext = null;
        this.masterVolume = null;
        this.vcaVolume = null;
        this.convolver = null;
        this.oscillators = []; // Array to store created oscillators
        this.lowPassFilter = null;

        this.oscillatorRunning = false;

        this.ARAttack = 0.05; // seconds
        this.ARRelease = 0.05; // seconds

        this.ADSRAttack = 0.1; // seconds
        this.ADSRDecay = 0.1; // seconds
        this.ADSRSustain = 0.1; // seconds
        this.ADSRRelease = 0.1; // seconds

        this.svg = null; // SVG element initialised in initVisualisations
        this.analyser = null; // analyser initialised in initVisualisations
        this.bufferLength = null; // buffer length initialised in initVisualisations
        this.dataArray = null; // data array initialised in initVisualisations
        this.oscilloscopeFPS = 60; // Frames per second for oscilloscope
    }

    async loadImpulseResponse(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            if (this.debug) console.log('Impulse response fetched successfully:', response);
            const arrayBuffer = await response.arrayBuffer();
            this.convolver.buffer = await this.audioContext.decodeAudioData(arrayBuffer);
            this.convolver.connect(this.masterVolume);
            if (this.debug) console.log('Impulse response loaded and convolver connected successfully.');
        } catch (error) {
            console.error('Error fetching or decoding impulse response:', error);
        }
    }

    initAudioEngine(){
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.masterVolume = this.audioContext.createGain();
        this.vcaVolume = this.audioContext.createGain();
        this.masterVolume.connect(this.audioContext.destination);
        this.masterVolume.gain.value = 0.3;
        this.convolver = this.audioContext.createConvolver();
        this.lowPassFilter = this.audioContext.createBiquadFilter();
        this.lowPassFilter.type = 'lowpass';
        this.lowPassFilter.frequency.value = 1000;
        this.lowPassFilter.Q.value = 1;
    }

    createOscillator({
                         frequency = 220,
                         waveform = "sine",
                         attack = 0.1,
                         decay = 0.2,
                         sustain = 0.7,
                         release = 0.3
                     } = {}) {
        const oscillator = this.audioContext.createOscillator();
        const vca = this.audioContext.createGain(); // Unique VCA for this oscillator
        const now = this.audioContext.currentTime;

        oscillator.type = waveform;
        oscillator.frequency.setValueAtTime(frequency, now);

        // Start the gain at 0 (silence)
        vca.gain.setValueAtTime(0, now);

        // Connect the oscillator through its own VCA, then through the rest of the audio chain
        oscillator.connect(vca);
        vca.connect(this.lowPassFilter);
        this.lowPassFilter.connect(this.convolver);
        this.convolver.connect(this.masterVolume);

        // Define the custom oscillator with an envelope
        const customOscillator = {
            oscillatorNode: oscillator,
            vcaNode: vca,
            attack,
            decay,
            sustain,
            release,
            start: (when = 0) => {
                oscillator.start(when);
            },
            stop: (when = 0) => {
                oscillator.stop(when + release);
            },
            setFrequency: (freq) => oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime),
            setGain: (value) => vca.gain.setValueAtTime(value, this.audioContext.currentTime),
            setWaveform: (waveform) => oscillator.type = waveform,
            triggerAttackRelease: () => {
                const now = this.audioContext.currentTime;
                vca.gain.cancelScheduledValues(now); // Clear any existing scheduled values
                vca.gain.setValueAtTime(0, now); // Start at 0
                vca.gain.linearRampToValueAtTime(1, now + 1); // Ramp up to sustain
                console.log(vca.gain.value);
                console.log(vca.gain.valueAtTime(now));
                console.log(vca.gain.valueAtTime(now + this.attack));
        /*        vca.gain.linearRampToValueAtTime(1, now + this.attack); // Ramp up to 1
                vca.gain.linearRampToValueAtTime(0, now + this.attack + this.release); // Ramp down to 0*/
            },
        };

        this.oscillators.push(customOscillator);

        return customOscillator;
    }

    stopAllOscillators() {
        this.oscillators.forEach(osc => osc.stop());
        this.oscillators = [];
    }

    // Example method to create and start an oscillator
    startOscillator({ frequency, waveform }) {
        const osc = this.createOscillator({ frequency, waveform });
        osc.start(0);
        if (this.debug) console.log(`Started oscillator with frequency ${frequency} and waveform ${waveform}`);
        return osc;
    }

    stopOscillator(oscillator) {
        oscillator.stop(0);
        this.oscillators = this.oscillators.filter(osc => osc !== oscillator);
        if (this.debug) console.log('Oscillator stopped');
    }

    changePitch(value) {
        if (this.oscillator) {
            this.oscillator.frequency.linearRampToValueAtTime(parseFloat(value), this.audioContext.currentTime + 0.10);
            if (this.debug) console.log('Pitch changed to:', value); // Debug log
        }
    }

    changeFilterCutoff(value) {
        this.lowPassFilter.frequency.linearRampToValueAtTime(parseFloat(value), this.audioContext.currentTime + 0.10);
        if (this.debug) console.log('Filter cutoff changed to:', value); // Debug log
    }

    changeFilterQ(value) {
        this.lowPassFilter.Q.linearRampToValueAtTime(parseFloat(value), this.audioContext.currentTime + 0.10);
        if (this.debug) console.log('Filter Q changed to:', parseFloat(value)); // Debug log
    }

    changeVolume(value) {
        this.masterVolume.gain.linearRampToValueAtTime(parseFloat(value), this.audioContext.currentTime + 0.10);
        if (this.debug) console.log('Volume changed to:', value); // Debug log
    }

    triggerAttackRelease() {
        this.vcaVolume.gain.linearRampToValueAtTime(1, this.audioContext.currentTime + this.ARAttack);
        this.vcaVolume.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + this.ARAttack + this.ARRelease);
    }

    triggerOpenVCA() {
        if (!this.oscillatorRunning) {
            this.startOscillator();
        }
        this.vcaVolume.gain.linearRampToValueAtTime(1, this.audioContext.currentTime + this.ARAttack);
    }

    triggerCloseVCA() {
        this.vcaVolume.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + this.ARAttack + this.ARRelease);
    }

    triggerCloseVCAFast() {
        this.vcaVolume.gain.linearRampToValueAtTime(0, this.audioContext.currentTime);
    }

    setWaveform(waveform) {
        this.oscillator.type = waveform;
    }

    loadOscilloscope(svgID) {
        const svg = document.getElementById(svgID);
        // if analyser is null create it and connect it to the lowpass filter
        if (this.analyser === null) {
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 4096; // Increase FFT size for smoother lines
            this.lowPassFilter.connect(this.analyser);
        }
        const fps = 60;
        const oscilloscope = new Oscilloscope(this.analyser, this.debug, svg, fps);
        oscilloscope.init();
    }

    loadSpectrogram(canvasID) {
        if (this.analyser === null) {
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 4096; // Increase FFT size for smoother lines
            this.lowPassFilter.connect(this.analyser);
        }
        const spectrogram = new Spectrogram(this.analyser, this.debug, canvasID);
        spectrogram.draw();
    }

    playSound(){
        this.triggerAttackRelease();
    }

    playSound1(){
        this.changePitch(220);
        this.triggerAttackRelease();
    }

    playSound2(){
        this.changePitch(440);
        this.triggerAttackRelease();
    }


    toggleVCA(){
        if(this.vcaVolume.gain.value === 0){
            this.triggerOpenVCA();
        }else{
            this.triggerCloseVCA();
        }
    }


}