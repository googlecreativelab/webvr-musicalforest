// Copyright 2017 Google Inc.
//
//   Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
//   You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
//   Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS IS' BASIS,
//   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//   See the License for the specific language governing permissions and
// limitations under the License.

import TWEEN from 'tween.js';
import StartAudioContext from 'startaudiocontext';
import Tone from 'tone';
import { getParameterByName, getViewerType } from './util';

const getComponentProperty = AFRAME.utils.entity.getComponentProperty;
const setComponentProperty = AFRAME.utils.entity.setComponentProperty;
const stringify = AFRAME.utils.coordinates.stringify;

AFRAME.registerComponent('splash', {
    flyTweenPosition:undefined,
    flyTweenRotation:undefined,
    isFirstTime:true,
    viewer : false,
    mode:undefined,
    camPos:{ x:0, y:0, z:0 },

    init(){
        if(WebVRConfig){
            WebVRConfig.CARDBOARD_UI_DISABLED = false;
            WebVRConfig.ENABLE_DEPRECATED_API = true;
            WebVRConfig.ROTATE_INSTRUCTIONS_DISABLED = false;
        }
    },
    play(){
        this._splashEl = document.querySelector('#splash');
        this._splashEl.querySelector('#enterButton').appendChild(document.querySelector('.webvr-ui-button'));

        // listen for enter vr
        this.el.addEventListener('enter-vr', () => this._entered('vr'));
        this.el.addEventListener('exit-vr', () => this._exited());

        // start audio context
        StartAudioContext(Tone.context, ['.webvr-ui-button', '#enter-360']);

        // Connect to server on loaded
        if( getParameterByName('autojoin') ){
            setTimeout(() => this._entered('360'), 1000);
        }

        // add's editing capbaility on desktop
        if( getParameterByName('reticle')==='true' ){
            let avatar = document.querySelector('#avatar');
            setComponentProperty(avatar,'grab-move', '');
        }

        let displayId;
        //send analytics events
        let enterVRButton = this.el.components['webvr-ui'].enterVR;
        enterVRButton.on('error', (e)=>{
            ga('send', 'event', 'device', 'error', e);
        }).on('ready', ()=>{
            enterVRButton.getVRDisplay().then((disp)=>{
                displayId = disp.displayId;
                ga('send', 'event', 'device', 'ready', disp.displayName);
            });
        });
        window.addEventListener('gamepadconnected', (e)=>{
            let gamepads = navigator.getGamepads();
            for (let i = 0; i < gamepads.length; ++i) {
                if(gamepads[i]){
                // if(gamepads[i] && gamepads[i].displayId == displayId){
                    ga('send', 'event', 'gamepad', 'ready', gamepads[i].id);
                }
            }
        });
        this._progressBar();
    },

    _progressBar(){
        const promises = [];
        let asset;

        for(let i=0; i<document.querySelectorAll('a-asset-item').length; i++){
            asset = document.querySelectorAll('a-asset-item')[i];
            if (!asset.data){
                promises.push(new Promise(done => {
                    asset.addEventListener('loaded', done);
                }));
            }
        }
        promises.push(new Promise(done => {
            Tone.Buffer.on('load', done);
        }));
        this._allLoaded();
    },

    _allLoaded(){
        // let avatar = document.querySelector('#avatar');
        let camera = document.querySelector('a-entity[camera]');
        let concater = function(obj) {
            Object.keys(obj).forEach( key => {
                obj[key] = ((obj[key]*100) | 0) / 100;
            });
            return JSON.stringify(obj);
        };

        /*
         * HACK: position is stored to counteract height issues
         * associated with Oculus's relative position data
         * using componentchanged instead of EXIT VR
        */
        camera.addEventListener('componentchanged', (event) => {
            if ( event.detail.name === 'position' || event.detail.name === 'rotation' ) {
                let pos = getComponentProperty(camera,'position');
                if (pos.y !== 1.6 && pos.y !== 0){
                    this.camPos.x = pos.x;
                    this.camPos.y = pos.y;
                    this.camPos.z = pos.z;
                }
            }
        });

        this._splashEl.querySelector('#enter-container').classList.add('loaded');
        this._splashEl.querySelector('#enter-360').addEventListener('click', () => this._entered('360'));

        let treeCreatedEvent = (event) => {
            document.removeEventListener('TREE_CREATED', treeCreatedEvent);
            this._animateToTree();
        };
        document.addEventListener('TREE_CREATED', treeCreatedEvent);
    },

    _animateToTree(){
        const player = document.querySelector('#player');
        const avatar = document.querySelector('#avatar');
        const camera = document.querySelector('a-entity[camera]');
        const delay = 500;
        const speed = 1000;

        let position = getComponentProperty(player,'position');
        let rotation = getComponentProperty(player,'rotation');

        let isTabletWindow  = this.isTabletLikeDimensions() && this.isTouchDevice() && this.mode === '360';
        let isTabletVR      = this.isTabletLikeDimensions() && this.isTouchDevice() && this.mode === 'vr';
        let isDesktop       = this.mode === '360' && !AFRAME.utils.device.isMobile();

        let y = (isDesktop) ? 1.6: 0;
        y = (isTabletWindow) ? 0: y;
        const z = this.viewer ? 1.5 : 0;

        this.flyTweenPosition = new TWEEN.Tween(position)
            .to({ x:0, y:y, z:z }, speed)
            .delay(delay)
            .easing(TWEEN.Easing.Quadratic.InOut)
            .onUpdate(() => player.setAttribute('position', position));

        this.flyTweenRotation = new TWEEN.Tween(rotation)
            .to({ x:0, y: 0, z: 0 }, speed)
            .delay(delay)
            .easing(TWEEN.Easing.Quadratic.InOut)
            .onUpdate(() => player.setAttribute('rotation', rotation))
            .onComplete(() => {
                this.isFirstTime = false;
                document.dispatchEvent(new Event('INTRO_COMPLETED'));
            });

        if (this.flyTweenPosition) {
            this.flyTweenPosition.stop();
        }
        if (this.flyTweenRotation) {
            this.flyTweenRotation.stop();
        }
        this.flyTweenPosition.start();
        this.flyTweenRotation.start();
    },

    _exited(){
        this._splashEl.classList.remove('invisible');
        document.dispatchEvent(new Event('EXITED_FOREST'));
        this.removeCardBoardInstructions();
        this.mode = undefined;
    },

    _entered(mode){
        this.mode = mode;
        this.addCardBoardInstructions();

        if(this.mode === '360') {
            this.viewer = true;
            ga('send', 'event', 'clickable_link', 'splash_page', 'enter_360');
        } else {
            ga('send', 'event', 'clickable_link', 'splash_page', 'enter_VR');
        }

        let player = document.querySelector('#player');
        let avatar = document.querySelector('#avatar');
        let camera = document.querySelector('a-entity[camera]');

        if(!this.isFirstTime && !AFRAME.utils.device.isMobile()){
            setComponentProperty(player,'position', '0 0 0');
            setComponentProperty(avatar,'position', this.camPos);
            setComponentProperty(camera,'position', this.camPos);

        } else if (!this.isFirstTime){
            setComponentProperty(player,'position', '0 0 0');
            setComponentProperty(avatar,'position', '0 1.6 0');
            setComponentProperty(camera,'position', '0 1.6 0');

        }
        this.el.removeEventListener('enter-vr', () => this._entered());
        this._splashEl.querySelector('#enter-360').removeEventListener('click', () => this._entered());

        this._splashEl.classList.add('invisible');
        this.el.sceneEl.systems['copresence-server'].connectToServer();

        // add ux based on device
        getViewerType((clientType) => {
            this._setSceneParameters({
                clientType: clientType,
                mode:       this.mode,
                isMobile:   AFRAME.utils.device.isMobile(),
            });
            document.dispatchEvent(new Event('ENTERED_FOREST'));
        });
    },
    _setSceneParameters(params){
        let avatar          = document.querySelector('#avatar');
        let player          = document.querySelector('#player');
        let camera          = document.querySelector('a-entity[camera]');
        let floor           = document.querySelector('#gaze-floor');

        let floorStatic     = document.querySelector('#floorStatic');
        let skyStatic       = document.querySelector('#skyStatic');


        let isTabletWindow  = this.isTabletLikeDimensions() && this.isTouchDevice() && this.mode === '360';
        let isTabletVR      = this.isTabletLikeDimensions() && this.isTouchDevice() && this.mode === 'vr';
        let is6DOF          = params.clientType === '6dof';
        let isDesktop       = params.clientType === 'viewer' && !params.isMobile;
        let is3DOF          = params.clientType === '3dof';
        let isMagicWindow   = params.isMobile && this.mode === '360';
        let isCardBoard     = params.isMobile && this.mode === 'vr';

        if(isTabletVR){
            setComponentProperty(avatar, 'position', '0 1.6 0');
            setComponentProperty(floor,'teleport', '');
            setComponentProperty(avatar,'look-controls', '');
            setComponentProperty(avatar,'clicker', '');

        } else if(isTabletWindow){
            setComponentProperty(avatar, 'position', '0 1.6 0');
            setComponentProperty(avatar, 'rotation', '-35 0 0');
            setComponentProperty(floor,'teleport', '');
            setComponentProperty(avatar,'look-controls', '');
            setComponentProperty(avatar,'clicker', '');

        } else if(is6DOF){
            setComponentProperty(avatar,'look-controls', '');
            setComponentProperty(avatar,'clicker', '');
            setComponentProperty(floorStatic,'material', 'shader: flat; color: #e9a69a;');

        } else if (isDesktop){
            setComponentProperty(avatar, 'camera', 'userHeight:0.0');
            setComponentProperty(player,'look-controls', '');
            setComponentProperty(player,'wasd-controls', 'acceleration:35; easing:25;');
            setComponentProperty(player,'wasd-boundaries', 'maxRadius:3.125;');
            setComponentProperty(avatar,'clicker', '');
            setComponentProperty(floorStatic,'material', 'shader: flat; color: #e9a69a;');

        } else if (is3DOF) {
            setComponentProperty(floor,'teleport', '');
            setComponentProperty(avatar,'look-controls', '');
            setComponentProperty(avatar,'clicker', '');

        } else if (isMagicWindow){
            this.removeCardBoardInstructions();
            setComponentProperty(floor, 'teleport', '');
            setComponentProperty(avatar,'look-controls', '');
            setComponentProperty(avatar,'clicker', '');

        } else if (isCardBoard){
            setComponentProperty(floor, 'teleport', '');
            setComponentProperty(avatar,'look-controls', '');

        } else {

        }
    },
    removeCardBoardInstructions(){
        let cardboard = document.querySelector("#cardboard");
        if(cardboard) {
            cardboard.remove();
        }
    },

    addCardBoardInstructions(){
        if(AFRAME.utils.device.isMobile() && this.mode === 'vr'){
            let cardboard = document.createElement('div');
            cardboard.id = 'cardboard';
            document.body.appendChild(cardboard);

            // createElement
            let container = document.createElement('div');
            container.id = 'cardboardContainer';
            cardboard.appendChild(container);

            let img = document.createElement("img");
            img.id = "img";
            img.src = `/static/img/cardboardInstructions.gif`;
            container.appendChild(img);

            let p = document.createElement("p");
            p.innerHTML = 'Place your phone into your default viewer<br><br>';
            container.appendChild(p);

            let p2 = document.createElement("p");
            p2.innerHTML = 'No Cardboard viewer?';
            container.appendChild(p2);

            let b = document.createElement("button");
            b.innerHTML = `GET ONE`;
            container.appendChild(b);

            b.addEventListener("click", () => {
                window.open("https://vr.google.com/cardboard/get-cardboard/", '_blank');
            });
        }
    },
    isTabletLikeDimensions() {
        let w = screen.availWidth;
        let h = screen.availHeight;
        return ( ( (w > h) ? w : h ) >= 960 );
    },
    isTouchDevice() {
        return 'ontouchstart' in window || navigator.maxTouchPoints;      // works on most browsers ||  works on IE10/11 and Surface
    },
});

function tweenUpdate() {
    requestAnimationFrame(tweenUpdate);
    TWEEN.update();
}
tweenUpdate();


(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
    (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

ga('create', 'UA-90331006-2', 'auto');
ga('send', 'pageview');

let aboutBTN = document.getElementById('about-button');
let about = document.getElementById('about');

aboutBTN.addEventListener('click', () => {
    about.classList.add('visible');
    aboutBTN.classList.remove('visible');
    ga('send', 'event', 'clickable_link', 'splash_page', 'show_info');
});

about.addEventListener('click', () => {
    about.classList.remove('visible');
    aboutBTN.classList.add('visible');
});
