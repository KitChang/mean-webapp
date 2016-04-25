var express = require('express');
var router = express.Router();
var https = require('https');
var eventEmitter = require('events').EventEmitter;
var moment = require('moment');
var apn = require('apn');
var fs = require('fs');

var passport = require('passport');
var mongoose = require('mongoose');
var User = mongoose.model('User');
var Card = mongoose.model('Card');
var Shop = mongoose.model('Shop');
var Chat = mongoose.model('Chat');
var Event = mongoose.model('Event');
var Comment = mongoose.model('Comment');
var atob = require('atob');

router.post('/auth/local', function(req, res, next) {
	if (!req.body.username || !req.body.password) {
		return res.status(400).json({message: 'Please fill out all fields'});
	}
	console.log("loging"+req.body.username);
	User.findOne({username: req.body.username}, function(err, user) {
		console.log(user);
		if (err) {
			console.log(err);
			return res.status(500).json(err);
		}
		if (!user) {
			return res.status(400).json({ message: 'Incorrect username.' });
		}
		if (user.validPassword(req.body.password)) {
			var results = {};
			results.id = user._id;
			results.username = user.username;
			results.name = user.name;
			results.birthday = user.birthday;
			results.sex = user.sex;
			results.roles = user.roles;
			results.accessToken = user.generateJWT();
			results.fbId = user.fbId;
			results.fbName = user.fbName;
			results.wxId = user.wxId;
			results.wxName = user.wxName;
			results.eventLikes = user.eventLikes;
			return res.json(results)
		} else {
			return res.status(400).json({ message: 'Incorrect password.' });
		}
	});

});

router.post('/auth/facebook', function (req, res, next) {
	console.log(req.body.access_token);
	if (req.body.access_token) {
		var accessOptions = {
			host: 'graph.facebook.com',
			path: '/me?access_token='+req.body.access_token+'&fields=id,gender,name,picture,email'
		};

		accessCallback = function(response) {
			if (response.statusCode == 200) {
		    	var string = '';
			    response.on('data', function(chunk) {
			    	string += chunk;
			    });

			    response.on('end', function() {
			   		console.log(string);
			    	var facebookUser = JSON.parse(string);
			    	User.findOne({fbId:facebookUser.id}, function(err, foundUser) {
						if (err) {
							console.log(err);
							return res.status(500).json({message: 'UMac server error!'});
						}
						if (!foundUser) {
							
							return res.status(400).json({message: 'Incorrect Facebook ID.'});
						} else {
							var results = {};
							results.id = foundUser._id;
							results.username = foundUser.username;
							results.name = foundUser.name;
							results.birthday = foundUser.birthday;
							results.sex = foundUser.sex;
							results.roles = foundUser.roles;
							results.accessToken = foundUser.generateJWT();
							results.fbId = foundUser.fbId;
							results.fbName = foundUser.fbName;
							results.wxId = foundUser.wxId;
							results.wxName = foundUser.wxName;
							return res.json(results)
						}
					});
			    	
			  	});
		    } else {
		    	var string = '';
			   	response.on('data', function(chunk) {
			   		string += chunk;
			   	});

			   	response.on('end', function() {
			   		console.log(string);
			   		res.status(400).json({message:'Facebook binding failed.'});
			   	});
		    }

		};

		var accessReq = https.request(accessOptions, accessCallback);
		accessReq.end();
		accessReq.on('error', function(error) {
		    res.status(500).json({message:'UMac Server error.'});
		});
	} else {
		return res.status(400).json({ message: 'Bad parameters.' });
	}
});

router.post('/auth/weixin', function (req, res, next) {
	console.log(req.body.code);
	if (req.body.code) {
		var options = {
			  host: 'api.weixin.qq.com',
			  path: '/sns/oauth2/access_token?appid=wx4ad3ef52304fff4a&secret=0fece5e06ed43dc78eac44047268c8c4&code='+req.body.code+'&grant_type=authorization_code'
			};
			callback = function(response) {
			  var str = '';

			  //another chunk of data has been recieved, so append it to `str`
			  response.on('data', function (chunk) {
			    str += chunk;
			  });

			  //the whole response has been recieved, so we just print it out here
			  response.on('end', function () {
			    console.log(str);
			    var access = JSON.parse(str);
			    var accessOptions = {
			    	host: 'api.weixin.qq.com',
			    	path: '/sns/userinfo?access_token='+access.access_token+'&openid='+access.openid
			    };
			    accessCallback = function(response) {
			    	if (response.statusCode == 200) {
			    		var string = '';
				    	response.on('data', function(chunk) {
				    		string += chunk;
				    	});

				    	response.on('end', function() {
				    		console.log(string);
				    		var weixinUser = JSON.parse(string);
					    	User.findOne({wxId:weixinUser.openid}, function(err, foundUser) {
								if (err) {
									console.log(err);
									return res.status(500).json({message: 'server error!'});
								}
								if (!foundUser) {
									return res.status(400).json({message: 'Incorrect Weixin ID.'});
								} else {
									var results = {};
									results.id = foundUser._id;
									results.username = foundUser.username;
									results.name = foundUser.name;
									results.birthday = foundUser.birthday;
									results.sex = foundUser.sex;
									results.roles = foundUser.roles;
									results.accessToken = foundUser.generateJWT();
									results.fbId = foundUser.fbId;
									results.fbName = foundUser.fbName;
									results.wxId = foundUser.wxId;
									results.wxName = foundUser.wxName;
									return res.json(results)
								}
							});
				    	});
			    	} else {
			    		var string = '';
				    	response.on('data', function(chunk) {
				    		string += chunk;
				    	});

				    	response.on('end', function() {
				    		console.log(string);
				    		res.status(400).json({message:'Weixin binding failed.'});
				    	});
			    	}
			    	
			    }
			    var accessReq = https.request(accessOptions, accessCallback);
			    accessReq.end();
			    accessReq.on('error', function(error) {
			    	res.status(500).json({message:'UMac Server error.'});
			    });
			  });
			}

			var codeReq = https.request(options, callback);
			codeReq.end();
			codeReq.on('error', function(error) {
				res.status(500).json({message:'UMac Server error.'});
			});
			
	} else {
		return res.status(400).json({ message: 'Bad parameters.' });
	}
});

