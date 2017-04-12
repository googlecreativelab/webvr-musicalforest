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

import { createStore, applyMiddleware, combineReducers } from 'redux';
import createSagaMiddleware from 'redux-saga';

import { logger }           from './logger';
import { messageSagas }     from './messages';
import { roomSagas }        from './rooms';

import {
    roomDataReducer,
    roomStateReducer
} from './rooms';

import {
    serverConstants,
    serverReducer,
    serverSagas
} from './server';

let store = ( () => {

    let sagaErrorTrap = ( error ) => {
        logger.error( `sagaMiddleware trapped uncaught error, exiting - error was '${error.message}'` );
        process.exit( serverConstants.ERROR_TYPES.BAD_OS_EXIT_ERROR_CODE );
    };

    let sagaMiddleware = createSagaMiddleware({
        onError: sagaErrorTrap
    });

    let reducers = {
        roomDataReducer,
        roomStateReducer,
        serverReducer
    };

    let rootReducer     = combineReducers( reducers );
    let allMiddleware   = applyMiddleware( sagaMiddleware );
    let store           = createStore( rootReducer, {}, allMiddleware );

    // see https://github.com/yelouafi/redux-saga/blob/master/examples/real-world/store/configureStore.prod.js
    store.runSaga       = ( saga ) => { sagaMiddleware.run( saga ); };

    // when two sagas listen for the same action, they're run in this order
    let sagaListsToRun = [
        messageSagas,
        serverSagas,
        roomSagas
    ];

    sagaListsToRun.forEach(
        ( sagaList ) => {
            // run each named saga exported from this saga list
            Object.keys( sagaList ).forEach(
                ( sagaName ) => {
                    store.runSaga( sagaList[ sagaName ] );
                }
            );
        }
    );

    return store;
})();

const getStoreState         = store.getState;
const dispatchStoreAction   = store.dispatch;

export  {
    dispatchStoreAction,
    getStoreState
};
