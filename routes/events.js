var express = require('express');
var router = express.Router();

var config = require('../config/env');
var passport = require('passport');
var mongoose = require('mongoose');
var User = mongoose.model('User');
var Event = mongoose.model('Event');
var Shop = mongoose.model('Shop');
var Comment = mongoose.model('Comment');
var Coupon = mongoose.model('Coupon');
var jwt = require('express-jwt');

var auth = jwt({secret: config.secret, userEvent: 'payload'});

router.param('eventId', function(req, res, next, eventId) {
	var query = Event.findById(eventId).populate({path:'comments', match: { deleted: false}, select:'_id message sender created', populate:{path: 'sender', select:'_id username', model:'User'}})
										.populate({path: 'likes', select:'_id username name', model:'User'})
										.populate({path: 'coupons', match: {deleted: false}, select:'_id title limitUsage users', model:'Coupon'});
	query.exec(function(err, event){
		if (err) {return next(err);}
		if (!event) {return next(new Error('cannot find eventInfo'));}
		console.log(event);
		req.event = event;
		return next();
	});
});

router.param('commentId', function(req, res, next, commentId) {
	var query = Comment.findById(commentId);
	query.exec(function(err, comment){
		if (err) {return next(err);}
		if (!comment) {return next(new Error('cannot find commentInfo'));}
		console.log(comment);
		req.comment = comment;
		return next();
	});
});

router.param('couponId', function (req, res, next, couponId) {
	var query = Coupon.findById(couponId);
	query.exec(function (err, coupon) {
		if (err) {return next(err);}
		if (!coupon) {return next(new Error('cannot find coupon'));}
		console.log(coupon);
		req.coupon = coupon;
		return next();
	});
})

router.get('/', function(req, res, next) {
	var options = {};
	if (req.query.business) {
		options.business = req.query.business;
	}
	options.deleted = false;
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
  console.log(req.body);
	var event = new Event(req.body);
	if (!req.body.publishDate) { 
  		var today = new Date();
		today.setHours(0,0,0,0);
  		event.publishDate = today;
  	}
  	else event.publishDate = new Date(req.body.publishDate);
  	if (!req.body.invalidate) { 
  		var today = new Date();
		today.setHours(0,0,0,0);
		var exp = new Date(today);
		exp.setDate(today.getDate() + 365);
  		event.invalidate = exp;
  	}
  	else event.invalidate = new Date(req.body.invalidate);
  	if (!req.body.link) { event.link = undefined}
  	else event.link = req.body.link;
  	event.condition = (req.body.condition)?req.body.condition:undefined;
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
  	if (!req.body.publishDate) { 
  		var today = new Date();
		today.setHours(0,0,0,0);
  		req.event.publishDate = today;
  	}
  	else req.event.publishDate = new Date(req.body.publishDate);
  	if (!req.body.invalidate) { 
  		var today = new Date();
		today.setHours(0,0,0,0);
		var exp = new Date(today);
		exp.setDate(today.getDate() + 365);
  		req.event.invalidate = exp;
  	}
  	else req.event.invalidate = new Date(req.body.invalidate);
	
	req.event.link = (req.body.link)?req.body.link:undefined;
	req.event.condition = (req.body.condition)?req.body.condition:undefined;
  	req.event.imageUrl = req.body.imageUrl;
  	req.event.rules = req.body.rules;
  	console.log(req.event);
	req.event.save(function (err, event) {
			// body...
			if (err) {
				console.log(err);
				return next(err);}
			return res.json(event);
	});	
		
	
});

router.post('/:eventId/comments', function (req, res, next) {
	if(!req.body.sender || !req.body.message) {
    	return res.status(400).json({message: 'Please fill out all fields'});
  	}
  	var comment = new Comment(req.body);
  	comment.event = req.event._id;
  	comment.save(function (err, savedComment) {
  		if (err) {
			console.log(err);
			return next(err);
		}
		req.event.comments.push(savedComment);
		req.event.save(function (err, savedEvent) {
			if (err) {
				console.log(err);
				return next(err);
			}

				console.log('savedEvent:');
				console.log(savedEvent);
			return res.json(savedComment);
		});
  	});
});

router.put('/:eventId/comments/:commentId', function (req, res, next) {
	if (!req.body.message) {
		return res.status(400).json({message: 'Please fill out all fields'});
	}
	req.comment.message = req.body.message;
	req.comment.save(function (err, savedComment) {
		if (err) {return next(err);}
		console.log(savedComment);
		return res.json(savedComment);
	})
});

router.delete('/:eventId/comments/:commentId', function (req, res, next) {
	console.log('id: '+ req.comment._id);
	req.comment.deleted = true;
	req.comment.save(function (err, comment) {
		if (err) {return next(err);}
		return res.json(comment);
	});
});

router.post('/:eventId/coupons', function (req, res, next) {
	if(!req.body.title || !req.body.detail || !req.body.event || !req.body.condition) {
    	return res.status(400).json({message: 'Please fill out all fields'});
  	}
  	var coupon = new Coupon(req.body);
  	
  	coupon.save(function (err, savedCoupon) {
  		if (err) {
			console.log(err);
			return next(err);
		}
		req.event.coupons.push(savedCoupon);
		req.event.save(function (err, savedEvent) {
			if (err) {
				console.log(err);
				return next(err);
			}

				console.log('savedEvent:');
				console.log(savedEvent);
			return res.json(savedCoupon);
		});
  	});
});

router.get('/:eventId/coupons/:couponId', function (req, res, next) {
	res.json(req.coupon);
});

router.put('/:eventId/coupons/:couponId', function (req, res, next) {
	if (!req.body.title || !req.body.detail || !req.body.event || !req.body.condition) {
		return res.status(400).json({message: 'Please fill out all fields'});
	}

	req.coupon.title = req.body.title;
	req.coupon.detail = req.body.detail;
	req.coupon.condition = req.body.condition;
	req.coupon.limitUsage = req.body.limitUsage || 0;
	req.coupon.limitPerUser = req.body.limitPerUser || 1;
	req.coupon.missions = req.body.missions || undefined;

	req.coupon.save(function (err, savedCoupon) {
		if (err) {
			console.log(err);
			return next(err);
		}
		console.log(savedCoupon);
		return res.json(savedCoupon);
	})
});

router.delete('/:eventId/coupons/:couponId', function (req, res, next) {
	console.log('id: '+ req.coupon._id);
	req.coupon.deleted = true;
	req.coupon.save(function (err, coupon) {
		if (err) {return next(err);}
		return res.json(coupon);
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