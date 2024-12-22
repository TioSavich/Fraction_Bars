export default class Point {
    constructor() {
        this.x = null;
        this.y = null;
    }

    equals(p) {
        let _output = false;
        if (p) {
            _output = (p.x === this.x && p.y === this.y);
        }
        return _output;
    }

    isOnLine(line) {
        let onLine;
        if (line.x1 === line.x2) {
            onLine = (this.x === line.x1) && (this.y >= Math.min(line.y1, line.y2)) && (this.y <= Math.max(line.y1, line.y2));
        } else {
            onLine = (this.y === line.y1) && (this.x >= Math.min(line.x1, line.x2)) && (this.x <= Math.max(line.x1, line.x2));
        }
        return onLine;
    }

    static createFromMouseEvent(e, elem) {
        const p = new Point();
        p.x = Math.round((e.clientX - elem.position().left) + window.pageXOffset);
        p.y = Math.round((e.clientY - elem.position().top) + window.pageYOffset);
        return p;
    }

    static subtract(p1, p2) {
        const p = new Point();
        p.x = p1.x - p2.x;
        p.y = p1.y - p2.y;
        return p;
    }

    static add(p1, p2) {
        const p = new Point();
        p.x = p1.x + p2.x;
        p.y = p1.y + p2.y;
        return p;
    }

    static multiply(p1, p2) {
        const p = new Point();
        p.x = p1.x * p2.x;
        p.y = p1.y * p2.y;
        return p;
    }

    static min(p1, p2) {
        const p = new Point();
        p.x = Math.min(p1.x, p2.x);
        p.y = Math.min(p1.y, p2.y);
        return p;
    }
}