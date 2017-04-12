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

import messageConstants     from './message-constants';
import { messageSchema }    from './message-schema';

/*******************************************************************************
*
* reference of data structure from JSON schema
*
*   {
*      definitions: {
*        ...,
*        room_client_position_update:
*         { type: 'object',
*           properties: [Object],
*           required: [Object] }
*     },
*
*     properties: {
*        ...,
*        room_client_position_update:
*         { '$ref': '#/definitions/room_client_position_update' }
*     }
*   }
*
*   room_client_position_update:  { type: { type: 'string', minLength: 29, maxLength: 29 },
*     data:
*      { type: 'object',
*        properties:
*         { head: [Object],
*           left: [Object],
*           right: [Object],
*           userdata: [Object] },
*        required: [ 'head', 'left', 'right' ] } }
*
********************************************************************************/

/*******************************************************************************
* see https://github.com/acdlite/redux-actions
*
* redux-actions generates action request objects for use as triggers in redux.
*
* example:
* {
*   type: 'INCREMENT',
*   payload: 42,
*   otherVar: true
* }
*
*******************************************************************************/

// generates 'redux-actions' action functions for all incoming message types in schema
const messageRequestActions = Object.keys( messageSchema.properties ).reduce(

    // for each key in messageSchema.properties
    ( acc, type ) => {

        // create a function which ...
        let fn = function() {
            // combines the provided type with fn args to generate an action request object
            return Object.assign( { type }, arguments[ 0 ] );
        };

        // key the function by the incoming message type name, to export them all
        acc[ type ] = fn;
        return acc;
    },

    {} // empty starting accumulator
);

// export the generated functions for use as "import messageActions from 'message-actions'"
export default messageRequestActions;
