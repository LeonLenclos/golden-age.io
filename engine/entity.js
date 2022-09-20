import urid from 'urid';
import {
  Action,
  Walk,
  Mine,
  Attack,
  Defend,
  Repair,
  Reside,
  Create,
} from './action.js';

import {find_nearest_path} from './path.js';



// unused
function random_stat(min, max, dices){
  dices = dices || 5;
    let result = 0;
    for(let i= 0; i< dices; i++) result += Math.random();
    return Math.floor((result/dices)*(max-min+1))+min
}




export class Entity {

  static type = 'entity';
  static hp = 1;
  static actions = [];

  constructor(pos, owner){
    this.pos = pos;
    this.owner = owner;
    this.hp = this.hp_max = this.constructor.hp;
    this.id = urid();
    this.state = undefined;
    this.under_construction = false;
    this.actions = [];
    this.creations = [];
    this.mission = undefined;
    this.creation = undefined;
  }

  set_creation(type){
    if(this.creation) return;
    let constructor = this.creations.find(A=>A.type == type);
    if(!this.can_create(constructor)) return;
    this.creation = new constructor(this.pos, this.owner);
    this.creation.start_construction();

  }

  start_construction(){
    this.cost_payed = false;
    this.hp = 1;
    this.under_construction = true;
  }

  set_sprite(sprite){
    this.sprite = sprite;
  }

  is_alive(){
    return this.hp>0;
  }

  hit(damage){
    return this.hp=Math.max(0,this.hp-damage);
  }

  walk(){
    let action = new Walk(this);
    this.prev_pos = this.pos.copy();
    if(action.is_possible()){
      action.do();
    }
  }

  do(){
    let done = [];
    for (var i = 0; i < this.actions.length; i++) {
      let constructor = this.actions[i];
      let action = new constructor(this);
      if(action.is_possible() && done.indexOf(constructor>=0)){
        action.do();
        done.push(constructor);
        // i = 0;
        break;
      }
    }
  }

  update(){
    this.set_sprite();

    if(this.under_construction && this.hp >= this.hp_max){
      this.under_construction = false;
    }

    if(!this.world) return;


  }

  can_create(constructor){
    return constructor.cost <= this.owner.gold;
  }

  get_state() {
    return {
      pos:this.pos,
      prev_pos:this.prev_pos,
      owner:this.owner?.id,
      type:this.constructor.type,
      sprite:this.sprite,
      id:this.id,
      hp:this.hp,
      hp_max:this.hp_max,
      under_construction: this.under_construction,
      building: this instanceof Building,
      mission:this.mission?.get_state(),
      creations:this.creations?.map(a=>{return{
        type:a.type,
        cost:a.cost,
        possible:!this.creation && this.can_create(a),
      };})

    }
  }
}



export class Gold extends Entity {
  static type = 'gold';
  static hp = 10;
  static cost = 0;

  constructor(pos, owner){
    super(pos)
    let level = Math.floor(1+Math.random()*5)
    this.hp_max = this.hp = Gold.hp * level;

  }
}



export class Water extends Entity {
  static type = 'water';

}




export class Unit extends Entity {
  static type = 'unit';
  static hp = 10;
  static cost = 10;

  constructor(pos, owner){
    super(pos, owner);
    this.creations = [House, Factory];
    this.actions = [Create, Defend, Attack, Mine, Repair, Reside];
  }

  get_force(){
    let is_ally = e => e.owner==this.owner
    let some_ally_at = pos => this.world.get_entities_at(pos).some(is_ally)
    let allies = this.pos.neighbors().filter(some_ally_at).length
    return (allies+1)/5;
  }

  get_state() {
    let state = super.get_state();
    return state;
  }

  set_target(pos){
    this.target = pos;
    this.path = find_nearest_path(this.pos, this.target, this.world);
  }

  get_residence(){
    if(!this.world) return;
    let entities = this.world.get_entities_at(this.pos);
    return entities.find(e=>(e instanceof Building) && e.owner==this.owner && !e.under_construction);
  }

  can_create(constructor){
    return super.can_create(constructor) &&  this.world.get_entities_at(this.pos).length == 1;

  }

  update(){
    super.update();

  }
}


export class Building extends Entity {
  static type = 'building';

  constructor(pos, owner){
    super(pos, owner);
    this.actions = [Create];
  }

  can_create(constructor){
    return super.can_create(constructor) && Boolean(this.get_resident());

  }

  get_resident(){
    let entities = this.world.get_entities_at(this.pos);
    return entities.find(e=>(e instanceof Unit) && e.owner==this.owner);
  }

  get_state() {
    let state = super.get_state();
    state.creation_progress = 0;
    if(this.creation) {
      state.creation_progress = this.creation.hp/this.creation.hp_max;
    }
    return state;
  }
}


export class House extends Building {
  static type = 'house';
  static hp = 10;
  static cost = 50;

  constructor(pos, owner){
    super(pos, owner);
    this.creations = [Unit];
  }
}


export class Factory extends Building {
  static type = 'factory';
  static hp = 10;
  static cost = 50;

  constructor(pos, owner){
    super(pos, owner);
    this.creations = [Gold];
  }
}
