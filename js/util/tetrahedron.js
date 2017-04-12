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

const X = Math.sqrt( 2 / 3 );
const Y = 1 / 3;
const Z = 1 / Math.sqrt( 2 ) * ( 2 / 3);

const v1 = new THREE.Vector3( -X, -Y, Z );
const v2 = new THREE.Vector3( +X, -Y, Z );
const v3 = new THREE.Vector3( 0, -Y, -Z * 2 );
const v4 = new THREE.Vector3( 0, 1, 0 );

const f1 = new THREE.Face3( 2, 1, 0 );
const f2 = new THREE.Face3( 1, 3, 0 );
const f3 = new THREE.Face3( 2, 3, 1 );
const f4 = new THREE.Face3( 0, 3, 2 );

const t1 = new THREE.Vector2( 1, 0 );
const t2 = new THREE.Vector2( 0.5, 1 );
const t3 = new THREE.Vector2( 0, 0 );

const uvs = [
	[ t1, t2, t3 ],
	[ t1, t2, t3 ],
	[ t1, t2, t3 ],
	[ t1, t2, t3 ]
];

export class Tetrahedron {

	constructor() {
		this.geometry = new THREE.Geometry();
		this.geometry.vertices.push( v1, v2, v3, v4 );
		this.geometry.faces.push( f1, f2, f3, f4 );
		this.geometry.faceVertexUvs = [ uvs ];
		this.geometry.scale( 0.32, 0.32, 0.32 );

		this.geometry.uvsNeedUpdate = true;

		// Compute normals automatically
		this.geometry.computeFaceNormals();
		this.geometry.computeVertexNormals();
	}
}
