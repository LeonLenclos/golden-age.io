let map = document.getElementById('map');
let map_ctx = map.getContext('2d');

let camera = {x:0, y:0};
let cursor = {x:0, y:0};
let previous_state = undefined;
let assets = {};
window.addEventListener('resize', resize_map);
map.addEventListener('mousemove', map_on_mousemove);


const TILE_WIDTH = 128
const TILE_HEIGHT = 64

function load_assets(){
  fetch('assets.json')
  .then(res => res.json())
  .then(out => {
    assets = {
      sprites:Object.fromEntries(out.children.find(dir=>dir.name=='sprites').children.map(file=>{
        let image = new Image();
        image.src = file.path;
        return [file.name, image];
      })),
    };
  });
}

function get_screen_offset() {
  return{
    x:map.width/2,
    y:map.height/2
  };
}

function screen_to_map(pos) {
  offset=get_screen_offset();
  let x = pos.x - offset.x;
  let y = pos.y - offset.y;
  return {
    x: (y/TILE_HEIGHT/2 + x/TILE_WIDTH/2)*2,
    y: (y/TILE_HEIGHT/2 - x/TILE_WIDTH/2)*2,
  };
}

function map_to_screen(pos) {
  offset=get_screen_offset();
  return {
    x: (pos.x - pos.y) * TILE_WIDTH/2 + offset.x,
    y: (pos.x + pos.y) * TILE_HEIGHT/2 + offset.y,
  };
}

function nearness(pos){
  return pos.x + pos.y;
}

function draw_tile(pos){
  let a = map_to_screen({x:pos.x-.5, y:pos.y-.5});
  let b = map_to_screen({x:pos.x+.5, y:pos.y-.5});
  let c = map_to_screen({x:pos.x+.5, y:pos.y+.5});
  let d = map_to_screen({x:pos.x-.5, y:pos.y+.5});
  map_ctx.beginPath();
  map_ctx.moveTo(a.x, a.y);
  map_ctx.lineTo(b.x, b.y);
  map_ctx.lineTo(c.x, c.y);
  map_ctx.lineTo(d.x, d.y);
  map_ctx.lineTo(a.x, a.y);
  map_ctx.fill();
  map_ctx.stroke();
}

function draw_bg(){
  map_ctx.fillRect(0,0,map.width,map.height);
}

function draw_grid(size){
  for (let x = 0; x < size.x; x++) {
      for (let y = 0; y < size.y; y++) {
        draw_tile({x:x,y:y});
    }
  }
}

function resize_map(){
  map.width = window.innerWidth;
  map.height = window.innerHeight;
  update_map();
}

function map_on_mousemove(event){
  let pos = screen_to_map({x:event.clientX, y:event.clientY});
  cursor = {x:Math.floor(pos.x+.5), y:Math.floor(pos.y+.5)};
  update_map();
}

function draw_entity(entity) {
  let pos = map_to_screen(entity.pos)
  map_ctx.drawImage(assets.sprites[entity.type], pos.x, pos.y);
}

function update_map(state) {
  state = state || previous_state;
  if(!state) return;
  previous_state = state;
  let map_ctx = map.getContext('2d');
  map_ctx.fillStyle='grey';
  draw_bg();
  map_ctx.strokeStyle = "blue";
  map_ctx.fillStyle = "lightblue";
  draw_grid(state.world.size);
  map_ctx.strokeStyle = "rgba(255,255,255,0)";
  map_ctx.fillStyle = "rgba(255,255,255,0.3)";
  draw_tile(cursor);
  state.world.entities.sort(entity=>nearness(entity.pos)).forEach(draw_entity);


}

load_assets();
resize_map();
