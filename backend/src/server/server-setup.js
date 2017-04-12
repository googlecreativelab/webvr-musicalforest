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

import storage              from '@google-cloud/storage';

import { put, select }      from 'redux-saga/effects';
import { delay }            from 'redux-saga';

import { logger }           from '../logger';
import { pubsubClient }     from '../pubsub';
import { getStoreState }    from '../store';

import config               from '../config';

import serverActions        from './server-actions';
import serverConstants      from './server-constants';
import serverSync           from './server-sync';
import serverStartup        from './server-startup';

/*
 * kick off setup, get sync channel topic & subscription
 */
const startServerSetup = function* ( action ) {

    logger.info( `connecting to sync channel '${config.syncTopicName}'` );

    // get the PubSub sync topic
    let topic;
    
    try {
        topic = yield getPubsubSyncTopic();
    }
    catch( error ) {
        logger.error( `pubsub error creating sync channel: ${error.message}` );
        process.exit( 1 );
    }

    // create a subscription for the sync topic
    let subscription;

    try {
        subscription = yield getPubsubSyncSubscriptionForTopic( topic ); 
    }
    catch( error ) {
        logger.error( `pubsub error subscribing to sync channel: ${error.message}` ); 
        process.exit( 1 );
    }

    // set message & error handlers for the sync subscription
    setSyncSubscriptionListeners( subscription );

    // add sync subscription to server state
    yield put( serverActions.setSyncSubscriptionRequestAction( subscription ) );

    // add sync topic to server state
    yield put( serverActions.setSyncTopicRequestAction( topic ) );

    logger.trace( `connected to sync channel, subscription ${subscription.name}` );

    // make sure the pubsub sync topic is warmed up so it doesn't kill monitors
    yield put( serverActions.startSyncSubscriptionWarmupRequestAction() );

    yield put( serverActions.loadRateLimiterInfoRequestAction() );
};

/*
 * warm up the sync channel Pubsub subscription
 */
const startSyncSubscriptionWarmup = function* ( action ) {

    logger.info( `starting sync channel subscription warmup` );

    let syncWarmupStartTime = Date.now();

    while( true ) {
        try {
            yield serverSync.sendSyncMessageOfType(
                null,
                serverConstants.SYNC_MESSAGES.SYNC_WARMUP
            );
        }
        catch( error ) {
            // this will be a PubSub operational issue, and thus transient
        };

        // small delay period = lots of messages = hopefully warm up faster
        yield delay( 10 );

        let syncIsWarmedUp = yield getSyncWarmedUpStatus();

        if( syncIsWarmedUp ) {
            break;
        }
    }

    // ready to roll
    let syncWarmupTotalTime = (Date.now() - syncWarmupStartTime) / 1000;
    logger.trace( `sync channel subscription warmup took ${syncWarmupTotalTime} seconds` );

    // sync channel subscription is warmed up, start up the app/websocket servers
    yield put( serverActions.finishServerSetupRequestAction() );
};

/*
 * work out whether the sync channel is warmed up yet
 */
const getSyncWarmedUpStatus = function* () {

    let receiptTimes = getStoreState().serverReducer.syncWarmup.receiptTimes;

    // make sure we have enough receipt times to make it worth calculating
    if( receiptTimes.length < serverConstants.SYNC_INFO.SYNC_WARMUP_MESSAGE_LIST_LENGTH ) {
        return false;
    }

    // work out the differences between the receipt times
    let differences = [];
    for( let i = 0; i < receiptTimes.length - 1 ; i++ ) {
        differences[ i ] = receiptTimes[ i+1 ] - receiptTimes[ i ];
    }

    // 0 difference means they're still being batched
    let nonZeroDifferences = differences.reduce(
        ( acc, difference ) => {
            if( difference == 0 ) {
                return acc;
            }
            acc.push( 1 );
            return acc;
        },
        []
    );

    // fail if less than half the list are still being batched
    if( nonZeroDifferences.length < ( Math.ceil( serverConstants.SYNC_INFO.SYNC_WARMUP_MESSAGE_LIST_LENGTH ) / 2 ) ) {
        return false;
    }

    // should be warmed up by now
    return true;
}

