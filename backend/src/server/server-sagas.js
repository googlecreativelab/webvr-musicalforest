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

import { delay, takeEvery, takeLatest } from 'redux-saga';
import { call, cancel, cancelled, put, fork, select } from 'redux-saga/effects';
import datastore from '@google-cloud/datastore';

import fetch from 'node-fetch';

import { logger }                   from '../logger';
import { messageConstants }         from '../messages';
import { pubsubClient }             from '../pubsub';
import { sendWsMessageWithLogger }  from '../utils/websocket-utils';

import {
    setPerClientRateLimiterOptions,
    setPerMessageTypeRateLimiterOptions
} from '../messages/message-rate-limiter';

import {
    dsClient,
    datastoreConstants
} from '../datastore';

import {
    roomDataActions,
    roomDataConstants,
    roomStateActions,
    roomStateConstants
} from '../rooms';

import config               from '../config';
import { sagaUtils }        from '../utils';

import serverActions        from './server-actions';
import serverConstants      from './server-constants';
import serverSetup          from './server-setup';
import serverSync           from './server-sync';

import { lbHealthCheckUrl } from './app-server';

/*******************************************************************************
* SERVERS SEND SYNC HEARTBEATS UNTIL THEY DIE
*******************************************************************************/

const startSendingSyncHeartbeat = function* () {

    logger.info(
        `starting to send sync heartbeats every ` +
        `${serverConstants.SYNC_INFO.SYNC_HEARTBEAT_PERIOD_IN_MS}ms`
    );

    do {
        try {
            yield serverSync.sendSyncMessageOfType(
                // send the local ip and the port of the websocket app server
                // for remote balancers to add to their lists
                // and check every SYNC_HEARTBEAT_TIMEOUT_IN_MS
                { ip: config.localIpAddress, port: config.serverPort },
                serverConstants.SYNC_MESSAGES.SYNC_HEARTBEAT
            );
        }
        catch( error ) {
            logger.error( `error sending sync heartbeat: ${error.message}` );
        }

        yield delay( serverConstants.SYNC_INFO.SYNC_HEARTBEAT_PERIOD_IN_MS );

    } while ( true );
};

/*******************************************************************************
* SERVERS CAN LOAD/RELOAD THEIR RATE LIMIT INFO FROM DATASTORE
*******************************************************************************/

const loadRateLimiterInfo = function* () {
    
    logger.info( `loading rate limiter info for ${config.environmentName}` );

    // check if any limit info is in the datastore for this environment
    let query = dsClient.createQuery( datastoreConstants.DS_ENTITY_KEY_PER_ENVIRONMENT_RATE_LIMIT_INFO )
        .filter( 'environmentName', '=', config.environmentName );

    let queryResult = yield dsClient.runQuery( query );

    if( queryResult[ 0 ].length <= 0 ) {
        logger.trace( `no rate limiter info stored for ${config.environmentName}` );
        return;
    }

    let rateLimitInfo = queryResult[ 0 ][ 0 ];

    const limitTypes = [
        'perClient_threshold',
        'perClient_ttl_millisec',
        'perMsgType_threshold',
        'perMsgType_ttl_millisec'
    ];

    for( let t of limitTypes ) {
        if( typeof rateLimitInfo[ t ] !== 'number' ) {
            logger.trace( `${t} ${rateLimitInfo[ t ]} is not a number, discarding rate limit info` );
            return;
        }
    }

    // update the per-client rate limiter
    let perClientRateLimiterOptions = {
        threshold:      rateLimitInfo.perClient_threshold,
        ttl_millisec:   rateLimitInfo.perClient_ttl_millisec
    };

    setPerClientRateLimiterOptions( perClientRateLimiterOptions );

    // update the per-message-type rate limiter
    let perMessageTypeRateLimiterOptions = {
        threshold:      rateLimitInfo.perMsgType_threshold,
        ttl_millisec:   rateLimitInfo.perMsgType_ttl_millisec
    };

    setPerMessageTypeRateLimiterOptions( perMessageTypeRateLimiterOptions );
};

/*******************************************************************************
* SERVERS SAVE THEIR SUBSCRIPTION NAME WITH CURRENT TIMESTAMP UNTIL THEY DIE
*******************************************************************************/

