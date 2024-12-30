import { createFraction, getMarkedIterateFlag } from './utilities.js';
import Point from './Point.js';
import Split from './Split.js';

export default class Bar {
    constructor() {
        this.x = null;
        this.y = null;
        this.w = null;
        this.h = null;
        this.size = null;
        this.color = null;
        this.splits = [];
        this.label = '';
        this.isUnitBar = false;
        this.fraction = '';
        this.type = null;
        this.isSelected = false;
        this.repeatUnit = null;
        this.selectedSplit = null;
    }

    measure(targetBar) {
        this.fraction = createFraction(this.size, targetBar.size);
    }

    clearMeasurement() {
        this.fraction = '';
    }

    addSplit(x, y, w, h, c) {
        this.addSplitToList(this.splits, x, y, w, h, c);
    }

    addSplitToList(list, x, y, w, h, c) {
        const split = new Split(x, y, w, h, c);
        if (this.splits.length > 0) {
            for (let existingSplit of this.splits) {
                if (split.equals(existingSplit)) {
                    return;
                }
            }
        }
        list.push(split);
    }

    clearSplits() {
        this.splits = [];
    }

    copySplits() {
        const splitsCopy = [];
        for (let split of this.splits) {
            splitsCopy.push(split.copy());
        }
        return splitsCopy;
    }

    hasSelectedSplit() {
        return this.splits.some(split => split.isSelected);
    }

    updateColorOfSelectedSplit(in_color) {
        for (let split of this.splits) {
            if (split.isSelected) {
                split.color = in_color;
            }
        }
    }

    clearSplitSelection() {
        this.selectedSplit = null;
        for (let split of this.splits) {
            split.isSelected = false;
        }
    }

    updateSplitSelectionFromState() {
        this.selectedSplit = null;
        for (let split of this.splits) {
            if (split.isSelected) {
                this.selectedSplit = split;
            }
        }
    }

    selectSplit(mouse_loc) {
        this.selectedSplit = this.splitClickedOn(mouse_loc);
    }

    findSplitForPoint(p) {
        for (let i = this.splits.length - 1; i >= 0; i--) {
            const split = this.splits[i];
            if (p.x > split.x + this.x &&
                p.x < split.x + this.x + split.w &&
                p.y > split.y + this.y &&
                p.y < split.y + this.y + split.h) {
                return split;
            }
        }
        return null;
    }

    splitClickedOn(mouse_loc) {
        for (let i = this.splits.length - 1; i >= 0; i--) {
            const split = this.splits[i];
            if (mouse_loc.x > this.x + split.x &&
                mouse_loc.x < this.x + split.x + split.w &&
                mouse_loc.y > this.y + split.y &&
                mouse_loc.y < this.y + split.y + split.h) {
                this.clearSplitSelection();
                split.isSelected = true;
                return split;
            }
        }
        return null;
    }

    removeASplit(split) {
        this.splits = this.splits.filter(s => s !== split);
    }

    splitBarAtPoint(split_point, vert_split) {
        const the_split = this.findSplitForPoint(split_point);

        if (the_split) {
            if (vert_split) {
                this.addSplit(the_split.x, the_split.y, the_split.w, split_point.y - (this.y + the_split.y), the_split.color);
                this.addSplit(the_split.x, split_point.y - this.y, the_split.w, the_split.h - (split_point.y - (this.y + the_split.y)), the_split.color);
            } else {
                this.addSplit(the_split.x, the_split.y, split_point.x - (this.x + the_split.x), the_split.h, the_split.color);
                this.addSplit(split_point.x - this.x, the_split.y, the_split.w - (split_point.x - (this.x + the_split.x)), the_split.h, the_split.color);
            }
            this.removeASplit(the_split);
        } else if (this.splits.length === 0) {
            if (vert_split) {
                this.addSplit(0, 0, this.w, split_point.y - this.y, this.color);
                this.addSplit(0, split_point.y - this.y, this.w, this.y + this.h - split_point.y, this.color);
            } else {
                this.addSplit(0, 0, split_point.x - this.x, this.h, this.color);
                this.addSplit(split_point.x - this.x, 0, this.x + this.w - split_point.x, this.h, this.color);
            }
        }
    }

