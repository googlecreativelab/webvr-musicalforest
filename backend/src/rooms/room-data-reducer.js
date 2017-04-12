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

import redux                from 'redux';
import uuid                 from 'uuid';
import sizeof               from 'object-sizeof';
import util                 from 'util';

import {
    initStateObject,
    createFilteredActionHandler
}  from '../utils/reducer-utils';

import { logger }           from '../logger';
import messageConstants     from '../messages/message-constants';

const HT_3DOF   = messageConstants.HEADSET_TYPES.HEADSET_TYPE_3DOF;
const HT_6DOF   = messageConstants.HEADSET_TYPES.HEADSET_TYPE_6DOF;
const HT_VIEW   = messageConstants.HEADSET_TYPES.HEADSET_TYPE_VIEWER;

const CONNECTIONS_LABEL = messageConstants.OUTGOING_MESSAGE_COMPONENTS.ROOM_STATUS_INFO.CONNECTIONS;
const POSITION_LABEL    = messageConstants.OUTGOING_MESSAGE_COMPONENTS.ROOM_STATUS_INFO.POSITION;
const TONE_LABEL    = messageConstants.OUTGOING_MESSAGE_COMPONENTS.ROOM_STATUS_INFO.TONE;

import {
    makeSphereOfToneAtPosition,
    sphereConstants,
    trees
}  from '../spheres';

import config               from '../config';

import roomDataConstants    from './room-data-constants';
import roomStateConstants   from './room-state-constants';
import roomNames            from './room-names';

/*******************************************************************************
* HELPER FUNCTIONS
*******************************************************************************/

const createEmptyRoom = () => {
    return {

        heartbeatTask:      null,
        lastHeartbeat:      {
            count:      0,
            timestamp:  0
        },

        setupComplete:              false,
        waitingForStateStatus:      false,
        checkingForEmptyRoomStatus: false,

        soundbank:          null,
        spheres:            {},

        websockets:         {},
        clients:            {}
    };
};


const createNewRoom = () => {
    let emptyRoom = createEmptyRoom();

    emptyRoom.soundbank = getRandomInt(
        roomDataConstants.ROOM_INFO.MINIMUM_SOUNDBANK_NUMBER,
        roomDataConstants.ROOM_INFO.MAXIMUM_SOUNDBANK_NUMBER
    );

    emptyRoom.spheres   = generateSpheresForRoom( emptyRoom.soundbank );

    return emptyRoom;
};

const generateSpheresForRoom = ( soundbank ) => {

    const roomSpheres = {}

    function dist(a, b){
        return Math.sqrt(Math.pow(a.x - b.x, 2) + 
                         // Math.pow(a.y - b.y, 2) + 
                         Math.pow(a.z - b.z, 2))
    }

    function randomPos(){
        const rad = 2.5
        const pos = {
            x : Math.random() * rad - rad/2,
            y : Math.random() * 0.7 + 0.9,
            z : Math.random() * rad - rad/2
        }
        // check that the position is not too close to any other sphere
        let closestDist = Infinity
        for (let id in roomSpheres){
            const roomPos = roomSpheres[id][POSITION_LABEL]
            closestDist = Math.min(dist(pos, roomPos), closestDist)
        }
        //only return the position if its greater than the thresh
        if (closestDist > 0.5){
            return pos
        } else {
        //otherwise generate a new one
            return randomPos()
        }
    }

    for (let i = 0; i < 10; i++){
        roomSpheres[uuid()] = {
            [TONE_LABEL] : getRandomInt(sphereConstants.SPHERE_INFO.LOWEST_TONE, 
                                        sphereConstants.SPHERE_INFO.HIGHEST_TONE),
            [POSITION_LABEL] : randomPos()
        }
    }

    // return spheres
    return roomSpheres;
};

const getRandomInt = ( min, max ) => {
    let intMin = Math.ceil( min );
    let intMax = Math.floor( max );
    return Math.floor( Math.random() * ( intMax - intMin + 1 ) ) + intMin;
};

const getZeroCoordsForNewClient = () => {
    return {
        head: {
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 }
        },
        left: {
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 }
        },
        right: {
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 }
        }
    };
};

/*******************************************************************************
* GENERATE INITIAL EMPTY STATE FOR ALL ROOMS
*******************************************************************************/

