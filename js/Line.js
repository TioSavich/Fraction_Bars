export default class Line {
	constructor(x1, y1, x2, y2) {
		this.x1 = x1 ;
		this.y1 = y1 ;
		this.x2 = x2 ;
		this.y2 = y2 ;
	}

	equals(line) {
		let _output ;
		if( line ) {
			_output = (this.x1 == line.x1 && this.y1 == line.y1 && this.x2 == line.x2 && this.y2 == line.y2) ;
		}
		return _output ;
	}
}