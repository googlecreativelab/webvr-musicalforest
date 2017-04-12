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

export function getParameterByName(name, url) {
    if (!url) {
        url = window.location.href;
    }
    name = name.replace(/[\[\]]/g, "\\$&");
    let regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

export function scale(value, inMin, inMax, outMin, outMax) {
    return ((value - inMin) / (inMax - inMin)) * (outMax - outMin) + outMin;
}

export function getViewerType(callBack){

    navigator.getVRDisplays()
    .then( function( displays ) {
        if(displays.length>0 && displays[0].isPresenting) {
            if (displays[0].stageParameters === null) {
                callBack('3dof');
            } else {
                callBack('6dof');
            }
        } else {
            callBack('viewer');
        }
    })
    .catch( function() {
        callBack('viewer');
    });

}

export function showErrorMessage(imgURL, errorCode, cta, ctaUrl){

    console.error(errorCode);
    let error = document.querySelector("#error");

    // delete error if it already exists
    if(error) {
        error.remove();
    }

    // createElement
    error = document.createElement('div');
    error.id = 'error';
    document.body.appendChild(error);

    let container = document.createElement('div');
    container.id = 'errorContainer';
    error.appendChild(container);

    let img = document.createElement("img");
    img.id = "img";
    img.src = `/static/img/${imgURL}`;
    container.appendChild(img);

    let p = document.createElement("p");
    let notification = `${errorCode}`;
    p.appendChild(document.createTextNode(notification));
    container.appendChild(p);

    let b = document.createElement("button");
    b.innerHTML = `${cta}`;
    container.appendChild(b);

    b.addEventListener("click", () => {
        if(ctaUrl){
            window.open(ctaUrl, '_blank');
        } else {
            window.location.href = window.location.href.replace(/#.*/,'#');
            error.remove();
            let splash = document.querySelector('#splash');
            splash.classList.remove('invisible');
        }
    });
}

window.showErrorMessage = showErrorMessage;
