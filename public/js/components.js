import {ref} from 'vue';

export const messages = {
  data(){
    return {
      input:'',
    };
  },
  props: ['messages', 'players'],
  updated() {
    this.$refs.list.scroll({
      top: this.$refs.list.scrollHeight,
      behavior: 'smooth'
    });
  },
  methods:{
    give_focus(){
      this.$refs.input.focus();
    },
    send(){
      if(this.input.length==0) return;
      this.$emit('send_message', this.input);
      this.input = '';
    }
  },
  template: `
  <div class="panel" title="messages" id="messages">
    <ul ref="list">
      <li v-for="message in messages">
        <player-name
          v-if="message.emiter"
          :player="players.find(p=>p.id==message.emiter)"
        ></player-name>
        <span>{{message.msg}}</span>
      </li>
    </ul>
    <form @submit.prevent>
      <input ref="input" v-model="input" name="msg"/>
      <button @click="send">say</button>
    </form>
  </div>
  `
};

export const player_name = {
  props: ['player', 'player_id'],
  template: `
    <span
      :class="{
        playername:true,
        ally:player?.id==$root.player_id,
        enemy:player?.id!=$root.player_id,
      }"
    > {{player?.name}} </span>
  `
};

export const entity_name = {
  props: ['entity'],
  template: `
    <span
      v-if="entity"
      :class="{
        entityname:true,
        ally:entity.owner==$root.player_id,
        enemy:entity.owner!=$root.player_id,
      }"
    > {{entity.type}} </span>
  `
};

export const room = {
  props: ['room'],
  template: `
  <div id="room">
    <header>
      <h2><small>{{room.name}}</small></h2>
      <button @click="$emit('quit_room')">quit</button>
    </header>
    <section class="roomstate">
      <strong v-if="room.players.length<2">Waiting for player...</strong>
      <strong v-else-if="room.turn<=0">Game starting in {{Math.abs(room.turn)}}</strong>
      <fill-bar v-else :value="room.turn" :max="room.turn_max"></fill-bar>
    </section>
    <section class="players">
      <player-card
        v-for="index in 2"
        :player="room.players[index-1]"
        ></player-card>
      </section>
  </div>
  `
};

export const fill_bar = {
    props: ['value', 'max', 'percent'],
    methods:{
      get_text(){
        if(this.value === undefined){
          return '';
        }
        if(this.percent){
          return `${Math.floor(this.value/this.max*100)}%`

        }
        return `${this.value}/${this.max}`
      },
    },
    template:`
    <div class="fill-bar">
      <div class="fill" :style="'width:'+(value/max*100).toFixed(2)+'%'"></div>
      <div class="label">{{get_text()}}</div>
    </div>
    `
};

export const entity_card = {
  props: ['entity'],
  template: `
  <div class="card">
    <header>
      <h2><entity-name :entity=entity ></entity-name></h2>
      <entity :entity="entity" :basic_sprite="true"></entity>
    </header>
    <main>
      <small>{{entity.pos.x}}, {{entity.pos.y}}</small>
      <fill-bar :value="entity.hp" :max="entity.hp_max"></fill-bar>
      <fill-bar v-if="entity.creation_progress != undefined"
      :value="entity.creation_progress" :max="1" :percent="true"></fill-bar>
    </main>
  </div>
  `
};

export const creation_card = {
  props: ['creation','index'],
  methods:{
    entity()
    {
      return {type:this.creation.type, owner:this.$root.player_id};
    },
    hint(){
      const hints = {
        gold:'Can be mined for gold',
        unit:'Can mine, fight and build',
        house:'Can create units',
        factory:'Can create gold mines',
      }
      return hints[this.creation.type];
    }
  },
  template: `
  <button
  :disabled="!creation.possible"
  @click="$emit('click')"
  >
    <h2><entity-name :entity="entity()"></entity-name></h2>
    <small>{{hint()}}</small>
    <entity :entity="entity()"></entity>
    <div class="gold-value">{{creation.cost}}</div>
    <span class="shortcut">{{['A or Q', 'Z or W'][index]}}</span>
  </button>
  `
};

export const player_card = {
  props: ['player', 'is_you'],
  template: `

  <div :class="{playercard:true, empty:player===undefined}">
    <header>
      <h2><player-name :player=player></player-name></h2>      
    </header>
    <main>
      <fill-bar class="gold-bar" :value="player?.gold" :max="player?.gold_max"></fill-bar>
    </main>
  </div>

  `
};

