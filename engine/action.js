import {
  Unit,
  Gold,
  Building,
} from './entity.js';

export class Action {

  static type = 'action'
  static cost = 0;

  constructor(entity) {
    this.entity=entity;
  }

  is_possible(){
    return true;
  }
  
  pay_cost(){
    let cost = this.constructor.cost;
    if(this.entity.owner.gold >= cost){
      this.entity.owner.gold -= cost;
      return true;
    }
    return false;
  }

  do(){
    return;
  }

  // override me with Object.assign(super.get_state(),{}) !
  get_state(){
    return {
      type:this.constructor.type,
      progress:this.get_progress(),
    }
  }
}


export class Walk extends Action {

  static type = 'walk';

  is_walkable(pos){
    let entities = this.entity.world.get_entities_at(pos)
    return !entities.some(e=>e.owner == this.entity.owner && e instanceof Unit)
  }

  some_enemy(){
    let entities = this.entity.world.get_entities_at(this.entity.pos)
    return entities.some(e=>e.owner && e.owner != this.entity.owner);
  }


  is_possible(){
    if(!this.entity.path) return;
    let step = this.entity.path[0];
    return step && this.is_walkable(step) && !this.some_enemy();
  }

  do(){
    let step = this.entity.path?.shift();
    this.entity.pos = step;
    this.entity.set_sprite('walk');
  }
}




export class Mine extends Action {

  static type = 'mine';

  get_gold(){
    let entities = this.entity.world.get_entities_at(this.entity.pos)
    let gold = entities.find(e=>e instanceof Gold);
    let other_unit = entities.find(e=>e.id != this.entity.id && (e instanceof Unit));
    if(gold && !other_unit) return gold;
  }

  is_possible(){
    return this.get_gold();
  }

  do(){
    let gold = this.get_gold()
    gold.hit(1);
    this.entity.owner.gold ++;
    this.entity.set_sprite('mine');
  }
}

export class Attack extends Action {

  static type = 'attack';

  get_enemy(){
    let entities = this.entity.world.get_entities_at(this.entity.pos)
    let enemies = entities.filter(e=>e.owner && e.owner != this.entity.owner);
    let enemy = enemies.find(e=>e instanceof Unit) || enemies[0];
    let other_ally = entities.find(e=>
      e.owner == this.entity.owner
      && e.id != this.entity.id
      && (e instanceof Unit)
    );
    if(enemy && !other_ally) return enemy;
  }

  is_possible(){
    let enemy = this.get_enemy()
    return enemy && enemy.id <= this.entity.id;
  }

  do(){
    let enemy = this.get_enemy();
    let damage = 1;
    this.entity.set_sprite(this.constructor.type);
    if(Math.random()<this.entity.get_force()){
    this.entity.set_sprite(`critical-${this.constructor.type}`);
      damage++;
    }
    enemy.hit(damage);
  }
}


export class Defend extends Attack {

  static type = 'defend'

  is_possible(){
    let enemy = this.get_enemy()
    return enemy && enemy.id > this.entity.id;
  }
}

export class Repair extends Action {
  static type = 'repair'

  is_possible(){
    return this.get_building();
  }

  get_building(){
    let entities = this.entity.world.get_entities_at(this.entity.pos)
    let allies = entities.filter(e=>e.owner && e.owner == this.entity.owner);
    let building = allies.find(e=>e instanceof Building && e.hp < e.hp_max);
    return building;
  }

  do(){
    this.get_building().hp ++;
    this.entity.set_sprite('build');
  }

}


export class Reside extends Action {
  static type = 'reside'

  is_possible(){
    return this.entity.get_residence();
  }

  do(){
    this.entity.set_sprite('flag');
  }
  
}

export class Create extends Action {

  static type = 'create'

  can_pay(){
    return this.entity.owner.gold >= this.entity.creation.constructor.cost;
  }

  payed(){
    return this.entity.creation.cost_payed;
  }

  pay(){
    this.entity.owner.gold -= this.entity.creation.constructor.cost;
    this.entity.creation.cost_payed = true;
  }

  get_pos(){
    if(this.entity instanceof Building) {
      let neighbors = this.entity.pos.neighbors();
      return neighbors.find(p=>{
        let entities = this.entity.world.get_entities_at(p)
        if(!entities.length) return true;
        if(this.entity.creation instanceof Gold){
          return entities.length == 1 && entities[0] instanceof Unit;
        }
        if(this.entity.creation instanceof Unit){
          let some_ally = entities.some(e=>e.owner == this.entity.owner && e instanceof Unit);
          return !this.entity.world.is_water(p) && !some_ally;
        }
      });
    }
    if(this.entity instanceof Unit) {
      return this.entity.pos.copy();
    }
  }

  spawn_creaion(){
    let pos = this.get_pos();
    if(!pos) return;
    let creation = this.entity.creation;
    this.entity.creation = undefined;
    creation.pos = pos;
    this.entity.world.add_entity(creation);
  }

  is_possible(){
    if(!this.entity.creation) return false;
    if(this.entity.creation.under_construction) return true;
    return this.entity.can_create(this.entity.creation.constructor);
  }

  do(){
    if(!this.payed()){
      this.pay();
    }

    if(this.entity instanceof Unit){
      this.spawn_creaion();
      return;
    }

    if(!this.entity.get_resident()) return;

    if(this.entity.creation.under_construction){
      this.entity.creation.hp ++;
      this.entity.creation.update();
    }

    if(!this.entity.creation.under_construction){
      this.spawn_creaion();

    }
  }
}
