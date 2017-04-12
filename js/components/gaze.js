// Copyright 2017 Google Inc.
//
//   Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
//   You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
//   Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
//   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//   See the License for the specific language governing permissions and
// limitations under the License.

const getComponentProperty = AFRAME.utils.entity.getComponentProperty;
const setComponentProperty = AFRAME.utils.entity.setComponentProperty;

let BALL_RADIUS = 0.05;

AFRAME.registerComponent('gaze', {
    isRayCasterAvailable: false,
    hoveredEntity: null,
    schema: {

    },

    // gaze should only work for android, ios, desktop
    // if vive, occulous, and daydream, disable gaze;
    init: function() {

        document.addEventListener("INTRO_COMPLETED", (event) => {
            let mode = this.el.sceneEl.components.splash.mode;
            if( AFRAME.utils.device.isMobile() && mode !== "360" ){
                this.addRaycaster();
            }
            document.addEventListener("CONTROLLER_CREATED", (event) => {
                if(event.detail.id !== "Daydream Controller") { return; }

                this.createRayTargets();
                this.removeShadows();

                let avatar = document.querySelector('#avatar');
                let controller = document.querySelector('#controller');
                // swaps out racaster
                if(avatar.hasAttribute('raycaster')) { avatar.removeAttribute("raycaster"); }

                let target = document.createElement('a-entity');
                target.id = "target";
                setComponentProperty(target, "position", "0 0 0.25");
                controller.appendChild(target);


                target.setAttribute("raycaster", "objects: .selectable; near:0; far:10; recursive: true; interval:200");

            }, false);

        }, false);


        document.addEventListener("BALL_CREATED", (event) => {
            if (AFRAME.utils.device.isMobile()) {
                this.createRayTarget(event.detail.el);
            }
        }, false);

    },

    play: function() {

    },

    pause: function() {

    },

    tick: function() {

    },

    // required to redo hit states
    addRaycaster: function() {
        this.createRayTargets();

        let avatar = document.querySelector('#avatar');

        // deletes old rays and adds new one
        if(avatar.hasAttribute('raycaster')) { avatar.removeAttribute("raycaster"); }
        avatar.setAttribute("raycaster", "objects: .selectable; near:0; far:10; recursive: true; interval:200");

        /*
         * the raycaster intersection updates continuously on interval,
         * returning an array ofhit objects
         * Intersection clear not required
        */

        // null state is gaze-floor
        let currentEntity = document.querySelector('#gaze-floor');

        avatar.addEventListener('raycaster-intersection', (event) => {
            if(event.detail.intersections.length === 0 ) { return; }

            let entity = event.detail.intersections[0].object.el;
            let isBall = entity.classList.contains('ball');

            if(isBall && (currentEntity.id !== entity.id) ){
                currentEntity.emit("unHighlight");
                currentEntity = entity;
                this.hoveredEntity = entity;
                this.hoveredEntity.emit("highlight");

                // teleport related
                event.wasSphereHit = true;
                document.dispatchEvent(new Event("ON_SPHERE_IN"));
                event.stopPropagation();

            } else if(isBall && (currentEntity.id === entity.id) ){

            } else if (this.hoveredEntity) {

                currentEntity = document.querySelector('#gaze-floor');
                this.hoveredEntity.emit("unHighlight");
                this.hoveredEntity = null;
                // teleport related
                document.dispatchEvent(new Event("ON_SPHERE_OUT"));
                event.stopPropagation();
            }
        });
        avatar.addEventListener('raycaster-intersection-cleared', (event) => {
            if(this.hoveredEntity){
                currentEntity = document.querySelector('#gaze-floor');
                this.hoveredEntity.emit("unHighlight");
                this.hoveredEntity = null;
            }
        });
        document.addEventListener("mouseup", (event) => {
            if(this.hoveredEntity) {
                this.hoveredEntity.emit("controllerhit", {velocity:1.0});
                event.wasSphereHit = true;
            }
        });
    },

    /*
     * create ray targets, remove shadows for performance
    */
    createRayTargets: function() {
        let tree = document.querySelector("#tree");
        let balls = tree.getElementsByClassName("selectable");
        for(let i=0; i<balls.length; i++){
            this.createRayTarget(balls[i]);
        }
    },

    removeShadows: function() {
        let tree = document.querySelector("#tree");
        let balls = tree.getElementsByClassName("selectable");
        for(let i=0; i<balls.length; i++){
            balls[i].components.ball.note.removeShadow();
        }
    },

    createRayTarget: function(ball) {
        ball.removeAttribute("geometry");
        ball.removeAttribute("material");
        let hitScalar = (this.getShape(ball) === "sphere") ? 1 : 1.5;
        let ballRadius = this.getScale(ball) * BALL_RADIUS * hitScalar;
        setComponentProperty(ball, "geometry", "primitive: sphere; radius: "+ballRadius+"; segments-height:6; segments-width:6;");
        setComponentProperty(ball, "material", "shader:flat; transparent:true; opacity:0.0; color:#ff0000;");
    },
    doesControllerExists: function() {
        this.el.sceneEl.systems.controllers.doesControllerExists();
    },
    getScale(entity) {
		return entity.components.ball.note.head.scale;
	},
    getShape(entity) {
		return entity.components.ball.note.head.shape;
	},
});
