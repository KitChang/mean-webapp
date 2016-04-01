var mongoose = require('mongoose');

var CardSchema = new mongoose.Schema({
	number: {
		type: String,
		required: 'Please fill in a number',
		unique: true
	},
	exp: {
		type: Date,
		required: 'Please fill in a exp'
	},
	cardImage: {
		type: String,
		required: true
	},
	business: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Shop',
		required: true
	},
	owner: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: true
	},
	tier: {
		type: String,
		required: true,
		enum: ['Silver', 'Gold', 'Platinum'],
	},
	valid: {
		type: Boolean,
		default: false
	},
	usage: {
		type: Number,
		default: 0
	},
	point: {
		type: Number,
		default: 0
	},
	created: {
		type: Date,
		default: Date.now
	},
	updated: {
		type: Date
	},
	deleted: {
		type: Boolean,
		default: false
	}

});


mongoose.model('Card', CardSchema);