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

import redux    from 'redux';
import uuid     from 'uuid';
import HashRing from 'hashring';

import { logger }               from '../logger';
import roomDataConstants        from '../rooms/room-data-constants';
import roomNames                from '../rooms/room-names';

import { createFilteredActionHandler }  from '../utils/reducer-utils';

import config                   from '../config';

import serverConstants          from './server-constants';

const mapServableRooms = ( roomList, hashRing ) => {
    return roomList.filter(
        ( roomName ) => {
            return hashRing.get( roomName ) === config.localIpPortString;
        }
    );
};

const initialState = ( () => {

    let obj = {
        serverId:           config.serverId,
        syncTopic:          null,
        syncSubscription:   null,
        syncWarmup: {
            warmupStatus:   false,
            receiptTimes:   []
        },
        appServer:          null,
        websocketServer:    null,
        balancer:           null,
        peers:              {},
        websockets:         {}
    };

    // used to consistently hash room names to target server addresses
    obj.hashRing = new HashRing(
        [ `${config.localIpAddress}:${config.serverPort}` ],
        'md5',
        { 'max cache size': 10000 }
    );

    // balancing based on what's available on the server a client arrives at
    obj.servableRooms = mapServableRooms( roomNames, obj.hashRing );

    return obj;

} )();

const addSyncSubscriptionWarmupResponse = ( state, action ) => {

    if( state.syncWarmup.receiptTimes.length >= serverConstants.SYNC_INFO.SYNC_WARMUP_MESSAGE_LIST_LENGTH ) {
        state.syncWarmup.receiptTimes.shift();
    }

    state.syncWarmup.receiptTimes.push( Date.now() );
    return state;
};

// action: { syncTopic }
const setSyncTopic = ( state, action ) => {

    if( typeof action.syncTopic === 'undefined' ) {
        return state;
    }

    state.syncTopic = action.syncTopic;
    return state;
};

// action: { syncSubscription }
const setSyncSubscription = ( state, action ) => {

    if( typeof action.syncSubscription === 'undefined' ) {
        return state;
    }

    state.syncSubscription = action.syncSubscription;
    return state;
};

// action: { appServer }
const setAppServer = ( state, action ) => {

    if( typeof action.appServer === 'undefined' ) {
        return state;
    }

    state.appServer = action.appServer;
    return state;
};

// action: { websocketServer }
const setWebsocketServer = ( state, action ) => {

    if( typeof action.websocketServer === 'undefined' ) {
        return state;
    }

    state.websocketServer = action.websocketServer;
    return state;
};

// action: { balancer }
const setBalancer = ( state, action ) => {

    if( typeof action.peerId === 'undefined' ) {
        return state;
    }

    state.balancer = action.balancer;
    return state;
};

// action: { monitorTask, peerId }
const setMonitorTaskForPeer = ( state, action ) => {

    if( typeof action.peerId === 'undefined' ) {
        return state;
    }

    state.peers[ action.peerId ].monitorTask = action.monitorTask;
    return state;
};

// action: { peerId, data }
const setLastHeartbeatForPeer = ( state, action ) => {

    if( typeof action.peerId === 'undefined' ) {
        return state;
    }

    if( !state.peers[ action.peerId ] ) {

        state.peers[ action.peerId ] = {
            lastHeartbeatTime:  0,
            ip:                 action.data.ip,
            port:               action.data.port
        };

        // add peer to balancer hash ring
        let peerIpPortString = `${action.data.ip}:${action.data.port}`;
        logger.info( `adding peer ${peerIpPortString}` );
        state.hashRing.add( peerIpPortString );
        logger.trace( `balancer hash ring is now:`, Object.keys( state.hashRing.vnodes ) );

        // remap list of rooms this server should serve, based on new hash ring
        let start = Date.now();
        state.servableRooms = mapServableRooms( roomNames, state.hashRing );
        let end = Date.now();
        logger.info( `addPeerToList remapped ${state.servableRooms.length} rooms in ${end - start}ms` );
    }

    state.peers[ action.peerId ].lastHeartbeatTime = Date.now();
    return state;
};

// action: { serverId }
const removePeerFromList = ( state, action ) => {

    if( typeof action.peerId === 'undefined' ) {
        return state;
    }

    if( state.peers[ action.peerId ] ) {

        let peer = state.peers[ action.peerId ];
        let peerIpPortString = `${peer.ip}:${peer.port}`;

        // remove peer from balancer hash ring
        logger.info( `removing peer ${peerIpPortString}` );
        state.hashRing.remove( peerIpPortString );
        logger.trace( `balancer hash ring is now:`, Object.keys( state.hashRing.vnodes ) );

        // remap list of rooms this server should serve, based on new hash ring
        let start = Date.now();
        state.servableRooms = mapServableRooms( roomNames, state.hashRing );
        let end = Date.now();
        logger.info( `removePeerFromList remapped ${state.servableRooms.length} rooms in ${end - start}ms` );

        state.peers[ action.peerId ] = null;
        delete state.peers[ action.peerId ];
    }

    let remainingPeers = Object.keys( state.peers );
    if( remainingPeers.length > 0 ) {
        logger.info( `remaining peers: `, Object.keys( state.peers ));
    }
    else {
        logger.info( `no remaining peers` );
    }

    return state;
};

