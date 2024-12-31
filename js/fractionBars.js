import { flag, USE_CURRENT_SELECTION, USE_LAST_SELECTION, getMarkedIterateFlag } from './utilities.js';
import Bar from './Bar.js';
import Mat from './Mat.js';
import Point from './Point.js';

export default class FractionBars {
    constructor() {
        this.fbCanvasObj = null;
        this.fbCanvas = $('#fbCanvas');
        this.initializeCanvas();
        this.splitsWidget = new SplitsWidget();
    }

    initializeCanvas() {
        const fbContext = this.fbCanvas.get(0).getContext('2d');
        this.fbCanvasObj = new FractionBarsCanvas(fbContext);
        this.fbCanvas.bind('mousedown', (event) => this.handleMouseDown(event));
        this.fbCanvas.bind('mouseup', (event) => this.handleMouseUp(event));
        this.fbCanvas.bind('mousemove', (event) => this.handleMouseMove(event));
    }

    handleMouseDown(e) {
        if (this.fbCanvasObj.currentAction !== '') {
            const mouseLoc = this.getCanvasMouseLocation(e);
            this.fbCanvasObj.setMouseDownLoc(mouseLoc);
            if (this.fbCanvasObj.currentAction == "manualSplit") {
                const b = this.fbCanvasObj.barClickedOn();
                if (b !== null) {
                    this.handleBarClick(b);
                }
            }

            if (this.fbCanvasObj.currentAction == "select") {
                const b = this.fbCanvasObj.barClickedOn();
                if (b !== null) {
                    this.handleBarClick(b);
                }
            }

            e.preventDefault();
        }
    }

    handleMouseUp(e) {
        if (this.fbCanvasObj.currentAction !== '') {
            const mouseLoc = this.getCanvasMouseLocation(e);
            this.fbCanvasObj.setMouseUpLoc(mouseLoc);
            e.preventDefault();
        }
    }

    handleMouseMove(e) {
        const mouseLoc = this.getCanvasMouseLocation(e);
        this.fbCanvasObj.setMouseMoveLoc(mouseLoc);
    }

    getCanvasMouseLocation(e) {
        const rect = this.fbCanvas.get(0).getBoundingClientRect();
        const x = Math.round(e.clientX - rect.left);
        const y = Math.round(e.clientY - rect.top);
        return new Point(x, y);
    }

    handleAction(actionName) {
        this.fbCanvasObj.name = actionName;
        const actions = {
            'undo': () => this.fbCanvasObj.undo(),
            'redo': () => this.fbCanvasObj.redo(),
            'breakApart': () => {
                this.fbCanvasObj.addUndoState();
                this.fbCanvasObj.breakApartBars();
                this.fbCanvasObj.refreshCanvas();
            },
            'clearSplits': () => {
                this.fbCanvasObj.addUndoState();
                this.fbCanvasObj.clearSplits();
                this.fbCanvasObj.refreshCanvas();
            },
            'colorPicker': () => {
                $('#colorPickerDiv').dialog('open');
            },
            'copy': () => {
                this.fbCanvasObj.currentAction = 'copy';
                $("[id^='tool_']").removeClass('toolSelected');
            },
            'delete': () => {
                this.fbCanvasObj.addUndoState();
                this.fbCanvasObj.deleteSelectedBars();
                this.fbCanvasObj.refreshCanvas();
            },
            'editLabel': () => {
                this.fbCanvasObj.editLabel();
            },
            'erase': () => {
                this.fbCanvasObj.addUndoState();
                this.fbCanvasObj.currentAction = 'erase';
                $("[id^='tool_']").removeClass('toolSelected');
            },
            'join': () => {
                this.fbCanvasObj.addUndoState();
                this.fbCanvasObj.joinSelected();
                this.fbCanvasObj.refreshCanvas();
            },
            'manualSplit': () => {
                this.fbCanvasObj.currentAction = 'manualSplit';
                $("[id^='tool_']").removeClass('toolSelected');
            },
            'matColorPicker': () => {
                $('#matColorPickerDiv').dialog('open');
            },
            'measure': () => {
                this.fbCanvasObj.addUndoState();
                this.fbCanvasObj.measureBars();
                this.fbCanvasObj.refreshCanvas();
            },
            'move': () => {
                this.fbCanvasObj.currentAction = 'move';
                $("[id^='tool_']").removeClass('toolSelected');
            },
            'new': () => {
                this.fbCanvasObj.addUndoState();
                this.fbCanvasObj.bars = [];
                this.fbCanvasObj.mats = [];
                this.fbCanvasObj.refreshCanvas();
            },
            'selectAll': () => {
                this.fbCanvasObj.clearSelection();
                $.each(this.fbCanvasObj.bars, (index, bar) => {
                    this.fbCanvasObj.selectedBars.push(bar);
                    bar.setSelected(true);
                });
                this.fbCanvasObj.refreshCanvas();
            },
            'select': () => {
                this.fbCanvasObj.currentAction = 'select';
                $("[id^='tool_']").removeClass('toolSelected');
            },
            'setUnitBar': () => {
                this.fbCanvasObj.addUndoState();
                this.fbCanvasObj.setUnitBar();
                this.fbCanvasObj.refreshCanvas();
            },
            'unselectAll': () => {
                this.fbCanvasObj.clearSelection();
                this.fbCanvasObj.refreshCanvas();
            }
        };

        const action = actions[actionName];
        if (action) {
            action();
        }
    }

    handleBarClick(b) {
        const selectedIndex = this.fbCanvasObj.selectedBars.indexOf(b);

        if (selectedIndex === -1) {
            if (!Utilities.shiftKeyDown) {
                this.fbCanvasObj.clearSelection();
            }
            $.each(this.fbCanvasObj.selectedBars, (index, bar) => {
                bar.clearSplitSelection();
            });
            this.fbCanvasObj.selectedBars.push(b);
            b.setSelected(true);
        } else {
            if (Utilities.shiftKeyDown) {
                if (selectedIndex > -1) {
                    this.fbCanvasObj.selectedBars.splice(selectedIndex, 1);
                }
                b.setSelected(false);
            } else {
                this.fbCanvasObj.clearSelection();
                this.fbCanvasObj.selectedBars.push(b);
                b.setSelected(true);
            }
        }
        this.fbCanvasObj.refreshCanvas();
    }

    handleToolClick(tool) {
        const toolName = tool.id.substring(5);
        if ($(tool).hasClass('toolSelected')) {
            $(tool).removeClass('toolSelected');
            this.fbCanvasObj.handleToolUpdate(toolName, false);
            this.fbCanvasObj.clear_selection_button();
        } else {
            $("[id^='tool_']").removeClass('toolSelected');
            if (toolName !== 'select') {
                this.fbCanvasObj.clearSelection();
                this.fbCanvasObj.refreshCanvas();
            }
            $(tool).addClass('toolSelected');
            this.fbCanvasObj.handleToolUpdate(toolName, true);
            if (toolName !== 'manualSplit') {
                this.fbCanvasObj.currentAction = toolName;
            }
        }
    }
}
