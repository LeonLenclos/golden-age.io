const DEFAULT_PLAYER_NAME = 'someone';
const GOLD_MAX = 500;

export let players = [];

export function new_player(name, id){
  return new Player(name, id);
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
    this.gold = 50;
    this.gold_max = GOLD_MAX;
    this.color = 'white';
    this.room = undefined;
    this.victory = undefined;
    players.push(this);
  }

  quit(){
    this.room?.remove_player(this);
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