router.get('/auth/authenticated', function(req, res, next) {
	accessTokenValidation(req.query.accessToken, function (err, userOne) {
		if (err) {return next(err);}
		if (!userOne) {return res.status(401);}
		var results = {};
		results.id = user._id;
		results.username = userOne.username;
		results.name = userOne.name;
		results.birthday = userOne.birthday;
		results.sex = userOne.sex;
		results.roles = userOne.roles;
		return res.json(results);
	});

});

router.get('/auth/user', function (req, res, next) {
	var username = req.query.username;
	var code = Math.floor(Math.random()*(9999-1000+1)+1000).toString();

	User.findOne({username:username}, function(err, user) {
		if (err) {
			console.log(err);
			return res.status(500).json({message: 'server error!'});
		}
		if (!user) {
			return res.json({code: code});
		} else {
			return res.status(400).json({message: 'phone already exist!'});
		}
	});
});

router.post('/auth/register', function(req, res, next) {
	var phone = req.body.phone;
	var password = req.body.password;
	

	if(!phone || !password){
    	return res.status(400).json({message: 'Please fill out all fields'});
  	}

  	var user = new User();
  	user.username = phone;
  	user.setPassword(password);
  	user.registType = "local";
  	user.save(function(err) {
  		if (err) { 
  			console.log(err);
  			return res.status(500).json(err);
  		}
  		var results = {};
  		results.id = user._id;
  		results.username = user.username;
  		results.roles = user.roles;
  		results.accessToken = user.generateJWT();

  		return res.json(results);
  	});

});

router.post('/auth/register/facebook', function (req, res, next) {
	if (req.body.access_token) {
		var accessOptions = {
				host: 'graph.facebook.com',
				path: '/me?access_token='+req.body.access_token+'&fields=id,gender,name,picture,email'
			};

			accessCallback = function(response) {
				if (response.statusCode == 200) {
			    	var string = '';
				    response.on('data', function(chunk) {
				    	string += chunk;
				    });

				    response.on('end', function() {
				   		console.log(string);
				    	var facebookUser = JSON.parse(string);
				    	User.findOne({fbId:facebookUser.id}, function(err, foundUser) {
							if (err) {
								console.log(err);
								return res.status(500).json({message: 'server error!'});
							}
							if (!foundUser) {
								var user = new User();
								user.name = facebookUser.name;
								if (facebookUser.gender == "male") {
									user.sex = "1";
								} else if (facebookUser.gender == "female") {
									user.sex = "2";
								} else {
									user.sex = "0";
								}
								user.fbId = facebookUser.id;
								user.fbName = facebookUser.name;
								user.fbToken = req.body.access_token;
								user.registType = "facebook";
								user.save(function(err, savedUser) {
									if (err) {
										console.log(err);
										return res.status(500).json(err);
									}
									console.log(savedUser);
									var results = {};
							  		results.id = savedUser._id;
							  		results.username = savedUser.username;
							  		results.roles = savedUser.roles;
							  		results.accessToken = savedUser.generateJWT();
							  		results.name = savedUser.name;
							  		results.sex = savedUser.sex;
							  		results.fbId = savedUser.fbId;
							  		results.fbName = savedUser.fbName;

							  		return res.json(results);
								});
								
							} else {
								return res.status(400).json({message: 'Facebook ID already exist!'});
							}
						});
				    	
				  	});
			    } else {
			    	var string = '';
				   	response.on('data', function(chunk) {
				   		string += chunk;
				   	});

				   	response.on('end', function() {
				   		console.log(string);
				   		res.status(400).json({message:'Facebook binding failed.'});
				   	});
			    }

			};

			var accessReq = https.request(accessOptions, accessCallback);
			accessReq.end();
			accessReq.on('error', function(error) {
			    res.status(500).json({message:'UMac Server error.'});
			});
	} else {
		return res.status(400).json({ message: 'Bad parameters.' });
	}
});

router.post('/auth/register/weixin', function(req, res, next) {
	console.log(req.body.code);
	if (req.body.code) {
		var options = {
			  host: 'api.weixin.qq.com',
			  path: '/sns/oauth2/access_token?appid=wx4ad3ef52304fff4a&secret=0fece5e06ed43dc78eac44047268c8c4&code='+req.body.code+'&grant_type=authorization_code'
			};
			callback = function(response) {
			  var str = '';

			  //another chunk of data has been recieved, so append it to `str`
			  response.on('data', function (chunk) {
			    str += chunk;
			  });

			  //the whole response has been recieved, so we just print it out here
			  response.on('end', function () {
			    console.log(str);
			    var access = JSON.parse(str);
			    var accessOptions = {
			    	host: 'api.weixin.qq.com',
			    	path: '/sns/userinfo?access_token='+access.access_token+'&openid='+access.openid
			    };
			    accessCallback = function(response) {
			    	if (response.statusCode == 200) {
			    		var string = '';
				    	response.on('data', function(chunk) {
				    		string += chunk;
				    	});

				    	response.on('end', function() {
				    		console.log(string);
				    		var weixinUser = JSON.parse(string);
					    	User.findOne({wxId:weixinUser.openid}, function(err, foundUser) {
								if (err) {
									console.log(err);
									return res.status(500).json({message: 'server error!'});
								}
								if (!foundUser) {
									var user = new User();
									user.name = weixinUser.nickname;
									if (weixinUser.sex.toString() == "1") {
										user.sex = "1";
									} else if (weixinUser.sex.toString() == "2") {
										user.sex = "2";
									} else {
										user.sex = "0";
									}
									user.wxId = weixinUser.openid;
									user.wxName = weixinUser.nickname;
									user.wxToken = access.access_token;
									user.registType = "weixin";
									user.save(function(err, savedUser) {
										if (err) {
											console.log(err);
											return res.status(500).json(err);
										}
										console.log(savedUser);
										var results = {};
								  		results.id = savedUser._id;
								  		results.username = savedUser.username;
								  		results.roles = savedUser.roles;
								  		results.accessToken = savedUser.generateJWT();
								  		results.name = savedUser.name;
								  		results.sex = savedUser.sex;
								  		results.wxId = savedUser.wxId;
								  		results.wxName = savedUser.wxName;

								  		return res.json(results);
									});
								} else {
									
									return res.status(400).json({message: 'Weixin ID already exist!'});
								}
							});
				    	});
			    	} else {
			    		var string = '';
				    	response.on('data', function(chunk) {
				    		string += chunk;
				    	});

				    	response.on('end', function() {
				    		console.log(string);
				    		res.status(400).json({message:'Weixin binding failed.'});
				    	});
			    	}
			    	
			    }
			    var accessReq = https.request(accessOptions, accessCallback);
			    accessReq.end();
			    accessReq.on('error', function(error) {
			    	res.status(500).json({message:'UMac Server error.'});
			    });
			  });
			}

			var codeReq = https.request(options, callback);
			codeReq.end();
			codeReq.on('error', function(error) {
				res.status(500).json({message:'UMac Server error.'});
			});
			
	} else {
		return res.status(400).json({ message: 'Bad parameters.' });
	}
});

