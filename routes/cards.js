var express = require('express');
var router = express.Router();

var config = require('../config/env');
var passport = require('passport');
var mongoose = require('mongoose');
var User = mongoose.model('User');
var Card = mongoose.model('Card');
var Shop = mongoose.model('Shop');
var Log = mongoose.model('Log');
var jwt = require('express-jwt');

var auth = jwt({secret: config.secret, userCard: 'payload'});

router.param('cardId', function(req, res, next, cardId) {
	var query = Card.findById(cardId).populate('owner');
	query.exec(function(err, card){
		if (err) {return next(err);}
		if (!card) {return next(new Error('cannot find cardInfo'));}
		
		req.card = card;
		return next();
	});
});

router.get('/', auth, function(req, res, next) {
	console.log(req.user);
	if (req.user.roles.indexOf("admin") == -1) {
		return res.status(401).json({message: 'Permission denied'})
	}
	Card.find({ deleted: false},function (err, cards) {
		if (err) {return next(err);}

		res.json(cards);
	});
});

router.get('/:cardId', function(req, res){
	
	res.json(req.card);
	
});

router.post('/', function (req, res, next) {
	if(!req.body.business || !req.body.user.username || !req.body.user.password){
    return res.status(400).json({message: 'Please fill out all fields'});
  }
  var user = new User();

  user.username = req.body.user.username;
  user.roles = ['user'];
  user.registType = 'local';
  user.setPassword(req.body.user.password);
  if (!req.body.user.birthday) { user.birthday = undefined;}
  else user.birthday = new Date(req.body.user.birthday);
  if (!req.body.user.sex) { user.sex = undefined;}
  else user.sex = new Date(req.body.user.sex);
  if (!req.body.user.name) { user.name = undefined;}
  else user.name = new Date(req.body.user.name);

  user.save(function (err, savedUser){
    if(err) {return next(err);}
    console.log(savedUser);
    Card.findOne({owner: savedUser._id, business: req.body.business}, function (err, foundCard) {
		if (err) {
			console.log(err);
			return res.status(500).json(err);
		}
		if (!foundCard) {
			console.log('create card')
			Shop.findById(req.body.business).exec(function (err, foundShop) {
				if (err) {
					console.log(err);
					return res.status(500).json(err);
				}
				var serialNumber = foundShop.serialNumber.toString();
				
				var card = new Card();
				var today = new Date();
				today.setHours(0,0,0,0);
			    var exp = new Date(today);
			    exp.setDate(today.getDate() + foundShop.initMemberExp);
			    card.exp = exp;
			    card.cardImage = foundShop.tierImages[0];
			    card.business = foundShop._id;
			    card.owner = savedUser._id;
			    card.tier = foundShop.tiers[0];
			    card.number = serialNumber;
			    card.save(function (err, savedCard) {
			    	if (err) {
						console.log(err);
						return res.status(500).json(err);
					}
					foundShop.members.push(savedCard);
					foundShop.serialNumber++;
					foundShop.save(function (err, savedShop) {
						// body...
					});
					var owner = {};
					owner._id = savedUser._id;
					owner.username = savedUser.username;
					var result = {};
					result._id = savedCard._id;
					result.number = savedCard.number;
					result.exp = savedCard.exp;
					result.cardImage = savedCard.cardImage;
					result.owner = owner;
					result.tier = savedCard.tier;
					result.valid = savedCard.valid;
					result.point = savedCard.point
					return res.json(result);
			    });
				
				
			});	
		
		} else {
			return res.status(400).json({message: 'User already have this membership.'});
		}
		
	});
  });
	
	
});

router.put('/:cardId', function (req, res, next) {
	if(!req.body.point) {
    	return res.status(400).json({message: 'Please fill out all fields'});
  	}

  	req.card.point = req.body.point;
  	req.card.valid = req.body.valid;
  	console.log(req.card);
	req.card.save(function (err, card) {
			// body...
			if (err) {
				console.log(err);
				return next(err);}
			return res.json(card);
	});	
		
	
});

