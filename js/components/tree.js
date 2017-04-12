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

import { ShadowColor } from '../core/colors';

const getComponentProperty = AFRAME.utils.entity.getComponentProperty;
const setComponentProperty = AFRAME.utils.entity.setComponentProperty;

const stringify = AFRAME.utils.coordinates.stringify;

AFRAME.registerSystem('tree', {
    tree: null,
    treeTimeOut:null,
    isTreeCreated:false,

    schema: {

    },

    init: function() {

        document.addEventListener("TREE_CREATED", (event) => {
            setTimeout(() => {
                let balls = tree.getElementsByClassName("selectable");
            }, 100);
        });

        document.addEventListener("ON_TRIGGER_EMPTY_SPACE", (event) => {
            let newBallData = {
                id: "TEMP_NEW_SPHERE_ID",
                position: stringify(event.detail.controllerPos),
                hand: event.detail.hand,
                tone: event.detail.lastTone
            };
            this.createSphere(newBallData);
            ga('send', 'event', "interaction", "create");
        }, false);

        document.addEventListener("ON_DELETE", (event) => {
            this.deleteSphere(event.detail.closestEntity);
            ga('send', 'event', "interaction", "delete");
        }, false);

        this.createTree();
    },

    createTree: function() {
        this.tree = document.createElement('a-entity');
        this.tree.id = "tree";
        setComponentProperty(this.tree, "position","0 0 0");
        this.sceneEl.appendChild(this.tree);
    },

    createSphere: function(ballData) {
        if (!ballData) throw new Error("No ball data");

        let entity = document.createElement('a-entity');
        entity.id = ballData.id;
        entity.className = "ball";
        entity.className += " selectable";
        this.tree.appendChild(entity);
        setComponentProperty(entity, "ball", {hand:ballData.hand});
        setComponentProperty(entity, "tone", ballData.tone);
        setComponentProperty(entity, "position", ballData.position);
        setComponentProperty(entity, "visible", ballData.visible);
        setComponentProperty(entity, 'smooth-motion', 'amount:3');
        setComponentProperty(entity, 'ga', true);

        // setComponentProperty(entity, "mixin", "obj-ball");
        setComponentProperty(entity, "copresence", {uuid:ballData.uuid});

        if(!this.isTreeCreated){
            clearTimeout(this.treeTimeOut);
            this.treeTimeOut = setTimeout(() => {
                this.isTreeCreated = true;
                document.dispatchEvent(new Event("TREE_CREATED"));
            },0);
        }
    },

    deleteSphere: function(ballData) {
        let entity = document.querySelector("#" + ballData.id);
        if (!entity) {
            return;
        }

        let component = getComponentProperty(entity, "ball");

        // remove ball
        setTimeout(() => {
            this.tree.removeChild(entity);
        }, 0);
    },

    truncateDecimals: function(number, digits) {
        let multiplier = Math.pow(10, digits),
            adjustedNum = number * multiplier,
            truncatedNum = Math[adjustedNum < 0 ? 'ceil' : 'floor'](adjustedNum);
        return truncatedNum / multiplier;
    },

    switchRoom:function(){
        this.sceneEl.systems["copresence-server"].switchRoom();
    },
    clear: function(){

        let tree = document.querySelector("#tree");
        let balls = tree.getElementsByClassName("selectable");

        // delete balls on timer
        let setDeleteTimer = (ball, timer) => {
            setTimeout((event) => {
                this.deleteSphere(ball);
            },timer);
        };
        for(let i=0; i<balls.length; i++){
            let ball = balls[i];
            setDeleteTimer(ball, (balls.length-i)*1 + 0);
        }
        this.isTreeCreated = false;

    },
    getTreeCreated: function(){
        return this.isTreeCreated;
    }
});