    initialSplits(num_splits, vert_direction) {
        let split_interval = 0;
        let x = 0;
        let y = 0;

        if (vert_direction) {
            split_interval = this.w / num_splits;
            for (let i = 0; i < num_splits; i++) {
                x = i * split_interval;
                this.addSplit(x, y, split_interval, this.h, this.color);
            }
        } else {
            split_interval = this.h / num_splits;
            for (let i = 0; i < num_splits; i++) {
                y = i * split_interval;
                this.addSplit(x, y, this.w, split_interval, this.color);
            }
        }
    }

    splitSelectedSplit(num_splits, vert_direction) {
        this.updateSplitSelectionFromState();
        if (!this.selectedSplit) return;

        let split_interval = 0;
        let x = this.selectedSplit.x;
        let y = this.selectedSplit.y;

        if (vert_direction) {
            split_interval = this.selectedSplit.w / num_splits;
            for (let i = 0; i < num_splits; i++) {
                x = i * split_interval + this.selectedSplit.x;
                this.addSplit(x, y, split_interval, this.selectedSplit.h, this.selectedSplit.color);
            }
        } else {
            split_interval = this.selectedSplit.h / num_splits;
            for (let i = 0; i < num_splits; i++) {
                y = i * split_interval + this.selectedSplit.y;
                this.addSplit(x, y, this.selectedSplit.w, split_interval, this.selectedSplit.color);
            }
        }

        this.splits = this.splits.filter(split => split !== this.selectedSplit);
    }

    wholeBarSubSplit(a_split, vert_direction, subsplit_interval) {
        const new_subsplit_list = [];
        let split_hit = false;
        let lower_bound = 0;
        let upper_bound = 0;
        let corrected_interval = 0;
    
        if (vert_direction) {
            for (let i = subsplit_interval; Math.floor(i) <= this.w; i += subsplit_interval) {
                if (((i > a_split.x) && (i < a_split.x + a_split.w)) ||
                    ((i - subsplit_interval > a_split.x) && (i - subsplit_interval < a_split.x + a_split.w))) {
                    split_hit = true;
                    lower_bound = (a_split.x > (i - subsplit_interval)) ? a_split.x : (i - subsplit_interval);
                    upper_bound = ((a_split.x + a_split.w) < i) ? a_split.x + a_split.w : i;
                    corrected_interval = upper_bound - lower_bound;
                    this.addSplitToList(new_subsplit_list, lower_bound, a_split.y, corrected_interval, a_split.h, a_split.color);
                }
            }
        } else {
            for (let i = subsplit_interval; Math.floor(i) <= this.h; i += subsplit_interval) {
                if (((i > a_split.y) && (i < a_split.y + a_split.h)) ||
                    ((i - subsplit_interval > a_split.y) && (i - subsplit_interval < a_split.y + a_split.h))) {
                    split_hit = true;
                    lower_bound = (a_split.y > (i - subsplit_interval)) ? a_split.y : (i - subsplit_interval);
                    upper_bound = ((a_split.y + a_split.h) < i) ? a_split.y + a_split.h : i;
                    corrected_interval = upper_bound - lower_bound;
                    this.addSplitToList(new_subsplit_list, a_split.x, lower_bound, a_split.w, corrected_interval, a_split.color);
                }
            }
        }
        if (!split_hit) {
            new_subsplit_list.push(a_split);
        }
        return new_subsplit_list;
    }

    wholeBarSplits(num_splits, vert_direction) {
        let new_splits_list = [];
        let split_interval = 0;
        let list_passback = [];

        if (this.splits.length === 0) {
            this.initialSplits(num_splits, vert_direction);
        } else {
            if (vert_direction) {
                split_interval = this.w / num_splits;
            } else {
                split_interval = this.h / num_splits;
            }

            for (let i = this.splits.length - 1; i >= 0; i--) {
                list_passback = this.wholeBarSubSplit(this.splits[i], vert_direction, split_interval);
                new_splits_list = new_splits_list.concat(list_passback);
            }

            this.clearSplits();
            this.splits = new_splits_list;
        }
    }

