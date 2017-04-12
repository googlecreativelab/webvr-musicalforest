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
			"x": 0.5,
			"z": 0,
			"y": 1.3
		},
		[ meristemLabel ]: true,
		[ connectionsLabel ]: [
			1
		]
	},
	"1": {
		[ toneLabel ]: 5,
		[ positionLabel ]: {
			"x": 0.8955037487502232,
			"z": 0.08985007498214534,
			"y": 1.4000000000000001
		},
		[ meristemLabel ]: false,
		[ connectionsLabel ]: [
			0
		]
	},
	"2": {
		[ toneLabel ]: 8,
		[ positionLabel ]: {
			"x": 0.11126046697815722,
			"z": 0.4874639560909118,
			"y": 1.3357142857142859
		},
		[ meristemLabel ]: true,
		[ connectionsLabel ]: [
			3
		]
	},
	"3": {
		[ toneLabel ]: 6,
		[ positionLabel ]: {
			"x": 0.1116709845215571,
			"z": 0.8930451227211232,
			"y": 1.435714285714286
		},
		[ meristemLabel ]: false,
		[ connectionsLabel ]: [
			2
		]
	},
	"4": {
		[ toneLabel ]: 9,
		[ positionLabel ]: {
			"x": -0.4504844339512095,
			"z": 0.21694186955877912,
			"y": 1.3714285714285714
		},
		[ meristemLabel ]: true,
		[ connectionsLabel ]: [
			5
		]
	},
	"5": {
		[ toneLabel ]: 7,
		[ positionLabel ]: {
			"x": -0.8458054852071072,
			"z": 0.3075923945639262,
			"y": 1.4714285714285715
		},
		[ meristemLabel ]: false,
		[ connectionsLabel ]: [
			4
		]
	},
	"6": {
		[ toneLabel ]: 10,
		[ positionLabel ]: {
			"x": -0.31174490092936685,
			"z": -0.39091574123401485,
			"y": 1.4071428571428573
		},
		[ meristemLabel ]: true,
		[ connectionsLabel ]: [
			7
		]
	},
	"7": {
		[ toneLabel ]: 8,
		[ positionLabel ]: {
			"x": -0.4880898375488758,
			"z": -0.756153628888675,
			"y": 1.5071428571428573
		},
		[ meristemLabel ]: false,
		[ connectionsLabel ]: [
			6
		]
	},
	"8": {
		[ toneLabel ]: 11,
		[ positionLabel ]: {
			"x": 0.3117449009293667,
			"z": -0.39091574123401496,
			"y": 1.4428571428571428
		},
		[ meristemLabel ]: true,
		[ connectionsLabel ]: [
			9
		]
	},
	"9": {
		[ toneLabel ]: 9,
		[ positionLabel ]: {
			"x": 0.6285850721951838,
			"z": -0.6441124179934553,
			"y": 1.542857142857143
		},
		[ meristemLabel ]: false,
		[ connectionsLabel ]: [
			8
		]
	},
	"10": {
		[ toneLabel ]: 12,
		[ positionLabel ]: {
			"x": 0.45048443395120963,
			"z": 0.21694186955877895,
			"y": 1.4785714285714286
		},
		[ meristemLabel ]: true,
		[ connectionsLabel ]: [
			11
		]
	},
	"11": {
		[ toneLabel ]: 10,
		[ positionLabel ]: {
			"x": 0.7678365122206151,
			"z": 0.46949663523914764,
			"y": 1.5785714285714287
		},
		[ meristemLabel ]: false,
		[ connectionsLabel ]: [
			10
		]
	},
	"12": {
		[ toneLabel ]: 13,
		[ positionLabel ]: {
			"x": -0.11126046697815704,
			"z": 0.48746395609091187,
			"y": 1.5142857142857142
		},
		[ meristemLabel ]: true,
		[ connectionsLabel ]: [
			13
		]
	},
	"13": {
		[ toneLabel ]: 11,
		[ positionLabel ]: {
			"x": -0.2868656765450031,
			"z": 0.8530580775189798,
			"y": 1.6142857142857143
		},
		[ meristemLabel ]: false,
		[ connectionsLabel ]: [
			12
		]
	},
	"14": {
		[ toneLabel ]: 14,
		[ positionLabel ]: {
			"x": -0.5,
			"z": 1.8369701987210297e-16,
			"y": 1.55
		},
		[ meristemLabel ]: true,
		[ connectionsLabel ]: [
			15
		]
	},
	"15": {
		[ toneLabel ]: 12,
		[ positionLabel ]: {
			"x": -0.8955037487502232,
			"z": -0.08985007498214469,
			"y": 1.6500000000000001
		},
		[ meristemLabel ]: false,
		[ connectionsLabel ]: [
			14
		]
	},
	"16": {
		[ toneLabel ]: 15,
		[ positionLabel ]: {
			"x": -0.1112604669781574,
			"z": -0.48746395609091175,
			"y": 1.5857142857142859
		},
		[ meristemLabel ]: true,
		[ connectionsLabel ]: [
			17
		]
	},
	"17": {
		[ toneLabel ]: 13,
		[ positionLabel ]: {
			"x": -0.11167098452155783,
			"z": -0.8930451227211231,
			"y": 1.685714285714286
		},
		[ meristemLabel ]: false,
		[ connectionsLabel ]: [
			16
		]
	},
	"18": {
		[ toneLabel ]: 16,
		[ positionLabel ]: {
			"x": 0.45048443395120946,
			"z": -0.21694186955877928,
			"y": 1.6214285714285714
		},
		[ meristemLabel ]: true,
		[ connectionsLabel ]: [
			19
		]
	},
	"19": {
		[ toneLabel ]: 14,
		[ positionLabel ]: {
			"x": 0.8458054852071069,
			"z": -0.3075923945639269,
			"y": 1.7214285714285715
		},
		[ meristemLabel ]: false,
		[ connectionsLabel ]: [
			18
		]
	},
	"20": {
		[ toneLabel ]: 17,
		[ positionLabel ]: {
			"x": 0.31174490092936696,
			"z": 0.39091574123401474,
			"y": 1.6571428571428573
		},
		[ meristemLabel ]: true,
		[ connectionsLabel ]: [
			21
		]
	},
	"21": {
		[ toneLabel ]: 15,
		[ positionLabel ]: {
			"x": 0.4880898375488761,
			"z": 0.7561536288886749,
			"y": 1.7571428571428573
		},
		[ meristemLabel ]: false,
		[ connectionsLabel ]: [
			20
		]
	},
	"22": {
		[ toneLabel ]: 18,
		[ positionLabel ]: {
			"x": -0.31174490092936585,
			"z": 0.3909157412340156,
			"y": 1.6928571428571428
		},
		[ meristemLabel ]: true,
		[ connectionsLabel ]: [
			23
		]
	},
	"23": {
		[ toneLabel ]: 16,
		[ positionLabel ]: {
			"x": -0.6285850721951823,
			"z": 0.6441124179934566,
			"y": 1.792857142857143
		},
		[ meristemLabel ]: false,
		[ connectionsLabel ]: [
			22
		]
	},
	"24": {
		[ toneLabel ]: 19,
		[ positionLabel ]: {
			"x": -0.4504844339512097,
			"z": -0.21694186955877878,
			"y": 1.7285714285714286
		},
		[ meristemLabel ]: true,
		[ connectionsLabel ]: [
			25
		]
	},
	"25": {
		[ toneLabel ]: 17,
		[ positionLabel ]: {
			"x": -0.7678365122206144,
			"z": -0.4694966352391487,
			"y": 1.8285714285714287
		},
		[ meristemLabel ]: false,
		[ connectionsLabel ]: [
			24
		]
	},
	"26": {
		[ toneLabel ]: 20,
		[ positionLabel ]: {
			"x": 0.11126046697815686,
			"z": -0.48746395609091187,
			"y": 1.7642857142857142
		},
		[ meristemLabel ]: true,
		[ connectionsLabel ]: [
			27
		]
	},
	"27": {
		[ toneLabel ]: 18,
		[ positionLabel ]: {
			"x": 0.2868656765450043,
			"z": -0.8530580775189793,
			"y": 1.8642857142857143
		},
		[ meristemLabel ]: false,
		[ connectionsLabel ]: [
			26
		]
	}
}