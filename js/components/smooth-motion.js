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

var degToRad = require('three').Math.degToRad;


function LowpassFilter(Fc) {
    var Q = 0.707;
    var K = Math.tan(Math.PI * Fc);
    var norm = 1 / (1 + K / Q + K * K);

    this.a0 = K * K * norm;
    this.a1 = 2 * this.a0;
    this.a2 = this.a0;
    this.b1 = 2 * (K * K - 1) * norm;
    this.b2 = (1 - K / Q + K * K) * norm;
    this.z1 = this.z2 = 0;
    this.value = 0;


    this.tick = function(value) {
        var out = value * this.a0 + this.z1;
        this.z1 = value * this.a1 + this.z2 - this.b1 * out;
        this.z2 = value * this.a2 - this.b2 * out;
        return out;
    };


}


/**
 * Interpolate component for A-Frame.
 */
AFRAME.registerComponent('smooth-motion', {
    schema: {
        amount: {
            default: 1
        }
    },

    /**
     * Called once when component is attached. Generally for initial setup.
     */
    init: function() {
        this.quaternion = new THREE.Quaternion();
    },

    /**
     * Called when component is attached and when component data changes.
     * Generally modifies the entity based on the data.
     */
    update: function(oldData) {
        if (!this.filterPosX) {
            var amount = parseFloat(this.data.amount);
            if (amount > 0) {
                var freq = 0.1 / amount;

                this.filterPosX = new LowpassFilter(freq, this);
                this.filterPosY = new LowpassFilter(freq, this);
                this.filterPosZ = new LowpassFilter(freq, this);
            }
        }
    },

    /**
     * Called when a component is removed (e.g., via removeAttribute).
     * Generally undoes all modifications to the entity.
     */
    remove: function() {},

    /**
     * Called on each scene tick.
     */
    tick: function(t) {
        if (!this.filterPosX) { return; }

        var p = AFRAME.utils.entity.getComponentProperty(this.el, 'position');
        this.el.object3D.position.setX(this.filterPosX.tick(p.x));
        this.el.object3D.position.setY(this.filterPosY.tick(p.y));
        this.el.object3D.position.setZ(this.filterPosZ.tick(p.z));

        var quaternion;
        if (AFRAME.utils.entity.getComponentProperty(this.el, 'quaternion')) {
            var q = AFRAME.utils.entity.getComponentProperty(this.el, 'quaternion');
            quaternion = new THREE.Quaternion(q._x, q._y, q._z, q._w);
        } else {
            var r = AFRAME.utils.entity.getComponentProperty(this.el, 'rotation');
            quaternion = new THREE.Quaternion();
            quaternion.setFromEuler(new THREE.Euler(degToRad(r.x), degToRad(r.y), degToRad(r.z), 'YXZ'));
        }

        this.quaternion.slerp(quaternion, 1 / (3 * parseFloat(this.data.amount)));
        this.el.object3D.quaternion.copy(this.quaternion);
    }
});
