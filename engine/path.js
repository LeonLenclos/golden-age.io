import astar from 'a-star';

const PATH_FINDING_MAX_DEST_CHECK = 13;

export function find_nearest_path(from, to, world, owner){
    let destinations = [to];
    let checked_dest = [];
    do {
      for (var dest of destinations) {
        let path = find_path(from, dest, world, owner)
        if (path) return path;
      }
      checked_dest = checked_dest.concat(destinations)
      destinations=[];
      checked_dest.forEach(dest => {
        destinations = dest.neighbors()
        .filter(d=>world.is_inside(d))
        .filter(d1=>!checked_dest.find(d2=>d1.equals(d2)))
        .concat(destinations);
      });
    } while (checked_dest.length < PATH_FINDING_MAX_DEST_CHECK)
    return undefined;
  }

export function find_path(from, to, world, owner){
    if(from.equals(to)) return [];
    let neighbor = (v) => v.neighbors().filter(v=>{
      return world.is_walkable_for(v, owner);
    });
    let path = astar({
      start:from,
      isEnd:v=>v.equals(to),
      neighbor:neighbor,
      distance:(a,b)=>a.manhattan(b),
      heuristic:v=>v.manhattan(to),
      hash:v=>v.toString(),
    });
    if (path.status=='success') {
      path.path.shift();
      return path.path;
    };
    return undefined;
  }
