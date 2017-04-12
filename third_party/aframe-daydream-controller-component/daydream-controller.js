import OrientationArmModel from '../../js/orientation-arm-model'

if (typeof AFRAME === 'undefined') {
    throw new Error('Component attempted to register before AFRAME was available.');
}

var bind = AFRAME.utils.bind;
var trackedControlsUtils = AFRAME.utils.trackedControls;


var GAMEPAD_ID_PREFIX = 'Daydream Controller';

/**
 * Daydream Controller component for A-Frame.
 */
AFRAME.registerComponent('daydream-controller', {
    armModel: null,

    /**
     * Set if component needs multiple instancing.
     */
    multiple: false,

    schema: {
        controller: {
            default: 0
        },
        id: {
            default: 'Match none by default!'
        },
        rotationOffset: {
            default: 0
        },
        hand: {
            default: 'left'
        },
        buttonColor: {
            default: '#FAFAFA'
        }, // Off-white.
        buttonTouchedColor: {
            default: 'yellow'
        }, // Light blue.
        buttonPressedColor: {
            default: 'orange'
        }, // Light blue.
        model: {
            default: true
        },
        rotationOffset: {
            default: 0
        }, // use -999 as sentinel value to auto-determine based on hand
        gestureTimeoutLimit: {
            default: 100
        }, //if gesture doesn't complete within this timeframe, reset
        gestureTolerance: {
            default: 0.2
        } //percentage of the trackpad a gesture must traverse
    },

    // buttonId
    // 0 - trackpad
    mapping: {
        axis0: 'trackpad',
        axis1: 'trackpad',
        button0: 'trackpad',
        // button1: 'menu',
        // button2: 'system'
    },

    bindMethods: function() {
        this.onModelLoaded = bind(this.onModelLoaded, this);
        this.onControllersUpdate = bind(this.onControllersUpdate, this);
        this.checkIfControllerPresent = bind(this.checkIfControllerPresent, this);
        this.removeControllersUpdateListener = bind(this.removeControllersUpdateListener, this);
        this.onGamepadConnected = bind(this.onGamepadConnected, this);
        this.onGamepadDisconnected = bind(this.onGamepadDisconnected, this);
    },

    /**
     * Called once when component is attached. Generally for initial setup.
     */
    init: function() {
        var self = this;
        this.animationActive = 'pointing';
        this.onButtonChanged = bind(this.onButtonChanged, this);
        this.onButtonDown = function(evt) {
            self.onButtonEvent(evt.detail.id, 'down');
        };
        this.onButtonUp = function(evt) {
            self.onButtonEvent(evt.detail.id, 'up');
        };
        this.onButtonTouchStart = function(evt) {
            self.onButtonEvent(evt.detail.id, 'touchstart');
            evt.stopPropagation();
            evt.preventDefault();
        };
        this.onButtonTouchEnd = function(evt) {
            self.onButtonEvent(evt.detail.id, 'touchend');
        };
        this.onAxisMove = bind(this.onAxisMove, this);
        this.controllerPresent = false;
        this.everGotGamepadEvent = false;
        this.lastControllerCheck = 0;
        this.bindMethods();
        this.isControllerPresent = trackedControlsUtils.isControllerPresent; // to allow mock
        this.axisGestureTimeoutLimit = 100; //minimum
        this.axisGestureVelocity = 100; // minimum velocity in %/ms
        this.axisGestureThreshold = 0.1; // minimum % moved to recognize a gesture
        this.buttonStates = {};
        this.previousAxis = [];
        this.previousControllerPosition = new THREE.Vector3();
        this.armModel = new OrientationArmModel();
        // var camera = document.querySelector("#avatar");
        // camera = camera.object3D;
        // this.armModel.setHeadPosition(camera.position);

        this.armModel.setHeadPosition({x:0,y:1.6,z:0});

    },

    addEventListeners: function() {
        var el = this.el;
        el.addEventListener('buttonchanged', this.onButtonChanged);
        el.addEventListener('buttondown', this.onButtonDown);
        el.addEventListener('buttonup', this.onButtonUp);
        el.addEventListener('touchstart', this.onButtonTouchStart);
        el.addEventListener('axismove', this.onAxisMove);
        el.addEventListener('touchend', this.onButtonTouchEnd);
        el.addEventListener('model-loaded', this.onModelLoaded);
    },

    removeEventListeners: function() {
        var el = this.el;
        el.removeEventListener('buttonchanged', this.onButtonChanged);
        el.removeEventListener('buttondown', this.onButtonDown);
        el.removeEventListener('buttonup', this.onButtonUp);
        el.removeEventListener('touchstart', this.onButtonTouchStart);
        el.removeEventListener('axismove', this.onAxisMove);
        el.removeEventListener('touchend', this.onButtonTouchEnd);
        el.removeEventListener('model-loaded', this.onModelLoaded);
    },

    /**
     * Called when a component is removed (e.g., via removeAttribute).
     * Generally undoes all modifications to the entity.
     */
    // TODO ... remove: function () { },

    getControllerIfPresent: function() {
        // The 'Gear VR Touchpad' gamepad exposed by Carmel has no pose,
        // so it won't show up in the tracked-controls system controllers.
        var gamepads = this.getGamepadsByPrefix(GAMEPAD_ID_PREFIX);
        if (!gamepads || !gamepads.length) {
            return undefined;
        }
        return gamepads[0];
    },

    checkIfControllerPresent: function() {
        var data = this.data;
        var isPresent = this.isControllerPresent(this.el.sceneEl, GAMEPAD_ID_PREFIX, {});
        if (isPresent === this.controllerPresent) {
            return;
        }
        this.controllerPresent = isPresent;
        if (isPresent) {
            this.injectTrackedControls(); // inject track-controls
            this.addEventListeners();
        } else {
            this.removeEventListeners();
        }
    },

    onGamepadConnected: function(evt) {
        // for now, don't disable controller update listening, due to
        // apparent issue with FF Nightly only sending one event and seeing one controller;
        // this.everGotGamepadEvent = true;
        // this.removeControllersUpdateListener();
        this.checkIfControllerPresent();
    },

    onGamepadDisconnected: function(evt) {
        // for now, don't disable controller update listening, due to
        // apparent issue with FF Nightly only sending one event and seeing one controller;
        // this.everGotGamepadEvent = true;
        // this.removeControllersUpdateListener();
        this.checkIfControllerPresent();
    },

    tick: function() {
        var mesh = this.el.getObject3D('mesh');
        // Update mesh animations.
        if (mesh && mesh.update) {
            mesh.update(delta / 1000);
        }
        this.updatePose();
        this.updateButtons();
    },

    /**
     * Called when entity resumes.
     * Use to continue or add any dynamic or background behavior such as events.
     */
    play: function() {
        this.checkIfControllerPresent();
        window.addEventListener('gamepadconnected', this.onGamepadConnected, false);
        window.addEventListener('gamepaddisconnected', this.onGamepadDisconnected, false);
        this.addControllersUpdateListener();
    },

    /**
     * Called when entity pauses.
     * Use to stop or remove any dynamic or background behavior such as events.
     */
    pause: function() {
        window.removeEventListener('gamepadconnected', this.onGamepadConnected, false);
        window.removeEventListener('gamepaddisconnected', this.onGamepadDisconnected, false);
        this.removeControllersUpdateListener();
        this.removeEventListeners();
    },

    injectTrackedControls: function() {
        var el = this.el;
        var data = this.data;

        this.controller = trackedControlsUtils.getGamepadsByPrefix(GAMEPAD_ID_PREFIX)[0]

        // if we have an OpenVR Gamepad, use the fixed mapping
        // el.setAttribute('tracked-controls', {id: GAMEPAD_ID_PREFIX, rotationOffset: data.rotationOffset});

        if (!data.model) {
            return;
        }

    },

    addControllersUpdateListener: function() {
        this.el.sceneEl.addEventListener('controllersupdated', this.onControllersUpdate, false);
    },

    removeControllersUpdateListener: function() {
        this.el.sceneEl.removeEventListener('controllersupdated', this.onControllersUpdate, false);
    },

    onControllersUpdate: function() {
        if (!this.everGotGamepadEvent) {
            this.checkIfControllerPresent();
        }
    },

    onButtonChanged: function(evt) {
        var button = this.mapping['button' + evt.detail.id];
        var buttonMeshes = this.buttonMeshes;
        var value;
        value = evt.detail.state.value;
    },

    onAxisMove: function(evt) {
        // this.axisPosition
        //
        // console.log('axismove', evt.detail);
        // this.lastAxisMovement = {
        //   time: Date.now(),
        //   x: 0,
        //   y: 0
        // }
    },

    onModelLoaded: function(evt) {
        var controllerObject3D = evt.detail.model;
        var buttonMeshes;
        if (!this.data.model) {
            return;
        }
        buttonMeshes = this.buttonMeshes = {};
        buttonMeshes.menu = controllerObject3D.getObjectByName('menubutton');
        buttonMeshes.system = controllerObject3D.getObjectByName('systembutton');
        buttonMeshes.trackpad = controllerObject3D.getObjectByName('touchpad');
        // Offset pivot point
        controllerObject3D.position.set(0, -0.015, 0.04);
    },

    onButtonEvent: function(id, evtName) {
        var buttonName = this.mapping['button' + id];
        if(!buttonName) { return; }
        var i;
        if (Array.isArray(buttonName)) {
            for (i = 0; i < buttonName.length; i++) {
                this.el.emit(buttonName[i] + evtName);
            }
        } else {
            this.el.emit(buttonName + evtName);
        }
        // this.updateModel(buttonName, evtName);
    },

    updateModel: function(buttonName, evtName) {
        var i;
        if (!this.data.model) {
            return;
        }
        if (Array.isArray(buttonName)) {
            for (i = 0; i < buttonName.length; i++) {
                this.updateButtonModel(buttonName[i], evtName);
            }
        } else {
            this.updateButtonModel(buttonName, evtName);
        }
    },

    updateButtonModel: function(buttonName, state) {
        var color = this.data.buttonColor;
        if (state === 'touchstart' || state === 'up') {
            color = this.data.buttonTouchedColor;
        } else if (state === 'down') {
            color = this.data.buttonPressedColor;
        }
        var buttonMeshes = this.buttonMeshes;
        if (!buttonMeshes) {
            return;
        }
        buttonMeshes[buttonName].material.color.set(color);
    },

    /*  */

    updatePose: (function() {
        var controllerEuler = new THREE.Euler();
        var controllerPosition = new THREE.Vector3();
        var controllerQuaternion = new THREE.Quaternion();
        var deltaControllerPosition = new THREE.Vector3();
        var dolly = new THREE.Object3D();
        var standingMatrix = new THREE.Matrix4();
        controllerEuler.order = 'YXZ';
        return function() {
            var camera = document.querySelector("#avatar");
            if(!camera) return;
            camera = camera.object3D;

            var pose;
            var orientation;
            var position;
            var el = this.el;
            var controller = this.controller;
            if (!this.controller) {
                return;
            }
            pose = controller.pose;
            orientation = pose.orientation || [0, 0, 0, 1];
            position = pose.position || [0, 0, 0];
            // var camera = this.el.sceneEl.camera;
            controllerQuaternion.fromArray(orientation);
            // Feed camera and controller into the arm model.
            this.armModel.setHeadOrientation(camera.quaternion);
            // no need to set the head position anymore because it is located inside camera
            this.armModel.setHeadPosition({x:0,y:1.6,z:0});
            this.armModel.setControllerOrientation(controllerQuaternion);
            this.armModel.update();
            // Get resulting pose and configure the renderer.
            var modelPose = this.armModel.getPose();
            controllerEuler.setFromQuaternion(modelPose.orientation)
            el.setAttribute('rotation', {
                x: THREE.Math.radToDeg(controllerEuler.x),
                y: THREE.Math.radToDeg(controllerEuler.y),
                z: THREE.Math.radToDeg(controllerEuler.z) + this.data.rotationOffset
            });
            // console.log(modelPose.position);
            el.setAttribute('position', {
                x: modelPose.position.x,
                y: modelPose.position.y,
                z: modelPose.position.z
            });
        }
    })(),

    updateButtons: function() {
        var i;
        var buttonState;
        var controller = this.controller;
        if (!this.controller) {
            return;
        }
        for (i = 0; i < controller.buttons.length; ++i) {
            buttonState = controller.buttons[i];
            this.handleButton(i, buttonState);
        }
        this.handleAxes(controller.axes);
    },

    handleAxes: function(controllerAxes) {
        var previousAxis = this.previousAxis;
        var changed = false;
        var i;
        for (i = 0; i < controllerAxes.length; ++i) {
            if (previousAxis[i] !== controllerAxes[i]) {
                changed = true;
                break;
            }
        }
        if (!changed) {
            return;
        }
        this.previousAxis = controllerAxes.slice();
        this.el.emit('axismove', {
            axis: this.previousAxis
        });
    },

    handleButton: function(id, buttonState) {
        var changed = false;
        changed = changed || this.handlePress(id, buttonState);
        changed = changed || this.handleTouch(id, buttonState);
        changed = changed || this.handleValue(id, buttonState);
        if (!changed) {
            return;
        }
        this.el.emit('buttonchanged', {
            id: id,
            state: buttonState
        });
    },

    /**
     * Determine whether a button press has occured and emit events as appropriate.
     *
     * @param {string} id - id of the button to check.
     * @param {object} buttonState - state of the button to check.
     * @returns {boolean} true if button press state changed, false otherwise.
     */
    handlePress: function(id, buttonState) {
        var buttonStates = this.buttonStates;
        var evtName;
        var previousButtonState = buttonStates[id] = buttonStates[id] || {};
        if (buttonState.pressed === previousButtonState.pressed) {
            return false;
        }
        if (buttonState.pressed) {
            evtName = 'down';
        } else {
            evtName = 'up';
        }
        this.el.emit('button' + evtName, {
            id: id
        });
        previousButtonState.pressed = buttonState.pressed;
        return true;
    },

    /**
     * Determine whether a button touch has occured and emit events as appropriate.
     *
     * @param {string} id - id of the button to check.
     * @param {object} buttonState - state of the button to check.
     * @returns {boolean} true if button touch state changed, false otherwise.
     */
    handleTouch: function(id, buttonState) {
        var buttonStates = this.buttonStates;
        var evtName;
        var previousButtonState = buttonStates[id] = buttonStates[id] || {};
        if (buttonState.touched === previousButtonState.touched) {
            return false;
        }
        if (buttonState.touched) {
            evtName = 'start';
        } else {
            evtName = 'end';
        }
        previousButtonState.touched = buttonState.touched;
        var touches = [];
        this.el.emit('touch' + evtName, {
            id: id,
            state: previousButtonState,
            touches: touches
        });
        return true;
    },

    /**
     * Determine whether a button value has changed.
     *
     * @param {string} id - id of the button to check.
     * @param {object} buttonState - state of the button to check.
     * @returns {boolean} true if button value changed, false otherwise.
     */
    handleValue: function(id, buttonState) {
        var buttonStates = this.buttonStates;
        var previousButtonState = buttonStates[id] = buttonStates[id] || {};
        if (buttonState.value === previousButtonState.value) {
            return false;
        }
        previousButtonState.value = buttonState.value;
        return true;
    }
});