const startSavingSubscriptionInfo = function* () {

    logger.info(
        `starting to save subscription info every ` +
        `${serverConstants.SAVE_INFO.SAVE_SUBSCRIPTION_INFO_PERIOD_IN_MS}ms`
    );

    let { roomState, serverState } = yield select(
        ( state ) => {
            return {
                roomState: state.roomStateReducer,
                serverState: state.serverReducer
            };
        }
    );

    let clientCount = Object.keys( serverState.websockets ).length;
    let roomsInUse  = Object.keys( roomState.roomsByState[ roomStateConstants.STATES.READY ] ).length;

    const topicName         = serverState.syncTopic.name.split( '/' ).pop();
    const subscriptionName  = serverState.syncSubscription.name.split( '/' ).pop();

    const key = dsClient.key( [ datastoreConstants.DS_ENTITY_KEY_SERVER_SUBSCRIPTION_INFO, config.serverId ] );

    let data = {
        serverId:   config.serverId,
        ip:         config.localIpAddress,
        port:       config.serverPort,
        topicName,
        subscriptionName,
        clientCount,
        roomsInUse
    };

    do {

        ( { roomState, serverState } = yield select(
            ( state ) => {
                return {
                    roomState: state.roomStateReducer,
                    serverState: state.serverReducer
                };
            }
        ) );

        data.clientCount = Object.keys( serverState.websockets ).length;
        data.roomsInUse  =
            Object.keys( roomState.roomsByState[ roomStateConstants.STATES.READY ] ).length +
            Object.keys( roomState.roomsByState[ roomStateConstants.STATES.ROOM_FULL ] ).length;

        data.ts = new Date();

        let entity = {
            key,
            method: 'upsert',
            data
        };

        try {
            let result = yield dsClient.save( entity );
        }
        catch( error ) {
            logger.error( `error saving subscription info to datastore: ${error.message}` );
        }

        yield delay( serverConstants.SAVE_INFO.SAVE_SUBSCRIPTION_INFO_PERIOD_IN_MS );

    } while ( true );
};

/*******************************************************************************
* SERVERS PERIODICALLY CHECK DATASTORE FOR DEAD PEER SUBSCRIPTION INFO
*******************************************************************************/

const startCheckingDeadPeerSubscriptions = function* () {

    let possiblyDeadPeerPeriod = serverConstants.SAVE_INFO.SAVE_SUBSCRIPTION_INFO_PERIOD_IN_MS * 5;

    logger.info( `starting to check peer subscriptions every ${possiblyDeadPeerPeriod}ms`);

    do {

        try {

            let deadPeer = yield call( findFirstDeadPeerForCurrentDeployment, possiblyDeadPeerPeriod );

            // any results
            if( typeof deadPeer !== 'undefined' ) {

                // that aren't somehow from this server
                if( deadPeer.serverId !== config.serverId ) {
                    // should maybe be deleted
                    yield maybeDeletePeerSubscription( deadPeer );
                }
                else {
                    logger.trace( `not deleting my own sync subscription` );
                }
            }

        }
        catch( error ) {
            logger.error( `error trying to check dead peer subscriptions: ${error.message}` );
        }

        yield delay( serverConstants.SAVE_INFO.CHECK_SUBSCRIPTION_INFO_PERIOD_IN_MS );

    } while( true );
};

const findFirstDeadPeerForCurrentDeployment = ( possiblyDeadPeerPeriod ) => {

    return new Promise(

        ( resolve, reject ) => {

            let dateNow = Date.now();
            let olderThanDateThreshold = new Date( dateNow - possiblyDeadPeerPeriod );

            let query = dsClient.createQuery( datastoreConstants.DS_ENTITY_KEY_SERVER_SUBSCRIPTION_INFO )
                .filter( 'ts', '<', olderThanDateThreshold )
                .order( 'ts', { descending: true } );

            let stream = query.runStream();

            let deadPeer;

            stream
                .on(
                    'error',
                    reject
                )
                .on(
                    'data',
                    ( entity ) => {

                        if( typeof entity[ 'topicName' ] === 'undefined' ) {
                            return;
                        }

                        if( entity.topicName !== config.syncTopicName ) {
                            return;
                        }

                        let timeAgo = new Date( dateNow ) - entity.ts;
                        if( timeAgo < possiblyDeadPeerPeriod ) {
                            return;
                        }

                        deadPeer = entity;
                        stream.end();
                    }
                )
                .on(
                    'info',
                    ( info ) => {}
                )
                .on(
                    'end',
                    () => {
                        resolve( deadPeer );
                    }
                )
        }
    );
};

