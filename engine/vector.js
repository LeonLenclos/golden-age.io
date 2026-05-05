// A simple 2D vector class

export function new_vector(x, y){
  return new Vector(x, y);
}

export class Vector {
	constructor(x,y){
		this.x = x || 0;
		this.y = y || 0;
	}

  copy(){
    return new Vector(this.x, this.y);
  }

	toString() {
		return "(" + this.x + ", " + this.y + ")";
	}

	add(vector) {
		return new Vector(this.x + vector.x, this.y + vector.y);
	}

	subtract(vector) {
		return this.add(vector.negate());
	}

	negate() {
    return this.map(x=>-x);
	}

	dot(vector) {
		return this.x * vector.x + this.y * vector.y;
	}

	length() {
		return Math.sqrt(this.dot(this));
	}

	multiply(scalar) {
    return this.map(x=>x*scalar);
	}

	divide(scalar) {
		if(scalar == 0)
			return new Vector(0, 0);
		else
			return this.multiply(1 / scalar);
	}

	normalize() {
		return this.divide(this.length());
	}

	angle() {
		return Math.atan2(this.y, this.x);
	}

	rotate(a) {
	  return this.fromAngle(a+this.angle(), this.length());
	};

	fromAngle(angle, length = 1) {
		return new Vector(Math.cos(angle) * length, Math.sin(angle) * length);
	}

	constrainLength(length) {
		return this.normalize().multiply(Math.min(this.length(), length)
		);
	}

	constrain(min, max) {
		return new Vector(
			Math.min(Math.max(this.x, min.x), max.x),
			Math.min(Math.max(this.y, min.y), max.y)
		);
	}

  map(func){
    return new Vector(func(this.x), func(this.y));
  }

	floor(){
    return this.map(Math.floor);
	}

  equals(vector){
    return this.x == vector.x && this.y == vector.y
  }


  neighbors(){
    return [this.add(new Vector(1, 0)), this.add(new Vector(-1, 0)),
            this.add(new Vector(0, 1)), this.add(new Vector(0, -1))];
  }

  manhattan(vector){
    return Math.abs(vector.x-this.x)+Math.abs(vector.y-this.y)
  }
}