export const inspector = {
  props: ['pos', 'entities'],
  template: `
  <div class="panel" id="inspector">
    <small v-if="pos.x&&pos.y">inspecting position {{pos.x}},{{pos.y}}</small>
    <small v-else>(move your mouse over the map to inspect)</small>
    <div class=cards>
      <entity-card v-for="entity in entities" :entity=entity></entity-card>
    </div>
  </div>
  `
};

export const panel_col = {
    props:['title'],
    template: `
    <div class="panelcol">
      <header><h2>{{title}}</h2></header>
      <main>
        <slot></slot>
      </main>
    </div>
    `
};

export const selection = {
  props: ['selection'],
  methods:{},
  template: `
  <div>
    <panel-col title="selected entities">
        <entity-card v-for="entity in selection" :entity="entity"></entity-card>
    </panel-col>
  </div>
  `
};

export const creations = {
  props: ['creations'],
  methods:{},
  template: `
  <div>
    <panel-col title="creations">
      <div class="creations">
      <creation-card
        v-for="(creation, i) in creations"
        @click="$emit('creation', creation.type)"
        :creation=creation
        :index=i
      ></creation-card>
      </div>
    </panel-col>

  </div>
  `
};

export const join_room = {
  data:function(){return {
    player:readCookie('playername')||'',
    about:{}
  };},
  props:['invitation_id'],
  methods:{
    play(private_room){
      createCookie('playername', this.player)
      this.$emit('join_room', this.player, private_room);
    },
    play_private(){
      this.play(true);
    },
    async loadAbout() {
 
      try {  
        const response = await fetch('/about.json');  
        if (!response.ok) throw new Error('Failed to fetch data');  
        this.about = await response.json(); // Parse JSON  
      } catch (err) {  
        console.error(err.message)  
      } finally {  
        //this.isLoading = false;  
      }  
    }
  },
  mounted() {  
    // Fetch JSON from public/ directory  
    this.loadAbout();  
  },  
  template: `
  <div
  class="fullscreen"
  id="join-room"
  @keyup.enter="play">
    <h1>Golden Age</h1>
    <small>(Version {{about.version}})</small>
    <div>
      <label for="player">Your name</label>
      <input name="player" v-model="player"/>
    </div>

    <div v-if="invitation_id && invitation_id != 'expired'">
      <small>You have been invited to room {{invitation_id}}</small>
      <button @click="play()">play</button>
    </div>

    <div v-else>
      <small v-if="invitation_id == 'expired'">Sorry but your invitation link has expired...</small>
      <button @click="play()">play</button>
      <button @click="play_private()">play in a private room</button>
    </div>
  </div>
    `
};

export const loading = {

  props:['progress'],

  template: `
  <div class="fullscreen" id="loading">
    <h1>Loading</h1>
    <fill-bar :value="progress" max=1 :percent="true"></fill-bar>
    <h2 v-if="progress==1">Waiting for server response...</h2>
    </div>
    `
};

export const start = {
  template: `
  <div class="fullscreen" id="start">
    <h1>Golden Age</h1>
    <button @click="$emit('start')">start</button>
  </div>
    `
};

export const end = {
  data(){return{
    history_link:'/history.html?room='+this.$root.room.id+'&match='+this.$root.room.match+'&player='+this.$root.player_id,
  }},
  props: ['status', 'reason', 'rematch_propositions'],
  methods: {
    get_reason(){
      const sentences = {
        timesup:{
          win:   "Time is up and you have more gold than your opponent.",
          loose: "Time is up and you have less gold than your opponent.",
          draw:  "Time is up and you have the same amount of gold.",
        },
        economic:{
          win:   "You have reached 500 gold.",
          loose: "Your opponent has reached 500 gold.",
          draw:  "You have reached 500 gold at the same time.",
        },
        military:{
          win:   "All opponent's units are dead.",
          loose: "All your units are dead.",
          draw:  "The last units died at the same time.",
        },
        concede:{
          win:   "Your opponent has conceded.",
          loose: "You conceded.",
          draw:  "You both conceded at the same time.",
        },
      }
      console.log(this.reason, this.status);
      console.log(sentences[this.reason][this.status]);
      return sentences[this.reason][this.status];
    },
    get_status(){
      const sentences = {
        win:   "You win !",
        loose: "You loose...",
        draw:  "It's a draw !",
      }
      return sentences[this.status];
    },
    i_want_rematch(){
      return this.rematch_propositions.indexOf(this.$root.player_id) >= 0;
    },
    oponent_want_rematch(){
      return this.rematch_propositions.length && !this.i_want_rematch();
    },
  },
  template: `
  <div class="fullscreen" id="end">
    <small>{{get_reason()}}</small>
    <h2>{{get_status()}}</h2>
    <button @click="$emit('quit')">quit</button>
    <small v-if="oponent_want_rematch()">Your opponent proposes a rematch</small>
    <button v-if="oponent_want_rematch()" @click="$emit('rematch')">accept the rematch</button>
    <button v-else @click="$emit('rematch')" :disabled="i_want_rematch()">{{i_want_rematch()?'rematch proposed':'propose a rematch'}}</button>
    <a :href="history_link" target="_blank">Open the history</a>
  </div>
  `

};