const maybeDeletePeerSubscription = function* ( entity ) {

    let shouldDeletePeerSubscription = false;

    try {
        // first, check against the HTTP endpoint to see if it's still alive
        let healthCheckUrl = `${'http://'}${entity.ip}:${entity.port}${lbHealthCheckUrl}`;
        let options = {
            timeout: 10000
        };

        logger.info( `health-checking possibly-dead peer: ${entity.topicName} | ${entity.serverId} | ${entity.ip}:${entity.port} | ${entity.ts.toISOString().replace(/^([^T]+)T([^Z]+)Z$/, '$1 $2' )}` );

        // fetch() throws on network errors & timeouts
        let result = yield fetch(
            healthCheckUrl,
            options
        );

        logger.trace( `got HTTP status ${result.status} from health-check for peer ${entity.serverId}` );

    }
    catch( error ) {
        logger.info( `got network/timeout error health-checking peer ${entity.serverId}, marking for deletion` );
        shouldDeletePeerSubscription = true;
    }

    if( shouldDeletePeerSubscription === false ) {

        logger.trace( `found peer alive at ${entity.ip}:${entity.port} while checking subscription for peer ${entity.serverId}` );

        let peerState = yield select( ( state ) => { return state.serverReducer.peers; } );

        // if the peer's IP is alive but the ID isn't in the peer list,
        // another server must have taken over the IP address, so this
        // server should carry on and delete the old subscription info
        if( Object.keys( peerState ).indexOf( entity.serverId ) > 0 ) {
            return;
        }

        logger.info( `IP is responding but server ${entity.serverId} is not in peer list, deleting old subscription info` );
    }

    let topic = yield pubsubClient.getPubsubTopic( entity.topicName );

    if( !topic.exists() ) {
        logger.warn( `not deleting subscription to topic ${entity.topicName}, no such topic exists` );
        return;
    }

    let subscription = topic.subscription( entity.subscriptionName );

    if( !subscription.exists() ) {
        logger.warn( `not deleting subscription ${entity.subscriptionName}, no such subscription exists` );
        return;
    }

    try {
        logger.info( `deleting PubSub subscription ${entity.subscriptionName}` );
        let pubsubDeleteResult = yield subscription.delete();
    }
    catch( error ) {
        // 404 just means another peer deleted this first
        if( error.code !== 404 ) {
            // other errors need to be flagged
            logger.error( `error deleting subscription ${entity.subscriptionName} for supposedly-dead peer ${entity.serverId}: ${error.message}` );
            return;
        }
    }

    try {
        logger.info( `deleting Datastore record for subscription ${entity.subscriptionName}` );
        let datastoreDeleteResult = yield dsClient.delete( entity[ datastore.KEY ] );
    }
    catch( error ) {
        logger.error( `error deleting Datastore record for supposedly-dead peer ${entity.serverId}: ${error.message}` );
    }

};

const checkMonitorForPeer = function* ( action ) {

    let serverState = yield select( ( state ) => { return state.serverReducer; } );

    // check if a monitor already exists
    if( typeof serverState.peers[ action.peerId ].monitorTask === 'undefined' ) {

        try {
            // create one
            let task = yield fork(
                peerMonitorTaskFunction,
                action.peerId,
                action.data.ip,
                action.data.port
            );

            // add to state so next check passes
            yield put(
                serverActions.setMonitorTaskForPeerRequestAction(
                    task,
                    action.peerId
                )
            );
        }
        catch( error ) {
            logger.error( `error trying to create monitor task for peer ${action.peerId}` );
        }
    }
};

