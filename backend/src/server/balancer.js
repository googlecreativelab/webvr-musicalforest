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

import { logger }           from '../logger';
import { messageConstants } from '../messages';
import { roomNames }        from '../rooms';

import {
    dsClient,
    datastoreConstants
}
from '../datastore';

import config               from '../config';
import { urlUtils }         from '../utils';
import roomStateConstants   from '../rooms/room-state-constants';
import { getStoreState }    from '../store';

import { privatiseTargetServerIfLocal } from './target-server-utils';
import { CUSTOM_PROXY_HEADERS }         from './server-constants';

const getBalancerFunction = ( proxy ) => {

    let lastPortUsed = 0;
    let headsetTypes = Object.values( messageConstants.HEADSET_TYPES );

    let serverReducer = getStoreState().serverReducer;
    let ring = serverReducer.hashRing;

    return ( req, socket, head ) => {

        // make sure client didn't try to use our custom headers
        Object.values( CUSTOM_PROXY_HEADERS ).forEach(
            ( headerName ) => {
                delete req.headers[ headerName ];
            }
        );

        let target;
        let requestInfo;

        // work out headsetType & optional roomName from URL
        try {
            requestInfo = urlUtils.getClientInfoFromUrl( req.url );

            // pass headset type in custom proxy request header
            req.headers[ CUSTOM_PROXY_HEADERS.X_CLIENT_HEADSET_TYPE ] = requestInfo.clientHeadsetType;

            // pass requested room name if present
            if( typeof requestInfo.roomName !== 'undefined' ) {
                req.headers[ CUSTOM_PROXY_HEADERS.X_REQUESTED_ROOM_NAME ] = requestInfo.roomName;
            }
        }
        catch( error ) {
            // WS client requested an invalid URL
            // forward to any WS server to close the connection gracefully
            target = 'ws://' + privatiseTargetServerIfLocal( ring.get( req.url ) );
            req.headers[ CUSTOM_PROXY_HEADERS.X_PLEASE_CLOSE_THIS_CONNECTION ] = true;
            proxy.ws( req, socket, head, { target } );

            return;
        }

        // a room was specified
        if( typeof requestInfo.roomName !== 'undefined' ) {

            // but it wasn't one in the pre-defined list
            if( roomNames.indexOf( requestInfo.roomName ) < 0 ) {

                // forward to any WS server to close the connection gracefully
                target = 'ws://' + privatiseTargetServerIfLocal( ring.get( req.url ) );
                req.headers[ CUSTOM_PROXY_HEADERS.X_PLEASE_CLOSE_THIS_CONNECTION ] = true;
                proxy.ws( req, socket, head, { target } );

                return;
            }

            // the specified room name was valid, proxy to the appropriate server
            target = 'ws://' + privatiseTargetServerIfLocal( ring.get( requestInfo.roomName ) );

            // tell the WS server this room was specified directly by the client
            req.headers[ CUSTOM_PROXY_HEADERS.X_CLIENT_SPECIFIED_ROOM_NAME ] = true;
            proxy.ws( req, socket, head, { target } );
        }

        // no room was specified, choose one
        else {

            let chosenRoomName;

            // try to find one with availability for this type
            let state   = getStoreState();
            let avails  = state.roomDataReducer.avails[ requestInfo.clientHeadsetType ];
            let availableRoomNames = Object.keys( avails );
            let availableRoomCount = availableRoomNames.length;

            if( availableRoomCount > 0 ) {
                // choose one at random from the available list
                chosenRoomName = availableRoomNames[ Math.floor( Math.random() * availableRoomCount ) ];
            }

            // otherwise, get an empty room that's servable from this server
            else {

                let emptyRoomNames      = Object.keys( state.roomStateReducer.roomsByState[ roomStateConstants.STATES.INIT ] );
                let servableRoomNames   = state.serverReducer.servableRooms;

                let servableEmptyRoomNames  = containsAll( emptyRoomNames, servableRoomNames );
                let servableEmptyRoomCount  = servableEmptyRoomNames.length;

                if( servableEmptyRoomCount === 0 ) {
                    // client has to try again
                    return;
                }

                chosenRoomName = servableEmptyRoomNames[ Math.floor( Math.random() * servableEmptyRoomCount ) ];
            }

            // the specified room name was valid, proxy to the appropriate server
            target = 'ws://' + privatiseTargetServerIfLocal( ring.get( chosenRoomName ) );

            req.headers[ CUSTOM_PROXY_HEADERS.X_REQUESTED_ROOM_NAME ] = chosenRoomName;
            proxy.ws( req, socket, head, { target } );
        }
    }
};

// http://stackoverflow.com/a/11076088
// ES6 arrow functions don't bind 'arguments'
// so this has to be a 'function()'
const containsAll = function(/* pass all arrays here */) {
    var output = [];
    var cntObj = {};
    var array, item, cnt;

    // for each array passed as an argument to the function
    for (var i = 0; i < arguments.length; i++) {
        array = arguments[i];
        // for each element in the array
        for (var j = 0; j < array.length; j++) {
            item = "-" + array[j];
            cnt = cntObj[item] || 0;
            // if cnt is exactly the number of previous arrays, 
            // then increment by one so we count only one per array
            if (cnt == i) {
                cntObj[item] = cnt + 1;
            }
        }
    }

    // now collect all results that are in all arrays
    for (item in cntObj) {
        if (cntObj.hasOwnProperty(item) && cntObj[item] === arguments.length) {
            output.push(item.substring(1));
        }
    }

    return(output);
};    

export {
    getBalancerFunction
};