// dictionary of empty room data objects for all names
const initialState = ( () => {

    let createFunction = () => {
        return {
            queue:      [],
            tasks:      {}
        };
    };

    return {
        rooms: initStateObject( roomNames, createFunction, 'room data objects', logger ),
        avails:     ( () => {
            let obj = {};
            Object.values( messageConstants.HEADSET_TYPES ).forEach(
                ( headsetType ) => {
                    obj[ headsetType ] = {};
                }
            );
            return obj;
        } )()
    };

})();


/*******************************************************************************
* ROOM INFO/STATUS REDUCER FUNCTIONS
*******************************************************************************/

// create a new room state including spheres
// action: { roomName }
const initRoomContent = ( state, action ) => {

    if( typeof action.roomName === 'undefined' ) {
        return state;
    }

    state.rooms[ action.roomName ].content = createNewRoom();
    logger.trace( `created default content for new room ${action.roomName}` );
    return state;
};

// action: { wsId, roomName }
const addWebsocketToQueueForRoom = ( state, action ) => {

    if( typeof action.roomName === 'undefined' ) {
        return state;
    }

    if( state.rooms[ action.roomName ].queue.indexOf( action.wsId ) >= 0 ) {
        return state;
    }
    state.rooms[ action.roomName ].queue.push( action.wsId );
    logger.trace( `[+] ${state.rooms[ action.roomName ].queue.length} websockets in queue for room ${action.roomName}` );
    return state;
};

// action: { wsId, roomName }
const removeWebsocketFromQueueForRoom = ( state, action ) => {

    if( typeof action.roomName === 'undefined' ) {
        return state;
    }

    state.rooms[ action.roomName ].queue = state.rooms[ action.roomName ].queue.filter(
        ( clientId ) => {
            return clientId != action.wsId;
        }
    );
    logger.trace( `[-] ${state.rooms[ action.roomName ].queue.length} websockets in queue for room ${action.roomName}` );
    return state;
};

/*******************************************************************************
* CLIENT REDUCER FUNCTIONS
*******************************************************************************/

// action: { clientId, roomName }
const addLocalClientToRoom = ( state, action ) => {

    if( typeof action.roomName === 'undefined' ) {
        return state;
    }

    let roomClients         = state.rooms[ action.roomName ].content.clients;

    if( typeof roomClients[ action.clientId ] !== 'undefined' ) {
        return state;
    }

    roomClients[ action.clientId ] = {
        headsetType:    action.clientHeadsetType,
        coords:         getZeroCoordsForNewClient(),
        spheresHeld:    {}
    }

    logger.trace( `[+] there are now ${Object.keys( roomClients ).length} total clients in room '${action.roomName}'` );

    return updateClientCountsForRoom( state, action );
};

// action: { clientId, roomName }
const removeLocalClientFromRoom = ( state, action ) => {

    if( typeof action.roomName === 'undefined' ) {
        return state;
    }

    state.rooms[ action.roomName ].content.clients[ action.clientId ] = null;
    delete state.rooms[ action.roomName ].content.clients[ action.clientId ];

    let roomClients = state.rooms[ action.roomName ].content.clients;
    logger.trace( `[-] there are now ${Object.keys( roomClients ).length} total clients in room '${action.roomName}'` );

    return updateClientCountsForRoom( state, action );
};

/*
 *  for a room to be available to 6dof:
 *
 *      6dof must be less than 6dofThreshold
 *      3dof + 6dof must be less than 3dofThreshold + 6dofThreshold
 *      3dof + 6dof + viewers must be less than maxClientsPerRoom
 *
 *  for a room to be available to 3dof:
 *
 *      3dof must be less than 3dofThreshold
 *      3dof + 6dof must be less than 3dofThreshold + 6dofThreshold
 *      3dof + 6dof + viewers must be less than maxClientsPerRoom
 *
 *  for a room to be available to viewer:
 *
 *      3dof + 6dof + viewers must be less than maxClientsPerRoom
 */
