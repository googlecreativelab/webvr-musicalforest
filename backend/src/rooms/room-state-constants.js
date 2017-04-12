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

const MODULE_NAME   = 'room-state';

const EVENT_TYPES = ( () => {
    let eventTypes = {

        START_ROOM_SETUP:               'start_room_setup',
        START_ROOM_SETUP_SUCCESS:       'start_room_setup_success',
        START_ROOM_SETUP_FAILURE:       'start_room_setup_failure',

        INIT_ROOM_CONTENT:              'init_room_content',
        INIT_ROOM_CONTENT_SUCCESS:      'init_room_content_success',
        INIT_ROOM_CONTENT_FAILURE:      'init_room_content_failure',
        
        START_HEARTBEAT:                'start_heartbeat',
        START_HEARTBEAT_SUCCESS:        'start_heartbeat_success',
        START_HEARTBEAT_FAILURE:        'start_heartbeat_failure',

        PROCESS_QUEUE:                  'process_queue',
        PROCESS_QUEUE_SUCCESS:          'process_queue_success',
        PROCESS_QUEUE_FAILURE:          'process_queue_failure',

        SET_ROOM_FULL:                  'set_room_full',
        UNSET_ROOM_FULL:                'unset_room_full',

        CHECK_IF_EMPTY:                 'check_if_empty',
        EMPTY_CHECK_SUCCESS:            'empty_check_success',
        EMPTY_CHECK_FAILURE:            'empty_check_failure',

        STOP_HEARTBEAT:                 'stop_heartbeat',
        STOP_HEARTBEAT_SUCCESS:         'stop_heartbeat_success',
        STOP_HEARTBEAT_FAILURE:         'stop_heartbeat_failure',

        CLOSE:                          'close',
        RESET:                          'reset',
        RESET_DONE:                     'reset_done'
    };
    
    Object.keys( eventTypes ).forEach(
        ( eventType ) => {
            eventTypes[ eventType ] = `${MODULE_NAME}/${eventTypes[ eventType ]}`;
        }
    );

    return eventTypes;

})();

const STATES = ( () => {
    let stateNames = {
        INIT:                   'init',
        ERROR:                  'error',

        STARTING_ROOM_SETUP:    'starting_room_setup',
        ROOM_SETUP_STARTED:     'room_setup_started',

        INITING_ROOM_CONTENT:   'initing_room_content',
        ROOM_CONTENT_INITED:    'room_content_inited',

        STARTING_HEARTBEAT:     'starting_heartbeat',
        HEARTBEAT_STARTED:      'heartbeat_started',

        STOPPING_HEARTBEAT:     'stopping_heartbeat',
        HEARTBEAT_STOPPED:      'heartbeat_stopped',

        PROCESSING_QUEUE:       'processing_queue',

        ROOM_FULL:              'room_full',
        READY:                  'ready',

        CHECKING_IF_EMPTY:      'checking_if_empty',
        ROOM_EMPTY:             'room_empty',

        RESETTING:              'resetting'
    };

    Object.keys( stateNames ).forEach(
        ( stateName ) => {
            stateNames[ stateName ] = `${MODULE_NAME}/${stateNames[ stateName ]}`;
        }
    );

    return stateNames;

})();

export {
    EVENT_TYPES,
    STATES
};

export default {
    EVENT_TYPES,
    STATES
};
