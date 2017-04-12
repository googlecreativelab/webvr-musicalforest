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

import uuid from 'uuid';

import { delay, takeEvery, takeLatest } from 'redux-saga';
import { call, put, fork, select }      from 'redux-saga/effects';

import { logger }                       from '../logger';
import { sphereConstants }          from '../spheres';

import {
    roomDataActions,
    roomNames,
    roomStateActions,
    roomStateConstants
}  from '../rooms';

import {
    makeWsReplyMessage,
    makeWsBroadcastMessage,
    sendWsMessageWithLogger
} from '../utils/websocket-utils';

import config                       from '../config';
import { sagaUtils }                from '../utils';

import messageActions               from './message-actions';
import messageConstants             from './message-constants';

const incomingMsgComponents = messageConstants.INCOMING_MESSAGE_COMPONENTS;
const outgoingMsgComponents = messageConstants.OUTGOING_MESSAGE_COMPONENTS;

/*******************************************************************************
* EXIT ROOM
*******************************************************************************/

const exitRoom = function* ( message ) {

    logger.trace( `client ${message.ws.id} is leaving room ${message.ws.currentRoom}` );

    // send a goodbye message to the client
    let roomExitSuccessMessage = makeWsReplyMessage(
        config.serverId,
        messageConstants.OUTGOING_MESSAGE_TYPES.ROOM_EXIT_SUCCESS,
        { [ outgoingMsgComponents.ROOM_EXIT_SUCCESS.ROOM_NAME ]: message.ws.currentRoom }
    );

    sendWsMessageWithLogger( message.ws, roomExitSuccessMessage, logger );

    // remove it from the state
    yield put(
        roomDataActions.removeLocalClientFromRoomRequestAction(
            message.ws.id,
            message.ws.currentRoom
        )
    );

    // close the connection
    message.ws.close();
};

/*******************************************************************************
* UPDATE ROOM CLIENT POSITION
*******************************************************************************/

const updateClientCoords = function* ( action ) {

    let { msgType, msgData } = getTypeAndDataForMessage( action );

    // check whether the coords include any sphere position update
    let spherePositionUpdates = msgData[ incomingMsgComponents.UPDATE_CLIENT_COORDS.SPHERES ];

    if( typeof spherePositionUpdates !== 'undefined' ) {

        let roomState = yield select( ( state ) => { return state.roomDataReducer.rooms; } );
        let spheresHeldByClient = roomState[ action.roomName ].content.clients[ action.ws.id ].spheresHeld;
        let checkedSpherePositionUpdates = [];

        // spherePositionUpdates will be an array if it exists, as it's been validated
        const spherePositionUpdateCount = spherePositionUpdates.length;

        for( let i = 0; i < spherePositionUpdateCount; i++ ) {

            let updatedSphere   = spherePositionUpdates[ i ];
            let updatedSphereId = updatedSphere[ incomingMsgComponents.UPDATE_CLIENT_COORDS.SPHERE_ID ];

            // check that this client is holding this sphere
            if( typeof spheresHeldByClient[ updatedSphereId ] === 'undefined' ) {
                continue;
            }

            let updatedSpherePosition = updatedSphere[ incomingMsgComponents.UPDATE_CLIENT_COORDS.SPHERE_POSITION ];

            if( spheresHeldByClient[ updatedSphereId ] === true ) {

                // set the sphere position in state so new clients see it
                yield put(
                    roomDataActions.setPositionForSphereInRoomRequestAction(
                        updatedSpherePosition,
                        updatedSphereId,
                        action.roomName
                    )
                );

                // add it to the list of checked updates
                checkedSpherePositionUpdates.push( updatedSphere );
            }
        }

        // set a populated checked array back in the message
        if( checkedSpherePositionUpdates.length > 0 ) {
            msgData[ incomingMsgComponents.UPDATE_CLIENT_COORDS.SPHERES ] = checkedSpherePositionUpdates;
        }

        // or just remove an empty one (= no valid sphere updates)
        else {
            delete msgData[ incomingMsgComponents.UPDATE_CLIENT_COORDS.SPHERES ];
        }
    }

    // don't record any client state change, just broadcast its new position to other clients
    let updatedCoordsMessage = makeWsBroadcastMessage(
        action[ incomingMsgComponents.ALL_MESSAGES.FROM ],
        messageConstants.OUTGOING_MESSAGE_TYPES.ROOM_CLIENT_COORDS_UPDATED,
        action[ incomingMsgComponents.ALL_MESSAGES.MSG ][ incomingMsgComponents.ALL_MESSAGES.DATA ]
    );

    yield put( roomDataActions.publishMessageToRoomRequestAction( updatedCoordsMessage, action.roomName ) );

};

