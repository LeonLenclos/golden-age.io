import { socket, state } from "socket";

export const app = {
  data(){return{
    // started:false,
    id:undefined,
    target_id:undefined,
    selection:[],
    creations:[],
    joining:false,
    selection_index: 0,
    inspected_pos:{},
    sounds:{},
    loading:0,
    cell_size:undefined,
  }},
  computed: {
    player_id(){return state.player_id},
    messages(){return state.messages},
    room(){return state.room},
    rooms_not_found(){return state.rooms_not_found},
    selected_types(){return room?.world?.entities.filter(e=>this.selection.includes(e.id)).map(e=>e.type) || []}
  },
  mounted: function () {
    const urlParams = new URLSearchParams(window.location.search);
    this.target_id = urlParams.get('room')
    if(this.target_id == 'test') this.join_room('test', 'test');
    document.addEventListener('keyup', (e)=>{return this.on_keyup(e)});
    window.addEventListener('resize', (e)=>{this.on_resize(e)});
    this.on_resize();
  },
  watch:{
    rooms_not_found(new_rooms_not_found, old_rooms_not_found){
      this.target_id = 'expired';
      this.joining = false;
      alert(`Cant found room ${new_rooms_not_found[new_rooms_not_found.length-1]}`);
    },
    messages(new_messages, old_messages){
      this.play_sound('ui-chat', 3);
    },
    room(new_room, old_room){
      if(!old_room && new_room) this.joining = false;
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
        if(this.who_is(this.player_id).victory.status=='win'){
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
      let app_padding = parseInt(getComputedStyle(root).getPropertyValue('--app-padding'));

      let width = this.$refs.main.clientWidth;
      let height = this.$refs.main.clientHeight;

      let portrait = height > width;

      let world_width =  20;//cells
      let aside_width = parseInt(getComputedStyle(root).getPropertyValue('--aside-width'));
      let remaining_width = width-aside_width-map_margin-app_padding*2;
      if(portrait){
        remaining_width = width;
      }
      let world_height =  15;//cells
      let remaining_height = height-app_padding*2;

      // let header_height = parseInt(getComputedStyle(root).getPropertyValue('--header-height'));
      // let remaining_height = height-header_height-map_margin;

      this.cell_size = Math.min(remaining_width/world_width, remaining_height/world_height);
      this.cell_size -= 1;
      root.style.setProperty('--cell-size', `${this.cell_size}px`);
    },
    load_assets(callback){
      // this.started=true;
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
      if(!sound.playing()) {
        sound.volume(1);
        sound.play();
      }
    },
    stop_sound(name, variation, intensity){
      let sound = this.get_sound(name, variation, intensity)
      let delay = 500;
      if(sound.playing()){
        sound.fade(1, 0, delay);
        setTimeout(()=>sound.stop(), delay);
      }
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
      if(this.loading == 1){
        this.on_loaded()
      }
    },
    join_room(player, private_room){
      this.joining = true;
      this.on_loaded = () =>{
        let room = this.target_id;
        socket.emit('join', {player, room, private_room});
        history.pushState({room:undefined}, '', '/')      
        this.target_id=undefined;
      };
      if(this.loading < 1) this.load_assets();
      else this.on_loaded();
    },
    quit_room(){
      socket.emit('quit');
      this.stop_sound('theme', 0);
    },
    rematch(){
      socket.emit('rematch');
    },
    send_message(msg){
      socket.emit('msg', msg);
    },
    bot(difficulty){
      socket.emit('bot', difficulty);
    },
    inspect(pos){
      this.inspected_pos=pos;
    },
    select(pos){
      console.log('select');
      let entities = this.room.world.entities.filter(e=>
        e.pos.x==pos.x && e.pos.y==pos.y
        && e.owner==this.player_id
      );
      if(entities.length == 0) {
        this.unselect();
      }
      if(this.selection.length==entities.length
        && entities.every(e=>this.selection.includes(e.id))){
        this.unselect();
      }
      
      else {
        this.selection = entities.map(e=>e.id);
        this.play_sound('ui-select', 3);
      }
    },
    select_add(pos){
            console.log("select_add");

      let entities = this.room.world.entities.filter(e=>
        e.pos.x==pos.x && e.pos.y==pos.y
        && e.owner==this.player_id
      );
      entities.forEach(e=>{
        if(this.selection.includes(e.id)){
          this.selection = this.selection.filter(id=>id!=e.id);
        } else {
          this.selection.push(e.id);
        }
      });
    },
    
    select_zone(pos_1, pos_2){
      console.log('select_zone', pos_1, pos_2);
      let start_x = Math.min(pos_1.x, pos_2.x);
      let end_x = Math.max(pos_1.x, pos_2.x);
      let start_y = Math.min(pos_1.y, pos_2.y);
      let end_y = Math.max(pos_1.y, pos_2.y);
      for(let x=start_x; x<=end_x; x++){
        for(let y=start_y; y<=end_y; y++){
          console.log(x,y);
          let entities = this.room.world.entities.filter(e=> e.pos.x==x && e.pos.y==y && e.owner==this.player_id);
          entities.forEach(e=>{
            if(!this.selection.includes(e.id)){
              this.selection.push(e.id);
            }
          });
        }
      }
    },
    unselect(){
      if(!this.selection) return;
      this.selection =  [];
      this.play_sound('ui-select', 3);
    },
    select_next(){
      if(!this.room?.world) return;
      let allies = this.room.world.entities.filter(e=>e.owner==this.player_id);
      if(allies.length == 0) return;

      this.selection = [allies[this.selection_index%allies.length].id];
      this.selection_index ++;
      this.play_sound('ui-select', 3);
    },
    creation(type){
      if(!this.selection) return;
      this.selection.forEach(e=>socket.emit('creation', e, type));
      this.selection = [];
      this.play_sound('ui-target', 3);
    },
    target(pos){
      if(!this.selection) return;
      this.selection.forEach(e=>socket.emit('target', e, pos));
      this.selection = [];
      this.play_sound('ui-target', 3);
    },
    filter_visible(objects){
      objects = objects || this.room?.world.entities;
      if(objects == undefined) return [];
      if(!this.room.fog_of_war) return objects;
      if(this.room.playing != 'playing') return [];
      let allies = this.room.world.entities.filter(e=>e.owner==this.player_id)
      return objects.filter(e=>{
        return e.owner == this.player_id || e.type=='water' || allies.some(a=>{
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
    what_are(arr){
      return arr.map(id=>this.what_is(id));
    },
    on_keyup(e){
      //let creations = this.what_is(this.selection)?.creations;
      switch (e.code) {
          /*if(!creations || !creations[0].possible) break;
          this.creation(creations[0].type)*/
         
        case 'Digit1': this.creation('house'); break;
        case 'Digit2': this.creation('factory'); break;
        case 'Digit3': this.creation('unit'); break;
        case ',':      this.select_next(); break;
        case ' ':      this.unselect(); break;
        case 'Enter':  this.$refs.messages.give_focus(); break;  
        default:
          return true;
      }
      e.preventDefault();
      return false;
    }
  },
};
