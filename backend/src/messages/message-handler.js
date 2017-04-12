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

import {
    roomDataActions,
    roomContentConstants,
    roomDataConstants,
    roomStateConstants
} from '../rooms';

import { logger }                       from '../logger';
import { roomStateActions }             from '../rooms'
import { serialize }                    from '../s11n';
import { sendWsMessageWithLogger }      from '../utils/websocket-utils';

import {
    dispatchStoreAction,
    getStoreState
} from '../store';

import config                           from '../config';

import messageActions                   from './message-actions';
import messageConstants                 from './message-constants';
import { perMessageTypeRateLimiter }    from './message-rate-limiter';
import messageValidator                 from './message-validator';

const messageComponents = messageConstants.INCOMING_MESSAGE_COMPONENTS;

/*******************************************************************************
* HANDLER FOR INCOMING ROOM MESSAGES FROM THIS SERVER'S WEBSOCKET CLIENTS
*******************************************************************************/

/*
 * this function validates an incoming message against the JSON message schema,
 * and dispatches successfully validated messages to the appropriate handler
 * defined in messageActions, generated from the message types in the schema.
 */
const handleWebsocketMessage = ( ws, message ) => {

    // drop empty messages
    if( typeof message === 'undefined' || message === '' || message === null ) {
        return;
    }

    // make sure the client's in a room
    if( typeof ws.currentRoom === 'undefined' ) {
        return;
    }

    // make sure message format is valid, drop any invalid messages
    let validatedMessage;

    try {
        validatedMessage = messageValidator.validateMessage( message );
    }
    catch( error ) {
        logger.debug( `error validating incoming message from client ${ws.id}: ${error.message}` );
        return;
    }

    // messageActions exports action functions generated from schema, hence keyed the same
    let validatedMessageType = validatedMessage[ messageComponents.ALL_MESSAGES.TYPE ];

    // if rate limiting's switched off
    if( config.rateLimitInfo.perMessageTypeRateLimit === false ) {
        // handle the message straightaway
        handleValidatedMessageOfTypeForWebsocket( validatedMessage, validatedMessageType, ws );
        return;
    }

    // otherwise, rate-limit messages per type, per client
    const rateLimiterNamespace = `${ws.id}/${validatedMessageType}`;

    perMessageTypeRateLimiter.consume( rateLimiterNamespace )
        // as long as the client is within limits for this message type
        .then(
            () => {
                // handle the message
                handleValidatedMessageOfTypeForWebsocket( validatedMessage, validatedMessageType, ws );
            }
        )
        // otherwise
        .catch(
            ( error ) => {
                // silently drop the message
            }
        );

};

const handleValidatedMessageOfTypeForWebsocket = ( validatedMessage, validatedMessageType, ws ) => {

    // add id to msg, dispatch generated messageAction required by message type
    let attributedMessage = {
        ws,
        [ messageComponents.ALL_MESSAGES.FROM ]:       ws.id,
        [ messageComponents.ALL_MESSAGES.MSG ]:        validatedMessage
    };

    // tell the message saga which room it's in
    attributedMessage.roomName = ws.currentRoom;

    // check the room is in the right state to receive messages
    let roomState   = getStoreState().roomStateReducer.rooms[ ws.currentRoom ];

    // rooms need to be in specific states to accept messages
    let roomStatesAcceptingMessages = [
        roomStateConstants.STATES.READY,
        roomStateConstants.STATES.ROOM_FULL
    ];

    if( roomStatesAcceptingMessages.indexOf( roomState.status ) < 0 ) {

        let roomNotReadyMessage = {
            from: config.serverId,
            msg: {
                type: messageConstants.ERROR_TYPES.ROOM_NOT_READY
            }
        };

        sendWsMessageWithLogger( ws, roomNotReadyMessage, logger );

        return;
    }

    dispatchStoreAction( messageActions[ validatedMessageType ]( attributedMessage ) );

};

export default {
    handleWebsocketMessage
};