/*******************************************************************************
* CREATE SPHERE AT POSITION IN ROOM
*******************************************************************************/

const createSphereOfToneAtPosition = function* ( action ) {

    let { msgType, msgData } = getTypeAndDataForMessage( action );

    let roomData = yield select( ( state ) => { return state.roomDataReducer; } );
    let sphereState = roomData.rooms[ action.roomName ].content.spheres;

    // make sure there's sphere space in the room
    if( Object.keys( sphereState ).length >= sphereConstants.SPHERE_INFO.MAX_NUMBER_OF_SPHERES_PER_ROOM ) {
        denySphereAction(
            action.ws,
            null,   // no sphere under discussion, so ...
            null,   // ... no client holding it
            messageConstants.ERROR_TYPES.CREATE_SPHERE_UNAVAILABLE
        );
        return;
    }

    // snag relevant data
    let newSphereId = uuid();
    let tone        = msgData[ incomingMsgComponents.CREATE_SPHERE_OF_TONE_AT_POSITION.TONE ];
    let position    = msgData[ incomingMsgComponents.CREATE_SPHERE_OF_TONE_AT_POSITION.POSITION ];
    let clientId    = action.ws.id;

    // create the sphere, save in sate
    yield put(
        roomDataActions.addSphereOfToneAtPositionInRoomRequestAction(
            newSphereId,
            tone,
            position,
            action.roomName
        )
    );

    // tell the client it created the sphere OK
    let createSuccessMessage = makeWsReplyMessage(
        config.serverId,
        messageConstants.OUTGOING_MESSAGE_TYPES.CREATE_SPHERE_SUCCESS,
        { [ outgoingMsgComponents.CREATE_SPHERE_SUCCESS.SPHERE_ID ]: newSphereId }
    );

    sendWsMessageWithLogger( action.ws, createSuccessMessage, logger );

    // broadcast 'sphere created' action
    let data = {
        [ outgoingMsgComponents.ROOM_SPHERE_CREATED.SPHERE_ID ]:    newSphereId,
        [ outgoingMsgComponents.ROOM_SPHERE_CREATED.TONE ]:         tone,
        [ outgoingMsgComponents.ROOM_SPHERE_CREATED.POSITION ]:     position,
        [ outgoingMsgComponents.ROOM_SPHERE_CREATED.CLIENT_ID ]:    clientId
    };

    let sphereMsg = makeWsBroadcastMessage(
        config.serverId,
        messageConstants.OUTGOING_MESSAGE_TYPES.ROOM_SPHERE_CREATED,
        data
    );

    yield put( roomDataActions.publishMessageToRoomRequestAction( sphereMsg, action.roomName ) );
};

/*******************************************************************************
* GRAB SPHERE BY ID
*******************************************************************************/

