import urid from 'urid';
import {World} from './world.js';
import {Entity, Unit} from './entity.js';
import { Bot } from './player.js';

const TURN_INTERVAL_TIME = 1250; //ms
const DEFAULT_ROOM_NAME = 'somewhere';
const TURN_MAX = 500;
const START_COUNTDOWN = -10;

const PLAYING = 'playing';
const NOT_STARTED = 'not started';
const STARTING = 'starting';
const PAUSED = 'paused';
const ENDED = 'ended';

const TIMESUP = 'timesup';
const ECONOMIC = 'economic';
const MILITARY = 'military';
const CONCEDE = 'concede';

const LOOSE = 'loose';
const WIN = 'win';
const DRAW = 'draw';

export let rooms = [];

export function get_room_by_id(id, io) {
  let room = rooms.find((r)=>r.id == id && r.is_free());
  return room
}

export function get_public_room(io) {
  let room = rooms.find((r)=>!r.private && r.is_free());
  if(!room) room = new Room(io);
  return room
}

export function get_private_room(io) {
  let room = new Room(io);
  room.private = true;
  return room
}

export function close_room(id) {
  console.log('CLOSE ROOM', id)
  let room = rooms.find(r=>r.id == id);
  clearInterval(room.turn_interval_id);
  rooms = rooms.filter(r=>r.id != id);
}


export class Room {
  constructor(io) {
    this.id = urid();
    this.io = io;
    this.players = [];
    this.private = false;
    this.reset();
    this.turn_interval_id = setInterval(()=>{this.update()}, TURN_INTERVAL_TIME)
    rooms.push(this);
  }

  reset(){
    this.world = new World();
    this.turn = START_COUNTDOWN;
    this.turn_max = TURN_MAX;
    this.playing = NOT_STARTED;
    this.fog_of_war = true;
    this.turn_increment = 1;
    this.rematch_propositions = new Set();
    this.players.forEach(player => player.reset());
  }

  rematch(player_id){
    if(this.playing != ENDED) return;
    if(this.players.length != 2) return;
    this.rematch_propositions.add(player_id);
    if(this.rematch_propositions.size == 2){
      this.rematch_propositions.clear();
      this.reset();
    }
    this.emit('turn', this.get_state());
  }

  emit(...args){
    this.io.to(this.id).emit(...args);
  }

  set_playing(state){
    this.playing = state;
  }

  get_name(){
    let publicity = this.private ? 'private' : 'public' 
    return `${publicity} room n° ${this.id}`;
  }

  is_free(){
    return this.playing == NOT_STARTED && this.players.length < 2;
  }

  remove_player(player){
    this.players = this.players.filter(p=> p.id != player.id);
    this.emit('turn', this.get_state());

  }

  start(){
    this.players.forEach(player => {
      let pos = this.world.get_start_pos()
      let unit = new Unit(pos, player);
      this.world.add_entity(unit);
    });
    this.set_playing(PLAYING);
  }

  add_player(player){
    player.room = this;
    let colors = ['blue', 'red'];
    player.color = colors.find(c=>!this.players.find(p=>p.color == c));
    this.players.push(player);
  }

  add_bot(difficulty){
    if(this.players.length > 1) return;
    this.add_player(new Bot(difficulty));
  }

  victory_condition(){
    let winner = undefined;
    let victory = undefined;
    if(this.players.length == 1){
      winner = this.players[0];
      victory = CONCEDE;
    }
    else {
      let p1 = this.players[0];
      let p2 = this.players[1];
      if (this.turn >= this.turn_max){
        if (p1.gold > p2.gold) winner = p1;
        if (p2.gold > p1.gold) winner = p2;
        victory = TIMESUP;
      }
      if (this.players.find(p=>p.gold>=p.gold_max)){
        if (p1.gold > p2.gold) winner = p1;
        if (p2.gold > p1.gold) winner = p2;
        victory = ECONOMIC
      }
      const units_length = p => this.world.entities.filter(e=>e instanceof Unit && p.own(e)).length; 
      if (this.players.find(p=>units_length(p)==0)){
        if (units_length(p1) > units_length(p2)) winner = p1;
        if (units_length(p2) > units_length(p1)) winner = p2;
        victory = MILITARY;
      }
      if (this.players.find(p=>p.concede)){
        if (p2.concede && ! p1.concede) winner = p1;
        if (p1.concede && ! p2.concede) winner = p2;
        victory = CONCEDE;
      }
    }

    if(victory){
      this.set_playing(ENDED);
      this.fog_of_war = false;
      this.players.forEach(p=>{p.set_victory(
        (winner == p ? WIN : winner ? LOOSE : DRAW), victory
      )});
      return true;
    }
    return false;
  }

  update(){
    if(this.players.filter(p=>!(p instanceof Bot)).length == 0){
      close_room(this.id);
      return;
    }
    this.players.forEach(player=>player.update());

    if(this.playing == PLAYING){
      this.turn += this.turn_increment;
      this.world.update();
      this.victory_condition();      
      this.emit('turn', this.get_state());
    }

    else if(this.playing == NOT_STARTED){
      if(this.players.length==2) {
        this.set_playing(STARTING)
      }
    }

    else if(this.playing == STARTING){
      if(this.players.length < 2){
        this.set_playing(ENDED);
        this.players[0].set_victory(WIN, CONCEDE);
      }
      this.turn ++;
      this.emit('turn', this.get_state());
      if(this.turn >= 0){
        this.start();
      }
    }
  }

  get_state() {
    return {
      world:this.world?.get_state(),
      playing:this.playing,
      name:this.get_name(),
      turn:this.turn,
      turn_max:this.turn_max,
      players:this.players.map(p=>p.get_state()),
      fog_of_war:this.fog_of_war,
      private:this.private,
      id:this.id,
      rematch_propositions:Array.from(this.rematch_propositions),
    };
  }

}
