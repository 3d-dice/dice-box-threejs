# dice-box-threejs
3D Dice implemented with ThreeJS and Cannon ES

Based on [Major's 3D Dice](https://majorvictory.github.io/3DDiceRoller/)

The goal of this project is to decouple the UI of Major's 3D Dice and strip down the dice box to just the essentials. Just a module that accepts simple dice notation input and outputs a JSON object when the dice finish rolling.

Why another dice roller when you have [@3d-dice/dice-box](https://github.com/3d-dice/dice-box)?
Teall dice had already solved predeterministic rolling, which is a feature some developers really need. Major's 3D dices is based on Teal Dice