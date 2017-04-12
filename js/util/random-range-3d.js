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

import { RandomRange } from './random-range-1d';

export class RandomRange3D {

	constructor( min, max ) {
		this.type = min.constructor;
		this.range3D = {
			x: new RandomRange( min.x, max.x ),
			y: new RandomRange( min.y, max.y ),
			z: new RandomRange( min.z, max.z )
		};
	}

	get x() { return this.range3D.x.value; }
	get y() { return this.range3D.y.value; }
	get z() { return this.range3D.z.value; }
	
	get [ 'value' ]() { 
		return new this.type( this.x, this.y, this.z );
	}
}