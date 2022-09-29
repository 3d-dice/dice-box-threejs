export const TEXTURELIST = {
	'cloudy': {
		name: 'Clouds (Transparent)',
		composite: 'destination-in',
		source: 'textures/cloudy.webp',
		source_bump: 'textures/cloudy.alt.webp'
	},
	'cloudy_2': {
		name: 'Clouds',
		composite: 'multiply',
		source: 'textures/cloudy.alt.webp',
		source_bump: 'textures/cloudy.alt.webp'
	},
	'fire': {
		name: 'Fire',
		composite: 'multiply',
		source: 'textures/fire.webp',
		source_bump: 'textures/fire.webp',
		material: 'metal'
	},
	'marble': {
		name: 'Marble',
		composite: 'multiply',
		source: 'textures/marble.webp',
		source_bump: '',
		material: 'glass'
	},
	'water': {
		name: 'Water',
		composite: 'destination-in',
		source: 'textures/water.webp',
		source_bump: 'textures/water.webp',
		material: 'glass'
	},
	'ice': {
		name: 'Ice',
		composite: 'destination-in',
		source: 'textures/ice.webp',
		source_bump: 'textures/ice.webp',
		material: 'glass'
	},
	'paper': {
		name: 'Paper',
		composite: 'multiply',
		source: 'textures/paper.webp',
		source_bump: 'textures/paper-bump.webp',
		material: 'wood'
	},
	'speckles': {
		name: 'Speckles',
		composite: 'multiply',
		source: 'textures/speckles.webp',
		source_bump: 'textures/speckles.webp',
		material: 'none'
	},
	'glitter': {
		name: 'Glitter',
		composite: 'multiply',
		source: 'textures/glitter.webp',
		source_bump: 'textures/glitter-bump.webp',
		material: 'none'
	},
	'glitter_2': {
		name: 'Glitter (Transparent)',
		composite: 'destination-in',
		source: 'textures/glitter-alpha.webp',
		source_bump: '',
		material: 'none'
	},
	'stars': {
		name: 'Stars',
		composite: 'multiply',
		source: 'textures/stars.webp',
		source_bump: 'textures/stars.webp',
		material: 'none'
	},
	'stainedglass': {
		name: 'Stained Glass',
		composite: 'multiply',
		source: 'textures/stainedglass.webp',
		source_bump: 'textures/stainedglass-bump.webp',
		material: 'glass'
	},
	'wood': {
		name: 'Wood',
		composite: 'multiply',
		source: 'textures/wood.webp',
		source_bump: 'textures/wood.webp',
		material: 'wood'
	},
	'metal': {
		name: 'Stainless Steel',
		composite: 'multiply',
		source: 'textures/metal.webp',
		source_bump: 'textures/metal-bump.webp',
		material: 'metal'
	},
	'skulls': {
		name: 'Skulls',
		composite: 'multiply',
		source: 'textures/skulls.webp',
		source_bump: 'textures/skulls.webp'
	},
	'leopard': {
		name: 'Leopard',
		composite: 'multiply',
		source: 'textures/leopard.webp',
		source_bump: 'textures/leopard.webp',
		material: 'wood'
	},
	'tiger': {
		name: 'Tiger',
		composite: 'multiply',
		source: 'textures/tiger.webp',
		source_bump: 'textures/tiger.webp',
		material: 'wood'
	},
	'cheetah': {
		name: 'Cheetah',
		composite: 'multiply',
		source: 'textures/cheetah.webp',
		source_bump: 'textures/cheetah.webp',
		material: 'wood'
	},
	'dragon': {
		name: 'Dragon',
		composite: 'multiply',
		source: 'textures/dragon.webp',
		source_bump: 'textures/dragon-bump.webp',
		material: 'none'
	},
	'lizard': {
		name: 'Lizard',
		composite: 'multiply',
		source: 'textures/lizard.webp',
		source_bump: 'textures/lizard.webp',
		material: 'none'
	},
	'bird': {
		name: 'Bird',
		composite: 'multiply',
		source: 'textures/feather.webp',
		source_bump: 'textures/feather-bump.webp',
		material: 'wood'
	},
	'astral': {
		name: 'Astral Sea',
		composite: 'multiply',
		source: 'textures/astral.webp',
		source_bump: 'textures/stars.webp',
		material: 'none'
	},
	'acleaf': {
		name: 'AC Leaf',
		composite: 'multiply',
		source: 'textures/acleaf.webp',
		source_bump: 'textures/acleaf.webp',
		material: 'none'
	},
	'thecage': {
		name: 'Nicholas Cage',
		composite: 'multiply',
		source: 'textures/thecage.webp',
		source_bump: '',
		material: 'metal'
	},
	'isabelle': {
		name: 'Isabelle',
		composite: 'source-over',
		source: 'textures/isabelle.webp',
		source_bump: '',
		material: 'none'
	},
	'bronze01': {
		name: 'bronze01',
		composite: 'difference',
		source: 'textures/bronze01.webp',
		source_bump: '',
		material: 'metal'
	},
	'bronze02': {
		name: 'bronze02',
		composite: 'difference',
		source: 'textures/bronze02.webp',
		source_bump: '',
		material: 'metal'
	},
	'bronze03': {
		name: 'bronze03',
		composite: 'difference',
		source: 'textures/bronze03.webp',
		source_bump: '',
		material: 'metal'
	},
	'bronze03a': {
		name: 'bronze03a',
		composite: 'difference',
		source: 'textures/bronze03a.webp',
		source_bump: '',
		material: 'metal'
	},
	'bronze03b': {
		name: 'bronze03b',
		composite: 'difference',
		source: 'textures/bronze03b.webp',
		source_bump: '',
		material: 'metal'
	},
	'bronze04': {
		name: 'bronze04',
		composite: 'difference',
		source: 'textures/bronze04.webp',
		source_bump: '',
		material: 'metal'
	},
	'none': {
		name: 'none',
		composite: 'source-over',
		source: '',
		source_bump: '',
		material: ''
	},
	'': {
		name: '~ Preset ~',
		composite: 'source-over',
		source: '',
		source_bump: '',
		material: ''
	}
};