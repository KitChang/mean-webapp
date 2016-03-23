var mongoose = require('mongoose');

var ShopSchema = new mongoose.Schema({
	business: {
		type: String,
		required: 'Please fill in a business name',
	},
	type: {
		type: String,
		required: true,
		enum: ['餐飲','零售','服務','其他']
	},
	tierImages: {
		type: [String],
		required: true,
		default: ["http://smock_prod.s3.amazonaws.com/2507/bookkeeping2_preview_en.jpg",
					"http://smock_prod.s3.amazonaws.com/2507/bookkeeping2_preview_en.jpg",
					"http://smock_prod.s3.amazonaws.com/2507/bookkeeping2_preview_en.jpg"]
	},
	region: {
		type: String,
		required: true,
		enum: ['澳門','香港','中國','台灣']
	},
	tiers: {
		type: [String],
		required: true,
		default: ['Silver', 'Gold', 'Platinum']
	},
	members: [{
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Card'
	}],
	serialNumber: {
		type: Number,
		required: 'Please fill in a serial number',
		default: 1
	},
	initMemberExp: {
		type: Number,
		default: 365
	},
	major: Number,
	minor: Number,
	qrCode: String,
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

mongoose.model('Shop', ShopSchema);