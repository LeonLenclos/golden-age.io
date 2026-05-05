import {new_vector as V} from './vector.js';
import {createNoise2D} from 'simplex-noise';
import {Gold, Water, Unit} from './entity.js';
import {find_path} from './path.js';
const DEFAULT_SIZE = V(20, 15)
const GOLD_NOISE_SCALE = 2.5;
const GOLD_NOISE_THRESHOLD = .75;
const WATER_NOISE_SCALE = .2;
const WATER_LEVEL = .1;
const PLAINS_LEVEL = .35;
const WATER_NOISE_POWER = 5;

export class World {
  constructor(){
    this.size = DEFAULT_SIZE;
    this.entities = [];
    this.events = [];
    this.protected_path = undefined;
    this.start_positions = [];

    const water_noise = createNoise2D();
    const gold_noise = createNoise2D();

    const symetric = (pos) => this.size.subtract(pos).subtract(V(1,1));
    const gold_at = (pos) => {
      pos = pos.multiply (GOLD_NOISE_SCALE);
      let noise = ((1+gold_noise(pos.x,pos.y))/2);
      let gold_intensity = (noise-GOLD_NOISE_THRESHOLD)/(1-GOLD_NOISE_THRESHOLD)
      return Math.max(0, gold_intensity);
    }

    const water_at = (pos) => {
      let level = 1;
      level *= Math.sin(Math.PI*pos.x/this.size.x);
      level *= Math.sin(Math.PI*pos.y/this.size.y);
      level = Math.min(level, PLAINS_LEVEL)
      pos = pos.multiply(WATER_NOISE_SCALE);
      let noise = ((1+water_noise(pos.x,pos.y))/2);
      level -= (noise**WATER_NOISE_POWER)*0.9;
      return level <= WATER_LEVEL;
    }


    for (var x = 0; x < this.size.x; x++) {
      for (var y = 0; y < this.size.y; y++) {
        let pos = V(x, y);
        if (water_at(pos) || water_at(symetric(pos))){
          this.add_entity(new Water(pos));
        }
      }
    }


    for (var x = 3; x < this.size.x-3; x++) {
      for (var y = 3; y < this.size.y-3; y++) {
        let pos = V(x,y);
        if(!this.is_free(pos)) continue;
        this.protected_path = find_path(pos, symetric(pos), this);
        if(this.protected_path) {
          this.start_positions = [pos, symetric(pos)];
          break;
        }
      }
      if(this.protected_path) break;
    }

    if(!this.protected_path){
      let center = this.size.multiply(.5).floor();
      this.protected_path = [];
      for (var x = center.x-1; x < center.x+1; x++) {
        for (var y = center.y-1; y < center.y+1; y++) {
          let pos = V(x,y);
          this.protected_path.push(pos);
          this.start_positions.push(pos);
          this.entities = this.entities.filter(e=>!e.pos.equals(pos))
        }
      }
    }

    for (var x = 0; x < this.size.x; x++) {
      for (var y = 0; y < this.size.y; y++) {
        let pos = V(x, y);

        let level = (gold_at(pos) + gold_at(symetric(pos)))/2
        if (level > 0 && this.is_spawnable(pos)){
          let gold = new Gold(pos)
          gold.set_size(level)
          this.add_entity(gold);
        }
      }
    }
  }

  get_state(){
    return {
      size:this.size,
      entities:this.entities.filter(e=>e.hp>0).map(e=>e.get_state()),
      events:this.events.map((e)=>e.get_state())
    };
  }

  get_start_pos(){
    for (var pos of this.start_positions) {
      if(this.is_free(pos)) return pos;
    }
  }

  get_entity(id){
    return this.entities.find(e=>e.id==id)
  }

  get_entities_at(pos){
    return this.entities.filter(e=>e.pos.equals(pos));
  }

  is_water(pos){
    return this.get_entities_at(pos).some(e=>e instanceof Water);
  }

  is_inside(pos){
    return pos.x >= 0 && pos.y >= 0 && pos.x < this.size.x && pos.y < this.size.y;
  }

  is_free(pos){
    return this.get_entities_at(pos).length==0 && this.is_inside(pos);
  }

  is_walkable_for(pos, owner){
    let blocking_entities = this.get_entities_at(pos).some(e=>{
      return e instanceof Water || (owner && e instanceof Unit && owner.own(e))
    });
    return !blocking_entities && this.is_inside(pos);
  }

  is_spawnable(pos){
    return this.is_free(pos)
      && !this.start_positions.some(p=>p.equals(pos))
      && !this.protected_path.some(p=>p.equals(pos));
  }

  update(){
    this.events = this.events.filter(e=>!e.done);
    this.entities = this.entities.filter(e=>e.is_alive());

    this.entities.forEach((e) => e.update());
    this.entities.forEach((e) => e.walk());
    this.entities.forEach((e) => e.do());
    this.events.forEach((e) => e.update());
  }

  add_entity(entity){
    this.entities.push(entity);
    entity.world=this;
  }

  add_event(event){
    this.events.push(event);
  }

}
