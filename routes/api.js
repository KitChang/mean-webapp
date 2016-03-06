var express = require('express');
var router = express.Router();
var https = require('https');

var mongoose = require('mongoose');
var User = mongoose.model('User');

router.post('/auth/local', function(req, res, next) {
	var phone = req.body.phone;
	var password = req.body.password;

	if (phone == "85366387334" && password == "abcd1234") {
		var results = {};
		results.accessToken = "agBSZidpdHQSL_yI1S10eQ5je8jKJObB";
		results.id = "MC00000001"
		results.name = "Kit"
		results.birthday = "1989/08/14"
		results.sex = "0"
		results.phone = "85366387334"

		res.json(results);
	} else {
		res.status(401);
		res.end();
	}
});

router.post('/auth/authenticated', function(req, res, next) {
	var accessToken = req.body.accessToken;

	if (accessToken == "agBSZidpdHQSL_yI1S10eQ5je8jKJObB") {
		var results = {};
		results.id = "MC00000001";
		results.name = "傑";
		results.birthday = "1989/08/14";
		results.sex = "1";
		results.phone = "85366387334";

		res.json(results);
	} else {
		console.log(req.body.accessToken);
		res.status(401);
		res.end();
	}
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
  	user.save(function(err) {
  		if (err) { 
  			console.log(err);
  			return next(err);
  		}
  		var results = {};
  		results.username = user.username;
  		results.accessToken = user.generateJWT();

  		return res.json(results);
  	});


	// if (phone == "85366387334") {
	// 	res.status(400);
	// 	res.json({message: "phone already exist"});
	// } else {
	// 	var results = {};
	// 	results.phone = phone;
	// 	results.password = password;
	// 	results.code = code;
	// 	res.json(results);
	// }

});

router.post('/auth/userinfo', function(req, res, next) {
	var name = req.body.name;
	var birthday = req.body.birthday;
	var sex = req.body.sex;
	var phone = req.body.phone;

	var results = {};
	results.accessToken = "agBSZidpdHQSL_yI1S10eQ5je8jKJObA";
	results.name = name;
	results.birthday = birthday;
	results.sex = sex;
	results.phone = phone;
	results.id = "MC00000002";

	res.json(results);
});

router.post('/auth/binding/weixin', function(req, res, next) {
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

			    		res.json({name:weixinUser.nickname, sex:weixinUser.sex.toString(), openid:weixinUser.openid, unionid:weixinUser.unionid});
			    	});
		    	} else {
		    		var string = '';
			    	response.on('data', function(chunk) {
			    		string += chunk;
			    	});

			    	response.on('end', function() {
			    		console.log(string);
			    		res.status(500);
			    		res.end();
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
	} else {
		res.status(400);
		res.json({message: "invalid code"});
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

module.exports = router;