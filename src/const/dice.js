export const DICE = {
	d2: {
		name: 'd2',
		labels: ['1','2'],
		values: [ 1,2 ],
		inertia: 8,
		mass: 400,
		scale: 0.9,
		system: 'dweird',
	},
	dc: {
		type: 'd2',
		name: 'Coin',
		labels: [
			'./textures/silvercoin/tail.png',
			'./textures/silvercoin/heads.png'
		],
		setBumpMaps: [ 
			'./textures/silvercoin/tail_bump.png',
			'./textures/silvercoin/heads_bump.png'
		],
		values: [ 0,1 ],
		inertia: 8,
		mass: 400,
		scale: 0.9,
		colorset: "coin_silver"
	},
	d1: {
		name: 'One-sided Dice',
		type: 'd6',
		labels: ['1'],
		values: [ 1,1 ],
		scale: 0.9,
		system: 'dweird',
	},

		/*d2', 'd6: {
		name: 'Two-Sided Dice',
		labels: ['1', '2'],
		values: [ 1,2 ],
		scale: 0.9,
		system: 'dweird',
	},*/

	d3: {
		name: 'Three-Sided Dice',
		type: 'd6',
		labels: ['1', '2', '3'],
		values: [ 1,3 ],
		scale: 0.9,
		system: 'dweird',
	},
	df: {
		name: 'Fudge Dice',
		type: 'd6',
		labels: ['-', '0', '+'],
		values: [ -1,1 ],
		scale: 0.9,
		system: 'dweird',
	},
	d4: {
		name: 'Four-Sided Dice',
		labels: ['1', '2', '3', '4'],
		values: [ 1,4 ],
		inertia: 5,
		scale: 1.2,
	},
	d6: {
		name: 'Six-Sided Dice (Numbers)',
		labels: ['1', '2', '3', '4', '5', '6'],
		values: [ 1,6 ],
		scale: 0.9,
	},
	dpip: {
		name: 'Six-Sided Dice (Pips)',
		type: 'd6',
		labels: [ '   \n ⬤ \n   ', '⬤  \n   \n  ⬤', '⬤  \n ⬤ \n  ⬤',
							'⬤ ⬤\n   \n⬤ ⬤', '⬤ ⬤\n ⬤ \n⬤ ⬤', '⬤ ⬤\n⬤ ⬤\n⬤ ⬤'],
		values: [ 1,6 ],
		scale: 0.9,
		font: 'monospace',
	},
	dsex: {
		name: 'Sex-Sided Emoji Dice',
		type: 'd6',
		labels: ['🍆', '🍑', '👌', '💦', '🙏', '💥'],
		values: [ 1,6 ],
		scale: 0.9,
		display: 'labels',
		system: 'dweird',
	},
	dpoker: {
		name: 'Poker Dice (9-Ace)',
		type: 'd6',
		labels: ['A', '9', '10', 'J', 'Q', 'K'],
		values: [ 1,6 ],
		scale: 0.9,
		display: 'labels',
		system: 'dweird',
		font: 'Times New Roman',
	},
	dspanpoker: {
		name: 'Spanish Poker Dice (7-Ace)',
		type: 'd8',
		labels: ['A', '7', '8', '9', '10', 'J', 'Q', 'K'],
		values: [ 1,8 ],
		display: 'labels',
		system: 'dweird',
		font: 'Times New Roman',
	},
	disotope: {
		name: 'Radioactive Twelve-Sided Dice',
		type: 'd12',
		labels: ['', '', '', '', '', '', '', '', '', '', '', '☢️'],
		values: [0,0,0,0,0,0,0,0,0,0,0,1],
		mass: 350,
		inertia: 8,
		scale: 0.9,
		system: 'dweird',
	},
	dsuit: {
		name: 'Four-Suited Dice',
		type: 'd4',
		labels: ['♠️', '♥️', '♦️', '♣️'],
		values: [ 1,4 ],
		inertia: 5,
		scale: 1.2,
		display: 'labels',
		system: 'dweird',
	},
	d8: {
		name: 'Eight-Sided Dice',
		labels: ['1', '2', '3', '4', '5', '6', '7', '8'],
		values: [ 1,8 ],
	},
	d10: {
		name: 'Ten-Sided Dice (Single Digit)',
		labels: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
		values: [ 1,10 ],
		mass: 350,
		inertia: 9,
		scale: 0.9,
	},
	d100: {
		name: 'Ten-Sided Dice (Tens Digit)',
		type: 'd10',
		labels: ['10', '20', '30', '40', '50', '60', '70', '80', '90', '00'],
		values: [ 10, 100, 10 ],
		mass: 350,
		inertia: 9,
		scale: 0.9,
	},
	d12: {
		name: 'Twelve-Sided Dice',
		labels: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
		values: [ 1,12 ],
		mass: 350,
		inertia: 8,
		scale: 0.9,
	},
	d20: {
		name: 'Twenty-Sided Dice',
		labels: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20'],
		values: [ 1,20 ],
		mass: 400,
		inertia: 6,
	},
	//star wars rpg dice
	// Ability
	dabi: {
		name: 'Star Wars RPG: Ability Dice',
		type: 'd8',
		labels: ['s','a',"s\na","s\ns",'a','s',"a\na",''],
		values: [ 1,8 ],
		font: 'SWRPG-Symbol-Regular',
		color: '#00FF00',
		colorset: 'swrpg_abi',
		display: 'labels',
		system: 'swrpg',
	},
	// Difficulty
	ddif: {
		name: 'Star Wars RPG: Difficulty Dice',
		type: 'd8',
		labels: ['t','f',"f\nt",'t','',"t\nt", "f\nf", 't'],
		values: [ 1,8 ],
		font: 'SWRPG-Symbol-Regular',
		color: '#8000FC',
		colorset: 'swrpg_dif',
		display: 'labels',
		system: 'swrpg',
	},
	// Proficiency
	dpro: {
		name: 'Star Wars RPG: Proficiency Dice',
		type: 'd12',
		labels: ["a\na",'a',"a\na",'x','s',"s\na",'s',"s\na","s\ns","s\na","s\ns",''],
		values: [ 1,12 ],
		mass: 350,
		inertia: 8,
		scale: 0.9,
		font: 'SWRPG-Symbol-Regular',
		color: '#FFFF00',
		colorset: 'swrpg_pro',
		display: 'labels',
		system: 'swrpg',
	},
	// Challenge
	dcha: {
		name: 'Star Wars RPG: Challenge Dice',
		type: 'd12',
		labels: ["t\nt",'t',"t\nt",'t',"t\nf",'f',"t\nf",'f',"f\nf",'y',"f\nf",''],
		values: [ 1,12 ],
		mass: 350,
		inertia: 8,
		scale: 0.9,
		font: 'SWRPG-Symbol-Regular',
		color: '#FF0000',
		colorset: 'swrpg_cha',
		display: 'labels',
		system: 'swrpg',
	},
	// Force
	dfor: {
		name: 'Star Wars RPG: Force Dice',
		type: 'd12',
		labels: ['z',"Z\nZ",'z',"Z\nZ",'z',"Z\nZ",'z','Z','z','Z','z',"z\nz"],
		values: [ 1,12 ],
		mass: 350,
		inertia: 8,
		scale: 0.9,
		font: 'SWRPG-Symbol-Regular',
		color: '#FFFFFF',
		colorset: 'swrpg_for',
		display: 'labels',
		system: 'swrpg',
	},
	// Boost
	dboo: {
		name: 'Star Wars RPG: Boost Dice',
		type: 'd6',
		labels: ["s  \n  a","a  \n  a",'s','a','',''],
		values: [ 1,6 ],
		scale: 0.9,
		font: 'SWRPG-Symbol-Regular',
		color: '#00FFFF',
		colorset: 'swrpg_boo',
		display: 'labels',
		system: 'swrpg',
	},
	// Setback
	dset: {
		name: 'Star Wars RPG: Setback Dice',
		type: 'd6',
		labels: ['','t','f'],
		values: [ 1,3 ],
		scale: 0.9,
		font: 'SWRPG-Symbol-Regular',
		color: '#111111',
		colorset: 'swrpg_set',
		display: 'labels',
		system: 'swrpg',
	},
	// star wars armada dice
	// Attack Red
	swar: {
		name: 'Star Wars Armada: Red Attack Dice',
		type: 'd8',
		labels: ['F','F','F\nF','E','E','G','',''],
		values: [ 1,8 ],
		font: 'Armada-Symbol-Regular',
		color: '#FF0000',
		colorset: 'swa_red',
		display: 'labels',
		system: 'swarmada',
	},
	// Attack Blue
	swab: {
		name: 'Star Wars Armada: Blue Attack Dice',
		type: 'd8',
		labels: ['F','F','F','F','E','E','G','G'],
		values: [ 1,8 ],
		font: 'Armada-Symbol-Regular',
		color: '#0000FF',
		colorset: 'swa_blue',
		display: 'labels',
		system: 'swarmada',
	},
	// Attack Black
	swak: {
		name: 'Star Wars Armada: Black Attack Dice',
		type: 'd8',
		labels: ['F','F','F','F','F\nE','F\nE','',''],
		values: [ 1,8 ],
		font: 'Armada-Symbol-Regular',
		color: '#111111',
		colorset: 'swa_black',
		display: 'labels',
		system: 'swarmada',
	},
	// star wars x-wing
	// Attack - Red
	xwatk: {
		name: 'Star Wars X-Wing: Red Attack Dice',
		type: 'd8',
		labels: ['c','d','d','d','f','f','',''],
		values: [ 1,8 ],
		font: 'XWing-Symbol-Regular',
		color: '#FF0000',
		colorset: 'xwing_red',
		display: 'labels',
		system: 'xwing',
	},
	// Defense - Green
	xwdef: {
		name: 'Star Wars X-Wing: Green Defense Dice',
		type: 'd8',
		labels: ['e','e','e','f','f','','',''],
		values: [ 1,8 ],
		font: 'XWing-Symbol-Regular',
		color: '#00FF00',
		colorset: 'xwing_green',
		display: 'labels',
		system: 'xwing',
	},
	// star wars legion
	// Attack Red
	swlar: {
		name: 'Star Wars Legion: Red Attack Dice',
		type: 'd8',
		labels: ['h','h','h','h','h','c','o',''],
		values: [ 1,8 ],
		font: 'Legion-Symbol-Regular',
		color: '#FF0000',
		colorset: 'swl_atkred',
		display: 'labels',
		system: 'legion',
	},
	// Attack Black
	swlab: {
		name: 'Star Wars Legion: Black Attack Dice',
		type: 'd8',
		labels: ['h','h','h','','','c','o',''],
		values: [ 1,8 ],
		font: 'Legion-Symbol-Regular',
		color: '#111111',
		colorset: 'swl_atkblack',
		display: 'labels',
		system: 'legion',
	},
	// Attack White
	swlaw: {
		name: 'Star Wars Legion: White Attack Dice',
		type: 'd8',
		labels: ['h','','','','','c','o',''],
		values: [ 1,8 ],
		font: 'Legion-Symbol-Regular',
		color: '#FFFFFF',
		colorset: 'swl_atkwhite',
		display: 'labels',
		system: 'legion',
	},
	// Defense Red
	swldr: {
		name: 'Star Wars Legion: Red Defense Dice',
		type: 'd6',
		labels: ['s','s','s','d','',''],
		values: [ 1,6 ],
		scale: 0.9,
		font: 'Legion-Symbol-Regular',
		color: '#FF0000',
		colorset: 'swl_defred',
		display: 'labels',
		system: 'legion',
	},
	// Defense White
	swldw: {
		name: 'Star Wars Legion: White Defense Dice',
		type: 'd6',
		labels: ['s','','','d','',''],
		values: [ 1,6 ],
		scale: 0.9,
		font: 'Legion-Symbol-Regular',
		color: '#FFFFFF',
		colorset: 'swl_defwhite',
		display: 'labels',
		system: 'legion',
	},
}