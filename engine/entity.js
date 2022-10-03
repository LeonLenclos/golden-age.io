import urid from 'urid';
import {
  Walk,
  Mine,
  Attack,
  Defend,
  Repair,
  Reside,
  Create,
} from './action.js';
import { New, Kill } from './events.js';

import {find_nearest_path} from './path.js';

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
    this.creation.world = this.world;
  }
  
  set_sprite(sprite){
    this.sprite = sprite;
  }

  start_construction(){
    this.cost_payed = false;
    this.hp = 1;
    this.under_construction = true;
  }


  is_alive(){
    return this.hp>0;
  }

  hit(damage){
    let new_hp = Math.max(0,this.hp-damage);
    this.hp = new_hp
    if(new_hp == 0){
      let type = this instanceof Building ? Building.type : this.constructor.type
      this.world.add_event(new Kill(this.pos, this.owner, type))
    }
    return new_hp;
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
        break;
      }
    }
  }

  update(){
    this.set_sprite();

    if(this.under_construction && this.hp >= this.hp_max){
      this.under_construction = false;
      let type = this instanceof Building ? Building.type : this.constructor.type
      this.world.add_event(new New(this.pos, this.owner, type))
  
    }

    if(!this.world) return;
  }

  can_create(constructor){
    return !this.under_construction && constructor.cost <= this.owner.gold;
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

  constructor(pos){
    super(pos)
  }

  set_size(value){
    let level = Math.floor(1+value*5)
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
}


export class Building extends Entity {
  static type = 'building';

  constructor(pos, owner){
    super(pos, owner);
    this.actions = [Create];
  }

  set_target(pos){
    this.get_resident()?.set_target(pos);
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
  static cost = 20;

  constructor(pos, owner){
    super(pos, owner);
    this.creations = [Unit];
  }
}


export class Factory extends Building {
  static type = 'factory';
  static hp = 10;
  static cost = 20;

  constructor(pos, owner){
    super(pos, owner);
    this.creations = [Gold];
  }
}
