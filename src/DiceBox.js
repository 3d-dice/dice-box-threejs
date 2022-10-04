import * as THREE from "three"
import * as CANNON from "cannon-es"

import { DiceNotation } from './DiceNotation.js';
import { DiceFactory } from './DiceFactory.js';
import { DiceColors } from './DiceColors.js';
import { THEMES } from './const/themes.js';
// import CannonDebugger from 'cannon-es-debugger'

import { debounce } from "./helpers"

const defaultConfig = {
	assetPath: "./",
	framerate: (1/60),
	sounds: false,
	volume: 100,
	color_spotlight: 0xefdfd5,
	shadows: true,
	theme_surface:  "green-felt",
	sound_dieMaterial: 'plastic',
	theme_customColorset: null,
	theme_colorset: "white",
	theme_texture: "",
	theme_material: "glass",
	gravity_multiplier: 400,
	light_intensity: 0.7,
	baseScale: 100,
	strength: 1,
	iterationLimit: 1000,
	onRollComplete: () => {},
	onRerollComplete: () => {},
	onAddDiceComplete: () => {}
}

class DiceBox {

	constructor(element_container, options = {}) {
		//private variables
		this.initialized = false
		this.container = document.querySelector(element_container);
		this.dimensions = new THREE.Vector2(this.container.clientWidth, this.container.clientHeight)
		this.adaptive_timestep = false;
		this.last_time = 0;
		this.running = false;
		this.rolling = false;
		this.threadid;

		this.display = {
			currentWidth: null,
			currentHeight: null,
			containerWidth: null,
			containerHeight: null,
			aspect: null,
			scale: null
		};

		this.cameraHeight = {
			max: null,
			close: null,
			medium: null,
			far: null
		};

		this.scene = new THREE.Scene();
		this.world = new CANNON.World();
		this.dice_body_material = new CANNON.Material();
		this.sounds_table = {};
		this.sounds_dice = [];
		this.lastSoundType = '';
		this.lastSoundStep = 0;
		this.lastSound = 0;
		this.iteration;
		this.renderer;
		this.barrier;
		this.camera;
		this.light;
		this.light_amb;
		this.desk;
		this.box_body = {};
		this.bodies = [];
		this.meshes = [];
		this.diceList = [];
		this.notationVectors = null
		this.dieIndex = 0

		//public variables
		// this.framerate = (1/60);
		// this.sounds = false;
		// this.volume = 100;
		// this.theme_surface = "green-felt"
		// this.sound_dieMaterial = 'plastic'
		this.soundDelay = 10; // time between sound effects in ms
		this.animstate = '';
		// this.tally = true;


		this.selector = {
			animate: true,
			rotate: true,
			intersected: null,
			dice: []
		};

		// this.colors = {
		// 	ambient:  0xf0f5fb,
		// 	spotlight: 0xefdfd5
		// };

		// this.shadows = true

		// merge this with default config and any options coming in
		Object.assign(this, defaultConfig, options)

		this.DiceColors = new DiceColors({assetPath: this.assetPath});
		this.DiceFactory = new DiceFactory({
			baseScale: this.baseScale
		});
		this.DiceFactory.setBumpMapping(true);

		// post config settings
		this.surface = THEMES[this.theme_surface].surface

	}


	enableShadows(){
		this.shadows = true;
		if (this.renderer) this.renderer.shadowMap.enabled = this.shadows;
		if (this.light) this.light.castShadow = this.shadows;
		if (this.desk) this.desk.receiveShadow = this.shadows;
	}
	disableShadows() {
		this.shadows = false;
		if (this.renderer) this.renderer.shadowMap.enabled = this.shadows;
		if (this.light) this.light.castShadow = this.shadows;
		if (this.desk) this.desk.receiveShadow = this.shadows;
	}

	async initialize() {

		// this.cannonDebugger = new CannonDebugger(this.scene,this.world)
		this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
		this.container.appendChild(this.renderer.domElement);
		this.renderer.shadowMap.enabled = this.shadows;
		this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
		this.renderer.setClearColor(0x000000, 0);

		this.setDimensions(this.dimensions);

		this.world.gravity.set(0, 0, -9.8 * this.gravity_multiplier);
		this.world.broadphase = new CANNON.NaiveBroadphase();
		this.world.solver.iterations = 14;
		this.world.allowSleep = true;

		// this.scene.add(new THREE.HemisphereLight( 0xffffbb, 0x676771, 1 ));

		this.makeWorldBox()
		
		this.resizeWorld()

		await this.loadTheme({
			colorset: this.theme_colorset,
			texture: this.theme_texture,
			material: this.theme_material
		})
		.catch(e=>{throw new Error("Unable to load theme")})

		if(this.sounds){
			await this.loadSounds()
			.catch(e=>{throw new Error("Unable to load sounds")})
		}

		// this.DiceFactory.setCubeMap(`./themes/${this.theme_surface}/`,THEMES[this.theme_surface].cubeMap)

		this.initialized = true

		this.renderer.render(this.scene, this.camera);
	}

