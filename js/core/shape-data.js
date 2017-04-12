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

const TONE_CHANNEL_MAP = [
	new THREE.Vector3( 1, 0, 0 ), 
	new THREE.Vector3( 1, 0, 0 ),
	new THREE.Vector3( 0, 1, 0 ),
	new THREE.Vector3( 0, 0, 1 ),
	new THREE.Vector3( 1, 0, 0 ),
	new THREE.Vector3( 0, 1, 0 ),
	new THREE.Vector3( 0, 0, 1 )
];

export class ShapeData {

	constructor( layout, repeats, tone ) {
		this.layout = layout;
		this.repeats = repeats;
		this.tone = tone;
	}

	setUniforms( material ) {
		material.uniforms.spriteLayout.value = this.layout;
		material.uniforms.spriteRepeat.value = this.repeats;
		material.uniforms.spriteChannel.value = TONE_CHANNEL_MAP[ this.tone ];
		material.uniforms.use567.value = this.tone > 3 ? 1.0 : 0.0;
	}
}