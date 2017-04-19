![alt text](https://forest.webvrexperiments.com/static/img/fbshare.jpg "The Musical Forest, a WebVR Experiment")

# Musical Forest

Musical Forest is a multiplayer musical experiment in virtual reality. It uses copresence —the synchronization of multiple people in a virtual space— to allow people to play music together in VR. WebSockets are used to sync all of the connected players in real-time. 

Musical Forest, a [WebVR Experiment](https://webvrexperiments.com/).
<br>
<br>

## Basic Interaction 

Each of the shapes triggers a note when it’s hit. Users can navigate the space, play notes and also hear and play with all of the other players in the space at the same time. 
<br>
![alt text](https://forest.webvrexperiments.com/static/img/MusicalForest.gif "The Musical Forest, mixed reality interaction example")
<br>
<br>

## Objects & Audio

There are three different shapes of musical objects corresponding to three different sets of sounds. Each set has six notes, chosen from a pentatonic scale. 

* Spheres: Percussion (Conga, Woodblock, COWBELL!)
* Triangular Pyramids: Voice + Flute
* Cubes: Marimba

Sounds are positioned in 3D space using the Web Audio API’s PannerNode. 
<br>
<br>

## Headsets & Interaction Models

Musical Forest responsively adapts features depending on the capabilities of the VR Hardware. 

### Vive/Oculus

Play: hit the shapes with your controller to hear its sound. The volume of the sound changes depending on how hard you hit it. <br>
Create: tap the trigger to create a new shape. Rotate the circular pad to change the note. <br>
Rearrange: place the controller over an existing object, press and hold the trigger to grab it. Move your controller and release to move it to a new space. Hovering your controller over an object and rotating the circular pad will change the type of shape and it’s sound.<br>
Navigation: move within the bounds of your roomscale environment to interact with the objects within the experience.

### Daydream

Play: Hit the shapes with your controller to hear their sounds. <br>
Navigation: point the Daydream controller at the ground and a circle will appear. Press the main button on the controller to teleport to that highlighted spot.

### Cardboard

Play: gaze at an object and see it glow. Tap the interaction button to hear that object.<br>
Navigation: gaze at the ground and a circle will appear. Tap the interaction button to teleport to the highlighted spot.

### Magic Window

Interaction: tap any object to hear the sound of that object. <br>
Navigation: gaze at the ground and a circle will appear. Tap anywhere to teleport to where the reticle is pointing.

### Desktop

Interaction: use the mouse to click any object to hear its sound. The volume of the sound is dictated by the object’s distance from the user.<br>
Navigation: use the WASD keys on the keyboard. Use the mouse to change the field of view by clicking in empty space and dragging. 
<br>
<br>

## Technologies Used
### Frontend

Musical Forest uses [A-Frame](https://aframe.io) which is built with the WebVR standard and [Tone.js](https://github.com/Tonejs/Tone.js/) for sound.

### Backend

The backend is developed in Node.js. To get a full overview of the technologies and libraries used, see the [backend readme](backend/README.md#Description)
<br>
<br>

## Running the Frontend Code

Download the source code, and install all dependencies by running `npm install`. To run the frontend, run `npm start`, this will start a local webserver using `budo` connecting to the default backend server. If you have a local backend server running, append `?server=localhost` to the url. 
<br>
<br>

## Acknowledgements

[Manny Tan](https://github.com/mannytan), [Igor Clark](https://github.com/igorclark), [Yotam Mann](https://github.com/tambien), [Alexander Chen](https://github.com/alexanderchen), [Jonas Jongejan](https://github.com/halfdanj), [Jeremy Abel](https://github.com/jeremyabel), [Saad Moosajee](https://github.com/moosajee), Alex Jacobo-Blonder, [Ryan Burke](https://github.com/ryburke), and many others at Google Creative Lab.
