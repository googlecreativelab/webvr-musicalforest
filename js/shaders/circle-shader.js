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

import { ShadowColor } from '../core/colors';
import { BasicVertex } from './shader-chunks';

THREE.CircleShader = {

	uniforms: {
		radius: { type: 'f', value: 0.5 },
		color:  { type: 'c', value: new THREE.Color( ShadowColor ) }
	},

	vertexShader: BasicVertex,

	fragmentShader: [

		'uniform float radius;',
		'uniform vec3 color;',

		'varying vec2 vUV;',

		'void main() {',

			'if ( length( vUV - 0.5 ) > radius ) discard;',
			'gl_FragColor = vec4( color, 1.0 );',

		'}'

	].join( '\n' )
};
