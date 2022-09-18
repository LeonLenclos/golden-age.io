let map = document.getElementById('map');
let map_ctx = map.getContext('2d');

let camera = {x:0, y:0};
let cursor = {x:0, y:0};
let previous_state = undefined;
let assets = {};
window.addEventListener('resize', resize_map);
map.addEventListener('mousemove', map_on_mousemove);


const TILE_SIZE = 32

function load_assets(){
  fetch('assets.json')
  .then(res => res.json())
  .then(out => {
    assets.sprites = {};
    out.children.find(dir=>dir.name=='sprites').children.forEach(dir=> {
      assets.sprites[dir.name] = {};
      dir.children.forEach(file => {
        let image = new Image();
        image.src = file.path;
        image.style.imageRendering = 'pixelated';
        image.onload = () => {
          assets.sprites[dir.name][file.name] = image;
        };
      });
    });
  });
}

function get_screen_offset() {
  return{
    x:map.width/2-camera.x,
    y:map.height/2-camera.y
  };
}

function screen_to_map(pos) {
  offset=get_screen_offset();
  return {
    x: (pos.x - offset.x)/TILE_SIZE,
    y: (pos.y - offset.y)/TILE_SIZE,
  };
}

function map_to_screen(pos) {
  offset=get_screen_offset();
  return {
    x: pos.x*TILE_SIZE + offset.x,
    y: pos.y*TILE_SIZE + offset.y,
  };
}

function draw_tile(pos, fill, stroke){
  p = map_to_screen(pos);
  let x = p.x-TILE_SIZE/2;
  let y = p.y-TILE_SIZE/2;
  let s = TILE_SIZE
  if(fill){
    map_ctx.fillStyle = fill;
    map_ctx.fillRect(x, y, s, s);
  }
  if (stroke) {
    map_ctx.strokeStyle = stroke;
    map_ctx.strokeRect(x, y, s, s);
  }
}

function draw_bg(){
  map_ctx.fillStyle = 'grey';
  map_ctx.fillRect(0,0,map.width,map.height);
}

function draw_grid(size){
  for (let x = 0; x < size.x; x++) {
      for (let y = 0; y < size.y; y++) {
        draw_tile({x:x,y:y}, null, 'white');
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
  let x = Math.floor(pos.x-TILE_SIZE/2);
  let y = Math.floor(pos.y-TILE_SIZE/2);
  let color = previous_state.players.find(p=>entity.owner==p.id).color;
  map_ctx.drawImage(assets.sprites[color].idle0, x, y);
}

function update_map(state) {
  state = state || previous_state;
  if(!state) return;
  previous_state = state;
  draw_bg();
  draw_grid(state.world.size);
  draw_tile(cursor, null, 'yellow');
  state.world.entities.forEach(draw_entity);
}

load_assets();
resize_map();