router.post('/auth/userinfo', function(req, res, next) {
	var name = req.body.name;
	var birthday = req.body.birthday;
	var sex = req.body.sex;
	var accessToken = req.body.accessToken;
	accessTokenValidation(accessToken, function (err, userOne) {
		if (err) {
			console.log(err);
			return res.status(500).json(err);
		}
		if (!userOne) {return res.status(401);}
		if (name != null) userOne.name = name;
		if (sex != null) userOne.sex = sex;
		if (birthday != null) userOne.birthday = new Date(birthday)
		console.log(userOne);
		userOne.save(function(err, savedUser) {
			if (err) {
				console.log(err);
				return res.status(500).json(err);
			}
			return res.json({name: savedUser.name, sex: savedUser.sex, birthday: savedUser.birthday});
		});
	});

});

router.post('/auth/rebind/username', function (req, res, next) {
	if (req.body.username && req.body.accessToken) {
		var accessToken = req.body.accessToken;
		accessTokenValidation(accessToken, function (err, userOne) {
			if (err) {
				console.log(err);
				return res.status(500).json(err);
			}
			if (!userOne) {return res.status(401);}
			User.findOne({username:req.body.username}, function(err, user) {
				if (err) {
					console.log(err);
					return res.status(500).json({message: 'server error!'});
				}
				if (!user) {
					userOne.username = req.body.username;
					userOne.save(function (err, savedUser) {
						if (err) {
							console.log(err);
							return res.status(500).json({message:'UMac Server error.'});
						}
						console.log(savedUser);
						return res.json({username:savedUser.username});
					});
				} else {
					return res.status(400).json({message: 'phone already exist!'});
				}
			});
		});
	} else {
		res.status(400).json({message: 'Bad parameters.'});
	}
});

router.post('/auth/binding/facebook', function (req, res, next) {
	console.log(req.body.access_token);
	if (req.body.access_token && req.body.accessToken) {
		var accessToken = req.body.accessToken;
		accessTokenValidation(accessToken, function (err, userOne) {
			if (err) {
				console.log(err);
				return res.status(500).json(err);
			}
			if (!userOne) {return res.status(401);}
			var accessOptions = {
				host: 'graph.facebook.com',
				path: '/me?access_token='+req.body.access_token+'&fields=id,gender,name,picture,email'
			};

			accessCallback = function(response) {
				if (response.statusCode == 200) {
			    	var string = '';
				    response.on('data', function(chunk) {
				    	string += chunk;
				    });

				    response.on('end', function() {
				   		console.log(string);
				    	var facebookUser = JSON.parse(string);
				    	User.findOne({fbId:facebookUser.id}, function(err, foundUser) {
							if (err) {
								console.log(err);
								return res.status(500).json({message: 'server error!'});
							}
							if (!foundUser) {
								userOne.fbId = facebookUser.id;
								userOne.fbName = facebookUser.name;
								userOne.fbToken = req.body.access_token;
								userOne.save(function(err, savedUser) {
									if (err) {
										console.log(err);
										return res.status(500).json({message:'UMac Server error.'});
									}
									console.log(savedUser);
									res.json({fbName:savedUser.fbName, fbId:savedUser.fbId});
								})
								
							} else {
								return res.status(400).json({message: 'Facebook ID already exist!'});
							}
						});
				    	
				  	});
			    } else {
			    	var string = '';
				   	response.on('data', function(chunk) {
				   		string += chunk;
				   	});

				   	response.on('end', function() {
				   		console.log(string);
				   		res.status(400).json({message:'Facebook binding failed.'});
				   	});
			    }

			};

			var accessReq = https.request(accessOptions, accessCallback);
			accessReq.end();
			accessReq.on('error', function(error) {
			    res.status(500).json({message:'UMac Server error.'});
			});
		});	
		

	} else {
		res.status(400).json({message: 'Bad parameters.'});
	}
});

