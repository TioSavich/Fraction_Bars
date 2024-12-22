import FractionBarsCanvas from './FractionBarsCanvas.js';
import SplitsWidget from './SplitsWidget.js';
import { flag, USE_CURRENT_SELECTION, USE_LAST_SELECTION } from './utilities.js';
import Bar from './Bar.js';
import Mat from './Mat.js';
import Point from './Point.js';

let point1 = null;
let point2 = null;
let fbContext = null;
let splitWidgetContext = null;
let splitWidgetObj = null;
let hiddenButtons = [];
let hiddenButtonsName = [];
let fbCanvasObj = null;
let file_list = "";
let file_index = 0;

document.addEventListener('DOMContentLoaded', () => {
    fbContext = document.getElementById('fbCanvas').getContext('2d');
    fbCanvasObj = new FractionBarsCanvas(fbContext);
    splitWidgetContext = document.getElementById('split-display').getContext('2d');
    splitWidgetObj = new SplitsWidget(splitWidgetContext);

    // Initialize Hammer.js for gesture support
    const hammertime = new Hammer(document.getElementById('fbCanvas'));
    hammertime.get('pan').set({ direction: Hammer.DIRECTION_ALL });

    // Handle panning/dragging with Hammer.js
    hammertime.on('panstart', function (ev) {
        handleMouseDown(ev.srcEvent);
    });

    hammertime.on('panmove', function (ev) {
        handleMouseMove(ev.srcEvent);
    });

    hammertime.on('panend', function (ev) {
        handleMouseUp(ev.srcEvent);
    });

    // Handle tap as click
    hammertime.on('tap', function (ev) {
        handleClick(ev.srcEvent);
    });

    const splitSlider = document.getElementById("split-slider");
    if (splitSlider) {
        noUiSlider.create(splitSlider, {
            start: [2],
            connect: 'lower',
            step: 1,
            range: {
                'min': [2],
                'max': [20]
            },
            pips: {
                mode: 'values',
                values: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20],
                density: 5
            }
        });

        splitSlider.noUiSlider.on('update', function (values, handle) {
            splitWidgetObj.handleSliderChange(values[handle]);
        });

        document.getElementById('radio_vert').style.display = 'none';
    }

    function handleClick(e) {
        const p = Point.createFromMouseEvent(e, this);
        if (fbCanvasObj.currentAction === "manualSplit") {
            fbCanvasObj.manualSplitPoint = p;
            fbCanvasObj.refreshCanvas();
        }
    
        if (fbCanvasObj.mouseDownLoc !== null) {
            fbCanvasObj.updateCanvas(p);
        }
    }
    
    function handleMouseDown(e) {
        fbCanvasObj.check_for_drag = true;
        fbCanvasObj.cacheUndoState();
    
        updateMouseLoc(e, this);
        updateMouseAction('mousedown');
        fbCanvasObj.mouseDownLoc = Point.createFromMouseEvent(e, this);
        let b = fbCanvasObj.barClickedOn();
        let m = fbCanvasObj.matClickedOn();
    
        if ((fbCanvasObj.currentAction === 'bar') || (fbCanvasObj.currentAction === "mat")) {
            fbCanvasObj.saveCanvas();
        } else if (fbCanvasObj.currentAction === 'repeat') {
            fbCanvasObj.addUndoState();
            b.repeat(fbCanvasObj.mouseDownLoc);
            fbCanvasObj.refreshCanvas();
        } else {
            if (b !== null) {
                handleBarClick(b);
            } else if (m !== null) {
                handleMatClick(m);
            } else {
                fbCanvasObj.clearSelection();
            }
            fbCanvasObj.refreshCanvas();
        }
    }
    
    function handleMouseMove(e) {
        fracEvent = e;
        updateMouseLoc(e, this);
        updateMouseAction('mousemove');
    
        let p = Point.createFromMouseEvent(e, this) ;
    
        if (fbCanvasObj.currentAction == "manualSplit") {
            fbCanvasObj.manualSplitPoint = p;
            fbCanvasObj.refreshCanvas();
        }
    
        if(fbCanvasObj.mouseDownLoc !== null) {
            fbCanvasObj.updateCanvas(p);
        }
    }
    
    
    function handleMouseUp(e) {
        updateMouseLoc(e, this);
        updateMouseAction('mouseup');
        fbCanvasObj.mouseUpLoc = Point.createFromMouseEvent(e, this);
    
        if (fbCanvasObj.currentAction === 'bar') {
            fbCanvasObj.addUndoState();
            fbCanvasObj.addBar();
            fbCanvasObj.clear_selection_button();
        } else if (fbCanvasObj.currentAction === 'mat') {
            fbCanvasObj.addUndoState();
            fbCanvasObj.addMat();
            fbCanvasObj.clear_selection_button();
        }
    
        if (fbCanvasObj.found_a_drag) {
            fbCanvasObj.finalizeCachedUndoState();
            fbCanvasObj.check_for_drag = false;
        }
    
        fbCanvasObj.mouseUpLoc = null;
        fbCanvasObj.mouseDownLoc = null;
        fbCanvasObj.mouseLastLoc = null;
    }
    
    
    function handleBarClick(b) {
        if ($.inArray(b, fbCanvasObj.selectedBars) == -1) {
            if (!Utilities.shiftKeyDown) {
                fbCanvasObj.clearSelection();
            }
            $.each(fbCanvasObj.selectedBars, function (index, bar) {
                bar.clearSplitSelection();
            });
            fbCanvasObj.barToFront(b);
            fbCanvasObj.selectedBars.push(b);
            b.isSelected = true;
            b.selectSplit(fbCanvasObj.mouseDownLoc);
        } else {
            $.each(fbCanvasObj.selectedBars, function (index, bar) {
                bar.clearSplitSelection();
            });
            if (!Utilities.shiftKeyDown) {
                b.selectSplit(fbCanvasObj.mouseDownLoc);
            } else {
                fbCanvasObj.removeBarFromSelection(b);
            }
            fbCanvasObj.barToFront(b);
        }
        if (fbCanvasObj.currentAction == "manualSplit") {
            fbCanvasObj.clearSelection();
        }
    }
    
    function handleMatClick(m) {
        if ($.inArray(m, fbCanvasObj.selectedMats) == -1) {
            if (!Utilities.shiftKeyDown) {
                fbCanvasObj.clearSelection();
            }
            m.isSelected = true;
            fbCanvasObj.selectedMats.push(m);
        } else {
            if (Utilities.shiftKeyDown) {
                fbCanvasObj.removeMatFromSelection(m);
            }
        }
    }

    // Generic input change listener for form elements within the dialog
    $('#dialog-form').on('change', 'input, select', function (event) {
        const p = new Point();
        fbCanvasObj.updateCanvas(p);
    });

    document.querySelectorAll('.colorBlock').forEach(block => {
        block.addEventListener('click', function (e) {
            fbCanvasObj.setFillColor(this.style.backgroundColor);
            document.querySelectorAll('.colorBlock').forEach(b => b.classList.remove('colorSelected'));
            this.classList.add('colorSelected');
            fbCanvasObj.updateColorsOfSelectedBars();
            fbCanvasObj.refreshCanvas();
        });
    });

    document.querySelectorAll('.colorBlock1').forEach(block => {
        block.addEventListener('click', function (e) {
            document.getElementById('fbCanvas').style.backgroundColor = this.style.backgroundColor;
            document.querySelectorAll('.colorBlock1').forEach(b => b.classList.remove('colorSelected'));
            this.classList.add('colorSelected');
        });
    });

    document.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', function (e) {
            handleActionClick(this.id);
        });
    });

    function handleActionClick(actionId) {
        if (actionId === null) { return; }
        let tool_on = false;

        if ((fbCanvasObj.currentAction === 'hide') && (actionId.indexOf('hide') === -1)) {
            hideButton(actionId);
            return;
        }

        if (actionId.indexOf('tool_') > -1) {
            const toolName = actionId.substring(5);
            tool_on = toggleTool(toolName);
            fbCanvasObj.handleToolUpdate(toolName, tool_on);
            fbCanvasObj.refreshCanvas();
        }

        if (actionId.indexOf('action_') > -1) {
            const actionName = actionId.substring(7);
            handleAction(actionName);
        }

        if (actionId.indexOf('window_') > -1) {
            const windowName = actionId.substring(7);
            handleWindowAction(windowName);
        }
    }

    function toggleTool(toolName) {
        const toolOn = toolName.toString() === fbCanvasObj.currentAction.toString();
        fbCanvasObj.clear_selection_button();
        if (!toolOn) {
            fbCanvasObj.currentAction = toolName;
            document.getElementById(`tool_${toolName}`).classList.add('toolSelected');
            return true;
        }
        return false;
    }

    function handleAction(actionName) {
        fbCanvasObj.name = actionName;
        const actions = {
            'copy': () => {
                fbCanvasObj.addUndoState();
                fbCanvasObj.copyBars();
                fbCanvasObj.refreshCanvas();
            },
            'delete': () => {
                fbCanvasObj.addUndoState();
                fbCanvasObj.deleteSelectedBars();
                fbCanvasObj.refreshCanvas();
            },
            'join': () => {
                fbCanvasObj.addUndoState();
                fbCanvasObj.joinSelected();
                fbCanvasObj.refreshCanvas();
            },
            'setUnitBar': () => {
                fbCanvasObj.addUndoState();
                fbCanvasObj.setUnitBar();
                fbCanvasObj.refreshCanvas();
            },
            'measure': () => {
                fbCanvasObj.addUndoState();
                fbCanvasObj.measureBars();
                fbCanvasObj.refreshCanvas();
            },
            'make': () => {
                fbCanvasObj.addUndoState();
                fbCanvasObj.make();
                fbCanvasObj.refreshCanvas();
            },
            'breakApart': () => {
                fbCanvasObj.addUndoState();
                fbCanvasObj.breakApartBars();
                fbCanvasObj.refreshCanvas();
            },
            'clearSplits': () => {
                fbCanvasObj.addUndoState();
                fbCanvasObj.clearSplits();
                fbCanvasObj.refreshCanvas();
            },
            'pullOutSplit': () => {
                fbCanvasObj.addUndoState();
                fbCanvasObj.pullOutSplit();
                fbCanvasObj.refreshCanvas();
            },
            'undo': () => {
                fbCanvasObj.undo();
                fbCanvasObj.refreshCanvas();
            },
            'redo': () => {
                fbCanvasObj.redo();
                fbCanvasObj.refreshCanvas();
            },
            'save': () => {
                fbCanvasObj.save();
            },
            'open': () => {
                SaveScreen();
                resetFormElement($("#files"));
                fbCanvasObj.openFileDialog();
            },
            'print': () => {
                fbCanvasObj.print_canvas();
            },
            'clearAll': () => {
                SaveScreen();
                location.reload();
            },
            'show': () => {
                showAllButtons();
            },
            'previous': () => {
                previousSelectFile();
            },
            'next': () => {
                nextSelectFile();
            }
        };

        const action = actions[actionName];
        if (action) {
            action();
        }
    }

    function handleWindowAction(windowName) {
        fbCanvasObj.addUndoState();
        const actions = {
            'label': () => fbCanvasObj.editLabel(),
            'split': () => fbCanvasObj.split(splitWidgetObj),
            'iterate': () => fbCanvasObj.iterate(),
            'properties': () => fbCanvasObj.properties()
        };

        const action = actions[windowName];
        if (action) {
            action();
        }
    }

    document.addEventListener('keydown', function (e) {
        if (e.which === 16) {
            Utilities.shiftKeyDown = true;
            fbCanvasObj.refreshCanvas();
        }

        if (e.ctrlKey && e.keyCode == 80) {
            fbCanvasObj.properties();
            fbCanvasObj.refreshCanvas();
        }

        if (e.ctrlKey && e.keyCode == 83) {
            fbCanvasObj.save();
            fbCanvasObj.refreshCanvas();
        }

        if (e.ctrlKey && e.keyCode == 72) {
            if (Utilities.ctrlKeyDown) {
                showButton("tool_hide");
                showButton("action_show");
                Utilities.ctrlKeyDown = false;
            } else {
                Utilities.ctrlKeyDown = true;
                hideButton("tool_hide");
                hideButton("action_show");
            }
            fbCanvasObj.clear_selection_button();
            fbCanvasObj.refreshCanvas();
        }

        if (e.ctrlKey && e.keyCode == 46) {
            fbCanvasObj.addUndoState();
            fbCanvasObj.deleteSelectedBars();
            fbCanvasObj.refreshCanvas();
        }
    });

    document.addEventListener('keyup', function (e) {
        if (e.which === 16) {
            Utilities.shiftKeyDown = false;
            fbCanvasObj.refreshCanvas();
        }
    });

    document.getElementById('labelInput').addEventListener('keyup', function (e) {
        if (e.which === 13) {
            fbCanvasObj.saveLabel(this.value, USE_CURRENT_SELECTION);
            fbCanvasObj.hideEditLabel();
            fbCanvasObj.refreshCanvas();
        }
    });

    document.getElementById('labelInput').addEventListener('blur', function () {
        fbCanvasObj.saveLabel(this.value, USE_LAST_SELECTION);
        fbCanvasObj.hideEditLabel();
    });
});

