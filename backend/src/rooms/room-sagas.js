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

import { delay, takeEvery, takeLatest }     from 'redux-saga';
import { call, cancel, cancelled, put, fork, spawn, select }   from 'redux-saga/effects';

import uuid     from 'uuid';

import { logger }                           from '../logger';
import { messageHandler }                   from '../messages';
import { serverActions, serverConstants }   from '../server';
import { sphereConstants }                  from '../spheres';

import {
    makeWsReplyMessage,
    makeWsBroadcastMessage,
    sendWsMessageWithLogger,
    sendWsErrorWithLogger
} from '../utils/websocket-utils';

import config                       from '../config';
import { sagaUtils }                from '../utils';

import messageConstants             from '../messages/message-constants';

import roomDataActions              from './room-data-actions';
import roomDataConstants            from './room-data-constants';
import roomNames                    from './room-names';

import roomStateActions             from './room-state-actions';
import roomStateConstants           from './room-state-constants';
import roomStateUtils               from './room-state-utils';

const incomingMsgComponents = messageConstants.INCOMING_MESSAGE_COMPONENTS;
const outgoingMsgComponents = messageConstants.OUTGOING_MESSAGE_COMPONENTS;

/*******************************************************************************
* START SETTING UP THE ROOM
*******************************************************************************/

const startRoomSetup = function* ( action ) {

    let correctState = yield roomStateUtils.roomIsCurrentlyInState(
        action.roomName,
        roomStateConstants.STATES.STARTING_ROOM_SETUP
    );

    if( correctState !== true ) {
        logger.warn( `not doing startRoomSetup, room ${action.roomName} not in state STARTING_ROOM_SETUP` );
        return;
    }

    // tell the state machine this worked OK
    yield put( roomStateActions.notifyStartRoomSetupSuccessRequestAction( action.roomName ) );

};

const handleStartRoomSetupSuccess = function* ( action ) {

    let correctState = yield roomStateUtils.roomIsCurrentlyInState(
        action.roomName,
        roomStateConstants.STATES.ROOM_SETUP_STARTED
    );

    if( correctState !== true ) {
        logger.warn( `not doing handleStartRoomSetupSuccess, room ${action.roomName} not in state ROOM_SETUP_STARTED` );
        return;
    }

    // initialise the room state
    yield put( roomStateActions.initRoomContentRequestAction( action.roomName ) );

    // check if it was initialised correctly
    let roomData = yield select( ( state ) => { return state.roomDataReducer.rooms[ action.roomName ]; } );

    // tell the state machine what happened
    if( typeof roomData.content === 'object' ) {
        yield put( roomStateActions.notifyInitRoomContentSuccessRequestAction( action.roomName ) );
    }
    else {
        yield put( roomStateActions.notifyInitRoomContentFailureRequestAction( action.roomName ) );
    }
};

/*******************************************************************************
* HANDLE SUCCESSFUL ROOM STATE INIT
*******************************************************************************/

const handleInitRoomContentSuccess = function* ( action ) {

    let correctState = yield roomStateUtils.roomIsCurrentlyInState(
        action.roomName,
        roomStateConstants.STATES.ROOM_CONTENT_INITED
    );

    if( correctState !== true ) {
        logger.warn( `not doing handleInitRoomContentSuccess, room ${action.roomName} not in state ROOM_CONTENT_INITED` );
        return;
    }

    // this is possibly an unnecessary state change(!), but it's explicit
    yield put( roomStateActions.startRoomHeartbeatRequestAction( action.roomName ) );
};

/*******************************************************************************
* START HEARTBEAT FOR ROOM
*******************************************************************************/

const startHeartbeatForRoom = function* ( action ) {

    let correctState = yield roomStateUtils.roomIsCurrentlyInState(
        action.roomName,
        roomStateConstants.STATES.STARTING_HEARTBEAT
    );

    if( correctState !== true ) {
        logger.warn( `not doing startHeartbeatForRoom, room ${action.roomName} not in state ${acceptableStates}` );
        return;
    }

    let { roomData, roomState } = yield select(
        ( state ) => {
            return {
                roomData:   state.roomDataReducer.rooms,
                roomState:  state.roomStateReducer
            };
        }
    );

    let lastHeartbeat, heartbeatCount;

    try {

        lastHeartbeat   = roomData[ action.roomName ].content.lastHeartbeat;

        let roomStatus  = roomState.rooms[ action.roomName ].status;

        logger.trace( `starting heartbeat for new room: ${action.roomName}` );
    }
    catch( error ) {
        logger.error( `error trying to start heartbeat for room '${action.roomName}': ${error.message}` );
        yield put( roomStateActions.notifyStartRoomHeartbeatFailureRequestAction( action.roomName ) );
        return;
    }

    // fork a heartbeat task
    let heartbeatTask = yield fork( heartbeatTaskFunction, action.roomName );

    // set it in state
    yield put( roomDataActions.setHeartbeatTaskForRoomRequestAction( heartbeatTask, action.roomName ) );

    // check it got there
    roomData = yield select( ( state ) => { return state.roomDataReducer.rooms; } );

    // tell the state-machine for the room what's happening
    if( roomData[ action.roomName ].tasks.heartbeat === heartbeatTask ) {
        yield put( roomStateActions.notifyStartRoomHeartbeatSuccessRequestAction( action.roomName ) );
    }
    else {
        yield put( roomStateActions.notifyStartRoomHeartbeatFailureRequestAction( action.roomName ) );
    }

    return;
};

