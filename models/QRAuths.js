var mongoose = require('mongoose');

var QRAuthSchema = new mongoose.Schema({
	card: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Card',
		require: true
	},
	actionType: {
		type: String,
		enum: ['redeemPoint'],
		require: true
	},
	sender: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		require: true
	},
	detail: {
		type: mongoose.Schema.Types.Mixed,
		require: true
	},
	log: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Log'
	},
	authroized: {
		type: Boolean,
		default: false
	},
	timelife: {
		type: Number,
		default: 120000
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

mongoose.model('QRAuth', QRAuthSchema);