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

const sphereIdLabel     = 'spId';
const clientIdLabel     = 'cId';
const holderIdLabel     = 'hId';
const serverIdLabel     = 'srId';
const toneLabel         = 't';
const positionLabel     = 'p';
const rotationLabel     = 'r';
const headLabel         = 'h';
const leftLabel         = 'l';
const rightLabel        = 'r';
const sphereLabel       = 's';
const headsetTypeLabel  = 'ht';
const velocityLabel     = 'v';
const connectionsLabel  = 'c';
const meristemLabel     = 'm';

const fromLabel         = 'f';
const typeLabel         = 't';
const dataLabel         = 'd';
const msgLabel          = 'm';

const roomNameLabel     = 'rn';
const soundbankLabel    = 'sb';
const clientsLabel      = 'c';
const spheresLabel      = 's';

const INCOMING_MESSAGE_TYPES = {

    EXIT_ROOM:                          'e_r',

    UPDATE_CLIENT_COORDS:               'u_c_c',    // position msg for individual client

    CREATE_SPHERE_OF_TONE_AT_POSITION:  'c_s_o_t_a_p',
    GRAB_SPHERE:                        'g_s',
    RELEASE_SPHERE:                     'r_s',
    DELETE_SPHERE:                      'd_s',
    STRIKE_SPHERE:                      's_s',
    SET_SPHERE_TONE:                    's_s_t',
    SET_SPHERE_CONNECTIONS:             's_s_c'
};

const INCOMING_MESSAGE_COMPONENTS = {
    ALL_MESSAGES: {
        FROM:   fromLabel,
        MSG:    msgLabel,
        TYPE:   typeLabel,
        DATA:   dataLabel
    },
    REFERENCES: {
        COORDINATE:     'coordinate',
        COORDINATE_SET: 'coordinateSet'
    },
    REF_COORDINATE: {
        X:  'x',
        Y:  'y',
        Z:  'z'
    },
    REF_COORDINATE_SET: {
        POSITION:   positionLabel,
        ROTATION:   rotationLabel
    },
    UPDATE_CLIENT_COORDS: {
        HEAD:               headLabel,
        LEFT:               leftLabel,
        RIGHT:              rightLabel,
        SPHERES:            spheresLabel,
        SPHERE_ID:          sphereIdLabel,
        SPHERE_POSITION:    positionLabel
    },
    CREATE_SPHERE_OF_TONE_AT_POSITION: {
        TONE:   toneLabel,
        POSITION:   positionLabel
    },
    GRAB_SPHERE: {
        SPHERE_ID:  sphereIdLabel
    },
    RELEASE_SPHERE: {
        SPHERE_ID: sphereIdLabel
    },
    DELETE_SPHERE: {
        SPHERE_ID: sphereIdLabel
    },
    STRIKE_SPHERE: {
        SPHERE_ID:  sphereIdLabel,
        VELOCITY:   velocityLabel
    },
    SET_SPHERE_TONE: {
        SPHERE_ID:  sphereIdLabel,
        TONE:       toneLabel
    },
    SET_SPHERE_CONNECTIONS: {
        SPHERE_ID:      sphereIdLabel,
        CONNECTIONS:    connectionsLabel
    }
};