/*
 * broadcast intro on sync channel, start app/websocket servers
 */
const finishServerSetup = function* ( action ) {

    // decide whether to serve SSL, & get certs from storage if so
    let sslInfo = config.sslInfo.useSsl ? yield getSslCertInfo() : { useSsl: false };

    // start sending heartbeats to the sync channel
    yield put( serverActions.startSendingSyncHeartbeatRequestAction() );

    // start saving ID & sync subscription name to datastore
    // so that peers can clear the subscription if this server dies
    yield put( serverActions.startSavingSubscriptionInfoRequestAction() );

    // start checking the datastore for peer subscription info saved
    // long enough ago that the peer might be dead
    yield put( serverActions.startCheckingDeadPeerSubscriptionsRequestAction() );

    // create the app server & websocket server
    let { app, wsServer, balancer } = serverStartup.startServer( sslInfo );

    // save the app/websocket server & balancer references in the server state
    yield put( serverActions.setAppServerRequestAction( app ) );
    yield put( serverActions.setWebsocketServerRequestAction( wsServer ) );
    yield put( serverActions.setBalancerRequestAction( balancer ) );

};

/*
 * retrieve SSL certificate data from Cloud Storage
 */
const getSslCertInfo = function* () {

    logger.info(
        `retrieving SSL cert data for ${config.sslInfo.sslCertHostName} ` +
        `from bucket ${config.sslInfo.sslStorageBucketName}`
    );

    const gcs           = storage( { projectId: config.projectId } );
    const bucket        = gcs.bucket( config.sslInfo.sslStorageBucketName );
    const privKeyFile   = bucket.file( config.sslInfo.privKeyFileName );
    const fullChainFile = bucket.file( config.sslInfo.fullChainFileName );

    try {

        let privKeyResult = yield privKeyFile.download();
        let privKeyData = privKeyResult[ 0 ];

        let fullChainResult = yield fullChainFile.download();
        let fullChainData = fullChainResult[ 0 ];

        return {
            useSsl: true,
            options: {
                key:    privKeyData,
                cert:   fullChainData
            }
        };

    }

    catch( error ) {

        logger.error(
            `error retrieving SSL cert data for ${config.sslInfo.sslCertHostName}, ` +
            `unable to start SSL: got error code ${error.code} (${error.message}) ` +
            `fetching ${error.response.req.path}`
        );

        process.exit( serverConstants.ERROR_TYPES.BAD_OS_EXIT_ERROR_CODE );
    }
};

const getPubsubSyncTopic = function* () {

    // get the sync topic
    let topic = yield pubsubClient.getPubsubTopic( config.syncTopicName );

    // it should already exist, autoCreate only on first server/app boot.
    // if it throws, let it throw, and be caught & exited above -
    // this is critical to the app running.
    let topicResult = yield topic.get( { autoCreate: true } );
    topic = topicResult[ 0 ];
    return topic;
};

const getPubsubSyncSubscriptionForTopic = function* ( topic ) {

    // create a sync channel subscription for this server
    let subscriptionName    = [ config.syncTopicName, '-', config.serverId ].join( '' ); 

    let subscriptionOptions = {
        autoAck: true,
        maxInProgress: 20
    };

    // subscribe it to the topic
    let subscriptionResult  = yield topic.subscribe( subscriptionName, subscriptionOptions );
    let subscription        = subscriptionResult[ 0 ];
    return subscription;
};

const setSyncSubscriptionListeners = ( subscription ) => {

    // set a message listener
    let syncChannelMessageHandler = ( message ) => {
        serverSync.handleSyncMessageWithLocalServerId( message, config.serverId );
    };

    subscription.on( 'message', syncChannelMessageHandler );

    // set error handler
    let syncChannelErrorHandler = ( error ) => {
        serverSync.handleSyncErrorWithLocalServerId( error, config.serverId );
    };

    subscription.on( 'error', syncChannelErrorHandler );
};

export default {
    startServerSetup,
    startSyncSubscriptionWarmup,
    finishServerSetup
};
