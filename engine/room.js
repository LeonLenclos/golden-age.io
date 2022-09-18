import urid from 'urid';
import {World} from './world.js';
import {Entity, Unit} from './entity.js';

const TURN_INTERVAL_TIME = 1000; //ms
const DEFAULT_ROOM_NAME = 'somewhere';
const MAX_PLAYERS = 2

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
    this.turn = 0;
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
    if(this.players.length==2) this.start();
  }

  update(){
    if(this.playing == PLAYING){
      this.turn ++;
      this.world.update();
      this.emit('turn', this.get_state());
    }
  }

  get_state() {
    return {
      world:this.world?.get_state(),
      playing:this.playing,
      name:this.get_name(),
      turn:this.turn,
      players:this.players.map(p=>p.get_state()),
    };
  }

}
