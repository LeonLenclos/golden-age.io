import { reactive } from "vue";

export const state = reactive({
  connected: false,
  player_id: undefined,
  messages:[],
  rooms_not_found:[],
  room:undefined,
});


export const socket = io();

socket.on('connect', function() {
  state.player_id = socket.id;
  state.connected = true;
});

socket.on('disconnect', function() {
  state.connected = false;
});

socket.on('msg', function(msg, emiter) {
  state.messages.push({msg:msg, emiter:emiter});
});

socket.on('room_joined', function(room_state) {
  state.room = room_state;
});

socket.on('room_quited', function(room_state) {
  state.room = undefined;
  state.messages = [];
});

socket.on('room_not_found', function(room_id) {
  state.rooms_not_found.push(room_id);
});

socket.on('turn', function(room_state) {
  state.room = room_state;
});