router.post('/auth/unbind/facebook', function(req, res, next) {
	console.log(req.body.access_token);
	if (req.body.access_token && req.body.accessToken) {
		var accessToken = req.body.accessToken;
		accessTokenValidation(accessToken, function (err, userOne) {
			if (err) {
				console.log(err);
				return res.status(500).json(err);
			}
			if (!userOne) {return res.status(401);}
			if (userOne.registType == "facebook") {
				return res.status(400).json({message: 'Regist type cannot be facebook'});
			}
			var accessOptions = {
				host: 'graph.facebook.com',
				path: '/me?access_token='+req.body.access_token+'&fields=id,gender,name,picture,email'
			};

			accessCallback = function(response) {
				if (response.statusCode == 200) {
			    	var string = '';
				    response.on('data', function(chunk) {
				    	string += chunk;
				    });

				    response.on('end', function() {
				   		console.log(string);
				    	var facebookUser = JSON.parse(string);
				    	if (facebookUser.id == userOne.fbId) {
				    		userOne.fbId = undefined;
				    		userOne.fbName = undefined;
				    		userOne.fbToken = undefined;

				    		userOne.save(function (err, savedUser) {
				    			if (err) {
									console.log(err);
									return res.status(500).json({message:'UMac Server error.'});
								}
								console.log(savedUser);
								res.json({message: 'Facebook undbind success'});
				    		});
				    	} else {
				    		return res.status(400).json({message: 'Incorrect Facebook ID.'});
				    	}
				    	
				  	});
			    } else {
			    	var string = '';
				   	response.on('data', function(chunk) {
				   		string += chunk;
				   	});

				   	response.on('end', function() {
				   		console.log(string);
				   		res.status(400).json({message:'Facebook binding failed.'});
				   	});
			    }

			};

			var accessReq = https.request(accessOptions, accessCallback);
			accessReq.end();
			accessReq.on('error', function(error) {
			    res.status(500).json({message:'UMac Server error.'});
			});
		});	
		

	} else {
		res.status(400).json({message: 'Bad parameters.'});
	}
});

router.post('/auth/binding/weixin', function(req, res, next) {
	console.log(req.body.code);
	if (req.body.code && req.body.accessToken) {
		var accessToken = req.body.accessToken;
		accessTokenValidation(accessToken, function (err, userOne) {
			if (err) {
				console.log(err);
				return res.status(500).json(err);
			}
			if (!userOne) {return res.status(401);}
			var options = {
			  host: 'api.weixin.qq.com',
			  path: '/sns/oauth2/access_token?appid=wx4ad3ef52304fff4a&secret=0fece5e06ed43dc78eac44047268c8c4&code='+req.body.code+'&grant_type=authorization_code'
			};
			callback = function(response) {
			  var str = '';

			  //another chunk of data has been recieved, so append it to `str`
			  response.on('data', function (chunk) {
			    str += chunk;
			  });

			  //the whole response has been recieved, so we just print it out here
			  response.on('end', function () {
			    console.log(str);
			    var access = JSON.parse(str);
			    var accessOptions = {
			    	host: 'api.weixin.qq.com',
			    	path: '/sns/userinfo?access_token='+access.access_token+'&openid='+access.openid
			    };
			    accessCallback = function(response) {
			    	if (response.statusCode == 200) {
			    		var string = '';
				    	response.on('data', function(chunk) {
				    		string += chunk;
				    	});

				    	response.on('end', function() {
				    		console.log(string);
				    		var weixinUser = JSON.parse(string);
					    	User.findOne({wxId:weixinUser.openid}, function(err, foundUser) {
								if (err) {
									console.log(err);
									return res.status(500).json({message: 'server error!'});
								}
								if (!foundUser) {
									userOne.wxId = weixinUser.openid;
									userOne.wxName = weixinUser.nickname;
									userOne.wxToken = access.access_token;

									userOne.save(function(err, savedUser) {
										if (err) {
											console.log(err);
											return res.status(500).json(err);
										}
										console.log(savedUser);
										res.json({wxName:savedUser.wxName, wxId:savedUser.wxId});
									})
									
								} else {
									return res.status(400).json({message: 'Weixin ID already exist!'});
								}
							});
				    	});
			    	} else {
			    		var string = '';
				    	response.on('data', function(chunk) {
				    		string += chunk;
				    	});

				    	response.on('end', function() {
				    		console.log(string);
				    		res.status(400).json({message:'Weixin binding failed.'});
				    	});
			    	}
			    	
			    }
			    var accessReq = https.request(accessOptions, accessCallback);
			    accessReq.end();
			    accessReq.on('error', function(error) {
			    	res.status(500);
					res.end();
			    });
			  });
			}

			https.request(options, callback).end();
			});
		
	} else {
		res.status(400);
		res.json({message: "Bad parameters"});
	}
	
});

router.post('/auth/unbind/weixin', function (req, res, next) {
	console.log(req.body.code);
	if (req.body.code && req.body.accessToken) {
		var accessToken = req.body.accessToken;
		accessTokenValidation(accessToken, function (err, userOne) {
			if (err) {
				console.log(err);
				return res.status(500).json(err);
			}
			if (!userOne) {return res.status(401);}
			if (userOne.registType == "weixin") {
				return res.status(400).json({message: 'Regist type cannot be weixin'});
			}
			var options = {
			  host: 'api.weixin.qq.com',
			  path: '/sns/oauth2/access_token?appid=wx4ad3ef52304fff4a&secret=0fece5e06ed43dc78eac44047268c8c4&code='+req.body.code+'&grant_type=authorization_code'
			};
			callback = function(response) {
			  var str = '';

			  //another chunk of data has been recieved, so append it to `str`
			  response.on('data', function (chunk) {
			    str += chunk;
			  });

			  //the whole response has been recieved, so we just print it out here
			  response.on('end', function () {
			    console.log(str);
			    var access = JSON.parse(str);
			    var accessOptions = {
			    	host: 'api.weixin.qq.com',
			    	path: '/sns/userinfo?access_token='+access.access_token+'&openid='+access.openid
			    };
			    accessCallback = function(response) {
			    	if (response.statusCode == 200) {
			    		var string = '';
				    	response.on('data', function(chunk) {
				    		string += chunk;
				    	});

				    	response.on('end', function() {
				    		console.log(string);
				    		var weixinUser = JSON.parse(string);

					    	if (weixinUser.openid == userOne.wxId) {
					    		userOne.wxId = undefined;
					    		userOne.wxName = undefined;
					    		userOne.wxToken = undefined;

					    		userOne.save(function (err, savedUser) {
					    			if (err) {
										console.log(err);
										return res.status(500).json({message:'UMac Server error.'});
									}
									console.log(savedUser);
									res.json({message: 'Weixin undbind success'});
					    		});
					    	} else {
					    		return res.status(400).json({message: 'Incorrect Weixin ID.'});
					    	}
				    	});
			    	} else {
			    		var string = '';
				    	response.on('data', function(chunk) {
				    		string += chunk;
				    	});

				    	response.on('end', function() {
				    		console.log(string);
				    		res.status(400).json({message:'Weixin binding failed.'});
				    	});
			    	}
			    	
			    }
			    var accessReq = https.request(accessOptions, accessCallback);
			    accessReq.end();
			    accessReq.on('error', function(error) {
			    	res.status(500);
					res.end();
			    });
			  });
			}

			https.request(options, callback).end();
			});
		
	} else {
		res.status(400);
		res.json({message: "Bad parameters"});
	}
});