	makeWorldBox(){
		if(Object.keys(this.box_body).length) {
			this.world.removeBody(this.box_body.desk)
			this.world.removeBody(this.box_body.topWall)
			this.world.removeBody(this.box_body.bottomWall)
			this.world.removeBody(this.box_body.leftWall)
			this.world.removeBody(this.box_body.rightWall)
		}

		const desk_body_material = new CANNON.Material();
		const barrier_body_material = new CANNON.Material();

		this.world.addContactMaterial(new CANNON.ContactMaterial( desk_body_material, this.dice_body_material, {mass:0,friction: 0.6, restitution: 0.5}));
		this.world.addContactMaterial(new CANNON.ContactMaterial( barrier_body_material, this.dice_body_material, {mass:0, friction: 0.6, restitution: 1.0}));
		this.world.addContactMaterial(new CANNON.ContactMaterial( this.dice_body_material, this.dice_body_material, {mass:0,friction: 0.6, restitution: 0.5}));

		this.box_body.desk = new CANNON.Body({allowSleep: false, mass: 0, shape: new CANNON.Plane(), material: desk_body_material})
		this.world.addBody(this.box_body.desk);
		
		this.box_body.topWall = new CANNON.Body({allowSleep: false, mass: 0, shape: new CANNON.Plane(), material: barrier_body_material});
		this.box_body.topWall.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI / 2);
		this.box_body.topWall.position.set(0, this.display.containerHeight * 0.93, 0);
		this.world.addBody(this.box_body.topWall);

		this.box_body.bottomWall = new CANNON.Body({allowSleep: false, mass: 0, shape: new CANNON.Plane(), material: barrier_body_material});
		this.box_body.bottomWall.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
		this.box_body.bottomWall.position.set(0, -this.display.containerHeight * 0.93, 0);
		this.world.addBody(this.box_body.bottomWall);

