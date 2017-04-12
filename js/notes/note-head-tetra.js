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

import { NoteHead } from './note-head';
import { RandomRange3D } from '../util/random-range-3d';
import { Tetrahedron } from '../util/tetrahedron';

const TETRA_GEOMETRY = new Tetrahedron().geometry;
const RANDOM_ROTATION = new RandomRange3D(
	new THREE.Euler( -0.3, -0.3, -0.3 ),
	new THREE.Euler( +0.3, +0.3, +0.3 )
);

export class NoteHeadTetra extends NoteHead {

	constructor( palette, shape ) {
		super( palette, shape );

		// Enable flat shading
		this.material.extensions = { derivatives: true };
	    this.material.defines = { FLAT_SHADED: true };
	}

	get geometry() {
		return TETRA_GEOMETRY;
	}

	get rotation() {
		return RANDOM_ROTATION.value;
	}
}
