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

import http                     from 'http';
import https                    from 'https';
import httpProxy                from 'http-proxy';
import { FastRateLimit }        from 'fast-ratelimit';

import { logger }               from '../logger';

import config                   from '../config';

import { getBalancerFunction }  from './balancer';

import app_server               from './app-server';
import ws_server                from './websocket-server';
import serverConstants          from './server-constants';

const errorHandler = ( error ) => {
    logger.error( `error starting server: ${error.message}` );
    process.exit( serverConstants.ERROR_TYPES.BAD_OS_EXIT_ERROR_CODE );
};

const startServer = ( sslInfo ) => {

    // http server structure for room-server
    let server = http.createServer();

    // create websocket server to run the websocket app
    let wsServer    = ws_server.startWebsocketServer( server );
    wsServer.on( 'error', errorHandler );

    // create express app to handle HTTP requests
    let app         = app_server.createApp();
    app.on( 'error', errorHandler );

    // attach express app to plain-http server
    server.on( 'request', app );

    // create balancing proxy server to send room requests to correct nodes
    let proxyServer;
    let proxyTimeout = 2000;
    let balancer;

    // don't serve non-WS HTTP(S) requests
    let httpFunction = ( req, res ) => {
        res.statusCode = 403;
        res.end();
        return;
    };

    // decide whether to serve HTTPS ...
    if( sslInfo.useSsl ) {

        logger.info( `serving app over SSL using certs for hostname ${config.sslInfo.sslCertHostName}` );

        let proxyOptions = {
            ssl: sslInfo.options,
            proxyTimeout
        };

        proxyServer = httpProxy.createProxyServer( proxyOptions );
        balancer    = https.createServer( sslInfo.options, httpFunction );
    }
    // ... or HTTP
    else {

        logger.info( `serving app over plain HTTP` );

        let proxyOptions = { proxyTimeout };

        proxyServer = httpProxy.createProxyServer( proxyOptions );
        balancer    = http.createServer( httpFunction );
    }

    // attach error handler to whichever of http/https is being used
    proxyServer.on(
        'error',
        ( err ) => {
            logger.error( `proxy error ${err.code} trying to '${err.syscall}' to ${err.address}:${err.port}` );
        }
    );

    balancer.on(
        'error',
        ( err ) => {
            logger.error( `balancer error:`, err );
        }
    );

    // add the node-balancing websocket handler to the balancer server
    balancer.on( 'upgrade', getBalancerFunction( proxyServer ) );

    // run the server & the balancer
    try {
        server.listen(
            config.serverPort,
            () => {
                logger.info( `starting WS server on port ${config.serverPort}` );
                logger.info( `allowing ${config.maxClientsPerRoom} clients per room` );
            }
        );

        balancer.listen(
            config.balancerPort,
            () => {
                logger.info( `starting balancer on port ${config.balancerPort}` );
            }
        );

        return {
            app,
            wsServer,
            balancer
        };
    }
    catch( error ) {
        logger.error( `=> error starting server: ${error.message}` );
        process.exit( serverConstants.ERROR_TYPES.BAD_OS_EXIT_ERROR_CODE );
    }

};

export default {
    startServer
};
