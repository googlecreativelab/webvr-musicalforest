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

import { BgTreeColors, ShadowColor } from '../core/colors';

const DEG2RAD = Math.PI / 180;
const HALFPI = Math.PI / 2;

const VECTOR_ZERO     = new THREE.Vector3( 0, 0, 0 );
const SHADOW_X_AXIS   = new THREE.Vector3( 1, 0, 0 );
const SHADOW_Z_AXIS   = new THREE.Vector3( 0, 1, 0 );
const SHADOW_LENGTH   = 20;
const SHADOW_GEOMETRY = new THREE.PlaneGeometry( 0.25, 1 );
const SHADOW_MATERIAL = new THREE.MeshBasicMaterial({
    color: ShadowColor,
    side: THREE.DoubleSide
});

AFRAME.registerComponent( 'background-objects', {

    nLoaded: 0,

    init: function() {
        this.treeObjs = [ 'bg-tree-1', 'bg-tree-2', 'bg-tree-3' ];
        this.treeGeometry = [];

        let objLoader = new THREE.OBJLoader();

        if ( !AFRAME.utils.device.isMobile() ) {
            this.treeObjs.forEach( function( obj ) {
                objLoader.load( '/static/models/' + obj + '.obj', this.checkLoadComplete.bind( this ) );
            }, this );
        }
    },

    checkLoadComplete: function( objModel ) {
        this.treeGeometry.push( objModel.children[ 0 ].geometry );

        if ( ++this.nLoaded >= this.treeObjs.length ) {
            this.generateTrees();
        }
    },

    generateTrees: function() {
        let total = AFRAME.utils.device.isMobile() ? 20 : 200;
        let theta, x, z, mesh, shadow;
        let treeDistance, treeColor, treeIndex, randomSeed;
        let perimeter = 8;

        let materials = [
            new THREE.MeshBasicMaterial( { color: new THREE.Color( BgTreeColors[ 0 ] ), side: THREE.DoubleSide } ),
            new THREE.MeshBasicMaterial( { color: new THREE.Color( BgTreeColors[ 1 ] ), side: THREE.DoubleSide } ),
            new THREE.MeshBasicMaterial( { color: new THREE.Color( BgTreeColors[ 2 ] ), side: THREE.DoubleSide } )
        ];

        for ( let i = 0; i < total; i++ ) {

            theta = DEG2RAD * (i / total) * 360;
            randomSeed = Math.random();
            treeDistance = randomSeed * 18 + perimeter;
            treeColor = Math.floor( randomSeed * 3 );
            treeIndex = Math.floor( i % 3 );
            x = Math.cos( theta ) * treeDistance;
            z = Math.sin( theta ) * treeDistance;

            // Create and position tree
            mesh = new THREE.Mesh( this.treeGeometry[ treeIndex ], materials[ treeColor ] );
            mesh.position.set( x, 0, z );
            mesh.scale.set( 1, 3 + Math.random(), 1 );
            mesh.scale.multiplyScalar( 0.0002 );
            mesh.lookAt( VECTOR_ZERO );
            mesh.rotation.y += HALFPI;
            mesh.rotation.y += ( Math.random() - 0.5 ) * 0.05;
            mesh.position.setY( Math.random() * -2 );

            // Create and position tree shadow
            shadow = new THREE.Mesh( SHADOW_GEOMETRY, SHADOW_MATERIAL );
            shadow.position.set( x, 0, z );
            shadow.lookAt( VECTOR_ZERO );
            shadow.rotation.order = 'ZYX';
            shadow.rotation.x += HALFPI;
            shadow.scale.setY( SHADOW_LENGTH );
            shadow.translateOnAxis( SHADOW_Z_AXIS, -SHADOW_LENGTH / 2 );

            this.el.object3D.add( mesh );
            this.el.object3D.add( shadow );
        }
    }
});
