// Copyright 2017 Google Inc.
//
//   Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
//   You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
//   Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
//   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//   See the License for the specific language governing permissions and
// limitations under the License.

import Tone from 'tone';


export class Instrument {

	constructor( data ) {
		const folder = data.name;
		const urls = {};
		const filetype = Tone.Buffer.supportsType('mp3') ? 'mp3' : 'ogg';

		for (let i = 0; i < data.noteCount; i++){
			urls[i] = `static/audio/${folder}/${i}.${filetype}`;
		}

		this._buffers = new Tone.Buffers(urls);

		this.color = data.color;
		this.shape = data.shape;
		this.output = new Tone.Gain().toMaster();
		this.output.gain.value = 2;
	}

	trigger(time, tone, velocity, x, y, z){
		if (this._buffers.loaded){
			const source = this._createSource(time, tone, velocity);
			const panner = this._createPanner(x, y, z);
			source.connect(panner);
		}
	}

	_createPanner(x, y, z){
		const panner = Tone.context.createPanner();
		panner.rolloffFactor = 2;
		panner.setPosition(x, y, z);
		panner.connect(this.output);
		return panner;
	}

	_createSource(time, note, velocity){
		const buffer = this._buffers.get(note);
		const source = new Tone.BufferSource(buffer);
		source.start(time, 0, undefined, velocity * 0.5, 0.01);
		return source;
	}


	dispose(){
		this.output.dispose();
	}
}