const grabSphere = function* ( action ) {

    let { msgType, msgData } = getTypeAndDataForMessage( action );

    // get necessary state
    let roomState = yield select(
        ( state ) => {
            return state.roomDataReducer.rooms[ action.roomName ];
        }
    );

    // check the client has a spare hand
    let spheresHeldByClient = roomState.content.clients[ action.ws.id ].spheresHeld;

    // if it's already holding more than 1 ...
    if( Object.keys( spheresHeldByClient ).length > 1 ) {

        // it can't grab any more
        denySphereAction(
            action.ws,
            sphereId,
            null,    // it would be invalid for this ws to grab it
            messageConstants.ERROR_TYPES.CLIENT_HOLDING_MAX_SPHERES
        );
        return;
    }

    // snag relevant data
    let sphereId = msgData[ incomingMsgComponents.GRAB_SPHERE.SPHERE_ID ];
    let sphereState = roomState.content.spheres;

    // does sphere exist?
    if( !sphereState[ sphereId ] ) {
        denySphereAction(
            action.ws,
            sphereId,
            null,    // it would be invalid for this ws to grab it
            messageConstants.ERROR_TYPES.NON_EXISTENT_SPHERE
        );
        return;

    };

    // is it already held ...
    if( sphereState[ sphereId ].hold ) {
        let alreadyHeldErrorCode;
        let holderId = sphereState[ sphereId ].hold.clientId;

        // ... by this client?
        if( holderId === action.ws.id ) {
            alreadyHeldErrorCode = messageConstants.ERROR_TYPES.CLIENT_HOLDING_SPHERE;
        }

        // or another client?
        else {
            alreadyHeldErrorCode = messageConstants.ERROR_TYPES.SPHERE_ALREADY_HELD;
        }

        // either way, no go
        denySphereAction(
            action.ws,
            sphereId,
            holderId,    // it would be invalid for this ws to grab it
            alreadyHeldErrorCode
        );

        return;
    }

    // create a hold on this sphere for this client
    yield put(
        roomDataActions.createHoldOnSphereForClientInRoomRequestAction(
            sphereId,
            action.ws.id,
            action.roomName
        )
    );

    // TODO check the client got the hold?

    // tell the client it got a hold
    let grabSuccessMessage = makeWsReplyMessage(
        config.serverId,
        messageConstants.OUTGOING_MESSAGE_TYPES.GRAB_SPHERE_SUCCESS,
        { [ outgoingMsgComponents.GRAB_SPHERE_SUCCESS.SPHERE_ID ]: sphereId }
    );

    sendWsMessageWithLogger( action.ws, grabSuccessMessage, logger );

    // broadcast 'sphere grabbed' action
    let sphereGrabbedData = {
        [ outgoingMsgComponents.GRAB_SPHERE_SUCCESS.SPHERE_ID ]: sphereId,
        [ outgoingMsgComponents.GRAB_SPHERE_SUCCESS.CLIENT_ID ]: action.ws.id
    };

    let sphereGrabbedMsg = makeWsBroadcastMessage(
        config.serverId,
        messageConstants.OUTGOING_MESSAGE_TYPES.ROOM_SPHERE_GRABBED,
        sphereGrabbedData
    );

    yield put( roomDataActions.publishMessageToRoomRequestAction( sphereGrabbedMsg, action.roomName ) );

};

/*******************************************************************************
* RELEASE SPHERE BY ID
*******************************************************************************/

const releaseSphere = function* ( action ) {

    let { msgType, msgData } = getTypeAndDataForMessage( action );

    // get necessary state
    let sphereState = yield getSphereStateForRoom( action.roomName );

    // snag relevant data
    let sphereId = msgData[ incomingMsgComponents.RELEASE_SPHERE.SPHERE_ID ];

    // does this sphere exist?
    if( !sphereState[ sphereId ] ) {

        denySphereAction(
            action.ws,
            sphereId,
            null,    // it would be invalid for this ws to grab it
            messageConstants.ERROR_TYPES.NON_EXISTENT_SPHERE
        );

        return;
    };

    // is it held at all?
    if( !sphereState[ sphereId ].hold ) {

        denySphereAction(
            action.ws,
            sphereId,
            null,    // it would be invalid for this ws to release it
            messageConstants.OUTGOING_MESSAGE_TYPES.RELEASE_SPHERE_INVALID
        );

        return;
    }

    let holderId = sphereState[ sphereId ].hold.clientId;

    if( typeof holderId === 'undefined' ) {

        denySphereAction(
            action.ws,
            sphereId,
            null,
            messageConstants.ERROR_TYPES.SYSTEM_ERROR
        );

        return;
    }

    // is it held by another client?
    if( holderId !== action.ws.id ) {

        denySphereAction(
            action.ws,
            sphereId,
            holderId,  // denied because this other one's holding it
            messageConstants.OUTGOING_MESSAGE_TYPES.RELEASE_SPHERE_DENIED
        );

        return;
    }

    // remove the hold on this sphere for this client
    yield put(
        roomDataActions.removeHoldOnSphereForClientInRoomRequestAction(
            sphereId,
            action.ws.id,
            action.roomName
        )
    );

    // tell the client it released the sphere OK
    let releaseSuccessMessage = makeWsReplyMessage(
        config.serverId,
        messageConstants.OUTGOING_MESSAGE_TYPES.RELEASE_SPHERE_SUCCESS,
        { [ outgoingMsgComponents.RELEASE_SPHERE_SUCCESS.SPHERE_ID ]: sphereId }
    );

    sendWsMessageWithLogger( action.ws, releaseSuccessMessage, logger );

    // broadcast to the room that the sphere's been released
    let outgoingMsgData = {
        [ outgoingMsgComponents.ROOM_SPHERE_RELEASED.SPHERE_ID ]: sphereId,
        [ outgoingMsgComponents.ROOM_SPHERE_RELEASED.CLIENT_ID ]: action.ws.id
    };

    let sphereReleasedMessage = makeWsBroadcastMessage(
        config.serverId,
        messageConstants.OUTGOING_MESSAGE_TYPES.ROOM_SPHERE_RELEASED,
        outgoingMsgData
    );

    yield put( roomDataActions.publishMessageToRoomRequestAction( sphereReleasedMessage, action.roomName ) );
};

