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

var point1 = null ;
var point2 = null;
var fbContext = null ;
var splitWidgetContext = null;
var hiddenButtons = [];
var hiddenButtonsName=[];

var fracEvent = null;

splitWidgetObj = null;

document.addEventListener('DOMContentLoaded', function() {
	//first attempt
	hideButton("id_filetext");
	hideButton("action_previous");
	hideButton("action_next");



	fbContext = document.getElementById('fbCanvas').getContext('2d');
	fbCanvasObj = new FractionBarsCanvas(fbContext);
	splitWidgetContext = document.getElementById('split-display').getContext('2d');
	splitWidgetObj = new SplitsWidget(splitWidgetContext);

	// High-DPI/Retina support: scale canvas for crisp display
	var dpr = 3; // 3x for Retina/HiDPI
	var canvas = document.getElementById('fbCanvas');
	var cssWidth = canvas.getAttribute('width');
	var cssHeight = canvas.getAttribute('height');
	canvas.width = cssWidth * dpr;
	canvas.height = cssHeight * dpr;
	canvas.style.width = cssWidth + 'px';
	canvas.style.height = cssHeight + 'px';
	fbContext.setTransform(dpr, 0, 0, dpr, 0, 0);

	document.getElementById("split-slider").addEventListener("change", function(event) {
		splitWidgetObj.handleSliderChange(event, { value: this.value });
	});

	document.getElementById("vert").addEventListener("change", handleVertHorizChange);
	document.getElementById("horiz").addEventListener("change", handleVertHorizChange);


	function handleVertHorizChange(event) {
		splitWidgetObj.handleVertHorizChange(event);
	}




	document.getElementById("files").addEventListener("change", handleFileSelect);
	FBFileReader = new FileReader();




//First attempt
	document.getElementById("id_filetext").addEventListener("change", handleListSelect);
//


	document.getElementById('fbCanvas').addEventListener('dblclick', function() {
		var fbImg = fbContext.getImageData(0,0,1000,600) ;
		fbContext.clearRect(0,0,1000,600) ;
//		fbContext.restore() ;
		fbContext.putImageData(fbImg,0,0);
	});

	document.getElementById('fbCanvas').addEventListener('pointermove', function(e) {
		e.preventDefault();
		fracEvent = e;
		updateMouseLoc(e, this);
		updateMouseAction('pointermove');

		var p = Point.createFromMouseEvent(e, this) ;

		if (fbCanvasObj.currentAction == "manualSplit") {
			fbCanvasObj.manualSplitPoint = p;
			fbCanvasObj.refreshCanvas();
		}

		if(fbCanvasObj.mouseDownLoc !== null) {
			fbCanvasObj.updateCanvas(p);
		}
	});

	document.getElementById('fbCanvas').addEventListener('pointerdown', function(e) {
		e.preventDefault();
		this.setPointerCapture(e.pointerId);
		fbCanvasObj.check_for_drag = true;
		fbCanvasObj.cacheUndoState();

		updateMouseLoc(e, this);
		updateMouseAction('pointerdown');
		fbCanvasObj.mouseDownLoc = Point.createFromMouseEvent(e, this) ;
		var b = fbCanvasObj.barClickedOn() ;
		var m = fbCanvasObj.matClickedOn() ;

		if( (fbCanvasObj.currentAction == 'bar') || (fbCanvasObj.currentAction == "mat")) {
			fbCanvasObj.saveCanvas() ;
		} else if( fbCanvasObj.currentAction == 'repeat' ) {
			fbCanvasObj.addUndoState();
			b.repeat(fbCanvasObj.mouseDownLoc);
			fbCanvasObj.refreshCanvas();
		} else {
			// The click is being used to update the selected bars
			if( b !== null ) {
				if( !fbCanvasObj.selectedBars.includes(b) ) { // clicked on bar is not already selected
					if( !Utilities.shiftKeyDown ) {
						fbCanvasObj.clearSelection();
					}
					fbCanvasObj.selectedBars.forEach(function(bar) {
						bar.clearSplitSelection();
					});
					fbCanvasObj.barToFront(b);
					fbCanvasObj.selectedBars.push(b);
					b.isSelected = true;
					b.selectSplit(fbCanvasObj.mouseDownLoc);
				} else {											// clicked bar is already selected
					fbCanvasObj.selectedBars.forEach(function(bar) {
						bar.clearSplitSelection();
					});
					if( !Utilities.shiftKeyDown ) {
						b.selectSplit(fbCanvasObj.mouseDownLoc);
					} else {
						fbCanvasObj.removeBarFromSelection(b);
					}
					fbCanvasObj.barToFront(b);
				}
				if (fbCanvasObj.currentAction == "manualSplit") {
					fbCanvasObj.clearSelection();
				}
			} else if( m !== null ) {
				if( !fbCanvasObj.selectedMats.includes(m)) { // clicked on mat is not already selected
					if( !Utilities.shiftKeyDown ) {
						fbCanvasObj.clearSelection();
					}
					m.isSelected = true;
					fbCanvasObj.selectedMats.push(m);
				} else {  // Clicked on mat is already selected
					if( Utilities.shiftKeyDown ) {
						fbCanvasObj.removeMatFromSelection(m);
					}
				}
			} else {
				fbCanvasObj.clearSelection();
			}
			fbCanvasObj.refreshCanvas();
		}
	}) ;

	document.getElementById('fbCanvas').addEventListener('pointerup', function(e) {
		e.preventDefault();
		updateMouseLoc(e, this);
		updateMouseAction('pointerup');

		fbCanvasObj.mouseUpLoc = Point.createFromMouseEvent(e, this) ;

		if( fbCanvasObj.currentAction == 'bar' ) {
			fbCanvasObj.addUndoState();
			fbCanvasObj.addBar() ;
			fbCanvasObj.clear_selection_button ();

		} else if (fbCanvasObj.currentAction == 'mat') {
			fbCanvasObj.addUndoState();
			fbCanvasObj.addMat();
			fbCanvasObj.clear_selection_button ();
		}

		if (fbCanvasObj.found_a_drag){
			fbCanvasObj.finalizeCachedUndoState();
			fbCanvasObj.check_for_drag = false;
		}

		fbCanvasObj.mouseUpLoc = null ;
		fbCanvasObj.mouseDownLoc = null ;
		fbCanvasObj.mouseLastLoc = null ;

	}) ;

	document.querySelectorAll('.colorBlock').forEach(function(element) {
		element.addEventListener('click', function(e) {
			fbCanvasObj.setFillColor( window.getComputedStyle(this).backgroundColor);
			document.querySelectorAll('.colorBlock').forEach(function(el) {
				el.classList.remove('colorSelected');
			});
			this.classList.add('colorSelected');
			fbCanvasObj.updateColorsOfSelectedBars();
			fbCanvasObj.refreshCanvas();
		});
	});

//first attempt
	document.querySelectorAll('.colorBlock1').forEach(function(element) {
		element.addEventListener('click', function(e) {
			document.getElementById('fbCanvas').style.backgroundColor = window.getComputedStyle(this).backgroundColor;
			document.querySelectorAll('.colorBlock1').forEach(function(el) {
				el.classList.remove('colorSelected');
			});
			this.classList.add('colorSelected');
		});
	});
//


	document.querySelectorAll('a').forEach(function(element) {
		element.addEventListener('click', function(e) {

			var thisId = this.getAttribute('id') ;
			if (thisId === null) { return; }
			var tool_on = false; // just temporarily keeps track of whether we're turning a tool on or off

//		First, handle any hiding, if we're in that mode
		if ((fbCanvasObj.currentAction == 'hide') && (thisId.indexOf('hide') == -1) ) {
			this.style.display = 'none';
			hiddenButtonsName.push(thisId);
			hiddenButtons.push(this);
			return;
		}

		if( thisId.indexOf('tool_') > -1 ) {

			var toolName = thisId.substr(5,thisId.length);
			if( toolName.toString() == fbCanvasObj.currentAction.toString() ) {
				tool_on = false;
				fbCanvasObj.clear_selection_button ();
			} else {
				fbCanvasObj.currentAction = thisId.substr(5,thisId.length) ;
				tool_on = true;
				this.classList.add('toolSelected');
			}
			fbCanvasObj.handleToolUpdate(toolName, tool_on);
			fbCanvasObj.refreshCanvas();
		}

		if( thisId.indexOf('action_') > -1 ) {
		fbCanvasObj.name=thisId.substr( 7, thisId.length );
			switch( thisId.substr( 7, thisId.length )) {
				case 'copy':
					fbCanvasObj.addUndoState();
					fbCanvasObj.copyBars() ;
					fbCanvasObj.refreshCanvas() ;
					break ;
				case 'delete':
					fbCanvasObj.addUndoState();
					fbCanvasObj.deleteSelectedBars() ;
					fbCanvasObj.refreshCanvas() ;
					break ;
				case 'join':
					fbCanvasObj.addUndoState();
					fbCanvasObj.joinSelected() ;
					fbCanvasObj.refreshCanvas() ;
					break ;
				case 'setUnitBar':
					fbCanvasObj.addUndoState();
					fbCanvasObj.setUnitBar() ;
					fbCanvasObj.refreshCanvas() ;
					break ;
				case 'measure':
					fbCanvasObj.addUndoState();
					fbCanvasObj.measureBars() ;
					fbCanvasObj.refreshCanvas() ;
					break ;
				case 'make':
					fbCanvasObj.addUndoState();
					fbCanvasObj.make() ;
					fbCanvasObj.refreshCanvas() ;
					break ;
				case 'breakApart':
					fbCanvasObj.addUndoState();
					fbCanvasObj.breakApartBars() ;
					fbCanvasObj.refreshCanvas() ;
					break ;
				case 'clearSplits':
					fbCanvasObj.addUndoState();
					fbCanvasObj.clearSplits() ;
					fbCanvasObj.refreshCanvas();
					break ;
				case 'pullOutSplit':
					fbCanvasObj.addUndoState();
					fbCanvasObj.pullOutSplit();
					fbCanvasObj.refreshCanvas();
					break ;
				case 'undo':
					fbCanvasObj.undo();
					fbCanvasObj.refreshCanvas() ;
					break ;
				case 'redo':
					fbCanvasObj.redo();
					fbCanvasObj.refreshCanvas();
					break;
				case 'save':
					fbCanvasObj.save();
					break;
				case 'open':
					SaveScreen();
					resetFormElement(document.getElementById("files"));
					fbCanvasObj.openFileDialog();
					break;
					case 'print':
					fbCanvasObj.print_canvas();
					break ;
				case 'clearAll':
				    SaveScreen();
					location.reload();
					break;
				case 'show':
					showAllButtons();
					break;
					case 'previous':
					previousSelectFile();
					break;
						case 'next':
						nextSelectFile();
							break;

			}

		}

		if( thisId.indexOf('window_') > -1 ) {
			switch( thisId.substr( 7, thisId.length )) {
				case 'label':
					fbCanvasObj.addUndoState();
					fbCanvasObj.editLabel() ;
					break ;
				case 'split':
					fbCanvasObj.split(splitWidgetObj);
					break;
				case 'iterate':
					fbCanvasObj.iterate();
					break;
				case 'properties':
					fbCanvasObj.properties();
					break;
			}
		}

		});
	});


	document.addEventListener('keydown', function(e) {

		if( e.which == 16 ) {
			Utilities.shiftKeyDown = true ;
			fbCanvasObj.refreshCanvas();
		}
	});
	document.addEventListener('keyup', function(e) {
		if( e.which == 16 ) {
			Utilities.shiftKeyDown = false ;
			fbCanvasObj.refreshCanvas();
		}

		if( e.ctrlKey && e.keyCode==80) {
			// This shortcut is now handled by the new ToolbarComponent
			// fbCanvasObj.properties();
			// fbCanvasObj.refreshCanvas();
		}

		if( e.ctrlKey && e.keyCode==83) {
			fbCanvasObj.save();
			fbCanvasObj.refreshCanvas();
		}

		if( e.ctrlKey && e.keyCode==72) {
			//document.getElementById( "#dialog-hidden" ).dialog('open');
			if(Utilities.ctrlKeyDown){
				showButton("tool_hide");
				showButton("action_show");
				Utilities.ctrlKeyDown=false;
			} else {
				Utilities.ctrlKeyDown =true;
				hideButton("tool_hide");
				hideButton("action_show");
			}
			fbCanvasObj.clear_selection_button();
			fbCanvasObj.refreshCanvas();
		}
		if( e.ctrlKey && e.keyCode==46) {
			fbCanvasObj.addUndoState();
			fbCanvasObj.deleteSelectedBars() ;
			fbCanvasObj.refreshCanvas() ;
		}

	});

	document.getElementById('labelInput').addEventListener('keyup', function( e ) {
		if( e.which == 13 ) {
			fbCanvasObj.saveLabel( this.value, Utilities.USE_CURRENT_SELECTION ) ;
			fbCanvasObj.hideEditLabel() ;
			fbCanvasObj.refreshCanvas();
		}
	}) ;

	// This gets triggered after we have already cleared out the selection,
	// so we need to have a way to be sure the LAST selection gets the label.
	document.getElementById('labelInput').addEventListener('blur', function() {
		fbCanvasObj.saveLabel( this.value, Utilities.USE_LAST_SELECTION ) ;
		fbCanvasObj.hideEditLabel() ;
	}) ;



	// [REMOVED] The #dialog-splits initialization is now handled by the new native dialog implementation.

	// [REMOVED] The #dialog-properties initialization is now handled by the new native dialog implementation.



	// [REMOVED] The #dialog-iterate initialization is now handled by the new native dialog implementation.

	document.querySelector("#dialog-splits #split-ok-button").addEventListener('click', function() {
		var num_splits = parseInt(document.getElementById('split-slider-field').value);
		var vert_horiz = document.querySelector('input[name="vert_horiz"]:checked').value;
		var whole_part = document.querySelector('input[name="whole_part"]:checked').value;
		fbCanvasObj.addUndoState();
		fbCanvasObj.makeSplits(num_splits, vert_horiz, whole_part);
		document.getElementById('dialog-splits').close();
	});

	document.querySelector("#dialog-splits #split-cancel-button").addEventListener('click', function() {
		document.getElementById('dialog-splits').close();
	});

	document.querySelector("#dialog-properties button[value='ok']").addEventListener('click', function() {
		Utilities.flag[0] = document.getElementById("same").checked;
		Utilities.flag[1] = document.getElementById("two_horiz").checked;
		document.getElementById('dialog-properties').close();
	});

	document.querySelector("#dialog-properties button[value='cancel']").addEventListener('click', function() {
		document.getElementById('dialog-properties').close();
	});

	document.querySelector("#dialog-iterate button[value='ok']").addEventListener('click', function() {
		var num_iterations = parseInt(document.getElementById('iterate-field').value);
		var vert_horiz = document.querySelector('input[name="vert_horiz_iterate"]:checked').value;
		fbCanvasObj.addUndoState();
		fbCanvasObj.makeIterations(num_iterations, vert_horiz);
		document.getElementById('dialog-iterate').close();
	});

	document.querySelector("#dialog-iterate button[value='cancel']").addEventListener('click', function() {
		document.getElementById('dialog-iterate').close();
	});

	document.querySelector("#dialog-make button[value='ok']").addEventListener('click', function() {
		var num_whole = parseFloat(document.getElementById("whole-field").value) || 0;
		var num_num = parseFloat(document.getElementById("num-field").value) || 0;
		var num_denum = parseFloat(document.getElementById("denum-field").value) || 1;

		var num_frac = num_whole + (num_num / num_denum);
		if (!num_frac) {
			alert("Please input fraction!");
		} else {
			fbCanvasObj.makeMake(num_frac);
		}

		document.getElementById('whole-field').value = "";
		document.getElementById('num-field').value = "";
		document.getElementById('denum-field').value = "";
		document.getElementById('dialog-make').close();
	});

	document.querySelector("#dialog-make button[value='cancel']").addEventListener('click', function() {
		document.getElementById('dialog-make').close();
	});

});

