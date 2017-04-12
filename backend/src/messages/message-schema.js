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

/*******************************************************************************
*
* this module implements a JSON schema for incoming messages.
* it's specified directly as JS objects so we can:
*
* - have comments in the schema
* - include other sections without needing separate JSON files
* - distinguish between JSON schema property names (barewords)
*   and schema entry types ('quoted')
* - dynamically construct the schema's "properties" list
*   from INCOMING_MESSAGE_TYPES constants
*
*******************************************************************************/

import { sphereConstants }  from '../spheres';
import messageConstants     from './message-constants';

// shorthand for dictionary of INCOMING_MESSAGE_TYPES constants
let messageTypes        = messageConstants.INCOMING_MESSAGE_TYPES;
let messageComponents   = messageConstants.INCOMING_MESSAGE_COMPONENTS;


/*******************************************************************************
* UTILITY FUNCTIONS
*******************************************************************************/

// make 'type: "string"' schema definition entry using a messageTypes constant
const makeStringTypeForMessageTypeName = ( name ) => {
    return {
        type: 'string',
        minLength:  ( () => { return name.length; } )(),
        maxLength:  ( () => { return name.length; } )()
    }
};

/*******************************************************************************
* INCOMING MESSAGE TYPE SCHEMA DEFINITIONS
*******************************************************************************/

// exit current room
const exitRoomMessageSchema = {

    type: 'object',

    properties: {

        [ messageComponents.ALL_MESSAGES.TYPE ]: ( () => {
            return makeStringTypeForMessageTypeName( messageTypes.EXIT_ROOM );
        } )()

    },

    required: [ messageComponents.ALL_MESSAGES.TYPE ]
};

// "client position update" message
const updateClientCoordsMessageSchema = {

    type: 'object',

    properties: {

        [ messageComponents.ALL_MESSAGES.TYPE ]: ( () => {
            return makeStringTypeForMessageTypeName( messageTypes.UPDATE_CLIENT_COORDS );
        } )(),

        [ messageComponents.ALL_MESSAGES.DATA ]: {

            type: 'object',

            properties: {
                [ messageComponents.UPDATE_CLIENT_COORDS.HEAD ]:    { '$ref': `#/definitions/${messageComponents.REFERENCES.COORDINATE_SET}` },
                [ messageComponents.UPDATE_CLIENT_COORDS.LEFT ]:    { '$ref': `#/definitions/${messageComponents.REFERENCES.COORDINATE_SET}` },
                [ messageComponents.UPDATE_CLIENT_COORDS.RIGHT ]:   { '$ref': `#/definitions/${messageComponents.REFERENCES.COORDINATE_SET}` },
                // optional spheres, only used if client is holding spheres
                [ messageComponents.UPDATE_CLIENT_COORDS.SPHERES ]: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            [ messageComponents.UPDATE_CLIENT_COORDS.SPHERE_ID ]: {
                                type:   'string',
                                format: 'uuid'
                            },
                            [ messageComponents.UPDATE_CLIENT_COORDS.SPHERE_POSITION ]: { '$ref': `#/definitions/${messageComponents.REFERENCES.COORDINATE}` }
                        },
                        required: [
                            messageComponents.UPDATE_CLIENT_COORDS.SPHERE_ID,
                            messageComponents.UPDATE_CLIENT_COORDS.SPHERE_POSITION
                        ]
                    }
                }
            },

            required: [
                messageComponents.UPDATE_CLIENT_COORDS.HEAD,
                messageComponents.UPDATE_CLIENT_COORDS.LEFT,
                messageComponents.UPDATE_CLIENT_COORDS.RIGHT
            ]
        }
    },

    required: [
        messageComponents.ALL_MESSAGES.TYPE,
        messageComponents.ALL_MESSAGES.DATA
    ]
};

// 'create sphere at position' message
const createSphereOfToneAtPositionMessageSchema = {

    type: 'object',

    properties: {

        [ messageComponents.ALL_MESSAGES.TYPE ]: ( () => makeStringTypeForMessageTypeName( messageTypes.CREATE_SPHERE_OF_TONE_AT_POSITION ) )(),

        [ messageComponents.ALL_MESSAGES.DATA ]: {

            type: 'object',

            properties: {
                [ messageComponents.CREATE_SPHERE_OF_TONE_AT_POSITION.TONE ]: {
                    type:  'number',
                    minimum:    sphereConstants.SPHERE_INFO.LOWEST_TONE,
                    maximum:    sphereConstants.SPHERE_INFO.HIGHEST_TONE
                },
                [ messageComponents.CREATE_SPHERE_OF_TONE_AT_POSITION.POSITION ]: { '$ref': `#/definitions/${messageComponents.REFERENCES.COORDINATE}` }
            },

            required: [
                messageComponents.CREATE_SPHERE_OF_TONE_AT_POSITION.TONE,
                messageComponents.CREATE_SPHERE_OF_TONE_AT_POSITION.POSITION
            ]
        }
    },

    required: [
        messageComponents.ALL_MESSAGES.TYPE,
        messageComponents.ALL_MESSAGES.DATA
    ]
};

