var express = require('express');
var router = express.Router();

var config = require('../config/env');
var passport = require('passport');
var mongoose = require('mongoose');
var User = mongoose.model('User');
var Chatroom = mongoose.model('Chatroom');
var Shop = mongoose.model('Shop');
var Chat = mongoose.model('Chat');
var jwt = require('express-jwt');

var auth = jwt({secret: config.secret, userChatroom: 'payload'});

router.param('chatroomId', function(req, res, next, chatroomId) {
	var query = Chatroom.findById(chatroomId).populate({path: 'conversations', match: { deleted: false}, model:'Chat'})
											.populate({path: 'users', model: 'User'});
	query.exec(function(err, chatroom){
		if (err) {return next(err);}
		if (!chatroom) {return next(new Error('cannot find chatroomInfo'));}
		console.log(chatroom);
		req.chatroom = chatroom;
		return next();
	});
});

router.get('/', function(req, res, next) {
	var options = {};
	if (req.query.userId) {
		options.users = req.query.userId;
	}
	options.deleted = false;
	Chatroom.find(options).populate({path: 'users', model: 'User'}).exec(function (err, chatrooms) {
		if (err) {return next(err);}

		res.json(chatrooms);
	});
});

router.get('/:chatroomId', function(req, res){
	
	res.json(req.chatroom);
	
});

router.post('/', function (req, res, next) {
	if(!req.body.chatroom || !req.body.sender){
    	return res.status(400).json({message: 'Please fill out all fields'});
  	}
  	Chatroom.findOne({users: {$all: req.body.chatroom.users}, deleted: false}).exec(function (err, foundChatroom) {
  		if (err) {return next(err);}
  		if (!foundChatroom) {
  			var chatroom = new Chatroom(req.body.chatroom);
  			chatroom.conversations = [];
			console.log(chatroom);
			chatroom.save(function (err, chatroom) {
				if (err) {return next(err);}

				Chatroom.populate(chatroom, {path:'users', model: 'User'}, function (err, chatroom) {
					if (err) {return next(err);}
					return res.json(chatroom);
				});
					
			});
  		}

  		else return res.status(400).json({message: 'Chatroom already exist.'});
  	});
	
	
});

router.put('/:chatroomId', function (req, res, next) {
	if(!req.body.title || !req.body.detail || !req.body.business) {
    	return res.status(400).json({message: 'Please fill out all fields'});
  	}

  	req.chatroom.title = req.body.title;
  	req.chatroom.detail = req.body.detail;
  	if (!req.body.publishDate) { 
  		var today = new Date();
		today.setHours(0,0,0,0);
  		req.chatroom.publishDate = today;
  	}
  	else req.chatroom.publishDate = new Date(req.body.publishDate);
  	if (!req.body.invalidate) { 
  		var today = new Date();
		today.setHours(0,0,0,0);
		var exp = new Date(today);
		exp.setDate(today.getDate() + 365);
  		req.chatroom.invalidate = exp;
  	}
  	else req.chatroom.invalidate = new Date(req.body.invalidate);
	
	req.chatroom.link = (req.body.link)?req.body.link:undefined;
	req.chatroom.condition = (req.body.condition)?req.body.condition:undefined;
  	req.chatroom.imageUrl = req.body.imageUrl;
  	req.chatroom.rules = req.body.rules;
  	console.log(req.chatroom);
	req.chatroom.save(function (err, chatroom) {
			// body...
			if (err) {
				console.log(err);
				return next(err);}
			return res.json(chatroom);
	});	
		
	
});

router.post('/:chatroomId/chats', function (req, res, next) {
	if(!req.body.sender || !req.body.messageType || !req.body.content || !req.body.chatroom) {
    	return res.status(400).json({message: 'Please fill out all fields'});
  	}
  	var chat = new Chat(req.body);
  	chat.save(function (err, savedChat) {
  		if (err) {
			console.log(err);
			return next(err);
		}
		req.chatroom.conversations.push(savedChat);
		req.chatroom.save(function (err, savedChatroom) {
			if (err) {
				console.log(err);
				return next(err);
			}

				console.log('savedChatroom:');
				console.log(savedChatroom);
			return res.json(savedChat);
		});
  	});
});

router.put('/:chatroomId/comments/:commentId', function (req, res, next) {
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

router.delete('/:chatroomId/comments/:commentId', function (req, res, next) {
	console.log('id: '+ req.comment._id);
	req.comment.deleted = true;
	req.comment.save(function (err, comment) {
		if (err) {return next(err);}
		return res.json(comment);
	});
});

router.post('/:chatroomId/coupons', function (req, res, next) {
	if(!req.body.title || !req.body.detail || !req.body.chatroom || !req.body.condition) {
    	return res.status(400).json({message: 'Please fill out all fields'});
  	}
  	var coupon = new Coupon(req.body);
  	
  	coupon.save(function (err, savedCoupon) {
  		if (err) {
			console.log(err);
			return next(err);
		}
		req.chatroom.coupons.push(savedCoupon);
		req.chatroom.save(function (err, savedChatroom) {
			if (err) {
				console.log(err);
				return next(err);
			}

				console.log('savedChatroom:');
				console.log(savedChatroom);
			return res.json(savedCoupon);
		});
  	});
});

router.get('/:chatroomId/coupons/:couponId', function (req, res, next) {
	res.json(req.coupon);
});

router.put('/:chatroomId/coupons/:couponId', function (req, res, next) {
	if (!req.body.title || !req.body.detail || !req.body.chatroom || !req.body.condition) {
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

router.delete('/:chatroomId/coupons/:couponId', function (req, res, next) {
	console.log('id: '+ req.coupon._id);
	req.coupon.deleted = true;
	req.coupon.save(function (err, coupon) {
		if (err) {return next(err);}
		return res.json(coupon);
	});
});

router.delete('/:chatroomId', function (req, res, next) {
	console.log('id: '+ req.chatroom._id);
	req.chatroom.deleted = true;
	req.chatroom.save(function (err, chatroom) {
		if (err) {return next(err);}
		res.json(chatroom);
	});
});
module.exports = router;