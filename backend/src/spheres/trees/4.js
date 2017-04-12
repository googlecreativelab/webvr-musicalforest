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
			"x": 0.75,
			"z": 0,
			"y": 1
		},
		[ meristemLabel ]: true,
		[ connectionsLabel ]: [
			1
		]
	},
	"1": {
		[ toneLabel ]: 9,
		[ positionLabel ]: {
			"x": 0.9310632489491795,
			"z": 0.18873586425530814,
			"y": 1.25
		},
		[ meristemLabel ]: false,
		[ connectionsLabel ]: [
			0
		]
	},
	"2": {
		[ toneLabel ]: 8,
		[ positionLabel ]: {
			"x": 0.21822143065055674,
			"z": 0.2736410188638104,
			"y": 1.1428571428571428
		},
		[ meristemLabel ]: true,
		[ connectionsLabel ]: [
			3
		]
	},
	"3": {
		[ toneLabel ]: 12,
		[ positionLabel ]: {
			"x": 0.384135321897057,
			"z": 0.3936242554404447,
			"y": 1.4928571428571429
		},
		[ meristemLabel ]: false,
		[ connectionsLabel ]: [
			2
		]
	},
	"4": {
		[ toneLabel ]: 9,
		[ positionLabel ]: {
			"x": -0.16689070046723575,
			"z": 0.7311959341363677,
			"y": 1.2857142857142856
		},
		[ meristemLabel ]: true,
		[ connectionsLabel ]: [
			5
		]
	},
	"5": {
		[ toneLabel ]: 11,
		[ positionLabel ]: {
			"x": -0.3911849258208314,
			"z": 0.8657218686221058,
			"y": 1.5357142857142856
		},
		[ meristemLabel ]: false,
		[ connectionsLabel ]: [
			4
		]
	},
	"6": {
		[ toneLabel ]: 11,
		[ positionLabel ]: {
			"x": -0.6757266509268144,
			"z": -0.3254128043381685,
			"y": 1.5714285714285714
		},
		[ meristemLabel ]: true,
		[ connectionsLabel ]: [
			7
		]
	},
	"7": {
		[ toneLabel ]: 15,
		[ positionLabel ]: {
			"x": -0.8927946788297243,
			"z": -0.32468086092858855,
			"y": 1.9214285714285713
		},
		[ meristemLabel ]: false,
		[ connectionsLabel ]: [
			6
		]
	},
	"8": {
		[ toneLabel ]: 12,
		[ positionLabel ]: {
			"x": -0.0778823268847101,
			"z": -0.34122476926363826,
			"y": 1.7142857142857144
		},
		[ meristemLabel ]: true,
		[ connectionsLabel ]: [
			9
		]
	},
	"9": {
		[ toneLabel ]: 14,
		[ positionLabel ]: {
			"x": -0.01341837989470709,
			"z": -0.5498362911640168,
			"y": 1.9642857142857144
		},
		[ meristemLabel ]: false,
		[ connectionsLabel ]: [
			8
		]
	},
	"10": {
		[ toneLabel ]: 14,
		[ positionLabel ]: {
			"x": 0.35,
			"z": -8.572527594031472e-17,
			"y": 2
		},
		[ meristemLabel ]: true,
		[ connectionsLabel ]: []
	}
}