function showAllButtons() {
	while(hiddenButtons.length >0) {
		thing = hiddenButtons.pop();
		thing.style.display = 'inline';
	}
	hiddenButtons = [];
	hiddenButtonsName = [];
}

function SaveScreen() {
	var r=window.confirm("Do you want to save?");
	if (r==true)
	{
		fbCanvasObj.save();
	}
}

function showButton(item) {
    var index = hiddenButtonsName.indexOf(item);
    if (index > -1) {
        var button = hiddenButtons[index];
        button.style.display = 'inline';
        hiddenButtons.splice(index, 1);
        hiddenButtonsName.splice(index, 1);
    }
}

function hideButton(item) {
	if (hiddenButtonsName.indexOf(item) < 0) {
		var hidden = document.getElementById(item);
		if (hidden) {
			hidden.style.display = 'none';
			hiddenButtonsName.push(item);
			hiddenButtons.push(hidden);
		}
	}
}

function handleFileSelect(event) {
	document.getElementById("dialog-file").close();
	var files = event.target.files;
	if (files.length === 0) {return;}

//First attempt
	Utilities.file_list=event.target.files;
  Utilities.file_index=0;

	var aFile = files[0];
	readFileOpen(aFile);
  //
}

//First attempt
function handleListSelect(event) {
  Utilities.file_index= document.getElementById('id_filetext').selectedIndex;
	a_files = Utilities.file_list;

//	SaveScreen();
	fbCanvasObj.save();

	var aFileIndex=Utilities.file_index;
	var aFile = a_files[aFileIndex];
	readFileOpen(aFile);

}
//