    breakApart() {
        const newBars = [];
        if (this.splits.length === 0) {
            const aBar = this.copy(false);
            aBar.isSelected = false;
            newBars.push(aBar);
        } else {
            for (let split of this.splits) {
                newBars.push(Bar.create(this.x + split.x, this.y + split.y, split.w, split.h, 'bar', split.color));
            }
        }
        return newBars;
    }

    copy(with_offset) {
        const offset = (with_offset === false || this.currentAction === "repeat") ? 0 : 10;
        const b = new Bar();
        b.x = this.x + offset;
        b.y = this.y + offset;
        b.w = this.w;
        b.h = this.h;
        b.size = this.size;
        b.color = this.color;
        b.splits = this.copySplits();
        b.label = this.label;
        b.isUnitBar = false;
        b.fraction = this.isUnitBar ? "" : this.fraction;
        b.type = this.type;
        b.isSelected = true;
        b.repeatUnit = this.repeatUnit;
        return b;
    }

    makeCopy() {
        const b = new Bar();
        b.x = this.x;
        b.y = this.y;
        b.w = this.w;
        b.h = this.h;
        b.size = this.size;
        b.color = this.color;
        b.splits = this.copySplits();
        b.label = this.label;
        b.isUnitBar = false;
        b.fraction = this.fraction;
        b.type = this.type;
        b.isSelected = false;
        return b;
    }
    
    makeNewCopy(with_height) {
        const b = new Bar();    
        b.x = this.x;
        b.y = this.y + this.h + 10;
        b.w = this.w * with_height;
        b.h = this.h;
        b.size = this.size * with_height;
        b.color = this.color;
        b.isUnitBar = false;
        b.type = this.type;
        b.isSelected = false;
        this.isSelected = false;
        return b;
    }
    

    repeat(clickLoc) {
        let govert = false;
        if (this.repeatUnit) {
            if (govert) {
                this.repeatUnit.x -= 5;
            } else {
                this.repeatUnit.y -= 5;
            }
            this.join(this.repeatUnit);
            if ((this.splits.length === 2) && (this.repeatUnit.splits.length === 0) && getMarkedIterateFlag()) {
                this.splits[1].color = this.splits[0].color;
            }
        } else {
            alert("Tried to Repeat when no repeatUnit was set.");
        }
    }

    iterate(iterate_num, vert) {
        const offset = 3;
        let i_iter = 0;
        const iterate_unit = this.makeCopy();
    
        if (vert) {
            iterate_unit.y += offset;
        } else {
            iterate_unit.x += offset;
        }
    
        const start_split_num = this.splits.length;
        for (i_iter = 1; i_iter < iterate_num; i_iter++) {
            this.join(iterate_unit);
        }
    }

