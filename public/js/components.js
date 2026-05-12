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
  props: ['creation','index', 'possible'],
  methods:{
    entity()
    {
      return {type:this.creation.type, owner:this.$root.player_id};
    },
    hint(){
      const hints = {
        unit:'Can mine, fight and build',
        house:'Can create units',
        factory:'Can create gold mines',
      }
      return hints[this.creation.type];
    }
  },
  template: `
  <button
  :disabled="!possible"
  @click="$emit('click')"
  >
    <h2><entity-name :entity="entity()"></entity-name></h2>
    <small>{{hint()}}</small>
    <entity :entity="entity()"></entity>
    <div class="gold-value">{{creation.cost}}</div>
    <span class="shortcut">{{index + 1}}</span>
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
  data(){return{
    creations:[]
  }},
  props:['selected_types', 'gold'],
  methods:{
    can_create(creation){
      return creation.cost<= this.gold && creation.create_by.some(e=>this.selected_types.includes(e));
    },
    async load_available_entities() {
 
      try {  
        const response = await fetch('/available_entities.json');  
        if (!response.ok) throw new Error('Failed to fetch data');  
        this.creations = await response.json(); // Parse JSON  
      } catch (err) {  
        console.error(err.message)  
      } finally {  
        //this.isLoading = false;  
      }  
    }
  },
  mounted() {  
    // Fetch JSON from public/ directory  
    this.load_available_entities();  
  },  
  template: `
  <div>
    <panel-col title="creations">
      <div class="creations">
      <creation-card
        v-for="(creation, i) in creations"
        @click="$emit('creation', creation.type)"
        :creation=creation
        :possible="can_create(creation)"
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
    async load_about() {
 
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
    this.load_about();  
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
