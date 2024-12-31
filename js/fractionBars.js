import FractionBarsCanvas from './FractionBarsCanvas.js';
import SplitsWidget from './SplitsWidget.js';
import { flag, USE_CURRENT_SELECTION, USE_LAST_SELECTION, getMarkedIterateFlag } from './utilities.js';
import Bar from './Bar.js';
import Mat from './Mat.js';
import Point from './Point.js';

export default class FractionBars {
    constructor() {
        this.fbContext = null;
        this.splitWidgetContext = null;
        this.splitWidgetObj = null;
        this.hiddenButtons = [];
        this.hiddenButtonsName = [];
        this.fbCanvasObj = null;
        this.file_list = "";
        this.file_index = 0;
        this.fracEvent = null;
    }

    init() {
        const fbCanvas = document.getElementById('fbCanvas');
        if (fbCanvas) {
            this.fbContext = fbCanvas.getContext('2d');
            this.fbCanvasObj = new FractionBarsCanvas(this.fbContext);
            this.splitWidgetContext = document.getElementById('split-display').getContext('2d');
            this.splitWidgetObj = new SplitsWidget(this.splitWidgetContext);

            // Hammer.js for touch events
            const hammertime = new Hammer(document.getElementById('fbCanvas'));
            hammertime.get('pan').set({ direction: Hammer.DIRECTION_ALL });

            hammertime.on('panstart', (ev) => {
                this.handleMouseDown(ev.srcEvent);
            });

            hammertime.on('panmove', (ev) => {
                this.handleMouseMove(ev.srcEvent);
            });

            hammertime.on('panend', (ev) => {
                this.handleMouseUp(ev.srcEvent);
            });

            hammertime.on('tap', (ev) => {
                this.handleClick(ev.srcEvent);
            });

            // Mouse events
            fbCanvas.addEventListener('click', (e) => {
                this.handleClick(e);
            });

            fbCanvas.addEventListener('mousedown', (e) => {
                this.handleMouseDown(e);
            });

            fbCanvas.addEventListener('mouseup', (e) => {
                this.handleMouseUp(e);
            });

            // Touch events
            fbCanvas.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.handleMouseDown(e.changedTouches[0]);
            }, false);

