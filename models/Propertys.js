var mongoose = require('mongoose');

var PropertySchema = new mongoose.Schema({
	displayTitle: {
		type: String,
		required: 'Please fill in a property display title',
	},
	layout: {
		type: String,
		required: 'Please fill in a property layout'
	},
	area: {
		type: Number,
		min: 1,
		required: true
	},
	layer: {
		type: Number,
		required: true
	},
	region: {
		type: String,
		enum: ['澳門','氹仔','路環'],
		required: true
	},
	subRegion: {
		type: String,
		required: true,
		enum: ['澳門東北區', '澳門市中心', '澳門西北區','澳門新馬路區', '東望洋山(松山)及憲山區',
				'澳門南灣區', '西望洋山/媽閣區','新口岸及外港新填海區', '氹仔市中心區', '氹仔西北區', '氹仔東北區',
			  		'聖母灣區', '路氹填海區',
					'機場區', '氹仔村','澳門大學新校區', '九澳', '石排灣', '竹灣',
			  		'黑沙', '路環村', '聯生工業區']
	},
	street: {
		type: String,
		required: true
	},
	buildYear: {
		type: Number
	},
	accessory: {
		type: [{
			type: String
		}]
	},
	rent: {
		type: Number,
		required: true
	},
	manageFee: {
		type: Number
	},
	latitude: {
		type: Number
	},
	longitude: {
		type: Number
	},
	likes: [{
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User'
	}],
	imageUrl: [{
		type: String
	}],
	deleted: {
		type: Boolean,
		default: false
	}

});

mongoose.model('Property', PropertySchema);