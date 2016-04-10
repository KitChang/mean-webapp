var express = require('express');
var router = express.Router();

var config = require('../config/env');
var passport = require('passport');
var mongoose = require('mongoose');
var User = mongoose.model('User');
var Coupon = mongoose.model('Coupon');
var jwt = require('express-jwt');

var auth = jwt({secret: config.secret, userCoupon: 'payload'});

router.param('couponId', function(req, res, next, couponId) {
	var query = Coupon.findById(couponId).populate({path: 'owner', select:'_id username', model:'User'});
	query.exec(function(err, coupon){
		if (err) {return next(err);}
		if (!coupon) {return next(new Error('cannot find couponInfo'));}
		
		req.coupon = coupon;
		return next();
	});
});

router.get('/', auth, function(req, res, next) {
	console.log(req.user);
	if (req.user.roles.indexOf("admin") == -1) {
		return res.status(401).json({message: 'Permission denied'})
	}
	Coupon.find({ deleted: false},function (err, coupons) {
		if (err) {return next(err);}

		res.json(coupons);
	});
});

router.get('/:couponId', function(req, res){
	
	res.json(req.coupon);
	
});

router.post('/', function (req, res, next) {
	if(!req.body.title || !req.body.detail || !req.body.condition || !req.body.event){
    return res.status(400).json({message: 'Please fill out all fields'});
  }
	var coupon = new Coupon(req.body);
	console.log(coupon);
	coupon.save(function (err, savedCoupon) {
		if (err) {return next(err);}
			return res.json(savedCoupon);
	});
	
});

router.put('/:couponId', function (req, res, next) {
	if(!req.body.business || !req.body.type || !req.body.region) {
    	return res.status(400).json({message: 'Please fill out all fields'});
  	}

  	req.coupon.business = req.body.business;
  	req.coupon.type = req.body.type;
  	req.coupon.region = req.body.region;
  	if (!req.body.major) { req.coupon.major = undefined;}
  	else req.coupon.major = req.body.major;
  	if (!req.body.minor) { req.coupon.minor = undefined;}
  	else req.coupon.minor = req.body.minor;
  	if (!req.body.qrCode) { req.coupon.qrCode = undefined;}
  	else req.coupon.qrCode = req.body.qrCode;
  	if (!req.body.admin) { req.coupon.admin = undefined;}
  	else req.coupon.admin = req.body.admin;
  	console.log(req.coupon);
	req.coupon.save(function (err, coupon) {
			// body...
		if (err) {
			console.log(err);
			return next(err);
		}
		if (coupon.admin) {
			User.findById(coupon.admin).exec(function (err, foundUser) {
				if (err) {
					console.log(err);
				}
				console.log(foundUser);
				foundUser.business = coupon._id;
				foundUser.save(function (err, savedUser) {
					if (err) {
						console.log(err);
					}
				});
			});
		}
		return res.json(coupon);
	});	
		
	
});

router.delete('/:couponId', function (req, res, next) {
	console.log('id: '+ req.coupon._id);
	req.coupon.deleted = true;
	req.coupon.save(function (err, coupon) {
		if (err) {return next(err);}
		res.json(coupon);
	});
});
module.exports = router;