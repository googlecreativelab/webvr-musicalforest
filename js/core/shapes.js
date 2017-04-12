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

import { ShapeData } from './shape-data';

export const Shapes = {

	'circles': [
		new ShapeData( new THREE.Vector2( 8, 4 ), new THREE.Vector2( 4, 1 ), 0 ),
		new ShapeData( new THREE.Vector2( 8, 4 ), new THREE.Vector2( 4, 1 ), 1 ),
		new ShapeData( new THREE.Vector2( 8, 4 ), new THREE.Vector2( 4, 1 ), 2 ),
		new ShapeData( new THREE.Vector2( 8, 4 ), new THREE.Vector2( 3, 1 ), 3 ),
		new ShapeData( new THREE.Vector2( 8, 4 ), new THREE.Vector2( 3, 1 ), 4 ),
		new ShapeData( new THREE.Vector2( 6, 6 ), new THREE.Vector2( 2, 1 ), 5 ),
		new ShapeData( new THREE.Vector2( 6, 6 ), new THREE.Vector2( 2, 1 ), 6 ) 
	],

	'triangles': [
		new ShapeData( new THREE.Vector2( 9, 4 ), new THREE.Vector2( 4, 1 ), 0 ),
		new ShapeData( new THREE.Vector2( 9, 4 ), new THREE.Vector2( 4, 1 ), 1 ),
		new ShapeData( new THREE.Vector2( 9, 4 ), new THREE.Vector2( 4, 1 ), 2 ),
		new ShapeData( new THREE.Vector2( 6, 6 ), new THREE.Vector2( 3, 1 ), 3 ),
		new ShapeData( new THREE.Vector2( 7, 5 ), new THREE.Vector2( 3, 1 ), 4 ),
		new ShapeData( new THREE.Vector2( 7, 5 ), new THREE.Vector2( 3, 1 ), 5 ),
		new ShapeData( new THREE.Vector2( 6, 6 ), new THREE.Vector2( 3, 1 ), 6 ) 
	],

	'squares': [
		new ShapeData( new THREE.Vector2( 2, 17 ), new THREE.Vector2( 1, 4 ), 0 ),
		new ShapeData( new THREE.Vector2( 2, 17 ), new THREE.Vector2( 1, 4 ), 1 ),
		new ShapeData( new THREE.Vector2( 3, 11 ), new THREE.Vector2( 1, 3 ), 2 ),
		new ShapeData( new THREE.Vector2( 3, 11 ), new THREE.Vector2( 1, 3 ), 3 ),
		new ShapeData( new THREE.Vector2( 3, 11 ), new THREE.Vector2( 1, 3 ), 4 ),
		new ShapeData( new THREE.Vector2( 3, 11 ), new THREE.Vector2( 1, 2 ), 5 ),
		new ShapeData( new THREE.Vector2( 3, 11 ), new THREE.Vector2( 1, 2 ), 6 ) 
	]
};