// 'grab sphere'
const grabSphereMessageSchema = {

    type:       'object',

    properties: {

        [ messageComponents.ALL_MESSAGES.TYPE ]: ( () => makeStringTypeForMessageTypeName( messageTypes.GRAB_SPHERE ) )(),

        [ messageComponents.ALL_MESSAGES.DATA ]: {

            type: 'object',

            properties: {
                [ messageComponents.GRAB_SPHERE.SPHERE_ID ]: {
                    type:   'string',
                    format: 'uuid'
                }
            },

            required: [ messageComponents.GRAB_SPHERE.SPHERE_ID ]
        }
    },

    required: [
        messageComponents.ALL_MESSAGES.TYPE,
        messageComponents.ALL_MESSAGES.DATA
    ]
};

// 'release sphere'
const releaseSphereMessageSchema = {

    type:       'object',

    properties: {

        [ messageComponents.ALL_MESSAGES.TYPE ]: ( () => makeStringTypeForMessageTypeName( messageTypes.RELEASE_SPHERE ) )(),

        [ messageComponents.ALL_MESSAGES.DATA ]: {

            type: 'object',

            properties: {
                [ messageComponents.RELEASE_SPHERE.SPHERE_ID ]: {
                    type:   'string',
                    format: 'uuid'
                }
            },

            required: [ messageComponents.RELEASE_SPHERE.SPHERE_ID ]
        }
    },

    required: [
        messageComponents.ALL_MESSAGES.TYPE,
        messageComponents.ALL_MESSAGES.DATA
    ]
};

// 'delete sphere'
const deleteSphereMessageSchema = {

    type:       'object',

    properties: {

        [ messageComponents.ALL_MESSAGES.TYPE ]: ( () => makeStringTypeForMessageTypeName( messageTypes.DELETE_SPHERE ) )(),

        [ messageComponents.ALL_MESSAGES.DATA ]: {

            type: 'object',

            properties: {
                [ messageComponents.DELETE_SPHERE.SPHERE_ID ]: {
                    type:   'string',
                    format: 'uuid'
                }
            },

            required: [ messageComponents.DELETE_SPHERE.SPHERE_ID ]
        }
    },

    required: [
        messageComponents.ALL_MESSAGES.TYPE,
        messageComponents.ALL_MESSAGES.DATA
    ]
};

// 'strike sphere'
const strikeSphereMessageSchema = {

    type:       'object',

    properties: {

        [ messageComponents.ALL_MESSAGES.TYPE ]: ( () => makeStringTypeForMessageTypeName( messageTypes.STRIKE_SPHERE ) )(),

        [ messageComponents.ALL_MESSAGES.DATA ]: {

            type: 'object',

            properties: {
                [ messageComponents.STRIKE_SPHERE.SPHERE_ID ]: {
                    type:   'string',
                    format: 'uuid'
                },
                [ messageComponents.STRIKE_SPHERE.VELOCITY ]: {
                    type:       'number',
                    minimum:    sphereConstants.SPHERE_INFO.MINIMUM_STRIKE_VELOCITY,
                    maximum:    sphereConstants.SPHERE_INFO.MAXIMUM_STRIKE_VELOCITY
                }
            },

            required: [
                messageComponents.STRIKE_SPHERE.SPHERE_ID,
                messageComponents.STRIKE_SPHERE.VELOCITY
            ]
        }
    },

    required: [
        messageComponents.ALL_MESSAGES.TYPE,
        messageComponents.ALL_MESSAGES.DATA
    ]
};

// 'set sphere tone'
const setSphereToneMessageSchema = {

    type:       'object',

    properties: {

        [ messageComponents.ALL_MESSAGES.TYPE ]: ( () => makeStringTypeForMessageTypeName( messageTypes.SET_SPHERE_TONE ) )(),

        [ messageComponents.ALL_MESSAGES.DATA ]: {

            type: 'object',

            properties: {
                [ messageComponents.SET_SPHERE_TONE.SPHERE_ID ]: {
                    type:   'string',
                    format: 'uuid'
                },
                [ messageComponents.SET_SPHERE_TONE.TONE ]: {
                    type:       'number',
                    minimum:    sphereConstants.SPHERE_INFO.LOWEST_TONE,
                    maximum:    sphereConstants.SPHERE_INFO.HIGHEST_TONE
                }
            },

            required: [
                messageComponents.SET_SPHERE_TONE.SPHERE_ID,
                messageComponents.SET_SPHERE_TONE.TONE
            ]
        }
    },

    required: [
        messageComponents.ALL_MESSAGES.TYPE,
        messageComponents.ALL_MESSAGES.DATA
    ]
};

