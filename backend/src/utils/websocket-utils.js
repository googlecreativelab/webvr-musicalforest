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

import WebSocket            from 'uws';

import { serialize }        from '../s11n';

import messageConstants     from '../messages/message-constants';

const incomingMsgComponents = messageConstants.INCOMING_MESSAGE_COMPONENTS;
const outgoingMsgComponents = messageConstants.OUTGOING_MESSAGE_COMPONENTS;

const makeWsReplyMessage = ( from, type, data ) => {
    return {
        [ outgoingMsgComponents.ALL_MESSAGES.FROM ]: from,
        [ outgoingMsgComponents.ALL_MESSAGES.MSG ]: {
            [ incomingMsgComponents.ALL_MESSAGES.TYPE ]: type,
            [ incomingMsgComponents.ALL_MESSAGES.DATA ]: data
        }
    };
};

const makeWsBroadcastMessage = ( from, type, data ) => {
    return {
        [ outgoingMsgComponents.ALL_MESSAGES.TYPE ]: type,
        [ outgoingMsgComponents.ALL_MESSAGES.FROM ]: from,
        [ outgoingMsgComponents.ALL_MESSAGES.MSG ]: {
            [ incomingMsgComponents.ALL_MESSAGES.TYPE ]: type,
            [ incomingMsgComponents.ALL_MESSAGES.DATA ]: data
        }
    };
};

const ackWsSendWithId = ( error, wsId ) => {
    if( !error ) {
        return;
    }

};

const sendWsMessageWithLogger = ( ws, msgObj, logger ) => {

    if( ws.readyState !== WebSocket.OPEN ) {
        return;
    }

    let msg = serialize( msgObj );

    // wrap the ack function so we can log the WS id if it errors
    let ackWsSend = ( ackError ) => {
        try {
            ackWsSendWithId( ackError, ws.id );
        }
        // handle this error because otherwise it's stuck in the callback
        catch( error ) {
            logger.trace( error.message, msg );
        }
    };

    try {
        ws.send( msg, ackWsSend );
    }
    catch( error ) {
        logger.trace( `websocket error trying to send message to client id ${ws.id}: ${error.message}` );
        throw( error );
    }
};

const sendWsErrorWithLogger = ( serverId, ws, errType, errMsg ) => {
    let msgObj = {
        from: serverId,
        msg: {
            type: 'error',
            data: {
                errType,
                detail: errMsg
            }
        }
    };
    sendWsMessageWithLogger( ws, msgObj, logger );
};

export {
    makeWsReplyMessage,
    makeWsBroadcastMessage,
    sendWsMessageWithLogger,
    sendWsErrorWithLogger
};
