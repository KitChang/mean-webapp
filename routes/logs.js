var express = require('express');
var router = express.Router();

var config = require('../config/env');
var passport = require('passport');
var mongoose = require('mongoose');
var User = mongoose.model('User');
var Log = mongoose.model('Log');
var jwt = require('express-jwt');

var auth = jwt({secret: config.secret, userLog: 'payload'});

router.param('logId', function(req, res, next, logId) {
	var query = Log.findById(logId);
	query.exec(function(err, log){
		if (err) {return next(err);}
		if (!log) {return next(new Error('cannot find logInfo'));}
		
		req.log = log;
		return next();
	});
});

router.param('cardId', function(req, res, next, cardId) {
	req.cardId = cardId;
	return next();
	
});

router.get('/', function(req, res, next) {
	Log.find({ deleted: false},function (err, logs) {
		if (err) {return next(err);}

		res.json(logs);
	});
});

router.get('/cardLogs/:cardId', function(req, res, next) {
	console.log(req.cardId)
	Log.find({subject:req.cardId, subjectType:'Card', deleted: false}).sort({ created: -1 }).exec(function (err, logs) {
		if (err) {return next(err);}

		res.json(logs);
	});
});

router.get('/:logId', function(req, res){
	
	res.json(req.log);
	
});

router.post('/', function (req, res, next) {
	if(!req.body){
    return res.status(400).json({message: 'Please fill out all fields'});
  }
	var log = new Log(req.body);
	console.log(log);
	log.save(function (err, log) {
		if (err) {return next(err);}
			return res.json(log);
	});
	
});

router.put('/:logId', function (req, res, next) {
	if(!req.body) {
    	return res.status(400).json({message: 'Please fill out all fields'});
  	}

  	console.log(req.log);
	req.log.save(function (err, log) {
			// body...
			if (err) {
				console.log(err);
				return next(err);}
			return res.json(log);
	});	
		
	
});

router.delete('/:logId', function (req, res, next) {
	console.log('id: '+ req.log._id);
	req.log.deleted = true;
	req.log.save(function (err, log) {
		if (err) {return next(err);}
		res.json(log);
	});
});
module.exports = router;