const updateClientCountsForRoom = ( state, action ) => {

    // this gives { '3dof': 2, '6dof': 1, viewer: 4 }
    let clientCounts = Object.values( state.rooms[ action.roomName ].content.clients ).reduce(
        ( acc, client ) => {
            acc[ client.headsetType ] = acc[ client.headsetType ] + 1;
            return acc;
        },
        ( () => {
            let obj = {};
            Object.values( messageConstants.HEADSET_TYPES ).forEach(
                ( headsetType ) => {
                    obj[ headsetType ] = 0;
                }
            );
            return obj;
        } )()
    );

    // this gives { '3dof': 2 + '6dof': 1 + viewer: 4 } =  totalClients: 7
    let totalClients = Object.values( clientCounts ).reduce(
        ( acc, count ) => {
            return acc + count;
        },
        0
    );

    // if the room's full, it's not available at all;
    // if it's empty, it doesn't go in the availability lists,
    // as it'll be found from the list of INIT-state rooms
    // in roomStateReducer.roomsByState
    if( totalClients >= config.maxClientsPerRoom || totalClients === 0) {
        delete state.avails[ HT_6DOF ][ action.roomName ];
        delete state.avails[ HT_3DOF ][ action.roomName ];
        delete state.avails[ HT_VIEW ][ action.roomName ];
        return state;
    }
    else {
        state.avails[ HT_VIEW ][ action.roomName ] = true;
    }

    let num6dof     = clientCounts[ HT_6DOF ];
    let num3dof     = clientCounts[ HT_3DOF ];
    let numViewers  = clientCounts[ HT_VIEW ];

    let threshold6dof   = config.headsetRules[ HT_6DOF ].threshold;
    let threshold3dof   = config.headsetRules[ HT_3DOF ].threshold;
    let thresholdViewer = config.headsetRules[ HT_VIEW ].threshold;

    let totalStrikers       = num6dof + num3dof;
    let strikerThreshold    = threshold6dof + threshold3dof;

    if( num6dof < threshold6dof && totalStrikers < strikerThreshold ) {
        state.avails[ HT_6DOF ][ action.roomName ] = true;
    }
    else {
        delete state.avails[ HT_6DOF ][ action.roomName ];
    }

    if( num3dof < threshold3dof && totalStrikers < strikerThreshold ) {
        state.avails[ HT_3DOF ][ action.roomName ] = true;
    }
    else {
        delete state.avails[ HT_3DOF ][ action.roomName ];
    }

    return state;
};

// action: { count, roomName }
const setLastHeartbeatCountForRoom = ( state, action ) => {

    if( typeof action.roomName === 'undefined' ) {
        return state;
    }

    let newHeartbeat = {
        count:      action.count,
        timestamp:  Date.now()
    };
    state.rooms[ action.roomName ].content.lastHeartbeat = newHeartbeat;
    return state;
};

// action: { heartbeatTask, roomName }
const setHeartbeatTaskForRoom = ( state, action ) => {

    if( typeof action.roomName === 'undefined' ) {
        return state;
    }

    state.rooms[ action.roomName ].tasks.heartbeat = action.heartbeatTask;
    return state;
};

// action: { roomName }
const removeHeartbeatTaskForRoom = ( state, action ) => {

    if( typeof action.roomName === 'undefined' ) {
        return state;
    }

    state.rooms[ action.roomName ].tasks.heartbeat = null;
    delete state.rooms[ action.roomName ].tasks.heartbeat;
    return state;
};

/*******************************************************************************
* SPHERE REDUCER FUNCTIONS
*******************************************************************************/

// - called via redux-action from message-sagas:createSphereAtPositionInRoom
// action: { newSphereId, position, tone, roomName }
const addSphereOfToneAtPositionInRoom = ( state, action ) => {

    if( typeof action.roomName === 'undefined' ) {
        return state;
    }

    try {
        state.rooms[ action.roomName ].content.spheres[ action.newSphereId ] = makeSphereOfToneAtPosition(
            action.tone,
            action.position
        );
        return state;
    }
    catch( error ) {
        logger.warn( `caught error trying to create new sphere: ${error.message}` );
    }
};

// - called via redux-action from message-sagas:updateClientCoords
// - spheres in state are sent direct to clients, so use const labels
// - action properties are fixed rather than using messageConstants
// - sphere.position is a coordinates object as per message schema
// action: { position, sphereId, roomName }
const setPositionForSphereInRoom = ( state, action ) => {

    if( typeof action.roomName === 'undefined' ) {
        return state;
    }

    if( typeof state.rooms[ action.roomName ].content.spheres[ action.sphereId ] === 'undefined' ) {
        return state;
    }

    const positionLabel = messageConstants.INCOMING_MESSAGE_COMPONENTS.UPDATE_CLIENT_COORDS.SPHERE_POSITION;

    state.rooms[ action.roomName ].content.spheres[ action.sphereId ][ positionLabel ] = action.position;

    if( state.rooms[ action.roomName ].content.spheres[ action.sphereId ].hold ) {
        state.rooms[ action.roomName ].content.spheres[ action.sphereId ].hold.ts = Date.now();
    }

    return state;
};