const heartbeatTaskFunction = function* ( roomName ) {

    try {

        let lastHeartbeatCount = 0;

        while( true ) {
            // get the latest status
            let roomData = yield select( ( state ) => { return state.roomDataReducer.rooms; } );

            // if the state's been cleared, stop sending
            if( !roomData[ roomName ] ) {
                logger.trace( `state for room ${roomName} has been cleared, finishing heartbeat` );
                break;
            }

            // update the second count
            let secondCount = ( lastHeartbeatCount * config.roomHeartbeatDelayInMs ) / 1000 ;

            // create a heartbeat message
            let heartbeatData = {
                [ outgoingMsgComponents.ROOM_HEARTBEAT.COUNT ]:     lastHeartbeatCount,
                [ outgoingMsgComponents.ROOM_HEARTBEAT.SECONDS ]:   secondCount
            };

            let heartbeatMessage = makeWsBroadcastMessage(
                config.serverId,
                messageConstants.OUTGOING_MESSAGE_TYPES.ROOM_HEARTBEAT,
                heartbeatData
            );

            // set the latest count in the state
            yield put(
                roomDataActions.setLastHeartbeatCountForRoomRequestAction(
                    lastHeartbeatCount,
                    roomName
                )
            );

            // publish to room
            yield put( roomDataActions.publishMessageToRoomRequestAction( heartbeatMessage, roomName ) );

            // update the heartbeat count
            lastHeartbeatCount = lastHeartbeatCount + 1;

            // pause until next heartbeat
            yield delay( config.roomHeartbeatDelayInMs );
        }
    }
    finally {
        if( yield cancelled() ) {
            logger.trace( `cancelling heartbeat task for room ${roomName} on request` );
            yield put( roomDataActions.removeHeartbeatTaskForRoomRequestAction( roomName ) );
            yield put( roomStateActions.notifyStopHeartbeatSuccessRequestAction( roomName ) );
        }
    }
};

/*******************************************************************************
* ADD QUEUED WEBSOCKETS INTO ROOM AFTER SETUP
*******************************************************************************/

const startProcessingQueue = function* ( action ) {

    let correctState = yield roomStateUtils.roomIsCurrentlyInState(
        action.roomName,
        roomStateConstants.STATES.HEARTBEAT_STARTED
    );

    if( correctState !== true ) {
        logger.warn( `not doing startProcessingQueue, room ${action.roomName} not in state ${acceptableStates}` );
        return;
    }

    // tell the state machine the queue's being processed
    yield put( roomStateActions.startProcessingQueueRequestAction( action.roomName ) );

    let { serverState, roomData } = yield select(
        ( state ) => {
            return {
                serverState:    state.serverReducer,
                roomData:       state.roomDataReducer.rooms
            };
        }
    );

    logger.trace( `processing ${roomData[ action.roomName ].queue.length} websockets in queue for room ${action.roomName}` );

    // if all the local clients in the queue left before the setup completed
    if( roomData[ action.roomName ].queue.length < 1 ) {
        logger.trace( `no clients left in queue for room ${action.roomName}, closing down room` );
        // start closing down the room on this server
        yield put( roomStateActions.checkIfRoomEmptyRequestAction( action.roomName ) );
        return;
    }

    for( let clientId of roomData[ action.roomName ].queue ) {

        let clientHeadsetType = serverState.websockets[ clientId ].headsetType;
        yield put( roomDataActions.addLocalClientToRoomRequestAction( clientId, clientHeadsetType, action.roomName ) );
        yield put( roomDataActions.removeWebsocketFromQueueForRoomRequestAction( clientId, action.roomName ) );
    }

    // tell the state machine the queue's been processed
    yield put( roomStateActions.notifyProcessQueueSuccessRequestAction( action.roomName ) );

};

