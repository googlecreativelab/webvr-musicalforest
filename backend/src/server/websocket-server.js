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

import { Server }           from 'uws';
import uuid                 from 'uuid';
import url                  from 'url';

import { logger }           from '../logger';
import { messageHandler }   from '../messages';

import {
    makeWsReplyMessage,
    sendWsMessageWithLogger
} from '../utils/websocket-utils';

import {
    roomDataActions,
    roomStateConstants
} from '../rooms';

import {
    dispatchStoreAction,
    getStoreState
} from '../store';

import config                   from '../config';
import messageConstants         from '../messages/message-constants';
import { perClientRateLimiter } from '../messages/message-rate-limiter';
import { urlUtils }             from '../utils';

import serverActions            from './server-actions';
import serverConstants          from './server-constants';

const CUSTOM_PROXY_HEADERS  = serverConstants.CUSTOM_PROXY_HEADERS;
const outgoingMsgComponents = messageConstants.OUTGOING_MESSAGE_COMPONENTS;

const startWebsocketServer = ( http_server ) => {

    // create websocket server object
    let wssConf = { server: http_server };
    let wss     = new Server( wssConf );

    // predefined 'invalid url' message
    const badUrlMsg = makeWsReplyMessage(
        config.serverId,
        messageConstants.ERROR_TYPES.INVALID_URL
    );

    // predefined 'no rooms available' message
    const noRoomsAvailableMsg = makeWsReplyMessage(
        config.serverId,
        messageConstants.ERROR_TYPES.NO_ROOMS_AVAILABLE
    );
    
    // predefined 'room full' message
    const roomFullMsg = makeWsReplyMessage(
        config.serverId,
        messageConstants.ERROR_TYPES.ROOM_FULL
    );
    
    // set up an incoming websocket connection
    wss.on( 'connection', ( ws ) => {

        let headers = ws.upgradeReq.headers;

        // if the proxy flagged no rooms available, close the connection
        if( typeof headers[ CUSTOM_PROXY_HEADERS.X_NO_ROOMS_AVAILABLE ] !== 'undefined' ) {
            sendWsMessageWithLogger( ws, noRoomsAvailableMsg, logger );
            ws.close();
            return;
        }

        // if the proxy marked the request to be closed, close the connection
        if( typeof headers[ CUSTOM_PROXY_HEADERS.X_PLEASE_CLOSE_THIS_CONNECTION ] !== 'undefined' ) {
            sendWsMessageWithLogger( ws, badUrlMsg, logger );
            ws.close();
            return;
        }

        // if some kind of problem stopped a name being specified, close the connection
        if( typeof headers[ CUSTOM_PROXY_HEADERS.X_REQUESTED_ROOM_NAME ] === 'undefined' ) {
            sendWsMessageWithLogger( ws, badUrlMsg, logger );
            ws.close();
            return;
        }

        // if this server's running in production ...
        if( config.projectId === config.productionEnvironmentProjectId ) {
            // ... and the client didn't provide the correct Origin header
            let parsedUrl = url.parse( headers.origin );
            if( parsedUrl.hostname !== config.productionEnvironmentRequiredOrigin ) {
                sendWsMessageWithLogger( ws, badUrlMsg, logger );
                ws.close();
                return;
            }
        }

        // generate UUID to identify connection
        ws.id = uuid();
        ws.lastAction = Date.now();

        // get the headset type & optional requested room from custom headers set by proxy
        ws.headsetType = ws.upgradeReq.headers[ CUSTOM_PROXY_HEADERS.X_CLIENT_HEADSET_TYPE ];
        ws.requestedRoomName = ws.upgradeReq.headers[ CUSTOM_PROXY_HEADERS.X_REQUESTED_ROOM_NAME ];

        // if the client requested the room directly
        if( typeof headers[ CUSTOM_PROXY_HEADERS.X_CLIENT_SPECIFIED_ROOM_NAME ] !== 'undefined' ) {

            let specifiedRoomName = headers[ CUSTOM_PROXY_HEADERS.X_REQUESTED_ROOM_NAME ];
            let roomState = getStoreState().roomStateReducer;

            // belt & braces
            if( typeof roomState.rooms[ specifiedRoomName ] === undefined ) {
                sendWsMessageWithLogger( ws, badUrlMsg, logger );
                ws.close();
                return;
            }

            // only MAX_CLIENTS_PER_ROOM allowed into client-specified room names
            if( roomState.rooms[ specifiedRoomName ].status === roomStateConstants.STATES.ROOM_FULL ) {
                sendWsMessageWithLogger( ws, roomFullMsg, logger );
                ws.close();
                return;
            }

            // TODO: clients only allowed into rooms with availability for their headset type
            // check against roomDataReducer.avails[ clientHeadsetType ]
            // -- empty rooms also allowed ( roomStateReducer.roomsByState )
        }

        // CLIENT: tell the client its id and the id of the server it's connected to
        let clientMsgData = {
            [ outgoingMsgComponents.CONNECTION_INFO.CLIENT_ID ]: ws.id,
            [ outgoingMsgComponents.CONNECTION_INFO.SERVER_ID ]: config.serverId
        };

        let clientMsg = makeWsReplyMessage(
            config.serverId,
            messageConstants.OUTGOING_MESSAGE_TYPES.CONNECTION_INFO,
            clientMsgData
        );

        try{
            sendWsMessageWithLogger( ws, clientMsg, logger );
        }
        catch( error ) {
            logger.trace( `error sending error message to client ${ws.id} while sending room info:`, error.message );
        }

        // add to the server's state, to make accessible via id
        dispatchStoreAction(
            serverActions.addWebsocketToStateRequestAction( ws )
        );

        // route messages from the connection via message-handler/validator/sagas
        ws.on( 'message', ( message, flags ) => {

            // drop all viewer messages in production?
            if( config.dropViewerMessagesInProduction === true ) {
                if( config.projectId === config.productionEnvironmentProjectId ) {
                    if( ws.headsetType === messageConstants.HEADSET_TYPES.HEADSET_TYPE_VIEWER ) {
                        return;
                    }
                }
            }

            // keep track of last time client did anything for inactivity-timeout
            ws.lastAction = Date.now();

            if( config.rateLimitInfo.perClientRateLimit === true ) {

                // rate-limit overall msg rate per client
                perClientRateLimiter.consume( ws.id )
                    .then( () => {
                        messageHandler.handleWebsocketMessage( ws, message );
                     })
                    .catch( () => {} );
            }
            else {
                messageHandler.handleWebsocketMessage( ws, message );
            }

        } );

        // add a handler for when the connection closes
        ws.on( 'close', () => {

            if( ws.currentRoom ) {

                logger.trace( `client ${ws.id} disconnected, leaving room ${ws.currentRoom}` );
                dispatchStoreAction(
                    roomDataActions.removeLocalClientFromRoomRequestAction(
                        ws.id,
                        ws.currentRoom
                    )
                );
            }
            else {
                logger.trace( `client ${ws.id} disconnected, not from any room` );
            }

            // remove from the server's state, to make inaccessible via id
            dispatchStoreAction(
                serverActions.removeWebsocketFromStateRequestAction( ws )
            );

        } );

        // belt & braces
        ws.on( 'error', ( error ) => {
           logger.warn( `websocket error on connection ${ws.id}: ${error.message}` );
        } );

    } );

    return wss;
};

export default {
    startWebsocketServer
};
