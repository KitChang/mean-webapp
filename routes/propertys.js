var express = require('express');
var router = express.Router();

var config = require('../config/env');
var passport = require('passport');
var mongoose = require('mongoose');
var User = mongoose.model('User');
var Property = mongoose.model('Property');
var jwt = require('express-jwt');

var auth = jwt({secret: config.secret, userProperty: 'payload'});

router.param('propertyId', function(req, res, next, propertyId) {
	var query = Property.findById(propertyId);
	query.exec(function(err, property){
		if (err) {return next(err);}
		if (!property) {return next(new Error('cannot find propertyInfo'));}
		
		req.property = property;
		return next();
	});
});

router.get('/', function(req, res, next) {
	Property.find({ deleted: false},function (err, propertys) {
		if (err) {return next(err);}

		res.json(propertys);
	});
});

router.get('/:propertyId', function(req, res){
	
	res.json(req.property);
	
});

router.post('/', function (req, res, next) {
	if(!req.body.displayTitle || !req.body.layout || !req.body.area || 
		!req.body.region || !req.body.subRegion){
    return res.status(400).json({message: 'Please fill out all fields'});
  }
	var property = new Property(req.body);
	console.log(property);
	property.save(function (err, property) {
		if (err) {return next(err);}
			return res.json(property);
	});
	
});

router.put('/:propertyId', function (req, res, next) {
	if(!req.body.displayTitle || !req.body.layout || !req.body.area || 
		!req.body.region || !req.body.subRegion) {
    	return res.status(400).json({message: 'Please fill out all fields'});
  	}

  	req.property.displayTitle = req.body.displayTitle;
  	req.property.layout = req.body.layout;
  	req.property.area = req.body.area;
  	req.property.layer = req.body.layer;
  	req.property.region = req.body.region;
  	req.property.subRegion = req.body.subRegion;
  	req.property.buildYear = req.body.buildYear;
  	req.property.rent = req.body.rent;
  	req.property.manageFee = req.body.manageFee;
  	req.property.latitude = req.body.latitude;
  	req.property.longtitude = req.body.longtitude;
  	req.property.imageUrl = req.body.imageUrl;
  	console.log(req.property);
	req.property.save(function (err, property) {
			// body...
			if (err) {
				console.log(err);
				return next(err);}
			return res.json(property);
	});	
		
	
});

router.delete('/:propertyId', function (req, res, next) {
	console.log('id: '+ req.property._id);
	req.property.deleted = true;
	req.property.save(function (err, property) {
		if (err) {return next(err);}
		res.json(property);
	});
});
module.exports = router;