/*******************************************************************************
* SET SPHERE TONE BY ID
*******************************************************************************/

const setSphereTone = function* ( action ) {

    let { msgType, msgData } = getTypeAndDataForMessage( action );

    // get necessary state
    let sphereState = yield getSphereStateForRoom( action.roomName );

    // snag relevant data
    let sphereId    = msgData[ incomingMsgComponents.SET_SPHERE_TONE.SPHERE_ID ];
    let tone        = msgData[ incomingMsgComponents.SET_SPHERE_TONE.TONE ];

    // does this sphere exist?
    if( !sphereState[ sphereId ] ) {

        denySphereAction(
            action.ws,
            sphereId,
            null,    // it would be invalid for this ws to grab it
            messageConstants.ERROR_TYPES.NON_EXISTENT_SPHERE
        );

        return;
    };

    // is it held by another client?
    if( sphereState[ sphereId ].hold ) {

        let holderId = sphereState[ sphereId ].hold.clientId;

        if( typeof holderId === 'undefined' ) {
            denySphereAction(
                action.ws,
                sphereId,
                null,
                messageConstants.ERROR_TYPES.SYSTEM_ERROR
            );

            return;
        }

        if( holderId !== action.ws.id ) {

            denySphereAction(
                action.ws,
                sphereId,
                holderId,  // denied because this other one's holding it
                messageConstants.OUTGOING_MESSAGE_TYPES.SET_SPHERE_TONE_DENIED
            );

            return;
        }
    }

    // set the tone for this sphere
    yield put(
        roomDataActions.setToneForSphereInRoomRequestAction(
            tone,
            sphereId,
            action.roomName
        )
    );

    // tell the client it set the tone OK
    let toneSuccessMessage = makeWsReplyMessage(
        config.serverId,
        messageConstants.OUTGOING_MESSAGE_TYPES.SET_SPHERE_TONE_SUCCESS,
        { [ outgoingMsgComponents.SET_SPHERE_TONE_SUCCESS.SPHERE_ID ]: sphereId }
    );

    sendWsMessageWithLogger( action.ws, toneSuccessMessage, logger );

    // broadcast the new tone to the room
    let outgoingMsgData = {
        [ outgoingMsgComponents.ROOM_SPHERE_TONE_SET.SPHERE_ID ]:   sphereId,
        [ outgoingMsgComponents.ROOM_SPHERE_TONE_SET.TONE ]:        tone,
        [ outgoingMsgComponents.ROOM_SPHERE_TONE_SET.CLIENT_ID ]:   action.ws.id
    };

    let sphereToneMsg = makeWsBroadcastMessage(
        config.serverId,
        messageConstants.OUTGOING_MESSAGE_TYPES.ROOM_SPHERE_TONE_SET,
        outgoingMsgData
    );

    yield put( roomDataActions.publishMessageToRoomRequestAction( sphereToneMsg, action.roomName ) );

};

