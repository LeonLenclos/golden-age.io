



Vue.component('messages', {
  data(){
    return {
      input:'',
    };
  },
  props: ['messages'],
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
          :player="$root.who_is(message.emiter)"
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
});

Vue.component('player-name', {
  props: ['player'],
  template: `
    <span
      v-if="player"
      class="playername"
      :title="player.id"
      :style="'color:'+player.color"
      >
      {{player.name}}
    </span>
    <span v-else class="playername">???</span>
  `
});


Vue.component('entity-name', {
  props: ['entity'],
  template: `
    <span
      v-if="entity"
      class="entityname"
      :title="entity.id"
      :style="'color:'+$root.who_is(entity.owner)?.color||'inherit'"
      >
      {{entity.type}}
    </span>
    <span v-else class="entityname">???</span>
  `
});


Vue.component('room', {
  props: ['room'],
  template: `
  <div title="room" id="room">
    <header>
      <h2>{{room.name}}</h2>
      <button @click="$emit('quit_room')">quit</button>
    </header>
    <section class="roomstate">
      <strong v-if="room.players.length<2">Waiting for player...</strong>
      <strong v-else-if="room.turn<=0">Game starting in {{Math.abs(room.turn)}}</strong>
      <fill-bar v-else :value="room.turn" :max="room.turn_max"></fill-bar>
    </section>
    <section class="players">
      <player-card
        v-for="player in room.players"
        :player="player"
        :is_you="player.id==$root.id"
        ></player-card>
      </section>
  </div>
  `
});

