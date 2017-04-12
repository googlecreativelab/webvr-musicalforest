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

import constants from './server-constants';

// reducer actions
const setSyncTopicRequestAction = ( syncTopic ) => {
    let type = constants.ACTION_TYPES.SET_SYNC_TOPIC;
    return { type, syncTopic };
};

const setSyncSubscriptionRequestAction = ( syncSubscription ) => {
    let type = constants.ACTION_TYPES.SET_SYNC_SUBSCRIPTION;
    return { type, syncSubscription };
};

const setAppServerRequestAction = ( appServer ) => {
    let type = constants.ACTION_TYPES.SET_APP_SERVER;
    return { type, appServer };
};

const setWebsocketServerRequestAction = ( websocketServer ) => {
    let type = constants.ACTION_TYPES.SET_WEBSOCKET_SERVER;
    return { type, websocketServer };
};

const setBalancerRequestAction = ( balancer ) => {
    let type = constants.ACTION_TYPES.SET_BALANCER;
    return { type, balancer };
};

const setMonitorTaskForPeerRequestAction = ( monitorTask, peerId ) => {
    let type = constants.ACTION_TYPES.SET_MONITOR_TASK_FOR_PEER;
    return { type, monitorTask, peerId };
};

const setLastHeartbeatForPeerRequestAction = ( data, peerId ) => {
    let type = constants.ACTION_TYPES.SET_LAST_HEARTBEAT_FOR_PEER;
    return { type, data, peerId };
};

const removePeerFromListRequestAction = ( peerId ) => {
    let type = constants.ACTION_TYPES.REMOVE_PEER_FROM_LIST;
    return { type, peerId };
};

const addWebsocketToStateRequestAction = ( ws ) => {
    let type = constants.ACTION_TYPES.ADD_WEBSOCKET_TO_STATE;
    return { type, ws };
};

const setWebsocketTimeoutTaskForClientRequestAction = ( timeoutTask, clientId ) => {
    let type = constants.ACTION_TYPES.SET_WEBSOCKET_TIMEOUT_TASK_FOR_CLIENT;
    return { type, timeoutTask, clientId };
};

const cancelWebsocketRoomJoinTimeoutTaskForClientRequestAction = ( clientId ) => {
    let type = constants.ACTION_TYPES.CANCEL_WEBSOCKET_ROOM_JOIN_TIMEOUT_TASK_FOR_CLIENT;
    return { type, clientId };
};

const removeWebsocketTimeoutTaskForClientRequestAction = ( clientId ) => {
    let type = constants.ACTION_TYPES.REMOVE_WEBSOCKET_TIMEOUT_TASK_FOR_CLIENT;
    return { type, clientId };
};

const removeWebsocketFromStateRequestAction = ( ws ) => {
    let type = constants.ACTION_TYPES.REMOVE_WEBSOCKET_FROM_STATE;
    return { type, ws };
};

// saga actions
const startServerSetupRequestAction = () => {
    let type = constants.ACTION_TYPES.START_SERVER_SETUP;
    return { type };
};

const finishServerSetupRequestAction = () => {
    let type = constants.ACTION_TYPES.FINISH_SERVER_SETUP;
    return { type };
};

const startSyncSubscriptionWarmupRequestAction = () => {
    let type = constants.ACTION_TYPES.START_SYNC_SUBSCRIPTION_WARMUP;
    return { type };
};

const addSyncSubscriptionWarmupResponseRequestAction = () => {
    let type = constants.ACTION_TYPES.ADD_SYNC_SUBSCRIPTION_WARMUP_RESPONSE;
    return { type };
};

const startSendingSyncHeartbeatRequestAction = () => {
    let type = constants.ACTION_TYPES.START_SENDING_SYNC_HEARTBEAT;
    return { type };
};

const startSavingSubscriptionInfoRequestAction = () => {
    let type = constants.ACTION_TYPES.START_SAVING_SUBSCRIPTION_INFO;
    return { type };
};

const loadRateLimiterInfoRequestAction = () => {
    let type = constants.ACTION_TYPES.LOAD_RATE_LIMITER_INFO_FROM_DATASTORE;
    return { type };
};

const startCheckingDeadPeerSubscriptionsRequestAction = () => {
    let type = constants.ACTION_TYPES.START_CHECKING_DEAD_PEER_SUBSCRIPTIONS;
    return { type };
};

const startMonitorForPeerRequestAction = ( serverId ) => {
    let type = constants.ACTION_TYPES.START_MONITOR_FOR_PEER;
    return { type, serverId };
};

export default {
    // reducer actions
    setSyncTopicRequestAction,
    setSyncSubscriptionRequestAction,
    setAppServerRequestAction,
    setWebsocketServerRequestAction,
    setBalancerRequestAction,
    setMonitorTaskForPeerRequestAction,
    setLastHeartbeatForPeerRequestAction,
    removePeerFromListRequestAction,
    addWebsocketToStateRequestAction,
    setWebsocketTimeoutTaskForClientRequestAction,
    cancelWebsocketRoomJoinTimeoutTaskForClientRequestAction,
    removeWebsocketTimeoutTaskForClientRequestAction,
    removeWebsocketFromStateRequestAction,

    // saga actions
    startServerSetupRequestAction,
    finishServerSetupRequestAction,
    startSyncSubscriptionWarmupRequestAction,
    addSyncSubscriptionWarmupResponseRequestAction,
    startSendingSyncHeartbeatRequestAction,
    startSavingSubscriptionInfoRequestAction,
    loadRateLimiterInfoRequestAction,
    startCheckingDeadPeerSubscriptionsRequestAction,
    startMonitorForPeerRequestAction
};