router.post('/cards', function (req, res, next) {
	if (req.body.accessToken) {
		var accessToken = req.body.accessToken;
		accessTokenValidation(accessToken, function (err, userOne) {
			if (err) {
				console.log(err);
				return res.status(500).json(err);
			}
			if (!userOne) {return res.status(401);}
			Card.find({owner: userOne._id}, '_id exp cardImage business owner tier number valid usage').populate('business', '_id business').exec(function (err, cards) {
				return res.json(cards);
			});
		});
	} else {
		res.status(400);
		res.json({message: "Bad parameters"});
	}
});

router.post('/cards/apply', function (req, res, next) {
	if (req.body.accessToken && req.body.shopId) {
		var accessToken = req.body.accessToken;
		accessTokenValidation(accessToken, function (err, userOne) {
			if (err) {
				console.log(err);
				return res.status(500).json(err);
			}
			if (!userOne) {return res.status(401);}
			Card.findOne({owner: userOne._id, business: req.body.shopId}, function (err, foundCard) {
				if (err) {
					console.log(err);
					return res.status(500).json(err);
				}
				if (!foundCard) {
					console.log('create card')
					Shop.findById(req.body.shopId).exec(function (err, foundShop) {
						if (err) {
							console.log(err);
							return res.status(500).json(err);
						}
						var serialNumber = foundShop.serialNumber.toString();
						foundShop.serialNumber++;
						foundShop.save(function (err, savedShop) {
							if (err) {
								console.log(err);
								return res.status(500).json(err);
							}
							var card = new Card();
							var today = new Date();
							today.setHours(0,0,0,0);
						    var exp = new Date(today);
						    exp.setDate(today.getDate() + savedShop.initMemberExp);
						    card.exp = exp;
						    card.cardImage = savedShop.tierImages[0];
						    card.business = savedShop._id;
						    card.owner = userOne._id;
						    card.tier = savedShop.tiers[0];
						    card.number = serialNumber;
						    card.save(function (err, savedCard) {
						    	if (err) {
									console.log(err);
									return res.status(500).json(err);
								}
								foundShop.members.push(savedCard);
								foundShop.save(function (err, savedShop) {
									// body...
								});
								var business = {};
								business.id = savedShop._id;
								business.business = savedShop.business;
								var result = {};
								result.number = savedCard.number;
								result.exp = savedCard.exp;
								result.cardImage = savedCard.cardImage;
								result.business = business;
								result.owner = savedCard.owner;
								result.tier = savedCard.tier;
								result.valid = savedCard.valid;
								return res.json(result);
						    });
						});
						
					});	
				
				} else {
					return res.status(400).json({message: 'User already have this membership.'});
				}
				
			});
		});
	} else {
		res.status(400);
		res.json({message: "Bad parameters"});
	}
});

router.post('/cards/bluetooth', function (req, res, next) {
	if (req.body.accessToken && req.body.beacons) {
		var accessToken = req.body.accessToken;
		accessTokenValidation(accessToken, function (err, userOne) {
			if (err) {
				console.log(err);
				return res.status(500).json(err);
			}
			if (!userOne) {return res.status(401);}
			var beacons = req.body.beacons.split(",").map(function (beacon) {
				return beacon;
			});
			console.log(beacons);
			var count = beacons.length;
			if (count == 0) {
				return res.json({cards:[]});
			}
			var cards = {};
			beacons.forEach(function (beacon) {
				var array = beacon.split("|");
				var findEmitter = new eventEmitter();
				if (array.length == 2) {
					Shop.findOne({major: array[0], minor: array[1]}, function (err, foundShop) {
						if (err) {
					 		console.log(err);
					 		result = undefined;
					 		console.log('no found');
					 		findEmitter.emit('done', beacon,result);
					 	}
					 	else if (!foundShop) {
					 		result = undefined;
					 		console.log('no found');
					 		findEmitter.emit('done', beacon,result);
					 	} else {
					 		Card.findOne({owner:userOne._id, business: foundShop._id},'_id exp cardImage business owner tier number valid usage')
					 			.populate('business', '_id business').exec(function (err, foundCard) {
					 			if (err) {
							 		console.log(err);
							 		result = undefined;
							 		console.log('no found');
							 		findEmitter.emit('done', beacon,result);
							 	} else if (!foundCard) {
							 		result = undefined;
							 		console.log('no found');
							 		findEmitter.emit('done', beacon,result);
							 	} else {
							 		console.log('found:'+foundCard);
						 			findEmitter.emit('done', beacon,foundCard);
							 	}

						 		
					 		});
					 		
					 	}
					 	
					});
				} else {
					count--;
				}
				findEmitter.on('done', function(beacon, result){
					count--;
					cards[beacon] = result;
					console.log('done:'+result);
					if (count == 0) {
						console.log('finish');
						var mapCards = beacons.map(function (mapBeacon) {
								return cards[mapBeacon];
							});
						return res.json({cards:mapCards.filter(function (e) {
							return e != undefined;
						})});
					}
				});
			});
		});
	} else {
		res.status(400);
		res.json({message: "Bad parameters"});
	}
});

