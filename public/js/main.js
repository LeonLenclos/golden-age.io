// import VueHotkey from 'v-hotkey'
// Vue.use(VueHotkey);

var socket = io();

var app = new Vue({
  el: '#app',
  data: {
    id:undefined,
    selection:undefined,
    mission_selected:undefined,
    inspected_pos:{},
    messages:[],
    room:undefined,
  },
  mounted: function () {
    this.$el.addEventListener('keyup', this.on_keyup)
    console.log('mounted')
  },
  methods: {
    join_room(player_name, room_name){
      socket.emit('join', {player:player_name, room:room_name});
    },
    quit_room(){
      socket.emit('quit');
      this.room = undefined;
      this.messages = [];
    },
    send_message(msg){
      socket.emit('msg', msg);
    },
    inspect(pos){
      this.inspected_pos=pos;
    },
    select(pos){
      this.mission_selected = undefined;
      let entities = this.room.world.entities.filter(e=>
        e.pos.x==pos.x && e.pos.y==pos.y
        && e.owner==this.id
        && e.id != this.selection
      );
      let entity = entities.find(e=>e.building) || entities[0]
      this.selection = entity?.id;
    },

    creation(type){
      if(!this.selection) return;
      socket.emit('creation', this.selection, type);

    },
    target(pos){
      if(!this.selection) return;
      socket.emit('target', this.selection, pos);
      this.selection = undefined;
    },
    who_is(id){
      return this.room?.players.find(p=>p.id==id);
    },
    what_is(id){
      return this.room?.world.entities.find(e=>e.id==id);
    },
  },
});


socket.on('connect', function() {
  app.id = socket.id;
});

socket.on('msg', function(msg, emiter) {
  app.messages.push({msg:msg, emiter:emiter});
});

socket.on('room joined', function(state) {
  app.room = state;
});

socket.on('turn', function(state) {
  app.room = state;
});
