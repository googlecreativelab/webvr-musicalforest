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

const ACTION_TYPES = {

    // reducer actions
    SET_SYNC_TOPIC:                         'set_sync_topic',
    SET_SYNC_SUBSCRIPTION:                  'set_sync_subscription',
    SET_APP_SERVER:                         'set_app_server',
    SET_WEBSOCKET_SERVER:                   'set_websocket_server',
    SET_BALANCER:                           'set_balancer',
    SET_MONITOR_TASK_FOR_PEER:              'set_monitor_task_for_peer',
    SET_LAST_HEARTBEAT_FOR_PEER:            'set_last_heartbeat_for_peer',
    REMOVE_PEER_FROM_LIST:                  'remove_peer_from_list',
    ADD_WEBSOCKET_TO_STATE:                 'add_websocket_to_state',
    SET_WEBSOCKET_TIMEOUT_TASK_FOR_CLIENT:  'set_websocket_timeout_task_for_client',
    CANCEL_WEBSOCKET_ROOM_JOIN_TIMEOUT_TASK_FOR_CLIENT:   'cancel_websocket_room_join_timeout_task_for_client',
    REMOVE_WEBSOCKET_TIMEOUT_TASK_FOR_CLIENT:   'remove_websocket_timeout_task_for_client',
    REMOVE_WEBSOCKET_FROM_STATE:            'remove_websocket_from_state',

    // saga actions
    START_SERVER_SETUP:                     'start_server_setup',
    FINISH_SERVER_SETUP:                    'finish_server_setup',
    START_SYNC_SUBSCRIPTION_WARMUP:         'start_sync_subscription_warmup',
    ADD_SYNC_SUBSCRIPTION_WARMUP_RESPONSE:  'add_sync_subscription_warmup_response',
    START_SENDING_SYNC_HEARTBEAT:           'start_sending_sync_heartbeat',
    START_SAVING_SUBSCRIPTION_INFO:         'start_saving_subscription_info',
    LOAD_RATE_LIMITER_INFO_FROM_DATASTORE:  'load_rate_limiter_info_from_datastore',
    START_CHECKING_DEAD_PEER_SUBSCRIPTIONS: 'start_checking_dead_peer_subscriptions',
    START_MONITOR_FOR_PEER:                 'start_monitor_for_peer',
};

const SYNC_INFO = {
    SYNC_TOPIC_NAME:                        'server-sync',
    SYNC_WARMUP_MESSAGE_LIST_LENGTH:        10,
    SYNC_HEARTBEAT_PERIOD_IN_MS:            3000,
    SYNC_HEARTBEAT_TIMEOUT_IN_MS:           15000,
};

const SYNC_MESSAGES =  {
    SYNC_HEARTBEAT:             'sync_heartbeat',
    SYNC_WARMUP:                'sync_warmup',
    LOAD_RATE_LIMITER_INFO:     'load_rate_limiter_info'
};

const saveSubscriptionInfoPeriodInMs    = 5000;    // save subscription info to datastore every 5s
const checkSubscriptionInfoPeriodInMs   = saveSubscriptionInfoPeriodInMs * 6;   // check for dead peers twice a minute

const SAVE_INFO = {
    SAVE_SUBSCRIPTION_INFO_PERIOD_IN_MS:    saveSubscriptionInfoPeriodInMs,
    CHECK_SUBSCRIPTION_INFO_PERIOD_IN_MS:   checkSubscriptionInfoPeriodInMs
};

const CUSTOM_PROXY_HEADERS = {
    X_CLIENT_HEADSET_TYPE:          'x-client-headset-type',
    X_CLIENT_SPECIFIED_ROOM_NAME:   'x-client-specified-room-name',
    X_NO_ROOMS_AVAILABLE:           'x-no-rooms-available',
    X_ROOM_ABOVE_THRESHOLD:         'x-room-above-threshold',
    X_PLEASE_CLOSE_THIS_CONNECTION: 'x-please-close-this-connection',
    X_REQUESTED_ROOM_NAME:          'x-requested-room-name'
};

const ERROR_TYPES = {
    ROOM_NAME_REQUIRED: 'room_name_required',
    ILLEGAL_ROOM_NAME:  'illegal_room_name',

    BAD_OS_EXIT_ERROR_CODE:    1
};

export default {
    ACTION_TYPES,
    SYNC_INFO,
    SYNC_MESSAGES,
    SAVE_INFO,
    CUSTOM_PROXY_HEADERS,
    ERROR_TYPES
};

export {
    CUSTOM_PROXY_HEADERS,
};
