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

import { NoteShadow } from './note-shadow';

const SHADOW_GEOMETRY = new THREE.PlaneGeometry( 0.1, 0.1 );
const SHADOW_SHADER = THREE.CircleShader;
const SHADOW_UNIFORMS = THREE.UniformsUtils.clone( SHADOW_SHADER.uniforms );
const SHADOW_MATERIAL = new THREE.ShaderMaterial({
	uniforms: SHADOW_UNIFORMS,
	vertexShader: SHADOW_SHADER.vertexShader,
	fragmentShader: SHADOW_SHADER.fragmentShader
});

export class NoteShadowSphere extends NoteShadow {

	constructor( headMesh ) {
		super( headMesh );

		this.mesh.rotation.x -= Math.PI / 2;
	}

	get geometry() {
		return SHADOW_GEOMETRY;
	}

	get material() {
		return SHADOW_MATERIAL;
	}
}