const handleProcessQueueSuccess = function* ( action ) {

    let correctState = yield roomStateUtils.roomIsCurrentlyInState(
        action.roomName,
        roomStateConstants.STATES.READY
    );

    if( correctState !== true ) {
        logger.warn( `not doing handleProcessQueueSuccess, room ${action.roomName} not in state READY` );
        return;
    }

    let roomData = yield select( ( state ) => { return state.roomDataReducer.rooms; } );

    // if the room's full
    if( Object.keys( roomData[ action.roomName ].content.clients ).length >= config.maxClientsPerRoom ) {
        // tell the state machine about it
        yield put( roomStateActions.setRoomFullRequestAction( action.roomName ) );
    }
};

/*******************************************************************************
* CONNECT A WEBSOCKET CONNECTION TO A SPECIFIED ROOM
*******************************************************************************/

const connectWebsocketToRoom = function* ( action ) {

    // belt & braces
    if( roomNames.indexOf( action.ws.requestedRoomName ) < 0 ) {

        let noSuchRoomMessage = makeWsReplyMessage(
            config.serverId,
            messageConstants.ERROR_TYPES.NO_SUCH_ROOM,
            { roomName }
        );

        sendWsMessageWithLogger( action.ws, noSuchRoomMessage, logger );

        return;
    }

    logger.trace(
        `joining ${action.ws.headsetType} websocket ${action.ws.id} ` +
        `to room '${action.ws.requestedRoomName}'`
    );

    let roomName = action.ws.requestedRoomName;

    // get the current state for chosen room
    let { roomData, roomState } = yield select(
        ( state ) => {
            return {
                roomData:   state.roomDataReducer.rooms[ roomName ],
                roomState:  state.roomStateReducer.rooms[ roomName ]
            };
        }
    );

    // work out what FSM state it's in
    switch( roomState.status ) {

        // idle, waiting for setup
        case roomStateConstants.STATES.INIT:

            // kick off the room setup
            yield put( roomStateActions.initRoomContentRequestAction( roomName ) );

            // check if it was initialised correctly
            let roomData = yield select( ( state ) => { return state.roomDataReducer.rooms[ roomName ]; } );

            // tell the state machine what happened
            if( typeof roomData.content === 'object' ) {
                yield put( roomStateActions.notifyInitRoomContentSuccessRequestAction( roomName ) );
            }
            else {
                yield put( roomStateActions.notifyInitRoomContentFailureRequestAction( roomName ) );
                return;
            }

            // put the connection in the queue for the room
            yield put(
                roomDataActions.addWebsocketToQueueForRoomRequestAction(
                    action.ws.id,
                    roomName
                )
            );

            break;

        // in process of being set up
        case roomStateConstants.STATES.INITING_ROOM_CONTENT:
        case roomStateConstants.STATES.ROOM_CONTENT_INITED:
        case roomStateConstants.STATES.STARTING_HEARTBEAT:
        case roomStateConstants.STATES.HEARTBEAT_STARTED:

            // check if there's space in the queue
            if( roomData.queue.length >= config.maxClientsPerRoom ) {

                let queueFullMessage = makeWsReplyMessage(
                    config.serverId,
                    messageConstants.ERROR_TYPES.ROOM_QUEUE_FULL,
                    { roomName }
                );

                sendWsMessageWithLogger( action.ws, queueFullMessage, logger );
                logger.warn( `closing client ${action.ws.id}: queue for ${roomName} is full` );
                action.ws.close();

                return;
            }

            // put the connection in the queue for the room
            yield put(
                roomDataActions.addWebsocketToQueueForRoomRequestAction(
                    action.ws.id,
                    roomName
                )
            );

            break;

        // full
        case roomStateConstants.STATES.ROOM_FULL:

            let roomFullMessage = makeWsReplyMessage(
                config.serverId,
                messageConstants.ERROR_TYPES.BUSY_TRY_AGAIN,
                {}
            );

            sendWsMessageWithLogger( action.ws, roomFullMessage, logger );
            logger.warn( `closing client ${action.ws.id}: queue for ${roomName} is full` );
            action.ws.close();

            return;

        // up and running
        case roomStateConstants.STATES.READY:

            // add the connection to the room
            yield put(
                roomDataActions.addLocalClientToRoomRequestAction(
                    action.ws.id,
                    action.ws.headsetType,
                    roomName
                )
            );

            break;

        // anything else
        default:

            logger.warn( `tried to join ${action.ws.id} to room ${roomName} while in state ${roomState.status}` );

            let roomUnavailableMessage = makeWsReplyMessage(
                config.serverId,
                messageConstants.ERROR_TYPES.ROOM_UNAVAILABLE,
                { roomName }
            );

            sendWsMessageWithLogger( action.ws, roomUnavailableMessage, logger );

            break;
    }
};

