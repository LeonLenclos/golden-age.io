var socket = io();

var app = new Vue({
  el: '#app',
  data: {
    started:false,
    id:undefined,
    selection:undefined,
    selection_index: 0,
    inspected_pos:{},
    messages:[],
    room:undefined,
    sounds:{},
    loading:0
  },
  mounted: function () {
   fetch('/assets.json')
   .then(response => response.json())
   .then(assets => {
    console.log(assets)
      let audio_dir = assets.children.find(dir=>dir.name=='audio');  
      audio_dir.children.forEach(file => {
        if(file.extension=='.mp3') this.load_sound(file.name);
      });
   })

    document.addEventListener('keyup', (e)=>{
      return this.on_keyup(e)
    });
  },
  watch:{
    room(new_room, old_room){
      if(!new_room || !old_room) return;
      if(new_room.turn != old_room.turn){
        this.play_sound_once('theme', 0);
      }
      if(new_room.playing != old_room.playing
        && new_room.playing == 'ended'){
        this.stop_sound('theme', 0);
        if(this.who_is(this.id).victory.status=='winner'){
          this.play_sound('ui-winner');
        } else {
          this.play_sound('ui-looser');
        }
      }
    }
  },
  methods: {
    get_sound(name, variations, intensity){
      variations = variations || 0;
      let variation = Math.floor(Math.random()*variations)
      let complete_name = `${name}-${variation}`;
      if(intensity !== undefined) complete_name = `${name}-${intensity}-${variation}`;
      return this.sounds[complete_name].sound;
    },
    play_sound(name, variation, intensity){
      let sound = this.get_sound(name, variation, intensity)
      sound.play();
    },
    play_sound_once(name, variation, intensity){
      let sound = this.get_sound(name, variation, intensity)
      if(!sound.playing()) sound.play();
    },
    stop_sound(name, variation, intensity){
      let sound = this.get_sound(name, variation, intensity)
      if(sound.playing()) sound.fade(1, 0, 1000);
    },
    load_sound(name){
      let filename = `assets/audio/${name}.mp3`
      let sound = new Howl({src: [filename]});
      this.sounds[name] = {
        sound:sound,
        loaded:false,
      }
      sound.on('load', ()=>{
        this.sounds[name].loaded = true;
        this.check_loading()
      });
      sound.on('loaderror', (e)=>{
        console.error('loading ERROR: ', filename);
      });
    },
    check_loading(){
      let total = 0;
      total += this.sounds.length;
      if(total == 0) return 0;
      let loaded = 0;
      for (var name in this.sounds) {
        if(this.sounds[name].loaded) loaded++;
      }
      this.loading = loaded/total;
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
    receive_message(msg, emiter){
      this.messages.push({msg:msg, emiter:emiter});
      this.play_sound('ui-chat', 3);
    },
    inspect(pos){
      this.inspected_pos=pos;
    },
    select(pos){
      let entities = this.room.world.entities.filter(e=>
        e.pos.x==pos.x && e.pos.y==pos.y
        && e.owner==this.id
      );
      if(entities.length == 0) return;
      let entity = entities.find(e=>e.building) || entities[0]
      if(!entity) return;
      
      if(entity.id == this.selection){
        this.unselect();
      }
      else {
        this.play_sound('ui-select', 3);
        this.selection = entity?.id;
      }
    },
    unselect(){
      if(!this.selection) return;
      this.play_sound('ui-select', 3);
      this.selection = undefined;
    },
    select_next(){
      if(!this.room?.world) return;
      let allies = this.room.world.entities.filter(e=>e.owner==this.id);
      if(allies.length == 0) return;

      this.play_sound('ui-select', 3);
      this.selection = allies[this.selection_index%allies.length].id;
      this.selection_index ++;
    },
    creation(type){
      if(!this.selection) return;
      socket.emit('creation', this.selection, type);
      this.play_sound('ui-target', 3);
      this.selection = undefined;
    },
    target(pos){
      if(!this.selection) return;
      socket.emit('target', this.selection, pos);
      this.play_sound('ui-target', 3);
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
        case 'q':
          if(!creations || !creations[0].possible) break;
          this.creation(creations[0].type)
          break;
        case 'z':
        case 'w':
          if(!creations || !creations[1].possible) break;
          this.creation(creations[1].type)
          break;
        case ',':
          this.select_next();
          break;
        case ' ':
          this.unselect();
          break;
        case 'Enter':
          this.$refs.messages.give_focus();
          break;  
        default:
          return true;
      }
      e.preventDefault();
      return false;
    }
  },
});


socket.on('connect', function() {
  app.id = socket.id;
});

socket.on('msg', function(msg, emiter) {
  app.receive_message(msg, emiter);
});

socket.on('room joined', function(state) {
  app.room = state;
});

socket.on('turn', function(state) {
  app.room = state;
});
