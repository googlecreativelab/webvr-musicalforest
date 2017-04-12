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

const stringify = AFRAME.utils.coordinates.stringify;
import TWEEN from 'tween.js';

export class NoteHead {

	constructor( palette, shape ) {
		this.palette = palette;
		this.shape = shape;

        this.shader = THREE.BallShader;
        this.uniforms = THREE.UniformsUtils.clone( this.shader.uniforms );
        this.material = new THREE.ShaderMaterial({
        	uniforms: this.uniforms,
        	vertexShader: this.shader.vertexShader,
        	fragmentShader: this.shader.fragmentShader
        });

        this.mesh = new THREE.Mesh( this.geometry, this.material );
	}

	setTone( value ) {

		this.tone = value;
        this.scale = ( 1 - this.tone / ( this.palette.totalNotes() - 1 ) ) * 2 + 1;
        this.mesh.scale.set( this.scale, this.scale, this.scale );

		setTimeout( () => {
			let textureId = Math.floor( this.tone / this.palette.noteCount() );
			let textureOrder = this.tone % this.palette.noteCount();
			let textureData = ["circles","squares","triangles"][textureId];
			this.palette.shapePalette( textureData )[ textureOrder ].setUniforms( this.material );
			this.palette.colorPalette()[ this.tone ].setUniforms( this.material );
	        let texture134 = this.palette.textureSprite134( textureId );
	        let texture567 = this.palette.textureSprite567( textureId );
	        texture134.needsUpdate = true;
	        texture567.needsUpdate = true;

	        this.material.uniforms.map134.value = texture134;
	        this.material.uniforms.map567.value = texture567;
	        this.material.uniforms.lightPosition.value.copy( this.lightPosition );
		},0);
	}
	highlight( event ) {
		this.material.uniforms.brightnessAmount.value = 0.2;
	}
	unHighlight( event ) {
		this.material.uniforms.brightnessAmount.value = 0.0;
	}
	hit( event, timeMs ) {
		// Cancel tween if it already exists
        if ( this.hitTween ) {
            this.hitTween.stop();
        }
        this.hitPosition = event.detail.controllerPosition;
        this.offsetPosition = this.mesh.getWorldPosition();

        if(this.hitPosition) {
            this.offsetPosition.sub(this.hitPosition);
        }

        this.hitVelocity = (event.detail.velocity===0) ? 1 : event.detail.velocity;

        this.hitTween = new TWEEN.Tween( { t: this.hitVelocity } )
            .to( { t: 0 }, timeMs )
			.easing( TWEEN.Easing.Elastic.Out )
            .delay( event.detail.delay * 1000 )
			.onUpdate( (t) => {
				this.updateHitTween( t );
            })
			.onComplete( () => {
                this.updateHitTween( 1 );
            });
        this.hitTween.start();

		this.hitFrameTween = new TWEEN.Tween( { t: 0 } )
            .to( { t: 1 }, timeMs*1.25 )
			.easing( TWEEN.Easing.Linear.None )
            .delay( event.detail.delay * 1000 )
			.onUpdate( (t) => {
				this.material.uniforms.spriteIndex.value = Math.floor( t * 32 );
            })
			.onComplete( () => {
				this.material.uniforms.spriteIndex.value = Math.floor( 1 * 32 );
            });
        this.hitFrameTween.start();

	}

	updateHitTween( t ) {
		let s = ( 1 - t ) * this.hitVelocity + this.scale;
        this.mesh.scale.set( s, s, s );
		this.material.uniforms.activeAmount.value = 1 - t;
        if(this.hitPosition) {
            let p = ( 1 - t );
            this.mesh.position.x = this.offsetPosition.x*p*this.hitVelocity;
            this.mesh.position.y = this.offsetPosition.y*p*this.hitVelocity;
        }
	}

	get geometry() { }
	get rotation() { }
}