// 'set sphere connections'
const setSphereConnectionsMessageSchema = {

    type:       'object',

    properties: {

        [ messageComponents.ALL_MESSAGES.TYPE ]: ( () => makeStringTypeForMessageTypeName( messageTypes.SET_SPHERE_CONNECTIONS ) )(),

        [ messageComponents.ALL_MESSAGES.DATA ]: {

            type: 'object',

            properties: {
                [ messageComponents.SET_SPHERE_CONNECTIONS.SPHERE_ID ]: {
                    type:   'string',
                    format: 'uuid'
                },
                [ messageComponents.SET_SPHERE_CONNECTIONS.CONNECTIONS ]: {
                    type:     'array',
                    items:    {
                        type:   'string',
                        format: 'uuid'
                    }
                }
            },

            required: [
                messageComponents.SET_SPHERE_CONNECTIONS.SPHERE_ID,
                messageComponents.SET_SPHERE_CONNECTIONS.CONNECTIONS
            ]
        }
    },

    required: [
        messageComponents.ALL_MESSAGES.TYPE,
        messageComponents.ALL_MESSAGES.DATA
    ]
};

/*******************************************************************************
* MAPPING FROM INCOMING MESSAGE TYPES TO APPROPRIATE SCHEMA COMPONENTS
********************************************************************************/

const incomingMessageSchemaDefinitions = ( () => {

    let definitions = {};
    let m = messageTypes;

    definitions[ m.EXIT_ROOM ]                          = exitRoomMessageSchema;
    definitions[ m.UPDATE_CLIENT_COORDS ]               = updateClientCoordsMessageSchema;
    definitions[ m.CREATE_SPHERE_OF_TONE_AT_POSITION ]  = createSphereOfToneAtPositionMessageSchema;
    definitions[ m.GRAB_SPHERE ]                        = grabSphereMessageSchema;
    definitions[ m.RELEASE_SPHERE ]                     = releaseSphereMessageSchema;
    definitions[ m.DELETE_SPHERE ]                      = deleteSphereMessageSchema;
    definitions[ m.STRIKE_SPHERE ]                      = strikeSphereMessageSchema;
    definitions[ m.SET_SPHERE_TONE ]                    = setSphereToneMessageSchema;
    definitions[ m.SET_SPHERE_CONNECTIONS ]             = setSphereConnectionsMessageSchema;

    return definitions;

})();


/*******************************************************************************
* COMPONENT DEFINITIONS REFERRED TO IN MESSAGE TYPES, MUST BE INCLUDED IN SCHEMA
********************************************************************************/

const componentDefinitions = {

    // an x-y-z coordinate
    [ messageComponents.REFERENCES.COORDINATE ]: {

        type: 'object',

        properties: {
            [ messageComponents.REF_COORDINATE.X ]: { type: 'number' },
            [ messageComponents.REF_COORDINATE.Y ]: { type: 'number' },
            [ messageComponents.REF_COORDINATE.Z ]: { type: 'number' }
        },

        required: [
            messageComponents.REF_COORDINATE.X,
            messageComponents.REF_COORDINATE.Y,
            messageComponents.REF_COORDINATE.Z
        ]
    },

    // a pair of coordinates for rotation/position
    [ messageComponents.REFERENCES.COORDINATE_SET ]: {

        type: 'object',

        properties: {
            [ messageComponents.REF_COORDINATE_SET.POSITION ]: { '$ref': `#/definitions/${messageComponents.REFERENCES.COORDINATE}` },
            [ messageComponents.REF_COORDINATE_SET.ROTATION ]: { '$ref': `#/definitions/${messageComponents.REFERENCES.COORDINATE}` }
        },

        required: [
            messageComponents.REF_COORDINATE_SET.POSITION,
            messageComponents.REF_COORDINATE_SET.ROTATION
        ]
    }
};

/*******************************************************************************
* COMBINED LIST OF COMPONENT AND MESSAGE DEFINITIONS INCLUDED IN MAIN SCHEMA
********************************************************************************/

const messageSchemaDefinitions = Object.assign(
    componentDefinitions,
    incomingMessageSchemaDefinitions
);


/*******************************************************************************
* PROPERTIES USED IN MAIN SCHEMA
********************************************************************************/

/*
 * list of message types defined as properties in schema,
 * dynamically defined from the list of incoming message schema definitions
 *
 * comes out looking like this, as per JSON schema reqs:
 *
 * properties = {
 *     room_client_position_update: {
 *         '$ref': '#/definitions/room_client_position_update'
 *     }
 * }
 */
const messageSchemaProperties = ( () => {

    let properties = {};

    Object.keys( incomingMessageSchemaDefinitions ).forEach(
        ( messageTypeName ) => {
            properties[ messageTypeName ] = {
                '$ref': `#/definitions/${messageTypeName}`
            }
        }
    );

    return properties;
})();

/*******************************************************************************
* MAIN SCHEMA OBJECT INCORPORATING DEFINITIONS AND PROPERTIES FROM ABOVE
*******************************************************************************/

const messageSchema = {

    // these are type definitions shared by multiple objects
    definitions: messageSchemaDefinitions,

    // these are the various types
    properties: messageSchemaProperties
};

export {
    messageSchema
}
