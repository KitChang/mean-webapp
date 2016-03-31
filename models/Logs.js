var mongoose = require('mongoose');

var LogSchema = new mongoose.Schema({
	subject: {
		type: mongoose.Schema.Types.ObjectId,
		required: 'Please fill in a subject'
	},
	subjectType: {
		type: String,
		enum: ['Card'],
		required: true
	},
	action: {
		type: String,
		required: true
	},
	detail: {
		type: mongoose.Schema.Types.Mixed
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


mongoose.model('Log', LogSchema);