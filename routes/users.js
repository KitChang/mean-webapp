var express = require('express');
var router = express.Router();

var config = require('../config/env');
var passport = require('passport');
var mongoose = require('mongoose');
var User = mongoose.model('User');
var jwt = require('express-jwt');

var auth = jwt({secret: config.secret, userProperty: 'payload'});
/* GET users listing. */
router.get('/', function(req, res, next) {
	User.find(function (err, users) {
		if (err) {return next(err);}

		res.json(users);
	});
});

module.exports = router;
