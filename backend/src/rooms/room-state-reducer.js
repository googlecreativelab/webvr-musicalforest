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

import reducerBuilder           from './room-state-machine';

import { EVENT_TYPES, STATES }  from './room-state-constants';

let e = EVENT_TYPES, s = STATES;

const reducer = reducerBuilder({
    events: [
        // send a start message so room-sagas can send a PubSub syncRoomSetup message
        { name: e.INIT_ROOM_CONTENT,            from: s.INIT,                           to: s.INITING_ROOM_CONTENT },
        { name: e.INIT_ROOM_CONTENT_SUCCESS,    from: s.INITING_ROOM_CONTENT,           to: s.ROOM_CONTENT_INITED },
        { name: e.INIT_ROOM_CONTENT_FAILURE,    from: s.INITING_ROOM_CONTENT,           to: s.ERROR },

        // once it's initialised the room, it should start a heartbeat
        { name: e.START_HEARTBEAT,              from: s.ROOM_CONTENT_INITED,            to: s.STARTING_HEARTBEAT },
        { name: e.START_HEARTBEAT_SUCCESS,      from: s.STARTING_HEARTBEAT,             to: s.HEARTBEAT_STARTED },
        { name: e.START_HEARTBEAT_FAILURE,      from: s.STARTING_HEARTBEAT,             to: s.ERROR },

        // when it's started a heartbeat, the server should connect websockets from the queue
        { name: e.PROCESS_QUEUE,                from: s.HEARTBEAT_STARTED,              to: s.PROCESSING_QUEUE },

        // when it's received all state from peers, the server should connect websockets from the queue
        { name: e.PROCESS_QUEUE,                from: s.ALL_STATE_RECEIVED,             to: s.PROCESSING_QUEUE },
        { name: e.PROCESS_QUEUE_SUCCESS,        from: s.PROCESSING_QUEUE,               to: s.READY },
        { name: e.PROCESS_QUEUE_FAILURE,        from: s.PROCESSING_QUEUE,               to: s.ERROR },

        // if all the clients in the queue left before the subscription was completed, start room closedown
        { name: e.CHECK_IF_EMPTY,               from: s.PROCESSING_QUEUE,               to: s.CHECKING_IF_EMPTY },

        // when config.maxClients have arrived, the server should mark the room as full
        { name: e.SET_ROOM_FULL,                from: s.READY,                          to: s.ROOM_FULL },
        { name: e.UNSET_ROOM_FULL,              from: s.ROOM_FULL,                      to: s.READY },

        // when a client leaves the room, the server should check if there are any local clients left
        { name: e.CHECK_IF_EMPTY,               from: s.READY,                          to: s.CHECKING_IF_EMPTY },
        { name: e.CHECK_IF_EMPTY,               from: s.ROOM_FULL,                      to: s.CHECKING_IF_EMPTY },

        // if so, it should just go back to waiting for others
        { name: e.EMPTY_CHECK_FAILURE,          from: s.CHECKING_IF_EMPTY,              to: s.READY },
        // it not, it should unsubscribe from the room
        { name: e.EMPTY_CHECK_SUCCESS,          from: s.CHECKING_IF_EMPTY,              to: s.ROOM_EMPTY },

        // if there aren't any local clients left, the handleRoomEmpty saga should work out whether to stop a heartbeat
        { name: e.STOP_HEARTBEAT,               from: s.ROOM_EMPTY,                     to: s.STOPPING_HEARTBEAT },
        { name: e.STOP_HEARTBEAT_SUCCESS,       from: s.STOPPING_HEARTBEAT,             to: s.HEARTBEAT_STOPPED },
        { name: e.STOP_HEARTBEAT_FAILURE,       from: s.STOPPING_HEARTBEAT,             to: s.ERROR },

        // when the heartbeat's stopped, reset the room to its INIT state
        { name: e.CLOSE,                        from: s.HEARTBEAT_STOPPED,              to: s.INIT },

        // if it gets into an error state, it should trigger a cleanup action
        { name: e.RESET,                        from: s.ERROR,                          to: s.RESETTING },

        // cleaning up a room resets it to init status
        { name: e.RESET_SUCCESS,                from: s.RESETTING,                      to: s.INIT }
    ]
});

export default reducer;
