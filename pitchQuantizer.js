export class PitchQuantizer {
    constructor(debug) {
        this.debug = debug;
        this.A4 = 440;
        this.noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
        this.noteNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
        this.semitones = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
        this.octaves = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
        this.notes = []; // Array of note objects
        this.scale = "pentatonic" // hard code scale for now


        // Load and calculate default notes
        for (let i = 0; i < 88; i++) { // 88 notes for a standard piano
            const noteNumber = i % 12;
            const octave = Math.floor(i / 12) - 1; // Adjust octave to start from 0
            const frequency = this.A4 * Math.pow(2, (i - 49) / 12); // Frequency calculation
            const letterName = this.noteNames[noteNumber];
            this.notes.push(new Note(letterName, noteNumber, octave, frequency));
        }

        this.setScale(this.scale);
        if (this.debug) console.log(this.notes);
    }

    nearestSemitone(Hz) {

        // Check if there are notes available
        if (this.notes.length === 0) {
            console.error('No notes available.');
            return null;
        }

        // Initialize variables
        let closestNoteSoFar = this.notes[0];
        let closestDistance = Math.abs(Hz - closestNoteSoFar.frequency);

        // Iterate through each note in the array
        for (let i = 1; i < this.notes.length; i++) {
            let currentNote = this.notes[i];
            let distanceAway = Math.abs(Hz - currentNote.frequency);

            // Update closest note if current distance is smaller
            if (distanceAway < closestDistance) {
                closestNoteSoFar = currentNote;
                closestDistance = distanceAway;
            }
        }

        // Return the closest note
        return closestNoteSoFar;
    }

    setScale(scale) {

        let allowedNotes = this.noteNames;

        if (scale === "major") {
            if (this.debug) console.log("Setting to Major");
            // allowed notes for major scale
            allowedNotes = ["C", "D", "E", "F", "G", "A", "B"];
            this.notes = this.notes.filter(note => !note.letterName.includes("#"));
        }
        
        if (scale === "pentatonic") {
            if (this.debug) console.log("scale set to pentatonic");
            allowedNotes = ["C", "D", "E", "G", "A"];
        }

        //remove notes that aren't in the scale
        this.notes = this.notes.filter(note => allowedNotes.includes(note.letterName));

    }

}

export class Note {
    constructor(letterName, number, octave, frequency) {
        this.letterName = letterName;
        this.number = number;
        this.octave = octave;
        this.frequency = frequency;
        this.color = "#000000";
    }
}
