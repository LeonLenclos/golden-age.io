export class Event {

  static type = 'event';

  constructor(pos, owner, secondary_type){
    this.pos = pos;
    this.owner = owner;
    this.secondary_type = secondary_type;
    this.done = false;
  }

  update(){
    this.done = true;
  }

  get_state() {
    return {
      pos:this.pos,
      owner:this.owner?.id,
      type:this.constructor.type,
      secondary_type:this.secondary_type,
    }
  }
}


export class Kill extends Event {
    static type = 'kill';
}

export class New extends Event {
    static type = 'new';
}