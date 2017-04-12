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

import datastore                from '@google-cloud/datastore';
import config                   from '../config';

import { logger }               from '../logger';

import datastoreConstants       from './datastore-constants';

// create a module-wrapped datastore client object at startup
let dsClient = ( ( conf ) => {

    if( !dsClient ) {
        if( process.env.DATASTORE_EMULATOR_HOST ) {
            logger.info( `using Datastore emulator running at ${process.env.DATASTORE_EMULATOR_HOST}` );
        }
        else {
            logger.info( `using live Datastore on GCP` );
        }

        dsClient = datastore( conf );
    }

    return dsClient;

})( config );

const runQuery = function* ( query ) {
    return yield dsClient.runQuery( query );
};

const save = function* ( entities ) {
    return yield dsClient.save( entities );
};

const key = function ( keyComponents ) {
    return dsClient.key( keyComponents );
};

// export functions to the default namespace, to make a 'datastore' import for other modules
export default {
    runQuery,
    save,
    key
};

// export constants individually, to make a { datastoreConstants } import for other modules
export {
    datastoreConstants,
    dsClient
}
