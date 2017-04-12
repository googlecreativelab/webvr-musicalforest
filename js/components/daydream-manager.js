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

AFRAME.registerComponent('daydream-manager', {
    controllerBall: null,
    headset: null,
    proxy: null,
    controller: null,
    isHitByRayCast:false,
    schema: {
        headset: {
            default: "#avatar"
        },
        proxy: {
            default: "#rightHand"
        },
        controller: {
            default: "#controller"
        },
    },

    init: function() {

    },

    play: function() {

        this.headset = document.querySelector(this.data.headset);
        this.proxy = document.querySelector(this.data.proxy);
        this.controller = document.querySelector(this.data.controller);

        let controller = document.querySelector("#controller");
        controller.addEventListener('raycaster-intersection', (event) => {
            if(this.isHitByRayCast) { return; }

            let proxyPosition = this.proxy.object3D.getWorldPosition();
            event.detail.intersections.forEach((intersection) => {
                let entity = intersection.object.el;
                if(!entity.classList.contains('ball')){ return;}

                let distance = entity.object3D.getWorldPosition().distanceToSquared (proxyPosition);

                if(distance > 1) { return; }
                entity.emit("controllerhit", { velocity: 1.0 });
                this.isHitByRayCast = true;
            });

        });

        controller.addEventListener('raycaster-intersection-cleared', (event) => {
            this.isHitByRayCast = false;
        });
    },

    pause: function() {

    },

    tick: function() {

        let controller = document.querySelector("#controller");
        if(!controller) { return; }

        let rotation = getComponentProperty(controller, "rotation");
        setComponentProperty(this.proxy, "rotation", {x:rotation.x, y:rotation.y, z:rotation.z});

        let avatar = document.querySelector('#avatar');
        avatar = avatar.object3D;
        let position = getComponentProperty(controller, "position");

        setComponentProperty(this.proxy, "position", {
            x:position.x + avatar.position.x,
            y:position.y,
            z:position.z + avatar.position.z});
    },

    remove: function() {
        // let prevEntity = document.querySelector(prevId);
    },

});
