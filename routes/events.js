var express = require('express');
var router = express.Router();

var config = require('../config/env');
var passport = require('passport');
var mongoose = require('mongoose');
var User = mongoose.model('User');
var Event = mongoose.model('Event');
var Shop = mongoose.model('Shop');
var jwt = require('express-jwt');

var auth = jwt({secret: config.secret, userEvent: 'payload'});

router.param('eventId', function(req, res, next, eventId) {
	var query = Event.findById(eventId);
	query.exec(function(err, event){
		if (err) {return next(err);}
		if (!event) {return next(new Error('cannot find eventInfo'));}
		
		req.event = event;
		return next();
	});
});

router.get('/', function(req, res, next) {
	var options = {};
	if (req.query.business) {
		options.business = req.query.business;
	}
	Event.find(options, function (err, events) {
		if (err) {return next(err);}

		res.json(events);
	});
});

router.get('/:eventId', function(req, res){
	
	res.json(req.event);
	
});

router.post('/', function (req, res, next) {
	if(!req.body.title || !req.body.detail || !req.body.business){
    return res.status(400).json({message: 'Please fill out all fields'});
  }
	var event = new Event(req.body);
	if (!req.body.validDate) { 
  		var today = new Date();
		today.setHours(0,0,0,0);
  		req.event.validDate = today;
  	}
  	else req.event.validDate = new Date(req.body.validDate);
  	if (!req.body.invalidDate) { 
  		var today = new Date();
		today.setHours(0,0,0,0);
		var exp = new Date(today);
		exp.setDate(today.getDate() + 365);
  		req.event.invalidDate = exp;
  	}
  	else req.event.invalidDate = new Date(req.body.invalidDate);
	console.log(event);
	event.save(function (err, event) {
		if (err) {return next(err);}
			return res.json(event);
	});
	
});

router.put('/:eventId', function (req, res, next) {
	if(!req.body.title || !req.body.detail || !req.body.business) {
    	return res.status(400).json({message: 'Please fill out all fields'});
  	}

  	req.event.title = req.body.title;
  	req.event.detail = req.body.detail;
  	req.event.business = req.body.business;
  	if (!req.body.validDate) { 
  		var today = new Date();
		today.setHours(0,0,0,0);
  		req.event.validDate = today;
  	}
  	else req.event.validDate = new Date(req.body.validDate);
  	if (!req.body.invalidDate) { 
  		var today = new Date();
		today.setHours(0,0,0,0);
		var exp = new Date(today);
		exp.setDate(today.getDate() + 365);
  		req.event.invalidDate = exp;
  	}
  	else req.event.invalidDate = new Date(req.body.invalidDate);

  	console.log(req.event);
	req.event.save(function (err, event) {
			// body...
			if (err) {
				console.log(err);
				return next(err);}
			return res.json(event);
	});	
		
	
});

router.delete('/:eventId', function (req, res, next) {
	console.log('id: '+ req.event._id);
	req.event.deleted = true;
	req.event.save(function (err, event) {
		if (err) {return next(err);}
		res.json(event);
	});
});
module.exports = router;