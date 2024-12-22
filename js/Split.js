export default class Split {
    constructor(x, y, w, h, c) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.color = c;
        this.isSelected = false;
    }

    equals(s) {
        let _output = false;
        if (s) {
            _output = (s.x === this.x && s.y === this.y && s.w === this.w && s.h === this.h);
        }
        return _output;
    }

    copy() {
        const newsplit = new Split(this.x, this.y, this.w, this.h, this.color);
        return newsplit;
    }
}