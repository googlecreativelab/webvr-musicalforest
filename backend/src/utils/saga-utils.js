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

import { call, put, spawn } from 'redux-saga/effects';

import { logger }           from '../logger';

/*
 * https://github.com/redux-saga/redux-saga/pull/644#issuecomment-272236599
 *
 * "Use spawn to start sagas so that an uncaught exception doesn't terminate all of them.
 * Restart a saga on an asynchronous exception. Terminate it on a sync exception."
 */
const spawnAutoRestartingSagas = function* ( sagas ) {

    yield sagas.map( ( saga  ) => {

        let restarter = function* () {

            let isSyncError         = false;
            let previouslyStarted   = false;

            while (!isSyncError) {

                isSyncError = true;

                try {
                    setTimeout( () => { isSyncError = false; } );

                    if( previouslyStarted ) {
                        logger.info( `restarting crashed saga '${saga.name}'` );
                    }

                    previouslyStarted = true;
                    yield call( saga );
                    break;
                }

                catch ( error ) {

                    if ( isSyncError ) {
                        throw new Error( `saga '${saga.name}' was terminated because it threw an exception on startup.` );
                    }

                    logger.error( `uncaught error in saga '${saga.name}': ${error.message}` );
                }
            }
        }

        return spawn( restarter );
    })
};

export default {
    spawnAutoRestartingSagas
};
