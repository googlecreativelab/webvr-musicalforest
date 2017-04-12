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

import { Instruments, NoteCount, InstrumentCount, TotalNotes} from '../core/instruments';
import { BallColors, ControllerColors } from '../core/colors';
import { Shapes } from '../core/shapes';

const SPHERE_BASE_URL = './static/img/ball_';
const SPHERE_BASE_EXT = '.png';

AFRAME.registerComponent('palette', {
    schema: {
        type: 'int',
        default: 0
    },

    update() {
        // Dispose of the old instrument
        if (this._currentInstrument) {
            this._currentInstrument.dispose();
        }

        // Set the new instrument
        this._currentInstrument = Instruments[this.data % Instruments.length];
    },

    trigger(time, tone, velocity, x, y, z) {
        this._currentInstrument.trigger(time, tone, velocity, x, y, z);
    },

    totalNotes() {
        return TotalNotes;
    },

    noteCount() {
        return NoteCount;
    },

    colorPalette() {
        return BallColors[ this._currentInstrument.color ];
    },

    controllerColors() {
        return ControllerColors[ this._currentInstrument.color ];
    },

    shapePalette(id) {
        return Shapes[ id ];
    },

    loadSphereTextures() {

        let image134Circles = document.getElementById( 'ball_circles_134' );
        let image567Circles = document.getElementById( 'ball_circles_567' );
        let image134Triangles = document.getElementById( 'ball_triangles_134' );
        let image567Triangles = document.getElementById( 'ball_triangles_567' );
        let image134Squares = document.getElementById( 'ball_squares_134' );
        let image567Squares = document.getElementById( 'ball_squares_567' );

        this._textureSprite134Circles = new THREE.Texture( image134Circles );
        this._textureSprite567Circles = new THREE.Texture( image567Circles );
        this._textureSprite134Triangles = new THREE.Texture( image134Triangles );
        this._textureSprite567Triangles = new THREE.Texture( image567Triangles );
        this._textureSprite134Squares = new THREE.Texture( image134Squares );
        this._textureSprite567Squares = new THREE.Texture( image567Squares );

        this._textureSprite134Circles.wrapS = this._textureSprite134Circles.wrapT = THREE.RepeatWrapping;
        this._textureSprite567Circles.wrapS = this._textureSprite567Circles.wrapT = THREE.RepeatWrapping;
        this._textureSprite134Triangles.wrapS = this._textureSprite134Triangles.wrapT = THREE.RepeatWrapping;
        this._textureSprite567Triangles.wrapS = this._textureSprite567Triangles.wrapT = THREE.RepeatWrapping;
        this._textureSprite134Squares.wrapS = this._textureSprite134Squares.wrapT = THREE.RepeatWrapping;
        this._textureSprite567Squares.wrapS = this._textureSprite567Squares.wrapT = THREE.RepeatWrapping;

        setTimeout( () => {
            document.dispatchEvent(new Event("SPHERE_TEXTURE_LOADED"));
        },0);

    },

    textureSprite134(id) {
        return [this._textureSprite134Circles, this._textureSprite134Squares, this._textureSprite134Triangles][id];
    },

    textureSprite567(id) {
        return [this._textureSprite567Circles, this._textureSprite567Squares, this._textureSprite567Triangles][id];
    },

});
