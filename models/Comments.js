var mongoose = require('mongoose');

var CommentSchema = new mongoose.Schema({
	message: {
		type: String,
		required: true
	},
	sender: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: true
	},
	event: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Event',
		required: true
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

mongoose.model('Comment', CommentSchema);