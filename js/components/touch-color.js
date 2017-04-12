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

import { getViewerType, getParameterByName } from '../util'
import { ControllerColors } from '../core/colors';
import TWEEN from 'tween.js';

const getComponentProperty = AFRAME.utils.entity.getComponentProperty;
const setComponentProperty = AFRAME.utils.entity.setComponentProperty;

AFRAME.registerComponent('touch-color', {
    dependencies: ['tracked-controls', 'brush'],
    tickTween: null,
    trackPosStart: null,
    trackPos: null,
    prevTrackPos: null,
    disc: null,
    rotationChange: 0,
    totalTicks: 20,
    ticks: null,
    lastTone : 4,
    schema: {
        isClockwise: {
            default: true
        },
        isTracking: {
            default: false
        },
        trackPos: {
            default: new THREE.Vector2()
        },
        isTrackPadTouched: {
            default: false
        },
        degrees: {
            default: 0
        },
        color: { type: 'string', default: 'red' },
    },

    init: function() {
        this.prevTrackPos = new THREE.Vector2(1, 1);
        setTimeout(() => {
            let material, geometry, ball;

            ball = this.el.object3D;
            if (this.el.id === "avatar") {

            } else {
                geometry = new THREE.CylinderGeometry(0.02, 0.02, 0.01, 32);
                material = new THREE.MeshBasicMaterial({
                    color: this.getColor()
                });
                this.disc = new THREE.Mesh(geometry, material);
                this.disc.name = "disc";

                // this.disc.rotation.x = THREE.Math.degToRad( 6 );
                this.disc.position.x = 0;
                this.disc.position.y = 0.001;
                this.disc.position.z = 0.0728 - 0.025;

                let tick, theta;
                this.ticks = [];
                for (let i = 0; i < this.totalTicks; i++) {
                    geometry = new THREE.CylinderGeometry(0.001, 0.001, 0.011, 12);
                    material = new THREE.MeshBasicMaterial({
                        color: 0xFFFFFF
                    });
                    tick = new THREE.Mesh(geometry, material);
                    theta = i / this.totalTicks * Math.PI * 2;
                    tick.position.x = Math.cos(theta) * 0.017;
                    tick.position.z = Math.sin(theta) * 0.017;
                    this.ticks.push(tick);
                    this.disc.add(tick);

                }

                ball.add(this.disc);
            }


        }, 1);

        this.el.addEventListener("componentchanged", function(e) {
            if (e.detail.name === "grab-move") {
                //if the attribute changed
                if (e.detail.oldData.grabbing !== e.detail.newData.grabbing) {
                    // reset the rotation detail
                    this.rotationChange = 0;
                }
            }
        });
        document.addEventListener("SPHERE_TEXTURE_LOADED", (event) => {
            this.update();
        });
    },

    play: function() {
        let el = this.el;

        if (this.el.id === "avatar" && getParameterByName('reticle')==='true') {
            document.addEventListener('keyup', this.onKeyUp.bind(this));
            document.addEventListener('keydown', this.onKeyDown.bind(this));
        }

        el.addEventListener('trackpaddown', this.onTrackPadTouchStart.bind(this));
        el.addEventListener('trackpadup', this.onTrackPadTouchEnd.bind(this));

        el.addEventListener('touchstart', this.onTrackPadTouchStart.bind(this));
        el.addEventListener('touchend', this.onTrackPadTouchEnd.bind(this));
        el.addEventListener('axismove', this.onTrackPadMove.bind(this));

    },

    pause: function() {
        let el = this.el;
        if (this.el.id === "avatar" && getParameterByName('reticle')==='true') {
            document.removeEventListener('keyup', this.onKeyUp);
            document.removeEventListener('keydown', this.onKeyDown);
        }
        el.removeEventListener('trackpaddown', this.onTrackPadTouchStart);
        el.removeEventListener('trackpadup', this.onTrackPadTouchEnd);
        el.removeEventListener('touchstart', this.onTrackPadTouchStart);
        el.removeEventListener('touchend', this.onTrackPadTouchEnd);
        el.removeEventListener('axismove', this.onTrackPadMove);
    },

    // 57, 48
    onKeyUp: function(event) {
        switch (event.keyCode) {
            // close bracket
            case 32:
                // document.dispatchEvent(new Event("TRACKPAD_UP"));
                break;
        }
    },

    onKeyDown: function(event) {
        switch (event.keyCode) {
            // <
            case 188:
                this.selectSound(-0.03);
                break;
                // >
            case 190:
                // this.rotateSound(1);
                this.selectSound(0.03);
                break;
        }

    },

    selectSound: function(increment) {
        let grabComponent = getComponentProperty(this.el, "grab-move");
        if (!grabComponent.isNearSphere) {
            return;
        }
        this.rotationChange += increment;
        const incrementAmount = 0.02;
        if (Math.abs(this.rotationChange) > incrementAmount) {
            this.rotationChange = this.rotationChange % incrementAmount;

            grabComponent.closestSphere.components.ball.note.setRotationIncrement(this.rotationChange > 0);

            // move the tone value
            let totalNotes = this.el.sceneEl.components.palette.totalNotes();
            let tone = grabComponent.closestSphere.getAttribute("tone");
            tone = this.rotationChange > 0 ? tone + 1 : tone - 1;
            tone = tone % (totalNotes);
            tone = (tone<0) ? (totalNotes - 1) : tone;
            this.lastTone = tone;
            grabComponent.closestSphere.setAttribute("tone", tone);
        }
    },

    onTrackPadTouchStart: function(event) {
        this.trackPosStart = null;
        this.data.isTrackPadTouched = true;
    },

    onTrackPadTouchEnd: function(event) {
        this.trackPosStart = null;
        this.data.isTrackPadTouched = false;
    },

    onTrackPadMove: function(event) {
        // HACK - trackpad move is firing on trigger.x = 0 fixes this
        if (this.data.isTrackPadTouched === false || event.detail.axis[0] === 0) {
            return;
        }
        this.data.trackPos.fromArray(event.detail.axis, 0);
        if (this.el.hasAttribute("vive-controls")) {
            this.data.trackPos.y *= -1;
        }
        this.data.trackPos.normalize();

        this.data.isTracking = (this.data.trackPos.distanceToSquared(this.prevTrackPos) > 0.001);

        if (!this.trackPosStart) {
            this.trackPosStart = this.data.trackPos.clone();
        }

        let radiansA = Math.atan2(this.data.trackPos.y, this.data.trackPos.x);
        let radiansB = Math.atan2(this.trackPosStart.y, this.data.trackPos.x);
        this.data.degrees = Math.abs((radiansA - radiansB) * 180 / Math.PI);

        let cross = (this.prevTrackPos.x * this.data.trackPos.y) - (this.prevTrackPos.y * this.data.trackPos.x);

        if (cross !== 0) {
            this.data.isClockwise = (cross > 0);
        }

        this.prevTrackPos.copy(this.data.trackPos);

        if (!this.data.isTracking ||
            !this.data.isTrackPadTouched
        ) {
            return;
        }

        this.selectSound(0.003 * (this.data.isClockwise ? 1 : -1));

        this.data.trackPos.multiplyScalar(0.1);

        if (this.data.trackPos.lengthSq() > 0.005) {

            let angle = this.data.trackPos.angle() * (180 / Math.PI);
            let tickSeed = Math.floor((angle / 360) * this.totalTicks);
            let tick = this.ticks[tickSeed];

            let scalar = {
                scale: 2
            };
            this.tickTween = new TWEEN.Tween({
                    scale: 0
                })
                .to({
                    scale: 1
                }, 250)
                .onUpdate((percentage) => {
                    tick.scale.x = 1 - percentage + 1;
                    tick.scale.z = 1 - percentage + 1;
                });
            this.tickTween.start();
        }

    },

    tick: function() {

    },

    update: function( oldData ) {
        if ( !this.disc ) { return; }
        this.disc.material.color = this.getColor();
	},

    getColor: function() {
        return new THREE.Color( this.el.sceneEl.components.palette.controllerColors()[1] );
    }
});


function tweenUpdate() {
    requestAnimationFrame(tweenUpdate);
    TWEEN.update();
}
tweenUpdate();
