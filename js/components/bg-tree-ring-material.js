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

import { EnvColors, BgTreeColors } from '../core/colors';

AFRAME.registerComponent( 'bg-tree-ring-material', {

	schema: {
        type: 'int',
        default: 0
    },

	init: function() {
		let objLoader = new THREE.OBJLoader();

        if ( AFRAME.utils.device.isMobile() ) {
            objLoader.load( '/static/models/bg-tree-ring.obj', this.onLoaded.bind( this ) );
        }
	},

	onLoaded: function( object ) {
		let mesh = object.children[ 0 ];
		let tex = new THREE.Texture( document.getElementById( 'bg-tree-tex' ) );
		tex.needsUpdate = true;
		tex.minFilter = tex.magFilter = THREE.NearestFilter;

		let shader = THREE.BGTreeShader;
		let uniforms = THREE.UniformsUtils.clone( shader.uniforms );
		uniforms.map.value = tex;
		uniforms.color.value = new THREE.Color( BgTreeColors[ this.data ] );
		uniforms.fogColor.value = new THREE.Color ( EnvColors.fog );
		uniforms.fogDensity.value = 0.065;

		mesh.material = new THREE.ShaderMaterial( {
			uniforms: uniforms,
			vertexShader: shader.vertexShader,
			fragmentShader: shader.fragmentShader,
			side: THREE.DoubleSide
		} );

		this.el.setObject3D( 'mesh', mesh );
	}
});
