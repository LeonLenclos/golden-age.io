

export const canvas_map = {
  data(){
    return {
      ctx:undefined,
    };
  },
  mounted(){
    this.ctx = this.$refs.canvas.getContext("2d");
    
  },
  props: [
    'world',
    'turn',
  ],
  watch:{
    turn(new_turn){
      console.log('turn', new_turn);
    }
  },
  methods:{

    draw(){
    }

  },

  template: `
  <canvas ref="canvas"></canvas>
 
  `
};


export const main_map = {
  data(){
    return {
      dragging:false,
      drag_from:{},
      drag_to:{},
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
    on_left_click(pos){
       this.$emit('select', pos);
    },
    on_right_click(pos){
      this.$emit('target', pos);
    },
    on_shift_left_click(pos){
      console.log("shift");
       this.$emit('select_add', pos);
    },
    on_shift_right_click(pos){
      
    },
    on_mouse_down(pos){
      this.dragging=true;
      this.drag_from=pos
    },
    on_mouse_up(pos){
      this.drag_to=pos
      if(this.drag_from.x!=this.drag_to.x || this.drag_from.y!=this.drag_to.y){
         this.$emit('select_zone', this.drag_from, this.drag_to);
       }
      this.drag_from = this.drag_to = {};
      this.dragging=false;
    },
    on_mouse_move(pos){
      if(this.dragging){
        let drag_to=pos
      }
    },

  },

  template: `
  <div
    id="map"
    @mouseleave="on_mouse_leave"
    >

    <table
      v-if="world"
    >
      <tr v-for="_, y in world.size.y">
        <td
          v-for="_, x in world.size.x"
          @mouseenter="on_mouse_enter({x,y})"
          @mouseleave="on_mouse_leave()"
          @mouseup="on_mouse_up({x,y})"
          @mousedown="on_mouse_down({x,y})"
          @mousemove="on_mouse_move({x,y})"
          @click.left.exact="on_left_click({x,y})"
          @click.right.exact.prevent="on_right_click({x,y})"
          @click.left.shift.exact="on_shift_left_click({x,y})"
        >
        </td>
      </tr>
    </table>
    <canvas-map :world=world :turn=turn></canvas-map>
  </div>
  `,
  
    old_template: `
  <div
    id="map"
    @mouseleave="on_mouse_leave"
    >

    <table
      v-if="world"
    >
      <tr v-for="_, y in world.size.y">
        <td
          v-for="_, x in world.size.x"
          @mouseenter="on_mouse_enter({x,y})"
          @mouseleave="on_mouse_leave()"
          @mouseup="on_mouse_up({x,y})"
          @mousedown="on_mouse_down({x,y})"
          @mousemove="on_mouse_move({x,y})"


          @click.left.exact="on_left_click({x,y})"
          @click.right.exact.prevent="on_right_click({x,y})"
          @click.left.shift.exact="on_shift_left_click({x,y})"
          
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
    <!--<arrow
    v-if="is_targetable(hover_pos)"
    v-for="selection in get_selected()"
    :start="selection.pos"
    :end="hover_pos"
    :size="world.size"
    :cell_size="cell_size"
  ></arrow>-->


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
