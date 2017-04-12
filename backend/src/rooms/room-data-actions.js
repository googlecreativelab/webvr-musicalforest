/*
 * Copyright 2017 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import constants from './room-data-constants';

/*******************************************************************************
* ADD/REMOVE CLIENTS TO/FROM ROOMS
*******************************************************************************/

const addWebsocketToQueueForRoomRequestAction = ( wsId, roomName ) => {
    let type = constants.ACTION_TYPES.ADD_WEBSOCKET_TO_QUEUE_FOR_ROOM;
    return { type, wsId, roomName };
};

const removeWebsocketFromQueueForRoomRequestAction = ( wsId, roomName ) => {
    let type = constants.ACTION_TYPES.REMOVE_WEBSOCKET_FROM_QUEUE_FOR_ROOM;
    return { type, wsId, roomName };
};

const addLocalClientToRoomRequestAction = ( clientId, clientHeadsetType, roomName ) => {
    let type = constants.ACTION_TYPES.ADD_LOCAL_CLIENT_TO_ROOM;
    return { type, clientId, clientHeadsetType, roomName };
};

const removeLocalClientFromRoomRequestAction = ( clientId, roomName ) => {
    let type = constants.ACTION_TYPES.REMOVE_LOCAL_CLIENT_FROM_ROOM;
    return { type, clientId, roomName };
};

/*******************************************************************************
* ROOM SETUP/MAINTAIN/TEARDOWN
*******************************************************************************/

const setLastHeartbeatCountForRoomRequestAction = ( count, roomName ) => {
    let type = constants.ACTION_TYPES.UPDATE_LAST_HEARTBEAT_FOR_ROOM;
    return { type, count, roomName };
};

const setHeartbeatTaskForRoomRequestAction = ( heartbeatTask, roomName ) => {
    let type = constants.ACTION_TYPES.SET_HEARTBEAT_TASK_FOR_ROOM;
    return { type, heartbeatTask, roomName };
};

const removeHeartbeatTaskForRoomRequestAction = ( roomName ) => {
    let type = constants.ACTION_TYPES.REMOVE_HEARTBEAT_TASK_FOR_ROOM;
    return { type, roomName };
};

const cancelHeartbeatTaskForRoomRequestAction = ( roomName ) => {
    let type = constants.ACTION_TYPES.CANCEL_HEARTBEAT_TASK_FOR_ROOM;
    return { type, roomName };
};

const checkForEmptyRoomRequestAction = ( roomName ) => {
    let type = constants.ACTION_TYPES.CHECK_FOR_EMPTY_ROOM;
    return { type, roomName };
};

/*******************************************************************************
* SPHERE STATE ACTIONS
*******************************************************************************/

const addSphereOfToneAtPositionInRoomRequestAction = ( newSphereId, tone, position, roomName ) => {
    let type = constants.ACTION_TYPES.ADD_SPHERE_OF_TONE_AT_POSITION_IN_ROOM;
    return { type, newSphereId, tone, position, roomName };
};

const createHoldOnSphereForClientInRoomRequestAction = ( sphereId, clientId, roomName ) => {
    let type = constants.ACTION_TYPES.CREATE_HOLD_ON_SPHERE_FOR_CLIENT_IN_ROOM;
    return { type, sphereId, clientId, roomName };
};

const setHoldTimeoutTaskForSphereInRoomRequestAction = ( timeoutTask, sphereId, roomName ) => {
    let type = constants.ACTION_TYPES.SET_HOLD_TIMEOUT_TASK_FOR_SPHERE_IN_ROOM;
    return { type, timeoutTask, sphereId, roomName };
};

const deleteHoldTimeoutTaskForSphereInRoomRequestAction = ( sphereId, roomName ) => {
    let type = constants.ACTION_TYPES.DELETE_HOLD_TIMEOUT_TASK_FOR_SPHERE_IN_ROOM;
    return { type, sphereId, roomName };
};

const setPositionForSphereInRoomRequestAction = ( position, sphereId, roomName ) => {
    let type = constants.ACTION_TYPES.SET_POSITION_FOR_SPHERE_IN_ROOM;
    return { type, position, sphereId, roomName };
};

const setToneForSphereInRoomRequestAction = ( tone, sphereId, roomName ) => {
    let type = constants.ACTION_TYPES.SET_TONE_FOR_SPHERE_IN_ROOM;
    return { type, tone, sphereId, roomName };
};

const setConnectionsForSphereInRoomRequestAction = ( connections, sphereId, roomName ) => {
    let type = constants.ACTION_TYPES.SET_CONNECTIONS_FOR_SPHERE_IN_ROOM;
    return { type, connections, sphereId, roomName };
};

const removeHoldOnSphereForClientInRoomRequestAction = ( sphereId, clientId, roomName ) => {
    let type = constants.ACTION_TYPES.REMOVE_HOLD_ON_SPHERE_FOR_CLIENT_IN_ROOM;
    return { type, sphereId, clientId, roomName };
};

const deleteSphereFromRoomRequestAction = ( sphereId, roomName ) => {
    let type = constants.ACTION_TYPES.DELETE_SPHERE_FROM_ROOM;
    return { type, sphereId, roomName };
};

/*******************************************************************************
* PUBLISH MESSAGE
*******************************************************************************/

const publishMessageToRoomRequestAction = ( message, roomName ) => {
    let type = constants.ACTION_TYPES.PUBLISH_MESSAGE_TO_ROOM;
    return { type, message, roomName };
};

export default {

    // add/remove clients to/from rooms
    addWebsocketToQueueForRoomRequestAction,
    removeWebsocketFromQueueForRoomRequestAction,
    addLocalClientToRoomRequestAction,
    removeLocalClientFromRoomRequestAction,

    // room setup/maintain/teardown
    setLastHeartbeatCountForRoomRequestAction,
    setHeartbeatTaskForRoomRequestAction,
    removeHeartbeatTaskForRoomRequestAction,
    cancelHeartbeatTaskForRoomRequestAction,
    checkForEmptyRoomRequestAction,

    // sphere state actions
    addSphereOfToneAtPositionInRoomRequestAction,
    createHoldOnSphereForClientInRoomRequestAction,
    setHoldTimeoutTaskForSphereInRoomRequestAction,
    deleteHoldTimeoutTaskForSphereInRoomRequestAction,
    setPositionForSphereInRoomRequestAction,
    setToneForSphereInRoomRequestAction,
    setConnectionsForSphereInRoomRequestAction,
    removeHoldOnSphereForClientInRoomRequestAction,
    deleteSphereFromRoomRequestAction,

    // publish message saga action
    publishMessageToRoomRequestAction

};
