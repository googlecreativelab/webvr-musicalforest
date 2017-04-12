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

import express                  from 'express';


const lbHealthCheckUrl  = "/lb-health-check";

/*
 * here's where we'd implement any custom HTTP routes
 */
const createApp = () => {

    let app         = express();

    // don't announce server software
    app.use(
        (req, res, next) => {
            res.removeHeader('X-Powered-By');
            next();
        }
    );

    // say something at the root
    app.get(
        '/',
        ( req, res ) => {
            res.send( `forest\n` );
        }
    );

    // lb health check 200 response
    app.get(
        lbHealthCheckUrl,
        ( req, res ) => {
            res.send( `OK` );
        }
    );

    return app;
};

export default { createApp };
export { lbHealthCheckUrl };
