import {new_vector as V} from './vector.js';
import {createNoise2D} from 'simplex-noise';
import {Gold} from './entity.js';

const DEFAULT_SIZE = V(15 , 15)

export class World {
  constructor(){
    this.size = DEFAULT_SIZE;
    this.entities = [];

    const gold_noise = createNoise2D();
    for (var x = 0; x < this.size.x; x++) {
    for (var y = 0; y < this.size.y; y++) {
      let pos = V(x, y);
      if (gold_noise(x/3,y/3)>0.5 && this.is_spawnable(pos)) {
        let gold = new Gold(pos);
        this.add_entity(gold);
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
    for (var pos of [V(1,1), this.size.subtract(V(2,2))]) {
      if(this.is_free(pos)) return pos;
    }
  }

  get_entity(id){
    return this.entities.find(e=>e.id==id)
  }

  get_entities_at(pos){
    return this.entities.filter(e=>e.pos.equals(pos));
  }
  is_inside(pos){
    return pos.x >= 0 && pos.y >= 0 && pos.x < this.size.x && pos.y < this.size.y;
  }

  is_free(pos){
    return this.get_entities_at(pos).length==0 && this.is_inside(pos);
  }

  is_spawnable(pos){
    let in_protected_path = ((pos.x)%((this.size.x-3)/2)<2 && (pos.x)%((this.size.x-3)/2)>=1)
                         || ((pos.y)%((this.size.y-3)/2)<2 && (pos.y)%((this.size.y-3)/2)>=1);
    return this.is_free(pos) && !in_protected_path;
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
