import {new_vector as V} from './vector.js';
import {createNoise2D} from 'simplex-noise';
import {Gold, Water} from './entity.js';
import {find_path} from './path.js';
const DEFAULT_SIZE = V(20, 15)
const GOLD_NOISE_SCALE = 2.5;
const GOLD_NOISE_THRESHOLD = .5;
const WATER_NOISE_SCALE = .2;
const WATER_LEVEL = .1;
const PLAINS_LEVEL = .35;
const WATER_NOISE_POWER = 4;

export class World {
  constructor(){
    this.size = DEFAULT_SIZE;
    this.entities = [];
    this.protected_path = undefined;
    this.start_positions = [];

    const water_noise = createNoise2D();
    const gold_noise = createNoise2D();

    const symetric = (pos) => this.size.subtract(pos).subtract(V(1,1));
    const gold_at = (pos) => {
      pos = pos.multiply (GOLD_NOISE_SCALE);
      return gold_noise(pos.x,pos.y) > GOLD_NOISE_THRESHOLD;
    }

    const water_at = (pos) => {
      let level = 1;
      level *= Math.sin(Math.PI*pos.x/this.size.x);
      level *= Math.sin(Math.PI*pos.y/this.size.y);
      level = Math.min(level, PLAINS_LEVEL)
      pos = pos.multiply(WATER_NOISE_SCALE);
      level *= (1+water_noise(pos.x,pos.y)/2)**WATER_NOISE_POWER;
      return level < WATER_LEVEL;
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

        if ((gold_at(pos) || gold_at(symetric(pos))) && this.is_spawnable(pos)){
          this.add_entity(new Gold(pos));
        }
      }
    }
  }

  get_state(){
    return {
      size:this.size,
      entities:this.entities.map((e)=>e.get_state())
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

  is_spawnable(pos){
    return this.is_free(pos)
      && !this.start_positions.some(p=>p.equals(pos))
      && !this.protected_path.some(p=>p.equals(pos));
  }

  update(){
    this.entities = this.entities.filter(e=>e.is_alive());
    this.entities.forEach((e) => e.update());
    this.entities.forEach((e) => e.walk());
    this.entities.forEach((e) => e.do());
  }

  add_entity(entity){
    this.entities.push(entity);
    entity.world=this;
  }
}