function nextSelectFile(){
	//  SaveScreen();
		fbCanvasObj.save();

		var n_files = Utilities.file_list;
		Utilities.file_index = Utilities.file_index+1;
		document.getElementById('id_filetext').selectedIndex = Utilities.file_index;

		var nFileIndex=Utilities.file_index;
		var nFile = n_files[nFileIndex];
		readFileOpen(nFile);
}

function previousSelectFile(){
	  //SaveScreen();
		fbCanvasObj.save();

		var p_files = Utilities.file_list;
		Utilities.file_index = Utilities.file_index-1;
		document.getElementById('id_filetext').selectedIndex = Utilities.file_index;

		var pFileIndex=Utilities.file_index;
		var pFile = p_files[pFileIndex];
		readFileOpen(pFile);
}

//First attempt
function readFileOpen(oFile){
	showAllButtons();

// reset undo and redo
	fbCanvasObj.mUndoArray = [];
	fbCanvasObj.mRedoArray = [];

	FBFileReader.readAsText(oFile);
	FBFileReader.onload = function (oFile) {
	   fbCanvasObj.handleFileEvent(oFile);
	}
	showSelectList();
}
//


//First attempt
function showSelectList() {
	f_files = Utilities.file_list;
  var first = document.getElementById('id_filetext');
  var b_title= document.getElementById('bar_titles');
	var file_length = f_files.length;
	var select_length = document.getElementById('id_filetext').selectedIndex;
	var s_files = Utilities.file_list[Utilities.file_index];
	select_length = select_length + 1;
	document.title =  s_files.name;
	b_title.innerHTML=": "+s_files.name;

  if(file_length===1){
		hideButton("id_filetext");
		hideButton("action_previous");
		hideButton("action_next");
	}
	else if (file_length===select_length){
		showButton("id_filetext");
		showButton("action_previous");
		hideButton("action_next");
	}
	else if (select_length===1 || select_length===0){
		showButton("id_filetext");
		hideButton("action_previous");
		showButton("action_next");
	}
	else {
		showButton("id_filetext");
	  showButton("action_previous");
	  showButton("action_next");
	}

	first.innerHTML='';
	for (var i=0, f1; f1=f_files[i]; i++) {
			if (s_files.name !== f1.name ) {
					first.innerHTML=first.innerHTML+'<option value="' + f1.name + '">' + f1.name +'</option>';
			}
			else {
				first.innerHTML=first.innerHTML+'<option value="' + f1.name + '"selected>' + f1.name +'</option>';
			}
	}
}
//


function resetFormElement(e) {
	e.value = '';
}


// for debugging

function updateMouseLoc(e, elem) {
	var rect = elem.getBoundingClientRect();
	x = e.clientX - rect.left;
	y = e.clientY - rect.top;
	offsetX = rect.left;
	offsetY	= rect.top;
	/*
	document.getElementById('mouseLoc').textContent = x + ', ' + y + ' | ' + offsetX  + ', ' + offsetY + ' | ' + window.pageXOffset  + ', ' + window.pageYOffset;
	*/
}

function updateMouseAction(actionName) {
	/*
	document.getElementById('mouseAction').textContent = actionName;
	*/
}
