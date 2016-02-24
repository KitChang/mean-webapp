var express = require('express');
var router = express.Router();

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
});

module.exports = router;