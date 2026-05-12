import { createApp } from 'vue';
import { app } from 'app';
import * as components from 'components';
import * as svg_components from 'svg-components';
import * as map_components from 'map-components';




let main_app = createApp(app);
// components
main_app.component('messages', components.messages);
main_app.component('player-name', components.player_name);
main_app.component('entity-name', components.entity_name);
main_app.component('room', components.room);
main_app.component('fill-bar', components.fill_bar);
main_app.component('entity-card', components.entity_card);
main_app.component('creation-card', components.creation_card);
main_app.component('player-card', components.player_card);
main_app.component('inspector', components.inspector);
main_app.component('panel-col', components.panel_col);
main_app.component('selection', components.selection);
main_app.component('creations', components.creations);
main_app.component('join-room', components.join_room);
main_app.component('loading', components.loading);
main_app.component('start', components.start);
main_app.component('end', components.end);
main_app.component('waiting', components.waiting);
// map-components
main_app.component('main-map', map_components.main_map);
main_app.component('canvas-map', map_components.canvas_map);


main_app.component('cell', map_components.cell);
// svg-components
main_app.component('entity', svg_components.entity);
main_app.component('event', svg_components.event);
main_app.component('arrow', svg_components.arrow);
main_app.component('arrow-path', svg_components.arrow_path);

document.addEventListener("DOMContentLoaded", function(event) {
    main_app.mount('#app-container');
});

