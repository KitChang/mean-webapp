var express = require('express');
var router = express.Router();
var https = require('https');

router.post('/auth/local', function(req, res, next) {
	var phone = req.body.phone;
	var password = req.body.password;

	if (phone == "85366387334" && password == "abcd1234") {
		var results = {};
		results.accessToken = "agBSZidpdHQSL_yI1S10eQ5je8jKJObB";
		results.id = "MC00000001"
		results.name = "傑"
		results.birthday = "1989-08-14"
		results.sex = "1"
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
		results.birthday = "1989-08-14";
		results.sex = "1";
		results.phone = "85366387334";

		res.json(results);
	} else {
		console.log(req.body.accessToken);
		res.status(401);
		res.end();
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