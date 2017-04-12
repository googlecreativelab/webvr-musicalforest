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

import { getParameterByName } from '../util'
import TWEEN from 'tween.js';

AFRAME.registerComponent('teleport', {
    isHitByRayCast: false,
    isAnimating: false,
    isOverSphere: false,
    floorTarget: null,
    doesControllerExist: false,
    schema: {

    },

    init: function() {
        this.floorTarget = document.querySelector('#gaze-hit');
        this.floorTarget.setAttribute("visible", "false");
    },

    play: function() {

        let onUp = (event) => {
            // flag passed from clicker js
            if (event.wasSphereHit) { return; }
            if(this.isHitByRayCast){
                this.teleport();
            }
        };

        document.addEventListener('INTRO_COMPLETED', (event) => {

            setTimeout(() => {
                document.addEventListener("CONTROLLER_CREATED", (event) => {
                    this.doesControllerExist = true;
                    this.hideTeleport();

                    // disables teleport on click screen tap
                    if (event.detail.id === "Daydream Controller") {
                        document.removeEventListener('touchend', onUp);
                    }

                    // enables teleport on controller
                    document.addEventListener('trackpadup', onUp);
                    document.addEventListener('thumbstickup', onUp);
                }, false);


                let avatar = document.querySelector('#avatar');
                if(getParameterByName("teleport")==="false"){
                    this.hideTeleport();
                    return;
                }

                document.addEventListener("touchstart", (event) => {});
                document.addEventListener("touchend", (event) => {});

                let isTablet  = this.isTabletLikeDimensions() && this.isTouchDevice();
                if (AFRAME.utils.device.isMobile() || isTablet) {
                    document.addEventListener('mouseup', onUp);
                } else {
                    this.hideTeleport();
                    return;
                }

                this.el.addEventListener('raycaster-intersected', (event) => {
                    if(this.isOverSphere) { return; }
                    if(this.isAnimating) { return; }
                    if(this.isHitByRayCast) { return; }
                    this.showTeleport();
                });
                this.el.addEventListener('raycaster-intersected-cleared', (event) => {
                    if(this.isOverSphere) { return; }
                    if(this.isAnimating) { return; }
                    if(!this.isHitByRayCast) { return; }
                    this.hideTeleport();
                });

                document.addEventListener('keyup', (event) => {
                    switch (event.keyCode) {
                        case 32: // spacebar
                            this.onUp(event);
                            break;
                    }
                });

                document.addEventListener('ON_SPHERE_IN', (event) => {
                    this.isOverSphere = true;
                    this.hideTeleport();

                });
                document.addEventListener('ON_SPHERE_OUT', (event) => {
                    this.isOverSphere = false;
                });

            });

        });
    },

    hideTeleport: function() {
        this.floorTarget.setAttribute("visible", "false");
        this.isHitByRayCast = false;
    },

    showTeleport: function() {
        this.floorTarget.setAttribute("visible", "true");
        this.isHitByRayCast = true;
    },

    teleport: function() {
        if (!this.getTreeCreated()) { return; }
        if (this.isNearSphere()) { return; }

        if (!this.isHitByRayCast) { return; }

        this.isAnimating = true;
        const target = document.querySelector('#gaze-hit');
        const speed = 100;
        const player = document.querySelector("#player");
        const avatar = document.querySelector('#avatar');
        const daydream = document.querySelector('#daydream');
        let targetPosition = target.object3D.position;
        let position = getComponentProperty(player,"position");
        let moveTo = (data) => {
            setComponentProperty(player, "position", position);
            if (!daydream) { return; }
            setComponentProperty(daydream, "position", position);
        };
        if (this.flyTween) {
            this.flyTween.stop();
        }
        this.flyTween = new TWEEN.Tween(position)
            .to(targetPosition.clone(), speed)
            .easing(TWEEN.Easing.Exponential.InOut)
            .onUpdate(moveTo)
            .onComplete(()=>{
                this.isAnimating = false;
                this.hideTeleport();
            })
            .start();
    },

    pause: function() {

    },

    tick: function() {
        if(this.isAnimating) { return; }

        let cam = document.querySelector("[raycaster]").object3D;
        let orientation = cam.getWorldDirection();
        orientation.y *= -1;
        orientation.z *= -1;
        orientation.x *= -1;
        let ray = new THREE.Ray(cam.getWorldPosition(), orientation);

        let point = ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0,1,0)));
        if(point) {
            point.y = 0.02;
            this.floorTarget.setAttribute('position', point);
        }

    },

    getTreeCreated: function() {
        return this.el.sceneEl.systems.tree.getTreeCreated();
    },

    isNearSphere: function() {
        let nearSphereCount = 0;
        let elements = document.querySelectorAll('[grab-move]');

        let entity;
        for(let i=0; i<elements.length; i++){
            entity = elements[i];
            if(getComponentProperty(entity, "grab-move").isNearSphere) {
                nearSphereCount++;
            }
        }

        return (nearSphereCount===0) ? false : true;
    },
    isTabletLikeDimensions: function() {
        let w = screen.availWidth;
        let h = screen.availHeight;
        return ( ( (w > h) ? w : h) >= 960);
    },
    isTouchDevice: function() {
        return 'ontouchstart' in window || navigator.maxTouchPoints;      // works on most browsers ||  works on IE10/11 and Surface
    },
});