// - called via redux-action from message-sagas:setSphereConnections
// - spheres in state are sent direct to clients, so use const labels
// - action properties are fixed rather than using messageConstants
// action: { connections, sphereId, roomName }
const setConnectionsForSphereInRoom = ( state, action ) => {

    if( typeof action.roomName === 'undefined' ) {
        return state;
    }

    if( typeof state.rooms[ action.roomName ].content.spheres[ action.sphereId ] === 'undefined' ) {
        return state;
    }

    const connectionsLabel = messageConstants.INCOMING_MESSAGE_COMPONENTS.SET_SPHERE_CONNECTIONS.CONNECTIONS;

    state.rooms[ action.roomName ].content.spheres[ action.sphereId ][ connectionsLabel ] = action.connections;

    if( state.rooms[ action.roomName ].content.spheres[ action.sphereId ].hold ) {
        state.rooms[ action.roomName ].content.spheres[ action.sphereId ].hold.ts = Date.now();
    }

    return state;
};

// - called via redux-action from message-sagas:setSphereTone
// - spheres in state are sent direct to clients, so use const labels
// - action properties are fixed rather than using messageConstants
// action: { tone, sphereId, roomName }
const setToneForSphereInRoom = ( state, action ) => {

    if( typeof action.roomName === 'undefined' ) {
        return state;
    }

    if( typeof state.rooms[ action.roomName ].content.spheres[ action.sphereId ] === 'undefined' ) {
        return state;
    }

    const toneLabel = messageConstants.INCOMING_MESSAGE_COMPONENTS.SET_SPHERE_TONE.TONE;

    state.rooms[ action.roomName ].content.spheres[ action.sphereId ][ toneLabel ] = action.tone;

    if( state.rooms[ action.roomName ].content.spheres[ action.sphereId ].hold ) {
        state.rooms[ action.roomName ].content.spheres[ action.sphereId ].hold.ts = Date.now();
    }

    return state;
};

// - called via redux-action from message-sagas:grabSphere
// action: { sphereId, clientId, roomName }
const createHoldOnSphereForClientInRoom = ( state, action ) => {

    if( typeof action.roomName === 'undefined' ) {
        return state;
    }

    if( typeof state.rooms[ action.roomName ].content.spheres[ action.sphereId ] === 'undefined' ) {
        return state;
    }

    if( typeof state.rooms[ action.roomName ].content.clients[ action.clientId ] === 'undefined' ) {
        return state;
    }

    // set a hold property on the sphere
    state.rooms[ action.roomName ].content.spheres[ action.sphereId ].hold = {
        clientId: action.clientId,
        ts:         Date.now()
    };

    // mark the client as holding this sphere
    state.rooms[ action.roomName ].content.clients[ action.clientId ].spheresHeld[ action.sphereId ] = true;

    return state;
};

// - called from room-sagas:startSphereHoldTimeout
// - triggered when a sphere hold is created
// action: { timeoutTask, sphereId, roomName }
const setHoldTimeoutTaskForSphereInRoom = ( state, action ) => {

    if( typeof action.roomName === 'undefined' ) {
        return state;
    }

    if( typeof state.rooms[ action.roomName ].content.spheres[ action.sphereId ] === 'undefined' ) {
        return state;
    }

    if( typeof state.rooms[ action.roomName ].content.spheres[ action.sphereId ].hold === 'undefined' ) {
        return state;
    }

    state.rooms[ action.roomName ].content.spheres[ action.sphereId ].hold.timeoutTask = action.timeoutTask;

    return state;
};

// action: { sphereId, roomName }
const deleteHoldTimeoutTaskForSphereInRoom = ( state, action ) => {

    if( typeof action.roomName === 'undefined' ) {
        return state;
    }

    if( typeof state.rooms[ action.roomName ].content.spheres[ action.sphereId ] === 'undefined' ) {
        return state;
    }

    if( typeof state.rooms[ action.roomName ].content.spheres[ action.sphereId ].hold === 'undefined' ) {
        return state;
    }

    state.rooms[ action.roomName ].content.spheres[ action.sphereId ].hold.timeoutTask = null;
    delete state.rooms[ action.roomName ].content.spheres[ action.sphereId ].hold.timeoutTask;

    return state;
};

