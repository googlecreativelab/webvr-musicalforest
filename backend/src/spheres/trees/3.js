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
		[ toneLabel ]: 19,
		[ positionLabel ]: {
			"x": -0.3801701800236835,
			"z": 0.22714110856547276,
			"y": 0.9711673841367696
		},
		[ meristemLabel ]: true,
		[ connectionsLabel ]: [
			1
		]
	},
	"1": {
		[ toneLabel ]: 21,
		[ positionLabel ]: {
			"x": -0.6427852083066042,
			"z": 0.009616761652669642,
			"y": 1.1711673841367696
		},
		[ meristemLabel ]: false,
		[ connectionsLabel ]: [
			0
		]
	},
	"2": {
		[ toneLabel ]: 18,
		[ positionLabel ]: {
			"x": -0.3717230728255157,
			"z": -0.35540364805038743,
			"y": 1.0697267415202358
		},
		[ meristemLabel ]: true,
		[ connectionsLabel ]: [
			3
		]
	},
	"3": {
		[ toneLabel ]: 20,
		[ positionLabel ]: {
			"x": -0.20030527807571613,
			"z": -0.6856251725306349,
			"y": 1.2697267415202358
		},
		[ meristemLabel ]: false,
		[ connectionsLabel ]: [
			2
		]
	},
	"4": {
		[ toneLabel ]: 17,
		[ positionLabel ]: {
			"x": 0.2775516451627562,
			"z": -0.5157773829446608,
			"y": 1.3804880182088852
		},
		[ meristemLabel ]: true,
		[ connectionsLabel ]: [
			5
		]
	},
	"5": {
		[ toneLabel ]: 19,
		[ positionLabel ]: {
			"x": 0.6683914801829096,
			"z": -0.4130372477082535,
			"y": 1.5804880182088852
		},
		[ meristemLabel ]: false,
		[ connectionsLabel ]: [
			4
		]
	},
	"6": {
		[ toneLabel ]: 16,
		[ positionLabel ]: {
			"x": 0.6406669137194841,
			"z": 0.14622804231414932,
			"y": 1.5521284395792219
		},
		[ meristemLabel ]: false,
		[ connectionsLabel ]: [
			7
		]
	},
	"7": {
		[ toneLabel ]: 18,
		[ positionLabel ]: {
			"x": 0.6283301758541369,
			"z": 0.5830052038036452,
			"y": 1.7521284395792218
		},
		[ meristemLabel ]: false,
		[ connectionsLabel ]: [
			6
		]
	},
	"8": {
		[ toneLabel ]: 15,
		[ positionLabel ]: {
			"x": 0.03268723354108966,
			"z": 0.7278378056229577,
			"y": 1.4375443946415316
		},
		[ meristemLabel ]: false,
		[ connectionsLabel ]: [
			9
		]
	},
	"9": {
		[ toneLabel ]: 17,
		[ positionLabel ]: {
			"x": -0.42773941827558637,
			"z": 0.8241868040756578,
			"y": 1.6375443946415316
		},
		[ meristemLabel ]: false,
		[ connectionsLabel ]: [
			8
		]
	},
	"10": {
		[ toneLabel ]: 14,
		[ positionLabel ]: {
			"x": -0.7608452130361227,
			"z": 0.24721359549995825,
			"y": 1.3097886967409693
		},
		[ meristemLabel ]: false,
		[ connectionsLabel ]: [
			11
		]
	},
	"11": {
		[ toneLabel ]: 16,
		[ positionLabel ]: {
			"x": -0.9781476007338058,
			"z": -0.2079116908177584,
			"y": 1.5097886967409693
		},
		[ meristemLabel ]: false,
		[ connectionsLabel ]: [
			10
		]
	},
	"12": {
		[ toneLabel ]: 13,
		[ positionLabel ]: {
			"x": -0.48006736955111823,
			"z": -0.7272709782428493,
			"y": 1.461249175138151
		},
		[ meristemLabel ]: false,
		[ connectionsLabel ]: [
			13
		]
	},
	"13": {
		[ toneLabel ]: 15,
		[ positionLabel ]: {
			"x": -0.06407587922682341,
			"z": -1.0695108533225732,
			"y": 1.6612491751381508
		},
		[ meristemLabel ]: false,
		[ connectionsLabel ]: [
			12
		]
	},
	"14": {
		[ toneLabel ]: 12,
		[ positionLabel ]: {
			"x": 0.6203422273145859,
			"z": -0.7100388108034049,
			"y": 1.7744448880450852
		},
		[ meristemLabel ]: false,
		[ connectionsLabel ]: [
			15
		]
	},
	"15": {
		[ toneLabel ]: 14,
		[ positionLabel ]: {
			"x": 1.0815170100561873,
			"z": -0.36938246566224114,
			"y": 1.9744448880450851
		},
		[ meristemLabel ]: false,
		[ connectionsLabel ]: [
			14
		]
	},
	"16": {
		[ toneLabel ]: 11,
		[ positionLabel ]: {
			"x": 0.9138398517295967,
			"z": 0.4400820782478085,
			"y": 1.8944794878661984
		},
		[ meristemLabel ]: false,
		[ connectionsLabel ]: [
			17
		]
	},
	"17": {
		[ toneLabel ]: 13,
		[ positionLabel ]: {
			"x": 0.6840314990772564,
			"z": 1.0032899402408502,
			"y": 2.0944794878661983
		},
		[ meristemLabel ]: false,
		[ connectionsLabel ]: [
			16
		]
	},
	"18": {
		[ toneLabel ]: 10,
		[ positionLabel ]: {
			"x": -0.19386177149566014,
			"z": 1.0682664104785127,
			"y": 1.7500029067545588
		},
		[ meristemLabel ]: false,
		[ connectionsLabel ]: [
			19
		]
	},
	"19": {
		[ toneLabel ]: 12,
		[ positionLabel ]: {
			"x": -0.8313423444203109,
			"z": 0.9807808781086307,
			"y": 1.9500029067545588
		},
		[ meristemLabel ]: false,
		[ connectionsLabel ]: [
			18
		]
	},
	"20": {
		[ toneLabel ]: 9,
		[ positionLabel ]: {
			"x": -1.1524845401944908,
			"z": 0.10372548601683089,
			"y": 1.6579479983438095
		},
		[ meristemLabel ]: false,
		[ connectionsLabel ]: [
			21
		]
	},
	"21": {
		[ toneLabel ]: 11,
		[ positionLabel ]: {
			"x": -1.2314153711992457,
			"z": -0.5704848098486944,
			"y": 1.8579479983438094
		},
		[ meristemLabel ]: false,
		[ connectionsLabel ]: [
			20
		]
	},
	"22": {
		[ toneLabel ]: 8,
		[ positionLabel ]: {
			"x": -0.4316890695856524,
			"z": -1.1502314125002475,
			"y": 1.8582964637551596
		},
		[ meristemLabel ]: false,
		[ connectionsLabel ]: [
			23
		]
	},
	"23": {
		[ toneLabel ]: 10,
		[ positionLabel ]: {
			"x": 0.2340255877359067,
			"z": -1.4092722770336028,
			"y": 2.0582964637551595
		},
		[ meristemLabel ]: false,
		[ connectionsLabel ]: [
			22
		]
	},
	"24": {
		[ toneLabel ]: 7,
		[ positionLabel ]: {
			"x": 1.051722092687431,
			"z": -0.7641208279802159,
			"y": 2.1618033988749894
		},
		[ meristemLabel ]: false,
		[ connectionsLabel ]: [
			25
		]
	},
	"25": {
		[ toneLabel ]: 9,
		[ positionLabel ]: {
			"x": 1.4917828430524098,
			"z": -0.15679269490148218,
			"y": 2.3618033988749896
		},
		[ meristemLabel ]: false,
		[ connectionsLabel ]: [
			24
		]
	}
}