/*******************************************************************************
* SET SPHERE CONNECTIONS BY ID
*******************************************************************************/

const setSphereConnections = function* ( action ) {

    let { msgType, msgData } = getTypeAndDataForMessage( action );

    // get necessary state
    let sphereState = yield getSphereStateForRoom( action.roomName );

    // snag relevant data
    let sphereId    = msgData[ incomingMsgComponents.SET_SPHERE_CONNECTIONS.SPHERE_ID ];
    let connections = msgData[ incomingMsgComponents.SET_SPHERE_CONNECTIONS.CONNECTIONS ];

    // make sure there aren't too many connections
    if( connections.length > sphereConstants.SPHERE_INFO.MAX_NUMBER_OF_CONNECTIONS_PER_SPHERE ) {
        denySphereAction(
            action.ws,
            sphereId,
            null,    // it would be invalid for this ws to grab it
            messageConstants.ERROR_TYPES.TOO_MANY_SPHERE_CONNECTIONS
        );
        return;
    }

    // does sphere exist?
    if( !sphereState[ sphereId ] ) {
        denySphereAction(
            action.ws,
            sphereId,
            null,    // it would be invalid for this ws to grab it
            messageConstants.ERROR_TYPES.NON_EXISTENT_SPHERE
        );
        return;

    };

    // is it already held ...
    if( sphereState[ sphereId ].hold ) {

        let holderId = sphereState[ sphereId ].hold.clientId;

        // ... by another client?
        if( holderId !== action.ws.id ) {

            denySphereAction(
                action.ws,
                sphereId,
                holderId,    // it would be invalid for this ws to grab it
                messageConstants.OUTGOING_MESSAGE_TYPES.SET_SPHERE_CONNECTIONS_DENIED
            );

            return;
        }
    }

    // if it's a non-empty list of spheres to connect to
    if( connections.length > 0 ) {

        // make sure that ...
        let uniqueAvailableConnections = connections.filter(
            // spheres are not the same
            ( sphereIdIterator ) => {
                return sphereIdIterator !== sphereId;
            }
        ).filter(
            // spheres exist in room
            ( sphereIdIterator ) => {
                return Object.keys( sphereState ).indexOf( sphereIdIterator ) >= 0;
            }
        );

        if( uniqueAvailableConnections.length == 0 ) {
            logger.trace( `setSphereConnections: no unique available connections requested` );
            denySphereAction(
                action.ws,
                sphereId,
                null,    // it would be invalid for this ws to set it
                messageConstants.OUTGOING_MESSAGE_TYPES.SET_SPHERE_CONNECTIONS_DENIED
            );
            return;
        }
    }

    // set the list of connections for this sphere
    yield put(
        roomDataActions.setConnectionsForSphereInRoomRequestAction(
            connections,
            sphereId,
            action.roomName
        )
    );

    // tell the client it connected the spheres OK
    let connectSuccessMessage = makeWsReplyMessage(
        config.serverId,
        messageConstants.OUTGOING_MESSAGE_TYPES.SET_SPHERE_CONNECTIONS_SUCCESS,
        { [ outgoingMsgComponents.SET_SPHERE_CONNECTIONS_SUCCESS.SPHERE_ID ]: sphereId }
    );

    sendWsMessageWithLogger( action.ws, connectSuccessMessage, logger );

    // broadcast the new connections to the room
    let outgoingMsgData = {
        [ outgoingMsgComponents.ROOM_SPHERE_CONNECTIONS_SET.SPHERE_ID ]:    sphereId,
        [ outgoingMsgComponents.ROOM_SPHERE_CONNECTIONS_SET.CONNECTIONS ]:  connections,
        [ outgoingMsgComponents.ROOM_SPHERE_CONNECTIONS_SET.CLIENT_ID ]:    action.ws.id
    };

    let sphereConnectionsMsg = makeWsBroadcastMessage(
        config.serverId,
        messageConstants.OUTGOING_MESSAGE_TYPES.ROOM_SPHERE_CONNECTIONS_SET,
        outgoingMsgData
    );

    yield put( roomDataActions.publishMessageToRoomRequestAction( sphereConnectionsMsg, action.roomName ) );

};