function showAllButtons() {
    while (hiddenButtons.length > 0) {
        const thing = hiddenButtons.pop();
        thing.show();
    }
    hiddenButtons = [];
    hiddenButtonsName = [];
}

function SaveScreen() {
    const r = window.confirm("Do you want to save?");
    if (r == true) {
        fbCanvasObj.save();
    }
}

function showButton(item) {
    let cnt = 0;
    while (hiddenButtonsName.length > 0) {
        if (hiddenButtonsName[cnt] === item) {
            const rem_but1 = hiddenButtonsName.splice(cnt, 1);
            hiddenButtons.splice(cnt, 1);
        } else {
            cnt++;
        }
        if (hiddenButtonsName.length === cnt) {
            $(document.getElementById(rem_but1)).show();
            break;
        }
    }
}

function hideButton(item) {
    if (hiddenButtonsName.indexOf(item) < 0) {
        const hidden = document.getElementById(item);
        $(hidden).hide();
        hiddenButtonsName.push(item);
        hiddenButtons.push($(hidden));
    }
}
function handleFileSelect(event) {
    const files = event.target.files;
    if (files.length === 0) {
        return;
    }
    file_list = event.target.files;
    file_index = 0;
    const aFile = files[0];
    readFileOpen(aFile);
}

function handleListSelect(event) {
    file_index = document.getElementById('id_filetext').selectedIndex;
    const a_files = file_list;
    fbCanvasObj.save();
    const aFileIndex = file_index;
    const aFile = a_files[aFileIndex];
    readFileOpen(aFile);
}

