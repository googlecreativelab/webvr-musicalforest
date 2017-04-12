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

import sizeof           from 'object-sizeof';

import { handleActions }    from 'redux-actions';

const initStateObject = ( roomNames, createFunction, objectLabel, logger ) => {

    let obj = {};

    let start = Date.now();

    roomNames.forEach(
        ( name ) => {
            obj[ name ] = createFunction();
        }
    );

    let finish = Date.now();

    let millis  = finish - start;
    let seconds = millis / 1000;

    let sizeofBytesUsed     = sizeof( obj );
    let sizeofKbytesUsed    = Math.round( sizeofBytesUsed / 1024 );
    let sizeofMbytesUsed    = sizeofBytesUsed / 1024 / 1024;

    logger.trace(
        `initialised ${Object.keys( obj ).length} ${objectLabel} `
        + `using ~${sizeofKbytesUsed}KiB `
        + `(${sizeofMbytesUsed.toFixed( 2 )}MiB) `
        + `in ${seconds} seconds`
    );

    return obj;

};

// redux-ignore higher order reducer
// adapted from https://github.com/omnidan/redux-ignore
const filterActions = ( () => {

    return function ( reducer ) {

        var actions = arguments.length <= 1 || arguments[ 1 ] === undefined ? [] : arguments[ 1 ];

        var isInList = ( action ) => {
            return actions.indexOf( action.type ) >= 0;
        };

        var initialState = reducer( undefined, {} );

        return function () {

            var state = arguments.length <= 0 || arguments[ 0 ] === undefined ? initialState : arguments[ 0 ];
            var action = arguments[ 1 ];

            if ( !isInList( action ) ) {
                return state;
            }

            return  reducer( state, action );
        };
    };
})();

const createFilteredActionHandler = ( actionHandlers, initialState ) => {

    let actionHandlerNames = Object.keys( actionHandlers );

    const actionHandler = filterActions(
        handleActions( actionHandlers, initialState ),
        actionHandlerNames
    );

    return actionHandler;
}

export {
    initStateObject,
    filterActions,
    createFilteredActionHandler
};
