import FractionBarsCanvas from './FractionBarsCanvas.js';
import SplitsWidget from './SplitsWidget.js';
import { flag, USE_CURRENT_SELECTION, USE_LAST_SELECTION } from './utilities.js';
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

            fbCanvas.addEventListener('click', (e) => {
                this.handleClick(e);
            });

            fbCanvas.addEventListener('mousedown', (e) => {
                this.handleMouseDown(e);
            });

            fbCanvas.addEventListener('mouseup', (e) => {
                this.handleMouseUp(e);
            });

            fbCanvas.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.handleMouseDown(e.changedTouches[0]);
            }, false);

            fbCanvas.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.handleMouseUp(e.changedTouches[0]);
            }, false);

            $('#dialog-form').on('change', 'input, select', (event) => {
                const p = new Point();
                this.fbCanvasObj.updateCanvas(p);
            });

            document.querySelectorAll('.colorBlock').forEach(block => {
                block.addEventListener('click', () => {
                    this.fbCanvasObj.setFillColor(block.style.backgroundColor);
                    document.querySelectorAll('.colorBlock').forEach(b => b.classList.remove('colorSelected'));
                    block.classList.add('colorSelected'); // Use 'block' to refer to the current element

                    this.fbCanvasObj.updateColorsOfSelectedBars();
                    this.fbCanvasObj.refreshCanvas();
                });
            });

            document.querySelectorAll('.colorBlock1').forEach(block => {
                block.addEventListener('click', () => {
                    document.getElementById('fbCanvas').style.backgroundColor = block.style.backgroundColor;
                    document.querySelectorAll('.colorBlock1').forEach(b => b.classList.remove('colorSelected'));
                    block.classList.add('colorSelected'); // Use 'block' to refer to the current element
                });
            });

            document.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', () => {
                    this.handleActionClick(link.id); // Use 'link' to refer to the current element
                });
            });

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
            this.handleAction(actionName);
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

    showAllButtons() {
        while (this.hiddenButtons.length > 0) {
            const thing = this.hiddenButtons.pop();
            thing.show();
        }
        this.hiddenButtons = [];
        this.hiddenButtonsName = [];
    }

    SaveScreen() {
        const r = window.confirm("Do you want to save?");
        if (r == true) {
            this.fbCanvasObj.save();
        }
    }

    showButton(item) {
        let cnt = 0;
        while (this.hiddenButtonsName.length > 0) {
            if (this.hiddenButtonsName[cnt] === item) {
                const rem_but1 = this.hiddenButtonsName.splice(cnt, 1);
                this.hiddenButtons.splice(cnt, 1);
            } else {
                cnt++;
            }
            if (this.hiddenButtonsName.length === cnt) {
                $(document.getElementById(rem_but1)).show();
                break;
            }
        }
    }

    hideButton(item) {
        if (this.hiddenButtonsName.indexOf(item) < 0) {
            const hidden = document.getElementById(item);
            <span class="math-inline">\(hidden\)\.hide\(\);
this\.hiddenButtonsName\.push\(item\);
this\.hiddenButtons\.push\(</span>(hidden));
        }
    }

    handleFileSelect(event) {
        const files = event.target.files;
        if (files.length === 0) {
            return;
        }
        this.file_list = event.target.files;
        this.file_index = 0;
        const aFile = files[0];
        this.readFileOpen(aFile);
    }

    handleListSelect(event) {
        this.file_index = document.getElementById('id_filetext').selectedIndex;
        const a_files = this.file_list;
        this.fbCanvasObj.save();
        const aFileIndex = this.file_index;
        const aFile = a_files[aFileIndex];
        this.readFileOpen(aFile);
    }

    nextSelectFile() {
        this.fbCanvasObj.save();
        const n_files = this.file_list;
        this.file_index = this.file_index + 1;
        document.getElementById('id_filetext').selectedIndex = this.file_index;
        const nFileIndex = this.file_index;
        const nFile = n_files[nFileIndex];
        this.readFileOpen(nFile);
    }

    previousSelectFile() {
        this.fbCanvasObj.save();
        const p_files = this.file_list;
        this.file_index = this.file_index - 1;
        document.getElementById('id_filetext').selectedIndex = this.file_index;
        const pFileIndex = this.file_index;
        const pFile = p_files[pFileIndex];
        this.readFileOpen(pFile);
    }

    readFileOpen(oFile) {
        this.showAllButtons();
        this.fbCanvasObj.mUndoArray = [];
        this.fbCanvasObj.mRedoArray = [];

        const reader = new FileReader();
        reader.onload = (fileEvent) => {
            this.fbCanvasObj.handleFileEvent(fileEvent);
        };
        reader.readAsText(oFile);
        this.showSelectList();
    }

    showSelectList() {
        const f_files = this.file_list;
        const first = document.getElementById('id_filetext');
        const b_title = document.getElementById('bar_titles');
        const file_length = f_files.length;
        let select_length = document.getElementById('id_filetext').selectedIndex;
        const s_files = this.file_list[this.file_index];
        select_length = select_length + 1;
        document.title = s_files.name;
        b_title.innerHTML = ": " + s_files.name;
        if (file_length === 1) {
            this.hideButton("id_filetext");
            this.hideButton("action_previous");
            this.hideButton("action_next");
        }
        else if (file_length === select_length) {
            this.showButton("id_filetext");
            this.showButton("action_previous");
            this.hideButton("action_next");
        }
        else if (select_length === 1 || select_length === 0) {
            this.showButton("id_filetext");
            this.hideButton("action_previous");
            this.showButton("action_next");
        }
        else {
            this.showButton("id_filetext");
            this.showButton("action_previous");
            this.showButton("action_next");
        }
        first.innerHTML = '';
        for (let i = 0, f1; f1 = f_files[i]; i++) {
            first.innerHTML = first.innerHTML + '<option value="' + f1.name + '"' + (s_files.name === f1.name ? ' selected' : '') + '>' + f1.name + '</option>';
        }
    }

    resetFormElement(e) {
        e.wrap('<form>').closest('form').get(0).reset();
        e.unwrap();
    }

    updateMouseLoc(e, elem) {
        const x = e.clientX - elem.getBoundingClientRect().left;
        const y = e.clientY - elem.getBoundingClientRect().top;
    }

    updateMouseAction(actionName) {
        // Update mouse action if needed
    }

    handleBarClick(b) {
        if ($.inArray(b, this.fbCanvasObj.selectedBars) == -1) {
            if (!Utilities.shiftKeyDown) {
                this.fbCanvasObj.clearSelection();
            }
            $.each(this.fbCanvasObj.selectedBars, function(index, bar) {
                bar.clearSplitSelection();});
            this.fbCanvasObj.selectedBars.push(b);
            b.setSelected(true);
        } else {
            if (Utilities.shiftKeyDown) {
                const selectedIndex = $.inArray(b, this.fbCanvasObj.selectedBars);
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

    handleSplitClick(split) {
        if (!Utilities.shiftKeyDown) {
            $.each(this.fbCanvasObj.selectedBars, function(index, bar) {
                bar.clearSplitSelection();
            });
        }
        split.setSelected(!split.selected);
        this.fbCanvasObj.refreshCanvas();
    }

    handleClick(e) {
        if (!this.fbCanvasObj) return;
        const elem = $('#fbCanvas');
        const clickLoc = Point.createFromMouseEvent(e, elem);
        let clickHandled = false;

        $.each(this.fbCanvasObj.bars, (index, bar) => {
            if (bar.contains(clickLoc)) {
                this.handleBarClick(bar);
                clickHandled = true;
                return false; // break out of the $.each loop
            }
            $.each(bar.splits, (index, split) => {
                if (split.contains(clickLoc)) {
                    this.handleSplitClick(split);
                    clickHandled = true;
                    return false; // break out of the inner $.each loop
                }
            });
            if (clickHandled) {
                return false; // break out of the outer $.each loop
            }
        });

        if (!clickHandled) {
            this.fbCanvasObj.clearSelection();
            this.fbCanvasObj.refreshCanvas();
        }
    }

    handleMouseDown(e) {
        if (!this.fbCanvasObj) return;
        const elem = $('#fbCanvas');
        this.fbCanvasObj.mouseDownLoc = Point.createFromMouseEvent(e, elem);
        this.fbCanvasObj.mouseDownOnBar = null;

        $.each(this.fbCanvasObj.bars, (index, bar) => {
            if (bar.contains(this.fbCanvasObj.mouseDownLoc)) {
                this.fbCanvasObj.mouseDownOnBar = bar;
                return false; // break out of the loop
            }
        });
    }

    handleMouseMove(e) {
        if (!this.fbCanvasObj) return;
        if (this.fbCanvasObj.mouseDownLoc !== null) {
            const elem = $('#fbCanvas');
            const mouseLoc = Point.createFromMouseEvent(e, elem);
            this.updateMouseLoc(e, elem);
            if (this.fbCanvasObj.mouseDownOnBar) {
                this.fbCanvasObj.mouseDownOnBar.moveBarAndSplits(
                    mouseLoc.x - this.fbCanvasObj.mouseDownLoc.x,
                    mouseLoc.y - this.fbCanvasObj.mouseDownLoc.y
                );
            } else {
                this.fbCanvasObj.moveAllBars(
                    mouseLoc.x - this.fbCanvasObj.mouseDownLoc.x,
                    mouseLoc.y - this.fbCanvasObj.mouseDownLoc.y
                );
            }
            this.fbCanvasObj.mouseDownLoc = mouseLoc;
            this.fbCanvasObj.refreshCanvas();
        }
    }

    handleMouseUp(e) {
        if (!this.fbCanvasObj) return;
        this.fbCanvasObj.mouseDownLoc = null;
        this.fbCanvasObj.mouseDownOnBar = null;
        this.fbCanvasObj.refreshCanvas();
    }

    handleTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        this.handleMouseDown(touch);
    }

    handleTouchMove(e) {
        e.preventDefault();
        const touch = e.touches[0];
        this.handleMouseMove(touch);
    }

    handleTouchEnd(e) {
        e.preventDefault();
        this.handleMouseUp(e);
    }
}

$(document).ready(function() {
    const fractionBars = new FractionBars();
    fractionBars.init();
    window.fractionBars = fractionBars;
});
