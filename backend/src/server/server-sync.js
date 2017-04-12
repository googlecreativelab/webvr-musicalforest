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

import { select }                   from 'redux-saga/effects';

import { logger }                   from '../logger';
import { serialize, deserialize }   from '../s11n';

import config                       from '../config';

import serverConstants              from './server-constants';
import serverSyncHandlers           from './server-sync-handlers';

// wrapped in a closure because node.js doesn't seem to parse dots in object literal key definitions
const handlerFunctions = ( () => {
    let m = serverConstants.SYNC_MESSAGES;

    let obj = {};
    obj[ m.SYNC_WARMUP ]            = serverSyncHandlers.handleSyncWarmup;
    obj[ m.SYNC_HEARTBEAT ]         = serverSyncHandlers.handleSyncHeartbeat;
    obj[ m.LOAD_RATE_LIMITER_INFO ] = serverSyncHandlers.handleLoadRateLimiterInfo;

    return obj;
} )();

const handleSyncMessageWithLocalServerId = ( message, localServerId ) => {

    let msgPayload = deserialize( message.data );

    // the only self-sent messages servers care about is warmup
    let interestingSelfSentMessageTypes = [
        serverConstants.SYNC_MESSAGES.SYNC_WARMUP
    ];

    // disregard uninteresting local messages
    if( interestingSelfSentMessageTypes.indexOf( msgPayload.type ) < 0 ) {
        if( msgPayload.from === localServerId ) {
            return;
        }
    }

    if( handlerFunctions[ msgPayload.type ] ) {
        handlerFunctions[ msgPayload.type ]( msgPayload, localServerId );
    }
    else {
        logger.trace( `got sync message of type ${msgPayload.type}: `, msgPayload );
    }

};

const handleSyncErrorWithLocalServerId = ( error, localServerId ) => {
    logger.error( `server ${localServerId} exiting because of error on sync channel: ${error.message}` );
    process.exit( 1 );
};

const sendSyncMessageOfType = function* ( message, type ) {

    let serverState     = yield select( ( state ) => { return state.serverReducer; } );
    let syncTopic       = serverState.syncTopic;

    let messageObject   = {
        from:   config.serverId,
        type:   type
    };

    if( message ) {
        messageObject.data = message;
    }

    let serializedMessage   = serialize( messageObject );

    return yield syncTopic.publish( serializedMessage );
};

export default {
    handleSyncMessageWithLocalServerId,
    handleSyncErrorWithLocalServerId,
    sendSyncMessageOfType
};
