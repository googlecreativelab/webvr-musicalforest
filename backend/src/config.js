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

import fs           from 'fs';
import uuid         from 'uuid';
import dateformat   from 'dateformat';
import storage      from '@google-cloud/storage';

import messageConstants     from './messages/message-constants';
import serverConstants      from './server/server-constants';

import { formatStringAsGcpResourceName } from './utils/string-utils';

const logError = ( errorMsg ) => {
    let ts = dateformat( new Date(), LOG_DATE_FORMAT );
	console.error( `[${SHORT_SERVER_ID}|${ts}] => `, errorMsg );
};


/*******************************************************************************
* REQUIRED ENVIRONMENT VARIABLES
*******************************************************************************/

// nothing will work without a GCP PROJECT_ID
if( !process.env.PROJECT_ID ) {
    logError( `PROJECT_ID not specified, exiting.` );
	process.exit( serverConstants.ERROR_TYPES.BAD_OS_EXIT_ERROR_CODE );
}

const PROJECT_ID = process.env.PROJECT_ID;


// nothing will work without a LOCAL_IP_ADDRESS
if( !process.env.LOCAL_IP_ADDRESS ) {
    logError( `LOCAL_IP_ADDRESS not specified, exiting.` );
	process.exit( serverConstants.ERROR_TYPES.BAD_OS_EXIT_ERROR_CODE );
}

const LOCAL_IP_ADDRESS = process.env.LOCAL_IP_ADDRESS;

// nothing will work without an ENVIRONMENT_NAME

if( !process.env.ENVIRONMENT_NAME ) {
    logError( `ENVIRONMENT_NAME not specified, exiting.` );
	process.exit( serverConstants.ERROR_TYPES.BAD_OS_EXIT_ERROR_CODE );
};

const ENVIRONMENT_NAME = process.env.ENVIRONMENT_NAME;


/*******************************************************************************
* LOG FORMAT INFO
*******************************************************************************/

// generate a server id
const SERVER_ID             = uuid();
const SHORT_SERVER_ID       = SERVER_ID.split( '-' ).slice(0, 2).join( '-' );
const LOG_DATE_FORMAT       = "yyyymmdd|HH:MM:ss.l";

/*******************************************************************************
* PUBSUB SYNC CHANNEL INFO
*******************************************************************************/

// setup PubSub sync channel topic name, distinct per execution group
// e.g. 'gce', 'gke', 'mymac.config'
const syncTopicNameComponents = [
    serverConstants.SYNC_INFO.SYNC_TOPIC_NAME,
    '-',
    ENVIRONMENT_NAME
];

const SYNC_TOPIC_NAME = formatStringAsGcpResourceName(
    syncTopicNameComponents.join( '' )
);


// only log to Stackdriver explicitly if requested
const LOG_TO_CLOUD          = process.env.LOG_TO_CLOUD === 'true' ? true : false;

/*******************************************************************************
* NETWORK IP/PORT INFO
*******************************************************************************/

// set up some defaults
const WS_SERVER_PORT        = process.env.WS_SERVER_PORT        ? Number( process.env.WS_SERVER_PORT ) : 8100;
const WS_BALANCER_PORT      = process.env.WS_BALANCER_PORT      ? Number( process.env.WS_BALANCER_PORT ) : 9100;
const MAX_CLIENTS_PER_ROOM  = process.env.MAX_CLIENTS_PER_ROOM  ? Number( process.env.MAX_CLIENTS_PER_ROOM ) : 10;

// construct balancer identifier
const LOCAL_IP_PORT_STRING  = `${LOCAL_IP_ADDRESS}:${WS_SERVER_PORT}`;


/*******************************************************************************
* SSL INFO FOR HOSTING ON GKE
*******************************************************************************/

// GKE deploys provide USE_SSL=true in the environment
const USE_SSL = process.env.USE_SSL === "true" ? true : false;

// tell the app whether to serve SSL
let SSL_INFO = {
    useSsl: USE_SSL
};

// if so, set up the certificate info
if( USE_SSL === true ) {

    // make sure there's a specified certificate name
    if( !process.env.SSL_CERT_HOST_NAME ) {
        logError( `USE_SSL=true requires a specified SSL_CERT_HOST_NAME` );
        process.exit( serverConstants.ERROR_TYPES.BAD_OS_EXIT_ERROR_CODE );
    }

    // prepare for export, set up GCS bucket/file info
    SSL_INFO.sslCertHostName        = process.env.SSL_CERT_HOST_NAME;
    SSL_INFO.sslStorageBucketName   = `${PROJECT_ID}-ssl`;
    SSL_INFO.privKeyFileName        = `${process.env.SSL_CERT_HOST_NAME}/privkey.pem`;
    SSL_INFO.fullChainFileName      = `${process.env.SSL_CERT_HOST_NAME}/fullchain.pem`;

}

