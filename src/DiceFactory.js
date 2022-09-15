"use strict";
import {DicePreset} from './DicePreset.js';
import {MATERIALTYPES} from "./const/materialtypes"
import * as THREE from "three"
import * as CANNON from "cannon-es"

class DiceFactory {
	static dice = []
	constructor() {
		// this.dice = {};
		this.geometries = {};

		this.baseScale = 100;

		this.materials_cache = {};
		this.cache_hits = 0;
		this.cache_misses = 0;

		this.label_color = '';
		this.dice_color = '';
		this.edge_color = '';
		this.label_outline = '';
		this.dice_texture = '';
		this.dice_material = '';
		this.bumpMapping = true;

		this.material_options = {
			specular: 0xffffff,
			color: 0xb5b5b5,
			shininess: 5,
			flatShading: true
		};

		this.cubeMap;
	}

	setBumpMapping(bumpMapping){
		this.bumpMapping = bumpMapping;
		this.materials_cache = {};
	}

	setCubeMap(basepath, sources) {
		if (basepath === false) {
			this.cubeMap = null;
			return;
		}

		let loader = new THREE.CubeTextureLoader();
		loader.setPath(basepath);
		this.cubeMap = loader.load(sources);
	}

	// returns a dicemesh (THREE.Mesh) object
	create(type, colorset) {
		let diceobj = this.get(type);
		if (!diceobj) return null;

		let geom = this.geometries[type];
		if(!geom) {
			geom = this.createGeometry(diceobj.shape, diceobj.scale * this.baseScale);
			this.geometries[type] = geom;
		}
		if (!geom) return null;

		this.setMaterialInfo();

		let dicemesh = new THREE.Mesh(geom, this.createMaterials(diceobj, this.baseScale / 2, 1.0));
		dicemesh.result = [];
		dicemesh.shape = diceobj.shape;
		dicemesh.rerolls = 0;
		dicemesh.resultReason = 'natural';

		dicemesh.getFaceValue = function() {
			// callback function. scope of this = Mesh
			let reason = this.resultReason;
			let vector = new THREE.Vector3(0, 0, this.shape == 'd4' ? -1 : 1);

			let closest_face, closest_angle = Math.PI * 2;
			let normals = this.geometry.getAttribute('normal').array;
			for (let i = 0, l = this.geometry.groups.length; i < l; ++i) {
				let face = this.geometry.groups[i];
				if (face.materialIndex == 0) continue;

				//Each group consists in 3 vertices of 3 elements (x, y, z) so the offset between faces in the Float32BufferAttribute is 9
				let startVertex = i * 9;
				let normal = new THREE.Vector3(normals[startVertex], normals[startVertex + 1], normals[startVertex + 2]);
				let angle = normal.clone().applyQuaternion(this.body.quaternion).angleTo(vector);
				if (angle < closest_angle) {
					closest_angle = angle;
					closest_face = face;
				}
			}
			let matindex = closest_face.materialIndex - 1;

			const diceobj = DiceFactory.dice[this.notation.type];

			if (this.shape == 'd4') {
				let labelindex2 = ((matindex-1) == 0) ? 5 : matindex;

				return {value: matindex, label: diceobj.labels[matindex-1][labelindex2][0], reason: reason};
			}
			if (['d10','d2'].includes(this.shape)) matindex += 1;

			let value = diceobj.values[((matindex-1) % diceobj.values.length)];
			let label = diceobj.labels[(((matindex-1) % (diceobj.labels.length-2))+2)];
			
			return {value: value, label: label, reason: reason};
		}

		dicemesh.storeRolledValue = function(reason) {
			this.resultReason = reason || this.resultReason;
			this.result.push(this.getFaceValue());
		}

		dicemesh.getLastValue = function() {
			if (!this.result || this.result.length < 1) return {value: undefined, label: '', reason: ''};

			return this.result[this.result.length-1];
		}

		dicemesh.ignoreLastValue = function(ignore) {
			let lastvalue = this.getLastValue();
			if (lastvalue.value === undefined) return;

			lastvalue.ignore = ignore;
			this.setLastValue(lastvalue);
		}

		dicemesh.setLastValue = function(result) {
			if (!this.result || this.result.length < 1) return;
			if (!result || result.length < 1) return;

			return this.result[this.result.length-1] = result;
		}

		if (diceobj.color) {
			dicemesh.material[0].color = new THREE.Color(diceobj.color);
			dicemesh.material[0].emissive = new THREE.Color(diceobj.color);
			dicemesh.material[0].emissiveIntensity = 1;
			dicemesh.material[0].needsUpdate = true;
		}

		switch (diceobj.values.length) {
			case 1:
				return this.fixmaterials(dicemesh, 1);
			case 2:
				return this.fixmaterials(dicemesh, 2);
			case 3: 
				return this.fixmaterials(dicemesh, 3);
			default:
				return dicemesh;
		}
	}

