import urid from 'urid';
import {World} from './world.js';
import {Entity, Unit} from './entity.js';

const TURN_INTERVAL_TIME = 1250; //ms
const DEFAULT_ROOM_NAME = 'somewhere';
const MAX_PLAYERS = 2;
const TURN_MAX = 500;
const START_COUNTDOWN = -10;

const PLAYING = 'playing';
const NOT_STARTED = 'not started';
const PAUSED = 'paused';
const ENDED = 'ended';

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
    rooms.push(this);
    this.turn_interval_id = setInterval(()=>{this.update()}, TURN_INTERVAL_TIME)
    this.turn = START_COUNTDOWN;
    this.turn_max = TURN_MAX;
    this.playing = NOT_STARTED;
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
    return this.playing == NOT_STARTED && this.players.length < MAX_PLAYERS;
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

  set_victory(victory, player){
    this.set_playing(ENDED);
    this.players.forEach(p => {
      p.victory = ((p==player)==victory)
    });
  }

  update(){
    if(this.playing == PLAYING){
      this.turn ++;
      this.world.update();
      this.players.forEach(player => {
        if(player.gold >= player.gold_max){
          this.set_victory(true, player);
        }
        if(this.turn >= this.turn_max){
          this.set_victory(players[0].gold > players[1].gold, player[0]);
        }
        else if(this.world.entities.filter(e=>e.owner==player).length <= 0){
          this.set_victory(false, player);
        }
      });
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
