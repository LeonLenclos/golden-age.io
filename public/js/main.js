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
    loading:0,
    cell_size:undefined,
  },
  mounted: function () {
    document.addEventListener('keyup', (e)=>{return this.on_keyup(e)});
    window.addEventListener('resize', (e)=>{this.on_resize(e)});
    this.on_resize();
  },
  watch:{
    room(new_room, old_room){
      if(!new_room || !old_room) return;
      if(new_room.turn != old_room.turn){
        this.play_sound_once('theme', 0);
        let visibles_entitites = this.filter_visible(new_room.world.entities);
        ['mine', 'build', 'attack', 'defend'].forEach(action=>{
          let count = visibles_entitites.filter((e)=>e.sprite == action).length;
          if(count > 0){
            this.play_sound(`action-${action}`, 3, Math.min(count-1, 2));
          }
        });
        ['critical-attack', 'critical-defend'].forEach(action=>{
          let some = visibles_entitites.some((e)=>e.sprite == action);
          if(some){
            this.play_sound(`${action}`, 2);
          }
        });
        let visibles_events = this.filter_visible(new_room.world.events);
        ['kill', 'new'].forEach(type=>{
          ['unit', 'gold', 'building'].forEach(secondary_type=>{
            let count = visibles_events.filter((e)=>e.active && e.type == type && e.secondary_type == secondary_type).length;
            if(count > 0){
              this.play_sound(`${type}-${secondary_type}`);
            }
          });
        });
      }
      if(new_room.playing != old_room.playing
        && new_room.playing == 'ended'){
        this.stop_sound('theme', 0);
        if(this.who_is(this.id).victory.status=='win'){
          this.play_sound('ui-winner');
        } else {
          this.play_sound('ui-looser');
        }
      }
    }
  },
  methods: {
    on_resize(){
      let root = document.documentElement
      let map_margin = 2;//px

      let width = this.$el.clientWidth;
      let world_width =  20;//cells
      let aside_width = parseInt(getComputedStyle(root).getPropertyValue('--aside-width'));
      let remaining_width = width-aside_width*2-map_margin*2;

      let height = this.$el.clientHeight;
      let world_height =  15;//cells
      let header_height = parseInt(getComputedStyle(root).getPropertyValue('--header-height'));
      let remaining_height = height-header_height-map_margin;

      this.cell_size = Math.min(remaining_width/world_width, remaining_height/world_height);
      this.cell_size -= 1;
      root.style.setProperty('--cell-size', `${this.cell_size}px`);
    },
    start(){
      this.started=true;
      fetch('/assets.json')
      .then(response => response.json())
      .then(assets => {
         let audio_dir = assets.children.find(dir=>dir.name=='audio');  
         audio_dir.children.forEach(file => {
           if(file.extension=='.mp3') this.load_sound(file.name);
         });
      });   
    },
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
      let loaded = 0;
      for (var name in this.sounds) {
        total ++;
        if(this.sounds[name].loaded) loaded++;
      }
      if(total == 0) return 0;
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
    filter_visible(objects){
      objects = objects || this.room?.world.entities;
      if(objects == undefined) return [];
      if(!this.room.fog_of_war) return objects;
      if(this.room.playing != 'playing') return [];
      let allies = this.room.world.entities.filter(e=>e.owner==this.id)
      return objects.filter(e=>{
        return e.owner == this.id || allies.some(a=>{
          return Math.abs(e.pos.x-a.pos.x) + Math.abs(e.pos.y-a.pos.y) < 4
        });
      });
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
