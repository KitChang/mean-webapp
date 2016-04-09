var mongoose = require('mongoose');

var EventSchema = new mongoose.Schema({
	title: {
		type: String,
		required: 'Please fill in a property display title',
	},
	detail: {
		type: String,
		required: 'Please fill in a property layout'
	},
	condition: {
		type: String
	},
	rules: [{
		type: String,
		default: []
	}],
	business: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Shop',
		required: true
	},
	publishDate: {
		type: Date
	},
	invalidate: {
		type: Date
	},
	link: {
		type: String
	},
	imageUrl: {
		type: [String],
		default: []
	},
	comments: [{
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Comment'
	}],
	likes: [{
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User'
	}],
	coupons: [{
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Coupon'
	}],
	published: {
		type: Boolean,
		default: false
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

mongoose.model('Event', EventSchema);