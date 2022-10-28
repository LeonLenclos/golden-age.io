import express from 'express'
import http from 'http'
import {Server} from 'socket.io'
import dir_tree from 'directory-tree';

import {rooms, get_room} from './engine/room.js';
import {players, new_player, remove_player, get_player} from './engine/player.js';
import {new_vector as V} from './engine/vector.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const files_callback = (item, path) => {
  item.path = path.substring('/public'.length);
  item.name = item.name.split('.')[0];
};

const assets_tree = dir_tree('./public/assets', {attributes:["extension"]}, files_callback);

app.use(express.static('./public'));
app.get('/assets.json', (req, res) => res.send(assets_tree));
app.get('/stat.json', (req, res) => res.send({rooms:rooms.length, players:players.length}));


function send_message(room, msg, emiter){
  if (emiter) console.log(`[${room.id}] ${emiter}:${msg}`);
  else        console.log(`[${room.id}] ${msg}`);
  io.to(room.id).emit('msg', msg, emiter);
}

function cheat(player, msg){
  switch (msg) {
    case '!FREEGOLD':
      player.gold += 100;
      break;
    case '!NOFOG':
      player.room.fog_of_war = false;
      break;
    case '!STOPTIME':
      player.room.turn_increment = 0;
      break;
    case '!':
      player.room.fog_of_war = false;
      player.room.add_bot();
      break;
    default:
      return false;
  }
  send_message(player.room, `${player.name} is cheating !`)
  return true;
}

io.on('connection', (socket) => {

  console.log('connection', socket.id)

  socket.on('join', (data) => {
    let room = get_room(data.room, io);
    let player = new_player(data.player, socket.id);
    socket.join(room.id);
    room.add_player(player);
    socket.emit('room joined', room.get_state());
    send_message(room, `${player.name} joined the room`);
  });

  socket.on('creation', (entity_id, type) => {
    let player = get_player(socket.id);
    if(!player) return;
    let entity = player.room.world.get_entity(entity_id);
    if(!entity) return;
    entity.set_creation(type);
  });

  socket.on('target', (entity_id, pos) => {
    let player = get_player(socket.id);
    if(!player) return;
    let entity = player.room.world.get_entity(entity_id);
    if(!entity) return;
    pos = V(pos.x, pos.y);
    entity.set_target(pos);
  });

  socket.on('msg', (msg) => {
    let player = get_player(socket.id);
    if(!player) return;
    if(cheat(player, msg)) return;
    send_message(player.room, msg, player.id);
  });

  socket.on('bot', (difficulty) => {
    let player = get_player(socket.id);
    if(!player) return;
    player.room.add_bot(difficulty)
  });

  socket.on('quit', () => {
    let player = get_player(socket.id);
    if(!player) return;
    player.quit();
    remove_player(socket.id);
    send_message(player.room, `${player.name} quited the room`);
  });

  socket.on('disconnect', () => {
    let player = get_player(socket.id);
    if(!player) return;
    player.quit();
    remove_player(socket.id);
    send_message(player.room, `${player.name} disconnected`);

  });

});


server.listen(3000, () => {
  console.log('listening on *:3000');
});
