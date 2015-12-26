module.exports = {
	db: {
		uri: 'mongodb://' + (process.env.DB_1_PORT_27017_TCP_ADDR || 'localhost') + '/meanwebapp-dev'
	},
	port: process.env.PORT || 4000,
	secret: 'Maximity2015',
	appTitle: 'MEAN Project'
};