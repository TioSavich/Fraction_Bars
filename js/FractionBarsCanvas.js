import Bar from './Bar.js';
import Mat from './Mat.js';
import Point from './Point.js';
import CanvasState from './CanvasState.js';
import { USE_CURRENT_SELECTION, USE_LAST_SELECTION, createFraction } from './utilities.js';

export default class FractionBarsCanvas {
    constructor(canvasContext) {
        this.context = canvasContext;
        this.currentAction = '';
        this.canvasState = null;
        this.currentFill = '#FFFF66';
        this.matFill = '#888888';
        this.mouseDownLoc = null;
        this.mouseUpLoc = null;
        this.mouseLastLoc = null;

        this.bars = [];
        this.mats = [];
        this.selectedBars = [];
        this.selectedMats = [];
        this.lastSelectedBars = [];
        this.lastSelectedMats = [];
        this.unitBar = null;
        this.context.fillStyle = this.currentFill;
        this.context.font = '9pt Verdana';

        this.mUndoArray = [];
        this.mRedoArray = [];

        this.check_for_drag = false;
        this.found_a_drag = false;

        this.manualSplitPoint = null;
    }

    addBar(a_bar) {
        let b = null;
        if (a_bar === null | a_bar === undefined) {
            b = Bar.createFromMouse(this.mouseDownLoc, this.mouseUpLoc, 'bar', this.currentFill);
        } else {
            b = a_bar;
        }

        this.bars.push(b);
        this.clearSelection();
        this.updateSelectionFromState();
        this.updateCanvas(this.mouseUpLoc);
        this.refreshCanvas();
    }

    addMat() {
        const m = Mat.createFromMouse(this.mouseDownLoc, this.mouseUpLoc, 'mat', this.matFill);
        this.mats.push(m);
        this.updateCanvas(this.mouseUpLoc);
        this.refreshCanvas();
    }

    copyBars() {
        if (this.selectedBars.length > 0) {
            for (let i = this.selectedBars.length - 1; i >= 0; i--) {
                this.bars.push(this.selectedBars[i].copy(true));
                this.selectedBars[i].isSelected = false;
            }
        }
        if (this.selectedMats.length > 0) {
            for (let j = this.selectedMats.length - 1; j >= 0; j--) {
                this.mats.push(this.selectedMats[j].copy(true));
                this.selectedMats[j].isSelected = false;
            }
        }
        this.updateSelectionFromState();
    }

    breakApartBars() {
        let newBars;
        if (this.selectedBars.length > 0) {
            for (let i = 0; i < this.selectedBars.length; i++) {
                newBars = this.selectedBars[i].breakApart();
                for (let j = 0; j < newBars.length; j++) {
                    this.bars.push(newBars[j]);
                }
            }
            this.deleteSelectedBars();
        }
    }

    clearSplits() {
        if (this.selectedBars.length > 0) {
            for (let i = 0; i < this.selectedBars.length; i++) {
                this.selectedBars[i].clearSplits();
            }
        }
    }
    
    measureBars() {
        if (this.selectedBars.length > 0) {
            for (let i = this.selectedBars.length - 1; i >= 0; i--) {
                this.selectedBars[i].fraction = createFraction(this.selectedBars[i].size, this.unitBar.size);
            }
        }
    }

    clearAllMeasurements() {
        for (let i = 0; i < this.bars.length; i++) {
            this.bars[i].isUnitBar = false;
            this.bars[i].fraction = '';
        }
    }

    setUnitBar() {
        this.clearAllMeasurements();
        if (this.selectedBars.length == 1) {
            this.selectedBars[0].isUnitBar = true;
            this.selectedBars[0].fraction = '';
            this.unitBar = this.selectedBars[0];
        }
    }
    
    updateColorsOfSelectedBars() {
        if (this.selectedBars.length > 0) {
            this.addUndoState();
        }
        for (let i in this.selectedBars) {
            if (this.selectedBars[i].hasSelectedSplit()) {
                this.selectedBars[i].updateColorOfSelectedSplit(this.currentFill);
            } else {
                this.selectedBars[i].color = this.currentFill;
            }
        }
        this.refreshCanvas();
    }

    // ... (The rest of the methods will be included in the next response due to length limits)
