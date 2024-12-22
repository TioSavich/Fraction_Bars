import Bar from './Bar.js';
import Mat from './Mat.js';

export default class CanvasState {
    constructor(FBCanvas) {
        this.mFBCanvas = FBCanvas;
        this.canvasState = null;

        this.mBars = [];
        this.mMats = [];
        this.mUnitBar = null;
        this.mHidden = [];
    }

    grabBarsAndMats() {
        let aBar = null;

        for (let i = 0; i < this.mFBCanvas.bars.length; i++) {
            aBar = this.mFBCanvas.bars[i].copy(false);
            this.mBars.push(aBar);
            if (this.mFBCanvas.bars[i] === this.mFBCanvas.unitBar) {
                this.mUnitBar = aBar;
            }
            if (this.mFBCanvas.bars[i].isSelected) {
                aBar.isSelected = true;
            } else {
                aBar.isSelected = false;
            }
            if (this.mFBCanvas.bars[i].isUnitBar) {
                aBar.isUnitBar = true;
            }
        }

        for (let j = 0; j < this.mFBCanvas.mats.length; j++) {
            this.mMats.push(this.mFBCanvas.mats[j].copy(false));
        }
        this.mHidden = [...this.mFBCanvas.hiddenButtonsName];
    }
}