/*******************************************************************************
* ADD CLIENT TO ROOM DATA AND INFORM EXISTING CLIENTS IT'S JOINED
*******************************************************************************/

// action: { clientId, roomName }
const handleAddLocalClientToRoom = function* ( action ) {

    let { serverState, roomState, roomData } = yield select(
        ( state ) => {
            return {
                serverState:    state.serverReducer,
                roomState:      state.roomStateReducer,
                roomData:       state.roomDataReducer.rooms
            };
        }
    );

    if( roomState.rooms[ action.roomName ].status === roomStateConstants.STATES.READY ) {
        // if the room's full
        if( Object.keys( roomData[ action.roomName ].content.clients ).length >= config.maxClientsPerRoom ) {
            // tell the state machine about it
            yield put( roomStateActions.setRoomFullRequestAction( action.roomName ) );
        }
    }

    let ws = serverState.websockets[ action.clientId ];
    if( typeof ws === 'undefined' ) {
        logger.warn( `error trying to sendRoomInfoToClient: no websocket object for ws id ${action.clientId}` );
        return;
    }

    let roomName = action.roomName;
    if( typeof roomName === 'undefined' ) {
        logger.warn( `error trying to sendRoomInfoToClient: no currentRoom for ws id ${ws.id}` );
        sendWsErrorWithLogger( config.serverId, ws, messageConstants.ERROR_TYPES.SYSTEM_ERROR, roomName );
        return;
    }

    let roomClients = roomData[ roomName ].content.clients;

    let clients = {};

    // copy of client list, without the connecting client
    Object.keys( roomClients ).filter(
        ( clientId ) => {
            return clientId !== action.clientId;
        }
    )
    .forEach(
        ( clientId ) => {
            const headsetType = roomClients[ clientId ].headsetType;

            if( typeof clients[ headsetType ] === 'undefined' ) {
                clients[ headsetType ] = []
            }
            clients[ headsetType ].push( clientId );
        }
    );

    // get copy of spheres from room state
    let spheres = JSON.parse( JSON.stringify( roomData[ roomName ].content.spheres ) );

    // add to client message
    let roomInfo = {
        [ outgoingMsgComponents.ROOM_STATUS_INFO.ROOM_NAME ]:   roomName,
        [ outgoingMsgComponents.ROOM_STATUS_INFO.SOUNDBANK ]:   roomData[ roomName ].content.soundbank,
        [ outgoingMsgComponents.ROOM_STATUS_INFO.CLIENTS ]:     clients,
        [ outgoingMsgComponents.ROOM_STATUS_INFO.SPHERES ]:     spheres
    };

    let roomInfoMessage = makeWsReplyMessage(
        config.serverId,
        messageConstants.OUTGOING_MESSAGE_TYPES.ROOM_STATUS_INFO,
        roomInfo
    );

    try {
        sendWsMessageWithLogger( ws, roomInfoMessage, logger );
    }
    catch( error ) {
        logger.trace( `error sending room info message to client ${ws.id}`, error.message );
    }

    // tell all other clients in the room that this one has joined
    let clientData = {
        [ outgoingMsgComponents.ROOM_CLIENT_JOIN.CLIENT_ID ]: ws.id,
        [ outgoingMsgComponents.ROOM_CLIENT_JOIN.CLIENT_HEADSET_TYPE ]: ws.headsetType
    };

    let clientJoinMessage = makeWsBroadcastMessage(
        config.serverId,
        messageConstants.OUTGOING_MESSAGE_TYPES.ROOM_CLIENT_JOIN,
        clientData
    );

    yield put( roomDataActions.publishMessageToRoomRequestAction( clientJoinMessage, roomName ) );

    // start off a client inactivty check, to eject the client when it goes idle
    yield fork( clientInactivityTimeoutTaskFunction, ws.id, ws.headsetType );
};

