var express = require('express');
var router = express.Router();

var config = require('../config/env');
var passport = require('passport');
var mongoose = require('mongoose');
var User = mongoose.model('User');
var Shop = mongoose.model('Shop');
var jwt = require('express-jwt');

var auth = jwt({secret: config.secret, userShop: 'payload'});

router.param('shopId', function(req, res, next, shopId) {
	var query = Shop.findById(shopId);
	query.exec(function(err, shop){
		if (err) {return next(err);}
		if (!shop) {return next(new Error('cannot find shopInfo'));}
		
		req.shop = shop;
		return next();
	});
});

router.get('/', auth, function(req, res, next) {
	console.log(req.user);
	if (req.user.roles.indexOf("admin") == -1) {
		return res.status(401).json({message: 'Permission denied'})
	}
	Shop.find({ deleted: false},function (err, shops) {
		if (err) {return next(err);}

		res.json(shops);
	});
});

router.get('/:shopId', function(req, res){
	
	res.json(req.shop);
	
});

router.post('/', function (req, res, next) {
	if(!req.body.business || !req.body.type || !req.body.region || !req.body.serialNumber){
    return res.status(400).json({message: 'Please fill out all fields'});
  }
	var shop = new Shop(req.body);
	console.log(shop);
	shop.save(function (err, savedShop) {
		if (err) {return next(err);}
			return res.json(savedShop);
	});
	
});

router.put('/:shopId', function (req, res, next) {
	if(!req.body.business || !req.body.type || !req.body.region) {
    	return res.status(400).json({message: 'Please fill out all fields'});
  	}

  	req.shop.business = req.body.business;
  	req.shop.type = req.body.type;
  	req.shop.region = req.body.region;
  	if (!req.body.major) { req.shop.major = undefined;}
  	else req.shop.major = req.body.major;
  	if (!req.body.minor) { req.shop.minor = undefined;}
  	else req.shop.minor = req.body.minor;
  	console.log(req.shop);
	req.shop.save(function (err, shop) {
			// body...
			if (err) {
				console.log(err);
				return next(err);}
			return res.json(shop);
	});	
		
	
});

router.delete('/:shopId', function (req, res, next) {
	console.log('id: '+ req.shop._id);
	req.shop.deleted = true;
	req.shop.save(function (err, shop) {
		if (err) {return next(err);}
		res.json(shop);
	});
});
module.exports = router;