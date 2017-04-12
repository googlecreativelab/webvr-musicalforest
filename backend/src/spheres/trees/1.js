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
		[ toneLabel ]: 21,
		[ positionLabel ]: {
			"x": 0,
			"z": 0,
			"y": 2
		},
		[ meristemLabel ]: false,
		[ connectionsLabel ]: []
	},
	"1": {
		[ toneLabel ]: 14,
		[ positionLabel ]: {
			"x": 0.21,
			"z": 0,
			"y": 1.7
		},
		[ meristemLabel ]: false,
		[ connectionsLabel ]: [
			2
		]
	},
	"2": {
		[ toneLabel ]: 16,
		[ positionLabel ]: {
			"x": -0.10499999999999995,
			"z": 0.18186533479473213,
			"y": 1.7
		},
		[ meristemLabel ]: false,
		[ connectionsLabel ]: [
			1,
			3
		]
	},
	"3": {
		[ toneLabel ]: 18,
		[ positionLabel ]: {
			"x": -0.1050000000000001,
			"z": -0.18186533479473205,
			"y": 1.7
		},
		[ meristemLabel ]: false,
		[ connectionsLabel ]: [
			2
		]
	},
	"4": {
		[ toneLabel ]: 11,
		[ positionLabel ]: {
			"x": 0.42,
			"z": 0,
			"y": 1.4
		},
		[ meristemLabel ]: false,
		[ connectionsLabel ]: [
			5
		]
	},
	"5": {
		[ toneLabel ]: 14,
		[ positionLabel ]: {
			"x": -0.2099999999999999,
			"z": 0.36373066958946426,
			"y": 1.4
		},
		[ meristemLabel ]: false,
		[ connectionsLabel ]: [
			4,
			6
		]
	},
	"6": {
		[ toneLabel ]: 16,
		[ positionLabel ]: {
			"x": -0.2100000000000002,
			"z": -0.3637306695894641,
			"y": 1.4
		},
		[ meristemLabel ]: false,
		[ connectionsLabel ]: [
			5
		]
	},
	"7": {
		[ toneLabel ]: 9,
		[ positionLabel ]: {
			"x": 0.63,
			"z": 0,
			"y": 1.1
		},
		[ meristemLabel ]: false,
		[ connectionsLabel ]: [
			8
		]
	},
	"8": {
		[ toneLabel ]: 11,
		[ positionLabel ]: {
			"x": -0.31499999999999984,
			"z": 0.5455960043841964,
			"y": 1.1
		},
		[ meristemLabel ]: false,
		[ connectionsLabel ]: [
			7,
			9
		]
	},
	"9": {
		[ toneLabel ]: 14,
		[ positionLabel ]: {
			"x": -0.3150000000000003,
			"z": -0.5455960043841962,
			"y": 1.1
		},
		[ meristemLabel ]: false,
		[ connectionsLabel ]: [
			8
		]
	},
	"10": {
		[ toneLabel ]: 7,
		[ positionLabel ]: {
			"x": 0.84,
			"z": 0,
			"y": 0.8
		},
		[ meristemLabel ]: false,
		[ connectionsLabel ]: [
			11
		]
	},
	"11": {
		[ toneLabel ]: 9,
		[ positionLabel ]: {
			"x": -0.4199999999999998,
			"z": 0.7274613391789285,
			"y": 0.8
		},
		[ meristemLabel ]: false,
		[ connectionsLabel ]: [
			10,
			12
		]
	},
	"12": {
		[ toneLabel ]: 11,
		[ positionLabel ]: {
			"x": -0.4200000000000004,
			"z": -0.7274613391789282,
			"y": 0.8
		},
		[ meristemLabel ]: false,
		[ connectionsLabel ]: [
			11
		]
	}
}