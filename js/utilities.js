export const flag = [false, false, false, false];
export const USE_CURRENT_SELECTION = 'useCurrent';
export const USE_LAST_SELECTION = 'useLast';

export function createFraction(numerator, denominator) {
    const v = numerator / denominator;
    let f = v;
    let n1 = 1;
    let d1 = 0;
    let n2 = 0;
    let d2 = 1;
    let a, n, d;
    const max_terms = 30;
    const min_divisor = 0.000001;
    const max_error = 0.00001;
    for (let i = 0; i < max_terms; i++) {
        a = Math.round(f);
        f = f - a;
        n = n1 * a + n2;
        d = d1 * a + d2;

        n2 = n1;
        d2 = d1;

        n1 = n;
        d1 = d;

        if (f < min_divisor && Math.abs(v - n / d) < max_error) {
            break;
        }

        f = 1 / f;
    }

    if (Math.floor(v) === v) {
        return v;
    } else {
        return Math.abs(n) + "/" + Math.abs(d);
    }
}

export function getMarkedIterateFlag() {
    return document.getElementById('marked-iterate').dataset.flag === "true";
}