export const waiting = {
  data(){return{
    invite_link:window.location.origin+'/?room='+this.$root.room.id,
    copied:false
  }},
  props:['room'],
  methods:{
    copy_link(){
      if(!navigator.clipboard) return;
      navigator.clipboard
        .writeText(this.invite_link)
        .then(() => {this.copied = true; setTimeout(()=>{this.copied=false;}, 3000)})
        .catch((err) => console.error(`Error copying to clipboard: ${err}`));
    }
  },
  template: `
  <div class="fullscreen" id="waiting">
  <h1>Waiting for a player...</h1>
  <h2>{{room.name}}</h2>
    <p v-if="room.private">You are in a private room, no one will come unless invited.</p>
    <p v-else>You are in a public room, the first player to log in will join your room.</p>

    <h2>Invite a friend</h2>
    <p>Invite a friend by sending them this link: {{invite_link}}</p>
      <button @click="copy_link" :disabled="copied">{{copied?'Link copied':'Copy link'}}</button>

    <h2>Invite a bot</h2>
      <button @click="$emit('bot', 'hard')">hard</button>
      <button @click="$emit('bot', 'medium')">medium</button>
      <button @click="$emit('bot', 'easy')">easy</button>
  </div>
  `
};

export const main_map = {
  data(){
    return {
      dragging:false,
      drag_from:{x:0,y:0},
      map_pos:{x:0,y:0},
      hover_pos:undefined,
      unvisited:undefined,
    };
  },
  props: [
    'entities',
    'allies',
    'events',
    'players',
    'world',
    'fog_of_war',
    'selection',
    'inspected_pos',
    'cell_size',
    'turn',
  ],
  watch:{
    entities(new_entities){
      if(!new_entities) return;
      if(this.unvisited) this.unvisited = this.unvisited.filter(pos=>!this.is_visible(pos))
    }
  },
  methods:{

    is_visited(pos){
      if(this.unvisited===undefined && this.world){
        this.unvisited = [];
        for (let x = 0; x < this.world.size.x; x++) {
          for (let y = 0; y < this.world.size.y; y++) {
            this.unvisited.push({x,y});
          }
        }  

        return false;
      }
      // console.log('visited', !this.unvisited.some(p=>p.x==pos.x && p.y==pos.y))
      return !this.unvisited.some(p=>p.x==pos.x && p.y==pos.y)
    },
    is_inspected(pos){
      return this.inspected_pos.x == pos.x && this.inspected_pos.y == pos.y;
    },
    is_selected(pos){
      return this.get_selected().some(e=>e.pos.x==pos.x && e.pos.y==pos.y);
    },
    get_selected(){
      return this.entities.filter(e=>this.selection.includes(e.id))
    },
    entities_at(pos){
      return this.entities.filter(e=>e.pos.x==pos.x && e.pos.y==pos.y);
    },
    events_at(pos){
      return this.events.filter(e=>e.active && e.pos.x==pos.x && e.pos.y==pos.y);
    },
    allies_at(pos){
      return this.allies.filter(e=>e.pos.x==pos.x && e.pos.y==pos.y);
    },
    is_ally_at(pos){
      return this.allies.some(e=>e.pos.x==pos.x && e.pos.y==pos.y);
    },
    is_visible(pos){
      if(!this.fog_of_war) return true;
      return this.allies.some(e=>Math.abs(pos.x-e.pos.x)+Math.abs(pos.y-e.pos.y)<4);
    },
    intro_visibility(pos){
      const manhattan = (a, b) => Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
      let center  = {x:this.world.size.x/2-.5, y:this.world.size.y/2-1/2}
      let intro = 1-manhattan(pos, center)/manhattan(center, this.world.size);
      intro = intro*5 - this.turn;
      intro /= 15
      intro = Math.floor(intro*6)/6;
      if(this.turn == -10) return 1;
      return intro;
    },
    visibility(pos){
      const manhattan = (a, b) => Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
      let shortest_dist = this.allies.reduce((dist, e)=>{return Math.min(dist, manhattan(pos, e.pos))}, 4);
      // let v = (shortest_dist/4)**3;
      if(this.turn < 0) return this.intro_visibility(pos);
      if(shortest_dist<3) return 1;
      if(shortest_dist==3) return .85;
      if(!this.fog_of_war) return .7;
      return 0;
    },
    on_mouse_enter(pos){
      this.hover_pos = pos
      if(this.is_visible(pos)) this.$emit('inspect', pos);
    },
    on_mouse_leave(){
      this.hover_pos = undefined;
      this.$emit('inspect', {});
    },
    is_targetable(pos){
      // need target pos and selection
      if(!pos || !this.selection) return false;
      // can't target itself
      if(this.allies_at(pos).some(e=>this.selection.includes(e.id))) return false;
      let selected_entities = this.entities.filter(e=>this.selection.includes(e.id));
      // can't target if selection does not exists
      if(!selected_entities) return false;
      // can't target if selection is an empty bulding
      if(selected_entities.every(e=>e.building && !this.allies_at(e.pos).some(ee=>!ee.building)))  return false;
      return true
    },
    on_click(pos){
      if(this.is_targetable(pos)){
        this.$emit('target', pos);
      }
      else if(this.is_ally_at(pos)){
        this.$emit('select', pos);
      }

    },
    start_drag(event){
      this.dragging=true;
      this.drag_from={x:event.clientX, y:event.clientY}
    },
    stop_drag(event){
      this.dragging=false;
    },
    drag(event){
      if(this.dragging){
        let drag_to={x:event.clientX, y:event.clientY}
        this.move(drag_to.x-this.drag_from.x, drag_to.y-this.drag_from.y);
        this.drag_from=drag_to;
      }
    },
  move(x,y){
    this.map_pos.x += x;
    this.map_pos.y += y;
  }

  },

  template: `
  <div
    id="map"
    @mousedown="start_drag"
    @mouseleave="stop_drag"
    @mouseup="stop_drag"
    @mousemove="drag"
    >

    <table
      v-if="world"
    >
      <tr v-for="_, y in world.size.y">
        <td
          v-for="_, x in world.size.x"
          @mouseenter="on_mouse_enter({x,y})"
          @mouseleave="on_mouse_leave()"
          @click.left="on_click({x,y})"
        >
          <cell
            :class="{target:selection, select:is_ally_at({x, y})}"
            :visible="is_visible({x,y})"
            :visibility="visibility({x, y})"
            :visited="is_visited({x,y})"
            :selected="is_selected({x,y})"
            :pos="{x,y}"
            :turn="turn"
            :entities="entities_at({x,y})"
            :selection="selection"
            :events="events_at({x,y})"
          ></cell>
        </td>
      </tr>
    </table>


    <arrow-path
      v-for="unit in this.allies.filter(a=>a.type=='unit')"
      :start="unit.pos"
      :path="unit.path"
      :size="world.size"
      :cell_size="cell_size"  
    ></arrow-path>
    <arrow
    v-if="is_targetable(hover_pos)"
    v-for="selection in get_selected()"
    :start="selection.pos"
    :end="hover_pos"
    :size="world.size"
    :cell_size="cell_size"
  ></arrow>


  </div>
  `
};

export const cell = {
  props: [
    'pos',
    'turn',
    'entities',
    'selection',
    'events',
    'visible',
    'visited',
    'inspected',
    'visibility'
  ],
  methods:{
    zindex(entity){
      return entity.type == 'unit' ? 1 : 0;
    },
    sorting(entity_a, entity_b){
      return this.zindex(entity_a) - this.zindex(entity_b)
    },
    is_selected(entity){
      return this.selection.includes(entity.id)
    },
  },
  template: `
  <div :class="{cell:true, inspected:inspected, visible:visible}">


  <entity
    v-if=visible
    v-for="entity in entities?.sort(sorting)"
    :entity=entity
    :turn=turn
    :selected="is_selected(entity)"
    draggable="false"
  />
  <entity
    v-else-if="visited"
    v-for="entity in entities?.sort(sorting)"
    :entity=entity
    :turn=turn
    :selected="is_selected(entity)"
    draggable="false"
  />


    <event
      v-if=visible
      v-for="event in events"
      :event=event
      :turn=turn
      draggable="false"
    />

    <span v-if="visited" class="fog" :style="'opacity:'+(0.8-visibility)"></span>
    <span v-else class="fog" :style="'opacity:'+(1-visibility)"></span>

  </div>
    `
};