router.post('/cards/qrCode', function (req, res, next) {
	if (req.body.accessToken && req.body.qrString) {
		var accessToken = req.body.accessToken;
		accessTokenValidation(accessToken, function (err, userOne) {
			if (err) {
				console.log(err);
				return res.status(500).json(err);
			}
			if (!userOne) {return res.status(401);}
			Shop.findOne({qrCode:req.body.qrString}, '_id business', function (err, foundShop) {
				if (err) {
					console.log(err);
					return res.status(500).json(err);
				}
				if (!foundShop) {
					return res.status(400).json({message: 'Incorrect QR Code.'});
				}
				Card.findOne({owner:userOne._id, business: foundShop._id},'_id exp cardImage business owner tier number valid usage')
					.populate('business', '_id business').exec(function (err, foundCard) {
		 			if (err) {
				 		console.log(err);
				 		return res.status(500).json(err);
				 	} else if (!foundCard) {
				 		return res.status(400).json({message: 'You have no membership yet.'});
				 	} else {
				 		console.log('found:'+foundCard);
			 			return res.json({card:foundCard});
				 	}

			 		
		 		});
			});
		});
	} else {
		res.status(400);
		res.json({message: "Bad parameters"});
	}
});

router.post('/cards/point/gain', function (req, res, next) {
	if (req.body.accessToken && req.body.cardId && req.body.point) {
		var accessToken = req.body.accessToken;
		accessTokenValidation(accessToken, function (err, userOne) {
			if (err) {
				console.log(err);
				return res.status(500).json(err);
			}
			if (!userOne) {return res.status(401);}
			Card.findById(req.body.cardId).exec(function (err, foundCard) {
				if (err) {
					console.log(err);
					return res.status(500).json(err);
				} else if (!foundCard) {
					return res.status(400).json({message: 'You have no membership yet.'});
				} else if (foundCard.business.toString() != userOne.business.toString()) {
					return res.status(400).json({message: 'You are not business of this card.'});
				} else {
					foundCard.point += parseInt(req.body.point, 10);
					foundCard.save(function (err, savedCard) {
						if (err) {
							console.log(err);
							return res.status(500).json(err);
						} else {
							return res.json({message: 'Gain point success.', gainPoint: req.body.point, totalPoint: savedCard.point.toString()});
						}

					});
				}

			});

		});
	} else {
		res.status(400);
		res.json({message: "Bad parameters"});
	}
});

router.post('/cards/point/redeem', function (req, res, next) {
	if (req.body.accessToken && req.body.cardId && req.body.point) {
		var accessToken = req.body.accessToken;
		accessTokenValidation(accessToken, function (err, userOne) {
			if (err) {
				console.log(err);
				return res.status(500).json(err);
			}
			if (!userOne) {return res.status(401);}
			Card.findById(req.body.cardId).exec(function (err, foundCard) {
				if (err) {
					console.log(err);
					return res.status(500).json(err);
				} else if (!foundCard) {
					return res.status(400).json({message: 'You have no membership yet.'});
				} else if (foundCard.owner.toString() != userOne._id) {
					return res.status(400).json({message: 'You are no owner of this card.'});
				} else {
					if (foundCard.point < parseInt(req.body.point, 10)) {
						return res.status(400).json({message: 'Card do not have enough points.'});
					} else {
						foundCard.point -= parseInt(req.body.point, 10);
						foundCard.save(function (err, savedCard) {
							if (err) {
								console.log(err);
								return res.status(500).json(err);
							} else {
								return res.json({message: 'Gain point success.', redeemPoint: req.body.point, totalPoint: savedCard.point.toString()});
							}

						});
					}
					
				}

			});

		});
	} else {
		res.status(400);
		res.json({message: "Bad parameters"});
	}
});

router.post('/events', function (req, res, next) {
	if (req.body.accessToken) {
		var accessToken = req.body.accessToken;
		accessTokenValidation(accessToken, function (err, userOne) {
			if (err) {
				console.log(err);
				return res.status(500).json(err);
			}
			if (!userOne) {return res.status(401);}
			Card.find({owner: userOne._id}, '_id business').exec(function (err, cards) {
				if (err) {
					console.log(err);
					return res.status(500).json(err);
				}
				var businesses = cards.map(function (card) {
					return card.business;
				});
				var options = {business: {$in: businesses}, 
								published: true, 
								publishDate:{"$lt": new Date()}, 
								invalidate:{"$gte": new Date()},
								deleted: false}
				if (req.body.skipDate) {
					var skipDate = new Date(req.body.skipDate);
					if (skipDate) {
						options.publishDate = {"$lt": skipDate}
					}
				}
				var limit = 0;
				if (!isNaN(req.body.limit)) {
					limit = parseInt(req.body.limit)
				}
				
				Event.find(options)
					 		.populate('business', '_id business')
					 		.populate({path: 'comments', select: '_id sender message created', match: {deleted: false}, options: {limit: 5, sort: {created: -1}}, 
					 			populate: {path: 'sender', select: '_id profileImageURL username name'}})
					.sort({'publishDate': -1})
					.limit(limit)
			 		.exec(function (err, events) {
			 			if (err) {
							console.log(err);
							return res.status(500).json(err);
						}
						return res.json(events);
					});
			});
		});
	} else {
		res.status(400);
		res.json({message: "Bad parameters"});
	}
});

router.post('/events/comments', function (req, res, next) {
	if (req.body.accessToken && req.body.event) {
		var accessToken = req.body.accessToken;
		accessTokenValidation(accessToken, function (err, userOne) {
			if (err) {
				console.log(err);
				return res.status(500).json(err);
			}
			if (!userOne) {return res.status(401);}
			Event.findById(req.body.event).populate({path:'comments', match: { deleted: false}, select:'_id message sender created'})
				.exec(function (err, event) {
				if (err) {
					console.log(err);
					return res.status(500).json(err);
				}
				if (!event) { return res.status(404).json({message: 'Event not found.'});}
				
				var options = {};
				options.deleted = false;
				if (req.body.skipDate) {
					var skipDate = new Date(req.body.skipDate);
					if (skipDate) {
						options.created = {"$lt": skipDate};
					}
				}
				Event.populate(event, {path: 'comments', match: options, select: '_id sender message created', options: {limit: 5, sort: {created: -1}}, 
				 			populate: {path: 'sender', select: '_id profileImageURL username name'}}, function (err, event) {
					if (err) {return res.status(500).json(err);}
					return res.json(event.comments);
				});
				
			})
		});
	} else {
		res.status(400);
		res.json({message: "Bad parameters"});
	}
});

