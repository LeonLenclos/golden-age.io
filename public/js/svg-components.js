Vue.component('entity', {
    data(){return{
        frame:0,
    }},
    props:['entity', 'turn', 'selected', 'basic_sprite'],
    watch:{
        turn(new_turn, old_turn){
            if(new_turn != old_turn){
                this.animate();
            }
        }
    },
    mounted(){
        this.animate();
    },
    methods:{
        sprite(){
            return this.basic_sprite ? undefined : this.entity.sprite;
        },
        animate(){
            this.frame = 0;
            setTimeout(()=>{this.frame = 1}, 1250/2);
        },
        ally_or_enemy(){
            if(!this.entity.owner) return;
            if(this.entity.owner == this.$root.id){
                return 'ally'
            }
            return 'enemy'
        },
        moving_from(x, y){
            if(!this.entity.prev_pos) return false;
            return this.entity.prev_pos.x - this.entity.pos.x == x
                && this.entity.prev_pos.y - this.entity.pos.y == y;
        },      
    },
    template:`
    <!-- this regex : v-[^"]*="[^"]*"
        for deleting all v-statements and open in inkscape.
    -->
    <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        :class="{
            entity : true,
            selected:selected,
            ally: entity.owner == $root.id,
            enemy: entity.owner != $root.id,
            water: entity.type=='water',
            movingfromleft:moving_from(-1, 0),
            movingfromright:moving_from(1, 0),
            movingfromtop:moving_from(0, -1),
            movingfrombottom:moving_from(0, 1)    
        }"

    >

    <!-- WATER -->

    <g id="water"
        v-if="entity.type=='water'"
    >
        <path v-if="frame==0" data-color="water" d="m 25.749999,23 c 0,0 -2.375,2.053366 -4.75,0 -2.375,-2.053367 -4.75,0 -4.75,0 M 14.75,8.9999999 c 0,0 -2.375,2.0533661 -4.75,0 -2.374998,-2.0533662 -4.749998,0 -4.749998,0" />
        <path v-if="frame==1" data-color="water" d="m 25.749999,23 c 0,0 -2.375,-2.053366 -4.75,0 -2.375,2.053367 -4.75,0 -4.75,0 M 14.75,8.9999999 c 0,0 -2.375,-2.0533661 -4.75,0 -2.374998,2.0533661 -4.749998,0 -4.749998,0" />
    </g>

    <!-- GOLD -->

    <g id="gold"
        v-if="entity.type=='gold'"
    >
        <g v-if="entity.hp <= 10">
        <path data-color="gold" d="m 8.000071,29 h 16 l -4,-4 v -4 -4 l -4,-4 -4,4 -4,4 z"/>
        <path data-color="gold" d="m 20.000071,21 v 4 l -4,4 m -4,-4 h -4 m 8,-4 -4,-4 m 8,4 h -4 l -4,4 4,4" />
        </g>
        <g v-else-if="entity.hp <= 20">
        <path data-color="gold" d="m 6,29 h 20 v -4 l -4,-4 v -4 h -4 l -4,-4 -4,4 v 4 4 z"/>
        <path data-color="gold" d="m 18,29 v -4 h -8 m 4,-4 h -4 m 12,0 -4,4 -4,-4 4,-4" />
        </g>
        <g v-else-if="entity.hp <= 30">
        <path data-color="gold" d="m 4,29 h 24 v -4 l -4,-4 -4,-4 -4,-4 -4,4 v 4 H 8 v 4 z"/>
        <path data-color="gold" d="m 20,17 v 4 l -4,4 m -8,-4 4,4 v 4 m 4,-4 -4,-4 h 4 l 4,-4 m 8,8 H 16 l 4,4" />
        </g>
        <g v-else-if="entity.hp <= 40">
        <path data-color="gold" d="m 2,29 h 28 v -4 l -4,-4 v -4 l -4,-4 -4,-4 -4,4 v 4 h -4 l -4,4 v 4 z"/>
        <path data-color="gold" d="m 26,21 -4,4 M 10,21 6,25 m 16,0 h -8 m 4,-4 -4,-4 m 16,12 -4,-4 h -4 l -4,-4 4,-4 v -4 m -8,4 -4,4 4,4 -4,4" />
        </g>
        <g v-else-if="entity.hp <= 50">
        <path data-color="gold" d="m 2.073327,29 h 27.99993 l -3.99993,-4 -7e-5,-4 v -4 h -4 v -4 l -4,-4 V 5 l -4,4 V 5 h -4 l -4,4 v 4 l -4,4 v 4 4 z"/>
        <path data-color="gold" d="m 6.073257,29 4,-4 h 4 m -8,-12 v 8 l -4,4 h 8 v -4 m 4,-4 -4,4 m -4,-8 h 4 l 4,4 h 4 v 4 l -4,4 4,4 m 4,-8 v 8 m 4,-8 -4,4 m -4,-16 v 8 l 4,4 v -4 m -8,-8 -4,4 h 8" />
        </g>
    </g>



    <!-- SMOKE -->

    <g id="smoke"
        v-if="sprite() == 'create'"
    >
        <path v-if="frame==0" data-color="silver" d="m 8,7 v 1 h 2 V 7 c 0,0 1,0 1,-1 0,0 1,0 1,-1 0,0 1,0 1,-1 C 13,3 12,3 12,3 12,3 12,2 11,2 10,2 10,3 10,3 10,3 9,3 9,4 9,4 9,3 8,3 7,3 7,4 7,4 7,4 6,4 6,5 6,6 7,6 7,6 7,6 7,7 8,7 Z" />
        <path v-if="frame==1" data-color="silver" d="m 11,4 c 0,0 1,0 1,1 0,1 -1,1 -1,1 0,0 0,1 -1,1 V 8 H 8 V 7 C 8,7 7,7 7,6 7,6 6,6 6,5 6,5 5,5 5,4 5,3 6,3 6,3 6,3 6,2 7,2 8,2 8,3 8,3 8,3 8,2 9,2 c 1,0 1,1 1,1 0,0 1,0 1,1 z" />
    </g>
    <g id="big_smoke"
        v-else-if="sprite() == 'critical-create'"
    >
        <path v-if="frame==0" data-color="silver" d="M 7,8 C 7,8 6,8 6,7 6,7 5,7 5,6 5,6 4,6 4,5 4,5 3,5 3,4 3,3 4,3 4,3 4,3 3,3 3,2 3,1 4,1 4,1 4,1 5,1 5,2 5,2 5,1 6,1 7,1 7,2 7,2 7,2 7,1 8,1 c 1,0 1,1 1,1 0,0 1,0 1,1 0,0 0,-1 1,-1 1,0 1,1 1,1 0,0 0,-1 1,-1 1,0 1,1 1,1 0,0 1,0 1,1 0,0 1,0 1,1 0,1 -1,1 -1,1 0,0 0,1 -1,1 -1,0 -1,-1 -1,-1 0,0 0,1 -1,1 -1,0 0,1 -1,1 z" />
        <path v-if="frame==1" data-color="silver" d="M 5,2 C 4,2 4,3 4,3 4,3 3,3 3,4 3,4 2,4 2,5 2,6 3,6 3,6 3,6 3,7 4,7 5,7 5,6 5,6 5,6 5,7 6,7 7,7 6,8 7,8 h 4 c 0,0 1,0 1,-1 0,0 1,0 1,-1 0,0 1,0 1,-1 0,0 1,0 1,-1 C 15,3 14,3 14,3 14,3 15,3 15,2 15,1 14,1 14,1 14,1 13,1 13,2 13,2 13,1 12,1 11,1 11,2 11,2 11,2 10,2 10,3 10,3 10,2 9,2 8,2 8,3 8,3 8,3 8,2 7,2 6,2 6,3 6,3 6,3 6,2 5,2 Z" />
    </g>

    <!-- BUILDING -->

    <g id="worksite"
        v-if="entity.building && entity.under_construction"
    >
        <path data-color="player" d="m 5.0000012,22 v 6 H 27.000001 v -6 c 0,0 -21.9999998,0 -21.9999998,0 z" />
        <path data-color="iron" d="m 16.100404,22 h 4.400003 v 2.000003 h -4.400003 z m -0.100403,2 h 2.200003 v 2.000003 h -2.200003 z m -2.200004,0 h 2.200004 v 2.000003 h -2.200004 z m 2.2,-3.999997 h 2.200004 v 2.000003 h -2.200004 z m 2.2,1.999994 h 2.200004 V 24 h -2.200004 z m 2.2,3e-6 H 24.8 v 2.000003 h -4.400003 z m 2.2,-2 H 27 v 2.000003 H 22.599997 Z M 7.1999968,22 H 11.6 v 2.000003 H 7.1999968 Z m 8.8000042,6.000003 v -6 M 13.799997,19.999996 H 18.2 v 2.000003 h -4.400003 z m -2.199999,-2 h 4.400003 v 2.000003 H 11.599998 Z M 7.199999,18 h 4.400003 v 2.000003 H 7.199999 Z m 2.1999989,1.999996 h 4.4000031 v 2.000003 H 9.3999979 Z M 4.999999,20 h 4.4000033 v 2.000003 H 4.999999 Z" />
    </g>
    <g id="house"
        v-else-if="entity.type=='house'"
    >
      <path data-color="iron" d="M 29,15.999997 H 14 L 9,9.9999973 h 14 z"/>
      <path data-color="player" d="m 16,15.999997 v 12 m -6,-17 -5,5 v 12 h 22 v -12 l -5,-5 z"/>
      <path data-color="iron" d="M 3,15.999997 H 17 L 23,9.9999973 H 9 Z m 4.000001,2.000001 h 3 v 5 h -3 z m 10.999992,1 h 7 v 9 h -7 z"/>
      <path data-color="iron" d="M 8.999993,12.999999 V 7.9999993 m -2,0 v 4.9999997 h 2 l 2,-2 V 7.9999993 Z"/>
    </g>
    <g id="factory"
        v-else-if="entity.type=='factory'"
    >
        <path data-color="player" d="M 15.999993,13 V 28 M 4.9999934,13.000001 26.999993,13 v 15 l -21.9999996,1e-6 z" />
        <path data-color="player" d="M 11.999993,28 H 3.9999934 v -2 h 7.9999996 z m 0,-2 v 2 h 2 v -4 c 0,0 -2,2 -2,2 z" />
        <path data-color="iron" d="m 17.999994,19 h 7 v 9 h -7 z" />
        <path data-color="iron" d="m 17.999993,19 h 7 v 9 h -7 z M 4.9991355,12.999689 v 2 H 15.999135 v -2 z m 10.9999995,0 v 2 h 11 v -2 z M 13.999993,24 H 5.9999934 l -2,2 h 7.9999996 z" />
        <path data-color="iron" d="M 8.9999934,26 V 7.9999997 m -2,0 V 26 h 2 L 10.999993,24 V 7.9999997 Z" />
    </g>


    <!-- TOOL -->

    <g id="hammer-right"
        v-if="sprite()=='build'"
        :transform="frame==0?'rotate(-90,20,15)':undefined"
    >
        <path data-color="iron" d="m 23.139926,4.2320683 -1.414214,-1.4142135 -7.778175,7.7781742 1.414214,1.414214 z"/>
        <path data-color="silver" d="M 21.195382,9.3585925 23.670256,6.8837188 19.074062,2.2875247 16.599188,4.7623984 Z"/>
    </g>
    <g id="pick-right"
        v-if="sprite()=='mine'"
        :transform="frame==0?'rotate(-90,20,15)':undefined"
    >
        <path data-color="iron" d="m 22.899476,1.7868228 1.414213,1.4142135 -9.899495,9.8994947 -1.414213,-1.414213 z" />
        <path data-color="silver" d="M 25.374347,10.625657 C 24.667241,8.504337 22.54592,6.383017 22.54592,6.383017 L 19.717493,3.554589 c 0,0 -2.12132,-2.12132 -4.24264,-2.828427 0,0 2.828427,-1.414213 7.071067,2.828428 4.242641,4.242641 2.828427,7.071068 2.828427,7.071067 z"/>
    </g>
    <g id="sword-right-critical-effect"
        v-if="frame==0&&sprite()=='critical-attack'"
    >
        <path data-color="white" d="M 25.634498,0.69653448 18.648447,7.7247642 c 0,0 -10.1884246,-4.3184276 -5.421202,9.0387838 L 6.2271344,9.869393 c 0,0 -5.46386498,-10.73425036 19.4073636,-9.17285852 z"/>
    </g>
    <g id="sword-left-critical-effect"
    v-if="frame==1&&sprite()=='critical-defend'"
    >
        <path data-color="white" d="M 6.5329105,0.69653448 13.518961,7.7247642 c 0,0 10.188425,-4.3184276 5.421202,9.0387838 l 7.000111,-6.894155 c 0,0 5.463865,-10.73425036 -19.4073635,-9.17285852 z"/>
    </g>
    <g id="sword-right"
        v-if="sprite()?.endsWith('attack')"
        :transform="frame==0?'rotate(-90,20,15)':undefined"
    >
        <path data-color="silver" d="m 23.847032,0.69653448 h 1.414214 V 2.110748 l -9.899495,9.899495 -1.414214,-1.414214 z"/>
        <path data-color="iron" d="m 17.483071,9.8889226 -2.12132,2.1213204 -1.414214,-1.414214 2.121321,-2.1213199 -1.414214,-1.4142136 c 0,0 1.414214,-1.4142136 1.414214,-1.4142136 l 4.24264,4.2426407 -1.414213,1.4142134 c 0,0 -1.414214,-1.4142134 -1.414214,-1.4142134"/>
    </g>
    <g id="sword-left"
        v-if="sprite()?.endsWith('defend')"
        :transform="frame==1?'rotate(90,11.5,15)':undefined"
    >  
        <path data-color="silver" d="M 7.904861,0.69653448 H 6.490647 V 2.110748 l 9.899495,9.899495 1.414214,-1.414214 z"/>
        <path data-color="iron" d="m 14.268822,9.8889226 2.12132,2.1213204 1.414214,-1.414214 -2.121321,-2.1213199 1.414214,-1.4142136 c 0,0 -1.414214,-1.4142136 -1.414214,-1.4142136 l -4.24264,4.2426407 1.414213,1.4142134 c 0,0 1.414214,-1.4142134 1.414214,-1.4142134"/>
    </g>

    <!-- UNIT -->
    
    <g id="unit"
        v-if="sprite()==undefined && entity.type=='unit'"
    >
        <path data-color="player" d="m 12,9.9999998 h 1 c 0,0 1,0 1,-1 v -2 c 0,0 0,-1.9999997 2,-1.9999997 2,0 2,1.9999997 2,1.9999997 v 2 c 0,0 0,1 1,1 h 1 c 0,0 2,0 2,2.0000002 v 6.5 c 0,0 0,1.5 -1.5,1.5 C 19,20 19,18.5 19,18.5 V 13 25.5 c 0,0 0,1.5 -1.5,1.5 C 16,27 16,25.5 16,25.5 V 18 25.5 c 0,0 0,1.5 -1.5,1.5 C 13,27 13,25.5 13,25.5 V 13 18.5 c 0,0 0,1.5 -1.5,1.5 C 9.9999995,20 9.9999995,18.5 9.9999995,18.5 V 12 c 0,0 0,-2.0000002 2.0000005,-2.0000002"/>
    </g>
    <g id="resident"
        v-if="sprite()=='flag'"
    >
        <path data-color="player" d="m 21.5,25 v 2 c 0,0 0,1 -1,1 -1,0 -1,-1 -1,-1 V 23 H 18 v -2 h 2.5 v -1 c 0,0 0,-1 1,-1 1,0 1,1 1,1 v 1 H 25 v 2 h -1.5 v 4 c 0,0 0,1 -1,1 -1,0 -1,-1 -1,-1 z"/>
    </g>
    <g id="unit-walk-0"
        v-if="sprite()=='walk'"
    >
        <path v-if="frame==0" data-color="player" d="m 13.000107,17 v -4 m -2.569482,6.596964 C 10.000107,19.152667 10.000107,18.5 10.000107,18.5 V 12 c 0,0 0,-2 2,-2 l 1,-10e-7 c 0,0 1,0 1,-0.999999 V 7 c 0,0 0,-2 2,-2 2,0 2,2 2,2 v 2 c 0,0 0,0.999999 1,0.999999 h 1 c 0,0 2,0 2,2.000001 v 6.5 c 0,0 0,1.5 -1.5,1.5 -1.5,0 -1.5,-1.5 -1.5,-1.5 V 13 25.5 c 0,0 0,1.5 -1.5,1.5 -1.5,0 -1.5,-1.5 -1.5,-1.5 V 18 l -3,3 1.474874,1.474874 c 0,0 1.06066,1.06066 0,2.12132 -1.06066,1.06066 -2,-0.12132 -2,-0.12132 L 11.000107,23 c -2.015671,-2.221952 0,-4 0,-4 l 2,-2"/>
        <path v-if="frame==1" data-color="player" d="m 18.999893,17 v -4 m 2.569482,6.596964 C 21.999893,19.152667 21.999893,18.5 21.999893,18.5 V 12 c 0,0 0,-2 -2,-2 l -1,-10e-7 c 0,0 -1,0 -1,-0.999999 V 7 c 0,0 0,-2 -2,-2 -2,0 -2,2 -2,2 v 2 c 0,0 0,0.999999 -1,0.999999 h -1 c 0,0 -2,0 -2,2.000001 v 6.5 c 0,0 0,1.5 1.5,1.5 1.5,0 1.5,-1.5 1.5,-1.5 V 13 25.5 c 0,0 0,1.5 1.5,1.5 1.5,0 1.5,-1.5 1.5,-1.5 V 18 l 3,3 -1.474874,1.474874 c 0,0 -1.06066,1.06066 0,2.12132 1.06066,1.06066 2,-0.12132 2,-0.12132 L 20.999893,23 c 2.015671,-2.221952 0,-4 0,-4 l -2,-2"/>
    </g>
    <g id="unit-action-right-0"
        v-if="['build','attack', 'critical-attack','mine'].includes(sprite())"
    >
        <path v-if="frame==0&&sprite()?.startsWith('critical')" data-color="player" d="m 25.15147,12.059055 v -2 c 0,0 0,-2 -1.999994,-2 -1.999994,0 -1.999994,2 -1.999994,2 0,0.666667 -2.6e-5,1.765946 0,2 2.6e-5,0.234054 -1.5e-5,1 -1.000015,1 -1,0 -1.5,1 -1.5,1 0,0 -3.207036,3.182404 -5,5 0,0 -0.999996,1 0,2 1,1 2,0 2,0 l 3.5,-3.5 1.000018,-1 v 12 c 0,0 0,1.5 1.499996,1.5 1.499995,0 1.499995,-1.5 1.499995,-1.5 v -7.5 7.5 c 0,0 0,1.5 1.499995,1.5 1.499996,0 1.499996,-1.5 1.499996,-1.5 v -11.55815 c 0,-0.916131 0.999996,-0.94185 0.999996,-0.94185 0,0 1.999994,0 1.999994,-2 V 7.5590545 c 0,0 0,-1.4999997 -1.499995,-1.4999997 -1.499995,0 -1.499995,1.4999997 -1.499995,1.4999997 v 5.5000005 c -0.999997,0 -0.999997,-1 -0.999997,-1 z"/>
        <path v-else-if="frame==0" data-color="player" d="m 19.151467,17.559055 -3.5,3.5 c 0,0 -1,1 -2,0 -0.999996,-1 0,-2 0,-2 1.792964,-1.817596 5,-5 5,-5 0,0 0.5,-1 1.5,-1 1,0 1.000041,-0.765946 1.000015,-1 -2.6e-5,-0.234054 0,-1.333333 0,-2 0,0 0,-2 1.999994,-2 1.999994,0 1.999994,2 1.999994,2 v 2 c 0,0 0,1 0.999997,1 h 0.999996 c 0,0 1.999994,0 1.999994,2 v 6.5 c 0,0 0,1.5 -1.499995,1.5 -1.499995,0 -1.499995,-1.5 -1.499995,-1.5 v -5.5 12.5 c 0,0 0,1.5 -1.499996,1.5 -1.499995,0 -1.499995,-1.5 -1.499995,-1.5 v -7.5 7.5 c 0,0 0,1.5 -1.499995,1.5 -1.499996,0 -1.499996,-1.5 -1.499996,-1.5 v -12 z"/>
        <path v-if="frame==1" data-color="player" d="m 19.651476,12.059055 c 0.50618,0.50618 1.500006,0.5 1.500006,0 v -2 c 0,0 0,-1.9999999 1.999994,-1.9999999 1.999994,0 1.999994,1.9999999 1.999994,1.9999999 v 2 c 0,0 0,1 0.999997,1 h 0.999996 c 0,0 1.999994,0 1.999994,2 v 6.5 c 0,0 0,1.5 -1.499995,1.5 -1.499995,0 -1.499995,-1.5 -1.499995,-1.5 v -5.5 12.5 c 0,0 0,1.5 -1.499996,1.5 -1.499995,0 -1.499995,-1.5 -1.499995,-1.5 v -7.5 7.5 c 0,0 0,1.5 -1.499995,1.5 -1.499996,0 -1.499996,-1.5 -1.499996,-1.5 v -12 l -6.025144,-6 c 0,0 -0.949726,-1.0000001 0.05027,-1.9999999 1,-1 2,0 2,0 z"/>
    </g>
    <g id="unit-action-left-0"
        v-if="['defend', 'critical-defend'].includes(sprite())"
    >
        <path v-if="frame==0" data-color="player" d="m 12.100417,12.059055 c -0.50618,0.50618 -1.500006,0.5 -1.500006,0 v -2 c 0,0 0,-1.9999999 -1.999994,-1.9999999 -1.999994,0 -1.999994,1.9999999 -1.999994,1.9999999 v 2 c 0,0 0,1 -0.999997,1 H 4.60043 c 0,0 -1.999994,0 -1.999994,2 v 6.5 c 0,0 0,1.5 1.499995,1.5 1.499995,0 1.499995,-1.5 1.499995,-1.5 v -5.5 12.5 c 0,0 0,1.5 1.499996,1.5 1.499995,0 1.499995,-1.5 1.499995,-1.5 v -7.5 7.5 c 0,0 0,1.5 1.499995,1.5 1.499996,0 1.499996,-1.5 1.499996,-1.5 v -12 l 6.025144,-6 c 0,0 0.949726,-1.0000001 -0.05027,-1.9999999 -1,-1 -2,0 -2,0 z"/>
        <path v-if="frame==1&&sprite()?.startsWith('critical')" data-color="player" d="m 6.600423,12.059055 v -2 c 0,0 0,-2 1.999994,-2 1.999994,0 1.999994,2 1.999994,2 0,0.666667 2.6e-5,1.765946 0,2 -2.6e-5,0.234054 1.5e-5,1 1.000015,1 1,0 1.5,1 1.5,1 0,0 3.207036,3.182404 5,5 0,0 0.999996,1 0,2 -1,1 -2,0 -2,0 l -3.5,-3.5 -1.000018,-1 v 12 c 0,0 0,1.5 -1.499996,1.5 -1.499995,0 -1.499995,-1.5 -1.499995,-1.5 v -7.5 7.5 c 0,0 0,1.5 -1.499995,1.5 -1.499996,0 -1.499996,-1.5 -1.499996,-1.5 v -11.55815 c 0,-0.916131 -0.999996,-0.94185 -0.999996,-0.94185 0,0 -1.9999939,0 -1.9999939,-2 V 7.5590545 c 0,0 0,-1.4999997 1.4999949,-1.4999997 1.499995,0 1.499995,1.4999997 1.499995,1.4999997 v 5.5000005 c 0.999997,0 0.999997,-1 0.999997,-1 z"/>
        <path v-else-if="frame==1" data-color="player" d="m 12.600426,17.559055 3.5,3.5 c 0,0 1,1 2,0 0.999996,-1 0,-2 0,-2 -1.792964,-1.817596 -5,-5 -5,-5 0,0 -0.5,-1 -1.5,-1 -1,0 -1.000041,-0.765946 -1.000015,-1 2.6e-5,-0.234054 0,-1.333333 0,-2 0,0 0,-2 -1.999994,-2 -1.999994,0 -1.999994,2 -1.999994,2 v 2 c 0,0 0,1 -0.999997,1 H 4.60043 c 0,0 -1.999994,0 -1.999994,2 v 6.5 c 0,0 0,1.5 1.499995,1.5 1.499995,0 1.499995,-1.5 1.499995,-1.5 v -5.5 12.5 c 0,0 0,1.5 1.499996,1.5 1.499995,0 1.499995,-1.5 1.499995,-1.5 v -7.5 7.5 c 0,0 0,1.5 1.499995,1.5 1.499996,0 1.499996,-1.5 1.499996,-1.5 v -12 z"/>
    </g>



    </svg>

    
    `
});


