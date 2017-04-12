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

import roomStateConstants from './room-state-constants';

// setup room
const startRoomSetupRequestAction = ( roomName ) => {
    let type = roomStateConstants.EVENT_TYPES.START_ROOM_SETUP;
    return { type, roomName };
};

const notifyStartRoomSetupSuccessRequestAction = ( roomName ) => {
    let type = roomStateConstants.EVENT_TYPES.START_ROOM_SETUP_SUCCESS;
    return { type, roomName };
};

const notifyStartRoomSetupFailureRequestAction = ( roomName ) => {
    let type = roomStateConstants.EVENT_TYPES.START_ROOM_SETUP_FAILURE;
    return { type, roomName };
};

// initialise room content
const initRoomContentRequestAction = ( roomName ) => {
    let type = roomStateConstants.EVENT_TYPES.INIT_ROOM_CONTENT;
    return { type, roomName };
};

const notifyInitRoomContentSuccessRequestAction = ( roomName ) => {
    let type = roomStateConstants.EVENT_TYPES.INIT_ROOM_CONTENT_SUCCESS;
    return { type, roomName };
};

const notifyInitRoomContentFailureRequestAction = ( roomName ) => {
    let type = roomStateConstants.EVENT_TYPES.INIT_ROOM_CONTENT_FAILURE;
    return { type, roomName };
};

// start a heartbeat for a room
const startRoomHeartbeatRequestAction = ( roomName ) => {
    let type = roomStateConstants.EVENT_TYPES.START_HEARTBEAT;
    return { type, roomName };
};

const notifyStartRoomHeartbeatSuccessRequestAction = ( roomName ) => {
    let type = roomStateConstants.EVENT_TYPES.START_HEARTBEAT_SUCCESS;
    return { type, roomName };
};

const notifyStartRoomHeartbeatFailureRequestAction = ( roomName ) => {
    let type = roomStateConstants.EVENT_TYPES.START_HEARTBEAT_FAILURE;
    return { type, roomName };
};

// processing the queue for a newly-inited room
const startProcessingQueueRequestAction = ( roomName ) => {
    let type = roomStateConstants.EVENT_TYPES.PROCESS_QUEUE;
    return { type, roomName };
};

const notifyProcessQueueSuccessRequestAction = ( roomName ) => {
    let type = roomStateConstants.EVENT_TYPES.PROCESS_QUEUE_SUCCESS;
    return { type, roomName };
};

const notifyProcessQueueFailureRequestAction = ( roomName ) => {
    let type = roomStateConstants.EVENT_TYPES.PROCESS_QUEUE_FAILURE;
    return { type, roomName };
};

// mark a room full or not-full
const setRoomFullRequestAction = ( roomName ) => {
    let type = roomStateConstants.EVENT_TYPES.SET_ROOM_FULL;
    return { type, roomName };
};

const unsetRoomFullRequestAction = ( roomName ) => {
    let type = roomStateConstants.EVENT_TYPES.UNSET_ROOM_FULL;
    return { type, roomName };
};

// check if a room's empty when a client leaves
const checkIfRoomEmptyRequestAction = ( roomName ) => {
    let type = roomStateConstants.EVENT_TYPES.CHECK_IF_EMPTY;
    return { type, roomName };
};

const notifyRoomEmptyCheckSuccessRequestAction = ( roomName ) => {
    let type = roomStateConstants.EVENT_TYPES.EMPTY_CHECK_SUCCESS;
    return { type, roomName };
};

const notifyRoomEmptyCheckFailureRequestAction = ( roomName ) => {
    let type = roomStateConstants.EVENT_TYPES.EMPTY_CHECK_FAILURE;
    return { type, roomName };
};

// stop a heartbeat for a room
const stopHeartbeatForRoomRequestAction = ( roomName ) => {
    let type = roomStateConstants.EVENT_TYPES.STOP_HEARTBEAT;
    return { type, roomName };
};

const notifyStopHeartbeatSuccessRequestAction = ( roomName ) => {
    let type = roomStateConstants.EVENT_TYPES.STOP_HEARTBEAT_SUCCESS;
    return { type, roomName };
};

const notifyStopHeartbeatFailureRequestAction = ( roomName ) => {
    let type = roomStateConstants.EVENT_TYPES.STOP_HEARTBEAT_FAILURE;
    return { type, roomName };
};

// close a room so it can be re-opened
const closeRoomRequestAction = ( roomName ) => {
    let type = roomStateConstants.EVENT_TYPES.CLOSE;
    return { type, roomName };
};

export default {

    // setup a room on request
    startRoomSetupRequestAction,
    notifyStartRoomSetupSuccessRequestAction,
    notifyStartRoomSetupFailureRequestAction,

    // initialise room content
    initRoomContentRequestAction,
    notifyInitRoomContentSuccessRequestAction,
    notifyInitRoomContentFailureRequestAction,

    // start a heartbeat for a room
    startRoomHeartbeatRequestAction,
    notifyStartRoomHeartbeatSuccessRequestAction,
    notifyStartRoomHeartbeatFailureRequestAction,

    // processing the queue for a newly-inited room
    startProcessingQueueRequestAction,
    notifyProcessQueueSuccessRequestAction,
    notifyProcessQueueFailureRequestAction,

    // mark a room full or not-full
    setRoomFullRequestAction,
    unsetRoomFullRequestAction,

    // check if a room's empty when a client leaves
    checkIfRoomEmptyRequestAction,
    notifyRoomEmptyCheckSuccessRequestAction,
    notifyRoomEmptyCheckFailureRequestAction,

    // stop a heartbeat for a room
    stopHeartbeatForRoomRequestAction,
    notifyStopHeartbeatSuccessRequestAction,
    notifyStopHeartbeatFailureRequestAction,

    // close a room so it can be re-opened
    closeRoomRequestAction

};
