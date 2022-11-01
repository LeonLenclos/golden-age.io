import {House, Factory, Gold, Unit, Building, Water} from './entity.js';

const DEFAULT_PLAYER_NAME = 'someone';
const GOLD_MAX = 500;
const GOLD_START = 20;

const HARD = 'hard';
const MEDIUM = 'medium';
const EASY = 'easy';

export let players = [];

export function new_player(name, id){
  let player = new Player(name, id);
  players.push(player);
  return player;

}

export function remove_player(id){
  let player = get_player(id);
  player.quit();
  players = players.filter(p=>p.id!=id);
}

export function get_player(id){
  return players.find(p=>p.id==id)
}

export class Player {
  constructor(name, id){
    this.name = name || DEFAULT_PLAYER_NAME;
    this.id = id;
    this.gold = GOLD_START;
    this.gold_max = GOLD_MAX;
    this.color = 'white';
    this.room = undefined;
    this.victory = undefined;
  }

  reset(){
    this.gold = GOLD_START;
    this.victory = undefined;
  }

  set_victory(status, reason){
    this.victory = {status, reason};
  }
  
  own(entity){
    return entity.owner == this;
  }

  quit(){
    this.room?.remove_player(this);
    this.room = undefined;
  }
  
  update(){
    return;
  }

  get_allies(){
    return this.room.world.entities.filter(e=>this.own(e))
  }

  get_visible_entities(){
    let allies = this.get_allies();
    return this.room.world.entities.filter(e=>!(e instanceof Water) && allies.some(a=>e.pos.manhattan(a.pos)<4));
  }

  get_state() {
    return {
      color:this.color,
      name:this.name,
      gold:this.gold,
      gold_max:this.gold_max,
      id:this.id,
      victory:this.victory,
    }
  }
}



export class Bot extends Player {
  constructor(difficulty){
    super('bot', 'bot');
    this.difficulty = difficulty;
  }


  update(){
    let allies = this.get_allies();
    let ally_units = allies.filter(a=>a instanceof Unit);
    let buildings_under_construction = allies.filter(a=> a instanceof Building && a.under_construction);
    let visibles = this.get_visible_entities();
    let golds = visibles.filter(e=>e instanceof Gold);

    const nobody_s_entity = e => {
      let targeted = allies.find(a=>a.target?.equals(e.pos) && a.path?.length);
      let occuped = visibles.find(v=> v instanceof Unit && v.pos.equals(e.pos));
      return !targeted && !occuped;
    };

    const nearest = (entities, entity) => entities.reduce((nearest, current)=>{
      return nearest.pos.manhattan(entity.pos)>current.pos.manhattan(entity.pos) ? current : nearest;
    });
    
    const is_walking = e => e.prev_pos && !e.prev_pos.equals(e.pos)
                         && e.target   && !e.target.equals(e.pos)
                         && e.path?.length;
    
    const send_to_things = things => e => {
      if(!(e instanceof Unit)) return false;
      let nobody_s_things = things.filter(nobody_s_entity);
      let is_on_thing = things.some(v=>v.pos.equals(e.pos));
      let is_going_to_thing = is_walking(e) && things.some(v=>v.pos.equals(e.target));
      if(is_on_thing || is_going_to_thing ) return true;
      if(! nobody_s_things.length) return false;
      let nearest_thing = nearest(nobody_s_things, e);
      e.set_target(nearest_thing.pos);
      return true;
    }
    
    const send_to_gold = send_to_things(golds);
    const send_to_build = send_to_things(buildings_under_construction);

    const create_things = (thing_class) => (e) => {
      if(!e.creations.some(c=>c==thing_class)) return false;
      if(thing_class.cost > this.gold) return false;
      e.set_creation(thing_class.type);
      return true;
    };

    const create_gold = create_things(Gold);

    const create_till_n_things = (n, thing_class) => (e) => {
      let things = allies.filter(a => a instanceof thing_class).length
                 + allies.filter(a => a.creation instanceof thing_class).length;
      if(things >= n) return false;
      return create_things(thing_class)(e);
    };

    const create_till_1_houses = create_till_n_things(1, House);
    const create_till_2_houses = create_till_n_things(2, House);
    const create_till_1_factories = create_till_n_things(1, Factory);
    const create_till_2_factories = create_till_n_things(2, Factory);
    const create_till_8_units = create_till_n_things(10, Unit);
    const create_till_5_units = create_till_n_things(5, Unit);
    const create_till_4_units = create_till_n_things(4, Unit);

    const random_walk = e => {
      if(!(e instanceof Unit)) return false;
      if(is_walking(e)) return true;
      let pos = this.room.world.size.map((v)=>Math.floor(Math.random()*v));
      e.set_target(pos);
    };

    const is_under_attack = ally => visibles.some(e=>!(e instanceof Gold) && !this.own(e) && e.pos.equals(ally.pos));

    const help_ally = e => {
      if(!(e instanceof Unit)) return false;
      let allies_under_attack = allies.filter(is_under_attack);
      if(!allies_under_attack.length) return false;
      let nearest_under_attack = nearest(allies_under_attack, e);
      let neighbors = nearest_under_attack.pos.neighbors();
      neighbors.push(nearest_under_attack.pos);
      let helping_allies = allies.filter(a=>{
        if(!(a instanceof Unit)) return false;
        return neighbors.some(n=>n.equals(a.pos) || (is_walking(a) && a.target.equals(n)))
      });
      if (helping_allies >= 3) return false;

      e.set_target(nearest_under_attack.pos);
      return true;
    }

    const attack = e => {
      if(!(e instanceof Unit)) return false;
      let good_situation = allies.filter(a=>a instanceof Unit).length > 5 && this.gold > 100;
      if(!good_situation) return false;
      let free_enemies = visibles.filter(v=> !this.own(v) && !(v instanceof Gold) && !allies.some(a=>a.pos.equals(v.pos)));
      if(!free_enemies.length) return false;
      let nearest_enemy = nearest(free_enemies, e);
      e.set_target(nearest_enemy.pos);
      return true;
    }

    let priority = [];
    switch (this.difficulty) {
      case HARD: priority = [
        help_ally,
        create_till_8_units,
        create_gold,
        create_till_2_houses,
        create_till_2_factories,
        send_to_build,
        attack,
        send_to_gold,
        random_walk,
      ];
      break;
      case MEDIUM: priority = [
        help_ally,
        create_till_5_units,
        create_gold,
        create_till_1_houses,
        create_till_1_factories,
        send_to_build,
        attack,
        send_to_gold,
        random_walk,
      ];
      break;
      case EASY: priority = [
        create_till_4_units,
        create_gold,
        create_till_1_houses,
        create_till_1_factories,
        send_to_build,
        send_to_gold,
        random_walk,
      ];
      break;
    
    }
    allies.forEach((e, i)=>{
      const do_nothing_prob = {hard:.9, medium:.5, easy:.1};
      if(Math.random() > do_nothing_prob[this.difficulty]) return;
      for (const action of priority) {
        if(action(e)) return;
      }
    });
    
  }
}