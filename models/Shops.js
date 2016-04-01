var mongoose = require('mongoose');

var ShopSchema = new mongoose.Schema({
	business: {
		type: String,
		required: 'Please fill in a business name',
	},
	type: {
		type: String,
		required: true,
		enum: ["餐飲", "地產", "金融", "電商", "娛樂", "保險", "電器", "快消品", 
				"電子產品", "汽車交通", "日用百貨", "珠寶飾品", "家具家裝", "健康休閑", 
				"美容保健", "服飾紡織", "母嬰用品", "運動裝備", "寵物", "健康產品", 
				"玩具禮品", "廣告傳媒", "軟件應用", "其他"]
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
	admin: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User'
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

mongoose.model('Shop', ShopSchema);