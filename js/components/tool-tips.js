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

AFRAME.registerComponent('tool-tips', {
    tooltip: null,
    sprite: null,
    clock: null,
    tilesIncX : 6,
	tilesIncY : 8,
	totalTiles : 48,
	tileTime: 48*4,
	currentTime:0,
	currentTile:0,

    schema: {
        hand: {
            default: "right",
            type: "string"
        },
        timeout: {
            default: 30000,
            type: "int"
        }
    },

    init: function() {
        this.clock = new THREE.Clock();
    },

    play: function() {

        // adds timeout for tool tip removal
        let addToolTipTimeout = () => {
            document.removeEventListener("TREE_CREATED", addToolTipTimeout);
            setTimeout(() => {
                removeToolTipsBind();
            }, this.data.timeout);
        };

        let removeToolTipsBind = () => {
            document.removeEventListener("TREE_CREATED", addToolTipTimeout);
            this.el.removeEventListener('triggerup', removeToolTipsBind);
            this.removeToolTips();
        };

        let addToolTips = () => {
            let loader = new THREE.TextureLoader();
            loader.load("./static/img/toot_tip_"+this.data.hand+".png", (texture) => {
                this.sprite = texture;
                this.sprite.wrapS = THREE.RepeatWrapping;
                this.sprite.wrapT = THREE.RepeatWrapping;
                this.sprite.repeat.set( 1/this.tilesIncX, 1/this.tilesIncY );
                let material = new THREE.MeshBasicMaterial({
                    map: this.sprite,
                    side: THREE.DoubleSide
                });
                let geometry = new THREE.PlaneGeometry( 0.1, 0.05, 1 );
                this.tooltip = new THREE.Mesh(geometry, material);
                this.tooltip.rotation.x = THREE.Math.degToRad(-90);
                this.tooltip.position.x = (this.data.hand==="right") ? -0.085 : 0.085;
                this.tooltip.position.z = 0.075;
                this.el.object3D.add(this.tooltip);
            });

            // timeout required due to triggerup firing prematurely
            setTimeout(() => {
                this.el.addEventListener('triggerup', removeToolTipsBind);
                if(this.isTreeCreated()){
                    addToolTipTimeout();
                } else {
                    document.addEventListener("TREE_CREATED", addToolTipTimeout);
                }
            });

        };

        // adds tooltips once object 3d is ready
        let checkForToolTips = () => {
            if(this.el.object3D) {
                addToolTips();
                return;
            }
            requestAnimationFrame(checkForToolTips);
        };
        checkForToolTips();
    },

    removeToolTips: function() {
        if(!this.tooltip) { return; }
        this.el.object3D.remove(this.tooltip);
        this.el.removeAttribute("tool-tips");
    },

    pause: function() {

    },

    tick: function() {
        if(!this.tooltip) { return; }

        this.currentTime += (1000 * this.clock.getDelta());
        while (this.currentTime > this.tileTime) {
            this.currentTime -= this.tileTime;
            this.currentTile++;
            if (this.currentTile == this.totalTiles){
                this.currentTile = 0;
            }

            this.sprite.offset.x = Math.floor( this.currentTile / this.tilesIncX ) / this.tilesIncX;
            this.sprite.offset.y = ( this.currentTile % this.tilesIncX ) / this.tilesIncY;
        }
    },

    isTreeCreated: function() {
        return this.el.sceneEl.systems.tree.isTreeCreated;
    }
});