router.post('/events/comments/post', function (req, res, next) {
	if (req.body.accessToken && req.body.event && req.body.comment) {
		var accessToken = req.body.accessToken;
		accessTokenValidation(accessToken, function (err, userOne) {
			if (err) {
				console.log(err);
				return res.status(500).json(err);
			}
			if (!userOne) {return res.status(401);}
			Event.findById(req.body.event).populate({path:'comments', match: { deleted: false}, select:'_id message sender created'})
				.exec(function (err, foundEvent) {
				if (err) {
					console.log(err);
					return res.status(500).json(err);
				}
				if (!foundEvent) {return res.status(404).json({message: 'Event not found.'});}
				var comment = new Comment({sender: userOne, 
										message:req.body.comment, 
										event: req.body.event});
				comment.save(function (err, savedComment) {
					if (err) {
						console.log(err);
						return res.status(500).json(err);
					}
					foundEvent.comments.push(savedComment);
					foundEvent.save(function (err, savedEvent) {
						if (err) {
							console.log(err);
							return res.status(500).json(err);
						}
						var comment = {};
						var sender = {};
						sender._id = savedComment.sender._id;
						sender.name = savedComment.sender.name;
						sender.profileImageURL = savedComment.sender.profileImageURL;
						sender.username = savedComment.sender.username;
						comment._id = savedComment._id;
						comment.created = savedComment.created;
						comment.message = savedComment.message;
						comment.sender = sender;
						return res.json(comment);
					});
				});
			});
			
		});
	} else {
		res.status(400);
		res.json({message: "Bad parameters"});
	}
});

router.post('/events/like', function (req, res, next) {
	if (req.body.accessToken && req.body.event) {
		var accessToken = req.body.accessToken;
		accessTokenValidation(accessToken, function (err, userOne) {
			if (err) {
				console.log(err);
				return res.status(500).json(err);
			}
			if (!userOne) {return res.status(401);}
			Event.findById(req.body.event).populate({path:'comments', match: { deleted: false}, select:'_id message sender created'})
				.exec(function (err, foundEvent) {
				if (err) {
					console.log(err);
					return res.status(500).json(err);
				}
				if (!foundEvent) {return res.status(404).json({message: 'Event not found.'});}
				console.log(userOne._id.toString());
				if (foundEvent.likes.some(function (userId) {
					console.log(userId.toString());
					return userOne._id.toString() == userId.toString();
				})) {
					return res.status(204).end();
				} else {
					console.log(foundEvent.likes);
					foundEvent.likes.push(userOne._id);
					foundEvent.save(function (err, savedEvent) {
						if (err) {
							console.log(err);
							return res.status(500).json(err);
						}
						userOne.eventLikes.push(savedEvent._id);
						userOne.save(function (err, savedUser) {
							if (err) {
								console.log(err);
								return res.status(500).json(err);
							}
							return res.status(201).end();
						});
					});
				}
			});
		});
	}
});

router.post('/shops/bluetooth', function (req, res, next) {
	if (req.body.accessToken && req.body.beacons) {
		var accessToken = req.body.accessToken;
		accessTokenValidation(accessToken, function (err, userOne) {
			if (err) {
				console.log(err);
				return res.status(500).json(err);
			}
			if (!userOne) {return res.status(401);}

			var beacons = req.body.beacons.split(",").map(function (beacon) {
				return beacon;
			});
			console.log(beacons);
			var count = beacons.length;
			if (count == 0) {
				return res.json({shops:[]});
			}
			// var shops = beacons.map(function (beacon) {
			// 	var array = beacon.split("|").map(function (data) {
			// 		return data;
			// 	});
			// 	const findEmitter = new EventEmitter();

			// 	if (array.length == 2) {
			// 		Shop.findOne({major: array[0], minor: array[1]}, function (err, foundShop) {
			// 			if (err) {
			// 		 		console.log(err);
			// 		 	}
			// 		 	if (!foundShop) {
			// 		 		result = undefined;
			// 		 		myEmitter.emit('done',result);
			// 		 	} else {
			// 		 		var result = {id: foundShop._id, business: foundShop.business};
			// 			 	console.log('found:'+result);
			// 			 	myEmitter.emit('done',result);
			// 		 	}
					 	
			// 		});
			// 	}
			// 	findEmitter.on('done', function(result){
			// 		--count;
			// 		console.log('done:'+result);
			// 		return result;
			// 	});
				
			// });
			var shops = {};
			beacons.forEach(function (beacon) {
				var array = beacon.split("|");
				var findEmitter = new eventEmitter();
				if (array.length == 2) {
					Shop.findOne({major: array[0], minor: array[1]}, function (err, foundShop) {
						if (err) {
					 		console.log(err);
					 		result = undefined;
					 		console.log('no found');
					 		findEmitter.emit('done', beacon,result);
					 	} else if (!foundShop) {
					 		result = undefined;
					 		console.log('no found');
					 		findEmitter.emit('done', beacon,result);
					 	} else {
					 		var result = {_id: foundShop._id, business: foundShop.business};
						 	console.log('found:'+result);
						 	findEmitter.emit('done', beacon,result);
					 	}
					 	
					});
				} else {
					count--;
				}
				findEmitter.on('done', function(beacon, result){
					count--;
					shops[beacon] = result;
					console.log('done:'+result);
					if (count == 0) {
						console.log('finish');
						var mapShops = beacons.map(function (mapBeacon) {
								return shops[mapBeacon];
							});
						return res.json({shops:mapShops.filter(function (e) {
							return e != undefined;
						})});
					}
				});
			});

			
		});



		// Shop.findOne({major:req.query.major, minor:req.query.minor}, function (err, foundShop) {
		// 	if (err) {
		// 		console.log(err);
		// 		return res.status(500).json(err.toJSON());
		// 	}
		// 	if (!foundShop) {
		// 		return res.status(400).json({message: 'Found no shop matched.'});
		// 	}
		// 	return res.json({id: foundShop._id, business: foundShop.business});
		// });
		
	} else {
		res.status(400);
		res.json({message: "Bad parameters"});
	}
});

