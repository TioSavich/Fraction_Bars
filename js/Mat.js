import Point from './Point.js';

export default class Mat {
    constructor() {
        this.x = null;
        this.y = null;
        this.w = null;
        this.h = null;
        this.size = null;
        this.color = null;
        this.type = null;
        this.isSelected = false;
    }

    copy(with_offset) {
        let offset = 10;
        let b = new Mat();

        if (with_offset === false) {
            offset = 0;
        }

        b.x = this.x + offset;
        b.y = this.y + offset;
        b.w = this.w;
        b.h = this.h;
        b.size = this.size;
        b.color = this.color;
        b.type = this.type;
        b.isSelected = true;

        return b;
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

    static create(x, y, w, h, type, color) {
        const b = new Mat();
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
        const b = Mat.create(p.x, p.y, w, h, type, color);
        return b;
    }

    static distanceBetween(b1, b2) {
        const p = new Point();
        let totalDistance = Math.max(b1.x + b1.w, b2.x + b2.w) - Math.min(b1.x, b2.x);
        p.x = totalDistance - b1.w - b2.w;
        totalDistance = Math.max(b1.y + b1.h, b2.y + b2.h) - Math.min(b1.y, b2.y);
        p.y = totalDistance - b1.h - b2.h;
        return p;
    }

    static copyFromJSON(JSON_Mat) {
        const b = new Mat();
        b.x = JSON_Mat.x;
        b.y = JSON_Mat.y;
        b.w = JSON_Mat.w;
        b.h = JSON_Mat.h;
        b.size = JSON_Mat.size;
        b.color = JSON_Mat.color;
        b.type = JSON_Mat.type;
        b.isSelected = false;

        return b;
    }
}
