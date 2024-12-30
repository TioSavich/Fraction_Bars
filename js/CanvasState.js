import Bar from './Bar.js';
import Mat from './Mat.js';

export default class CanvasState {
    constructor() {
        this.canvasState = null;

        this.mBars = [];
        this.mMats = [];
        this.mUnitBar = null;
        this.mHidden = [];
    }

    grabBarsAndMats(fractionBarsCanvas) {
        let aBar = null;

        for (let i = 0; i < fractionBarsCanvas.bars.length; i++) {
            aBar = fractionBarsCanvas.bars[i].copy(false);
            this.mBars.push(aBar);
            if (fractionBarsCanvas.bars[i] === fractionBarsCanvas.unitBar) {
                this.mUnitBar = aBar;
            }
            if (fractionBarsCanvas.bars[i].isSelected) {
                aBar.isSelected = true;
            } else {
                aBar.isSelected = false;
            }
            if (fractionBarsCanvas.bars[i].isUnitBar) {
                aBar.isUnitBar = true;
            }
        }

        for (let j = 0; j < fractionBarsCanvas.mats.length; j++) {
            this.mMats.push(fractionBarsCanvas.mats[j].copy(false));
        }
        this.mHidden = [...fractionBarsCanvas.hiddenButtonsName];
    }
}
