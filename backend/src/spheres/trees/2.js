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
		[ toneLabel ]: 0,
		[ positionLabel ]: {
			"x": 0.3,
			"z": 0,
			"y": 1.2
		},
		[ meristemLabel ]: true,
		[ connectionsLabel ]: [
			1,
			2
		]
	},
	"1": {
		[ toneLabel ]: 2,
		[ positionLabel ]: {
			"x": 0.6687355423879241,
			"z": -0.20686414466293768,
			"y": 1.3
		},
		[ meristemLabel ]: false,
		[ connectionsLabel ]: [
			0
		]
	},
	"2": {
		[ toneLabel ]: 4,
		[ positionLabel ]: {
			"x": 0.48296291314453416,
			"z": 0.12940952255126037,
			"y": 1.45
		},
		[ meristemLabel ]: false,
		[ connectionsLabel ]: [
			0,
			3,
			4
		]
	},
	"3": {
		[ toneLabel ]: 6,
		[ positionLabel ]: {
			"x": 0.7938667524116582,
			"z": 0.42399950402726544,
			"y": 1.55
		},
		[ meristemLabel ]: false,
		[ connectionsLabel ]: [
			2
		]
	},
	"4": {
		[ toneLabel ]: 8,
		[ positionLabel ]: {
			"x": 0.6062177826491071,
			"z": 0.3499999999999999,
			"y": 1.7
		},
		[ meristemLabel ]: false,
		[ connectionsLabel ]: [
			2,
			5,
			6
		]
	},
	"5": {
		[ toneLabel ]: 10,
		[ positionLabel ]: {
			"x": 1.027104089199748,
			"z": 0.3937730183102396,
			"y": 1.8
		},
		[ meristemLabel ]: false,
		[ connectionsLabel ]: [
			4
		]
	},
	"6": {
		[ toneLabel ]: 12,
		[ positionLabel ]: {
			"x": 0.636396103067893,
			"z": 0.6363961030678928,
			"y": 1.95
		},
		[ meristemLabel ]: false,
		[ connectionsLabel ]: [
			4
		]
	},
	"7": {
		[ toneLabel ]: 3,
		[ positionLabel ]: {
			"x": -0.14999999999999994,
			"z": 0.2598076211353316,
			"y": 1.2
		},
		[ meristemLabel ]: true,
		[ connectionsLabel ]: [
			8,
			9
		]
	},
	"8": {
		[ toneLabel ]: 5,
		[ positionLabel ]: {
			"x": -0.15521816678371875,
			"z": 0.6825740404529765,
			"y": 1.3
		},
		[ meristemLabel ]: false,
		[ connectionsLabel ]: [
			7
		]
	},
	"9": {
		[ toneLabel ]: 7,
		[ positionLabel ]: {
			"x": -0.35355339059327373,
			"z": 0.3535533905932738,
			"y": 1.45
		},
		[ meristemLabel ]: false,
		[ connectionsLabel ]: [
			7,
			10,
			11
		]
	},
	"10": {
		[ toneLabel ]: 9,
		[ positionLabel ]: {
			"x": -0.7641277178854433,
			"z": 0.4755090227947147,
			"y": 1.55
		},
		[ meristemLabel ]: false,
		[ connectionsLabel ]: [
			9
		]
	},
	"11": {
		[ toneLabel ]: 11,
		[ positionLabel ]: {
			"x": -0.6062177826491069,
			"z": 0.3500000000000002,
			"y": 1.7
		},
		[ meristemLabel ]: false,
		[ connectionsLabel ]: [
			9,
			12,
			13
		]
	},
	"12": {
		[ toneLabel ]: 13,
		[ positionLabel ]: {
			"x": -0.854569481781416,
			"z": 0.6926117244227405,
			"y": 1.8
		},
		[ meristemLabel ]: false,
		[ connectionsLabel ]: [
			11
		]
	},
	"13": {
		[ toneLabel ]: 15,
		[ positionLabel ]: {
			"x": -0.8693332436601615,
			"z": 0.23293714059226894,
			"y": 1.95
		},
		[ meristemLabel ]: false,
		[ connectionsLabel ]: [
			11
		]
	},
	"14": {
		[ toneLabel ]: 4,
		[ positionLabel ]: {
			"x": -0.15000000000000013,
			"z": -0.2598076211353315,
			"y": 1.2
		},
		[ meristemLabel ]: true,
		[ connectionsLabel ]: [
			15,
			16
		]
	},
	"15": {
		[ toneLabel ]: 6,
		[ positionLabel ]: {
			"x": -0.5135173756042053,
			"z": -0.4757098957900386,
			"y": 1.3
		},
		[ meristemLabel ]: false,
		[ connectionsLabel ]: [
			14
		]
	},
	"16": {
		[ toneLabel ]: 8,
		[ positionLabel ]: {
			"x": -0.12940952255126076,
			"z": -0.48296291314453405,
			"y": 1.45
		},
		[ meristemLabel ]: false,
		[ connectionsLabel ]: [
			14,
			17,
			18
		]
	},
	"17": {
		[ toneLabel ]: 10,
		[ positionLabel ]: {
			"x": -0.0297390345262156,
			"z": -0.8995085268219799,
			"y": 1.55
		},
		[ meristemLabel ]: false,
		[ connectionsLabel ]: [
			16
		]
	},
	"18": {
		[ toneLabel ]: 12,
		[ positionLabel ]: {
			"x": -1.2858791391047207e-16,
			"z": -0.7,
			"y": 1.7
		},
		[ meristemLabel ]: false,
		[ connectionsLabel ]: [
			16,
			19,
			20
		]
	},
	"19": {
		[ toneLabel ]: 14,
		[ positionLabel ]: {
			"x": -0.17253460741833146,
			"z": -1.0863847427329798,
			"y": 1.8
		},
		[ meristemLabel ]: false,
		[ connectionsLabel ]: [
			18
		]
	},
	"20": {
		[ toneLabel ]: 16,
		[ positionLabel ]: {
			"x": 0.2329371405922683,
			"z": -0.8693332436601617,
			"y": 1.95
		},
		[ meristemLabel ]: false,
		[ connectionsLabel ]: [
			18
		]
	}
}