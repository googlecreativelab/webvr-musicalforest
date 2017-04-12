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

import Tone from 'tone';
import {scale} from '../util';
import { Instruments, NoteCount, InstrumentCount, TotalNotes} from '../core/instruments';

//create the background track
const filetype = Tone.Buffer.supportsType('mp3') ? 'mp3' : 'ogg';
const ambient = new Tone.Player(`static/audio/bg.${filetype}`, () => {
    ambient.start();
    ambient.volume.rampTo(-14, 4);
}).toMaster();
ambient.volume.value = -Infinity;
ambient.loop = true;

window.addEventListener('blur', () => {
    Tone.Master.mute = true;
});

window.addEventListener('focus', () => {
    Tone.Master.mute = false;
});

document.addEventListener("ENTERED_FOREST", () => {
    Tone.Master.mute = false;
});

document.addEventListener("EXITED_FOREST", () => {
    Tone.Master.mute = true;
});

AFRAME.registerComponent('tone', {
    schema: {
        type: 'int',
        default: 0
    },
    init() {


        // listen for events
        this.el.addEventListener('controllerhit', this.controllerHit.bind(this));

        this._palette = this.el.sceneEl.components.palette;

        this._lastTrigger = 0;

    },
    remove() {

    },
    update(oldData) {
        if (this.data !== oldData && typeof oldData !== "undefined") {
            this.trigger(Tone.now() + 0.1, 0.4);
        }
    },
    getPosition() {
        const object3d = this.el.object3D;
        object3d.updateMatrixWorld();
        const matrixWorld = object3d.matrixWorld;
        const position = new THREE.Vector3().setFromMatrixPosition(matrixWorld);
        return position;
    },
    trigger(time = Tone.now(), velocity = 1) {
        // this.env.triggerAttack(time, velocity)
        const pos = this.getPosition();
        Instruments[this.getShape()].trigger(time, this.getNote(), velocity, pos.x, pos.y, pos.z);
    },
    hit(time, velocity, controllerPosition = null, sourceId = null) {
        // hits.push('#' + this.el.id);
        this.trigger(time, velocity);
        this.el.emit('hit', {
            from: sourceId,
            velocity: velocity,
            delay: time - Tone.now(),
            controllerPosition: controllerPosition
        });
    },
    updatePosition() {
        const object3d = this.el.object3D;
        object3d.updateMatrixWorld();
        const matrixWorld = object3d.matrixWorld;
        const position = new THREE.Vector3().setFromMatrixPosition(matrixWorld);
        this.panner.setPosition(position.x, position.y, position.z);

    },
    controllerHit(data) {
        if( !this.el.getAttribute("visible")) {return;}

        const time = Tone.Time('+0.01').toSeconds();
        if ((time - this._lastTrigger) > 0.1) {
            this._lastTrigger = time;
            this.hit(time, data.detail.velocity, data.detail.controllerPosition);
        }
    },
    //return the shape number of the tone 0-2
    getShape(){
        return Math.floor(this.data / NoteCount);
    },
    //return the note number of the tone 0-5
    getNote(){
        return this.data % NoteCount;
    },
    //return the total number of tones
    //all note/shape
    getTotalTones(){
        return TotalNotes;
    },
});