// - called via redux-action from message-sagas:releaseSphere
// action: { sphereId, clientId, roomName }
const removeHoldOnSphereForClientInRoom = ( state, action ) => {

    if( typeof action.roomName === 'undefined' ) {
        return state;
    }

    if( typeof state.rooms[ action.roomName ].content.spheres[ action.sphereId ] === 'undefined' ) {
        return state;
    }

    if( typeof state.rooms[ action.roomName ].content.clients[ action.clientId ] === 'undefined' ) {
        return state;
    }

    if( state.rooms[ action.roomName ].content.spheres[ action.sphereId ].hold.clientId == action.clientId ) {
        // release the sphere hold so other clients can grab it
        state.rooms[ action.roomName ].content.spheres[ action.sphereId ].hold = null;
        delete state.rooms[ action.roomName ].content.spheres[ action.sphereId ].hold;

        // disassociate the sphere from the client so it can't update it any more
        state.rooms[ action.roomName ].content.clients[ action.clientId ].spheresHeld[ action.sphereId ] = null;
        delete state.rooms[ action.roomName ].content.clients[ action.clientId ].spheresHeld[ action.sphereId ];
    }

    return state;
};

// - called via redux-action from message-sagas:deleteSphere
// action: { sphereId, roomName }
const deleteSphereFromRoom = ( state, action ) => {

    if( typeof action.roomName === 'undefined' ) {
        return state;
    }

    if( typeof state.rooms[ action.roomName ].content.spheres[ action.sphereId ] === 'undefined' ) {
        return state;
    }

    state.rooms[ action.roomName ].content.spheres[ action.sphereId ] = null;
    delete state.rooms[ action.roomName ].content.spheres[ action.sphereId ];

    return state;
};

const actionHandlers = {

    // room setup/teardown
    [ roomStateConstants.EVENT_TYPES.INIT_ROOM_CONTENT ]:                       initRoomContent,
    [ roomDataConstants.ACTION_TYPES.ADD_WEBSOCKET_TO_QUEUE_FOR_ROOM ]:         addWebsocketToQueueForRoom,
    [ roomDataConstants.ACTION_TYPES.REMOVE_WEBSOCKET_FROM_QUEUE_FOR_ROOM ]:    removeWebsocketFromQueueForRoom,
    [ roomDataConstants.ACTION_TYPES.ADD_LOCAL_CLIENT_TO_ROOM ]:                addLocalClientToRoom,
    [ roomDataConstants.ACTION_TYPES.REMOVE_LOCAL_CLIENT_FROM_ROOM ]:           removeLocalClientFromRoom,

    [ roomDataConstants.ACTION_TYPES.UPDATE_LAST_HEARTBEAT_FOR_ROOM ]:          setLastHeartbeatCountForRoom,
    [ roomDataConstants.ACTION_TYPES.SET_HEARTBEAT_TASK_FOR_ROOM ]:             setHeartbeatTaskForRoom,
    [ roomDataConstants.ACTION_TYPES.REMOVE_HEARTBEAT_TASK_FOR_ROOM ]:          removeHeartbeatTaskForRoom,

    // sphere state actions
    [ roomDataConstants.ACTION_TYPES.ADD_SPHERE_OF_TONE_AT_POSITION_IN_ROOM ]:      addSphereOfToneAtPositionInRoom,
    [ roomDataConstants.ACTION_TYPES.SET_POSITION_FOR_SPHERE_IN_ROOM ]:             setPositionForSphereInRoom,
    [ roomDataConstants.ACTION_TYPES.SET_TONE_FOR_SPHERE_IN_ROOM ]:                 setToneForSphereInRoom,
    [ roomDataConstants.ACTION_TYPES.SET_CONNECTIONS_FOR_SPHERE_IN_ROOM ]:          setConnectionsForSphereInRoom,
    [ roomDataConstants.ACTION_TYPES.CREATE_HOLD_ON_SPHERE_FOR_CLIENT_IN_ROOM ]:    createHoldOnSphereForClientInRoom,
    [ roomDataConstants.ACTION_TYPES.SET_HOLD_TIMEOUT_TASK_FOR_SPHERE_IN_ROOM ]:    setHoldTimeoutTaskForSphereInRoom,
    [ roomDataConstants.ACTION_TYPES.DELETE_HOLD_TIMEOUT_TASK_FOR_SPHERE_IN_ROOM ]: deleteHoldTimeoutTaskForSphereInRoom,
    [ roomDataConstants.ACTION_TYPES.REMOVE_HOLD_ON_SPHERE_FOR_CLIENT_IN_ROOM ]:    removeHoldOnSphereForClientInRoom,
    [ roomDataConstants.ACTION_TYPES.DELETE_SPHERE_FROM_ROOM ]:                     deleteSphereFromRoom

};

export default createFilteredActionHandler( actionHandlers, initialState );
