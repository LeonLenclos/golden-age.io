World is a 2D grid of cells

Property {
  str name
  ? value
}


Action{
  state {
    Int progress
    Bool in_progress
  }
  Int progress_max
  Int wood_cost
  Int food_cost
  Bool loop
}

Build extends Action {
  Vec position
  Building building
}

Construct extends Action {
  Vec position
}

Move extends Action {
  Vec position
}

Harvest extends Action {
  Vec position
}

Chop extends Action {
  Vec position
}

Train extends Action {
  Unity unity
}




Entity{
  state {
    Vec pos
    Int hp
    User owner
    [Action] queue
  }
  Int line_of_sight
  Int hp_max
  Str type
  [Property] properties
  [Action] catalog

}

Buidling extends Entity{
  state{
    rally_pos
  }
}

Unit extends Entity{
  state{
  }
  Int attack_force
  Int work_force
}
