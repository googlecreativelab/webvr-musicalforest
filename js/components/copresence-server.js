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

import serverMessageConstants from '../../backend/src/messages/message-constants';

import {  ExitRoom, RoomClientPositionUpdate, CreateSphereAtPosition, DeleteSphere, SpherePositionUpdate, SphereToneUpdate, SphereConnectionUpdate, GrabSphere, ReleaseSphere, StrikeSphere } from './copresence-server-messages';
import _ from 'underscore';
import { getParameterByName, getViewerType, showErrorMessage } from '../util';

const msgTypes = serverMessageConstants.OUTGOING_MESSAGE_TYPES;
const errorTypes = serverMessageConstants.ERROR_TYPES;
const clientMsgComponents = serverMessageConstants.INCOMING_MESSAGE_COMPONENTS;
const serverMsgComponents = serverMessageConstants.OUTGOING_MESSAGE_COMPONENTS;

const getComponentProperty = AFRAME.utils.entity.getComponentProperty;
const setComponentProperty = AFRAME.utils.entity.setComponentProperty;
const stringify = AFRAME.utils.coordinates.stringify;

const MESSAGE_THROTTLE_INTERVAL = 200;

///
/// ------------------------------- SYSTEM --------------------------------------
///

AFRAME.registerSystem('copresence-server', {
    // Holds the local players data (head and arm location)
    playerDataCache: {
        head: { position: {x:0, y:1.6, z:0}, rotation: {x:0, y:0, z:0}},
        left: { position: {x:0.25, y:-10001.3, z:0}, rotation: {x:0, y:0, z:0}},
        right: { position: {x:-0.25, y:-10001.3, z:0}, rotation: {x:0, y:0, z:0}},
        userdata: {}
    },
    playerDataDirty: true,
    entities: {},
    sphereCache: {},
    connected: false,
    throttledSendMsg: null,
    schema: {
        hostname: {type: 'string'},
        port: {type: 'number'}
    },

    init: function(){
        this.throttledServerUpdate = _.throttle(()=>{
            this.sendClientUpdate();
        }, MESSAGE_THROTTLE_INTERVAL, {leading:true, trailing:true});
        // this.throttledSendMsg = _.throttle((msg)=>{
        //     this.sendMsg(msg);
        // }, MESSAGE_THROTTLE_INTERVAL, {leading:true, trailing:true});
    },

    tick: function(){
        // Check if player data has changed
        if(this.playerDataDirty && this.connected){
            this.throttledServerUpdate();
        }
    },

    sendClientUpdate: function () {
      this.playerDataDirty = false;

      let spheres = [];
      for(let sphereId in this.sphereCache){
        if(this.sphereCache[sphereId].dirty){
          this.sphereCache[sphereId].dirty = false;
          spheres.push({
              id: sphereId,
              position: this.sphereCache[sphereId].position
          });
        }
      }

      let playerMsg = new RoomClientPositionUpdate(this.playerDataCache, spheres);
      this.sendMsg(playerMsg);
    },

    //returns a promise which is resolved when the server connects
    connectToServer: function(){
        if(this.connected) {
            return;
        }

        this.region = CONFIG.DEFAULT_REGION;
        this.roomname = undefined;

        if(window.location.hash){
          var matches = window.location.hash.match(/#(\w+)-(\w{4})/);
          if(matches.length >= 3){
            this.region = matches[1];
            this.roomname = matches[2];
          }
        }

        // If server doesnt exist, pick another available server
        if(!CONFIG.SERVERS[this.region]){
            this.region = Object.keys(CONFIG.SERVERS)[0];
        }

        let ws_url = [
            "wss://",CONFIG.SERVERS[this.region], ":", "443"
        ].join('');

        if(getParameterByName("server")){
            ws_url = getParameterByName("server");
        }

        // client type is asynchronous
        let connectWithClientType = (clientType) => {
            ws_url = ws_url + '/' + clientType;
            if(this.roomname){
                ws_url = ws_url + '/' + this.roomname;
            }

            return new Promise((connected, error) => {
                // window.UI.connecting();
                this.ws = new WebSocket( ws_url );
                this.ws.onopen = connected;
                this.ws.onmessage = (msg) => {
                    let msg_data;
                    try {
                        msg_data = JSON.parse(msg.data);
                    } catch (e) {
                        console.error(e);
                        showErrorMessage("error_shake.gif", "Hmm, something went wrong", "Home");
                    }

                    if(msg_data) {
                        this.parseWebsocketMessage(
                            msg_data[ clientMsgComponents.ALL_MESSAGES.MSG ],
                            msg_data[ clientMsgComponents.ALL_MESSAGES.FROM ]
                        );
                    }
                };

                this.ws.onclose = () => {
                    // window.UI.connectionError();
                };

                this.ws.onerror = (err) =>{
                    if(this.ws.readyState > 1){
                        // TODO: Error handling
                        error(err);
                        showErrorMessage("error_shake.gif", "Hmm, something went wrong", "Home");
                    }
                };
            });
        };

        getViewerType((clientType) => {
            connectWithClientType(clientType);
        });
    },

    parseWebsocketMessage: function(msg, from){
        if(!msg) return;

        let msgType = msg[ clientMsgComponents.ALL_MESSAGES.TYPE ];
        let msgData = msg[ clientMsgComponents.ALL_MESSAGES.DATA ];

        switch( msgType ){

            // Room
            case msgTypes.CONNECTION_INFO:
                this.clientId = msgData[ serverMsgComponents.CONNECTION_INFO.CLIENT_ID ];
                this.serverId = msgData[ serverMsgComponents.CONNECTION_INFO.SERVER_ID ];
                break;

            case msgTypes.ROOM_STATUS_INFO:
                this.handleRoomStatusInfo(msgData);
                break;

            case msgTypes.ROOM_EXIT_SUCCESS:
                break;

            case msgTypes.ROOM_HEARTBEAT:
                break;

            case msgTypes.ROOM_CLIENT_JOIN:
                if(!this.connected) break;
                this.handleRemoteJoining(msgData);
                break;

            case msgTypes.ROOM_CLIENT_EXIT:
                if(!this.connected) break;
                this.handleRemoveEntity(msgData);
                break;

            // Remote Clients
            case msgTypes.ROOM_CLIENT_COORDS_UPDATED:
                if(!this.connected) break;
                this.handleUpdatePlayerEntity(from, msgData);
                if(msgData[ serverMsgComponents.ROOM_CLIENT_COORDS_UPDATED.SPHERES ]){
                    for(let sphere of msgData[ serverMsgComponents.ROOM_CLIENT_COORDS_UPDATED.SPHERES ]) {
                        this.handleSpherePositionUpdate(sphere);
                    }
                }
                break;


            // Spheres
            case msgTypes.ROOM_SPHERE_CREATED:
                if(!this.connected) break;
                this.handleSphereCreation(msgData, true, msgTypes.ROOM_SPHERE_CREATED);
                break;

            case msgTypes.ROOM_SPHERE_GRABBED:
                break;

            case msgTypes.ROOM_SPHERE_POSITION_UPDATED:
                // Deprecated
                if(!this.connected) break;
                this.handleSpherePositionUpdate(msgData);
                break;

            case msgTypes.ROOM_SPHERE_TONE_SET:
                if(!this.connected) break;
                this.handleSphereToneUpdate(msgData);
                break;

            case msgTypes.ROOM_SPHERE_CONNECTIONS_SET:
                if(!this.connected) break;
                this.handleSphereConnectionUpdate(msgData);
                break;

            case msgTypes.ROOM_SPHERE_RELEASED:
                break;

            case msgTypes.ROOM_SPHERE_STRUCK:
                if(!this.connected) break;
                this.handleSphereStruck(msgData);
                break;

            case msgTypes.ROOM_SPHERE_DELETED:
                if(!this.connected) break;
                this.handleSphereDeletion(msgData, true);
                break;


            case msgTypes.CREATE_SPHERE_DENIED:
                break;

            case msgTypes.CREATE_SPHERE_SUCCESS:
                if(!this.connected) break;
                this.handleSphereCreation(msgData, false, msgTypes.CREATE_SPHERE_SUCCESS);
                break;

            case msgTypes.GRAB_SPHERE_DENIED:
                break;
            case msgTypes.GRAB_SPHERE_SUCCESS:
                break;

            case msgTypes.UPDATE_SPHERE_POSITION_INVALID:
                break;

            case msgTypes.UPDATE_SPHERE_POSITION_DENIED:
                break;

            case msgTypes.RELEASE_SPHERE_DENIED:
                break;

            case msgTypes.RELEASE_SPHERE_INVALID:
                break;

            case msgTypes.RELEASE_SPHERE_SUCCESS:
                break;

            case msgTypes.DELETE_SPHERE_DENIED:
                break;

            case msgTypes.DELETE_SPHERE_INVALID:
                break;

            case msgTypes.DELETE_SPHERE_SUCCESS:
                break;

            case msgTypes.SET_SPHERE_TONE_DENIED:
                break;

            case msgTypes.SET_SPHERE_TONE_INVALID:
                break;

            case msgTypes.SET_SPHERE_TONE_SUCCESS:
                break;

            case msgTypes.SET_SPHERE_CONNECTIONS_DENIED:
                break;

            case msgTypes.SET_SPHERE_CONNECTIONS_INVALID:
                break;

            case msgTypes.SET_SPHERE_CONNECTIONS_SUCCESS:
                break;

            case msgTypes.CONNECT_SPHERES_IDENTICAL:
                break;

            case msgTypes.CONNECT_SPHERES_INVALID:
                break;

            case msgTypes.CONNECT_SPHERES_MISSING:
                break;


            case errorTypes.INVALID_URL:
                showErrorMessage("error_shake.gif", "Invalid URL", "Try Again");
                break;
            case errorTypes.NO_ROOMS_AVAILABLE:
                showErrorMessage("error_full.gif", "All rooms are currently occupied. Try again later", "Home");
                break;
            case errorTypes.NO_SUCH_ROOM:
                showErrorMessage("error_shake.gif", "Hmm, something went wrong", "Home");
                break;
            case errorTypes.ROOM_QUEUE_FULL:
                showErrorMessage("error_full.gif", "There are too many players in this room", "Try Another");
                break;
            case errorTypes.ROOM_FULL:
                showErrorMessage("error_full.gif", "There are too many players in this room", "Try Another");
                break;
            case errorTypes.ROOM_UNAVAILABLE:
                showErrorMessage("error_knock.gif", "This room is temporarily unavailable", "Home");
                break;
            case errorTypes.BUSY_TRY_AGAIN:
                showErrorMessage("error_hit.gif", "Hmm, something went wrong", "Try Again");
                break;
            case errorTypes.ROOM_NOT_READY:
                showErrorMessage("error_knock.gif", "Hmm, something went wrong", "Try Again");
                break;
            case errorTypes.ROOM_JOIN_TIMEOUT:
                showErrorMessage("error_knock.gif", "Hmm, something went wrong", "Try Again");
                break;
            case errorTypes.SPHERE_HOLD_TIMEOUT:
                break;
            case errorTypes.CLIENT_INACTIVITY_TIMEOUT:
                break;

            default:
        }
    },

    sendMsg: function(msg){
        if(this.ws && this.ws.readyState == 1) {
            this.ws.send(msg.serialize());
        }
    },

    handleRoomStatusInfo: function(data){
        this.connected = true;
        const roomName = data[ serverMsgComponents.ROOM_STATUS_INFO.ROOM_NAME ];
        const roomSoundbank = data[ serverMsgComponents.ROOM_STATUS_INFO.SOUNDBANK ];

        // list of clients already in the room arranged according to headsetType
        const clientList = data[ serverMsgComponents.ROOM_STATUS_INFO.CLIENTS ];
        Object.keys( clientList ).forEach(( headsetType ) => {
            for(let i = 0; i<clientList[headsetType].length; i++) {
                this.createRemotePlayerEntity(clientList[headsetType][i],headsetType);
            }
        });

        let loadSpheres = (event) => {
            document.removeEventListener("SPHERE_TEXTURE_LOADED", loadSpheres);
            // Create spheres
            // if empty room, trigger tree created event
            if(Object.keys(data[serverMsgComponents.ROOM_STATUS_INFO.SPHERES]).length===0){
                this.sceneEl.systems.tree.isTreeCreated = true;
                document.dispatchEvent(new Event("TREE_CREATED"));
            } else {
                _.each(
                    data[serverMsgComponents.ROOM_STATUS_INFO.SPHERES],
                    (sphereData, sphereId) =>{
                        sphereData[ serverMsgComponents.ROOM_SPHERE_POSITION_UPDATED.SPHERE_ID ] = sphereId;
                        this.handleSphereCreation(sphereData, true,"PER_SPHERE");
                    }
                );
            }
        };

        // texture needs to be loaded before spheres are created
        // window.UI.joinedRoom(roomName);
        window.location.hash = this.region+"-"+roomName;
        this.sceneEl.removeAttribute('palette');
        this.sceneEl.setAttribute('palette', roomSoundbank);
        document.addEventListener("SPHERE_TEXTURE_LOADED", loadSpheres);
        this.sceneEl.components.palette.loadSphereTextures();
    },

    // ENTITY
    handleRemoveEntity: function(data){
        let clientId = data[ serverMsgComponents.ROOM_CLIENT_EXIT.CLIENT_ID ];
        let entity = this.entities[clientId];
        if(entity) {
            entity.parentNode.removeChild(entity);
        }
    },

    handleRemoveAllEntities: function(){
        for (let key in this.entities) {
            let entity = this.entities[key];
            if(entity) {
                entity.parentNode.removeChild(entity);
            }
        }
    },

    createAframeEntity: function(id){
        let entity = document.createElement('a-entity');
        entity.id = id;
        this.entities[id] = entity;
        return entity;
    },

    // Create new player entity representing remote player
    createRemotePlayerEntity: function(id, headsetType="6dof"){
        const playerEntity = this.createAframeEntity(id);
        setComponentProperty(playerEntity, 'smooth-motion', 'amount:3');
        this.sceneEl.appendChild(playerEntity);

        switch (headsetType){
            case "viewer":
                this.addHeadPart(playerEntity, 'head_' + id, 'avatar-head');
                break;
            case "3dof":
                this.addHeadPart(playerEntity, 'head_' + id, 'avatar-head');
                this.add3dofPart(playerEntity, 'right_' + id, 'avatar-hand');
                break;
            case "6dof":
                this.addHeadPart(playerEntity, 'head_' + id, 'avatar-head');
                this.add6dofPart(playerEntity, 'right_' + id, 'avatar-hand');
                this.add6dofPart(playerEntity, 'left_' + id, 'avatar-hand');
                break;
            default:
                console.warn(clientHeadset);
        }

        let triggerEvent = new CustomEvent("PLAYER_ADDED", {
            "detail": {
                "entity": playerEntity
            }
        });
        document.dispatchEvent(triggerEvent);

    },

    // a la carte remote player parts
    addHeadPart: function(playerEntity, id, partType) {
        const entity = this.createAframeEntity(id);
        playerEntity.appendChild(entity);
        setTimeout( () => {
            setComponentProperty(entity, 'position', '0 1.6 0');
            setComponentProperty(entity, 'smooth-motion', 'amount:3');
            setComponentProperty(entity, 'mixin', partType);
        });
    },

    add6dofPart: function(playerEntity, id, partType) {
        const entity = this.createAframeEntity(id);
        playerEntity.appendChild(entity);
        setTimeout( () => {
            setComponentProperty(entity, 'smooth-motion', 'amount:3');
            setComponentProperty(entity, 'mixin', partType);
        });
    },

    add3dofPart: function(playerEntity, id, partType, callback=null) {
        const entity = this.createAframeEntity(id);
        playerEntity.appendChild(entity);
        setTimeout( () => {
            setComponentProperty(entity, 'smooth-motion', 'amount:3');
            setComponentProperty(entity, 'daydream-pointer', "");
            setComponentProperty(entity, 'mixin', partType);
        });
    },

    // Handle client position data from server
    handleUpdatePlayerEntity: function(id, data){

        if(!this.entities[id]) {
            this.createRemotePlayerEntity(id);
        }
        // Update position and rotation of head and hands
        ['head','left', 'right'].forEach((part) => {
            let dataPart;

            if(part == 'head') dataPart = serverMsgComponents.ROOM_CLIENT_COORDS_UPDATED.HEAD;
            else if(part == 'left') dataPart = serverMsgComponents.ROOM_CLIENT_COORDS_UPDATED.LEFT;
            else if(part == 'right') dataPart = serverMsgComponents.ROOM_CLIENT_COORDS_UPDATED.RIGHT;

            const part_id = part + "_" + id;
            let positionData = data[dataPart][clientMsgComponents.REF_COORDINATE_SET.POSITION];
            let rotationData = data[dataPart][clientMsgComponents.REF_COORDINATE_SET.ROTATION];

            if(part === 'head') {
                setComponentProperty(this.entities[id], 'position', {x:positionData.x, y:0, z:positionData.z});
                setComponentProperty(this.entities[part_id], 'position',{x:0, y:positionData.y, z:0});
            } else {
                let playerPos = getComponentProperty(this.entities[id], 'position');
                if(!playerPos) { return; }
                if(!this.entities[part_id]) { return; }
                setComponentProperty(this.entities[part_id], 'position', {
                    x:positionData.x-playerPos.x,
                    y:positionData.y-playerPos.y,
                    z:positionData.z-playerPos.z
                });
            }
            setComponentProperty(this.entities[part_id], 'rotation', stringify(rotationData));
        });
    },

    // Set client position data on server in next tick
    setPlayerData: function(part, component, data){
        if(!this.connected) return;

        if(component === 'position' && part === 'head') {
            let avatar = document.querySelector("#avatar");
            let avatarPosition = avatar.object3D.getWorldPosition();
            this.playerDataCache[part][component].x = avatarPosition.x;
            this.playerDataCache[part][component].y = avatarPosition.y;
            this.playerDataCache[part][component].z = avatarPosition.z;
        } else if(component === 'position') {
            let hand = document.querySelector("#"+part+"Hand");
            let handPosition = hand.object3D.getWorldPosition();
            this.playerDataCache[part][component].x = handPosition.x;
            this.playerDataCache[part][component].y = handPosition.y;
            this.playerDataCache[part][component].z = handPosition.z;
        } else if(component == 'rotation') {
            this.playerDataCache[part][component].x = data.x;
            this.playerDataCache[part][component].y = data.y;
            this.playerDataCache[part][component].z = data.z;
        } else {
            // this.playerData[part].userdata[component] = data;
        }
        this.playerDataDirty = true;
    },


    // SPHERES
    createSphereOnServer: function(entity){
        if(!this.connected) return;

        this._addingSphereEntity = entity;
        let msg = new CreateSphereAtPosition(entity.getAttribute('position'), entity.getAttribute('tone'));
        this.sendMsg(msg);
    },

    setSphereData: function(uuid, component, data){
        if(!this.connected) return;
        if(!uuid) throw new Error("No uuid in setSphereData");

        if(component == 'position'){
            if(!_.isEqual(data, this.sphereCache[uuid].position)) {
                this.sphereCache[uuid].dirty = true;
                // let msg = new SpherePositionUpdate(uuid, data);
                // this.throttledSendMsg(msg)
                this.sphereCache[uuid].position = _.clone(data);
                this.playerDataDirty = true;
            }
        } else if(component == 'ball'){
            if(data.grabbed != this.sphereCache[uuid].grabbed) {
                this.sphereCache[uuid].grabbed = data.grabbed;
                if (data.grabbed) {
                    this.sendMsg(new GrabSphere(uuid));
                } else {
                    this.sendMsg(new ReleaseSphere(uuid));
                }
            }

        } else if(component == 'tone'){
            if(!_.isEqual(data, this.sphereCache[uuid].tone)) {
                let msg = new SphereToneUpdate(uuid, data);
                this.sendMsg(msg);
                this.sphereCache[uuid].tone = _.clone(data);
            }
        }
    },

    removeSphere: function(uuid){
        if(!this.connected) return;

        if(uuid){
            this.sendMsg(new DeleteSphere(uuid));
        }
    },

    sendSphereStrike: function(uuid, velocity){
        if(!this.connected) return;

        if(uuid) {
            this.sendMsg(new StrikeSphere(uuid, velocity));
        }
    },

    handleSphereStruck: function (data) {
        const sphereId = data[ serverMsgComponents.ROOM_SPHERE_STRUCK.SPHERE_ID ];
        const strikeVelocity = data[ serverMsgComponents.ROOM_SPHERE_STRUCK.VELOCITY ];
        let entity = document.querySelector("#sphere_"+sphereId);
        if(!entity) {
            return;
        }
        entity.emit("controllerhit", {"velocity":strikeVelocity, "remote": true});
    },

    handleSphereCreation: function(data, remote, message){
        const sphereId = data[ serverMsgComponents.ROOM_STATUS_INFO.SPHERE_ID ];
        const spherePosition = data[ serverMsgComponents.ROOM_STATUS_INFO.POSITION ];
        const sphereTone = data[ serverMsgComponents.ROOM_STATUS_INFO.TONE ];
        const sphereMeristem = data[ serverMsgComponents.ROOM_STATUS_INFO.MERISTEM ];

        this.sphereCache[sphereId] = {
            grabbed: false,
            connections: [],
            tone: sphereTone
        };

        if(!remote && this._addingSphereEntity){
            // Local client created sphere, getting server generated UUID
            this._addingSphereEntity.id = "sphere_"+sphereId;
            this._addingSphereEntity.setAttribute('copresence','uuid', sphereId);
            delete this._addingSphereEntity;
        } else if(spherePosition){
            // Create entity in tree system
            document.querySelector('a-scene').systems.tree.createSphere({
                id: "sphere_"+sphereId,
                uuid: sphereId,
                position: spherePosition,
                tone: sphereTone,
                meristem : sphereMeristem || false
            });

        }
    },

    handleSphereDeletion: function(data, remote=true){
        const sphereId = data[ serverMsgComponents.ROOM_SPHERE_DELETED.SPHERE_ID ];
        let sphere = document.querySelector("#sphere_"+sphereId);
        document.querySelector('a-scene').systems.tree.deleteSphere(sphere);
    },

    handleSpherePositionUpdate: function(data){
        const sphereId = data[ serverMsgComponents.ROOM_SPHERE_POSITION_UPDATED.SPHERE_ID ];
        const spherePosition = data[ serverMsgComponents.ROOM_STATUS_INFO.POSITION ];

        this.sphereCache[sphereId].position = _.clone(spherePosition);

        let entity = document.querySelector("#sphere_"+sphereId);
        if(!entity) {
            return;
        }
        let ballComponent = entity.getAttribute('ball');
        if(!ballComponent.grabbed) {
            entity.setAttribute('position', spherePosition);
        }
    },

    handleSphereToneUpdate: function(data){
        const sphereId = data[ serverMsgComponents.ROOM_STATUS_INFO.SPHERE_ID ];
        const sphereTone = data[ serverMsgComponents.ROOM_STATUS_INFO.TONE ];

        this.sphereCache[sphereId].tone = _.clone(sphereTone);

        let entity = document.querySelector("#sphere_"+sphereId);
        if(!entity) {
            return;
        }
        entity.setAttribute('tone', sphereTone);

    },

    handleSphereConnectionUpdate: function (data) {
        const sphereId = data[ serverMsgComponents.ROOM_STATUS_INFO.SPHERE_ID ];
        const sphereConnections = data[ serverMsgComponents.ROOM_STATUS_INFO.CONNECTIONS ];
        let connections = _.map(sphereConnections, (c)=> "#sphere_"+c );
        this.sphereCache[sphereId].connections = connections.slice();

        let entity = document.querySelector("#sphere_"+sphereId);
        if(!entity) {
            return;
        }
        let ballComponent = entity.getAttribute('ball');
        if(ballComponent && !ballComponent.grabbed) {
            entity.setAttribute('ball', 'connections', connections);
        }
    },

    handleRemoteJoining: function(data){
        let clientId = data[ serverMsgComponents.ROOM_CLIENT_JOIN.CLIENT_ID ];
        let clientHeadset = data[ serverMsgComponents.ROOM_CLIENT_JOIN.CLIENT_HEADSET_TYPE ];

        // checks if controllers exists, delete / append based on interaction type
        let addPointer = () => {

            let right = document.querySelector("#right_" + clientId);
            let left = document.querySelector("#left_" + clientId);
            if(right && left){
                let person = right.parentNode;
                switch (clientHeadset){
                    case "viewer":
                        person.removeChild(right);
                        person.removeChild(left);
                        break;
                    case "3dof":
                        right.setAttribute("daydream-pointer", "");
                        person.removeChild(left);
                        break;
                    case "6dof":
                        break;
                    default:
                }

            } else {
                requestAnimationFrame(addPointer);
            }
        };
        addPointer();
    },
});


///
/// ------------------------------- COMPONENT --------------------------------------
///

AFRAME.registerComponent('copresence', {
    uuidset: false,
    schema: {
        components: {default: ['position','ball', 'tone'], type: 'array'},
        decimals: {default: 3},
        playerpart: {default: undefined, type: 'string'},
        uuid: {default: undefined, type: 'string'}
    },

    init: function(){

        const system = this.el.sceneEl.systems["copresence-server"];
        const player = document.querySelector("#player");
        const avatar = document.querySelector("#avatar");
        if (!this.data.components.length) return;

        // sphere is created locally, need to create one for the server
        if(!this.data.uuid && !this.data.playerpart){
            system.createSphereOnServer(this.el);
        } else if(this.data.uuid){
            this.uuidset = true;
        }

        let updatePlayerData = (evt) => {
            this.data.components.forEach( (component) => {
                // Check the component is in the list of watched components
                if (evt.detail.name === component) {
                    let d = evt.detail.newData;
                    // Round data
                    if (this.data.decimals !== false) {
                        if (_.isObject(d)) {
                            d = _.mapObject(d, (n) => {
                                if (_.isNumber(n)) {
                                    return Math.round(n * Math.pow(10, this.data.decimals)) / Math.pow(10, this.data.decimals);
                                }
                                return n;
                            });
                        }

                        if (_.isNumber(d)) {
                            d = Math.round(d * Math.pow(10, this.data.decimals)) / Math.pow(10, this.data.decimals);
                        }
                    }

                    // Let the system know about the data change
                    if (this.data.playerpart) {
                        system.setPlayerData(this.data.playerpart, component, d);
                    } else if(this.data.uuid){
                        system.setSphereData(this.data.uuid, component, d);
                    }
                }
            });
        };

        // Listen for component changes (position, etc)
        this.el.addEventListener("componentchanged", (evt)=>{
            if(_.isEqual(evt.detail.newData, evt.detail.oldData)) { return; }

            updatePlayerData(evt);

        });

        player.addEventListener("componentchanged", (evt)=>{
            // if data has updated and if it's avatar
            if(_.isEqual(evt.detail.newData, evt.detail.oldData)) { return; }
            if(!_.isEqual(avatar, this.el)) { return; }
            updatePlayerData(evt);
        });

        this.el.addEventListener('controllerhit', (evt)=>{
            if(!evt.detail.remote) {
                let system = this.el.sceneEl.systems["copresence-server"];
                system.sendSphereStrike(this.data.uuid, evt.detail.velocity);
            }
        });
    },

    update: function(){
        // Check if UUID is being set for the first time, if thats the case, send the sphere data
        if(!this.uuidset && this.data.uuid){
            this.uuidset = true;

            let system = this.el.sceneEl.systems["copresence-server"];
            system.setSphereData(this.data.uuid, 'ball', this.el.getAttribute("ball"));
        }
    },

    remove: function(){
        let system = this.el.sceneEl.systems["copresence-server"];
        if(this.data.uuid) {
            system.removeSphere(this.data.uuid);
        }
    }
});
