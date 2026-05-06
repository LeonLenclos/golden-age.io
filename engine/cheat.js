let codes = []

export function execute_cheat_codes(msg, player){
  let found_codes = codes.filter(code=>code.is_in_string(msg));
  found_codes.forEach(code=>code.execute(player));
  return found_codes.length>0;
}

export function list_cheat_codes(msg, player){
  return codes.map(code=>{return{code:`!${code.name}`, description:code.description}});
}

class CheatCode {
    
  constructor(name, description, callback){
    this.name = name;
    this.description = description;
    this.callback = callback;
    codes.push(this);
  }
  
  is_in_string(str){
    return str.includes('!'+this.name)
  }
  
  execute(player){
    this.callback(player);
  }
}

new CheatCode('FREEGOLD',
'gives the player 100 gold',
(player)=>{player.gold += 100});

new CheatCode('NOFOG',
'remove fog of war',
(player)=>{player.room.fog_of_war = false;});

new CheatCode('ETERNITY',
'stop time from passing',
(player)=>{player.room.turn_increment = 0;});

new CheatCode('GENESIS',
'set year to 0',
(player)=>{player.room.turn = 0;});

new CheatCode('TORTOISE',
'go slower',
(player)=>{player.room.start_clock(2400);});

new CheatCode('ACHILLES',
'go faster',
(player)=>{player.room.start_clock(600);});

new CheatCode('PEACE',
'no winning or loosing',
(player)=>{player.room.peace_mode = true;});


