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

import { getParameterByName } from '../util';

AFRAME.registerComponent('proximity-check', {
    schema: {
        objects: {
            default: [],
            type: 'array'
        },
    },

    init: function() {

    },

    play: function() {
        document.addEventListener('PLAYER_ADDED', (event) => {
            // adds to list
            this.data.objects.push(event.detail.entity);
            // when remote heads move check distances
            let head = document.querySelector("#head_"+event.detail.entity.id);
            let person = head.parentNode;
            person.addEventListener('componentchanged', (event) => {
                this.checkDistances();
            });
            this.checkDistances();
        });

        if(getParameterByName("proximity")!=="false"){
            // when player moves check distances
            let player = document.querySelector("#player");
            player.addEventListener('componentchanged', (event) => {
                this.checkDistances();
            });
            this.checkDistances();
        }
    },

    pause: function() {

    },

    checkDistances:function() {
        let myPosition = this.el.object3D.getWorldPosition();

        let entity;
        for(let i=0; i<this.data.objects.length; i++){
            entity = this.data.objects[i];
            let head = document.querySelector("#head_"+entity.id);
            if(!head){ return; }

            let distanceSquared = myPosition.distanceToSquared(head.object3D.getWorldPosition());
            const max = 1.5;
            const min = 0.5;
            let opacity = (distanceSquared<max) ? (distanceSquared-min)/(max-min) : 1;
            opacity = (opacity<0) ? 0 : opacity;
            setComponentProperty(head,"headset-material", "opacity:"+opacity);

            let left = document.querySelector("#left_"+entity.id);
            if(left){
                setComponentProperty(left,"controller-material", "opacity:"+opacity);
            }

            let right = document.querySelector("#right_"+entity.id);
            if(right){
                setComponentProperty(right,"controller-material", "opacity:"+opacity);
                if(right.childNodes.length > 0){
                    let ray = right.childNodes[0];
                    ray.setAttribute("opacity",opacity);
                    let cone = right.childNodes[0].childNodes[0];
                    cone.setAttribute("opacity",opacity);
                }
            }
        }
    },
});