Vue.component('event', {
    data(){return{
        frame:0,
    }},
    props:['event', 'turn'],
    watch:{
        turn(new_turn, old_turn){
            if(new_turn != old_turn){
                this.animate();
            }
        }
    },
    mounted(){
        this.animate();
    },
    methods:{
        animate(){
            this.frame = 0;
            setTimeout(()=>{this.frame = 1}, 1250/2);
        },

    },
    template:`
    <!-- this regex : v-[^"]*="[^"]*"
        for deleting all v-statements and open in inkscape.
    -->
    <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        :class="{
            event : true,
        }"

    >
    <!-- KILL -->
    <g id="kill"
    v-if="event.type=='kill'">
        <path v-if="frame==0" data-color="white" d="
        m 18.828427,7.5147188 c 0,0 -2.828427,-2.828427 -5.656854,0 0,0 -2.213384,-1.59834 -4.734289,0.922565 -2.520905,2.5209052 -0.922565,4.7342892 -0.922565,4.7342892 0,0 -2.828427,2.828427 0,5.656854 0,0 -1.59834,2.213384 0.922565,4.734289 2.520905,2.520905 4.734289,0.922565 4.734289,0.922565 0,0 2.828427,2.828427 5.656854,0 0,0 2.213384,1.59834 4.734289,-0.922565 2.520905,-2.520905 0.922565,-4.734289 0.922565,-4.734289 0,0 2.828427,-2.828427 0,-5.656854 0,0 1.59834,-2.213384 -0.922565,-4.7342892 -2.520905,-2.520905 -4.734289,-0.922565 -4.734289,-0.922565 z        
        " />
        <path v-if="frame==1" data-color="white" d="
        m 12.056355,19.943647 c 0,0 0.520857,2.901929 3.943646,2.901929 3.422786,0 3.943645,-2.901929 3.943645,-2.901929 0,0 2.901931,-0.520857 2.901931,-3.943646 0,-3.422788 -2.901931,-3.943646 -2.901931,-3.943646 0,0 -0.520859,-2.9019312 -3.943645,-2.9019312 -3.422789,0 -3.943646,2.9019312 -3.943646,2.9019312 0,0 -2.9019324,0.520858 -2.9019324,3.943646 0,3.422789 2.9019324,3.943646 2.9019324,3.943646 z        " />
    </g>
    </svg>
    `
});



