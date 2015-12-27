var express = require('express');
var router = express.Router();

var config = require('../config/env');
var passport = require('passport');
var mongoose = require('mongoose');
var User = mongoose.model('User');
var Stop = mongoose.model('Stop');
var jwt = require('express-jwt');

var auth = jwt({secret: config.secret, userProperty: 'payload'});

router.get('/', function(req, res, next) {
	Stop.find(function (err, stops) {
		if (err) {return next(err);}

		res.json(stops);
	});
});

router.post('/', function (req, res, next) {
	if(!req.body.displayName || !req.body.code || !req.body.subCode || 
		!req.body.region || !req.body.subRegion){
    return res.status(400).json({message: 'Please fill out all fields'});
  }
	Stop.findOne({code: req.body.code, subCode: req.body.subCode})
	.exec(function (err, stop) {
		if (err) {return next(err);}
		if (stop) {return next(new Error('duplicate stop code'))};
		var stop = new Stop();
		stop.displayName = req.body.displayName;
		stop.code = req.body.code;
		stop.subCode = req.body.subCode;
		stop.region = req.body.region;
		stop.subRegion = req.body.subRegion;
		stop.save(function (err, stop) {
			if (err) {return next(err);}
			return res.json(stop);
		});
	});
});

module.exports = router;