            fbCanvas.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.handleMouseUp(e.changedTouches[0]);
            }, false);

            // Dialog form change event
            $('#dialog-form').on('change', 'input, select', (event) => {
                const p = new Point();
                this.fbCanvasObj.updateCanvas(p);
            });

            // Color block click events
            document.querySelectorAll('.colorBlock').forEach(block => {
                block.addEventListener('click', () => {
                    this.fbCanvasObj.setFillColor(block.style.backgroundColor);
                    document.querySelectorAll('.colorBlock').forEach(b => b.classList.remove('colorSelected'));
                    block.classList.add('colorSelected');

                    this.fbCanvasObj.updateColorsOfSelectedBars();
                    this.fbCanvasObj.refreshCanvas();
                });
            });

            // Background color block click events
            document.querySelectorAll('.colorBlock1').forEach(block => {
                block.addEventListener('click', () => {
                    document.getElementById('fbCanvas').style.backgroundColor = block.style.backgroundColor;
                    document.querySelectorAll('.colorBlock1').forEach(b => b.classList.remove('colorSelected'));
                    block.classList.add('colorSelected');
                });
            });

            // Action link click events (with check for valid ID)
            document.querySelectorAll('a').forEach(link => {
                if (link.id && link.id.indexOf('action_') > -1) {
                    link.addEventListener('click', () => {
                        this.handleActionClick(link.id);
                    });
                }
            });

            // Keyboard events
            document.addEventListener('keydown', (e) => {
                if (e.which === 16) {
                    Utilities.shiftKeyDown = true;
                    this.fbCanvasObj.refreshCanvas();
                }

                if (e.ctrlKey && e.keyCode == 80) {
                    this.fbCanvasObj.properties();
                    this.fbCanvasObj.refreshCanvas();
                }

                if (e.ctrlKey && e.keyCode == 83) {
                    this.fbCanvasObj.save();
                    this.fbCanvasObj.refreshCanvas();
                }

                if (e.ctrlKey && e.keyCode == 72) {
                    if (Utilities.ctrlKeyDown) {
                        this.showButton("tool_hide");
                        this.showButton("action_show");
                        Utilities.ctrlKeyDown = false;
                    } else {
                        Utilities.ctrlKeyDown = true;
                        this.hideButton("tool_hide");
                        this.hideButton("action_show");
                    }
                    this.fbCanvasObj.clear_selection_button();
                    this.fbCanvasObj.refreshCanvas();
                }

                if (e.ctrlKey && e.keyCode == 46) {
                    this.fbCanvasObj.addUndoState();
                    this.fbCanvasObj.deleteSelectedBars();
                    this.fbCanvasObj.refreshCanvas();
                }
            });

            document.addEventListener('keyup', (e) => {
                if (e.which === 16) {
                    Utilities.shiftKeyDown = false;
                    this.fbCanvasObj.refreshCanvas();
                }
            });

            // Label input events
            document.getElementById('labelInput').addEventListener('keyup', (e) => {
                if (e.which === 13) {
                    this.fbCanvasObj.saveLabel(this.value, USE_CURRENT_SELECTION);
                    this.fbCanvasObj.hideEditLabel();
                    this.fbCanvasObj.refreshCanvas();
                }
            });

            document.getElementById('labelInput').addEventListener('blur', () => {
                this.fbCanvasObj.saveLabel(this.value, USE_LAST_SELECTION);
                this.fbCanvasObj.hideEditLabel();
            });

            // File input events
            document.getElementById("files").addEventListener('change', (e) => {
                this.handleFileSelect(e);
            }, false);

            document.getElementById('id_filetext').addEventListener('change', (e) => {
                this.handleListSelect(e);
            }, false);
        }
    }

    handleActionClick(actionId) {
        if (actionId === null) {
            return;
        }
        let tool_on = false;
        if ((this.fbCanvasObj.currentAction === 'hide') && (actionId.indexOf('hide') === -1)) {
            this.hideButton(actionId);
            return;
        }

        if (actionId.indexOf('tool_') > -1) {
            const toolName = actionId.substring(5);
            tool_on = this.toggleTool(toolName);
            this.fbCanvasObj.handleToolUpdate(toolName, tool_on);
            this.fbCanvasObj.refreshCanvas();
        }

        if (actionId.indexOf('action_') > -1) {
            const actionName = actionId.substring(7);

            // Check if the actionName exists in the actions object
            if (actions[actionName]) {
                this.handleAction(actionName);
            } else {
                console.error("Error: Invalid action name:", actionName);
            }
        }

        if (actionId.indexOf('window_') > -1) {
            const windowName = actionId.substring(7);
            this.handleWindowAction(windowName);
        }
    }

    toggleTool(toolName) {
        const toolOn = toolName.toString() === this.fbCanvasObj.currentAction.toString();
        this.fbCanvasObj.clear_selection_button();
        if (!toolOn) {
            this.fbCanvasObj.currentAction = toolName;
            document.getElementById(`tool_${toolName}`).classList.add('toolSelected');
            return true;
        }
        return false;
    }

    handleAction(actionName) {
        this.fbCanvasObj.name = actionName;
        const actions = {
            'copy': () => {
                this.fbCanvasObj.addUndoState();
                this.fbCanvasObj.copyBars();
                this.fbCanvasObj.refreshCanvas();
            },
            'delete': () => {
                this.fbCanvasObj.addUndoState();
                this.fbCanvasObj.deleteSelectedBars();
                this.fbCanvasObj.refreshCanvas();
            },
            'join': () => {
                this.fbCanvasObj.addUndoState();
                this.fbCanvasObj.joinSelected();
                this.fbCanvasObj.refreshCanvas();
            },
            'setUnitBar': () => {
                this.fbCanvasObj.addUndoState();
                this.fbCanvasObj.setUnitBar();
                this.fbCanvasObj.refreshCanvas();
            },
            'measure': () => {
                this.fbCanvasObj.addUndoState();
                this.fbCanvasObj.measureBars();
                this.fbCanvasObj.refreshCanvas();
            },
            'make': () => {
                this.fbCanvasObj.addUndoState();
                this.fbCanvasObj.make();
                this.fbCanvasObj.refreshCanvas();
            },
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
            'pullOutSplit': () => {
                this.fbCanvasObj.addUndoState();
                this.fbCanvasObj.pullOutSplit();
                this.fbCanvasObj.refreshCanvas();
            },
            'undo': () => {
                this.fbCanvasObj.undo();
                this.fbCanvasObj.refreshCanvas();
            },
            'redo': () => {
                this.fbCanvasObj.redo();
                this.fbCanvasObj.refreshCanvas();
            },
            'save': () => {
                this.fbCanvasObj.save();
            },
            'open': () => {
                this.SaveScreen();
                this.resetFormElement($("#files"));
                this.fbCanvasObj.openFileDialog();
            },
            'print': () => {
                this.fbCanvasObj.print_canvas();
            },
            'clearAll': () => {
                this.SaveScreen();
                location.reload();
            },
            'show': () => {
                this.showAllButtons();
            },
            'previous': () => {
                this.previousSelectFile();
            },
            'next': () => {
                this.nextSelectFile();
            }
        };

        const action = actions[actionName];
        if (action) {
            action();
        }
    }

    handleWindowAction(windowName) {
        this.fbCanvasObj.addUndoState();
        const actions = {
            'label': () => this.fbCanvasObj.editLabel(),
            'split': () => this.fbCanvasObj.split(this.splitWidgetObj),
            'iterate': () => this.fbCanvasObj.iterate(),
            'properties': () => this.fbCanvasObj.properties()
        };
        const action = actions[windowName];
        if (action) {
            action();
        }
    }

    // ... (other methods like showAllButtons, SaveScreen, etc.)

    handleBarClick(b) {
        const selectedIndex = this.fbCanvasObj.selectedBars.indexOf(b); // Use indexOf

        if (selectedIndex === -1) {
            if (!Utilities.shiftKeyDown) {
                this.fbCanvasObj.clearSelection();
            }
            $.each(this.fbCanvasObj.selectedBars, function(index, bar) {
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

    // ... (rest of the methods like handleSplitClick, handleClick, etc.)
}

// Initialize FractionBars when the document is ready
$(document).ready(function() {
    const fractionBars = new FractionBars();
    fractionBars.init();
    window.fractionBars = fractionBars;
});
