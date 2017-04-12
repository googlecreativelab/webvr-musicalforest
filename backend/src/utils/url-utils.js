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

import messageConstants from '../messages/message-constants';

const headsetTypes = Object.values( messageConstants.HEADSET_TYPES );

const getClientInfoFromUrl = ( url ) => {

    let info = url.split( '/' );
    info.shift();

    if( info.length === 1 && info[ 0 ] === '' ) {
        throw new Error( `bad URL: ${url}` );
    }

    if( info.length > 2 ) {
        throw new Error( `bad URL: ${url}` );
    }

    let clientHeadsetType = info[ 0 ];

    if( headsetTypes.indexOf( clientHeadsetType ) < 0 ) {
        throw new Error( `bad headset type: ${clientHeadsetType}` );
    }

    let roomName = info.length > 1 ? info[ 1 ] : undefined;

    if( typeof roomName !== 'undefined' && roomName.length !== 4 ) {
        throw new Error( `bad room name: ${roomName}` );
    }

    return {
        clientHeadsetType,
        roomName
    };

};

export default {
    getClientInfoFromUrl
};