/*******************************************************************************
* ROOM CHOICE THRESHOLD CONFIGS
*******************************************************************************/

// provide shortcuts for headset type constants
const HT_3DOF   = messageConstants.HEADSET_TYPES.HEADSET_TYPE_3DOF;
const HT_6DOF   = messageConstants.HEADSET_TYPES.HEADSET_TYPE_6DOF;
const HT_VIEWER = messageConstants.HEADSET_TYPES.HEADSET_TYPE_VIEWER;


// set up headset threshold rules
const HEADSET_RULES = {
    [ HT_3DOF ]: {
        threshold:  3
    },
    [ HT_6DOF ]: {
        threshold:  3
    },
    [ HT_VIEWER ]: {
        threshold:  10
    }
};


/*******************************************************************************
* CHOICE OF WHETHER TO TIMEOUT SPHERE HOLDS AUTOMATICALLY
*******************************************************************************/

const TIMEOUT_SPHERE_HOLDS = process.env.TIMEOUT_SPHERE_HOLDS === 'false' ? false : true;;

/*******************************************************************************
* CHOICE OF WHETHER TO DROP VIEWER MESSAGES
*******************************************************************************/

const DROP_VIEWER_MESSAGES_IN_PRODUCTION = process.env.DROP_VIEWER_MESSAGES_IN_PRODUCTION === 'true' ? true : false;

/*******************************************************************************
* CHOICE OF WHETHER TO RATE LIMIT CLIENT/SPHERE POSITION UPDATES
*******************************************************************************/

const PER_CLIENT_RATE_LIMIT         = process.env.PER_CLIENT_RATE_LIMIT === 'false' ? false : true;
const PER_MESSAGE_TYPE_RATE_LIMIT   = process.env.PER_MESSAGE_TYPE_RATE_LIMIT === 'false' ? false : true;

const RATE_LIMIT_INFO   = {
    perClientRateLimit:         PER_CLIENT_RATE_LIMIT,          // switch per-clientrate limiting on or off
    perMessageTypeRateLimit:    PER_MESSAGE_TYPE_RATE_LIMIT,    // switch rate limiting on or off

    perTypeMsgThreshold:    1,      // 1 message of each type per client
    perTypeMsgTtl:          0.2,    // per 200ms

    perClientMsgThreshold:  20,     // 20 message of any type per client
    perClientMsgTtl:        1       // per 1s
};

/*******************************************************************************
* NAME OF PRODUCTION ENVIRONMENT GCP PROJECT
*******************************************************************************/

const PRODUCTION_ENVIRONMENT_PROJECT_ID         = '<your-production-project-id>';
const PRODUCTION_ENVIRONMENT_REQUIRED_ORIGIN    = '<your-production-frontend-hostname>';

/*******************************************************************************
* EXPORT CONFIG
*******************************************************************************/

export default {
    environmentName:                        ENVIRONMENT_NAME,
    syncTopicName:                          SYNC_TOPIC_NAME,
    logDateFormat:                          LOG_DATE_FORMAT,
    logToCloud:                             LOG_TO_CLOUD,
    localIpAddress:                         LOCAL_IP_ADDRESS,
    localIpPortString:                      LOCAL_IP_PORT_STRING,
    serverPort:                             WS_SERVER_PORT,
    balancerPort:                           WS_BALANCER_PORT,
    projectId:                              PROJECT_ID,
    dropViewerMessagesInProduction:         DROP_VIEWER_MESSAGES_IN_PRODUCTION,
    productionEnvironmentProjectId:         PRODUCTION_ENVIRONMENT_PROJECT_ID,
    productionEnvironmentRequiredOrigin:    PRODUCTION_ENVIRONMENT_REQUIRED_ORIGIN,
    maxClientsPerRoom:                      MAX_CLIENTS_PER_ROOM,
    clientRoomJoinDeadlineInMs:             5000,
    roomHeartbeatDelayInMs:                 5000,
    serverId:                               SERVER_ID,
    shortServerId:                          SHORT_SERVER_ID,
    sslInfo:                                SSL_INFO,
    headsetRules:                           HEADSET_RULES,
    rateLimitInfo:                          RATE_LIMIT_INFO,
    timeoutSphereHolds:                     TIMEOUT_SPHERE_HOLDS
};
