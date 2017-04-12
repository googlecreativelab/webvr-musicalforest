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

import serverMessageConstants from '../../messages/message-constants';
const serverMsgComponents = serverMessageConstants.OUTGOING_MESSAGE_COMPONENTS.ROOM_STATUS_INFO;
const toneLabel = serverMsgComponents.TONE;
const positionLabel = serverMsgComponents.POSITION;
const meristemLabel = serverMsgComponents.MERISTEM;
const connectionsLabel = serverMsgComponents.CONNECTIONS;

module.exports = {
	"0": {
		[ toneLabel ]: 7,
		[ positionLabel ]: {
			"x": 0.3,
			"z": 0,
			"y": 1.2
		},
		[ meristemLabel ]: true,
		[ connectionsLabel ]: []
	},
	"1": {
		[ toneLabel ]: 9,
		[ positionLabel ]: {
			"x": -0.14999999999999994,
			"z": 0.2598076211353316,
			"y": 1.2
		},
		[ meristemLabel ]: true,
		[ connectionsLabel ]: []
	},
	"2": {
		[ toneLabel ]: 11,
		[ positionLabel ]: {
			"x": -0.15000000000000013,
			"z": -0.2598076211353315,
			"y": 1.2
		},
		[ meristemLabel ]: true,
		[ connectionsLabel ]: []
	},
	"3": {
		[ toneLabel ]: 9,
		[ positionLabel ]: {
			"x": 3.061616997868383e-17,
			"z": 0.5,
			"y": 1.6
		},
		[ meristemLabel ]: true,
		[ connectionsLabel ]: []
	},
	"4": {
		[ toneLabel ]: 12,
		[ positionLabel ]: {
			"x": -0.5,
			"z": 6.123233995736766e-17,
			"y": 1.6
		},
		[ meristemLabel ]: true,
		[ connectionsLabel ]: []
	},
	"5": {
		[ toneLabel ]: 8,
		[ positionLabel ]: {
			"x": -9.184850993605148e-17,
			"z": -0.5,
			"y": 1.6
		},
		[ meristemLabel ]: true,
		[ connectionsLabel ]: []
	},
	"6": {
		[ toneLabel ]: 11,
		[ positionLabel ]: {
			"x": 0.5,
			"z": -1.2246467991473532e-16,
			"y": 1.6
		},
		[ meristemLabel ]: true,
		[ connectionsLabel ]: []
	},
	"7": {
		[ toneLabel ]: 0,
		[ positionLabel ]: {
			"x": 0,
			"z": 0,
			"y": 2
		},
		[ meristemLabel ]: true,
		[ connectionsLabel ]: []
	}
}