// action: { ws }
const addWebsocketToState = ( state, action ) => {

    if( typeof action.ws === 'undefined' ) {
        return state;
    }

    state.websockets[ action.ws.id ] = action.ws;
    let count = Object.keys( state.websockets ).length;
    logger.trace( `[+] this server now has ${count} websockets` );

    return state;
};

const setWebsocketTimeoutTaskForClient = ( state, action ) => {

    if( typeof action.clientId === 'undefined' ) {
        return state;
    }

    state.websockets[ action.clientId ].timeoutTask = action.timeoutTask;
    return state;
};

const removeWebsocketTimeoutTaskFromClient = ( state, action ) => {

    if( typeof action.clientId === 'undefined' ) {
        return state;
    }

    state.websockets[ action.clientId ].timeoutTask = null;
    delete state.websockets[ action.clientId ].timeoutTask;

    return state;
};

// action: { ws, roomName }
const removeWebsocketFromState = ( state, action ) => {

    if( typeof action.ws === 'undefined' ) {
        return state;
    }

    if( !state.websockets[ action.ws.id ] ) {
        return state;
    }

//    state.websockets[ action.ws.id ] = null;
    delete state.websockets[ action.ws.id ];
    let count = Object.keys( state.websockets ).length;
    logger.trace( `[-] this server now has ${count} websockets` );

    return state;
};

// action: { roomName, wsId }
const setQueuedRoomForWebsocket = ( state, action ) => {

    if( typeof action.wsId === 'undefined' ) {
        return state;
    }

    state.websockets[ action.wsId ].queuedRoom = action.roomName;

    return state;
};

// action: { roomName, wsId }
const removeQueuedRoomForWebsocket = ( state, action ) => {

    if( typeof action.wsId === 'undefined' ) {
        return state;
    }

    state.websockets[ action.wsId ].queuedRoom = null;
    delete state.websockets[ action.wsId ].queuedRoom;

    return state;
};

// action: { clientId, roomName }
const setCurrentRoomForWebsocket = ( state, action ) => {

    if( typeof action.clientId === 'undefined' ) {
        return state;
    }

    if( !state.websockets[ action.clientId ] ) {
        return state;
    }

    state.websockets[ action.clientId ].currentRoom = action.roomName;
    state.websockets[ action.clientId ].queuedRoom = null;
    delete state.websockets[ action.clientId ].queuedRoom;

    return state;
};

// action: { clientId, roomName }
const removeCurrentRoomFromWebsocket = ( state, action ) => {

    if( typeof action.clientId === 'undefined' ) {
        return state;
    }

    if( !state.websockets[ action.clientId ] ) {
        return state;
    }

    state.websockets[ action.clientId ].currentRoom = null;
    delete state.websockets[ action.clientId ].currentRoom;

    return state;
};

export default createFilteredActionHandler( {
    [ serverConstants.ACTION_TYPES.ADD_SYNC_SUBSCRIPTION_WARMUP_RESPONSE ]:     addSyncSubscriptionWarmupResponse,
    [ serverConstants.ACTION_TYPES.SET_SYNC_TOPIC ]:                            setSyncTopic,
    [ serverConstants.ACTION_TYPES.SET_SYNC_SUBSCRIPTION ]:                     setSyncSubscription,
    [ serverConstants.ACTION_TYPES.SET_APP_SERVER ]:                            setAppServer,
    [ serverConstants.ACTION_TYPES.SET_WEBSOCKET_SERVER ]:                      setWebsocketServer,
    [ serverConstants.ACTION_TYPES.SET_BALANCER ]:                              setBalancer,
    [ serverConstants.ACTION_TYPES.SET_MONITOR_TASK_FOR_PEER ]:                 setMonitorTaskForPeer,
    [ serverConstants.ACTION_TYPES.SET_LAST_HEARTBEAT_FOR_PEER ]:               setLastHeartbeatForPeer,
    [ serverConstants.ACTION_TYPES.REMOVE_PEER_FROM_LIST ]:                     removePeerFromList,

    [ serverConstants.ACTION_TYPES.ADD_WEBSOCKET_TO_STATE ]:                    addWebsocketToState,
    [ serverConstants.ACTION_TYPES.SET_WEBSOCKET_TIMEOUT_TASK_FOR_CLIENT ]:     setWebsocketTimeoutTaskForClient,
    [ serverConstants.ACTION_TYPES.REMOVE_WEBSOCKET_TIMEOUT_TASK_FOR_CLIENT ]:  removeWebsocketTimeoutTaskFromClient,
    [ serverConstants.ACTION_TYPES.REMOVE_WEBSOCKET_FROM_STATE ]:               removeWebsocketFromState,
    [ roomDataConstants.ACTION_TYPES.ADD_WEBSOCKET_TO_QUEUE_FOR_ROOM ]:         setQueuedRoomForWebsocket,
    [ roomDataConstants.ACTION_TYPES.ADD_LOCAL_CLIENT_TO_ROOM ]:                setCurrentRoomForWebsocket,
    [ roomDataConstants.ACTION_TYPES.REMOVE_LOCAL_CLIENT_FROM_ROOM ]:           removeCurrentRoomFromWebsocket,
}, initialState );
