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

import serverActions                from './server-actions';
import serverConstants              from './server-constants';

import { logger }                   from '../logger';

import {
    dispatchStoreAction,
    getStoreState
} from '../store';

// new server, possibly this one, has joined & is warming up its sync channel subscription
const handleSyncWarmup = ( msgPayload, myId ) => {

    // not interested in other servers' subscription warmup messages
    if( msgPayload.from !== myId ) {
        return;
    }

    // update our state with a new warmup response
    dispatchStoreAction( serverActions.addSyncSubscriptionWarmupResponseRequestAction() );
};

// store peer's last sync heartbeat so as to be able to monitor over time
const handleSyncHeartbeat = ( msgPayload, myId ) => {
    dispatchStoreAction(
        serverActions.setLastHeartbeatForPeerRequestAction(
            msgPayload.data,
            msgPayload.from
        )
    );
};

// handle pubsub request to reload rater limiter info from datastore
const handleLoadRateLimiterInfo = () => {
    dispatchStoreAction( serverActions.loadRateLimiterInfoRequestAction() );
};

export default {
    handleSyncWarmup,
    handleSyncHeartbeat,
    handleLoadRateLimiterInfo
};
