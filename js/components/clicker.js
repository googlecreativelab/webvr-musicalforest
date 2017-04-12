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


AFRAME.registerComponent( 'clicker', {
    raycaster: null,
    mouse: null,
    canvas: null,
    camera: null,
    intersected: null,
    teleporter:null,
    schema: {
        // radius: { default: 0.1 },
    },

    init: function() {
        document.addEventListener("INTRO_COMPLETED", () => {
            // creates references
            this.raycaster = new THREE.Raycaster();
    		this.mouse = new THREE.Vector2();
            this.canvas = this.el.sceneEl.canvas;
            this.camera = this.getCameraFromEntity(document.querySelector("a-entity[camera]"));
            this.teleporter = document.querySelector("#gaze-floor").components.teleport;

            // on click
            // get all balls
            // filter out the ones out of range
            // do a check for mouse position
            // unproject ray to mouse with vector z = -1
            // get ray intersects
            // if intersect length > 1 & if intersect is same as mousedown, hit

            document.addEventListener("touchstart", (event) => {});
            document.addEventListener("touchend", (event) => {});

            document.addEventListener("mousedown", (event) => {
                let entity = this.getIntersectObject({x:event.clientX, y:event.clientY});
                if( !entity ) { return; }
                this.intersected = entity;
            });

            document.addEventListener("mouseup", (event) => {
                let entity = this.getIntersectObject({x:event.clientX, y:event.clientY});
                if( !entity ) { return; }
                if(this.intersected === entity){
                    entity.emit("controllerhit", {velocity:0.5});
                }
                this.intersected = null;
                event.wasSphereHit = true;

            });
        });

    },



    play: function() {

    },

    pause: function() {

    },

    getIntersectObject: function(intersect) {
        this.mouse.x = ( intersect.x / document.body.clientWidth ) * 2 - 1;
        this.mouse.y = - ( intersect.y / document.body.clientHeight ) * 2 + 1;
        this.raycaster.setFromCamera( this.mouse, this.camera );

        let selectables = tree.getElementsByClassName("selectable");
        let balls = [];
        for(let i=0; i<selectables.length; i++){
            balls.push(selectables[i].components.ball.note.head.mesh);
        }
        let intersects = this.raycaster.intersectObjects( balls, false);
        if ( intersects.length > 0 ) {
            return intersects[0].object.parent.parent.el;
        } else {
            return null;
        }
    },

    getCameraFromEntity: function(camera) {
        for(let i=0; i<camera.object3D.children.length; i++){
            if(camera.object3D.children[i].type === "PerspectiveCamera") {
                return camera.object3D.children[i];
            }
        }
    }
});
