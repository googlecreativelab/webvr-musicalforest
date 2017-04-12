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

import { FastRateLimit }    from 'fast-ratelimit';

import config               from '../config';

import { logger }           from '../logger';

// rate-limits overall messages per client, regardless of type
let perClientRateLimiter = new FastRateLimit({
    threshold:  config.rateLimitInfo.perClientMsgThreshold,
    ttl:        config.rateLimitInfo.perClientMsgTtl
});

if( config.rateLimitInfo.perClientRateLimit ) {
    logger.info(
        `default overall client message rate limiter allowing ${perClientRateLimiter.__options.threshold}` +
        `msg/${perClientRateLimiter.__options.ttl_millisec}ms`
    );
}

// rate-limits individual message types per-client
let perMessageTypeRateLimiter = new FastRateLimit({
    threshold:  config.rateLimitInfo.perTypeMsgThreshold,
    ttl:        config.rateLimitInfo.perTypeMsgTtl
});

if( config.rateLimitInfo.perMessageTypeRateLimit ) {
    logger.info(
        `default per-type client message rate limiter allowing ${perMessageTypeRateLimiter.__options.threshold}` +
        `msg/${perMessageTypeRateLimiter.__options.ttl_millisec}ms`
    );
}

// allows dynamic setting of per-client rate limiter threshold
const setPerClientRateLimiterOptions = ( options ) => {
    perClientRateLimiter.__options = options;
    logger.info(
        `set overall client message rate limiter to allow ${perClientRateLimiter.__options.threshold}` +
        `msg/${perClientRateLimiter.__options.ttl_millisec}ms`
    );
};

// allows dynamic setting of per-message-type rate limiter threshold
const setPerMessageTypeRateLimiterOptions = ( options ) => {
    perMessageTypeRateLimiter.__options = options;
    logger.info(
        `set per-type client message rate limiter to allow ${perMessageTypeRateLimiter.__options.threshold}` +
        `msg/${perMessageTypeRateLimiter.__options.ttl_millisec}ms`
    );
};

export {
    perClientRateLimiter,
    perMessageTypeRateLimiter,
    setPerClientRateLimiterOptions,
    setPerMessageTypeRateLimiterOptions
};