/*******************************************************************************
* DELETE SPHERE BY ID
*******************************************************************************/

const deleteSphere = function* ( action ) {

    let { msgType, msgData } = getTypeAndDataForMessage( action );

    // get necessary state
    let sphereState = yield getSphereStateForRoom( action.roomName );

    // snag relevant data
    let sphereId    = msgData[ incomingMsgComponents.DELETE_SPHERE.SPHERE_ID ];

    // does this sphere exist?
    if( !sphereState[ sphereId ] ) {

        denySphereAction(
            action.ws,
            sphereId,
            null,    // it would be invalid for this ws to grab it
            messageConstants.ERROR_TYPES.NON_EXISTENT_SPHERE
        );

        return;
    };

    // is it held at all?
    if( sphereState[ sphereId ].hold ) {

        let holderId = sphereState[ sphereId ].hold.clientId;

        if( typeof holderId === 'undefined' ) {

            denySphereAction(
                action.ws,
                sphereId,
                null,
                messageConstants.ERROR_TYPES.SYSTEM_ERROR
            );

            return;
        }

        // is it held by another client?
        if( holderId !== action.ws.id ) {

            denySphereAction(
                action.ws,
                sphereId,
                holderId,  // denied because this other one's holding it
                messageConstants.OUTGOING_MESSAGE_TYPES.DELETE_SPHERE_DENIED
            );

            return;
        }
    }

    // remove the hold on this sphere for this client
    yield put(
        roomDataActions.deleteSphereFromRoomRequestAction(
            sphereId,
            action.roomName
        )
    );

    // tell the client it deleted the sphere OK
    let deleteSuccessMessage = makeWsReplyMessage(
        config.serverId,
        messageConstants.OUTGOING_MESSAGE_TYPES.DELETE_SPHERE_SUCCESS,
        { [ outgoingMsgComponents.DELETE_SPHERE_SUCCESS.SPHERE_ID ]: sphereId }
    );

    sendWsMessageWithLogger( action.ws, deleteSuccessMessage, logger );

    // broadcast 'sphere deleted' action
    let outgoingMsgData = {
        [ outgoingMsgComponents.ROOM_SPHERE_DELETED.SPHERE_ID ]: sphereId,
        [ outgoingMsgComponents.ROOM_SPHERE_DELETED.CLIENT_ID ]: action.ws.id
    };

    let sphereDeletedMsg = makeWsBroadcastMessage(
        action.ws.id,
        messageConstants.OUTGOING_MESSAGE_TYPES.ROOM_SPHERE_DELETED,
        outgoingMsgData
    );

    yield put( roomDataActions.publishMessageToRoomRequestAction( sphereDeletedMsg, action.roomName ) );

};

/*******************************************************************************
* STRIKE SPHERE BY ID
*******************************************************************************/

const strikeSphere = function* ( action ) {

    let { msgType, msgData } = getTypeAndDataForMessage( action );

    // get necessary state
    let sphereState = yield getSphereStateForRoom( action.roomName );

    // snag relevant data
    let sphereId    = msgData[ incomingMsgComponents.STRIKE_SPHERE.SPHERE_ID ];
    let velocity    = msgData[ incomingMsgComponents.STRIKE_SPHERE.VELOCITY ];
    let fromId      = action[ incomingMsgComponents.ALL_MESSAGES.FROM ];

    // does sphere exist?
    if( !sphereState[ sphereId ] ) {
        // drop silently if no such sphere
        return;
    };

    // no state change here, just broadcast 'sphere strike' action
    let outgoingMsgData = {
        [ outgoingMsgComponents.ROOM_SPHERE_STRUCK.SPHERE_ID ]: sphereId,
        [ outgoingMsgComponents.ROOM_SPHERE_STRUCK.VELOCITY ]:  velocity,
        [ outgoingMsgComponents.ROOM_SPHERE_STRUCK.CLIENT_ID ]: fromId
    };

    let sphereStruckMsg = makeWsBroadcastMessage(
        action.ws.id,
        messageConstants.OUTGOING_MESSAGE_TYPES.ROOM_SPHERE_STRUCK,
        outgoingMsgData
    );

    yield put( roomDataActions.publishMessageToRoomRequestAction( sphereStruckMsg, action.roomName ) );

};