Vue.component('arrow', {
    data(){
      return{
      };
    },
    props:['start', 'end', 'size', 'cell_size'],
    methods:{
      get_width(){return this.get_cell_size()*(this.size.x+1)},
      get_height(){return this.get_cell_size()*(this.size.y+1)},
      get_cell_size(){return this.cell_size+1},
      get_view_box(){return `0 0 ${this.get_width()} ${this.get_height()}`},
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
      :x1="get_cell_size()*(start.x+.5)"
      :y1="get_cell_size()*(start.y+.5)"
      :x2="get_cell_size()*(end.x+.5)"
      :y2="get_cell_size()*(end.y+.5)"
    ></line>
  </svg>
  `
  });
  

  
Vue.component('arrow-path', {
    data(){
      return{
      };
    },
    props:['start', 'path', 'size', 'cell_size'],
    methods:{
        get_steps(){
            let steps = [];
            if(!this.path?.length) return;
            steps.push({
                start:this.start,
                end:this.path[0],
            })
            for (let i = 1; i < this.path.length; i++) {
                steps.push({
                    start:this.path[i-1],
                    end:this.path[i],
                });
            }
            steps[steps.length-1].last = true;
            return steps;
        },
        get_width(){return this.get_cell_size()*(this.size.x+1)},
        get_height(){return this.get_cell_size()*(this.size.y+1)},
        get_cell_size(){return this.cell_size+1},
        get_view_box(){return `0 0 ${this.get_width()} ${this.get_height()}`},  
    },
    template:`
        <svg
        class="arrow-path"
        xmlns="http://www.w3.org/2000/svg"
        :viewBox="get_view_box()"
        :width="get_width()"
        :height="get_height()"
        >
        <defs>
            <marker id="arrow-path-head" viewBox="0 0 20 20" refX="10" refY="10" markerWidth="10" markerHeight="10" shape-rendering="crispEdges" orient="auto-start-reverse" fill="white">
            <path d="M 0 0 L 20 10 L 0 20 z" />
            </marker>
        </defs>
        <line
        v-for="step in get_steps()"
        id='arrow-line'
        :marker-end="step.last ? 'url(#arrow-path-head)' : undefined"
        stroke-width='1'
        fill='none' stroke='white'
        :x1="get_cell_size()*(step.start.x+.5)"
        :y1="get_cell_size()*(step.start.y+.5)"
        :x2="get_cell_size()*(step.end.x+.5)"
        :y2="get_cell_size()*(step.end.y+.5)"
        ></line>
    </svg>
   `
  });
  
  