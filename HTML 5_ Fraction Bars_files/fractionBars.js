// Copyright University of Massachusetts Dartmouth 2014
//
// Designed and built by James P. Burke and Jason Orrill
// Modified and developed by Hakan Sandir
//
// This Javascript version of Fraction Bars is based on
// the Transparent Media desktop version of Fraction Bars,
// which in turn was based on the original TIMA Bars software
// by John Olive and Leslie Steffe.
// We thank them for allowing us to update that product.

// fractionBars.js
// ... (existing header comments)

// Existing code and imports

$(document).ready(function() {
    // ... (other initialization code)

    // Helper function to get the position from mouse or touch events
    function getEventPosition(e, canvasElement) {
        var clientX, clientY;

        if (e.type.startsWith('touch')) {
            var touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
            clientX = touch.clientX;
            clientY = touch.clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        // Adjust for canvas position
        var x = clientX - canvasElement.offset().left;
        var y = clientY - canvasElement.offset().top;

        return Point.create(x, y);
    }

    // Update event listeners to handle both mouse and touch events
    $('#fbCanvas').on('mousedown touchstart', function(e) {
        e.preventDefault(); // Prevent default touch actions
        var p = getEventPosition(e, $(this));

        fbCanvasObj.check_for_drag = true;
        fbCanvasObj.cacheUndoState();

        fbCanvasObj.mouseDownLoc = p;
        var b = fbCanvasObj.barClickedOn();
        var m = fbCanvasObj.matClickedOn();

        // Existing mousedown logic
        if ((fbCanvasObj.currentAction == 'bar') || (fbCanvasObj.currentAction == "mat")) {
            fbCanvasObj.saveCanvas();
        } else if (fbCanvasObj.currentAction == 'repeat') {
            fbCanvasObj.addUndoState();
            b.repeat(fbCanvasObj.mouseDownLoc);
            fbCanvasObj.refreshCanvas();
        } else {
            // The click is being used to update the selected bars
            if (b !== null) {
                if ($.inArray(b, fbCanvasObj.selectedBars) == -1) {
                    if (!Utilities.shiftKeyDown) {
                        fbCanvasObj.clearSelection();
                    }
                    $.each(fbCanvasObj.selectedBars, function(index, bar) {
                        bar.clearSplitSelection();
                    });
                    fbCanvasObj.barToFront(b);
                    fbCanvasObj.selectedBars.push(b);
                    b.isSelected = true;
                    b.selectSplit(fbCanvasObj.mouseDownLoc);
                } else {
                    $.each(fbCanvasObj.selectedBars, function(index, bar) {
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
            } else if (m !== null) {
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
            } else {
                fbCanvasObj.clearSelection();
            }
            fbCanvasObj.refreshCanvas();
        }
    });

    $('#fbCanvas').on('mousemove touchmove', function(e) {
        e.preventDefault(); // Prevent default touch actions
        var p = getEventPosition(e, $(this));

        if (fbCanvasObj.currentAction == "manualSplit") {
            fbCanvasObj.manualSplitPoint = p;
            fbCanvasObj.refreshCanvas();
        }

        if (fbCanvasObj.mouseDownLoc !== null) {
            fbCanvasObj.updateCanvas(p);
        }
    });

    $('#fbCanvas').on('mouseup touchend', function(e) {
        e.preventDefault(); // Prevent default touch actions
        var p = getEventPosition(e, $(this));

        fbCanvasObj.mouseUpLoc = p;

        if (fbCanvasObj.currentAction == 'bar') {
            fbCanvasObj.addUndoState();
            fbCanvasObj.addBar();
            fbCanvasObj.clear_selection_button();
        } else if (fbCanvasObj.currentAction == 'mat') {
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
    });

    // ... (rest of your code)
});
