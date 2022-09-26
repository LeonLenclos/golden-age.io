// import VueHotkey from 'v-hotkey'
// Vue.use(VueHotkey);

var socket = io();

var app = new Vue({
  el: '#app',
  data: {
    started:false,
    id:undefined,
    selection:undefined,
    selection_index: 0,
    mission_selected:undefined,
    inspected_pos:{},
    messages:[],
    room:undefined,
    sounds:{},
    loading:0
    // music:undefined;
  },
  mounted: function () {

    this.load_sound('theme', 0)

    document.addEventListener('keyup', (e)=>{
      return this.on_keyup(e)
    });
  },
  watch:{
    room(new_room, old_room){
      if(!new_room || !old_room) return;
      if(new_room.turn != old_room.turn){
        this.play_sound('theme', 0);
      }
      if(new_room.playing =! old_room.playing
        && new_room.playing == 'ended'){
        this.stop_sound('theme', 0);

        }
    }
  },
  methods: {
    play_sound(name, variation){
      if(this.sounds[name][variation].sound.playing()) return;
      this.sounds[name][variation].sound.play();
    },
    stop_sound(name, variation){
      if(!this.sounds[name][variation].sound.playing()) return;
      this.sounds[name][variation].sound.fade(1, 0, 1000);
    },
    load_sound(name, variation){
      if(!this.sounds[name]) this.sounds[name] = [];
      let filename = `assets/audio/${name}-${variation}.mp3`
      console.log('loading ...', name, variation)
      this.sounds[name][variation] = {
        sound:new Howl({src: [filename]}),
        loaded:false,
      }
      this.sounds[name][variation].sound.on('load', ()=>{
        console.log('loading OK', name, variation)
        this.sounds[name][variation].loaded = true;
        this.check_loading()
      });
      this.sounds[name][variation].sound.on('loaderror', (e)=>{
        console.error('loading ERROR', name, variation);
      });


    },
    check_loading(){
      let loaded = 0;
      let total = 0
      for (var name in this.sounds) {
        loaded += this.sounds[name].filter(s=>s.loaded).length;
        total += this.sounds[name].length;
      }
      console.log(total,loaded)
      this.loading = total/loaded;
    },
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
    unselect(){
      this.selection = undefined;
    },
    select_next(){
      if(!this.room?.world) return;
      let allies = this.room.world.entities.filter(e=>e.owner==this.id);
      if(!allies.length) return;
      this.selection = allies[this.selection_index%allies.length].id;
      this.selection_index ++;
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
    on_keyup(e){
      let creations = this.what_is(this.selection)?.creations;
      switch (e.key) {
        case 'a':
          if(!creations || !creations[0].possible) break;
          this.creation(creations[0].type)
          return false;
        case 'z':
          if(!creations || !creations[1].possible) break;
          this.creation(creations[1].type)
          return false;
        case 'Tab':
          this.select_next();
          e.preventDefault();
          return false;
        case ' ':
          this.unselect();
          e.preventDefault();
          return false;
        default:
          break;
      }
    }
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
