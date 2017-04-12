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

THREE.BGTreeShader = {
	
	uniforms: {
		map:    	 { type: 't' },
		fogColor: 	 { type: 'c' },
		fogDensity:  { value: 0 },
		color:  	 { type: 'c', value: new THREE.Color( BgTreeColors[ 0 ] ) },
		shadowColor: { type: 'c', value: new THREE.Color( ShadowColor ) }
	},

	vertexShader: [

		'varying vec2 vUV;',
		'varying float fogDepth;',

		'void main() {',
			'vUV = uv;',
			'vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );',
			'fogDepth = -mvPosition.z;',
			'gl_Position = projectionMatrix * mvPosition;',
		'}'

	].join( '\n' ),

	fragmentShader: [

		'#define LOG2 1.442695',

		'uniform vec3 color;',
		'uniform vec3 shadowColor;',
		'uniform sampler2D map;',
		'uniform float fogDensity;',
		'uniform vec3 fogColor;',

		'varying float fogDepth;',
		'varying vec2 vUV;',

		'void main() {',

			'vec3 c = vUV.y > 0.5 ? color : shadowColor;', 
			'vec3 t = texture2D( map, vUV ).rgb;',
			'if ( t.r < 0.5 ) discard;',
			
			'float fogFactor = 1.0 - saturate( ( exp2( -fogDensity * fogDensity * fogDepth * fogDepth * LOG2 ) ) );',

			'gl_FragColor = vec4( mix( t * c, fogColor, fogFactor ), 1.0 );',

		'}'

	].join( '\n' )
};