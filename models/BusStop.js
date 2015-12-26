var mongoose = require('mongoose');

var BusStopSchema = new mongoose.Schema({
	displayName: {
		type: String,
		required: 'Please fill in a bus stop name'
	},
	code: {
		type: String,
		required: 'Please fill in a bus stop code'
	},
	subCode: {
		type: String
	},
	region: {
		type: String,
		enum: ['澳門東北區', '澳門市中心', '澳門西北區','澳門新馬路區', '東望洋山(松山)及憲山區',
				'澳門南灣區', '西望洋山/媽閣區','新口岸及外港新填海區']
	},
	islands: {
		type: String,
		enum: ['澳門','氹仔','路環']
	}

});

mongoose.model('BusStop', BusStopSchema);