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

// debug
require('./util/trace.js');

require('./util/browserCheck.js');

// core
require('aframe');
require('./ascene.js');

require('webvr-ui');
require('./components/copresence-server.js');

require('./components/headset-material.js');
require('./components/bg-tree-ring-material.js');
require('../third_party/aframe-daydream-controller-component/daydream-controller.js');
require('./components/daydream-manager.js');
require('./components/daydream-pointer.js');
require('./components/fake-light.js');
require('./components/tool-tips.js');
require('./components/controller-material.js');

// utility
require('./components/quaternion.js');
require('./components/smooth-motion.js');
require('./components/controllers.js');
require('./components/haptics.js');
require('./components/ga.js');

// shaders
require( './shaders/bg-tree-shader' );
require( './shaders/circle-shader' );
require( './shaders/ball-shader' );

// tree
require('./components/tree.js');
require('./components/ball.js');
require('./components/background-objects.js');

// interaction
require('./components/gaze.js');
require('./components/grab-move.js');
require('./components/touch-color.js');
require('./components/teleport.js');
require('./components/proximity-check.js');
require('./components/clicker.js');
require('./components/wasd-boundaries.js');

//sound
require('./components/tone.js');
require('./components/palette.js');
require('./components/listener.js');

//the splash screen
require('./splash');