const clientInactivityTimeoutTaskFunction = function* ( clientId, headsetType ) {

    let serverState;
    let ws;
    let inactivityTimeoutPeriod = roomDataConstants.CLIENT_INFO.CLIENT_INACTIVITY_TIMEOUTS_IN_MS[ headsetType ];

    try {
        do {
            serverState = yield select( ( state ) => { return state.serverReducer; } );
            ws = serverState.websockets[ clientId ];

            // websocket has disconnected, finish
            if( typeof ws === 'undefined' ) {
                break;
            }

            // websocket has gone too long without activity, eject
            if( Date.now() - ws.lastAction > inactivityTimeoutPeriod ) {

                // tell the client why it's being closed
                let clientInactivityTimeoutMsg = makeWsReplyMessage(
                    config.serverId,
                    messageConstants.ERROR_TYPES.CLIENT_INACTIVITY_TIMEOUT,
                    undefined
                );

                sendWsMessageWithLogger( ws, clientInactivityTimeoutMsg, logger );

                // close it
                ws.close();

                // stop checking this client
                break;

            }

            yield delay( roomDataConstants.CLIENT_INFO.CLIENT_INACTIVITY_TIMEOUT_CHECKS_IN_MS[ headsetType ] );
        }
        while( true );
    }
    catch( error ) {
        logger.trace( `error checking client activity: ${error.message}` );
    }
};

/*******************************************************************************
* REMOVE CLIENT FROM ROOM DATA AND INFORM EXISTING CLIENTS IT'S LEFT
*******************************************************************************/

// when a local client is removed from a room, check whether it's got any local clients left
// action: { clientId, roomName }
const handleRemoveLocalClientFromRoom = function* ( action ) {

    let { roomState, roomData } = yield select(
        ( state ) => {
            return {
                roomState:  state.roomStateReducer,
                roomData:   state.roomDataReducer.rooms
            };
        }
    );

    // find any spheres (THERE CAN BE ONLY ONE) held by this client ...
    let spheresHeld = Object.keys( roomData[ action.roomName ].content.spheres ).filter(
        ( sphereId ) => {
            if( !roomData[ action.roomName ].content.spheres[ sphereId ].hold ) {
                return false;
            }
            return roomData[ action.roomName ].content.spheres[ sphereId ].hold.clientId === action.clientId;
        }
    );

    // ... and release each one (THERE CAN BE ONLY ONE)
    for( let sphereId of spheresHeld ) {
        yield call( cancelSphereHold, sphereId, action.clientId, action.roomName );
    }

    if( roomState.rooms[ action.roomName ].status === roomStateConstants.STATES.ROOM_FULL ) {
        // if the room's full
        if( Object.keys( roomData[ action.roomName ].content.clients ).length < config.maxClientsPerRoom ) {
            // tell the state machine about it
            yield put( roomStateActions.unsetRoomFullRequestAction( action.roomName ) );
        }
    }

    // tell remaining clients that this one's left
    try {

        let clientExitMessage = makeWsBroadcastMessage(
            config.serverId,
            messageConstants.OUTGOING_MESSAGE_TYPES.ROOM_CLIENT_EXIT,
            { [ outgoingMsgComponents.ROOM_CLIENT_EXIT.CLIENT_ID ]: action.clientId }
        );

        yield put( roomDataActions.publishMessageToRoomRequestAction( clientExitMessage, action.roomName ) );
    }
    catch( error ) {
        logger.trace( `broadcast error trying to notify client exit for ${action.clientId}: ${error.message}` );
    }

    // tell the state machine to move to CHECKING_IF_EMPTY
    yield put( roomStateActions.checkIfRoomEmptyRequestAction( action.roomName ) );
};

/*******************************************************************************
* REMOVE A SPHERE HOLD WHEN CLIENT LEAVES OR TIMES OUT
*******************************************************************************/

const cancelSphereHold = function* ( sphereId, clientId, roomName) {

    // remove the hold on this sphere for this client
    yield put(
        roomDataActions.removeHoldOnSphereForClientInRoomRequestAction(
            sphereId,
            clientId,
            roomName
        )
    );

    // broadcast to the room that the sphere's been released
    let outgoingMsgData = {
        [ outgoingMsgComponents.ROOM_SPHERE_RELEASED.SPHERE_ID ]: sphereId,
        [ outgoingMsgComponents.ROOM_SPHERE_RELEASED.CLIENT_ID ]: clientId

    };

    let sphereReleasedMessage = makeWsBroadcastMessage(
        config.serverId,
        messageConstants.OUTGOING_MESSAGE_TYPES.ROOM_SPHERE_RELEASED,
        outgoingMsgData
    );

    yield put( roomDataActions.publishMessageToRoomRequestAction( sphereReleasedMessage, roomName ) );
};

/*******************************************************************************
* WORK OUT WHETHER ANY CLIENTS ARE LEFT IN A ROOM, CLOSE ROOM IF NOT
*******************************************************************************/