	get(type) {
		let dieSet
		if(DiceFactory.dice.hasOwnProperty(type)){
			dieSet = DiceFactory.dice[type]
		} else {
			dieSet = new DicePreset(type)
			DiceFactory.dice[type] = dieSet;
		}

		return dieSet
	}

	getGeometry(type) {
		return this.geometries[type];
	}

	createMaterials(diceobj, size, margin, allowcache = true, d4specialindex = 0) {

		let materials = [];
		let labels = diceobj.labels;
		if (diceobj.shape == 'd4') {
			labels = diceobj.labels[d4specialindex];
			size = this.baseScale / 2;
			margin = this.baseScale * 2;
		}
		
		for (var i = 0; i < labels.length; ++i) {
			var mat;
			if (this.dice_material != 'none') {
				mat = new THREE.MeshStandardMaterial(MATERIALTYPES[this.dice_material]);
				if (this.cubeMap) {
					mat.envMap = this.cubeMap;
				} else {
					mat.envMapIntensity = 0;
				}
			} else {
				mat = new THREE.MeshPhongMaterial(this.material_options);
			}

			let canvasTextures;
			if (i==0) { //edge
				//if the texture is fully opaque, we do not use it for edge
				let texture = {name:"none"};
				if(this.dice_texture_rand.composite != "source-over") texture = this.dice_texture_rand;

				canvasTextures = this.createTextMaterial(diceobj, labels, i, size, margin, texture, this.label_color_rand, this.label_outline_rand, this.edge_color_rand, allowcache);
				mat.map = canvasTextures.composite;

			} else {
				canvasTextures = this.createTextMaterial(diceobj, labels, i, size, margin, this.dice_texture_rand, this.label_color_rand, this.label_outline_rand, this.dice_color_rand, allowcache);
				mat.map = canvasTextures.composite;

				if (this.bumpMapping) {
					if (false) {
						mat.bumpScale = 0.5;
					} else {
						let scale = 0.75;;
						if(size > 35)
							scale = 1;
						if(size > 40)
							scale = 2.5;
						if(size > 45)
							scale = 4;
						mat.bumpScale = scale;
					}

					if (canvasTextures.bump) {
						mat.bumpMap = canvasTextures.bump;
					}
					if (diceobj.shape != 'd4' && diceobj.normals[i]) {
						mat.bumpMap = new THREE.Texture(diceobj.normals[i]);
						mat.bumpScale = 4;
						mat.bumpMap.needsUpdate = true;
					}
				}
			}
			mat.opacity = 1;
			mat.transparent = true;
			mat.depthTest = false;
			mat.needUpdate = true;
			materials.push(mat);
		}
		//Edge mat

		return materials;
	}

