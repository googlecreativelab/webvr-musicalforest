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

import Logging from '@google-cloud/logging';

import config from '../config';

import { formatStringAsGcpResourceName } from '../utils/string-utils';

// create a client
const loggingClient = Logging( config );

// the name of the log to write to
const logName = formatStringAsGcpResourceName(
    `${config.environmentName}-cloud-app-log`
);

// choose a log to write to
const selectedLog = loggingClient.log( logName );

// set up resource metadata
const metadata = {
    resource: {
        type: 'project',
        labels: {
            project_id: config.projectId
        }
    }
};

// log function wrapper
const writeCloudLogEntry = ( tracerData ) => {

    const entry = selectedLog.entry( metadata, tracerData.output );

    selectedLog.write(entry).catch(
        ( error ) => {
            console.error( `error logging message: ${error.message}` );
        }
    );

};

export {
    writeCloudLogEntry
};