// asked explicitly by state-machine event CHECK_IF_EMPTY
const checkIfRoomEmpty = function* ( action ) {

    let correctState = yield roomStateUtils.roomIsCurrentlyInState(
        action.roomName,
        roomStateConstants.STATES.CHECKING_IF_EMPTY
    );

    if( correctState !== true ) {
        logger.warn( `not doing checkIfRoomEmpty, room ${action.roomName} not in state CHECKING_IF_EMPTY` );
        return;
    }

    let roomData = yield select( ( state ) => { return state.roomDataReducer.rooms; } );
    let numberClientsLeft = Object.keys( roomData[ action.roomName ].content.clients ).length;

    if( numberClientsLeft > 0 ) {
        yield put( roomStateActions.notifyRoomEmptyCheckFailureRequestAction( action.roomName ) );
    }
    else {
        yield put( roomStateActions.notifyRoomEmptyCheckSuccessRequestAction( action.roomName ) );
    }
};

// if a room is empty of local clients
const handleRoomEmptyCheckSuccess = function* ( action ) {

    let correctState = yield roomStateUtils.roomIsCurrentlyInState(
        action.roomName,
        roomStateConstants.STATES.ROOM_EMPTY
    );

    if( correctState !== true ) {
        logger.warn( `not doing handleRoomEmptyCheckSuccess, room ${action.roomName} not in state ROOM_EMPTY` );
        return;
    }

    let roomData = yield select( ( state ) => { return state.roomDataReducer.rooms; });

    // if there's a heartbeat task running, it should stop
    if( typeof roomData[ action.roomName ].tasks.heartbeat !== undefined ) {
        yield put( roomStateActions.stopHeartbeatForRoomRequestAction( action.roomName ) );
        return;
    }

};

// asked explicitly by state-machine event STOP_HEARTBEAT
const stopHeartbeatForRoom = function* ( action ) {

    let correctState = yield roomStateUtils.roomIsCurrentlyInState(
        action.roomName,
        roomStateConstants.STATES.STOPPING_HEARTBEAT
    );

    if( correctState !== true ) {
        logger.warn( `not doing stopHeartbeatForRoom, room ${action.roomName} not in state STOPPING_HEARTBEAT` );
        return;
    }

    let roomData = yield select( ( state ) => { return state.roomDataReducer.rooms; } );

    // belt & braces double-check to avoid crashing on cancel
    if( typeof roomData[ action.roomName ].tasks.heartbeat !== undefined ) {

        // ask the heartbeatTaskFunction to cancel
        yield cancel( roomData[ action.roomName ].tasks.heartbeat );
    }
    else {
        logger.warn( `problem stopping heartbeat for room ${action.roomName}: no task found` );
        yield put( roomStateActions.notifyStopHeartbeatFailureRequestAction( action.roomName ) );
    }
};

// once a server's stopped sending heartbeats for a room, it should re-INIT the room
const handleStopHeartbeatSuccessEvent = function* ( action ) {

    let correctState = yield roomStateUtils.roomIsCurrentlyInState(
        action.roomName,
        roomStateConstants.STATES.HEARTBEAT_STOPPED
    );

    if( correctState !== true ) {
        logger.warn( `not doing handleStopHeartbeatSuccessEvent, room ${action.roomName} not in state HEARTBEAT_STOPPED` );
        return;
    }

    yield put( roomStateActions.closeRoomRequestAction( action.roomName ) );
};

// just log out room close event
const handleRoomCloseEvent = function* ( action ) {

    let correctState = yield roomStateUtils.roomIsCurrentlyInState(
        action.roomName,
        roomStateConstants.STATES.INIT
    );

    if( correctState !== true ) {
        logger.warn( `not doing handleRoomCloseEvent, room ${action.roomName} not in state INIT` );
        return;
    }

    logger.trace( `closed room ${action.roomName}` );

};

/*******************************************************************************
* START A HOLD TIMEOUT WHEN A CLIENT GRABS A SPHERE
*******************************************************************************/

// triggers on roomDataActions.createHoldOnSphereForClientInRoomRequestAction
// action: { sphereId, clientId, roomName }
const startSphereHoldTimeout = function* ( action ) {

    if( config.timeoutSphereHolds !== true ) {
        return;
    }

    let sphereHoldTimeoutTask = yield fork( sphereHoldTimeoutTaskFunction, action.sphereId, action.roomName );
    yield put(
        roomDataActions.setHoldTimeoutTaskForSphereInRoomRequestAction(
            sphereHoldTimeoutTask,
            action.sphereId,
            action.roomName
        )
    );
};