	createTextMaterial(diceobj, labels, index, size, margin, texture, forecolor, outlinecolor, backcolor, allowcache) {
		if (labels[index] === undefined) return null;

		texture = texture || this.dice_texture_rand;
		forecolor = forecolor || this.label_color_rand;
		outlinecolor = outlinecolor || this.label_outline_rand;
		backcolor = backcolor || this.dice_color_rand;
		allowcache = allowcache == undefined ? true : allowcache;

		let text = labels[index];
		let isTexture = false;
		let textCache = text;
		if (text instanceof HTMLImageElement) {
			textCache = text.src;
		} else if (text instanceof Array) {
			text.forEach(el => {
				textCache += el.src;
			});
		}

		// an attempt at materials caching
		let cachestring = diceobj.type + textCache + index + texture.name + forecolor + outlinecolor + backcolor;
		if (diceobj.shape == 'd4') {
			cachestring = diceobj.type + textCache + texture.name + forecolor + outlinecolor + backcolor;
		}
		if (allowcache && this.materials_cache[cachestring] != null) {
			this.cache_hits++;
			return this.materials_cache[cachestring];
		}

		let canvas = document.createElement("canvas");
		let context = canvas.getContext("2d", {alpha: true});

		context.globalAlpha = 0;
		context.clearRect(0, 0, canvas.width, canvas.height);

		let canvasBump = document.createElement("canvas");
		let contextBump = canvasBump.getContext("2d", {alpha: true});
		contextBump.globalAlpha = 0;

		contextBump.clearRect(0, 0, canvasBump.width, canvasBump.height);

		let ts;

		if (diceobj.shape == 'd4') {
			ts = this.calc_texture_size(size + margin) * 2;
		} else {
			ts = this.calc_texture_size(size + size * 2 * margin) * 2;
		}

		canvas.width = canvas.height = ts;
		canvasBump.width = canvasBump.height = ts;

		// create color
		context.fillStyle = backcolor;
		context.fillRect(0, 0, canvas.width, canvas.height);

		contextBump.fillStyle = "#FFFFFF";
		contextBump.fillRect(0, 0, canvasBump.width, canvasBump.height);

		//create underlying texture
		if (texture && texture.name != 'none') {
			context.globalCompositeOperation = texture.composite || 'source-over';
			context.drawImage(texture.texture, 0, 0, canvas.width, canvas.height);
			context.globalCompositeOperation = 'source-over';

			if (texture.bump) {
				contextBump.globalCompositeOperation = 'source-over';
				contextBump.drawImage(texture.bump, 0, 0, canvas.width, canvas.height);
			}
		} else {
			context.globalCompositeOperation = 'source-over';
		}

		// create text
		context.globalCompositeOperation = 'source-over';
		context.textAlign = "center";
		context.textBaseline = "middle";

		contextBump.textAlign = "center";
		contextBump.textBaseline = "middle";

		if (diceobj.shape != 'd4') {

			// fixes texture rotations on specific dice models
			const rotate = {
				d8: {even: -7.5, odd: -127.5},
				d10: {all: -6},
				d12: {all: 5},
				d20: {all: -7.5},
			};

			// fix for some faces being weirdly rotated
			let rotateface = rotate[diceobj.shape];
			if(rotateface) {
				let degrees
				if(rotateface.hasOwnProperty("all")){
					degrees = rotateface.all
				} else {
					if(index > 0 && (index % 2) != 0){
						degrees = rotateface.odd
					} else {
						degrees = rotateface.even
					}
				} 
				// let degrees = ((rotateface.hasOwnProperty("all") ? rotateface.all : false) || (index > 0 && (index % 2) != 0)) ? rotateface.odd : rotateface.even;

				if (degrees && degrees != 0) {

					var hw = (canvas.width / 2);
					var hh = (canvas.height / 2);

					context.translate(hw, hh);
					context.rotate(degrees * (Math.PI / 180));
					context.translate(-hw, -hh);

					contextBump.translate(hw, hh);
					contextBump.rotate(degrees * (Math.PI / 180));
					contextBump.translate(-hw, -hh);
				}
			}

			//custom texture face
			if (text instanceof HTMLImageElement) {
				isTexture = true;
				context.drawImage(text, 0,0,text.width,text.height,0,0,canvas.width,canvas.height);

			// text-only face
			} else {

				let fontsize = ts / (1 + 2 * margin);
				let textstarty = (canvas.height / 2) + 10;
				let textstartx = (canvas.width / 2);

				if(diceobj.shape == 'd10') {
					fontsize = fontsize*0.75;
					textstarty = (textstarty*1.15) - 10;
				} else if(diceobj.shape == 'd20') {
					textstartx = textstartx*0.98;
				}

				context.font =  fontsize+ 'pt '+diceobj.font;
				contextBump.font =  fontsize+ 'pt '+diceobj.font;

				let lineHeight = context.measureText("M").width * 1.4;
				let textlines = text.split("\n");


				if (textlines.length > 1) {
					fontsize = fontsize / textlines.length;
					context.font =  fontsize+ 'pt '+diceobj.font;
					contextBump.font =  fontsize+ 'pt '+diceobj.font;
					lineHeight = context.measureText("M").width * 1.2;
					textstarty -= (lineHeight * textlines.length) / 2;
				}

				for(let i = 0, l = textlines.length; i < l; i++){
					let textline = textlines[i].trim();

					// attempt to outline the text with a meaningful color
					if (outlinecolor != 'none' && outlinecolor != backcolor) {
						context.strokeStyle = outlinecolor;
						context.lineWidth = 5;
						context.strokeText(textlines[i], textstartx, textstarty);

						contextBump.strokeStyle = "#000000";
						contextBump.lineWidth = 5;
						contextBump.strokeText(textlines[i], textstartx, textstarty);

						if (textline == '6' || textline == '9') {
							context.strokeText('  .', textstartx, textstarty);
							contextBump.strokeText('  .', textstartx, textstarty);
						}
					}

					context.fillStyle = forecolor;
					context.fillText(textlines[i], textstartx, textstarty);

					contextBump.fillStyle = "#000000";
					contextBump.fillText(textlines[i], textstartx, textstarty);

					if (textline == '6' || textline == '9') {
						context.fillText('  .', textstartx, textstarty);
						contextBump.fillText('  .', textstartx, textstarty);
					}
					textstarty += (lineHeight * 1.5);
				}
			}
		} else {

			var hw = (canvas.width / 2);
			var hh = (canvas.height / 2);

			context.font =  (ts / 128 * 24)+'pt '+diceobj.font;
			contextBump.font =  (ts / 128 * 24)+'pt '+diceobj.font;

			//draw the numbers
			for (let i=0; i<text.length; i++) {
				//custom texture face
				if (text[i] instanceof HTMLImageElement) {
					let scaleTexture = text[i].width / canvas.width;
					context.drawImage(text[i], 0, 0, text[i].width, text[i].height, (100/scaleTexture), (25/scaleTexture), (60/scaleTexture), (60/scaleTexture));
				} else {
					// attempt to outline the text with a meaningful color
					if (outlinecolor != 'none' && outlinecolor != backcolor) {
						context.strokeStyle = outlinecolor;
						context.lineWidth = 5;
						context.strokeText(text[i], hw, hh - ts * 0.3);

						contextBump.strokeStyle = "#000000";
						contextBump.lineWidth = 5;
						contextBump.strokeText(text[i], hw, hh - ts * 0.3);
					}

					//draw label in top middle section
					context.fillStyle = forecolor;
					context.fillText(text[i], hw, hh - ts * 0.3);

					contextBump.fillStyle = "#000000";
					contextBump.fillText(text[i], hw, hh - ts * 0.3);
				}

				//rotate 1/3 for next label
				context.translate(hw, hh);
				context.rotate(Math.PI * 2 / 3);
				context.translate(-hw, -hh);

				contextBump.translate(hw, hh);
				contextBump.rotate(Math.PI * 2 / 3);
				contextBump.translate(-hw, -hh);
			}

			//debug side numbering
			// context.fillStyle = forecolor;
			// context.fillText(index, hw, hh);
		}

		var compositetexture = new THREE.CanvasTexture(canvas);
		var bumpMap;
		if (!isTexture) {
			bumpMap = new THREE.CanvasTexture(canvasBump);
		} else {
			bumpMap = null;
		}

		if (allowcache) {
			// cache new texture
			this.cache_misses++;
			this.materials_cache[cachestring] = {composite:compositetexture,bump:bumpMap};
		}

		return {composite:compositetexture,bump:bumpMap};
	}