const peerMonitorTaskFunction = function* ( peerId, ip, port )  {

    try {
        logger.info( `starting monitor for peer ${peerId} at ${ip}:${port}` );

        do {

            let peerState = yield select( ( state ) => { return state.serverReducer.peers; } );
            let lastHeartbeatTime = peerState[ peerId ].lastHeartbeatTime;

            // assuming the sync heartbeat has started
            if( lastHeartbeatTime > 0 ) {

                // if the last one was too long ago
                if( ( Date.now() - lastHeartbeatTime ) > serverConstants.SYNC_INFO.SYNC_HEARTBEAT_TIMEOUT_IN_MS ) {

                    try {

                        // first, check against the HTTP endpoint to see if it's still alive
                        let healthCheckUrl = `${'http://'}${ip}:${port}${lbHealthCheckUrl}`;
                        let options = {
                            timeout: 5000
                        };

                        // fetch() throws on network errors & timeouts
                        let result = yield fetch(
                            healthCheckUrl,
                            options
                        );

                        // if it's not returning HTTP 200 OK, throw to trigger removal from peer list
                        if( result.status !== 200 ) {
                            throw new Error( `received HTTP status ${result.status} from health-check` );
                        }
                    }
                    catch( error ) {

                        // assume it's died
                        logger.warn( `error health-checking peer ${peerId} after monitor timeout: ${error.message}` );

                        // remove from peer list
                        yield put(
                            serverActions.removePeerFromListRequestAction( peerId )
                        );

                        break;
                    }

                }
            }

            // check every half second or so, assuming 5-second timeout
            yield delay( Math.floor( serverConstants.SYNC_INFO.SYNC_HEARTBEAT_TIMEOUT_IN_MS / 8 ) );

        } while ( true );

    }
    catch( error ) {
        logger.warn( `error starting monitor for peer ${peerId} at ${ip}:${port}` );
    }
    finally {
        if( yield cancelled() ) {
            logger.trace( `cancelled monitor for peer ${peerId}` );
        }
    }

};

/*******************************************************************************
* SAGA WATCHERS
*******************************************************************************/

const watchStartServerSetupRequests = function* () {
    yield takeEvery(
        serverConstants.ACTION_TYPES.START_SERVER_SETUP,
        serverSetup.startServerSetup
    );
};

const watchStartSyncSubscriptionWarmupRequests = function* () {
    yield takeEvery(
        serverConstants.ACTION_TYPES.START_SYNC_SUBSCRIPTION_WARMUP,
        serverSetup.startSyncSubscriptionWarmup
    );
};

const watchFinishServerSetupRequests = function* () {
    yield takeEvery(
        serverConstants.ACTION_TYPES.FINISH_SERVER_SETUP,
        serverSetup.finishServerSetup
    );
};

const watchStartSendingSyncHeartbeatRequests = function* () {
    yield takeEvery(
        serverConstants.ACTION_TYPES.START_SENDING_SYNC_HEARTBEAT,
        startSendingSyncHeartbeat
    );
};

const watchLoadRateLimiterInfoRequests = function* () {
    yield takeEvery(
        serverConstants.ACTION_TYPES.LOAD_RATE_LIMITER_INFO_FROM_DATASTORE,
        loadRateLimiterInfo
    );
};

const watchStartSavingSubscriptionInfoRequests = function* () {
    yield takeEvery(
        serverConstants.ACTION_TYPES.START_SAVING_SUBSCRIPTION_INFO,
        startSavingSubscriptionInfo
    );
};

const watchStartCheckingDeadPeerSubscriptionsRequests = function* () {
    yield takeEvery(
        serverConstants.ACTION_TYPES.START_CHECKING_DEAD_PEER_SUBSCRIPTIONS,
        startCheckingDeadPeerSubscriptions
    );
};


/*******************************************************************************
* WHEN SERVERS INTRODUCE THEMSELVES, START MONITORING THEIR HEARTBEATS
*******************************************************************************/
const watchPeerHeartbeatEvents = function* () {
    yield takeEvery(
        serverConstants.ACTION_TYPES.SET_LAST_HEARTBEAT_FOR_PEER,
        checkMonitorForPeer
    );
};

export default {
    setupServerSaga: function* () {

        const sagas = [
            watchStartServerSetupRequests,
            watchFinishServerSetupRequests
        ];

        yield sagaUtils.spawnAutoRestartingSagas( sagas );
    },
    syncSaga: function* () {

        const sagas = [
            watchStartSyncSubscriptionWarmupRequests,
            watchStartSendingSyncHeartbeatRequests,
            watchLoadRateLimiterInfoRequests,
            watchStartSavingSubscriptionInfoRequests,
            watchStartCheckingDeadPeerSubscriptionsRequests,
            watchPeerHeartbeatEvents,
        ];

        yield sagaUtils.spawnAutoRestartingSagas( sagas );
    }
};