router.put('/:cardId/gainPoint', function (req, res, next) {
	if(!req.body.gainPoint) {
    	return res.status(400).json({message: 'Please fill out all fields'});
  	}

  	req.card.point += req.body.gainPoint;
  	console.log(req.card);
	req.card.save(function (err, card) {
			// body...
			if (err) {
				console.log(err);
				return next(err);}
			var log = new Log();
			log.subject = card._id;
			log.subjectType = 'Card';
			log.action = "gainPoint";
			log.detail = req.body.gainPoint;
			log.save(function (err, log) {
				if (err) {
				console.log(err);
				}
			});
			return res.json(card);
	});	
		
	
});

router.put('/:cardId/validCard', function (req, res, next) {
	if(!req.body.valid) {
    	return res.status(400).json({message: 'Please fill out all fields'});
  	}

  	req.card.valid = req.body.valid;
  	console.log(req.card);
	req.card.save(function (err, card) {
			// body...
			if (err) {
				console.log(err);
				return next(err);}
			var log = new Log();
			log.subject = card._id;
			log.subjectType = 'Card';
			log.action = "validCard";
			log.detail = card.valid;
			log.save(function (err, log) {
				if (err) {
				console.log(err);
				}
			});
			return res.json(card);
	});	
		
	
});

router.put('/:cardId/tierUp', function (req, res, next) {
	if(!req.body) {
    	return res.status(400).json({message: 'Please fill out all fields'});
  	}

  	if (req.card.valid == false) {
  		return res.status(400).json({message: 'This card havenot valid yet'});
  	}
  	console.log(req.card);
  	Shop.findById(req.card.business).select('tiers tierImages').exec(function (err, foundShop) {
  		if (err) {
				console.log(err);
				return next(err);}
		if (!foundShop) {
			return res.status(400).json({message: 'The business of card is not exist.'});
		}
		var index = foundShop.tiers.indexOf(req.card.tier);
		console.log(""+index+","+foundShop.tiers.length);
		if (index == -1) {
			return res.status(400).json({message: 'Tier of card is not exist in business Tiers.'});
		} else if (index == foundShop.tiers.length-1) {
			return res.status(400).json({message: 'Tier of card is the highest Tier in business Tiers.'});
		} else {
			req.card.tier = foundShop.tiers[index+1];
			req.card.cardImage = foundShop.tierImages[index+1];
			req.card.save(function (err, card) {
			// body...
				if (err) {
					console.log(err);
					return next(err);}
				var log = new Log();
				log.subject = card._id;
				log.subjectType = 'Card';
				log.action = "tierUp";
				log.detail = card.tier;
				log.save(function (err, log) {
					if (err) {
					console.log(err);
					}
				});
				return res.json(card);
			});	
		}
		
  	});
});

router.put('/:cardId/tierDown', function (req, res, next) {
	if(!req.body) {
    	return res.status(400).json({message: 'Please fill out all fields'});
  	}

  	if (req.card.valid == false) {
  		return res.status(400).json({message: 'This card havenot valid yet'});
  	}
  	console.log(req.card);
  	Shop.findById(req.card.business).select('tiers tierImages').exec(function (err, foundShop) {
  		if (err) {
				console.log(err);
				return next(err);}
		if (!foundShop) {
			return res.status(400).json({message: 'The business of card is not exist.'});
		}
		var index = foundShop.tiers.indexOf(req.card.tier);
		console.log(""+index+","+foundShop.tiers.length);
		if (index == -1) {
			return res.status(400).json({message: 'Tier of card is not exist in business Tiers.'});
		} else if (index == 0) {
			return res.status(400).json({message: 'Tier of card is the lowest Tier in business Tiers.'});
		} else {
			req.card.tier = foundShop.tiers[index-1];
			req.card.cardImage = foundShop.tierImages[index-1];
			req.card.save(function (err, card) {
			// body...
				if (err) {
					console.log(err);
					return next(err);}
				var log = new Log();
				log.subject = card._id;
				log.subjectType = 'Card';
				log.action = "tierDown";
				log.detail = card.tier;
				log.save(function (err, log) {
					if (err) {
					console.log(err);
					}
				});
				return res.json(card);
			});	
		}
		
  	});
});

router.delete('/:cardId', function (req, res, next) {
	console.log('id: '+ req.card._id);
	req.card.deleted = true;
	req.card.save(function (err, card) {
		if (err) {return next(err);}
		res.json(card);
	});
});
module.exports = router;