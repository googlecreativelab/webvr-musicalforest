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

import ajv                  from 'ajv';

import { deserialize }      from '../s11n';
import { messageSchema }    from './message-schema';

import messageConstants    from './message-constants';

const messageComponents = messageConstants.INCOMING_MESSAGE_COMPONENTS;

/*
 * create a validator object for all incoming messages
 */
let ajvOptions = {
    allErrors:          true,   // log all validation errors, not just first
    removeAdditional:   "all"   // this modifies the original message(!)
};
let validator   = new ajv( ajvOptions );
let validate    = validator.compile( messageSchema );

let messageTypesNotRequiringData = [
    messageConstants.INCOMING_MESSAGE_TYPES.EXIT_ROOM
];

/*
 * validates messages received over the wire against the appropriate schema.
 * called from messageHandler:handleWebsocketMessageWithStore().
 *
 * any kind of validation issue throws an exception, and messageHandler
 * drops the message.
 */
const validateMessage = ( wireMessage ) => {

    let deserializedMessage;

    try {
        deserializedMessage = deserialize( wireMessage );
    }
    catch( error ) {
        throw error;
    }

    // only validate if there's a message type
    if( !deserializedMessage[ messageComponents.ALL_MESSAGES.TYPE ] ) {
        throw new Error( `incoming message has no '${messageComponents.ALL_MESSAGES.TYPE}' property` );
    }

    // only validate if there's message data
    if( !deserializedMessage[ messageComponents.ALL_MESSAGES.DATA ] ) {
        // except for message types that don't require message data
        if( messageTypesNotRequiringData.indexOf( deserializedMessage[ messageComponents.ALL_MESSAGES.TYPE ] ) < 0 ) {
            throw new Error( `incoming message has no '${messageComponents.ALL_MESSAGES.DATA}' property` );
        }
    }

    // only validate if it's an acceptable message type
    if( !isValidMessageType( deserializedMessage[ messageComponents.ALL_MESSAGES.TYPE ] ) ) {
        throw new Error( `incoming message has invalid type '${deserializedMessage[ messageComponents.ALL_MESSAGES.TYPE ]}'` );
    }

    // run the validator
    return validateMessageOfType( deserializedMessage, deserializedMessage[ messageComponents.ALL_MESSAGES.TYPE ] );
};

/*
 * check the provided type is in the top level 'properties' of the messageSchema
 */
const isValidMessageType = ( type ) => {
    return Object.keys( messageSchema.properties ).indexOf( type ) > -1;
};

/*
 * validator function for incoming messages
 */
const validateMessageOfType = ( message, type ) => {

    let objectToValidate = {};
    objectToValidate[ type ] = message;

    let valid = validate( objectToValidate )

    if( valid !== true ) {
        let errorMsgs = validate.errors.map(
            ( error ) => {
                return `${error.dataPath} ${error.message}`;
            }
        );
        let errorMsg = errorMsgs.join( '; ' );
        throw new Error( errorMsg );
    }

    return message;
};

export default {
    validateMessage
};