const OUTGOING_MESSAGE_TYPES = {

    CONNECTION_INFO:                    'c_i',          // sent to new clients on connect
    ROOM_STATUS_INFO:                   'r_s_i',        // sent to new clients on joining a room
    ROOM_EXIT_SUCCESS:                  'r_e_s',        // sent to clients leaving a room

    ROOM_HEARTBEAT:                     'r_h',          // server heartbeat message for a room

    ROOM_CLIENT_JOIN:                   'r_c_j',        // sent to existing clients on client join
    ROOM_CLIENT_EXIT:                   'r_c_e',        // sent to remaining clients on client exit
    ROOM_CLIENT_COORDS_UPDATED:         'r_c_c_u',

    ROOM_SPHERE_CREATED:                'r_s_c',
    ROOM_SPHERE_GRABBED:                'r_s_g',
    ROOM_SPHERE_POSITION_UPDATED:       'r_s_p_u',
    ROOM_SPHERE_TONE_SET:               'r_s_t_s',
    ROOM_SPHERE_CONNECTIONS_SET:        'r_s_c_s',
    ROOM_SPHERE_RELEASED:               'r_s_r',
    ROOM_SPHERE_STRUCK:                 'r_s_s',
    ROOM_SPHERE_DELETED:                'r_s_d',

    CREATE_SPHERE_DENIED:               'c_s_d',
    CREATE_SPHERE_SUCCESS:              'c_s_s',

    GRAB_SPHERE_DENIED:                 'g_s_d',
    GRAB_SPHERE_SUCCESS:                'g_s_s',

    RELEASE_SPHERE_DENIED:              'r_sp_d',
    RELEASE_SPHERE_INVALID:             'r_sp_i',
    RELEASE_SPHERE_SUCCESS:             'r_sp_s',

    DELETE_SPHERE_DENIED:               'd_s_d',
    DELETE_SPHERE_INVALID:              'd_s_i',
    DELETE_SPHERE_SUCCESS:              'd_s_s',

    SET_SPHERE_TONE_DENIED:             's_s_t_d',
    SET_SPHERE_TONE_INVALID:            's_s_t_i',
    SET_SPHERE_TONE_SUCCESS:            's_s_t_s',

    SET_SPHERE_CONNECTIONS_DENIED:      's_s_c_d',
    SET_SPHERE_CONNECTIONS_INVALID:     's_s_c_i',
    SET_SPHERE_CONNECTIONS_SUCCESS:     's_s_c_s',

    CONNECT_SPHERES_IDENTICAL:          'c_s_id',
    CONNECT_SPHERES_INVALID:            'c_s_in',
    CONNECT_SPHERES_MISSING:            'c_s_m'
};

const OUTGOING_MESSAGE_COMPONENTS = {
    ALL_MESSAGES: {
        DATA:   dataLabel,
        FROM:   fromLabel,
        MSG:    msgLabel,
        TYPE:   typeLabel,
        CLIENT_ID:  clientIdLabel
    },
    CONNECTION_INFO: {
        CLIENT_ID:  clientIdLabel,
        SERVER_ID:  serverIdLabel
    },
    ROOM_STATUS_INFO: {
        ROOM_NAME:      roomNameLabel,
        SOUNDBANK:      soundbankLabel,
        CLIENTS:        clientsLabel,
        CLIENT_ID:      clientIdLabel,
        CLIENT_HEADSET_TYPE:    headsetTypeLabel,
        SPHERES:        spheresLabel,
        SPHERE_ID:      sphereIdLabel,
        TONE:           toneLabel,
        POSITION:       positionLabel,
        CONNECTIONS:    connectionsLabel,
        MERISTEM:       meristemLabel
    },
    ROOM_EXIT_SUCCESS: {
        ROOM_NAME:  roomNameLabel
    },
    CREATE_SPHERE_SUCCESS: {
        SPHERE_ID:  sphereIdLabel
    },
    SPHERE_ACTION_DENIED: {
        SPHERE_ID:  sphereIdLabel,
        HOLDER_ID:  holderIdLabel,
    },
    ROOM_SPHERE_CREATED: {
        SPHERE_ID:  sphereIdLabel,
        TONE:       toneLabel,
        POSITION:   positionLabel,
        CLIENT_ID:  clientIdLabel
    },
    GRAB_SPHERE_SUCCESS: {
        SPHERE_ID:  sphereIdLabel,
        CLIENT_ID:  clientIdLabel
    },
    RELEASE_SPHERE_SUCCESS: {
        SPHERE_ID:  sphereIdLabel,
        CLIENT_ID:  clientIdLabel
    },
    SPHERE_HOLD_TIMEOUT: {
        SPHERE_ID:  sphereIdLabel,
    },
    ROOM_SPHERE_RELEASED: {
        SPHERE_ID:  sphereIdLabel,
        CLIENT_ID:  clientIdLabel
    },
    ROOM_CLIENT_COORDS_UPDATED: {
        HEAD:   headLabel,
        LEFT:   leftLabel,
        RIGHT:  rightLabel,
        SPHERES: sphereLabel
    },
    ROOM_SPHERE_POSITION_UPDATED: {
        SPHERE_ID:  sphereIdLabel,
        POSITION:   positionLabel,
        CLIENT_ID:  clientIdLabel
    },
    SET_SPHERE_TONE_SUCCESS: {
        SPHERE_ID:  sphereIdLabel
    },
    ROOM_SPHERE_TONE_SET: {
        SPHERE_ID:  sphereIdLabel,
        TONE:       toneLabel,
        CLIENT_ID:  clientIdLabel
    },
    SET_SPHERE_CONNECTIONS_SUCCESS: {
        SPHERE_ID:  sphereIdLabel
    },
    ROOM_SPHERE_CONNECTIONS_SET: {
        SPHERE_ID:      sphereIdLabel,
        CONNECTIONS:    connectionsLabel,
        CLIENT_ID:      clientIdLabel
    },
    DELETE_SPHERE_SUCCESS: {
        SPHERE_ID:  sphereIdLabel,
        CLIENT_ID:  clientIdLabel
    },
    ROOM_SPHERE_DELETED: {
        SPHERE_ID:  sphereIdLabel,
        CLIENT_ID:  clientIdLabel
    },
    ROOM_SPHERE_STRUCK: {
        SPHERE_ID:  sphereIdLabel,
        CLIENT_ID:  clientIdLabel,
        VELOCITY:   velocityLabel
    },
    ROOM_CLIENT_JOIN: {
        CLIENT_ID:  clientIdLabel,
        CLIENT_HEADSET_TYPE: headsetTypeLabel
    },
    ROOM_CLIENT_EXIT: {
        CLIENT_ID:  clientIdLabel
    },
    ROOM_HEARTBEAT: {
        COUNT:      'c',
        SECONDS:    's'
    }
};

