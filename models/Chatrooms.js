var mongoose = require('mongoose');

var ChatroomSchema = new mongoose.Schema({
	users: [{
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User'
	}],
	conversations: [{
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User'
	}],
	created: {
		type: Date,
		default: Date.now
	},
	updated: {
		type: Date,
		default: Date.now
	},
	deleted: {
		type: Boolean,
		default: false
	}

});

mongoose.model('Chatroom', ChatroomSchema);