    join(b) {
        if (!b) {
            alert("No bar provided for Join function");
            return false;
        }

        const gap = Bar.distanceBetween(this, b);
        gap.x = Math.abs(gap.x);
        gap.y = Math.abs(gap.y);
        let b1, b2;
        const originalBar = this.copy(true);
        let joinDimension = '';
    
        const vertmatch = this.h === b.h;
        const horizmatch = this.w === b.w;
    
        if (!vertmatch && !horizmatch) {
            alert("To Join, bars must have a matching dimension in height or width.");
            return false;
        }
    
        if (vertmatch && horizmatch) {
            if (Math.abs(gap.x) < Math.abs(gap.y)) {
                this.h = this.h + b.h;
                joinDimension = 'w';
            } else {
                this.w = this.w + b.w;
                joinDimension = 'h';
            }
        } else {
            if (vertmatch) {
                this.w = this.w + b.w;
                joinDimension = 'h';
            } else {
                this.h = this.h + b.h;
                joinDimension = 'w';
            }
        }
    
        this.size = this.w * this.h;
        let i = 0;
        this.clearSplits();
    
        if (joinDimension === 'w') {
            if (originalBar.y < b.y) {
                b1 = originalBar;
                b2 = b;
            } else {
                b1 = b;
                b2 = originalBar;
            }
            this.x = b1.x;
            this.y = b1.y;
    
            if (b1.splits.length === 0) {
                this.addSplit(0, 0, b1.w, b1.h, b1.color);
            }
            if (b2.splits.length === 0) {
                this.addSplit(0, b1.h, b2.w, b2.h, b2.color);
            }
            if (b1.splits.length > 0) {
                for (i = 0; i < b1.splits.length; i++) {
                    this.addSplit(b1.splits[i].x, b1.splits[i].y, b1.splits[i].w, b1.splits[i].h, b1.splits[i].color);
                }
            }
            if (b2.splits.length > 0) {
                for (i = 0; i < b2.splits.length; i++) {
                    this.addSplit(b2.splits[i].x, b2.splits[i].y + b1.h, b2.splits[i].w, b2.splits[i].h, b2.splits[i].color);
                }
            }
        } else {
            if (originalBar.x < b.x) {
                b1 = originalBar;
                b2 = b;
            } else {
                b1 = b;
                b2 = originalBar;
            }
    
            this.x = b1.x;
            this.y = b1.y;
    
            if (b1.splits.length === 0) {
                this.addSplit(0, 0, b1.w, b1.h, b1.color);
            }
    
            if (b2.splits.length === 0) {
                this.addSplit(b1.w, 0, b2.w, b2.h, b2.color);
            }
    
            if (b1.splits.length > 0) {
                for (i = 0; i < b1.splits.length; i++) {
                    this.addSplit(b1.splits[i].x, b1.splits[i].y, b1.splits[i].w, b1.splits[i].h, b1.splits[i].color);
                }
            }
            if (b2.splits.length > 0) {
                for (i = 0; i < b2.splits.length; i++) {
                    this.addSplit(b2.splits[i].x + b1.w, b2.splits[i].y, b2.splits[i].w, b2.splits[i].h, b2.splits[i].color);
                }
            }
        }
        this.clearMeasurement();
        return true;
    }

    nearestEdge(p) {
        let closestEdge = 'bottom';
        let dl = p.x - this.x;
        let dr = this.w - dl;
        let dt = p.y - this.y;
        let db = this.h - dt;

        if (dl <= dr && dl <= dt && dl <= db) {
            closestEdge = "left";
        } else if (dr <= dl && dr <= dt && dr <= db) {
            closestEdge = "right";
        } else if (dt <= dl && dt <= dr && dt <= db) {
            closestEdge = "top";
        }
        return closestEdge;
    }

    toggleSelection() { }

    setRepeatUnit() {
        this.repeatUnit = this.makeCopy(true);
    }

    static create(x, y, w, h, type, color) {
        const b = new Bar();
        b.x = x;
        b.y = y;
        b.w = w;
        b.h = h;
        b.size = w * h;
        b.color = color;
        b.type = type;
        return b;
    }

    static createFromMouse(p1, p2, type, color) {
        const w = Math.abs(p2.x - p1.x);
        const h = Math.abs(p2.y - p1.y);
        const p = Point.min(p1, p2);
        const b = Bar.create(p.x, p.y, w, h, type, color);
        return b;
    }

    static createFromSplit(s, inx, iny) {
        const b = Bar.create(inx + s.x + 10, iny + s.y + 10, s.w, s.h, this.type, s.color);
        return b;
    }

    static distanceBetween(b1, b2) {
        const p = new Point();
        p.x = b2.x - b1.x;
        p.y = b2.y - b1.y;
        return p;
    }

    static copyFromJSON(JSON_Bar) {
        const b = new Bar();
        b.x = JSON_Bar.x;
        b.y = JSON_Bar.y;
        b.w = JSON_Bar.w;
        b.h = JSON_Bar.h;
        b.size = JSON_Bar.size;
        b.color = JSON_Bar.color;
        b.makeSplitsFromJSON(JSON_Bar.splits);
        b.label = JSON_Bar.label;
        b.isUnitBar = JSON_Bar.isUnitBar;
        b.fraction = JSON_Bar.fraction;
        b.type = JSON_Bar.type;
        b.isSelected = false;
        return b;
    }

    makeSplitsFromJSON(JSON_splits) {
        this.clearSplits();
        for (let i = 0; i < JSON_splits.length; i++) {
            this.addSplit(JSON_splits[i].x, JSON_splits[i].y, JSON_splits[i].w, JSON_splits[i].h, JSON_splits[i].color);
        }
    }
}
