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

import { HEADSET_TYPES } from '../messages/message-constants';

const ACTION_TYPES = {

    ADD_WEBSOCKET_TO_QUEUE_FOR_ROOM:                'add_websocket_to_queue_for_room',
    REMOVE_WEBSOCKET_FROM_QUEUE_FOR_ROOM:           'remove_websocket_from_queue_for_room',
    ADD_LOCAL_CLIENT_TO_ROOM:                       'add_local_client_to_room',
    REMOVE_LOCAL_CLIENT_FROM_ROOM:                  'remove_local_client_from_room',

    // room setup/teardown
    UPDATE_LAST_HEARTBEAT_FOR_ROOM:                 'update_last_heartbeat_for_room',
    SET_HEARTBEAT_TASK_FOR_ROOM:                    'set_heartbeat_task_for_room',
    REMOVE_HEARTBEAT_TASK_FOR_ROOM:                 'remove_heartbeat_task_for_room',
    CANCEL_HEARTBEAT_TASK_FOR_ROOM:                 'cancel_heartbeat_task_for_room',
    CHECK_FOR_EMPTY_ROOM:                           'check_for_empty_room',

    // client state actions
    SET_COORDS_FOR_CLIENT_IN_ROOM:                  'set_coords_for_client_in_room',
    REMOVE_CLIENT_FROM_ROOM:                        'remove_client_from_room',

    // sphere state actions
    ADD_SPHERE_OF_TONE_AT_POSITION_IN_ROOM:         'add_sphere_of_tone_at_position_in_room',
    SET_POSITION_FOR_SPHERE_IN_ROOM:                'set_position_for_sphere_in_room',
    SET_TONE_FOR_SPHERE_IN_ROOM:                    'set_tone_for_sphere_in_room',
    SET_CONNECTIONS_FOR_SPHERE_IN_ROOM:             'set_connections_for_sphere_in_room',
    CREATE_HOLD_ON_SPHERE_FOR_CLIENT_IN_ROOM:       'create_hold_on_sphere_for_client_in_room',
    SET_HOLD_TIMEOUT_TASK_FOR_SPHERE_IN_ROOM:       'set_hold_timeout_task_for_sphere_in_room',
    DELETE_HOLD_TIMEOUT_TASK_FOR_SPHERE_IN_ROOM:    'delete_hold_timeout_task_for_sphere_in_room',
    REMOVE_HOLD_ON_SPHERE_FOR_CLIENT_IN_ROOM:       'remove_hold_on_sphere_for_client_in_room',
    DELETE_SPHERE_FROM_ROOM:                        'delete_sphere_from_room',

    // publish to clients in room
    PUBLISH_MESSAGE_TO_ROOM:                        'publish_message_to_room'
};

const CLIENT_INFO = {
    CLIENT_TYPE_LOCAL:  'client_type_local',
    CLIENT_TYPE_REMOTE: 'client_type_remote',
    CLIENT_INACTIVITY_TIMEOUTS_IN_MS: {
        [ HEADSET_TYPES.HEADSET_TYPE_3DOF ]:    120000, // 2m
        [ HEADSET_TYPES.HEADSET_TYPE_6DOF ]:    120000, // 2m
        [ HEADSET_TYPES.HEADSET_TYPE_VIEWER ]:  120000, // 2m
    },
    CLIENT_INACTIVITY_TIMEOUT_CHECKS_IN_MS: {
        [ HEADSET_TYPES.HEADSET_TYPE_3DOF ]:    30000, // 30s
        [ HEADSET_TYPES.HEADSET_TYPE_6DOF ]:    30000, // 30s
        [ HEADSET_TYPES.HEADSET_TYPE_VIEWER ]:  30000, // 30s
    }
};

const ERROR_TYPES = {
    ROOM_TIMEOUT:       'room_timeout',
    JOINING_ROOM:       'error_joining_room',
    ROOM_FULL:          'error_room_full',
    WAITING_FOR_STATE:  'waiting_for_state'
};

const ROOM_INFO = {
    MINIMUM_SOUNDBANK_NUMBER:   0,
    MAXIMUM_SOUNDBANK_NUMBER:   2
};

const SPHERE_INFO = {
    SPHERE_HOLD_TIMEOUT_IN_MS:          10000,
    SPHERE_HOLD_TIMEOUT_CHECK_IN_MS:    2500
};

export default {
    ACTION_TYPES,
    CLIENT_INFO,
    ERROR_TYPES,
    ROOM_INFO,
    SPHERE_INFO
};
