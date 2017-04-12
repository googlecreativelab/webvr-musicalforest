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

import { HeadsetColor, HeadsetShadow } from '../core/colors';

AFRAME.registerComponent( 'headset-material', {
	isLoaded: false,
	schema: {
		opacity: {
			default: 1.0
		},
	},

	init: function() {
		this.el.addEventListener( 'model-loaded', this.onLoaded.bind( this ) );
		this.el.addEventListener("componentchanged", (event) => {
			this.onUpdated();
		}, false);
	},

	onLoaded: function() {
		let mesh = this.el.components["collada-model"].model.children[ 0 ].children[ 0 ];
		mesh.material = new THREE.MultiMaterial([
			new THREE.MeshBasicMaterial( { color: HeadsetColor, transparent:true} ),
			new THREE.MeshBasicMaterial( { color: HeadsetShadow, transparent:true} )
		]);
		this.isLoaded = true;
		this.onUpdated();
	},

	onUpdated: function() {
		if(!this.isLoaded) { return; }
		let mesh = this.el.components["collada-model"].model.children[ 0 ].children[ 0 ];
		let transparent = (this.data.opacity<1) ? true : false;

		mesh.material.materials[0].transparent = transparent;
		mesh.material.materials[1].transparent = transparent;

		mesh.material.materials[0].opacity = this.data.opacity;
		mesh.material.materials[1].opacity = this.data.opacity;

	},

});
