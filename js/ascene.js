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

let aframeContent = `
<a-scene
    webvr-ui
    splash
    copresence-server
    controllers
    tree
    fake-light
    fog="type: exponential; color: #e9a69a; density: 0.065;">
<a-assets>
    <img id="ball_circles_134" src="/static/img/ball_circles_134.png">
    <img id="ball_circles_567" src="/static/img/ball_circles_567.png">
    <img id="ball_triangles_134" src="/static/img/ball_triangles_134.png">
    <img id="ball_triangles_567" src="/static/img/ball_triangles_567.png">
    <img id="ball_squares_134" src="/static/img/ball_squares_134.png">
    <img id="ball_squares_567" src="/static/img/ball_squares_567.png">
    <img id="bg-tree-tex" src="/static/img/mobile-trees.png">

    <a-asset-item id="target-obj" src="/static/models/target.obj"></a-asset-item>
    <a-asset-item id="head-obj" src="/static/models/headset.dae"></a-asset-item>
    <a-asset-item id="controller-obj" src="/static/models/controller.dae"></a-asset-item>
    <a-asset-item id="bg-tree-1-obj" src="/static/models/bg-tree-1.obj"></a-asset-item>
    <a-asset-item id="bg-tree-2-obj" src="/static/models/bg-tree-2.obj"></a-asset-item>
    <a-asset-item id="bg-tree-3-obj" src="/static/models/bg-tree-3.obj"></a-asset-item>
    <a-asset-item id="bg-tree-ring-obj" src="/static/models/bg-tree-ring.obj"></a-asset-item>

    <a-mixin
        id="avatar-head"
        collada-model="#head-obj"
        headset-material></a-mixin>
    <a-mixin
        id="avatar-hand"
        collada-model="#controller-obj"></a-mixin>
    <a-mixin
        id="obj-ball"
        geometry="primitive: sphere; radius:0.01; segments-width:2; segments-height:2;"
        material=""></a-mixin>
    <a-mixin
        id="obj-hit"
        geometry="primitive: cylinder; radius: 0.35; height: 0.001;"
        material="color: #cf4e51;"></a-mixin>
</a-assets>

<a-entity
    id="player"
    position="1 2 10"
    rotation="-25 25 0">
    <a-entity
        id="avatar"
        proximity-check
        raycaster="objects: .selectable; near:0.01; far:10; recursive: true; interval:100;"
        camera="userHeight: 1.6; near:0.01;"
        mixin="avatar-head"
        gaze
        touch-color
        position="0 0 0"
        rotation="0 0 0"
        listener
        copresence="components: mixin, position, rotation; decimals:3; playerpart:head"></a-entity>
</a-entity>

<a-entity
    id="gaze-floor"
    class="selectable"
    geometry="primitive: circle; radius: 4;"
    rotation="-90 0 0"
    position="0 -0.0005 0"
    material="shader: flat; color: #e9a69a;"></a-entity>

<a-entity
    id="gaze-hit"
    position="0.0 0.0 0"
    obj-model="obj: #target-obj;"
    material="shader:flat; color: #fff;"
    visible="false">
    </a-entity>

<a-entity
    id="floorStatic"
    geometry="primitive: plane; width:80; height:80"
    rotation="-90 0 0"
    position="0 -0.01 0"
    material="shader: flat; color: #e7a094;"></a-entity>

<a-entity
    id="mobile-tree-ring-1"
    bg-tree-ring-material="0"
    position="0, 0, 0"
    scale="0.2, 1, 0.2"></a-entity>

<a-entity
    id="mobile-tree-ring-2"
    bg-tree-ring-material="1"
    position="0, 0, 0"
    scale="0.3, 1, 0.3"
    rotation="0, 250, 0"></a-entity>

<a-entity
    id="mobile-tree-ring-3"
    bg-tree-ring-material="2"
    position="0, 0, 0"
    scale="0.4, 1, 0.4"
    rotation="0, 53, 0"></a-entity>

<a-entity
    id="background-objects"
    background-objects></a-entity>

<a-sky id="skyStatic" color="#e7a094"></a-sky>


</a-scene>`;

let div = document.createElement("div");
div.innerHTML = aframeContent;
document.body.appendChild(div);