	applyColorSet(colordata) {
		this.colordata = colordata;
		this.label_color = colordata.foreground;
		this.dice_color = colordata.background;
		this.label_outline = colordata.outline;
		this.dice_texture = colordata.texture;
		this.dice_material = colordata?.texture?.material || 'none';
		this.edge_color = colordata.hasOwnProperty("edge") ? colordata.edge:colordata.background;
	}

	// pass in colorset data from dice-box
	setMaterialInfo(colorset = '') {
		let prevcolordata = this.colordata;
		let prevtexture = this.dice_texture;
		let prevmaterial = this.dice_material;

		//reset random choices
		this.dice_color_rand = '';
		this.label_color_rand = '';
		this.label_outline_rand = '';
		this.dice_texture_rand = '';
		this.dice_material_rand = '';
		this.edge_color_rand = '';

		// set base color first
		if (Array.isArray(this.dice_color)) {

			var colorindex = Math.floor(Math.random() * this.dice_color.length);

			// if color list and label list are same length, treat them as a parallel list
			if (Array.isArray(this.label_color) && this.label_color.length == this.dice_color.length) {
				this.label_color_rand = this.label_color[colorindex];

				// if label list and outline list are same length, treat them as a parallel list
				if (Array.isArray(this.label_outline) && this.label_outline.length == this.label_color.length) {
					this.label_outline_rand = this.label_outline[colorindex];
				}
			}
			// if texture list is same length do the same
			if (Array.isArray(this.dice_texture) && this.dice_texture.length == this.dice_color.length) {
				this.dice_texture_rand = this.dice_texture[colorindex];
				this.dice_material_rand = this.dice_texture_rand.material;
			}

			//if edge list and color list are same length, treat them as a parallel list
			if (Array.isArray(this.edge_color) && this.edge_color.length == this.dice_color.length) {
				this.edge_color_rand = this.edge_color[colorindex];
			}

			this.dice_color_rand = this.dice_color[colorindex];
		} else {
			this.dice_color_rand = this.dice_color;
		}

		// set edge color if not set
		if(this.edge_color_rand == ''){
			if (Array.isArray(this.edge_color)) {

				var colorindex = Math.floor(Math.random() * this.edge_color.length);

				this.edge_color_rand = this.edge_color[colorindex];
			} else {
				this.edge_color_rand = this.edge_color;
			}
		}

		// if selected label color is still not set, pick one
		if (this.label_color_rand == '' && Array.isArray(this.label_color)) {
			var colorindex = this.label_color[Math.floor(Math.random() * this.label_color.length)];

			// if label list and outline list are same length, treat them as a parallel list
			if (Array.isArray(this.label_outline) && this.label_outline.length == this.label_color.length) {
				this.label_outline_rand = this.label_outline[colorindex];
			}

			this.label_color_rand = this.label_color[colorindex];

		} else if (this.label_color_rand == '') {
			this.label_color_rand = this.label_color;
		}

		// if selected label outline is still not set, pick one
		if (this.label_outline_rand == '' && Array.isArray(this.label_outline)) {
			var colorindex = this.label_outline[Math.floor(Math.random() * this.label_outline.length)];

			this.label_outline_rand = this.label_outline[colorindex];
			
		} else if (this.label_outline_rand == '') {
			this.label_outline_rand = this.label_outline;
		}

		// same for textures list
		if (this.dice_texture_rand == '' && Array.isArray(this.dice_texture)) {
			this.dice_texture_rand = this.dice_texture[Math.floor(Math.random() * this.dice_texture.length)];
			this.dice_material_rand = this.dice_texture_rand.material || this.dice_material;
		} else if (this.dice_texture_rand == '') {
			this.dice_texture_rand = this.dice_texture;
			this.dice_material_rand = this.dice_texture_rand.material || this.dice_material;
		}

		//apply material
		if (this.dice_material_rand == '' && Array.isArray(this.dice_material)) {
			this.dice_material_rand = this.dice_material[Math.floor(Math.random() * this.dice_material.length)];
		} else if (this.dice_material_rand == '') {
			this.dice_material_rand = this.dice_material;
		}

		// console.log('this.colordata', this.colordata)

		if (this.colordata &&this.colordata.id != prevcolordata.id) {
			this.applyColorSet(prevcolordata, prevtexture, prevmaterial);
			// this.applyTexture(prevtexture);
			// this.applyMaterial(prevmaterial);
		}
	}

