var express = require('express');
var router = express.Router();

var config = require('../config/env');
var passport = require('passport');
var mongoose = require('mongoose');
var User = mongoose.model('User');
var jwt = require('express-jwt');

var auth = jwt({secret: config.secret, userProperty: 'payload'});
/* GET users listing. */
router.param('userId', function(req, res, next, uid) {
	var query = User.findById(uid);
	query.select('_id username roles profileImageURL');
	query.exec(function(err, usersinfo){
		if (err) {return next(err);}
		if (!usersinfo) {return next(new Error('cannot find usersinfo'));}
		
		req.usersinfo = usersinfo;
		return next();
	});
});

router.get('/', function(req, res, next) {
	User.find(function (err, users) {
		if (err) {return next(err);}

		res.json(users);
	});
});

router.get('/:userId', function(req, res){
	res.json(req.usersinfo);
	
});

router.put('/:userId', function(req, res, next){
	console.log('id: '+req.usersinfo._id);
	req.usersinfo.username = req.body.username;
	req.usersinfo.save(function (err, user) {
		if (err) {return next(err);}

		res.json(user);
	})
	
});
module.exports = router;
