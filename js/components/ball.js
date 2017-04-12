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

import { Note } from '../notes/note';

AFRAME.registerComponent( 'ball', {

    grow: null,
    shrink: null,
    has3dContext: false,

    schema: {
        radius: { default: 0.1 },
        grabbed: { type: 'boolean', default: false },
        hand: { default: 'rightHand' },

        // the node that connects to the trunk where other balls grow from
        meristem: {
            default: false,
            type: 'boolean'
        },
        meristemNode: {
            default: null
        },
    },

    init: function() {

        this.el.addEventListener( 'componentchanged', event => {
            this.update();
            if ( event.detail.name === 'tone' ) {
                this.updateTone();
            }
        }, false);

        // the hit animiation
        this.el.addEventListener( 'hit', event => this.hit( event ) );
        this.el.addEventListener( 'highlight', event => this.highlight( event ) );
        this.el.addEventListener( 'unHighlight', event => this.unHighlight( event ) );
    },

    play: function() {

        this.createShape();
        this.updateTone();

        document.dispatchEvent( new CustomEvent("BALL_CREATED", {
            detail: {
                id: this.el.id,
                el: this.el,
                grab: true,
                hand: this.data.hand
            }
        }));

        // takes a refresh to register the 3d context
        setTimeout( () => {
            this.has3dContext = true;
        }, 0 );
    },

    createShape: function() {
        this.note = new Note( this.el.sceneEl.components.palette );
        this.note.lightPosition = this.el.sceneEl.components["fake-light"].getLightPosition();
        this.note.setTone( this.el.getAttribute( 'tone' ) );
        /*
         * can't replace root mesh of node
         * due to tight coupling of gaze.js & raycaster
         * added note as child instead.
         */
        // this.el.setObject3D("mesh", this.note.group)
        this.el.object3D.add(this.note.group);
    },

    tick: function( t, dt ) {
        this.note.tick();
    },

    updateTone: function() {
        this.note.setTone( this.el.getAttribute( 'tone' ) );
        // this.animateTexture(0.5, 0, null);
    },

    hit: function( event ) {
        this.note.hit( event );
    },
    highlight: function( event ) {
        this.note.highlight( event );
    },
    unHighlight: function( event ) {
        this.note.unHighlight( event );
    }
});
