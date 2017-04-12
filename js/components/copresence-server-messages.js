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

import messageConstants from '../../backend/src/messages/message-constants';

const clientMsgTypes = messageConstants.INCOMING_MESSAGE_TYPES;
const clientMsgComponents = messageConstants.INCOMING_MESSAGE_COMPONENTS;
const serverMsgComponents = messageConstants.OUTGOING_MESSAGE_COMPONENTS;


class Message {
  constructor(type){
    this.data = {};
    this.type = type;
  }

  serialize(){
    let msg = JSON.stringify({
      [ clientMsgComponents.ALL_MESSAGES.TYPE ]: this.type,
      [ clientMsgComponents.ALL_MESSAGES.DATA ]: this.data
    });
    return msg;
  }
}


export class ExitRoom extends  Message {
  constructor(){
    super( clientMsgTypes.EXIT_ROOM );
  }
}


export class RoomClientPositionUpdate extends Message {
  constructor(playerData, spheresData){
    super( clientMsgTypes.UPDATE_CLIENT_COORDS );

    const clientParts = clientMsgComponents.UPDATE_CLIENT_COORDS;
    const coordParts = clientMsgComponents.REF_COORDINATE_SET;

    this.data[clientParts.HEAD] = {};
    this.data[clientParts.LEFT] = {};
    this.data[clientParts.RIGHT] = {};

    this.data[clientParts.HEAD][coordParts.POSITION] = playerData['head']['position'];
    this.data[clientParts.HEAD][coordParts.ROTATION] = playerData['head']['rotation'];
    this.data[clientParts.LEFT][coordParts.POSITION] = playerData['left']['position'];
    this.data[clientParts.LEFT][coordParts.ROTATION] = playerData['left']['rotation'];
    this.data[clientParts.RIGHT][coordParts.POSITION] = playerData['right']['position'];
    this.data[clientParts.RIGHT][coordParts.ROTATION] = playerData['right']['rotation'];

    this.data[clientParts.SPHERES] = []
    for(let sphere of spheresData){
      let s = {};
      s[clientMsgComponents.UPDATE_CLIENT_COORDS.SPHERE_ID] = sphere.id;
      s[clientMsgComponents.UPDATE_CLIENT_COORDS.SPHERE_POSITION] = sphere.position;
      this.data[clientParts.SPHERES].push(s)
    }
  }
}


export class SpherePositionUpdate extends Message {
  constructor(uuid, position){
    super( clientMsgTypes.UPDATE_SPHERE_POSITION );
    this.data[ clientMsgComponents.UPDATE_SPHERE_POSITION.SPHERE_ID ] = uuid;
    this.data[ clientMsgComponents.UPDATE_SPHERE_POSITION.POSITION ] = position;
  }
}

export class SphereToneUpdate extends Message {
  constructor(uuid, tone){
    super( clientMsgTypes.SET_SPHERE_TONE );
    this.data[ clientMsgComponents.SET_SPHERE_TONE.SPHERE_ID ] = uuid;
    this.data[ clientMsgComponents.SET_SPHERE_TONE.TONE ] = tone;
  }
}

export class SphereConnectionUpdate extends Message {
  constructor(uuid, connections){
    super( clientMsgTypes.SET_SPHERE_CONNECTIONS );
    this.data[ clientMsgComponents.SET_SPHERE_CONNECTIONS.SPHERE_ID ] = uuid;
    this.data[ clientMsgComponents.SET_SPHERE_CONNECTIONS.CONNECTIONS ] =  connections
  }
}

export class GrabSphere extends Message {
  constructor(uuid){
    super( clientMsgTypes.GRAB_SPHERE );
    this.data[ clientMsgComponents.GRAB_SPHERE.SPHERE_ID ] = uuid;
  }
}

export class ReleaseSphere extends Message {
  constructor(uuid){
    super( clientMsgTypes.RELEASE_SPHERE );
    this.data[ clientMsgComponents.RELEASE_SPHERE.SPHERE_ID ] = uuid;
  }
}

export class StrikeSphere extends Message {
  constructor(uuid, velocity=1){
    super( clientMsgTypes.STRIKE_SPHERE );
    this.data[ clientMsgComponents.STRIKE_SPHERE.SPHERE_ID ] = uuid;
    this.data[ clientMsgComponents.STRIKE_SPHERE.VELOCITY ] = velocity;
  }
}

export class DeleteSphere extends Message {
  constructor(uuid){
    super( clientMsgTypes.DELETE_SPHERE );
    this.data[ clientMsgComponents.DELETE_SPHERE.SPHERE_ID ] = uuid;
  }
}


export class CreateSphereAtPosition extends Message {
  constructor(position, tone=1){
    super( clientMsgTypes.CREATE_SPHERE_OF_TONE_AT_POSITION );
    this.data[ clientMsgComponents.CREATE_SPHERE_OF_TONE_AT_POSITION.POSITION ] = position;
    this.data[ clientMsgComponents.CREATE_SPHERE_OF_TONE_AT_POSITION.TONE ] = tone;
  }
}
