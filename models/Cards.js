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
		ref: 'Shop'
	},
	owner: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User'
	},
	tier: {
		type: String,
		required: true,
		enum: ['Silver', 'Gold', 'Platinum'],
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