const HEADSET_TYPES = {
    HEADSET_TYPE_3DOF:      '3dof',
    HEADSET_TYPE_6DOF:      '6dof',
    HEADSET_TYPE_VIEWER:    'viewer'
};

const ERROR_TYPES = {
    INVALID_URL:                    'i_u',
    NO_ROOMS_AVAILABLE:             'n_r_a',

    NOT_IN_ROOM:                    'n_i_r',
    NO_SUCH_ROOM:                   'n_s_r',
    ROOM_QUEUE_FULL:                'r_q_f',
    ROOM_FULL:                      'r_f',
    ROOM_UNAVAILABLE:               'r_u',
    BUSY_TRY_AGAIN:                 'b_t_a',
    ROOM_NOT_READY:                 'r_n_r',
    ROOM_JOIN_TIMEOUT:              'r_j_t',
    ALREADY_IN_ROOM:                'a_i_r',
    ALREADY_IN_ROOM_QUEUE:          'a_i_r_q',

    CREATE_SPHERE_UNAVAILABLE:      'c_s_u',
    NON_EXISTENT_SPHERE:            'n_e_s',
    SPHERE_ALREADY_HELD:            's_a_h',
    CLIENT_HOLDING_SPHERE:          'c_h_s',
    CLIENT_HOLDING_MAX_SPHERES:     'c_h_m_s',
    TOO_MANY_SPHERE_CONNECTIONS:    't_m_s_c',

    GRAB_SPHERE_ERROR:              'g_s_e',
    RELEASE_SPHERE_ERROR:           'r_s_e',
    DELETE_SPHERE_ERROR:            'd_s_e',
    CONNECT_SPHERE_ERROR:           'c_s_e',
    SPHERE_HOLD_TIMEOUT:            's_h_t',

    CLIENT_INACTIVITY_TIMEOUT:      'c_i_t',

    SYSTEM_ERROR:                   's_'
};

export default {
    INCOMING_MESSAGE_TYPES,
    INCOMING_MESSAGE_COMPONENTS,
    OUTGOING_MESSAGE_TYPES,
    OUTGOING_MESSAGE_COMPONENTS,
    HEADSET_TYPES,
    ERROR_TYPES
};

export {
    HEADSET_TYPES
};
