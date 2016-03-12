var express = require('express');
var router = express.Router();
var https = require('https');

var passport = require('passport');
var mongoose = require('mongoose');
var User = mongoose.model('User');
var atob = require('atob');

router.post('/auth/local', function(req, res, next) {
	if (!req.body.username || !req.body.password) {
		return res.status(400).json({message: 'Please fill out all fields'});
	}
	console.log("loging"+req.body.username);
	User.findOne({username: req.body.username}, function(err, user) {
		console.log(user);
		if (err) {
			console.log(err.toJSON());
			return res.status(500).json(err.toJSON());
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
  			return res.status(500).json(err.toJSON());
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
										console.log(err.toJSON());
										return res.status(500).json(err.toJSON());
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
											console.log(err.toJSON());
											return res.status(500).json(err.toJSON());
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
			return res.status(500).json(err.toJSON());
		}
		if (!userOne) {return res.status(401);}
		if (name != null) userOne.name = name;
		if (sex != null) userOne.sex = sex;
		if (birthday != null) userOne.birthday = new Date(birthday)
		console.log(userOne);
		userOne.save(function(err, savedUser) {
			if (err) {
				console.log(err.toJSON());
				return res.status(500).json(err.toJSON());
			}
			return res.json({name: savedUser.name, sex: savedUser.sex, birthday: savedUser.birthday});
		});
	});

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
				    		userOne.fbId = null;
				    		userOne.fbName = null;
				    		userOne.fbToken = null;

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
				return res.status(500).json(err.toJSON());
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
											console.log(err.toJSON());
											return res.status(500).json(err.toJSON());
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
			console.log(err.toJSON());
			cb(err, null);
		}
		if (!userOne) {cb(null,null);}

		cb(null,userOne);
	});
};

module.exports = router;