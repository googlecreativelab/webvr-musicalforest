# webvr-experiments: Musical Forest back-end

## Contents

* [Description](#description)
* [Running the app locally](#running-the-app-locally)
* [Deploying in production](#deploying-in-production)
* [How the app works](#how-the-app-works)
  * [Basic operation](#basic-operation)
  * [Managing state](#managing-state)
  * [Starting the server](#starting-the-server)
  * [Handling SSL connections](#handling-ssl-connections)
  * [Managing connections](#managing-connections)
  * [Managing peer servers](#managing-peer-servers)
  * [Managing rooms](#managing-rooms)
  * [Handling client messages](#handling-client-messages)
* [Connecting clients to the server](#connecting-clients-to-the-server)
* [Messages](#messages)
* [URLs](#urls)
* [Interacting in rooms](#interacting-in-rooms)

---

## Description

This is the backend server for the Chrome WebVR Experiment [Musical Forest](https://forest.webvrexperiments.com/). It's a dynamic room-based [WebSocket](https://en.wikipedia.org/wiki/WebSocket) server app using Google Cloud [PubSub](https://cloud.google.com/pubsub/) and [Datastore](https://cloud.google.com/datastore/). It's written in Javascript ES6 using [`node.js`](https://nodejs.org/) and the following [`npm`](https://www.npmjs.com/ )modules:

* `uws` websocket server

* `redux` and `javascript-state-machine` for state management

* `redux-sagas` for managing asynchronous/long-running tasks and composite async actions

* `@google-cloud/*` for using GCP services

* `http-proxy` and `hashring` to distribute connections consistently between app instances

* `fast-ratelimit` to hard-limit per-client message rates

* `tracer` for logging


---

## Running the app locally

#### Install prerequisites

* [Install gcloud](https://cloud.google.com/sdk/downloads)

* `node.js` LTS version 6 + `npm` (Mac: `brew install node@6 npm` - [notes about installing `node` on Mac with Homebrew](http://apple.stackexchange.com/questions/171530/how-do-i-downgrade-node-or-install-a-specific-previous-version-using-homebrew/207883))

* `gcc` C compiler for native `node.js` modules (Xcode 8.1+ if running on Mac)

* [`jq`](https://stedolan.github.io/jq/) (Mac: `brew install jq`)


#### Authenticate with GCP

```
gcloud auth login
gcloud config set project <project-id>
gcloud auth application-default login
```

#### Install node.js modules

`npm install --no-optional`

#### Run the app

Start the `datastore` & `pubsub` emulators:

`npm run emulators`

In a new shell, start the app in dev mode using the emulators:

`npm run start_emulated`

You can now connect to the server from the main web app by appending `?server=ws://localhost:9100` to the URL.

#### Test a connection to the app from command line (optional)

Install a solid command-line websocket client:

* Install [go](https://golang.org/) (Mac: `brew install go # make sure to set up a ${GOPATH} dir & env var`)
* `go get -u github.com/hashrocket/ws`

Connect to a websocket:

* `ws ws://localhost:9100/<viewer_type>` (see [URLs](#urls) below regarding viewer types)
* _paste in a message, e.g. `{"t":"g_s","d":{"spId":"973c742d-866f-4b25-9ae6-8830e7f13e59"}}` as above_

#### Run multiple local app instances (optional)

The app defaults to using ports `8100` for the application server and `9100` for the inter-node connection balancer (see `src/server/server-startup.js` and `src/server/balancer.js`).

To run multiple instances, `export WS_SERVER_PORT=<other-server-port>` and `export WS_BALANCER_PORT=<other-balancer-port>` in a new shell before running `npm run start_emulated`. Instances will coordinate via the local PubSub and Datastore emulators.

---

## Deploying in production

The app is designed to be deployed as a series of single-threaded application instances (pods) running in a Docker container cluster via [Kubernetes](https://kubernetes.io/) on [Google Container Engine](https://cloud.google.com/container-engine/). Deploying and running clustered applications is beyond the scope of this document, but the following configuration and setup points are necessary to run this app in such environments.

You'll need to create a `Dockerfile` for your environment along with an `entrypoint` script to run the application on the pods, and modify the application configuration as follows:

1. Your `entrypoint` script must `export` the following environment variables:

    * `PROJECT_ID` - your Google Cloud Platform project name
  
    * `ENVIRONMENT_NAME` - a unique identifier to separate different deployment environments, and keeps Datastore and PubSub resources separate for each deployment within a project. As an example, running the app locally via `package.json` uses your computer's `hostname`; you might want to name a particular deployment by region or type
  
    * `LOCAL_IP_ADDRESS` - the private-range IP address by which each pod is accessible and identifies itself to other nodes in the cluster, used by pods to health-check each other when necessary

2. When automatically scaled up or down, application nodes synchronize with new and removed nodes using a PubSub topic. The name of this topic is constructed from your `ENVIRONMENT_NAME` at startup in `src/config.js`

3. Set `PRODUCTION_ENVIRONMENT_PROJECT_ID` and `PRODUCTION_ENVIRONMENT_REQUIRED_ORIGIN` in `src/config.js` to reflect the Google Cloud Platform project name and [WebSocket Origin header](https://en.wikipedia.org/wiki/WebSocket#Protocol_handshake) required for connections to your production cluster

Refer to the [Container Engine](https://cloud.google.com/container-engine/docs/) and [Kubernetes](https://kubernetes.io/docs/home/) documentation for further information on how to set up and manage clusters, deployments, services, etc.


---

## How the app works

##### Basic operation

The app accepts client connections to its websocket server (`src/server/websocket-server.js`), parses the requested URL to work out headset type and whether a specific room has been chosen, and then tries to connect the client to a room. It maintains state about which clients and spheres are in which room, which rooms are full or available, and handles all communications from and to clients in all rooms.

##### Managing state

The app holds state in a `redux` state store (`src/store.js`), mutated in reducers (`src/*/*-reducer.js`) via messages `dispatch()`'d to the store, and accessed from the store in async or composite action sequences (`src/server/server-sagas.js`, `src/rooms/room-sagas.js`, `src/messages/message-sagas.js`) using methods provided by the `redux-sagas` module.

##### Starting the server

Servers are started (`src/server/server-startup.js`) via a series of composite actions (`src/server/server-sagas.js`, `src/server/server-setup.js`) defined as `redux-sagas` generator functions, initiated by a server setup action dispatched to the `redux` store at startup (`src/index.js`).

The server requires the environment variables `ENVIRONMENT_NAME`, `LOCAL_IP_ADDRESS` and `PROJECT_ID` in order to run. These are set by the `npm` and `gke` startup tasks, according to where the app's being run.

##### Handling SSL connections

If the environment variable `USE_SSL` is set to `true`, the server requires the environment variable `SSL_CERT_HOST_NAME` to be set too, and retrieves the SSL certificate for that hostname on startup from a [Google Cloud Storage](https://cloud.google.com/storage/) (GCS) bucket in the GCP project, named `<project-name>-ssl`. The full certificate chain file (named `fullchain.pem`) and the private key file (`privkey.pem`) must be stored in a sub-folder of that GCS bucket with the same name as the required hostname.


##### Managing connections
All connections to a given room are handled by the same instance of the server. The app manages this by running a public/client-facing 'load-balancer' (`src/server/balancer.js`) which proxies client connections either to a local or peer websocket app server, according to which server is associated with the chosen room name in a persistent hash-ring. (See the `hashring` [docs](https://github.com/3rd-Eden/node-hashring) for implementation, and a helpful [explanation](http://blog.plasmaconduit.com/consistent-hashing/).) The hash-ring is stored in the server state (`src/server/server-reducer.js`).

When a connection arrives, the server takes the specified room name or chooses one dynamically according to which rooms are available locally (using `avails` in `src/rooms/room-data-reducer.js` and the state machine in `src/rooms/room-state-machine.js'). It then looks up which server should handle the connection in the hash-ring and proxies the connection to that server.

References to all websocket connections held by a given server are kept in the server state (`src/server/server-reducer.js`). The only non-store-managed state consists of properties (`id` and current-room info) set directly on websocket connection objects by the websocket server.

##### Managing peer servers
In order to maintain a list of peers during automatic scaling of the app in production, the server connects to a PubSub 'sync channel' on startup (`src/server/server-setup.js`), and listens out for sync 'heartbeat' messages from other servers on the channel. It maintains a list of which servers are connected, adding newly-arrived servers to the hash-ring and removing them from it when they time out (stop sending sync heartbeats for a given period).

Each server instance periodically writes information about its state and its PubSub subscription to a ServerSubscriptionInfo record in the Datastore (`src/server/server-sagas.js`), allowing the administrator to retrieve aggregate status info, and enabling the app to check up on timed-out or otherwise dead app instances, removing their status info & PubSub subscriptions as appropriate (also in `src/server/server-sagas.js`).

##### Managing rooms

The server manages room status info (available, full, setting up, etc) using a state machine (`src/rooms/room-state-machine.js`) for each room, initialised at app startup and accessed via the `redux` store. A series of long-running tasks (`src/rooms/room-sagas.js`) handles activity on the rooms (initialising room content, starting/stopping heartbeats, client activity and sphere hold timeouts) using generator functions managed using the `redux-sagas` module.

##### Handling client messages

Clients are restricted to a fixed set of messages which are specified in a JSON schema (`src/messages/message-schema.js`). The websocket server passes received client messages to a message-handler module (`src/messages/message-handler.js`). The message-handler validates incoming messages against the schema (`src/messages/message-validator.js`) and dispatches valid messages to the `redux` state store, using messages constructed from the schema (`src/messages/message-actions.js`). Invalid messages are dropped before getting to dispatch, so any message that gets through at least passes validation.

A series of long-running tasks implemented as `redux-sagas` (`src/messages/message-sagas.js`) handle the validated messages and carry out the requested actions, i.e. sending client position updates and interacting with spheres.

* All possible message interactions between clients and servers are specified in the JSON schema and carried out in the "sagas" - any messages not specified like so are silently dropped.

* Any superfluous information in messages received from clients is silently dropped.

* The websocket server rate-limits client messages on both a per-message-type and per-client basis. Default rates are specified in `RATE_LIMIT_INFO` constants (`src/config.js`), and overridden by values retrieved from `PerEnvironmentRateLimitInfo` Datastore records on startup if present (`src/server/server-sagas.js`). You can request the app reload the limit values from Datastore by sending a `SYNC_MESSAGES.LOAD_RATE_LIMITER_INFO` message to the app via PubSub. (That's a deploy/admin task not implemented in the app source, but the mechanism is visible in `sendSyncMessageOfType()` in `src/server/server-sync.js`.) Messages above the thresholds are silently dropped.

* Any messages received from clients with a 'viewer' headset-type are silently dropped.


---

## Connecting clients to the server

The app accepts standard WebSocket connections to "rooms" in the forest. The server receives messages over the WebSocket, sends responses and broadcasts messages from other occupants of the room all over the same connection.

----

## Messages

Here's an example of the message format:

```
{
  "f": "81270b00-2dde-4c33-ab4d-6cfc76b46c0c",	// 'from' id of client or server sending the message
  "m": {	// message
    "t": "<type>",
    "d": "<data>"
  }
}
```

Message labels (e.g. `f` or `m` above) are set as constants in the file `src/messages/message-constants.js`. In front-end and back-end code, messages are always constructed and consumed using the labels as property names rather than fixed properties, so that the values used can be changed to friendly names during development if required, and restricted to short strings for use in production.

---

## URLs

Clients make connections via URLs of the format `ws://<host>:<port>/<viewer_type>/<room_name>`.

`<viewer_type>` can be `3dof`, `6dof` or `viewer`.

Any action messages sent by `viewer` connections are dropped by the server when running in production.

* To join a specific room, supply both the `<viewer_type>` and `<room_name>` URL components.
* To have a room chosen for you, supply only the `<viewer_type>` component.

Any other URLs are invalid and connections to them will be closed immediately with an `INVALID_URL` (`i_u`) message:

```
{
  "f": "81270b00-2dde-4c33-ab4d-6cfc76b46c0c",
  "m": {
    "t": "i_u"	// invalid_url
  }
}
```

---

## Interacting in rooms

* All interactions with the server are carried out using messages in the above format over the websocket connection.
* Clients don't need to identify themselves with `<from>` fields, as IDs are associated directly with client websocket connections on the server.
* The server validates messages received from clients against the appropriate JSON schema for their `<type>`, and immediately drops anything non-conforming, according to the schema in `src/messages/message-schema.js`. It also removes any superfluous content/properties in the messages before storing anything to the room state or broadcasting updates to other clients in the room.

### Joining a room

When the first client joins a room, the server kicks off a heartbeat, and sends an incrementing `ROOM_HEARTBEAT` (`r_h`) sync message to all clients present in the room, every 5 seconds:

```
{
  "f": "a738cbe0-4dac-4389-aa20-1e6a86c166a9",
  "m": {
    "t": "r_h",
    "d": {
      "c": 3,	// heartbeat count since room start
      "s": 15	// heartbeat seconds since room start
    }
  }
}
```

When a new client joins a room, it gets sent a `CONNECTION_INFO` (`c_i`) message containing its ID and the ID of the server it's connected to:

```
{
  "f": "a738cbe0-4dac-4389-aa20-1e6a86c166a9",
  "m": {
    "t": "c_i",
    "d": {
      "cId": "cb439961-3b57-4403-bcc5-208b47565dd1",    // clientId
      "srId": "a738cbe0-4dac-4389-aa20-1e6a86c166a9"    // serverId
    }
  }
}
```

... followed immediately by a `ROOM_STATUS_INFO` (`r_s_i`) message containing the `ROOM_NAME` (`r_n`), a list of other occupants of the room grouped by viewer type and keyed by their IDs, and a list of spheres in the room with their tones & positions:

```
{
  "f": "a738cbe0-4dac-4389-aa20-1e6a86c166a9",
  "m": {
    "t": "r_s_i",
    "d": {
      "rn": "ctyw",		// room name
      "sb": 1,			// soundbank
      "c": {			// clients, grouped by type
        "3dof": [
          "cb439961-3b57-4403-bcc5-208b47565dd1"
        ]
      },
      "s": {	// spheres
        "6567cbaa-e6c5-457f-b338-2949b13ff17a": {
          "t": 4,	// tone
          "p": {	// position
            "x": -0.5858704723117225,
            "y": 1.4647926895710155,
            "z": 0.2328255217809887
          }
        },
        "0e19b0dd-a90b-4fc8-93d5-24a96365ce2c": {
          "t": 6,
          "p": {
            "x": -0.07124214717156585,
            "y": 0.9642806694401945,
            "z": 1.181824016202171
          }
        }
      }
    }
  }
}

```

Existing clients get a `ROOM_CLIENT_JOIN` (`r_c_j`) message indicating a new client has joined along with its id:

```
{
  "f": "a738cbe0-4dac-4389-aa20-1e6a86c166a9",
  "m": {
    "t": "r_c_j",
    "d": {
      "cId": "6211a260-d86e-4db9-be00-bd2eba1c2794",   // clientId
      "ht": "3dof"                                     // headsetType
    }
  }
}
```

If the server is full, overloaded or in the process of scaling, the server sends a `BUSY_TRY_AGAIN` (`b_t_a`) message, in which case the client should just try to connect again:

```
{
  "f": "d02922d2-6db0-4ad1-93e1-0d778250461e",
  "m": {
    "t": "b_t_a",
    "d": {}
  }
}
```

### Leaving a room

Clients can disconnect by sending a `ROOM_EXIT` (`r_e`) message:

```
{
  "t": "e_r"
}
```

in which case the server will send a `ROOM_EXIT_SUCCESS` (`r_e_s`) message and close the connection:

```
{
  "f": "d1e313ee-9eac-47e5-9b9f-5daee88a8057",
  "m": {
    "t": "r_e_s",
    "d": {
      "rn": "batr"	// room name
    }
  }
}
```

The client can also just close the websocket connection. 😏

When a client disconnects, its positional data is removed from the room state and any remaining clients get a `ROOM_CLIENT_EXIT` (`r_c_e`) message telling them it's left:

```
{
  "f": "81270b00-2dde-4c33-ab4d-6cfc76b46c0c",
  "m": {
    "t": "r_c_e",
    "d": {
      "cId": "56252c73-2801-4fff-86f9-d214bdd52b94"
    }
  }
}

```

### In-room actions

Once connected to a room, clients can send positional info, and interact with spheres in the room. All interactions are carried out using the following messages.

#### `UPDATE_CLIENT_COORDS` (`u_c_c`)

This is the most frequent message clients send, notifying a change in client position:

```
{
  "t": "u_c_c",
  "d": {
      "r": {	// right
        "r": {		// rotation
          "x": 9.234324,
          "y": 55.232423,
          "z": 7.234234
        },
        "p": {	// position
          "x": 19.54384,
          "y": 25.3323,
          "z": 9.81832
        }
      },
      "l": {	// left
        "r": {
          "x": 9.234324,
          "y": 55.232423,
          "z": 7.234234
        },
        "p": {
          "x": 19.54384,
          "y": 25.3323,
          "z": 9.81832
        }
      },
      "h": {	// head
        "r": {
          "x": 9.234324,
          "y": 55.232423,
          "z": 7.234234
        },
        "p": {
          "z": 79.618,
          "y": 0,
          "x": 19.888
        }
      }
    }
}

```

These are broadcast to other clients in the same room as `ROOM_CLIENT_COORDS_UPDATED` (`r_c_c_u`), providing rotation (`r`) and position (`p`) coordinates for each of head (`h`), left hand (`l`) and right hand (`r`):

```
{
  "f": "41bd2e10-0f67-4b14-acee-84eeed1764b7",
  "m": {
    "t": "r_c_c_u",
    "d": {
      "r": {
        "r": {
          "x": 9.234324,
          "y": 55.232423,
          "z": 7.234234
        },
        "p": {
          "x": 19.54384,
          "y": 25.3323,
          "z": 9.81832
        }
      },
      "l": {
        "r": {
          "x": 9.234324,
          "y": 55.232423,
          "z": 7.234234
        },
        "p": {
          "x": 19.54384,
          "y": 25.3323,
          "z": 9.81832
        }
      },
      "h": {
        "r": {
          "x": 9.234324,
          "y": 55.232423,
          "z": 7.234234
        },
        "p": {
          "z": 79.618,
          "y": 0,
          "x": 19.888
        }
      }
    }
  }
}
```

Clients can optionally include sphere positions in the `UPDATE_CLIENT_COORDS` messages, for any spheres they currently hold (see below). To do so, they add an extra `spheres` object at the same level as the `head`, `left` and `right`:

```
{
  "f": "41bd2e10-0f67-4b14-acee-84eeed1764b7",
  "m": {
    "t": "r_c_c_u",
    "d": {
      "s": [	// spheres
        {
          "spId": "df0a769c-653d-44ec-9f17-e5a9d2c0f167",
          "p": {
            "x": 156,
            "y": 22,
            "z": 10
          }
        },
        {
          "spId": "69143b9a-1342-4aec-a7da-1daac29cee3d",
          "p": {
            "x": 2,
            "y": 3,
            "z": 4
          }
        }
      ],
      "r": { [...] },  // right
      "l": { [...] },  // left
      "h": { [...] }  // head
    }
  }
}
```

Clients can interact with spheres in the room by sending messages as follows.

#### `CREATE_SPHERE_OF_TONE_AT_POSITION` (`c_s_o_t_a_p`)

```
{
  "t": "c_s_o_t_a_p",
  "d": {
    "t": 0,		// tone
    "p": {		// position
      "x": 1,
      "y": 1,
      "z": 3
    }
  }
}
```

On successful creation, the server sends a `CREATE_SPHERE_SUCESS` (`c_s_s`) message:

```
{
  "f": "81270b00-2dde-4c33-ab4d-6cfc76b46c0c",	// from <server-id>
  "m": {
    "t": "c_s_s",
    "d": {
      "spId": "cad0a7d4-a055-49b2-a3f8-4e08d636dbce"
    }
  }
}
```

#### `GRAB_SPHERE` (`g_s`)

```
{
  "t": "g_s",
  "d": {
    "spId": "090253c9-1c68-44c2-8aac-dba707c6aef7"
  }
}
```

On successful grab, server sends `GRAB_SPHERE_SUCCESS` (`g_s_s`):

```
{
  "f": "81270b00-2dde-4c33-ab4d-6cfc76b46c0c",
  "m": {
    "t": "g_s_s",
    "d": {
      "spId": "31654801-9e61-4a5e-bdd6-a29e8ecd1001"
    }
  }
}
```

Before accepting a grab, the server checks its state to see whether the sphere exists and whether it's already held by any other clients. Any problems are communicated back to the client. Possible errors are:

`NON_EXISTENT_SPHERE` (`n_e_s`)

```
{
  "f": "81270b00-2dde-4c33-ab4d-6cfc76b46c0c",
  "m": {
    "t": "n_e_s",
    "d": {
      "spId": "66b93b19-03d6-4220-b44f-5b33d5d59269"    // sphereId
    }
  }
}
```

`CLIENT_HOLDING_SPHERE` (`c_h_s`):

```
{
  "f": "81270b00-2dde-4c33-ab4d-6cfc76b46c0c",
  "m": {
    "t": "c_h_s",
    "d": {
      "spId": "29312c56-b1a5-4530-8c7b-2c968e158683",
      "hId": "1eec65a7-2c9a-4fe4-a998-55d3f1754f21"   // holderId - same as client in this case
    }
  }
}
```

`SPHERE_ALREADY_HELD` (`s_a_h`) by another client:

```
{
  "f": "81270b00-2dde-4c33-ab4d-6cfc76b46c0c",
  "m": {
    "t": "s_a_h",
    "d": {
      "spId": "66b93b19-03d6-4220-b44f-5b33d5d59269",
      "hId": "055fa916-5e99-44dd-9e23-2f9323bb6f4c"
    }
  }
}
```

`CLIENT_HOLDING_MAX_SPHERES` (`c_h_m_s`) - a client can only hold one sphere in each hand:

```
{
  "f": "81270b00-2dde-4c33-ab4d-6cfc76b46c0c",
  "m": {
    "t": "c_h_m_s",
    "d": {}
  }
}
```

A successful grab creates a "hold" on the sphere, stopping other clients from acting on the sphere, and lasting until either the client sends a `RELEASE_SPHERE` (`r_s`) message, or is inactive (sends no messages relating to the held sphere) for a period defined in `roomConstants.SPHERE_INFO.SPHERE_HOLD_TIMEOUT`, in the file `src/rooms/room-data-constants.js`, currently set to 10 seconds. If the hold times out, the server sends a `SPHERE_HOLD_TIMEOUT` (`s_h_t`) to the client:

```
{
  "f": "81270b00-2dde-4c33-ab4d-6cfc76b46c0c",
  "m": {
    "t": "s_h_t",
    "d": {
      "spId": "922fbed6-5c57-4c14-bf0f-080abf5fa285"
    }
  }
}
```

and a `ROOM_SPHERE_RELEASED` (`r_s_r`) message to any other clients in the room:

```
{
  "f": "81270b00-2dde-4c33-ab4d-6cfc76b46c0c",
  "m": {
    "t": "r_s_r",
    "d": {
      "spId": "922fbed6-5c57-4c14-bf0f-080abf5fa285",
      "cId": "1fe992a5-05d9-4791-8482-c598f31dbe22"
    }
  }
}
```


#### `RELEASE_SPHERE` (`r_s`)

```
{
  "t": "r_s",
  "d": {
    "spId": "6f0e19bd-2451-43a0-be9d-b6e208e65ee2"
  }
}
```

On receiving a `RELEASE_SPHERE` message, the server checks that the client is holding it, and if so sends a `RELEASE_SPHERE_SUCCESS` (`r_sp_s`) message to the client:

```
{
  "f": "81270b00-2dde-4c33-ab4d-6cfc76b46c0c",
  "m": {
    "t": "r_sp_s",
    "d": {
      "spId": "a62cabcd-e7d9-4687-beac-0c6c7fb9b953"
    }
  }
}
```

and a `ROOM_SPHERE_RELEASED` (`r_s_r`) message to any other clients in the room:

```
{
  "f": "81270b00-2dde-4c33-ab4d-6cfc76b46c0c",
  "m": {
    "t": "r_s_r",
    "d": {
      "spId": "a62cabcd-e7d9-4687-beac-0c6c7fb9b953",
      "cId": "d8f59526-60b6-47ee-ab86-f39f441b8aaa"    // released by this client
    }
  }
}
```

Possible errors are `NON_EXISTENT_SPHERE` (as in `GRAB_SPHERE` above) and `RELEASE_SPHERE_INVALID` (`r_sp_i`):

```
{
  "f": "d1e313ee-9eac-47e5-9b9f-5daee88a8057",
  "m": {
    "t": "r_sp_i",
    "d": {
      "spId": "9c674bab-e2a6-4588-beff-2342d10a97b0"
    }
  }
}
```


#### `DELETE_SPHERE` (`d_s`)

```
{
  "t": "d_s",
  "d": {
    "spId": "cfa16485-51e5-4db0-b54a-1cab6b6f003f"
  }
}
```

On successful delete the server sends `DELETE_SPHERE_SUCCESS` (`d_s_s`):

```
{
  "f": "d1e313ee-9eac-47e5-9b9f-5daee88a8057",
  "m": {
    "t": "d_s_s",
    "d": {
      "spId": "cfa16485-51e5-4db0-b54a-1cab6b6f003f"
    }
  }
}
```

and notifies any other clients with a `ROOM_SPHERE_DELETED` (`r_s_d`) message:

```
{
  "f": "5e44fd4e-54cb-42d7-ac41-f381a3844fee",
  "m": {
    "t": "r_s_d",
    "d": {
      "spId": "9de12a8d-96a4-42e8-842e-4230db33b306",
      "cId": "5e44fd4e-54cb-42d7-ac41-f381a3844fee"
    }
  }
}
```

Possible errors include `NON_EXISTENT_SPHERE` (as above), `DELETE_SPHERE_DENIED` (`d_s_d`) if another client is holding the sphere:

```
{
  "f": "d1e313ee-9eac-47e5-9b9f-5daee88a8057",
  "m": {
    "t": "d_s_d",
    "d": {
      "spId": "9de12a8d-96a4-42e8-842e-4230db33b306",
      "hId": "9847a6ac-ae7c-43a8-8599-83b3079c9f1a"
    }
  }
}
```

#### `STRIKE_SPHERE` (`s_s`)

```
{
  "t": "s_s",
  "d": {
    "spId": "aabb5ecd-1662-4db5-91f9-6bd1d8f2b0f9",
    "v": 0.5
  }
}
```
Sphere strikes are broadcast to other clients in the room via a `ROOM_SPHERE_STRUCK` (`r_s_s`) message: 

```
{
  "f": "1a3823f3-79e6-4cd1-9e33-2044d16da300",
  "m": {
    "t": "r_s_s",
    "d": {
      "spId": "aabb5ecd-1662-4db5-91f9-6bd1d8f2b0f9",
      "v": 0.5,
      "cId": "1a3823f3-79e6-4cd1-9e33-2044d16da300"
    }
  }
}
```

Strikes sent to non-existent spheres are silently dropped.


#### `SET_SPHERE_TONE` (`s_s_t`)


```
{
  "t": "s_s_t",
  "d": {
    "spId": "99c2989c-beba-4c3f-acb9-6f5fe5e4ec33",
    "t": 10	// tone
  }
}
```

On successful set, the server sends a `SET_SPHERE_TONE_SUCCESS` (`s_s_t_s`) message:

```
{
  "f": "d1e313ee-9eac-47e5-9b9f-5daee88a8057",
  "m": {
    "t": "s_s_t_s",
    "d": {
      "spId": "99c2989c-beba-4c3f-acb9-6f5fe5e4ec33"
    }
  }
}
```

and notifies other clients of the change in tone with a `ROOM_SPHERE_TONE_SET` (`r_s_t_s`) message:

```
{
  "f": "d1e313ee-9eac-47e5-9b9f-5daee88a8057",
  "m": {
    "t": "r_s_t_s",
    "d": {
      "spId": "cd3aa6cf-f15c-4d7a-be6e-d862912fbd62",
      "t": 10,  // tone
      "cId": "13eb8894-330a-4e37-8ce3-645edf3c6773"
    }
  }
}
```

Clients don't need to hold a sphere to set its tone, but if it's currently held by another client, the server will send a `SET_SPHERE_TONE_DENIED` (`s_s_t_d`) message:

```
{
  "f": "d1e313ee-9eac-47e5-9b9f-5daee88a8057",
  "m": {
    "t": "s_s_t_d",
    "d": {
      "spId": "99c2989c-beba-4c3f-acb9-6f5fe5e4ec33",
      "hId": "9e8e4e40-a523-4345-8e21-b274177fe073"
    }
  }
}
```

As above, the server will send a `NON_EXISTENT_SPHERE` message if the specified sphere doesn't exist in the room.

#### `SET_SPHERE_CONNECTIONS` (`s_s_c`)

```
{
  "t": "s_s_c",
  "d": {
    "spId": "973c742d-866f-4b25-9ae6-8830e7f13e59",
    "c": [	// connections
      "221c3e00-c0e9-4bd9-bdb3-187c5dcf5499",
      "03d6c324-73e0-4804-9b84-9b203a303a38"
    ]
  }
}
```

As in `SET_SPHERE_TONE`, clients don't need to hold a sphere to set its connections, but if it's currently held by another client, the server will send a `SET_SPHERE_CONNECTIONS_DENIED` (`s_s_c_d`) message:

```
{
  "f": "d1e313ee-9eac-47e5-9b9f-5daee88a8057",
  "m": {
    "t": "s_s_c_d",
    "d": {
      "spId": "973c742d-866f-4b25-9ae6-8830e7f13e59",
      "hId": "7bf0b7a2-ee3e-4b76-9d68-675aa4e97f2a"
    }
  }
}
```

As above, the server will send a `NON_EXISTENT_SPHERE` message if the specified sphere doesn't exist in the room.


