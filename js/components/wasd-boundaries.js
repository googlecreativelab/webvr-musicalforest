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

const getComponentProperty = AFRAME.utils.entity.getComponentProperty;
const setComponentProperty = AFRAME.utils.entity.setComponentProperty;

AFRAME.registerComponent( 'wasd-boundaries', {

    schema: {
        maxRadius: {default: 5.0, type: 'float'},
    },

    init: function() {
        document.addEventListener("INTRO_COMPLETED", () => {
            let radius = this.data.maxRadius;
            this.el.addEventListener("componentchanged", event => {
                if (event.detail.name === "position") {
                    let position = event.detail.newData;
                    if (position.z > radius) {
                        position.z = radius;
                    }
                    if (position.z < -radius) {
                        position.z = -radius;
                    }

                    if (position.x > radius) {
                        position.x = radius;
                    }
                    if (position.x < -radius) {
                        position.x = -radius;
                    }

                    setComponentProperty(this.el, "position", position);
                }
            });
        });
    },

    play: function() {

    },

    pause: function() {

    },
});
