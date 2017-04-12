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

import { NoteHeadSphere } from './note-head-sphere';
import { NoteHeadTetra } from './note-head-tetra';
import { NoteHeadCube } from './note-head-cube';
import { NoteShadowSphere } from './note-shadow-sphere';
import { NoteShadowTetra } from './note-shadow-tetra';
import { NoteShadowCube } from './note-shadow-cube';

const HIT_ANIM_MS = 750;

const SHAPE_NAMES = [ 'sphere', 'cube', 'tetra' ];

const HEAD_CONSTRUCTORS = {
    sphere: NoteHeadSphere,
    tetra: NoteHeadTetra,
    cube: NoteHeadCube
};

const SHADOW_CONSTRUCTORS = {
    sphere: NoteShadowSphere,
    tetra: NoteShadowTetra,
    cube: NoteShadowCube
};

export class Note {

    constructor( palette ) {
        this.group = new THREE.Group();
        this.palette = palette;
    }

    setTone( value ) {
        this.tone = value;

        // Remove old note objects
        if ( this.head ) this.group.remove( this.head.mesh );
        if ( this.shadow ) this.group.remove( this.shadow.mesh );

        // Create new head object
        this.head = new ( HEAD_CONSTRUCTORS[ this.shape ] )( this.palette, this.shape );
        this.head.name = "head";
        this.head.lightPosition = this.lightPosition;
        this.head.setTone( this.tone );

        // Store first random rotation value
        if ( !this.rotation ) {
            this.rotation = new THREE.Euler();
            this.rotation.copy( this.head.rotation );
        }

        // Reset head mesh rotation
        this.head.mesh.rotation.copy( this.rotation );

        // Create new shadow object
        this.shadow = new ( SHADOW_CONSTRUCTORS[ this.shape ] )( this.head.mesh, this.rotation );

        // Add 'em up
        this.group.add( this.head.mesh );
        this.group.add( this.shadow.mesh );
    }

    setRotationIncrement(isClockwise=false) {
        let rotationAxis = new THREE.Vector3(0,1,0);
        let rotationAmount = Math.PI * 2 * (isClockwise ? 0.03 : -0.03);
        let deltaMatrix = new THREE.Matrix4();
        deltaMatrix.makeRotationAxis(rotationAxis, rotationAmount );

        let rotationMatrix = new THREE.Matrix4().makeRotationFromEuler(this.rotation);
        rotationMatrix.multiplyMatrices(deltaMatrix,rotationMatrix);
        deltaMatrix.extractRotation(rotationMatrix);
        this.rotation.setFromRotationMatrix(deltaMatrix);
	}

    removeShadow(){
        if ( this.shadow ) {
            this.group.remove( this.shadow.mesh );
            delete this.shadow;
            this.shadow = null;
        }
    }
    tick() {
        if(this.shadow) {
            this.shadow.update();
        }
    }

    highlight( event ) {
        this.head.highlight( event );
    }
    unHighlight( event ) {
        this.head.unHighlight( event );
    }

    hit( event ) {
        this.head.hit( event, HIT_ANIM_MS );
    }

    get shape() {
        return SHAPE_NAMES[ Math.floor( this.tone / this.palette.noteCount() ) ];
    }
}
