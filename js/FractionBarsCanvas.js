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
        this.hiddenButtonsName = [];
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

    editLabel() {
        const canvasPos = $('#fbCanvas').position();
        if (this.selectedBars.length == 1) {
            const labelDiv = $('#labelInput');
            $('#labelInput').css('position', 'absolute');
            $('#labelInput').css('width', this.selectedBars[0].w - 13);

            $('#labelInput').css('top', canvasPos.top + this.selectedBars[0].y + this.selectedBars[0].h - labelDiv.outerHeight() - 4);
            $('#labelInput').css('left', canvasPos.left + this.selectedBars[0].x + 5);
            $('#labelInput').val(this.selectedBars[0].label);

            $('#labelInput').show();
            $('#labelInput').focus();

        }
    }

    hideEditLabel() {
        $('#labelInput').hide();
    }

    saveLabel(labelText, selectionType) {
        let barSelection = [];
        if (selectionType == USE_CURRENT_SELECTION) {
            barSelection = this.selectedBars;
        } else {
            barSelection = this.lastSelectedBars;
        }

        if (barSelection.length == 1) {
            barSelection[0].label = labelText;
        }
        this.lastSelectedBars = [];
        this.refreshCanvas();
    }

    deleteSelectedBars() {
        let newBars = [];
        let unitBarDeleted = false;

        for (let i = 0; i < this.bars.length; i++) {
            if (!this.bars[i].isSelected) {
                newBars.push(this.bars[i]);
            } else {
                if (this.bars[i].isUnitBar) {
                    unitBarDeleted = true;
                }
            }
        }
        this.bars = newBars;
        if (unitBarDeleted) {
            this.clearAllMeasurements();
        }
        let newMats = [];
        for (let i = 0; i < this.mats.length; i++) {
            if (!this.mats[i].isSelected) {
                newMats.push(this.mats[i]);
            }
        }
        this.mats = newMats;
    }

    updateSelectionFromState() {
        this.selectedBars = [];
        for (let i = 0; i < this.bars.length; i++) {
            if (this.bars[i].isSelected) {
                this.selectedBars.push(this.bars[i]);
            }
        }
        this.selectedMats = [];
        for (let i = 0; i < this.mats.length; i++) {
            if (this.mats[i].isSelected) {
                this.selectedMats.push(this.mats[i]);
            }
        }
    }

    findBarForPoint(p) {
        for (let i = this.bars.length - 1; i >= 0; i--) {
            if (p.x > this.bars[i].x &&
                p.x < this.bars[i].x + this.bars[i].w &&
                p.y > this.bars[i].y &&
                p.y < this.bars[i].y + this.bars[i].h) {

                return (this.bars[i]);
            }
        }
        return null;
    }

    findSplitForPoint(p) {
        const the_bar = this.findBarForPoint(p);
        if (the_bar !== null) {
            return (the_bar.findSplitForPoint(p));
        } else {
            return (null);
        }
    }

    barClickedOn() {
        for (let i = this.bars.length - 1; i >= 0; i--) {
            if (this.mouseDownLoc.x > this.bars[i].x &&
                this.mouseDownLoc.x < this.bars[i].x + this.bars[i].w &&
                this.mouseDownLoc.y > this.bars[i].y &&
                this.mouseDownLoc.y < this.bars[i].y + this.bars[i].h) {
                if (this.currentAction == "manualSplit") {
                    this.addUndoState();
                    this.bars[i].splitBarAtPoint(this.mouseDownLoc, flag[1]);
                } else {
                    this.bars[i].selectSplit(this.mouseDownLoc);
                }
                return this.bars[i];
            }
        }
        return null;
    }

    barToFront(bar) {
        const newList = this.bars.filter(b => b !== bar);
        newList.push(bar);
        this.bars = newList;
    }

    matClickedOn() {
        for (let i = this.mats.length - 1; i >= 0; i--) {
            if (this.mouseDownLoc.x > this.mats[i].x &&
                this.mouseDownLoc.x < this.mats[i].x + this.mats[i].w &&
                this.mouseDownLoc.y > this.mats[i].y &&
                this.mouseDownLoc.y < this.mats[i].y + this.mats[i].h) {
                return this.mats[i];
            }
        }
        return null;
    }

    clearSelection() {
        this.bars.forEach(bar => {
            bar.isSelected = false;
            bar.clearSplitSelection();
        });
        this.lastSelectedBars = this.selectedBars;
        this.selectedBars = [];

        this.mats.forEach(mat => {
            mat.isSelected = false;
        });
        this.lastSelectedMats = this.selectedMats;
        this.selectedMats = [];
    }

    removeBarFromSelection(bar) {
        const newList = this.selectedBars.filter(b => b !== bar);
        this.selectedBars = newList;
        bar.isSelected = false;
        bar.clearSplitSelection();
    }

    removeMatFromSelection(mat) {
        const newList = this.selectedMats.filter(m => m !== mat);
        this.selectedMats = newList;
        mat.isSelected = false;
    }

    joinSelected() {
        if (this.selectedBars.length !== 2 || this.selectedMats.length > 0) {
            alert("Please select exactly two bars (and no mats) before attempting to Join.");
            return;
        }
        const success = this.selectedBars[0].join(this.selectedBars[1]);
        if (success) {
            this.selectedBars[0].isSelected = false;
            this.deleteSelectedBars();
            this.updateSelectionFromState();
        }
    }

    setupBarRepeats() {
        for (let i = this.bars.length - 1; i >= 0; i--) {
            this.bars[i].setRepeatUnit();
        }
    }

    unsetBarRepeats() {
        for (let i = this.bars.length - 1; i >= 0; i--) {
            this.bars[i].repeatUnit = null;
        }
    }
    
    clear_selection_button() {
        this.clearMouse();
        this.clearSelection();
        $("[id^='tool_']").removeClass('toolSelected');
        this.currentAction = '';
    }

    handleToolUpdate(toolName, tool_on) {
        switch (toolName) {
            case 'repeat':
                if (tool_on) {
                    this.setupBarRepeats();
                } else {
                    this.unsetBarRepeats();
                }
                break;
        }
    }

    drawPreviewRect(p1, p2) {
        this.context.fillStyle = (this.currentAction === "bar") ?
            this.currentFill : this.matFill;
        const w = Math.abs(p2.x - p1.x);
        const h = Math.abs(p2.y - p1.y);
        const p = Point.min(p1, p2);
        this.context.fillRect(p.x + 0.5, p.y + 0.5, w, h);
        this.context.strokeRect(p.x + 0.5, p.y + 0.5, w, h);
    }

    drawBar(b) {
        this.context.fillStyle = b.color;
        this.context.fillRect(b.x + 0.5, b.y + 0.5, b.w, b.h);

        this.context.strokeStyle = '#FF0000';
        if (b.splits.length > 0) {
            for (let i = 0; i < b.splits.length; i++) {
                this.context.fillStyle = b.splits[i].color;
                this.context.fillRect(b.x + b.splits[i].x + 0.5, b.y + b.splits[i].y + 0.5, b.splits[i].w, b.splits[i].h);
                this.context.strokeRect(b.x + b.splits[i].x + 0.5, b.y + b.splits[i].y + 0.5, b.splits[i].w, b.splits[i].h);
                if (b.splits[i].isSelected === true) {
                    const xcenter = b.splits[i].x + (b.splits[i].w / 2);
                    const ycenter = b.splits[i].y + (b.splits[i].h / 2);
                    this.context.strokeRect(b.x + xcenter - 2, b.y + ycenter - 2, 4, 4);
                }
            }
        }

        this.context.fillStyle = b.color;
        this.context.strokeStyle = '#000000';
        if (b.isSelected) {
            this.context.lineWidth = 2.5;
        }

        this.context.strokeRect(b.x + 0.5, b.y + 0.5, b.w, b.h);

        this.context.lineWidth = 1;
        this.context.fillStyle = '#000000';

        if (b.isUnitBar) {
            this.context.fillText('Unit Bar', b.x, b.y + b.h + 15);
        }

        if (this.manualSplitPoint !== null) {
            const asplit = this.findSplitForPoint(this.manualSplitPoint);
            const abar = this.findBarForPoint(this.manualSplitPoint);
            let x_offset = 0;
            let y_offset = 0;
            let thing = null;
            if (asplit !== null) {
                x_offset = abar.x;
                y_offset = abar.y;
                thing = asplit;
            } else {
                thing = abar;
            }

            if ((thing !== null) && !((asplit === null) && (abar !== null) && (abar.splits.length !== 0))) {
                const savestroke = this.context.strokeStyle;
                this.context.strokeStyle = '#FF0000';

                if (!flag[1]) {
                    this.context.strokeRect(thing.x + x_offset, this.manualSplitPoint.y, thing.w, 0);
                } else {
                    this.context.strokeRect(this.manualSplitPoint.x, thing.y + y_offset, 0, thing.h);
                }
                this.context.strokeStyle = savestroke;
            }
        }

        const fractionStringMetrics = this.context.measureText(b.fraction);
        this.context.fillText(b.fraction, b.x + b.w - fractionStringMetrics.width - 5, b.y - 5);

        const labelStringMetrics = this.context.measureText(b.label);
        this.context.fillText(b.label, b.x + 5, b.y + b.h -5);

        if (b.repeatUnit !== null) {
            this.context.strokeStyle = '#0000FF';
            this.context.strokeRect(b.x + 0.5, b.y + 0.5, b.w, b.h);
            this.context.strokeStyle = '#000000';
        }
    }

    drawMat(m) {
        this.context.fillStyle = m.color;
        this.context.fillRect(m.x + 0.5, m.y + 0.5, m.w, m.h);
        this.context.strokeStyle = '#000000';
        if (m.isSelected) {
            this.context.lineWidth = 2.5;
        }
        this.context.strokeRect(m.x + 0.5, m.y + 0.5, m.w, m.h);
        this.context.lineWidth = 1;
    }

    refreshCanvas() {
        this.context.clearRect(0, 0, $('#fbCanvas').width(), $('#fbCanvas').height());
        for (let i = 0; i < this.mats.length; i++) {
            this.drawMat(this.mats[i]);
        }
        for (let i = 0; i < this.bars.length; i++) {
            this.drawBar(this.bars[i]);
        }
    }

    updateCanvas(loc) {
        switch (this.currentAction) {
            case 'bar':
                this.addBar();
                break;

            case 'mat':
                this.addMat();
                break;

            case 'select':
                this.selectTool(loc);
                break;

            case 'move':
                this.moveTool(loc);
                break;

            case 'erase':
                this.eraseTool(loc);
                break;

            case 'copy':
                this.copyTool(loc);
                break;
        }
    }

    selectTool(loc) {
        const theBar = this.findBarForPoint(loc);
        if (theBar !== null) {
            if (theBar.isSelected) {
                this.removeBarFromSelection(theBar);
            } else {
                if (!Utilities.shiftKeyDown) {
                    this.clearSelection();
                }
                this.selectedBars.push(theBar);
                theBar.setSelected(true);
            }
        } else {
            const theMat = this.matClickedOn();
            if (theMat !== null) {
                if (theMat.isSelected) {
                    this.removeMatFromSelection(theMat);
                } else {
                    if (!Utilities.shiftKeyDown) {
                        this.clearSelection();
                    }
                    this.selectedMats.push(theMat);
                    theMat.setSelected(true);
                }
            } else {
                if (!Utilities.shiftKeyDown) {
                    this.clearSelection();
                }
            }
        }
        this.refreshCanvas();
    }

    moveTool(loc) {
        if (this.selectedBars.length > 0) {
            this.found_a_drag = true;
            const deltaX = loc.x - this.mouseLastLoc.x;
            const deltaY = loc.y - this.mouseLastLoc.y;
            for (let i = 0; i < this.selectedBars.length; i++) {
                this.selectedBars[i].moveBar(deltaX, deltaY);
            }
        }
        if (this.selectedMats.length > 0) {
            this.found_a_drag = true;
            const deltaX = loc.x - this.mouseLastLoc.x;
            const deltaY = loc.y - this.mouseLastLoc.y;
            for (let i = 0; i < this.selectedMats.length; i++) {
                this.selectedMats[i].moveMat(deltaX, deltaY);
            }
        }
        this.refreshCanvas();
    }

    eraseTool(loc) {
        const theBar = this.findBarForPoint(loc);
        if (theBar !== null) {
            this.removeBarFromSelection(theBar);
            this.deleteSelectedBars();
        } else {
            const theMat = this.matClickedOn();
            if (theMat !== null) {
                this.removeMatFromSelection(theMat);
                this.deleteSelectedBars();
            }
        }
        this.refreshCanvas();
    }

    copyTool(loc) {
        this.copyBars();
        this.moveTool(loc);
        this.currentAction = 'move';
    }

    clearMouse() {
        this.mouseDownLoc = null;
        this.mouseUpLoc = null;
        this.mouseLastLoc = null;
    }

    addUndoState() {
        this.canvasState = new CanvasState(this.bars, this.mats, this.currentFill, this.matFill, this.hiddenButtonsName);
        this.mUndoArray.push(this.canvasState);
        this.mRedoArray = [];
        $('#undo').prop('disabled', false);
        $('#redo').prop('disabled', true);
    }

    undo() {
        if (this.mUndoArray.length > 0) {
            this.canvasState = this.mUndoArray.pop();
            this.mRedoArray.push(this.canvasState);
            this.restoreBarsAndMatsFromJSON(this.canvasState);
            $('#redo').prop('disabled', false);
            if (this.mUndoArray.length === 0) {
                $('#undo').prop('disabled', true);
            }
        }
    }

    redo() {
        if (this.mRedoArray.length > 0) {
            this.canvasState = this.mRedoArray.pop();
            this.mUndoArray.push(this.canvasState);
            this.restoreBarsAndMatsFromJSON(this.canvasState);
            $('#undo').prop('disabled', false);
            if (this.mRedoArray.length === 0) {
                $('#redo').prop('disabled', true);
            }
        }
    }

    restoreBarsAndMatsFromJSON(JSON_obj) {
        this.bars = [];
        this.mats = [];
        this.selectedBars = [];
        this.selectedMats = [];

        for (let i = 0; i < JSON_obj.b.length; i++) {
            const newBar = new Bar();
            newBar.restoreFromJSON(JSON_obj.b[i]);
            this.bars.push(newBar);
            if (newBar.isUnitBar) {
                this.unitBar = newBar;
            }
        }

        for (let i = 0; i < JSON_obj.m.length; i++) {
            const newMat = new Mat();
            newMat.restoreFromJSON(JSON_obj.m[i]);
            this.mats.push(newMat);
        }

        this.currentFill = JSON_obj.cf;
        this.matFill = JSON_obj.mf;
        this.hiddenButtonsName = JSON_obj.mHidden.slice(0);
        for (let ii = 0; ii < this.hiddenButtonsName.length; ii++) {
            if (hiddenButtonsName.indexOf(this.hiddenButtonsName[ii]) < 0) {
                const hidden = document.getElementById(this.hiddenButtonsName[ii]);
                $(hidden).hide();
                hiddenButtonsName.push(this.hiddenButtonsName[ii]);
            }
        }

        this.updateSelectionFromState();
        this.refreshCanvas();
    }

    setMouseDownLoc(loc) {
        this.mouseDownLoc = loc;
        this.mouseLastLoc = loc;
        if (this.currentAction == "select") {
            this.check_for_drag = true;
            this.found_a_drag = false;
        }
    }

    setMouseUpLoc(loc) {
        this.mouseUpLoc = loc;
        if (this.currentAction !== "move") {
            this.updateCanvas(this.mouseUpLoc);
        }
        if ((this.currentAction == "select") && (!this.found_a_drag)) {
            this.barClickedOn();
        }
        this.refreshCanvas();
        this.clearMouse();
    }

    setMouseMoveLoc(loc) {
        if (this.mouseDownLoc !== null) {
            this.updateCanvas(loc);
        } else {
            if (getMarkedIterateFlag() === true) {
                this.manualSplitPoint = loc;
                this.refreshCanvas();
            }
        }
        this.mouseLastLoc = loc;
    }
}