/*******************************************************************************
* HELPER FUNCTIONS
*******************************************************************************/

const getTypeAndDataForMessage = ( message ) => {
    return {
        msgType: message[ incomingMsgComponents.ALL_MESSAGES.TYPE ],
        msgData: message[ incomingMsgComponents.ALL_MESSAGES.MSG ][ incomingMsgComponents.ALL_MESSAGES.DATA ]
    };
};

const getSphereStateForRoom = function* ( roomName ) {

    let sphereState = yield select(
        ( state ) => {
            return state.roomDataReducer.rooms[ roomName ].content.spheres;
        }
    );

    return sphereState;
};

const denySphereAction = ( ws, sphereId, holderId, denialType ) => {


    let data = {};

    if( sphereId ) {
        data[ outgoingMsgComponents.SPHERE_ACTION_DENIED.SPHERE_ID ] = sphereId;
    }

    if( holderId ) {
        data[ outgoingMsgComponents.SPHERE_ACTION_DENIED.HOLDER_ID ] = holderId;
    }

    let actionDeniedMessage = makeWsReplyMessage(
        config.serverId,
        denialType,
        data
    );

    sendWsMessageWithLogger( ws, actionDeniedMessage, logger );
    return;
};

/*******************************************************************************
* SAGA WATCHER FUNCTIONS
* these takeEvery clauses match for INCOMING_MESSAGE_TYPES auto-dispatched by
* messageHandler.handleWebsocketMessage() after message validation
*******************************************************************************/

const watchExitRoomRequests = function* () {
    yield takeEvery(
        messageConstants.INCOMING_MESSAGE_TYPES.EXIT_ROOM,
        exitRoom
    );
};

const watchUpdateCoordsForClientRequests = function* () {
    yield takeEvery(
        messageConstants.INCOMING_MESSAGE_TYPES.UPDATE_CLIENT_COORDS,
        updateClientCoords
    );
};

const watchCreateSphereAtPositionRequests = function* () {
    yield takeEvery(
        messageConstants.INCOMING_MESSAGE_TYPES.CREATE_SPHERE_OF_TONE_AT_POSITION,
        createSphereOfToneAtPosition
    );
};

const watchGrabSphereRequests = function* () {
    yield takeEvery(
        messageConstants.INCOMING_MESSAGE_TYPES.GRAB_SPHERE,
        grabSphere
    );
};

const watchReleaseSphereRequests = function* () {
    yield takeEvery(
        messageConstants.INCOMING_MESSAGE_TYPES.RELEASE_SPHERE,
        releaseSphere
    );
};

const watchDeleteSphereRequests = function* () {
    yield takeEvery(
        messageConstants.INCOMING_MESSAGE_TYPES.DELETE_SPHERE,
        deleteSphere
    );
};

const watchSetSphereToneRequests = function* () {
    yield takeEvery(
        messageConstants.INCOMING_MESSAGE_TYPES.SET_SPHERE_TONE,
        setSphereTone
    );
};

const watchSetSphereConnectionsRequests = function* () {
    yield takeEvery(
        messageConstants.INCOMING_MESSAGE_TYPES.SET_SPHERE_CONNECTIONS,
        setSphereConnections
    );
};

const watchStrikeSphereRequests = function* () {
    yield takeEvery(
        messageConstants.INCOMING_MESSAGE_TYPES.STRIKE_SPHERE,
        strikeSphere
    );
};

export default {
    rootSaga: function* () {
        const sagas = [
            watchExitRoomRequests,
            watchUpdateCoordsForClientRequests,
            watchCreateSphereAtPositionRequests,
            watchGrabSphereRequests,
            watchReleaseSphereRequests,
            watchDeleteSphereRequests,
            watchSetSphereToneRequests,
            watchSetSphereConnectionsRequests,
            watchStrikeSphereRequests
        ];

        yield sagaUtils.spawnAutoRestartingSagas( sagas );
    }
};