	calc_texture_size(approx) {
		return Math.pow(2, Math.floor(Math.log(approx) / Math.log(2)));
	}

	createGeometry(type, radius) {
		switch (type) {
			case 'd2':
				return this.create_d2_geometry(radius);
			case 'd4':
				return this.create_d4_geometry(radius);
			case 'd6':
				return this.create_d6_geometry(radius);
			case 'd8':
				return this.create_d8_geometry(radius);
			case 'd10':
				return this.create_d10_geometry(radius);
			case 'd12':
				return this.create_d12_geometry(radius);
			case 'd20':
				return this.create_d20_geometry(radius);
			default:
				return null;
		}
	}

	create_d2_geometry(radius) {
		var geom = new THREE.CylinderGeometry(1*radius, 1*radius, 0.1*radius, 32);
		// geom.rotateX(Math.PI/2);
		geom.cannon_shape = new CANNON.Cylinder(1*radius,1*radius,0.1*radius,8);
		return geom;
	}

	create_d4_geometry(radius) {
		var vertices = [[1, 1, 1], [-1, -1, 1], [-1, 1, -1], [1, -1, -1]];
		var faces = [[1, 0, 2, 1], [0, 1, 3, 2], [0, 3, 2, 3], [1, 2, 3, 4]];
		return this.create_geom(vertices, faces, radius, -0.1, Math.PI * 7 / 6, 0.96);
	}

