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

/**
 * Based on aframe/examples/showcase/tracked-controls.
 *
 * Handles events coming from the hand-controls.
 * Determines if the entity is grabbed or released.
 * Updates its position to move along the controller.
 */
import { getViewerType, getParameterByName } from '../util';

const getComponentProperty = AFRAME.utils.entity.getComponentProperty;
const setComponentProperty = AFRAME.utils.entity.setComponentProperty;

const BALL_RADIUS = 0.05;
const CONTROLLER_BALL_RADIUS = 0.04;
const DELETE_VELOCITY = 0.2;
const VELOCITY_SAMPLES = 10;

AFRAME.registerComponent('grab-move', {
	controllerBall: null,
	selectedSphere: -1,
	prevControllerPos: null,
	velocityHistory : [],
	lastUpdate: Date.now(),
	hasJustPlayed:false,
	previousClosestSphere:null,
	grabbedSphere: null,
	schema: {
		grabbing: {default: false, type: 'boolean'},
		isNearSphere: {default: false, type: 'boolean'},
		closestSphere: { default:null }
	},

	init: function () {
		this.data.grabbing = false;
		document.addEventListener("BALL_CREATED", (event) => {

			// when ball is created, makes sure hand is passed to correct ball
			if(this.data.grabbing && event.detail.grab && event.detail.hand===this.el.id) {
				let closestSphere = event.detail.el;
				this.selectBall(closestSphere);
				this.grabbedSphere = closestSphere;
				closestSphere.emit("controllerhit", {velocity:0.5});
				this.hasJustPlayed = true;

			}
		}, false);

	},

	selectBall: function(entity){
		if(this.selectedSphere && this.selectedSphere !== -1) {
			this.selectedSphere.setAttribute('ball', 'grabbed', false);
		}

		if( entity === -1 ){
			this.selectedSphere = -1;
		} else {
			this.selectedSphere = entity;
			this.selectedSphere.setAttribute('ball', 'grabbed', true);
		}
	},

	// 57, 48
	onKeyUp: function (event) {
		switch(event.keyCode){
			// close bracket
			case 219:
				this.onTriggerPress();
				break;
			// open bracket
			case 221:
				this.onTriggerRelease();
				break;
			// close parenthisis
			case 48:
				let controllerPos = this.controllerBall.getWorldPosition();
				let [ closestSphere, distanceSquared ] = this.getClosestEntity(tree, controllerPos);
				this.grabbedSphere = closestSphere;
				if(this.grabbedSphere){
					this.delete();
				}
				break;
		}

	},

	creatControllerBall: function() {
		let material, geometry, ball;
		geometry = new THREE.IcosahedronGeometry( 0.04, 1);
		material = new THREE.MeshBasicMaterial( {
			color: 0xffffff,
			transparent:true,
			opacity: 0.25 });
		this.controllerBall = new THREE.Mesh(geometry,material);
		// ball = new THREE.Object3D();

		this.controllerBall.name = "ball";
		this.el.object3D.add(this.controllerBall);

		if(this.el.id === "avatar") {
			this.controllerBall.position.z = -1.0;
		} else {
			this.controllerBall.position.z = -0.03;
		}

		this.el.object3D.add(this.controllerBall);

		// delete from avatar
		document.addEventListener("CONTROLLER_CREATED", (event) => {
			if(this.el.id !== "avatar") { return; }
			if(!this.controllerBall) { return; }
			this.el.object3D.remove(this.controllerBall);
        }, false);

	},
	play: function () {
		this.creatControllerBall();
		this.enableInteractions();

	},

	enableInteractions: function() {
		if (this.el.id === "avatar" && getParameterByName('reticle')==='true') {
			document.addEventListener('keyup', this.onKeyUp.bind(this));
		}
		this.el.addEventListener('triggerdown', this.onTriggerPress.bind(this));
		this.el.addEventListener('triggerup', this.onTriggerRelease.bind(this));

	},
	pause: function () {
		if (this.el.id === "avatar" && getParameterByName('reticle')==='true') {
			document.removeEventListener('keyup', this.onKeyUp);
		}

		this.el.removeEventListener('triggerdown', this.onTriggerPress);
		this.el.removeEventListener('triggerup', this.onTriggerRelease);
	},

	getClosestEntity: function(tree, pos, ignored) {
		let minValue = 100000;
		let closestId = -1;
		for(let i=0; i<tree.children.length; i++ ){
			let entity = tree.children[i];
			if(entity.id === ignored) { break; }
			let distance = entity.object3D.getWorldPosition().distanceToSquared (pos);
			if(distance<minValue && entity.classList.contains('selectable')) {
				closestId = i;
				minValue = distance;
			}
		}
		return [tree.children[closestId], minValue];
	},

	onTriggerPress: function (evt) {
		let avatar = document.querySelector('#avatar');
		let controller = this.el;

		let avatarPosition = getComponentProperty(avatar,"position");
		let controllerPosition = getComponentProperty(controller,"position");

		this.el.setAttribute('grab-move', 'grabbing', true);
    	let tree = document.querySelector("#tree");

		let controllerPos = this.controllerBall.getWorldPosition();
		let [ closestSphere, distanceSquared ] = this.getClosestEntity(tree, controllerPos);

		if(closestSphere) {
			let hitScalar = (this.getShape(closestSphere) === "sphere") ? 1 : 1.5;
			let thresholdSquared = this.getScale(closestSphere) * BALL_RADIUS*hitScalar + CONTROLLER_BALL_RADIUS;
			thresholdSquared = thresholdSquared*thresholdSquared;
			this.data.isNearSphere = distanceSquared < thresholdSquared;
		} else {
			this.data.isNearSphere = false;
		}

		this.data.closestSphere = closestSphere;

		if(this.data.isNearSphere) {
			this.selectBall(closestSphere);
			this.grabbedSphere = closestSphere;
            closestSphere.emit("grab");
		} else {
			this.selectBall(-1);
			this.grabbedSphere = null;
		}

		// if trigger is down where no balls are near
		if(!this.data.isNearSphere) {
			let treePosition = tree.object3D.getWorldPosition();
			controllerPos.sub(treePosition);
			let lastTone = this.el.components['touch-color'].lastTone;
			let triggerEvent = new CustomEvent("ON_TRIGGER_EMPTY_SPACE",{ "detail": {
				"controllerPos":controllerPos,
				"hand": this.el.id,
				"lastTone" : lastTone
			}});
			document.dispatchEvent(triggerEvent);
		}
	},

	onTriggerRelease: function (evt) {
		this.el.setAttribute('grab-move', 'grabbing', false);
		this.selectBall(-1);

		// deletion check based on shaking gesture's velocity
		let controllerPos = this.controllerBall.getWorldPosition();
		let velocity = this.getVelocity(controllerPos);
		if(velocity > DELETE_VELOCITY) {
			this.delete();
		}
	},

	delete: function () {
		if(!this.grabbedSphere) { return; }
		let controllerPos = this.controllerBall.getWorldPosition();
		let triggerEvent = new CustomEvent("ON_DELETE",{ "detail": {
			"closestEntity": this.grabbedSphere,
		}});
		document.dispatchEvent(triggerEvent);
	},

	getVelocity: function(controllerPos) {
		let velocity;
		// compute velocity
		if (this.prevControllerPos){
			let distance = this.prevControllerPos.distanceTo(controllerPos);
			let elapsedTime = Date.now() - this.lastUpdate;
			let instantVelocity = distance / elapsedTime;
			this.lastUpdate = Date.now();
			this.prevControllerPos.copy(controllerPos);
			this.velocityHistory.push(distance);
		} else {
			this.prevControllerPos = controllerPos.clone();
			this.velocityHistory.push(0);
		}

		//keep no more than 10
		if (this.velocityHistory.length > VELOCITY_SAMPLES){
			this.velocityHistory.shift();
		}

		//compute the velocity as an average over all of the velocity history
		velocity = this.velocityHistory.reduce(function(a, b) { return a + b; }) / this.velocityHistory.length;
		velocity = Math.min(velocity / 0.02, 1); // normalize
		return velocity;
	},

	tick: function(){

		let tree = document.querySelector("#tree");
		if(!this.controllerBall || tree.children.length === 0) { return; }

		let controllerPos = this.controllerBall.getWorldPosition();
		let [ closestSphere , distanceSquared ] = this.getClosestEntity(tree, controllerPos);
		if(!closestSphere) { return; }
		if(closestSphere.id === "TEMP_NEW_SPHERE_ID") { return; }

		let hitScalar = (this.getShape(closestSphere) === "sphere") ? 1 : 1.5;

		let thresholdSquared = this.getScale(closestSphere) * BALL_RADIUS*hitScalar + CONTROLLER_BALL_RADIUS;
		thresholdSquared = thresholdSquared*thresholdSquared;
		this.data.isNearSphere = distanceSquared < thresholdSquared;
		let velocity = this.getVelocity(controllerPos);

		// hightlight controller if near a ball
		if(this.data.isNearSphere) {
			this.previousClosestSphere = this.data.closestSphere;
			this.data.closestSphere = closestSphere;
			this.controllerBall.material.opacity = 0.75;
		} else {
			this.controllerBall.material.opacity = 0.25;
			this.hasJustPlayed = false;
		}

		// repositions ball when grabbing so ball rests just above controller.
		if(this.data.grabbing && (this.selectedSphere !== -1)) {
			let treePosition = tree.object3D.getWorldPosition();
			// controllerPos = this.controllerBall.getWorldPosition();

			let matrix = new THREE.Matrix4();
			matrix.extractRotation( this.el.object3D.matrix );

			// let tone = this.getTone(this.selectedSphere);
			let tone = this.getTone(this.selectedSphere) % this.getTonesInScale();
			let hitScalar = (this.getShape(this.selectedSphere) === "sphere") ? 1 : 1.5;
			let scale = 1 - tone / (this.getTotalTones() - 1);
			let ballSize = 0.1;

			ballSize *= scale*hitScalar;
			ballSize += 0.05;

			let direction = new THREE.Vector3( 0, 0, 1 );
			direction.applyMatrix4( matrix );
			direction.normalize();
			direction.multiplyScalar(ballSize-0.05);
			controllerPos.sub(treePosition);
			controllerPos.sub(direction);

			// if ball position is too low
			if (controllerPos.y < 0.25) {
				controllerPos.y = 0.25;
			}

			setComponentProperty(this.selectedSphere, "position", AFRAME.utils.coordinates.stringify(controllerPos));
		}

		// touch hits
		if(this.data.grabbing) { return; }
		if(!this.data.isNearSphere) { return; }
		if(!this.hasJustPlayed || this.previousClosestSphere !== closestSphere) {
			closestSphere.emit("controllerhit", {velocity:velocity, controllerPosition: this.controllerBall.getWorldPosition()});
			this.hasJustPlayed = true;
      		this.el.emit('vibrate');
		}
	},

	getTone(el){
		return el.getAttribute('tone');
	},
	getTotalTones(el){
		return this.el.sceneEl.components.palette.totalNotes();
	},
	getTonesInScale() {
        return this.el.sceneEl.components.palette.noteCount();
    },
	getScale(entity) {
		return entity.components.ball.note.head.scale;
	},
	getShape(entity) {
		return entity.components.ball.note.head.shape;
	},
});