const sphereHoldTimeoutTaskFunction = function* ( sphereId, roomName ) {

    try {

        let sphereState;
        let lastSphereAction;

        do {
            sphereState = yield select( ( state ) => { return state.roomDataReducer.rooms[ roomName ].content.spheres; } );

            if( typeof sphereState[ sphereId ] === 'undefined' ) {
                // sphere has been deleted
                break;
            }

            if( typeof sphereState[ sphereId ].hold === 'undefined' ) {
                // sphere has been released
                break;
            }

            // check the last time anything was done with the sphere
            lastSphereAction = sphereState[ sphereId ].hold.ts;

            if( Date.now() - lastSphereAction >= roomDataConstants.SPHERE_INFO.SPHERE_HOLD_TIMEOUT_IN_MS ) {

                // work out which client's holding it
                let clientId = sphereState[ sphereId ].hold.clientId;

                // get the websocket for the client
                let serverState = yield select( ( state ) => { return state.serverReducer; } );
                let client = serverState.websockets[ clientId ];

                let timeoutMsgData = {
                    [ messageConstants.OUTGOING_MESSAGE_COMPONENTS.SPHERE_HOLD_TIMEOUT.SPHERE_ID ]: sphereId
                };

                // tell the client it's losing the hold
                let sphereHoldTimeOutMessage = makeWsReplyMessage(
                    config.serverId,
                    messageConstants.ERROR_TYPES.SPHERE_HOLD_TIMEOUT,
                    timeoutMsgData
                );

                sendWsMessageWithLogger( client, sphereHoldTimeOutMessage, logger );

                // delete the hold, tell the room
                yield call( cancelSphereHold, sphereId, clientId, roomName );
                break;
            }
            yield delay( roomDataConstants.SPHERE_INFO.SPHERE_HOLD_TIMEOUT_CHECK_IN_MS );

        } while ( true );
    }
    catch( error ) {
        logger.warn( `error in sphere hold timeout task for sphere ${sphereId}: ${error.message}` );
    }
    finally {
        yield put( roomDataActions.deleteHoldTimeoutTaskForSphereInRoomRequestAction( sphereId, roomName ) );
    }
};

/*******************************************************************************
* PUBLISH A MESSAGE TO CLIENTS IN A ROOM, EXCEPT THE SENDER
*******************************************************************************/

const publishMessageToRoom = function* ( action ) {

    let roomName        = action.roomName;
    let messagePacket   = action.message;
    let messageFromId   = messagePacket[ outgoingMsgComponents.ALL_MESSAGES.FROM ];
    let messageDataEnvelope     = messagePacket[ outgoingMsgComponents.ALL_MESSAGES.MSG ];
    let messageData     = messageDataEnvelope[ outgoingMsgComponents.ALL_MESSAGES.DATA ];

    // construct a message for interested websockets
    let websocketMessage = {
        [ outgoingMsgComponents.ALL_MESSAGES.FROM ]:   messageFromId,
        [ outgoingMsgComponents.ALL_MESSAGES.MSG ]:    messageDataEnvelope
    };

    let { roomData, serverState } = yield select(
        ( state ) => {
            return {
                roomData:       state.roomDataReducer.rooms,
                serverState:    state.serverReducer
            }
        }
    );

    let roomClients     = roomData[ roomName ].content.clients;
    let roomClientIds   = Object.keys( roomClients );
    let clientsLength   = roomClientIds.length;
    let serverSockets   = serverState.websockets;

    for( let i = 0; i < clientsLength; i++ ) {

        let clientId = roomClientIds[ i ];

        if( clientId === messageFromId ) {
            continue;
        }

        if( clientId === messageData[ outgoingMsgComponents.ALL_MESSAGES.CLIENT_ID ] ) {
            continue;
        }

        if( typeof serverSockets[ clientId ] === 'undefined' ) {
            continue;
        }

        let ws = serverSockets[ clientId ];

        try {
            sendWsMessageWithLogger( ws, websocketMessage, logger );
        }
        catch( error ) {
            logger.warn( `error sending ${messageType} message to client ${clientId}: ${error.message}` );
        }
    }
};

/*******************************************************************************
* WATCHER FUNCTIONS TO CATCH REDUX ACTIONS
*******************************************************************************/

const watchStartRoomSetupRequests = function* () {
    yield takeEvery(
        roomStateConstants.EVENT_TYPES.START_ROOM_SETUP,
        startRoomSetup
    );
};

const watchStartRoomSetupSuccessEvents = function* () {
    yield takeEvery(
        roomStateConstants.EVENT_TYPES.START_ROOM_SETUP_SUCCESS,
        handleStartRoomSetupSuccess
    );
};

const watchInitRoomContentSuccessEvents = function* () {
    yield takeEvery(
        roomStateConstants.EVENT_TYPES.INIT_ROOM_CONTENT_SUCCESS,
        handleInitRoomContentSuccess
    );
};

