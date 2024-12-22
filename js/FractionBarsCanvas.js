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
            // Add cases for other tools if needed
        }
    }

    drawRect(p1, p2) {
        this.context.fillStyle = (this.currentAction === "bar") ? this.currentFill : this.matFill;
        const w = Math.abs(p2.x - p1.x);
        const h = Math.abs(p2.y - p1.y);
        const p = Point.min(p1, p2);
        this.context.fillRect(p.x + 0.5, p.y + 0.5, w, h);
        this.context.strokeRect(p.x + 0.5, p.y + 0.5, w, h);
    }

// ... (previous methods from last two responses)
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
        this.context.fillText(b.label, b.x + 5, b.y + b.h - 5);

        this.context.fillStyle = this.currentFill;

    }

    drawMat(b) {

        this.context.fillStyle = b.color;
        this.context.fillRect(b.x + 0.5, b.y + 0.5, b.w, b.h);

        this.context.strokeStyle = '#FF0000';

        this.context.strokeStyle = '#000000';
        if (b.isSelected) {
            this.context.lineWidth = 2.5;
        }

        this.context.strokeRect(b.x + 0.5, b.y + 0.5, b.w, b.h);

        this.context.lineWidth = 1;
        this.context.fillStyle = '#000000';

        this.context.fillStyle = this.currentFill;

    }

    updateCanvas(currentMouseLoc) {
        if ((this.currentAction === 'bar') || (this.currentAction === 'mat')) {
            if (this.canvasState !== null) {
                this.context.putImageData(this.canvasState, 0, 0);
            }
            if (this.mouseDownLoc !== null) {
                this.drawRect(this.mouseDownLoc, currentMouseLoc);
            }
        } else if (this.currentAction == "manualSplit") {
            this.manualSplitPoint = currentMouseLoc;
        } else {
            this.drag(currentMouseLoc);
        }
    }

    saveCanvas() {
        this.canvasState = this.context.getImageData(0, 0, 1000, 600);
    }

    refreshCanvas() {
        this.context.clearRect(0, 0, 1000, 600);
        for (let i = 0; i < this.mats.length; i++) {
            this.drawMat(this.mats[i]);
        }
        for (let i = 0; i < this.bars.length; i++) {
            this.drawBar(this.bars[i]);
        }
    }

    setFillColor(fillColor) {
        this.currentFill = fillColor;
        this.context.fillStyle = this.currentFill;
    }

    clearMouse() {
        this.mouseDownLoc = null;
        this.mouseUpLoc = null;
    }

    
    drag(currentLoc) {
        if (this.mouseLastLoc === null || typeof (this.mouseLastLoc) == 'undefined') {
            this.mouseLastLoc = this.mouseDownLoc;
        }

        for (let i = 0; i < this.selectedBars.length; i++) {
            this.selectedBars[i].x = this.selectedBars[i].x + currentLoc.x - this.mouseLastLoc.x;
            this.selectedBars[i].y = this.selectedBars[i].y + currentLoc.y - this.mouseLastLoc.y;
        }

        for (let i = 0; i < this.selectedMats.length; i++) {
            this.selectedMats[i].x = this.selectedMats[i].x + currentLoc.x - this.mouseLastLoc.x;
            this.selectedMats[i].y = this.selectedMats[i].y + currentLoc.y - this.mouseLastLoc.y;
        }

        if (this.check_for_drag) {
            this.found_a_drag = true;
            this.check_for_drag = false;
        }

        this.mouseLastLoc = currentLoc;
        this.refreshCanvas();
    }

    addUndoState() {
        const newState = new CanvasState(this);
        newState.grabBarsAndMats();
        this.mUndoArray.push(newState);
        while (this.mUndoArray.length > 100) {
            this.mUndoArray.shift();
        }
        this.mRedoArray = [];
    }

    cacheUndoState() {
        this.CachedState = new CanvasState(this);
        this.CachedState.grabBarsAndMats();
    }

    finalizeCachedUndoState() {
        if (this.CachedState !== null) {
            this.mUndoArray.push(this.CachedState);
            while (this.mUndoArray.length > 100) {
                this.mUndoArray.shift();
            }
            this.mRedoArray = [];
        }
        this.check_for_drag = false;
        this.found_a_drag = false;
    }

    undo() {
        if (this.mUndoArray.length > 0) {
            const newState = new CanvasState(this);
            newState.grabBarsAndMats();
            this.mRedoArray.push(newState);
            this.restoreAState(this.mUndoArray.pop());
        }
    }

    redo() {
        if (this.mRedoArray.length > 0) {
            const newState = new CanvasState(this);
            newState.grabBarsAndMats();
            this.mUndoArray.push(newState);
            this.restoreAState(this.mRedoArray.pop());
        }
    }

    restoreAState(a_new_state) {
        this.bars = [];
        this.mats = [];
        this.selectedBars = [];
        this.selectedMats = [];

        while (a_new_state.mBars.length > 0) {
            let temp_bar = a_new_state.mBars.shift();
            this.bars.push(temp_bar);
        }

        while (a_new_state.mMats.length > 0) {
            this.mats.push(a_new_state.mMats.shift());
        }

        this.unitBar = a_new_state.mUnitBar;
        if (this.unitBar !== null) {
            this.unitBar.isUnitBar = true;
            this.unitBar.fraction = '1/1';
        }
        this.clearSelection();
    }

    save() {
        const newState = new CanvasState(this);
        newState.grabBarsAndMats();
        newState.mFBCanvas = null;

        const state_string = JSON.stringify(JSON.decycle(newState));

        try {
            const blob = new Blob([state_string], { type: "text/plain;charset=utf-8" });
            window.saveAs(blob, "FractionBarsSave.txt");
        } catch (e) {
            alert("This browser does not support saving state locally.");
        }
    }

    openFileDialog() {
        // Show dialog
        //$( "#dialog-file" ).dialog('open');
        document.getElementById("files").click();
    }

    handleFileEvent(file_event) {
        const file_contents = file_event.target.result;
        let text_state = "";
        let something = null;

        try {
            text_state = file_contents.replace(/(\r\n|\n|\r)/gm, "");
            something = JSON.retrocycle(JSON.parse(text_state));
        } catch (e) {
            alert("An error has occurred. \n\n" + "Fraction Bars cannot open this file. \n\n" + e.message);
            return;
        }

        this.restoreBarsAndMatsFromJSON(something);
    }

    restoreBarsAndMatsFromJSON(JSON_obj) {
        this.bars = [];
        this.mats = [];
        this.selectedBars = [];
        this.selectedMats = [];
        this.unitBar = null;
        let len = 0;

        if (JSON_obj.mBars.length > 0) {
            for (let i = 0; i < JSON_obj.mBars.length; i++) {
                len = this.bars.push(Bar.copyFromJSON(JSON_obj.mBars[i]));
                if (this.bars[len - 1].isUnitBar) {
                    this.unitBar = this.bars[len - 1];
                    this.bars[len - 1].fraction = "1/1";
                }
            }
        }
        if (JSON_obj.mMats.length > 0) {
            for (let j = 0; j < JSON_obj.mMats.length; j++) {
                this.mats.push(Mat.copyFromJSON(JSON_obj.mMats[j]));
            }
        }

        const hiddenButtonsName1 = JSON_obj.mHidden.slice(0);
        for (let ii = 0; ii < hiddenButtonsName1.length; ii++) {
            if (hiddenButtonsName.indexOf(hiddenButtonsName1[ii]) < 0) {
                const hidden = document.getElementById(hiddenButtonsName1[ii]);

                $(hidden).hide();
                hiddenButtonsName.push(hiddenButtonsName1[ii]);
                hiddenButtons.push($(hidden));
            }
        }

        this.clearSelection();
        this.refreshCanvas();
    }

    print_canvas() {
        const canvas = document.getElementById("fbCanvas");
        const win = window.open();
        win.document.write("<html><br><img src='" + canvas.toDataURL() + "'/></html>");
        win.document.close();
        win.focus();
        win.print();
        win.close();
    }
}
