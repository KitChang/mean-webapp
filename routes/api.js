var express = require('express');
var router = express.Router();

router.post('/auth/local', function(req, res, next) {
	var phone = req.body.phone;
	var password = req.body.password;

	if (phone == "85366387334" && password == "abcd1234") {
		var results = {};
		results.accessToken = "agBSZidpdHQSL_yI1S10eQ5je8jKJObB";

		res.json(results);
	}
});

module.exports = router;