function nextSelectFile() {
    fbCanvasObj.save();
    const n_files = file_list;
    file_index = file_index + 1;
    document.getElementById('id_filetext').selectedIndex = file_index;
    const nFileIndex = file_index;
    const nFile = n_files[nFileIndex];
    readFileOpen(nFile);
}

function previousSelectFile() {
    fbCanvasObj.save();
    const p_files = file_list;
    file_index = file_index - 1;
    document.getElementById('id_filetext').selectedIndex = file_index;
    const pFileIndex = file_index;
    const pFile = p_files[pFileIndex];
    readFileOpen(pFile);
}

function readFileOpen(oFile) {
    showAllButtons();
    fbCanvasObj.mUndoArray = [];
    fbCanvasObj.mRedoArray = [];

    const reader = new FileReader();

    reader.onload = function (fileEvent) {
        fbCanvasObj.handleFileEvent(fileEvent);
    };

    reader.readAsText(oFile);
    showSelectList();
}

function showSelectList() {
    const f_files = file_list;
    const first = document.getElementById('id_filetext');
    const b_title = document.getElementById('bar_titles');
    const file_length = f_files.length;
    let select_length = document.getElementById('id_filetext').selectedIndex;
    const s_files = file_list[file_index];
    select_length = select_length + 1;
    document.title = s_files.name;
    b_title.innerHTML = ": " + s_files.name;
    if (file_length === 1) {
        hideButton("id_filetext");
        hideButton("action_previous");
        hideButton("action_next");
    }
    else if (file_length === select_length) {
        showButton("id_filetext");
        showButton("action_previous");
        hideButton("action_next");
    }
    else if (select_length === 1 || select_length === 0) {
        showButton("id_filetext");
        hideButton("action_previous");
        showButton("action_next");
    }
    else {
        showButton("id_filetext");
        showButton("action_previous");
        showButton("action_next");
    }
    first.innerHTML = '';
    for (let i = 0, f1; f1 = f_files[i]; i++) {
        first.innerHTML = first.innerHTML + '<option value="' + f1.name + '"' + (s_files.name === f1.name ? ' selected' : '') + '>' + f1.name + '</option>';
    }
}

function resetFormElement(e) {
    e.wrap('<form>').closest('form').get(0).reset();
    e.unwrap();
}

function updateMouseLoc(e, elem) {
    const x = e.clientX - elem.getBoundingClientRect().left;
    const y = e.clientY - elem.getBoundingClientRect().top;
}

function updateMouseAction(actionName) {
    // Update mouse action if needed
}