	create_d6_geometry(radius) {
		var vertices = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
				[-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]];
		var faces = [[0, 3, 2, 1, 1], [1, 2, 6, 5, 2], [0, 1, 5, 4, 3],
				[3, 7, 6, 2, 4], [0, 4, 7, 3, 5], [4, 5, 6, 7, 6]];
		return this.create_geom(vertices, faces, radius, 0.1, Math.PI / 4, 0.96);
	}

	create_d8_geometry(radius) {
		var vertices = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
		var faces = [[0, 2, 4, 1], [0, 4, 3, 2], [0, 3, 5, 3], [0, 5, 2, 4], [1, 3, 4, 5],
				[1, 4, 2, 6], [1, 2, 5, 7], [1, 5, 3, 8]];
		return this.create_geom(vertices, faces, radius, 0, -Math.PI / 4 / 2, 0.965);
	}

	create_d10_geometry(radius) {
		var a = Math.PI * 2 / 10, h = 0.105, v = -1;
		var vertices = [];
		for (var i = 0, b = 0; i < 10; ++i, b += a) {
			vertices.push([Math.cos(b), Math.sin(b), h * (i % 2 ? 1 : -1)]);
		}
		vertices.push([0, 0, -1]);
		vertices.push([0, 0, 1]);
		
		var faces = [
            [5, 6, 7, 11, 0],
            [4, 3, 2, 10, 1],
            [1, 2, 3, 11, 2],
            [0, 9, 8, 10, 3],
            [7, 8, 9, 11, 4],
            [8, 7, 6, 10, 5],
            [9, 0, 1, 11, 6],
            [2, 1, 0, 10, 7],
            [3, 4, 5, 11, 8],
            [6, 5, 4, 10, 9]
        ];
        return this.create_geom(vertices, faces, radius, 0.3, Math.PI, 0.945);
	}

	create_d12_geometry(radius) {
		var p = (1 + Math.sqrt(5)) / 2, q = 1 / p;
		var vertices = [[0, q, p], [0, q, -p], [0, -q, p], [0, -q, -p], [p, 0, q],
				[p, 0, -q], [-p, 0, q], [-p, 0, -q], [q, p, 0], [q, -p, 0], [-q, p, 0],
				[-q, -p, 0], [1, 1, 1], [1, 1, -1], [1, -1, 1], [1, -1, -1], [-1, 1, 1],
				[-1, 1, -1], [-1, -1, 1], [-1, -1, -1]];
		var faces = [[2, 14, 4, 12, 0, 1], [15, 9, 11, 19, 3, 2], [16, 10, 17, 7, 6, 3], [6, 7, 19, 11, 18, 4],
				[6, 18, 2, 0, 16, 5], [18, 11, 9, 14, 2, 6], [1, 17, 10, 8, 13, 7], [1, 13, 5, 15, 3, 8],
				[13, 8, 12, 4, 5, 9], [5, 4, 14, 9, 15, 10], [0, 12, 8, 10, 16, 11], [3, 19, 7, 17, 1, 12]];
		return this.create_geom(vertices, faces, radius, 0.2, -Math.PI / 4 / 2, 0.968);
	}

	create_d20_geometry(radius) {
		var t = (1 + Math.sqrt(5)) / 2;
		var vertices = [[-1, t, 0], [1, t, 0 ], [-1, -t, 0], [1, -t, 0],
				[0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t],
				[t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]];
		var faces = [[0, 11, 5, 1], [0, 5, 1, 2], [0, 1, 7, 3], [0, 7, 10, 4], [0, 10, 11, 5],
				[1, 5, 9, 6], [5, 11, 4, 7], [11, 10, 2, 8], [10, 7, 6, 9], [7, 1, 8, 10],
				[3, 9, 4, 11], [3, 4, 2, 12], [3, 2, 6, 13], [3, 6, 8, 14], [3, 8, 9, 15],
				[4, 9, 5, 16], [2, 4, 11, 17], [6, 2, 10, 18], [8, 6, 7, 19], [9, 8, 1, 20]];
		return this.create_geom(vertices, faces, radius, -0.2, -Math.PI / 4 / 2, 0.955);
	}

	fixmaterials(mesh, unique_sides) {
		// this makes the mesh reuse textures for other sides
		for (let i = 0, l = mesh.geometry.groups.length; i < l; ++i) {
			var matindex = mesh.geometry.groups[i].materialIndex - 2;
			if (matindex < unique_sides) continue;

			let modmatindex = (matindex % unique_sides);

			mesh.geometry.groups[i].materialIndex = modmatindex + 2;
		}
		mesh.geometry.elementsNeedUpdate = true;
		return mesh;
	}

	create_shape(vertices, faces, radius) {
		var cv = new Array(vertices.length), cf = new Array(faces.length);
		for (var i = 0; i < vertices.length; ++i) {
			var v = vertices[i];
			cv[i] = new CANNON.Vec3(v.x * radius, v.y * radius, v.z * radius);
		}
		for (var i = 0; i < faces.length; ++i) {
			cf[i] = faces[i].slice(0, faces[i].length - 1);
		}
		const shape = new CANNON.ConvexPolyhedron({vertices:cv,faces:cf});
		return shape
	}

	make_geom(vertices, faces, radius, tab, af) {
		let geom = new THREE.BufferGeometry();

		for (let i = 0; i < vertices.length; ++i) {
				vertices[i] = vertices[i].multiplyScalar(radius);
		}

		let positions = [];
		const normals = [];
		const uvs = [];

		const cb = new THREE.Vector3();
		const ab = new THREE.Vector3();
		let materialIndex;
		let faceFirstVertexIndex = 0;

		for (let i = 0; i < faces.length; ++i) {
				let ii = faces[i], fl = ii.length - 1;
				let aa = Math.PI * 2 / fl;
				materialIndex = ii[fl] + 1;
				for (let j = 0; j < fl - 2; ++j) {

						//Vertices
						positions.push(...vertices[ii[0]].toArray());
						positions.push(...vertices[ii[j + 1]].toArray());
						positions.push(...vertices[ii[j + 2]].toArray());

						// Flat face normals
						cb.subVectors( vertices[ii[j + 2]], vertices[ii[j + 1]] );
						ab.subVectors( vertices[ii[0]], vertices[ii[j + 1]] );
						cb.cross( ab );
						cb.normalize();

						// Vertex Normals
						normals.push(...cb.toArray());
						normals.push(...cb.toArray());
						normals.push(...cb.toArray());

						//UVs
						uvs.push((Math.cos(af) + 1 + tab) / 2 / (1 + tab), (Math.sin(af) + 1 + tab) / 2 / (1 + tab));
						uvs.push((Math.cos(aa * (j + 1) + af) + 1 + tab) / 2 / (1 + tab), (Math.sin(aa * (j + 1) + af) + 1 + tab) / 2 / (1 + tab));
						uvs.push((Math.cos(aa * (j + 2) + af) + 1 + tab) / 2 / (1 + tab), (Math.sin(aa * (j + 2) + af) + 1 + tab) / 2 / (1 + tab));

				}

				//Set Group for face materials.
				let numOfVertices = (fl - 2) * 3;
				for (let i = 0; i < numOfVertices/3; i++) {
					geom.addGroup(faceFirstVertexIndex, 3, materialIndex);
					faceFirstVertexIndex += 3;
				}

		}


		geom.setAttribute( 'position', new THREE.Float32BufferAttribute( positions, 3 ) );
		geom.setAttribute( 'normal', new THREE.Float32BufferAttribute( normals, 3 ) );
		geom.setAttribute( 'uv', new THREE.Float32BufferAttribute( uvs, 2 ) );
		geom.boundingSphere = new THREE.Sphere(new THREE.Vector3(), radius);
		return geom;
	}

	make_d10_geom(vertices, faces, radius, tab, af) {
		let geom = new THREE.BufferGeometry();

		for (let i = 0; i < vertices.length; ++i) {
				vertices[i] = vertices[i].multiplyScalar(radius);
		}

		let positions = [];
		const normals = [];
		const uvs = [];

		const cb = new THREE.Vector3();
		const ab = new THREE.Vector3();
		let materialIndex;
		let faceFirstVertexIndex = 0;

		for (let i = 0; i < faces.length; ++i) {
			let ii = faces[i], fl = ii.length - 1;
			let aa = Math.PI * 2 / fl;
			materialIndex = ii[fl] + 1;
			var w = 0.65;
			var h = 0.85;
			var v0 = 1 - 1*h;
			var v1 = 1 - (0.895/1.105)*h;
			var v2 = 1;
			for (let j = 0; j < fl - 2; ++j) {

				//Vertices
				positions.push(...vertices[ii[0]].toArray());
				positions.push(...vertices[ii[j + 1]].toArray());
				positions.push(...vertices[ii[j + 2]].toArray());

				// Flat face normals
				cb.subVectors( vertices[ii[j + 2]], vertices[ii[j + 1]] );
				ab.subVectors( vertices[ii[0]], vertices[ii[j + 1]] );
				cb.cross( ab );
				cb.normalize();

				// Vertex Normals
				normals.push(...cb.toArray());
				normals.push(...cb.toArray());
				normals.push(...cb.toArray());

				//UVs
				if(faces[i][faces[i].length-1] == -1 || j >= 2){
					uvs.push((Math.cos(af) + 1 + tab) / 2 / (1 + tab), (Math.sin(af) + 1 + tab) / 2 / (1 + tab));
					uvs.push((Math.cos(aa * (j + 1) + af) + 1 + tab) / 2 / (1 + tab), (Math.sin(aa * (j + 1) + af) + 1 + tab) / 2 / (1 + tab));
					uvs.push((Math.cos(aa * (j + 2) + af) + 1 + tab) / 2 / (1 + tab), (Math.sin(aa * (j + 2) + af) + 1 + tab) / 2 / (1 + tab));
				} else if(j==0) {
					uvs.push(0.5-w/2, v1);
					uvs.push(0.5, v0);
					uvs.push(0.5+w/2, v1);
				} else if(j==1) {
					uvs.push(0.5-w/2, v1);
					uvs.push(0.5+w/2, v1);
					uvs.push(0.5, v2);
				}
			}
			//Set Group for face materials.
			let numOfVertices = (fl - 2) * 3;
			for (let i = 0; i < numOfVertices/3; i++) {
				geom.addGroup(faceFirstVertexIndex, 3, materialIndex);
				faceFirstVertexIndex += 3;
			}
		}


		geom.setAttribute( 'position', new THREE.Float32BufferAttribute( positions, 3 ) );
		geom.setAttribute( 'normal', new THREE.Float32BufferAttribute( normals, 3 ) );
		geom.setAttribute( 'uv', new THREE.Float32BufferAttribute( uvs, 2 ) );
		geom.boundingSphere = new THREE.Sphere(new THREE.Vector3(), radius);

		return geom;
	}

	chamfer_geom(vectors, faces, chamfer) {
		var chamfer_vectors = [], chamfer_faces = [], corner_faces = new Array(vectors.length);
		for (var i = 0; i < vectors.length; ++i) corner_faces[i] = [];
		for (var i = 0; i < faces.length; ++i) {
			var ii = faces[i], fl = ii.length - 1;
			var center_point = new THREE.Vector3();
			var face = new Array(fl);
			for (var j = 0; j < fl; ++j) {
				var vv = vectors[ii[j]].clone();
				center_point.add(vv);
				corner_faces[ii[j]].push(face[j] = chamfer_vectors.push(vv) - 1);
			}
			center_point.divideScalar(fl);
			for (var j = 0; j < fl; ++j) {
				var vv = chamfer_vectors[face[j]];
				vv.subVectors(vv, center_point).multiplyScalar(chamfer).addVectors(vv, center_point);
			}
			face.push(ii[fl]);
			chamfer_faces.push(face);
		}
		for (var i = 0; i < faces.length - 1; ++i) {
			for (var j = i + 1; j < faces.length; ++j) {
				var pairs = [], lastm = -1;
				for (var m = 0; m < faces[i].length - 1; ++m) {
					var n = faces[j].indexOf(faces[i][m]);
					if (n >= 0 && n < faces[j].length - 1) {
						if (lastm >= 0 && m != lastm + 1) pairs.unshift([i, m], [j, n]);
						else pairs.push([i, m], [j, n]);
						lastm = m;
					}
				}
				if (pairs.length != 4) continue;
				chamfer_faces.push([
					chamfer_faces[pairs[0][0]][pairs[0][1]],
					chamfer_faces[pairs[1][0]][pairs[1][1]],
					chamfer_faces[pairs[3][0]][pairs[3][1]],
					chamfer_faces[pairs[2][0]][pairs[2][1]],
					-1
				]);
			}
		}
		for (var i = 0; i < corner_faces.length; ++i) {
			var cf = corner_faces[i], face = [cf[0]], count = cf.length - 1;
			while (count) {
				for (var m = faces.length; m < chamfer_faces.length; ++m) {
					var index = chamfer_faces[m].indexOf(face[face.length - 1]);
					if (index >= 0 && index < 4) {
						if (--index == -1) index = 3;
						var next_vertex = chamfer_faces[m][index];
						if (cf.indexOf(next_vertex) >= 0) {
							face.push(next_vertex);
							break;
						}
					}
				}
				--count;
			}
			face.push(-1);
			chamfer_faces.push(face);
		}
		return { vectors: chamfer_vectors, faces: chamfer_faces };
	}

	create_geom(vertices, faces, radius, tab, af, chamfer) {
		var vectors = new Array(vertices.length);
		for (var i = 0; i < vertices.length; ++i) {
			vectors[i] = (new THREE.Vector3).fromArray(vertices[i]).normalize();
		}
		var cg = this.chamfer_geom(vectors, faces, chamfer);
		if(faces.length != 10) {
			var geom = this.make_geom(cg.vectors, cg.faces, radius, tab, af);
		}
		else {
			var geom = this.make_d10_geom(cg.vectors, cg.faces, radius, tab, af);
		}
		//var geom = make_geom(vectors, faces, radius, tab, af); // Without chamfer
		geom.cannon_shape = this.create_shape(vectors, faces, radius);
		return geom;
	}
}

export { DiceFactory }