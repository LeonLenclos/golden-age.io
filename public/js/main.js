// import VueHotkey from 'v-hotkey'
// Vue.use(VueHotkey);

var socket = io();

var app = new Vue({
  el: '#app',
  data: {
    started:false,
    id:undefined,
    selection:undefined,
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

    this.$el.addEventListener('keyup', (e)=>{
      // console.log('KEY', e);
    });
  },
  watch:{
    room(new_room, old_room){
      if(old_room && new_room.turn != old_room.turn){
        this.play_sound('theme', 0);
      }
    }
  },
  methods: {
    play_sound(name, variation){
      if(this.sounds[name][variation].sound.playing()) return;
      this.sounds[name][variation].sound.play();
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
      console.log(e);
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
