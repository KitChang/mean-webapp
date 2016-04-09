var mongoose = require('mongoose');

var CouponSchema = new mongoose.Schema({
	title: {
		type: String,
		required: 'Please fill in a property display title',
	},
	detail: {
		type: String,
		required: true
	},
	condition: {
		type: String,
		required: true
	},
	event: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Event',
		required: true
	},
	owner: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
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

mongoose.model('Coupon', CouponSchema);