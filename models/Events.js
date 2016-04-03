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
	imageUrl: [{
		type: String
	}],
	likes: [{
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User'
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