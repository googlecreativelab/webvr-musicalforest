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

const CommonUniforms = {
	lightPosition: { value: new THREE.Vector3( 3, 10, 1 ) },
	lightIntensity: { value: 1.15 },
	shadeAmount: { value: 0.55 }
};

const BasicVertex = [

	'varying vec2 vUV;',

	'void main() {',
		'vUV = uv;',
		'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
	'}'

].join( '\n' );


const ToonVertex = [

	'varying vec4 vWorldPosition;',
	'varying vec3 vNormal;',
	'varying vec2 vUv;',

	'void main() {',

		'vUv = uv;',

		// World-space normal
		'vNormal = normalize ( mat3( modelMatrix[0].xyz, modelMatrix[1].xyz, modelMatrix[2].xyz ) * normal );',

		'vec3 transformed = vec3( position );',
		'vec4 mvPosition = modelViewMatrix * vec4( transformed, 1.0 );',
		'gl_Position = projectionMatrix * mvPosition;',

		'vWorldPosition = modelMatrix * vec4( position, 1.0 );',

	'}'

].join( '\n' );


const ToonFragUniforms = [

	'uniform float lightIntensity;',
	'uniform float shadeAmount;',
	'uniform vec3 lightPosition;',
	'uniform sampler2D gradientMap;',

	'varying vec4 vWorldPosition;',
	'varying vec3 vNormal;',
	'varying vec2 vUv;',

].join( '\n' );


const ToonFragLighting = [

	'#ifdef FLAT_SHADED',

		// TODO: do this in the vertex shader for speeeeeed
		'vec3 fdx = vec3( dFdx( vWorldPosition.x ), dFdx( vWorldPosition.y ), dFdx( vWorldPosition.z ) );',
		'vec3 fdy = vec3( dFdy( vWorldPosition.x ), dFdy( vWorldPosition.y ), dFdy( vWorldPosition.z ) );',
		'vec3 normal = normalize( cross( fdx, fdy ) );',

	'#else',

		'vec3 normal = normalize( vNormal );',

	'#endif',

	// The usual Lambertian stuff
	'vec3 lightDirection = normalize( lightPosition - vWorldPosition.xyz );',
	'float dotNL = max( dot( normal, lightDirection ), 0.0 ) * 0.5 + 0.5;',

	// Clamp for a shaded toon look
	'float toonIrradience = ( dotNL < shadeAmount ) ? 0.7 * lightIntensity : 1.0;',
	'vec4 diffuseColor = vec4( 0.0 );',

].join( '\n' );


const ToonFragCommon = [

	'gl_FragColor = vec4( diffuseColor.rgb * toonIrradience, diffuseColor.a );',

].join( '\n' );


export { CommonUniforms, BasicVertex, ToonVertex, ToonFragUniforms, ToonFragCommon, ToonFragLighting };
