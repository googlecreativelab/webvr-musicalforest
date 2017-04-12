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

import tracer from 'tracer';

import config from '../config';

import { writeCloudLogEntry } from './cloud-logger';

let selectedConsole = config.logToCloud ? tracer.console : tracer.colorConsole;

let consoleOptions = {
    format:     "[{{shortServerId}}|{{timestamp}}] {{sigil}} {{message}} [{{file}}:{{line}}]",
    dateformat: config.logDateFormat,
    preprocess: (data) => {
        data.shortServerId = config.shortServerId;
        data.localIpAddress = config.localIpAddress;
        data.sigil = {
            error:  `=>`,
            warn:   `**`,
            info:   `->`,
            debug:  `||`,
            trace:  `##`,
            log:    ``
        }[ data.title ];
    }
};

// only do info() and above in production
if( config.projectId === config.productionEnvironmentProjectId ) {
    consoleOptions.level    = 'info';
    consoleOptions.format   = "[{{shortServerId}}|{{localIpAddress}}|{{timestamp}}] {{sigil}} {{message}} [{{file}}:{{line}}]";
}

// write log via Stackdriver API?
if( config.logToCloud ) {
    consoleOptions.transport = writeCloudLogEntry;
}

let l = selectedConsole( consoleOptions );

let logger = {
    error:  l.error,
    warn:   l.warn,
    info:   l.info,
    debug:  l.debug,
    trace:  l.trace,
    log:    l.log
};

export {
    logger
};
