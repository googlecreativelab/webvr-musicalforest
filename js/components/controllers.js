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

const getComponentProperty = AFRAME.utils.entity.getComponentProperty;
const setComponentProperty = AFRAME.utils.entity.setComponentProperty;

AFRAME.registerSystem('controllers', {
    controllerExists:false,
    schema: {

    },

    init: function() {

        document.addEventListener("INTRO_COMPLETED", (event) => {
            let timeout;
            let loopCount = 0;
            let loopFunction = () => {
                if (loopCount > 240 ) {

                } else if(this.controllerExists){

                } else {
                    timeout = setTimeout(() => {
                        loopCount++;
                        this.testForController();
                        loopFunction();
                    }, 1000);
                }
            };
            loopFunction();
        }, false);

    },
    getGamePad: function() {
        let vrGamepad = null;
        if (!navigator.getGamepads) {
            return vrGamepad;
        }
        let gamepads = navigator.getGamepads();
        for (let i = 0; i < gamepads.length; ++i) {
            let gamepad = gamepads[i];
            if (gamepad) {
                return gamepad;
            }
        }
        return null;
    },
    testForController: function() {
        let vrGamepad = this.getGamePad();
        if (!vrGamepad) {
            return;
        }

        let player;
        let controller;
        let rightHand;
        let leftHand;

        switch(vrGamepad.id){
            case "Daydream Controller":
                player = document.querySelector('#player');
                controller = this.createDayDreamCoprescenceController("rightHand", "right");
                player.appendChild(controller);
                this.createDayDreamManager();
                break;
            case "OpenVR Gamepad":
                player = document.querySelector('#player');
                rightHand = this.createViveController("rightHand", "right");
                player.appendChild(rightHand);
                leftHand = this.createViveController("leftHand", "left");
                player.appendChild(leftHand);
                break;
            case "Oculus Touch (Left)":
            case "Oculus Touch (Right)":
                player = document.querySelector('#player');
                rightHand = this.createOcculusController("rightHand", "right");
                player.appendChild(rightHand);
                leftHand = this.createOcculusController("leftHand", "left");
                player.appendChild(leftHand);
                break;
            default:
                player = document.querySelector('#player');
                rightHand = this.createOcculusController("rightHand", "right");
                player.appendChild(rightHand);
                leftHand = this.createOcculusController("leftHand", "left");
                player.appendChild(leftHand);
                break;
        }

        let triggerEvent = new CustomEvent("CONTROLLER_CREATED", {
            "detail": {
                "id": vrGamepad.id
            }
        });
        document.dispatchEvent(triggerEvent);

        this.controllerExists = true;
    },
    createViveController: function(id, hand) {
        let controller = document.createElement('a-entity');
        controller.id = id;
        if(this.sceneEl.components.palette && this.sceneEl.components.palette.controllerColors()) {
            let color = this.sceneEl.components.palette.controllerColors()[1];
            controller.setAttribute("vive-controls", "hand:" + hand + "; model:false");
            this.load6DofControllerParams(controller, hand, color);
        } else {
            document.addEventListener("SPHERE_TEXTURE_LOADED", (event) => {
                let color = this.sceneEl.components.palette.controllerColors()[1];
                controller.setAttribute("vive-controls", "hand:" + hand + "; model:false");
                this.load6DofControllerParams(controller, hand, color);
            });
        }
        return controller;
    },

    load6DofControllerParams: (entity, hand, color) => {
        entity.setAttribute("mixin", "avatar-hand");
        entity.setAttribute("grab-move", "");
        entity.setAttribute("tool-tips", "hand:"+hand+";");
        entity.setAttribute("haptics", "hand:"+ hand );
        entity.setAttribute("touch-color", "");
        entity.setAttribute("controller-material", "bandColor:"+color+";");
        entity.setAttribute("copresence", "components: mixin, position, rotation; decimals:3; playerpart:"+hand);
    },

    createOcculusController: function(id, hand) {
        let controller = document.createElement('a-entity');
        controller.id = id;
        if(this.sceneEl.components.palette && this.sceneEl.components.palette.controllerColors()) {
            let color = this.sceneEl.components.palette.controllerColors()[1];
            controller.setAttribute("oculus-touch-controls", "hand:" + hand + "; model:false");
            this.load6DofControllerParams(controller, hand, color);
        } else {
            document.addEventListener("SPHERE_TEXTURE_LOADED", (event) => {
                let color = this.sceneEl.components.palette.controllerColors()[1];
                controller.setAttribute("oculus-touch-controls", "hand:" + hand + "; model:false");
                this.load6DofControllerParams(controller, hand, color);
            });
        }
        return controller;
    },
    /*
     * Proxy controller. used for copresence
     */
    createDayDreamCoprescenceController: function(id, hand) {
        let controller = document.createElement('a-entity');
        controller.id = id;
        controller.setAttribute("position", "0 0 0");
        controller.setAttribute("copresence", "components: mixin, position, rotation; decimals:3; playerpart:"+hand);
        return controller;
    },

    createDayDreamManager: function() {
        let player = document.querySelector('#player');
        let avatar = document.querySelector('#avatar');
        let avatarPosition = getComponentProperty(avatar, "position");
        let manager = document.createElement('a-entity');
        manager.id = "daydream";
        manager.setAttribute("daydream-manager", "headset: #avatar; proxy: #rightHand; controller: #controller;");
        manager.setAttribute("position", avatarPosition.x + " 0.0 " + avatarPosition.z);
        this.sceneEl.appendChild(manager);

        let controller = document.createElement('a-entity');
        controller.id = "controller";
        controller.setAttribute("daydream-controller", "");
        controller.setAttribute("position", "0 0.1 0");
        controller.setAttribute("daydream-pointer", "");
        controller.setAttribute("mixin", "avatar-hand");

        if(this.sceneEl.components.palette && this.sceneEl.components.palette.controllerColors()) {
            let color = this.sceneEl.components.palette.controllerColors()[1];
            controller.setAttribute("controller-material", "bandColor:"+color+";");
        } else {
            document.addEventListener("SPHERE_TEXTURE_LOADED", (event) => {
                let color = this.sceneEl.components.palette.controllerColors()[1];
                controller.setAttribute("controller-material", "bandColor:"+color+";");
            });
        }


        manager.appendChild(controller);
    },

    doesControllerExists: function() {
        return this.controllerExists;
    }
});
