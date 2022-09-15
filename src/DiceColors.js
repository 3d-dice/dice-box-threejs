import {TEXTURELIST} from "./const/texturelist"
import {COLORSETS} from "./const/colorsets"

export class DiceColors {
	
	constructor() {
		this.colorsets = []
	}

	async ImageLoader(data) {

		if (Array.isArray(data)) {
			for(let i = 0, l = data.length; i < l; i++){
				data[i] = await this.ImageLoader(data[i])
			}
			return data
		}
		
		if (data.source && data.source != '') {
			data.texture = await this.loadImage(data.source)
		}
		
		if (data.source_bump && data.source_bump != '') {
			data.bump = await this.loadImage(data.source_bump)
		}

		return data
	}

	loadImage(src){
		return new Promise((resolve, reject) => {
			let img = new Image()
			img.onload = () => resolve(img)
			img.src = src
		})
	}

	// randomColor() {
	// 	// random colors
	// 	let rgb=[];
	// 	rgb[0] = Math.floor(Math.random() * 254);
	// 	rgb[1] = Math.floor(Math.random() * 254);
	// 	rgb[2] = Math.floor(Math.random() * 254);
		
	// 	// this is an attempt to make the foregroudn color stand out from the background color
	// 	// it sometimes produces ok results
	// 	let brightness = ((parseInt(rgb[0]) * 299) + (parseInt(rgb[1]) * 587) +  (parseInt(rgb[2]) * 114)) / 1000;
	// 	let foreground = (brightness > 126) ? 'rgb(30,30,30)' : 'rgb(230,230,230)'; // high brightness = dark text, else bright text
	// 	let background = 'rgb(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ')';
		
	// 	return {background: background, foreground: foreground };
	// }
	
	async getColorSet(options) {
		let setName, texture
		if(typeof options === "string") {
			setName = options
		}
		if(typeof options === "object") {
			setName = options.colorset
		}
		// if colorset has already been created and cached, then return it
		if(this.colorsets.hasOwnProperty(setName)) {
			return this.colorsets[setName]
		}

		let colorset = COLORSETS[setName];
		texture = options.texture || colorset.texture
		
		// get texture data
		colorset.texture = this.getTexture(texture)

		// load textures
		colorset.texture = await this.ImageLoader(colorset.texture)

		// if material type was specified then use it
		if(options.material) {
			colorset.texture.material = options.material
		}

		// save it for later
		this.colorsets[setName] = colorset

		return colorset;
	}
	
	getTexture(texturename) {
		if (Array.isArray(texturename)) {
			let textures = [];
			for(let i = 0, l = texturename.length; i < l; i++){
				textures.push(this.getTexture(texturename[i]));
			}
			return textures;
		}
		
		if (TEXTURELIST.hasOwnProperty(texturename)) {
			return TEXTURELIST[texturename]
		}
		return TEXTURELIST['none']
	}

}