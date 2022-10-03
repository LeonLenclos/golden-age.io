import urid from 'urid';
import {World} from './world.js';
import {Entity, Unit} from './entity.js';

const TURN_INTERVAL_TIME = 1250; //ms
const DEFAULT_ROOM_NAME = 'somewhere';
const TURN_MAX = 500;
const START_COUNTDOWN = -10;

const PLAYING = 'playing';
const NOT_STARTED = 'not started';
const PAUSED = 'paused';
const ENDED = 'ended';

const TIMESOUT = 'timesout';
const ECONOMIC = 'economic';
const MILITARY = 'military';
const CONCEDE = 'concede';

const LOOSE = 'loose';
const WIN = 'win';
const DRAW = 'draw';

export let rooms = [];

export function get_room(name, io) {
  let room = rooms.filter((r)=>r.is_free()).find((r)=>r.name == name);
  return room || new Room(name, io);
}

export class Room {
  constructor(name, io) {
    this.id = urid();
    this.name = name;
    this.io = io;
    this.players = [];
    this.world = new World();
    this.turn = START_COUNTDOWN;
    this.turn_max = TURN_MAX;
    this.playing = NOT_STARTED;
    
    this.turn_interval_id = setInterval(()=>{this.update()}, TURN_INTERVAL_TIME)
    rooms.push(this);
  }

  emit(...args){
    this.io.to(this.id).emit(...args);
  }

  set_playing(state){
    this.playing = state;
  }

  get_name(){
    return this.name || DEFAULT_ROOM_NAME;
  }

  is_free(){
    return this.playing == NOT_STARTED && this.players.length < 2;
  }

  remove_player(player){
    this.players = this.players.filter(p=>p.id!=player.id);
    this.set_playing(ENDED);
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

  victory_condition(){
    let winner = undefined;
    let victory = undefined;
    let p1 = this.players[0];
    let p2 = this.players[1];
    if (this.turn >= this.turn_max){
      if (p1.gold > p2.gold) winner = p1;
      if (p2.gold > p1.gold) winner = p2;
      victory = TIMESOUT;
    }
    if (this.players.find(p=>p.gold>p.gold_max)){
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
    if(victory){
      this.set_playing(ENDED);
      this.players.forEach(p=>{p.set_victory(
        (winner == p ? WIN : winner ? LOOSE : DRAW), victory
      )});
      return true;
    }
    return false;
  }

  update(){
    if(this.playing == PLAYING){
      this.turn ++;
      this.world.update();
      this.victory_condition();      
      this.emit('turn', this.get_state());
    }
    else if(this.playing == NOT_STARTED){
      if(this.players.length==2) {
        this.turn ++;
        this.emit('turn', this.get_state());
        if(this.turn >= 0){
          this.start();
        }
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
    };
  }

}