Vue.component('fill-bar', {
    props: ['value', 'max', 'percent'],
    methods:{
      get_text(){
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

});

Vue.component('entity-card', {
  props: ['entity'],
  template: `
  <div class="card">
    <header>
      <h2><entity-name :entity=entity ></entity-name></h2>
      <entity-img :entity=entity :basic_sprite="true"></entity-img>
    </header>
    <main>
      <small>{{entity.pos.x}}, {{entity.pos.y}}</small>
      <fill-bar :value="entity.hp" :max="entity.hp_max"></fill-bar>
      <fill-bar v-if="entity.creation_progress != undefined"
      :value="entity.creation_progress" :max="1" :percent="true"></fill-bar>
    </main>
  </div>
  `
});

Vue.component('creation-card', {
  props: ['mission'],
  template: `
  <div class="card">
    <header>
      <h2>{{mission.type}}</h2>
      <action-img :action=mission.type></action-img>
    </header>
    <main>
      <fill-bar :value="mission.progress" :max="1" :percent="true"></fill-bar>
        <small>{{mission.status}}<span v-if=mission.status_details> ({{mission.status_details}})</span></small>
    </main>
  </div>
  `
});


Vue.component('player-card', {
  props: ['player', 'is_you'],
  template: `

  <div class="playercard">
    <header>
      <h2><player-name :player=player></player-name><span v-if="is_you"> (you)</span></h2>      
    </header>
    <main>
      <fill-bar class="gold-bar" :value="player.gold" :max="player.gold_max"></fill-bar>
    </main>
  </div>

  `
});



Vue.component('inspector', {
  props: ['pos', 'entities'],
  template: `
  <div class="panel" title="inspector" id="inspector">
    <small v-if="pos.x&&pos.y">inspecting position {{pos.x}},{{pos.y}}</small>
    <small v-else>(move your mouse over the map to inspect)</small>
    <div class=cards>
      <entity-card v-for="entity in entities" :entity=entity></entity-card>
    </div>
  </div>
  `
});





Vue.component('panel-col',{
    props:['title'],
    template: `
    <div class="panelcol">
      <header><h2>{{title}}</h2></header>
      <main>
        <slot></slot>
      </main>
    </div>
    `
});

Vue.component('selection', {
  props: ['selection', 'creations', 'mission'],
  methods:{
    mission_select(item){
      this.$emit('mission_select', item);
    }
  },
  template: `
  <div>
    <panel-col title="selected entity">
        <entity-card v-if="selection" :entity="selection"></entity-card>
    </panel-col>

    <panel-col title="creations">
      <div class="creations">
      <button
        v-for="(crea, i) in creations"
        :disabled="!crea.possible"
        @click="$emit('creation', crea.type)"
        >
          <entity-img :entity=crea></entity-img>
          <div class="gold-value">{{crea.cost}}</div>
          <span class="shortcut">{{['A or Q', 'Z or W'][i]}}</span>
        </button>

      </div>
    </panel-col>

  </div>
  `
});

// entity-img
Vue.component('join-room', {
  data:function(){return {
    player:readCookie('playername')||'',
    room:readCookie('favoriteroom')||'',
  };},
  methods:{
    join(){
      createCookie('favoriteroom', this.room)
      createCookie('playername', this.player)
      this.$emit('join_room', this.player, this.room);
    }

  },
  template: `
  <div
  class="fullscreen"
  id="join-room"
  @keyup.enter="join()">
    <h1>Join a room</h1>
    <div>
      <label for="player">Your name</label>
      <input name="player" v-model="player"/>
    </div>
    <div>
      <label for="room">Room name</label>
      <small>To have more chance to find an opponent, leave this field empty!</small>  
      <input name="room"  v-model="room"/>
    </div>

    <div>
      <button @click="join">join</button>
    </div>
  </div>
    `
});

// entity-img
Vue.component('loading', {

  props:['progress'],

  template: `
  <div class="fullscreen" id="loading">
    <h1>Loading</h1>
    <fill-bar :value="progress" max=1 :percent="true"></fill-bar>
  </div>
    `
});

Vue.component('start', {
  template: `
  <div class="fullscreen" id="start">
    <h1>Golden Age</h1>
    <button @click="$emit('start')">start</button>
  </div>
    `
});

Vue.component('main-map', {
  data(){
    return {
      dragging:false,
      drag_from:{x:0,y:0},
      map_pos:{x:0,y:0},
      hover_pos:undefined,
      entities:[],
      allies:[],

    };
  },
  props: [
    'players',
    'world',
    'selection',
  ],
  watch:{
    world(new_world, old_world){
      if(!new_world) return;
      this.entities = new_world.entities;
      this.allies = this.entities.filter(e=>e.owner==this.$root.id);
    }
  },
  methods:{
    get_selected(){
      return this.entities.find(e=>e.id==this.selection)
    },
    entities_at(pos){
      return this.entities.filter(e=>e.pos.x==pos.x && e.pos.y==pos.y);
    },
    allies_at(pos){
      return this.allies.filter(e=>e.pos.x==pos.x && e.pos.y==pos.y);
    },
    is_ally_at(pos){
      return this.allies.some(e=>e.pos.x==pos.x && e.pos.y==pos.y);
    },
    is_visible(pos){
      if(this.$root.room.playing=='ended') return true;
      return this.allies.some(e=>Math.abs(pos.x-e.pos.x)+Math.abs(pos.y-e.pos.y)<4);
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
      if(!pos || !this.selection) return false;
      // can't target itself
      if(this.allies_at(pos).some(e=>e.id == this.selection)) return false;
      let entity = this.$root.what_is(this.selection);
      // can't target if selection is an empty bulding
      if(entity.building && !this.allies_at(entity.pos).some(e=>!e.building))return false;
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
            :pos="{x,y}"
            :entities="entities_at({x,y})"
          ></cell>
        </td>
      </tr>
    </table>

    <arrow
    v-if="is_targetable(hover_pos)"
    :start="get_selected().pos"
    :end="hover_pos"
    :size="world.size"

  ></arrow>
  </div>
  `
});


Vue.component('arrow', {
  data(){
    return{
      cell_size:33,
    };
  },
  props:['start', 'end', 'size'],
  methods:{
    get_width(){return this.cell_size*(this.size.x+1)},
    get_height(){return this.cell_size*(this.size.y+1)},
    get_view_box(){
      return `0 0 ${this.get_width()} ${this.get_height()}`;
    }
  },
  template:`
<svg
  class="arrow"
  xmlns="http://www.w3.org/2000/svg"
  :viewBox="get_view_box()"
  :width="get_width()"
  :height="get_height()"
  >
  <defs>
      <marker id="arrow-head" viewBox="0 0 20 20" refX="10" refY="10" markerWidth="10" markerHeight="10" shape-rendering="crispEdges" orient="auto-start-reverse" fill="white">
        <path d="M 0 0 L 20 10 L 0 20 z" />
      </marker>
  </defs>
  <line
    id='arrow-line'
    marker-end='url(#arrow-head)'
    stroke-width='1'
    fill='none' stroke='white'
    :x1="cell_size*(start.x+.5)"
    :y1="cell_size*(start.y+.5)"
    :x2="cell_size*(end.x+.5)"
    :y2="cell_size*(end.y+.5)"
  ></line>
</svg>
`
});


Vue.component('entity-img', {
  props: [
    'entity',
    'selected',
    'basic_sprite',
  ],
  methods:{
    get_src(){
      let owner = this.$root.who_is(this.entity.owner)
      let color = owner?.color || 'white';
      let name = this.entity.type;
      if (this.entity.sprite && !this.basic_sprite){
        name = `${this.entity.sprite}${this.$root.room.turn%2}`;
      }
      if (this.entity.under_construction){
        name = 'worksite';
      }
      return `assets/sprites/${color}/${name}.png`
    },
    moving_from(x, y){
      if(!this.entity.prev_pos) return false;
      return this.entity.prev_pos.x - this.entity.pos.x == x
          && this.entity.prev_pos.y - this.entity.pos.y == y;
    }
  },
  template: `
      <img
        :class="{
          selected:selected,
          movingfromleft:moving_from(-1, 0),
          movingfromright:moving_from(1, 0),
          movingfromtop:moving_from(0, -1),
          movingfrombottom:moving_from(0, 1)
        }"
        :src="get_src()"
      >
      `
});

Vue.component('action-img',{
  props: ['action'],
  methods:{
    get_src(){
      return `assets/actions/${this.action}.png`;
    }
  },
  template: `
<img :src="get_src()"></img>
  `
});

Vue.component('cell', {
  props: [
    'pos',
    'entities',
    'visible'
  ],
  methods:{
    zindex(entity){
      return entity.type == 'unit' ? 1 : 0;
    },
    sorting(entity_a, entity_b){
      return this.zindex(entity_a) - this.zindex(entity_b)
    },
    is_selected(entity){
      return this.$root.selection==entity.id
    },
    is_inspected(){
      return this.$root.inspected_pos.x == this.pos.x && this.$root.inspected_pos.y == this.pos.y;
    }
  },
  template: `

  <div :class="{cell:true, inspected:is_inspected(), visible:visible}">
    <entity-img
      v-if=visible
      v-for="entity in entities?.sort(sorting)"
      :entity=entity
      :selected="is_selected(entity)"
      draggable="false"
    />
    <action-img
      v-if="is_inspected() && this.$root.mission_selected"
      :action="this.$root.mission_selected"
      ></action-img>
  </div>
    `
});