router.post('/shops/qrCode', function (req, res, next) {
	if (req.body.accessToken && req.body.qrString) {
		var accessToken = req.body.accessToken;
		accessTokenValidation(accessToken, function (err, userOne) {
			if (err) {
				console.log(err);
				return res.status(500).json(err);
			}
			if (!userOne) {return res.status(401);}
			Shop.findOne({qrCode:req.body.qrString}, '_id business', function (err, foundShop) {
				if (err) {
					console.log(err);
					return res.status(500).json(err);
				}
				if (!foundShop) {
					return res.status(400).json({message: 'Incorrect QR Code.'});
				}

				return res.json({shop:foundShop});
			});
		});
	} else {
		res.status(400);
		res.json({message: "Bad parameters"});
	}
});

router.post('/chatrooms', function (req, res, next) {
	longPolling(req, res, next, new Date());
});

router.post('/newChat', function (req, res, next) {
	
	var chat = new Chat(req.body);
	chat.save(function (err, saveChat) {
		return res.end();
	});
});

router.post('/push', function (req, res, next) {
	var options = {
		'cert': __dirname + '/UMac.pem',
		'key': __dirname + '/UMacKey.pem',
		'production': false
	};
	var apnConnection = new apn.Connection(options);
	var myDevice = new apn.Device("8d051de40937de7ef020a4f9c4b95502207df96b5fad5fea1395041ccd1f3737"); // ""裡面放欲推撥裝置的token
	var note = new apn.Notification();
	note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
	note.badge = 3;
	note.sound = "ping.aiff";
	note.alert = "\uD83D\uDCE7 \u2709 You have a new message";
	note.payload = {'messageFrom': 'Caroline'};

	apnConnection.pushNotification(note, myDevice);
	apnConnection.on('completed', function () {
		console.log('completed');
		res.status(200).end();
	});
	apnConnection.on('error', function (error) {
		console.log('error');
		console.log(error);
	});
	apnConnection.on('socketError', function (error) {
		console.log('socketError');
		console.log(error);
	});
	apnConnection.on('transmitted', function (notification, device) {
		console.log('transmitted');
		console.log(notification);
		console.log(device);
	});
	apnConnection.on('connected', function (openSockets) {
		console.log('connected');
		console.log(openSockets);
	});
	apnConnection.on('disconnected', function (openSockets) {
		console.log('disconnected');
		console.log(openSockets);
	});
	apnConnection.on('timeout', function () {
		console.log('timeout');
	});
	apnConnection.on('transmissionError', function (errorCode, notification, device) {
		console.log('transmissionError');
		console.log(errorCode);
		console.log(notification);
		console.log(device);
	});

	var options = {
		'cert': __dirname + '/UMac.pem',
		'key': __dirname + '/UMacKey.pem',
		'production': false,
	    "batchFeedback": true,
	    "interval": 300
	};

	var feedback = new apn.Feedback(options);
	feedback.on("feedback", function(devices) {
	    devices.forEach(function(item) {
	        // Do something with item.device and item.time;
	        console.log(item);
	    });
	});
	
});

router.get('/wxapi', function(req, res, next) {
	console.log(req.query.code);
	if (req.query.code) {
		var options = {
		  host: 'api.weixin.qq.com',
		  path: '/sns/oauth2/access_token?appid=wxab261de543656952&secret=389f230302fe9c047ec56c39889b8843&code='+req.query.code+'&grant_type=authorization_code'
		};
		callback = function(response) {
		  var str = '';

		  //another chunk of data has been recieved, so append it to `str`
		  response.on('data', function (chunk) {
		    str += chunk;
		  });

		  //the whole response has been recieved, so we just print it out here
		  response.on('end', function () {
		    console.log(str);
		    var access = JSON.parse(str);
		    var accessOptions = {
		    	host: 'api.weixin.qq.com',
		    	path: '/sns/userinfo?access_token='+access.access_token+'&openid='+access.openid
		    };
		    accessCallback = function(response) {
		    	var string = '';
		    	response.on('data', function(chunk) {
		    		string += chunk;
		    	});

		    	response.on('end', function() {
		    		console.log(string);
		    		
		    	});
		    }
		    https.request(accessOptions, accessCallback).end();
		  });
		}

		https.request(options, callback).end();
	}
	res.status(200);
	res.end();
});

function accessTokenValidation(accessToken, cb) {
	var user = JSON.parse(atob(accessToken.split('.')[1]));
	var query = User.findById(user._id);
	query.exec(function(err, userOne){
		if (err) {
			console.log(err);
			cb(err, null);
		}
		if (!userOne) {cb(null,null);}

		cb(null,userOne);
	});
};

function userToBusinesses(accessToken, cb) {
	if (accessToken) {
		accessTokenValidation(accessToken, function (err, userOne) {
			if (err) {
				console.log(err);
				cb(err, null);
			}
			if (!userOne) {cb(null,null);}
			Card.find({owner: userOne._id}, '_id business').exec(function (err, cards) {
				if (err) {
					console.log(err);
					cb(err, null);
				}
				var businesses = cards.map(function (card) {
					return card.business;
				});
				cb(null, businesses);
			});
		});
	}

}

function longPolling(req, res, next, startTime) {
	var date = new Date();
	console.log(startTime);
	if (date-startTime > 59999) {
		console.log('end');
		res.status(204);
		return res.end();
		
	} 
		console.log(new Date(req.body.start));
		Chat.find({"created": {"$gte": new Date(req.body.start)}}).exec(function (err, chats) {
			if (chats.length == 0) {setTimeout(function() { longPolling(req, res, next, startTime) }, 10000);}
			else res.json(chats);
		});
	

};

module.exports = router;