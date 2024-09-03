export class PitchQuantizer {
    constructor(debug) {
        this.debug = debug;
        this.A4 = 440;
        this.noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
        this.noteNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
        this.semitones = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
        this.octaves = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
        this.notes = []; // Array of note objects
        this.scale = "major"


        // Load and calculate default notes
        for (let i = 0; i < 120; i++) {
            const noteName = this.noteNames[i % 12];
            const noteNumber = this.noteNumbers[i % 12];
            const octave = Math.floor(i / 12);
            const frequency = this.A4 * Math.pow(2, (i - 57) / 12); // A4 is the 57th note in the sequence
            this.notes.push(new Note(noteName, noteNumber, octave, frequency));
        }
        this.setScale(this.scale);
        if (this.debug) console.log(this.notes);
    }

    nearestSemitone(Hz) {
        for (let i = 0; i < this.notes.length; i++) {
            if (this.notes[i].frequency <= Hz && this.notes[i + 1].frequency > Hz) {
                return this.notes[i];
            }
        }
    }

    setScale(scale) {
        if (scale === "major") {
            // Remove note objects with sharps
            if (this.debug) console.log("Removing sharps");
            //log which notes are sharps
            if (this.debug) console.log(this.notes.filter(note => note.letterName.includes("#")));
            
            this.notes = this.notes.filter(note => !note.letterName.includes("#"));
        }
    }

}

export class Note {
    constructor(letterName, number, octave, frequency) {
        this.letterName = letterName;
        this.number = number;
        this.octave = octave;
        this.frequency = frequency;
    }
}
