module.exports = {
	db: {
		uri: 'mongodb://' + (process.env.DB_1_PORT_27017_TCP_ADDR || 'localhost') + '/meanwebapp-dev'
	},
	mongolab : {
		uri: 'mongodb://admin:admin@ds059672.mongolab.com:59672/mean-dev'
	}, 
	port: process.env.PORT || 4000,
	secret: 'Maximity2015',
	appTitle: 'MEAN Project'
};