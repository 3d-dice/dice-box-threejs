# dice-box-threejs
3D Dice implemented with ThreeJS and Cannon ES

Based on [Major's 3D Dice](https://majorvictory.github.io/3DDiceRoller/)

The goal of this project is to decouple the UI of Major's 3D Dice and strip down the dice box to just the essentials. Just a module that accepts simple dice notation input and outputs a JSON object when the dice finish rolling.

Why another dice roller when you have [@3d-dice/dice-box](https://github.com/3d-dice/dice-box)?
Teall dice had already solved predeterministic rolling, which is a feature some developers really need. Major's 3D dice are based on Teall Dice.

## Demo
https://codesandbox.io/s/dice-box-threejs-j79h35?file=/src/index.js

Install using NPM
```
npm install @3d-dice/dice-box-threejs
```

## Config Options
```
const defaultConfig = {
	framerate: (1/60),
	sounds: false,
	volume: 100,
	color_spotlight: 0xefdfd5,
	shadows: true,
	theme_surface:  "green-felt",
	sound_dieMaterial: 'plastic',
	theme_customColorset: null,
	theme_colorset: "white", // see available colorsets in https://github.com/3d-dice/dice-box-threejs/blob/main/src/const/colorsets.js
	theme_texture: "", // see available textures in https://github.com/3d-dice/dice-box-threejs/blob/main/src/const/texturelist.js
	theme_material: "glass", // "none" | "metal" | "wood" | "glass" | "plastic"
	gravity_multiplier: 400,
	light_intensity: 0.7,
	baseScale: 100,
	strength: 1, // toss strength of dice
	onRollComplete: () => {}
}
```

## Notes
In order to use textures or sounds, you will need to manually copy the assets out of the `./public` folder and into your static assets folder where you're building your app.
