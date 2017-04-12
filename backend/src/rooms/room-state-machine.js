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

/*
 * heavily inspired by, and modified to
 * accommodate multiple-room states from:
 * https://github.com/realb0t/redux-state-machine
 * 
 * basically provides a simple Redux wrapper around
 * https://github.com/jakesgordon/javascript-state-machine
 *
 * dynamically creates a new FSM/state-store per room
 * when requested in Redux actions, e.g.:
 * { type: 'ACTION_TYPE', roomName: 'my-room' }
 */
import StateMachine         from 'javascript-state-machine';
import sizeof               from 'object-sizeof';
import { fill, zipObject }  from 'lodash';

import { logger }           from '../logger';
import { initStateObject }  from '../utils/reducer-utils';

import roomNames            from './room-names';
import roomStateConstants   from './room-state-constants';

const initialFsmState = roomStateConstants.STATES.INIT;

/**
 * Return new state object with status param
 * @param  {String} status status name param
 * @param  {Object} { action, error } addition params
 * @return {Object} new state object
 */
const buildState = ( status, { action = null, error = null } = {} ) => {
    return { [ status ]: true, action, error, status };
}

/**
 * Default state object
 * @type {Object}
 */
const defaultState = {};

/**
 * @param {Object} fsmConfig - Config as for javascript-state-machine
 */
const reducerBuilder = ( fsmConfig ) => {

    const { events }    = fsmConfig;
    const eventNames    = events.map( ( event ) => { return event.name; } );
    const eventExists    = zipObject(
        eventNames,
        fill( Array( eventNames.length ), true, 0, eventNames.length )
    );

    // list of state machine objects keyed by room name
    const machines = ( () => {
        let createFunction = () => {
            return StateMachine.create(
                Object.assign( {}, fsmConfig, { initialFsmState } )
            );
        };

        return initStateObject( roomNames, createFunction, 'room state machines', logger );
    } )();

    // dictionary of
    // .rooms:          machine-state objects for rooms to be keyed by room name
    // .roomsByState:   lists of rooms keyed by current state
    const states = ( () => {

        let createFunction = () => {
            return buildState( initialFsmState );
        };

        return {
            // objects containing the state for the machine for each room
            rooms: initStateObject( roomNames, createFunction, 'room state objects', logger ),

            // lookup table of which rooms are in which state on this server
            roomsByState: ( () => {

                let r = {};

                Object.keys( roomStateConstants.STATES ).forEach(
                    ( stateName ) => {
                        r[ roomStateConstants.STATES[ stateName ] ] = {};
                    }
                );

                roomNames.forEach(
                    ( roomName ) => {
                        r[ roomStateConstants.STATES.INIT ][ roomName ] = true;
                    }
                );

                logger.trace( `initialised lookup table of ${Object.keys( r[ roomStateConstants.STATES.INIT ] ).length} rooms to INIT state` );

                return r;
            } )()
        };

    } )();

    // Create reducer function
    const reducer = ( state = states, action ) => {

        // ignore events the FSM doesn't handle
        if (typeof eventExists[ action.type ] === 'undefined') {
            return state;
        }

        if( typeof action.type === 'undefined' ) {
            logger.warn( `state-machine cannot execute ${action.type} action.type, check room-state-constants` );
            return state;
        }

        if( typeof action.roomName === 'undefined' ) {
            return state;
        }

        // make sure this is a room we have a state machine for
        if( typeof machines[ action.roomName ] === 'undefined' ) {
            logger.warn( `FSM for room ${action.roomName} does not exist` );
            return state;
        }

        // make sure the states this module keeps track of includes this room
        if( typeof states.rooms[ action.roomName ] === 'undefined' ) {
            logger.warn( `FSM state for room ${action.roomName} does not exist` );
            return state;
        }

        /*
        logger.warn( `state machine asked to do ${action.type} from ${states.rooms[ action.roomName ].status}` );
        */

        // keep the two in sync
        if ( machines[ action.roomName ].current !== states.rooms[ action.roomName ].status ) {
            machines[ action.roomName ].current = states.rooms[ action.roomName ].status;
        }

        // check the requested transition is possible
        if ( machines[ action.roomName ].cannot( action.type ) ) {
            logger.error( `room ${action.roomName} cannot do ${action.type} from ${states.rooms[ action.roomName ].status}` );
            // set error if not
            states.rooms[ action.roomName ] = {
                status: states.rooms[ action.roomName ].status,
                error: true,
                [ states.rooms[ action.roomName ].status ]: true,
                action
            };

            return states;
        }

        let previousState = states.rooms[ action.roomName ].status;

        // fire event as function
        machines[ action.roomName ][ action.type ]( action );

        // return state list containing new state for this room after transition
        states.rooms[ action.roomName ] = {
            status: JSON.parse( JSON.stringify( machines[ action.roomName ].current ) ),
            error: null,
            [ JSON.parse( JSON.stringify( machines[ action.roomName ].current ) ) ]: true,
            action
        };

        // states.roomsByState[ STATES.FETCHING_TOPIC ][ 'mrko' ] = true;
        states.roomsByState[ states.rooms[ action.roomName ].status ][ action.roomName ] = true;
        states.roomsByState[ previousState ][ action.roomName ] = null;
        delete states.roomsByState[ previousState ][ action.roomName ];

        /*
        logger.warn( `state machine did ${action.type} on ${action.roomName}` );
        logger.warn( `room ${action.roomName} is now in state ${states.rooms[ action.roomName ].status}` );
        */

        return states;
    };

    // Open FSMs
    reducer.machines = machines;
    reducer.states = states;
    reducer.eventExists = eventExists;

    return reducer;
};

export default reducerBuilder;
