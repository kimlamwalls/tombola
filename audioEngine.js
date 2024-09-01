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
        this.oscillator = null;
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
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)(); // Create an audio context
        this.masterVolume = this.audioContext.createGain(); // Create a master volume node
        //create vca volume node
        this.vcaVolume = this.audioContext.createGain();
        this.masterVolume.connect(this.audioContext.destination); // Connect master volume to the audio context's destination
        this.masterVolume.gain.value = 0.3;
        this.convolver = this.audioContext.createConvolver();
        this.lowPassFilter = this.audioContext.createBiquadFilter();
        this.lowPassFilter.type = 'lowpass';
        this.lowPassFilter.frequency.value = 1000;
        this.lowPassFilter.Q.value = 1;
    }

    startOscillator() {
        if (this.oscillator) {
            this.oscillator.stop(0);
            this.oscillator.disconnect();
        }
        this.oscillator = this.audioContext.createOscillator();
        this.oscillator.frequency.setValueAtTime(220, this.audioContext.currentTime);
        this.oscillator.connect(this.vcaVolume);
        this.vcaVolume.connect(this.lowPassFilter);
        this.lowPassFilter.connect(this.convolver);
        this.setWaveform("sawtooth");
        this.oscillator.start(0);
        this.oscillatorRunning = true;
        if (this.debug) console.log('Oscillator started'); // Debug log
        // Ensure the audio context is not suspended
    }

    stopOscillator() {
        if (this.oscillator) {
            this.oscillator.stop(0);
            this.oscillator.disconnect();
            this.oscillatorRunning = false;
            if (this.debug) console.log('Oscillator stopped'); // Debug log
        }
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