const watchStartHeartbeatRequestEvents = function* () {
    yield takeEvery(
        roomStateConstants.EVENT_TYPES.START_HEARTBEAT,
        startHeartbeatForRoom
    );
};

const watchStartHeartbeatSuccessEvents = function* () {
    yield takeEvery(
        roomStateConstants.EVENT_TYPES.START_HEARTBEAT_SUCCESS,
        startProcessingQueue
    );
};

const watchProcessQueueSuccessEvents = function* () {
    yield takeEvery(
        roomStateConstants.EVENT_TYPES.PROCESS_QUEUE_SUCCESS,
        handleProcessQueueSuccess
    );
};

const watchAddWebsocketToServerStateRequests = function* () {
    yield takeEvery(
        serverConstants.ACTION_TYPES.ADD_WEBSOCKET_TO_STATE,
        connectWebsocketToRoom
    );
};

const watchAddLocalClientToRoomRequests = function* () {
    yield takeEvery(
        roomDataConstants.ACTION_TYPES.ADD_LOCAL_CLIENT_TO_ROOM,
        handleAddLocalClientToRoom
    );
};

const watchPublishMessageRequestActions = function* () {
    yield takeEvery(
        roomDataConstants.ACTION_TYPES.PUBLISH_MESSAGE_TO_ROOM,
        publishMessageToRoom
    );
};

const watchStopHeartbeatRequests = function* () {
    yield takeEvery(
        roomStateConstants.EVENT_TYPES.STOP_HEARTBEAT,
        stopHeartbeatForRoom
    );
};

const watchStopHeartbeatSuccessEvents = function* () {
    yield takeEvery(
        roomStateConstants.EVENT_TYPES.STOP_HEARTBEAT_SUCCESS,
        handleStopHeartbeatSuccessEvent
    );
};

const watchRoomCloseEvents = function* () {
    yield takeEvery(
        roomStateConstants.EVENT_TYPES.CLOSE,
        handleRoomCloseEvent
    );
};

const watchCreateHoldOnSphereEvents = function* () {
    yield takeEvery(
        roomDataConstants.ACTION_TYPES.CREATE_HOLD_ON_SPHERE_FOR_CLIENT_IN_ROOM,
        startSphereHoldTimeout
    );
};

const watchRemoveLocalClientFromRoomRequests = function* () {
    yield takeEvery(
        roomDataConstants.ACTION_TYPES.REMOVE_LOCAL_CLIENT_FROM_ROOM,
        handleRemoveLocalClientFromRoom
    );
};

const watchCheckIfRoomEmptyRequests = function* () {
    yield takeEvery(
        roomStateConstants.EVENT_TYPES.CHECK_IF_EMPTY,
        checkIfRoomEmpty
    );
};

const watchRoomEmptyCheckSuccessEvents = function* () {
    yield takeEvery(
        roomStateConstants.EVENT_TYPES.EMPTY_CHECK_SUCCESS,
        handleRoomEmptyCheckSuccess
    );
};

/*******************************************************************************
* EXPORT SAGAS
*******************************************************************************/

export default {
    setupSaga: function* () {
        const sagas = [
            watchStartRoomSetupRequests,
            watchStartRoomSetupSuccessEvents,
            watchInitRoomContentSuccessEvents,
            watchStartHeartbeatRequestEvents,
            watchStartHeartbeatSuccessEvents,
            watchProcessQueueSuccessEvents,
        ];

        yield call( sagaUtils.spawnAutoRestartingSagas, sagas );
    },
    connectionSaga: function* () {

        const sagas = [
            watchAddWebsocketToServerStateRequests,
            watchAddLocalClientToRoomRequests,
        ];

        yield call( sagaUtils.spawnAutoRestartingSagas, sagas );
    },
    publishSaga: function* () {
        const sagas = [
            watchPublishMessageRequestActions
        ];

        yield call( sagaUtils.spawnAutoRestartingSagas, sagas );
    },
    heartbeatSaga: function* () {

        const sagas = [
           watchStopHeartbeatRequests,
           watchStopHeartbeatSuccessEvents,
           watchRoomCloseEvents
        ];

        yield call( sagaUtils.spawnAutoRestartingSagas, sagas );
    },
    sphereHoldTimeoutSaga: function* () {

        const sagas = [
            watchCreateHoldOnSphereEvents
        ];

        yield call( sagaUtils.spawnAutoRestartingSagas, sagas );
    },
    disconnectionSaga: function* () {

        const sagas = [
            watchRemoveLocalClientFromRoomRequests,
            watchCheckIfRoomEmptyRequests,
            watchRoomEmptyCheckSuccessEvents
        ];

        yield call( sagaUtils.spawnAutoRestartingSagas, sagas );
    }
};
