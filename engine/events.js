export class Event {

  static type = 'event';
  static delay = 0;

  constructor(pos, owner, secondary_type){
    this.pos = pos;
    this.owner = owner;
    this.secondary_type = secondary_type;
    this.done = false;
    this.delay = this.constructor.delay;
  }

  update(){
    this.delay--;
    this.done = this.delay<0;
  }

  get_state() {
    return {
      active:this.delay==0,
      pos:this.pos,
      owner:this.owner?.id,
      type:this.constructor.type,
      secondary_type:this.secondary_type,
    }
  }
}


export class Kill extends Event {
    static type = 'kill';
    static delay = 1;
}

export class New extends Event {
    static type = 'new';
}