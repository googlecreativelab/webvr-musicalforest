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

const STEM_GEOMETRY = new THREE.CylinderGeometry( 0.005, 0.01, 1, 5 );

export class NoteStem {

	constructor( palette ) {
		this.palette = palette;
		this.material = new THREE.MeshBasicMaterial();

		var stemMesh = new THREE.Mesh( STEM_GEOMETRY, this.material );
		stemMesh.position.y = -0.5;

		this.mesh = new THREE.Group();
		this.mesh.add( stemMesh );
	}

	setTone( value ) {
		this.tone = value;
		this.material.color = this.palette.colorPalette()[ this.tone ].idle;
		this.material.update();
	}

	update() {
		var worldZeroVector = new THREE.Vector3( 0, 0, 0 );
        this.mesh.parent.worldToLocal( worldZeroVector );
        this.mesh.position.setY( worldZeroVector.y );
        this.mesh.scale.setY( worldZeroVector.y );
	}

	hit() {

	}
}
