var mongoose = require('mongoose');

var ChatSchema = new mongoose.Schema({
	sender: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		require: true
	},
	messageType: {
		type: String,
		enum: ['text', 'image'],
		require: true
	},
	content: {
		type: String,
		require: true
	},
	chatRoom : {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'ChatRoom',
		require: true
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

mongoose.model('Chat', ChatSchema);