		this.box_body.leftWall = new CANNON.Body({allowSleep: false, mass: 0, shape: new CANNON.Plane(), material: barrier_body_material});
		this.box_body.leftWall.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), -Math.PI / 2);
		this.box_body.leftWall.position.set(this.display.containerWidth * 0.93, 0, 0);
		this.world.addBody(this.box_body.leftWall);

		this.box_body.rightWall = new CANNON.Body({allowSleep: false, mass: 0, shape: new CANNON.Plane(), material: barrier_body_material});
		this.box_body.rightWall.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), Math.PI / 2);
		this.box_body.rightWall.position.set(-this.display.containerWidth * 0.93, 0, 0);
		this.world.addBody(this.box_body.rightWall);
	}

	async loadTheme(themeConfig){
		let colorData
		if(this.theme_customColorset){
			colorData = await this.DiceColors.makeColorSet(this.theme_customColorset)
		} else {
			colorData = await this.DiceColors.getColorSet(themeConfig)
		}
		this.DiceFactory.applyColorSet(colorData)
		this.colorData = colorData
	}

	async loadSounds(){
		let surfaces = {
			felt: 7,
			wood_table: 7,
			wood_tray: 7,
			metal: 9
		}

		//TODO: add dice hit noises for other materials
		let dieMaterials = {
			coin: 6,
			metal: 12,
			plastic: 15,
			wood: 12
		}

		const hassound_dieMaterial = this.colorData.texture.material.match(/wood|metal/g)

		this.sound_dieMaterial = hassound_dieMaterial ? this.colorData.texture.material : "plastic"
		
		if(!this.sounds_table.hasOwnProperty(this.surface)){
			this.sounds_table[this.surface] = [];
			let numsounds = surfaces[this.surface]
			for (let s=1; s <= numsounds; ++s) {
				const clip = await this.loadAudio(this.assetPath + 'sounds/surfaces/surface_'+this.surface+s+'.mp3')
				this.sounds_table[this.surface].push(clip);
			}
		}
		// load the coin sounds for all sets
		if(!this.sounds_dice.hasOwnProperty('coin')){
			this.sounds_dice['coin'] = []
			let numsounds = dieMaterials['coin']
			for (let s=1; s <= numsounds; ++s) {
				const clip = await this.loadAudio(this.assetPath + 'sounds/dicehit/dicehit_coin'+s+'.mp3')
				this.sounds_dice['coin'].push(clip);
			}
		}
		if(!this.sounds_dice.hasOwnProperty(this.sound_dieMaterial)){
			this.sounds_dice[this.sound_dieMaterial] = []
			let numsounds = dieMaterials[this.sound_dieMaterial]
			for (let s=1; s <= numsounds; ++s) {
				const clip = await this.loadAudio(this.assetPath + 'sounds/dicehit/dicehit_'+this.sound_dieMaterial+s+'.mp3')
				this.sounds_dice[this.sound_dieMaterial].push(clip);
			}
		}
	}

	loadAudio(src){
		return new Promise((resolve, reject) => {
			let audio = new Audio()
			audio.oncanplaythrough = () => resolve(audio)
			audio.crossOrigin = "anonymous";
			audio.src = src
			audio.onerror = (error) => reject(error)
		}).catch(e => {
			console.error("Unable to load audio")
		})
	}

	async updateConfig(options = {}){
		// if(options.scale && this.scale !== options.scale){
		// 	this.DiceFactory.updateConfig({
		// 		scale: options.scale
		// 	})
		// }
		Object.apply(this,options)
		this.theme_customColorset = options.theme_customColorset ? options.theme_customColorset : null
		if(options.theme_colorset){
			this.theme_colorset = options.theme_colorset
		}
		if(options.theme_texture){
			this.theme_texture = options.theme_texture
		}
		if(options.theme_material){
			this.theme_material = options.theme_material
		}
		if(options.theme_colorset || options.theme_texture || options.theme_material || options.theme_customColorset){
			await this.loadTheme({
				colorset: this.theme_colorset,
				texture: this.theme_texture,
				material: this.theme_material
			})
		}

	}

	setDimensions(dimensions) {
		this.display.currentWidth = this.container.clientWidth / 2;
		this.display.currentHeight = this.container.clientHeight / 2;
		if (dimensions) {
			this.display.containerWidth = dimensions.x;
			this.display.containerHeight = dimensions.y;
		} else {
			this.display.containerWidth = this.display.currentWidth;
			this.display.containerHeight = this.display.currentHeight;
		}
		this.display.aspect = Math.min(this.display.currentWidth / this.display.containerWidth, this.display.currentHeight / this.display.containerHeight);
		this.display.scale = Math.sqrt(this.display.containerWidth * this.display.containerWidth + this.display.containerHeight * this.display.containerHeight) / 13;

		this.makeWorldBox()

		this.renderer.setSize(this.display.currentWidth * 2, this.display.currentHeight * 2);

		this.cameraHeight.max = this.display.currentHeight / this.display.aspect / Math.tan(10 * Math.PI / 180);

		this.cameraHeight.medium = this.cameraHeight.max / 1.5;
		this.cameraHeight.far = this.cameraHeight.max;
		this.cameraHeight.close = this.cameraHeight.max / 2;

		if (this.camera) this.scene.remove(this.camera);
		this.camera = new THREE.PerspectiveCamera(20, this.display.currentWidth / this.display.currentHeight, 1, this.cameraHeight.max * 1.3);

		switch (this.animstate) {
			case 'selector':
				this.camera.position.z = this.selector.dice.length > 9 ? this.cameraHeight.far : (this.selector.dice.length < 6 ? this.cameraHeight.close : this.cameraHeight.medium);
				break;
			case 'throw': case 'afterthrow': default: this.camera.position.z = this.cameraHeight.far;

		}

		this.camera.lookAt(new THREE.Vector3(0,0,0));
		
		const maxwidth = Math.max(this.display.containerWidth, this.display.containerHeight);

		if (this.light) this.scene.remove(this.light);
		if (this.light_amb) this.scene.remove(this.light_amb);
		this.light = new THREE.SpotLight(this.color_spotlight, this.light_intensity);
		this.light.position.set(-maxwidth / 2, maxwidth / 2, maxwidth * 3);
		this.light.target.position.set(0, 0, 0);
		this.light.distance = maxwidth * 5;
		this.light.angle = Math.PI/4;
		this.light.castShadow = this.shadows;
		this.light.shadow.camera.near = maxwidth / 10;
		this.light.shadow.camera.far = maxwidth * 5;
		this.light.shadow.camera.fov = 50;
		this.light.shadow.bias = 0.001;
		this.light.shadow.mapSize.width = 1024;
		this.light.shadow.mapSize.height = 1024;
		this.scene.add(this.light);

		this.light_amb = new THREE.HemisphereLight( 0xffffbb, 0x676771, this.light_intensity );
		this.scene.add(this.light_amb);

		if (this.desk) this.scene.remove(this.desk);
		let shadowplane = new THREE.ShadowMaterial();
		shadowplane.opacity = 0.5;
		this.desk = new THREE.Mesh(new THREE.PlaneGeometry(this.display.containerWidth * 6, this.display.containerHeight * 6, 1, 1), shadowplane);
		this.desk.receiveShadow = this.shadows;
		this.scene.add(this.desk);

		this.renderer.render(this.scene, this.camera);
	}

	resizeWorld(){
		const resize = () => {
			const canvas = this.renderer.domElement;
			const width = this.container.clientWidth;
			const height = this.container.clientHeight;
			const needResize = canvas.width !== width || canvas.height !== height;
			if (needResize) {
				this.setDimensions(new THREE.Vector2(this.container.clientWidth, this.container.clientHeight))
			}
			return needResize;
		}
		const debounceResize = debounce(resize)
		window.addEventListener("resize", debounceResize)
	}

	vectorRand({x, y}) {
		let angle = Math.random() * Math.PI / 5 - Math.PI / 5 / 2;
		let vec = {
			x: x * Math.cos(angle) - y * Math.sin(angle),
			y: x * Math.sin(angle) + y * Math.cos(angle)
		};
		if (vec.x == 0) vec.x = 0.01;
		if (vec.y == 0) vec.y = 0.01;
		return vec;
	}

	//returns an array of vectordata objects
	getNotationVectors(notation, vector, boost, dist){

		let notationVectors = new DiceNotation(notation);

		for (let i in notationVectors.set) {

			const diceobj = this.DiceFactory.get(notationVectors.set[i].type);
			let numdice = notationVectors.set[i].num;
			let operator = notationVectors.set[i].op;
			let sid = notationVectors.set[i].sid;
			let gid = notationVectors.set[i].gid;
			let glvl = notationVectors.set[i].glvl;
			let func = notationVectors.set[i].func;
			let args = notationVectors.set[i].args;

			for(let k = 0; k < numdice; k++){

				let vec = this.vectorRand(vector);

				vec.x /= dist;
				vec.y /= dist;

				let pos = {
					x: this.display.containerWidth * (vec.x > 0 ? -1 : 1) * 0.9,
					y: this.display.containerHeight * (vec.y > 0 ? -1 : 1) * 0.9,
					z: Math.random() * 200 + 200
				};

				let projector = Math.abs(vec.x / vec.y);
				if (projector > 1.0) pos.y /= projector; else pos.x *= projector;

				let velvec = this.vectorRand(vector);
				velvec.x /= dist;
				velvec.y /= dist;
				let velocity, angle, axis;

				if (diceobj.shape != "d2") {

					velocity = { 
						x: velvec.x * boost, 
						y: velvec.y * boost, 
						z: -10
					};

					angle = {
						x: -(Math.random() * vec.y * 5 + diceobj.inertia * vec.y),
						y: Math.random() * vec.x * 5 + diceobj.inertia * vec.x,
						z: 0
					};

					axis = { 
						x: Math.random(), 
						y: Math.random(), 
						z: Math.random(), 
						a: Math.random()
					};
				} else {
					//coin flip
					velocity = { 
						x: velvec.x * boost / 10, 
						y: velvec.y * boost / 10, 
						z: 3000
					};

					angle = {
						x: 12 * diceobj.inertia,//-(Math.random() * velvec.y * 50 + diceobj.inertia * velvec.y ) ,
						y: 1 * diceobj.inertia,//Math.random() * velvec.x * 50 + diceobj.inertia * velvec.x ,
						z: 0
					};

					axis = { 
						x: 1,//Math.random(), 
						y: 1,//Math.random(), 
						z: Math.random(), 
						a: Math.random()
					};
				}

				notationVectors.vectors.push({ 
					index: this.dieIndex++,
					type: diceobj.type, 
					op: operator,
					sid: sid,  
					gid: gid, 
					glvl: glvl,
					func: func, 
					args: args, 
					pos: pos, 
					velocity: velocity, 
					angle: angle, 
					axis: axis
				});
			}            
		}

		return notationVectors;
	}

	// swaps dice faces to match desired result
	swapDiceFace(dicemesh, result){
		const diceobj = this.DiceFactory.get(dicemesh.notation.type);

		// flag this result as forced
		dicemesh.resultReason = 'forced'

		if (diceobj.shape == 'd4') {
			this.swapDiceFace_D4(dicemesh, result);
			return;
		}

		let values = diceobj.values;
		let value = parseInt(dicemesh.getLastValue().value);
		result = parseInt(result);
		
		if (dicemesh.notation.type == 'd10' && value == 0) value = 10;
		if (dicemesh.notation.type == 'd100' && value == 0) value = 100;
		if (dicemesh.notation.type == 'd100' && (value > 0 && value < 10)) value *= 10;

		if (dicemesh.notation.type == 'd10' && result == 0) result = 10;
		if (dicemesh.notation.type == 'd100' && result == 0) result = 100;
		if (dicemesh.notation.type == 'd100' && (result > 0 && result < 10)) result *= 10;

		let valueindex = diceobj.values.indexOf(value);
		let resultindex = diceobj.values.indexOf(result);

		if (valueindex < 0 || resultindex < 0) return;
		if (valueindex == resultindex) return;

		// find material index for corresponding value -> face and swap them
		// must clone the geom before modifying it
		let geom = dicemesh.geometry.clone();

		// find list of faces that use the matching material index for the given value/result
		let geomindex_value = [];
		let geomindex_result = [];

		// it's magic but not really
		// the mesh's materials start at index 2
		let magic = 2;
		// except on d10 meshes
		if (diceobj.shape == 'd10') magic = 1;

		let material_value, material_result = (resultindex+magic);

		//and D2 meshes have a lot more faces
		if(diceobj.shape != "d2"){
			material_value = (valueindex+magic);
			material_result = (resultindex+magic);
		} else {
			material_value = valueindex+1;
			material_result = resultindex+1;
		}

		//and probably some third rule eventually...

		// let normals = geom.getAttribute('normal').array;
		for (var i = 0, l = geom.groups.length; i < l; ++i) {
			const face = geom.groups[i];
			const matindex = face.materialIndex;

			if (matindex == material_value) {
				geomindex_value.push(i);
				continue;
			}
			if (matindex == material_result) {
				geomindex_result.push(i);
				continue;
			}
		}

		if (geomindex_value.length <= 0 || geomindex_result.length <= 0) return;

		//swap the materials
		for(let i = 0, l = geomindex_result.length; i < l; i++) {
			geom.groups[geomindex_result[i]].materialIndex = material_value;
		}

		for(let i = 0, l = geomindex_value.length; i < l; i++) {
			geom.groups[geomindex_value[i]].materialIndex = material_result;
		}

		dicemesh.geometry = geom;
	}

	swapDiceFace_D4(dicemesh, result) {
		const diceobj = this.DiceFactory.get(dicemesh.notation.type);
		let value = parseInt(dicemesh.getLastValue().value);
		result = parseInt(result);

		if (!(value >= 1 && value <= 4)) return;

		let num = result - value;
		let geom = dicemesh.geometry.clone();

		for (let i = 0, l = geom.groups.length; i < l; ++i) {
			const face = geom.groups[i];
			let matindex = face.materialIndex;
			if (matindex == 0) continue;
        
			matindex += num - 1;

			while (matindex > 4) matindex -= 4;
			while (matindex < 1) matindex += 4;

			face.materialIndex = matindex + 1;
		}
		if (num != 0) {
			if (num < 0) num += 4;
			dicemesh.material = this.DiceFactory.createMaterials(diceobj, 0, 0, false, num);
		}

		dicemesh.geometry = geom;
	}

	//spawns one dicemesh object from a single vectordata object
	spawnDice(vectordata) {
		let dicemesh = this.DiceFactory.create(vectordata.type, this.colorData);
		if(!dicemesh) return;

		dicemesh.dieId = vectordata.index
		dicemesh.notation = vectordata;
		dicemesh.result = [];
		dicemesh.stopped = 0;
		dicemesh.castShadow = this.shadows;
		dicemesh.body = new CANNON.Body({allowSleep: true, sleepSpeedLimit: 75, sleepTimeLimit:0.9, mass: dicemesh.mass, shape: dicemesh.geometry.cannon_shape, material: this.dice_body_material});
		dicemesh.body.type = CANNON.Body.DYNAMIC;
		dicemesh.body.position.set(vectordata.pos.x, vectordata.pos.y, vectordata.pos.z);
		dicemesh.body.quaternion.setFromAxisAngle(new CANNON.Vec3(vectordata.axis.x, vectordata.axis.y, vectordata.axis.z), vectordata.axis.a * Math.PI * 2);
		dicemesh.body.angularVelocity.set(vectordata.angle.x, vectordata.angle.y, vectordata.angle.z);
		dicemesh.body.velocity.set(vectordata.velocity.x, vectordata.velocity.y, vectordata.velocity.z);
		dicemesh.body.linearDamping = 0.1;
		dicemesh.body.angularDamping = 0.1;
		dicemesh.body.diceShape = dicemesh.shape;
		dicemesh.body.sleepState = 0;

		dicemesh.body.addEventListener('collide', this.eventCollide.bind(this));

		this.scene.add(dicemesh);
		this.diceList.push(dicemesh);
		this.world.addBody(dicemesh.body);
	}

	eventCollide({body, target}) {

		// collision events happen simultaneously for both colliding bodies
		// all this sanity checking helps limits sounds being played

		// don't play sounds if we're simulating
		if (this.animstate == 'simulate') return;
		if (!this.sounds || !body) return;

		// let volume = parseInt(window.DiceFavorites.settings.volume.value) || 0;
		if (this.volume <= 0) return;

		let now = Date.now();
		let currentSoundType = (body.mass > 0) ? 'dice' : 'table';

		// the idea here is that a dice clack should never be skipped in favor of a table sound
		// if ((don't play sounds if we played one this world step, or there hasn't been enough delay) AND 'this sound IS NOT a dice clack') then 'skip it'
		if ((this.lastSoundStep == body.world.stepnumber || this.lastSound > now) && currentSoundType != 'dice') return;

		// also skip if it's too early and both last sound and this sound are the same
		if ((this.lastSoundStep == body.world.stepnumber || this.lastSound > now) && currentSoundType == 'dice' && this.lastSoundType == 'dice') return;

		if (body.mass > 0) { // dice to dice collision

			let speed = body.velocity.length();
			// also don't bother playing at low speeds
			if (speed < 250) return;

			let sound;

			if(body.diceShape === "d2") {
				sound = this.sounds_dice['coin'][Math.floor(Math.random() * this.sounds_dice['coin'].length)];
			}
			else {
				sound = this.sounds_dice[this.sound_dieMaterial][Math.floor(Math.random() * this.sounds_dice[this.sound_dieMaterial].length)];
			}
			if(sound){
				sound.volume = Math.min(speed / 8000, this.volume/100)
				sound.play().catch(error => {});
			}
			// if (isPlaying !== undefined) {
			// 	isPlaying.then(() => {
			// 		// Autoplay started!
			// 	}).catch(error => {
			// 		// Autoplay was prevented.
			// 		// console.warn('Sounds muted by autoplay')
			// 	});
			// }
			this.lastSoundType = 'dice';


		} else { // dice to table collision
			let speed = target.velocity.length();
			// also don't bother playing at low speeds
			if (speed < 250) return;

			let surface = this.surface;

			let soundlist = this.sounds_table[surface];
			let sound = soundlist[Math.floor(Math.random() * soundlist.length)];
			if(sound){
				sound.volume = Math.min(speed / 8000, this.volume/100)
				sound.play().catch(error => {});
			}
			// if (isPlaying !== undefined) {
			// 	isPlaying.then(() => {
			// 		// Autoplay started!
			// 	}).catch(error => {
			// 		// Autoplay was prevented.
			// 		// console.warn('Sounds muted by autoplay')
			// 	});
			// }
			this.lastSoundType = 'table';
		}

		this.lastSoundStep = body.world.stepnumber;
		this.lastSound = now + this.soundDelay;
	}

	//resets vectors on dice back to startign notation values for a roll after simulation.
	resetDice(dicemesh, {pos, axis, angle, velocity}) {
		dicemesh.stopped = 0;
		// this.world.removeBody(dicemesh.body);
		// dicemesh.body = new CANNON.Body({allowSleep: true, sleepSpeedLimit: 75, sleepTimeLimit:0.9, mass: dicemesh.body.mass, shape: dicemesh.geometry.cannon_shape, material: this.dice_body_material});
		dicemesh.body.type = CANNON.Body.DYNAMIC;
		dicemesh.body.position.set(pos.x, pos.y, pos.z);
		dicemesh.body.quaternion.setFromAxisAngle(new CANNON.Vec3(axis.x, axis.y, axis.z), axis.a * Math.PI * 2);
		dicemesh.body.angularVelocity.set(angle.x, angle.y, angle.z);
		dicemesh.body.velocity.set(velocity.x, velocity.y, velocity.z);
		// dicemesh.body.linearDamping = 0.1;
		// dicemesh.body.angularDamping = 0.1;
		// dicemesh.body.diceShape = dicemesh.shape;
		// dicemesh.body.addEventListener('collide', this.eventCollide.bind(this));
		// this.world.addBody(dicemesh.body);
		dicemesh.body.sleepState = 0;
	}

	checkForRethrow(dicemesh) {
		// all dice in a set/dice group will have the same function and arguments due to sorting beforehand
		// this means the list passed in is the set of dice that need to be affected by this function
		let diceFunc = (dicemesh.notation.func) ? dicemesh.notation.func.toLowerCase() : '';
		// let funcdata = this.DiceFunctions.rethrowFunctions[diceFunc];
		let funcdata

		let reroll = false;
			
		if (diceFunc != '' && funcdata && funcdata.method) {
			diceFunc = dicemesh.notation.func.toLowerCase();
			let diceFuncArgs = dicemesh.notation.args || '';
			reroll = funcdata.method(dicemesh, diceFuncArgs);
		}

		return reroll;
	}

	throwFinished() {
		const forcedFinish = this.iteration > this.iterationLimit

		// cycle through diceList and if any dice are still awake then return false
		for (let i=0, len=this.diceList.length; i < len; ++i) {
			const dicemesh = this.diceList[i];
			const sleepState = CANNON.Body.SLEEPING

			if (dicemesh.body.sleepState < sleepState && !forcedFinish) {
				return false;
			}

			if (dicemesh.body.sleepState == sleepState || forcedFinish) {
				if(dicemesh.body.type === CANNON.Body.KINEMATIC){
					continue
				}

				let rethrow = false;

				//check for forced roll
				if (dicemesh.result.length == 0) {
					dicemesh.storeRolledValue(dicemesh.resultReason);
					rethrow = this.checkForRethrow(dicemesh);
				} else if (dicemesh.result.length > 0 && dicemesh.rerolling) {
					dicemesh.rerolling = false;
					dicemesh.storeRolledValue('reroll');
					rethrow = this.checkForRethrow(dicemesh);
				}

				if (rethrow) {
					dicemesh.rerolls += 1;
					dicemesh.rerolling = true;
					dicemesh.body.wakeUp();
					dicemesh.body.type = CANNON.Body.DYNAMIC;
					dicemesh.body.angularVelocity = new CANNON.Vec3(25, 25, 25);
					dicemesh.body.velocity = new CANNON.Vec3(0, 0, 3000);
					return false;
				}

				dicemesh.rerolling = false;
				dicemesh.body.type = CANNON.Body.KINEMATIC;
				
			}
		}
		return true;
	}

	simulateThrow() {
		this.animstate = 'simulate';
		this.iteration = 0;
		this.rolling = true;
		while (!this.throwFinished(true)) {
			++this.iteration;
			this.world.step(this.framerate);
		}
	}

	animateThrow(threadid, callback){
		this.animstate = 'throw';
		let time = Date.now();
		this.last_time = this.last_time || time - (this.framerate*1000);
		let time_diff = (time - this.last_time) / 1000;
		++this.iteration;
		let neededSteps = Math.floor(time_diff / this.framerate);

		// this.container.style.opacity = '1';

		for(let i = 0; i < neededSteps; i++) {
			this.world.step(this.framerate);
			// this.cannonDebugger.update()
			++this.steps;
		}

		// update physics interactions visually
		for (let i in this.scene.children) {
			let interact = this.scene.children[i];
			if (interact.body != undefined) {
				interact.position.copy(interact.body.position);
				interact.quaternion.copy(interact.body.quaternion);
			}
		}

		this.renderer.render(this.scene, this.camera);
		this.last_time = this.last_time + neededSteps*this.framerate*1000;


		// roll finished
		if (this.running == threadid && this.throwFinished()) {
			this.running = false;
			this.rolling = false;
			if(callback) callback.call(this, this.notationVectors);
			
			this.running = Date.now();
			this.animateAfterThrow(this.running);
			return;
		}

		// roll not finished, keep animating
		if (this.running == threadid) {
			((animateCallback, tid, at, aftercall, vecs) => {
				if (!at && time_diff < this.framerate) {
					setTimeout(() => { requestAnimationFrame(() => { animateCallback.call(this, tid, aftercall, vecs); }) }, (this.framerate - time_diff) * 1000);
				} else {
					requestAnimationFrame(() => { animateCallback.call(this, tid, aftercall, vecs); });
				}
			}).bind(this)(this.animateThrow, threadid, this.adaptive_timestep, callback);
		}
	}

	animateAfterThrow(threadid) {
		this.animstate = 'afterthrow';
		let time = Date.now();
		let time_diff = (time - this.last_time) / 1000;
		if (time_diff > 3) time_diff = this.framerate;

		this.running = false;
		this.last_time = time;
		this.renderer.render(this.scene, this.camera);
		if (this.running == threadid) {
			((animateCallback, tid, at) => {
				if (!at && time_diff < this.framerate) {
					setTimeout(() => { requestAnimationFrame(() => { animateCallback.call(this, tid); }) }, (this.framerate - time_diff) * 1000);
				} else {
					requestAnimationFrame(() => { animateCallback.call(this, tid); });
				}
			}).bind(this)(this.animateAfterThrow, threadid, this.adaptive_timestep);
		}
	}

	startClickThrow(notation) {
		// if (this.rolling) return;
		if(this.rolling) {
			this.clearDice();
			this.rolling = false
		}

		let vector = { x: (Math.random() * 2 - 0.5) * this.display.currentWidth, y: -(Math.random() * 2 - 0.5) * this.display.currentHeight };
		let dist = Math.sqrt(vector.x * vector.x + vector.y * vector.y) + 100;
		let boost = (Math.random() + 3) * dist * this.strength;

		const notationVectors = this.getNotationVectors(notation, vector, boost, dist);

		return notationVectors
	}

	clearDice() {
		this.running = false;
		let dice;
		while (dice = this.diceList.pop()) {
			this.scene.remove(dice); 
			if (dice.body) this.world.removeBody(dice.body);
		}
		this.renderer.render(this.scene, this.camera);

		setTimeout(() => { this.renderer.render(this.scene, this.camera); }, 100);
	}

	getDiceResults(id){
		if(id !== undefined){
			return {
				type: this.diceList[id].shape,
				sides: parseInt(this.diceList[id].shape.substring(1)),
				id,
				...this.diceList[id].result.at(-1)
			}
		}
		let counter = 0
		const modifier = this.notationVectors.constant ? parseInt(`${this.notationVectors.op}${this.notationVectors.constant}`) : 0
		const result = {
			notation: this.notationVectors.notation,
			sets: this.notationVectors.set.map(set => {
				const endCount = counter + set.num - 1
				let total = 0
				const rolls = []
				for (let index = counter; index <= endCount; index++) {
					rolls.push({
						type: set.type,
						sides: parseInt(set.type.substring(1)),
						id: counter,
						...this.diceList[counter].result.at(-1)
					})
					total += this.diceList[counter].result.at(-1).value
					counter++
				}
				const returnSet = {
					num: set.num,
					type: set.type,
					sides: parseInt(set.type.substring(1)),
					rolls,
					total,
				}
				return returnSet
			}),
			modifier,
			total: this.diceList.reduce((total,val) => total + val.result.at(-1).value, modifier)
		}
		return result
	}

	async roll(notationSting){
		this.notationVectors = this.startClickThrow(notationSting)
		if(this.notationVectors){
			// const DL = this.diceList
			return new Promise((resolve,reject) => {
				this.rollDice(() => {
					const results = this.getDiceResults()
	
					// setting up a couple of ways to consume the final results
					// call onRollComplete 
					this.onRollComplete(results)
	
					// dispatch an event with the results object for other UI elements to listen for
					const event = new CustomEvent('rollComplete', {detail: results})
					document.dispatchEvent(event)
	
					resolve(results)
				})
			})
		}
	}

	async reroll(diceIdArray) {
		this.rolling = true;
		this.running = Date.now();
		this.iteration = 0
		return new Promise((resolve,reject) => {
			diceIdArray.forEach(dieId => {
				const dicemesh = this.diceList[dieId]
				dicemesh.rerolls += 1;
				dicemesh.rerolling = true;
				dicemesh.body.wakeUp();
				dicemesh.body.type = CANNON.Body.DYNAMIC;
				dicemesh.body.angularVelocity = new CANNON.Vec3(25, 25, 25);
				dicemesh.body.velocity = new CANNON.Vec3(0, 0, 3000);
			})
			this.animateThrow(this.running, () => {
				const results = diceIdArray.map(dieId => this.getDiceResults(dieId))

				this.onRerollComplete(results)
				
				// dispatch an event with the results object for other UI elements to listen for
				const event = new CustomEvent('rerollComplete', {detail: results})
				document.dispatchEvent(event)

				resolve(results)
			})
		})
	}

	async add(notationSting){
		let addNotationVectors = this.startClickThrow(notationSting)
		let dieCount = this.diceList.length
		let diceIdArray = []

		for (let i=0, len=addNotationVectors.vectors.length; i < len; ++i) {
			this.spawnDice(addNotationVectors.vectors[i]);
		}

		this.simulateThrow();
		this.steps = 0;
		this.iteration = 0;

		//check forced results, fix dice faces if necessary
		if (addNotationVectors.result && addNotationVectors.result.length > 0) {
			for (let i=0;i<addNotationVectors.result.length;i++) {
				const index = dieCount + i
				let dicemesh = this.diceList[index];
				if (!dicemesh) continue;
				if (dicemesh.getLastValue().value == addNotationVectors.result[i]) continue;
				this.swapDiceFace(dicemesh, addNotationVectors.result[i]);
			}
		}
		
		//reset dice vectors - for just the dice added
		for (let i=0, len=addNotationVectors.vectors.length; i < len; ++i) {
			const index = dieCount + i
			if (!this.diceList[index]) continue;

			//reset dice vectors
			this.resetDice(this.diceList[index], addNotationVectors.vectors[i]);
			//reset the result
			this.diceList[index].result = [];
			diceIdArray.push(index)
		}

		// let our vectors combine
		this.notationVectors = DiceNotation.mergeNotation(this.notationVectors, addNotationVectors)

		return new Promise((resolve,reject) => {
			const callback = () => {
				const results = diceIdArray.map(dieId => this.getDiceResults(dieId))
	
				// setting up a couple of ways to consume the dice added results
				// call onAddDiceComplete 
				this.onAddDiceComplete(results)
	
				// dispatch an event with the results object for other UI elements to listen for
				const event = new CustomEvent('addDiceComplete', {detail: results})
				document.dispatchEvent(event)
	
				resolve(results)
			}

			// animate the previously simulated roll
			this.rolling = true;
			this.running = Date.now();
			this.last_time = 0;
			this.animateThrow(this.running, callback);
		})
	}

	rollDice(callback){

		if (this.notationVectors.error) {
			callback.call(this);
			return;
		}

		// this.camera.position.z = this.cameraHeight.far;
		this.clearDice();

		for (let i=0, len=this.notationVectors.vectors.length; i < len; ++i) {
			this.spawnDice(this.notationVectors.vectors[i]);
		}
		this.simulateThrow();
		this.steps = 0;
		this.iteration = 0;
		
		//check forced results, fix dice faces if necessary
		if (this.notationVectors.result && this.notationVectors.result.length > 0) {
			for (let i=0;i<this.notationVectors.result.length;i++) {
				let dicemesh = this.diceList[i];
				if (!dicemesh) continue;
				if (dicemesh.getLastValue().value == this.notationVectors.result[i]) continue;
				this.swapDiceFace(dicemesh, this.notationVectors.result[i]);
			}
		}
		
		for (let i=0, len=this.diceList.length; i < len; ++i) {
			if (!this.diceList[i]) continue;
			
			//reset dice vectors
			this.resetDice(this.diceList[i], this.notationVectors.vectors[i]);
			//reset the result
			this.diceList[i].result = [];
		}

		// animate the previously simulated roll
		this.rolling = true;
		this.running = Date.now();
		this.last_time = 0;
		this.animateThrow(this.running, callback);

	}
}

export { DiceBox }