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

import { CommonUniforms, ToonVertex, ToonFragUniforms, ToonFragCommon, ToonFragLighting } from './shader-chunks';

THREE.BallShader = {

	uniforms: THREE.UniformsUtils.merge([ CommonUniforms,
		{
			map134: { type: 't' },
			map567: { type: 't' },
			use567: { value: 0.0 },

			spriteLayout:  { value: new THREE.Vector2( 8, 4 ) },
			spriteRepeat:  { value: new THREE.Vector2( 5, 1 ) },
			spriteChannel: { value: new THREE.Vector3( 1, 0, 0 ) },
			spriteIndex:   { value: 0 },

			bgColor: 	   { value: new THREE.Color( 'rgb( 53, 101, 190 )' ) },
			idleColor: 	   { value: new THREE.Color( 'rgb( 0, 55, 182 )' ) },
			activeColor:   { value: new THREE.Color( 'rgb( 0, 130, 237 )' ) },
			activeAmount:  { value: 0 },
			brightnessAmount:  { value: 0.0 }
		}
	]),

	vertexShader: ToonVertex,

	fragmentShader: [

		ToonFragUniforms,

		'uniform sampler2D map134;',
		'uniform sampler2D map567;',
		'uniform float use567;',

		'uniform vec2 spriteLayout;',
		'uniform vec2 spriteRepeat;',
		'uniform vec3 spriteChannel;',
		'uniform float spriteIndex;',

		'uniform vec3 bgColor;',
		'uniform vec3 idleColor;',
		'uniform vec3 activeColor;',
		'uniform float activeAmount;',
		'uniform float brightnessAmount;',

		'void main() {',

			ToonFragLighting,

			'vec2 uvSpriteOffset = vec2( 0.0 );',
			'uvSpriteOffset.x =  floor( mod( spriteIndex, spriteLayout.x ) );',
			'uvSpriteOffset.y = -floor( spriteIndex / spriteLayout.x ) - 1.0;',
			'uvSpriteOffset /= spriteLayout;',

			'vec2 uvSize = 1.0 / spriteLayout;',
			'vec2 vUvSprite = vUv;',
			'vUvSprite.y = vUvSprite.y + spriteLayout.y - 1.0;',
			'vUvSprite = mod( vUvSprite * uvSize * spriteRepeat, uvSize ) + uvSpriteOffset;',

			'vec3 tex134 = texture2D( map134, vUvSprite ).rgb;',
			'vec3 tex567 = texture2D( map567, vUvSprite ).rgb;',
			'vec3 a = mix( tex134, tex567, use567 );',
			'vec3 color = mix( idleColor, activeColor, activeAmount );',
			'diffuseColor = vec4( mix( bgColor, color, length( a * spriteChannel ) ) + brightnessAmount, 1.0 );',

			ToonFragCommon,

		'}'
	].join( '\n' )
};
