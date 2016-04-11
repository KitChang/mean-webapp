var app = angular.module('meanWebApp',['ui.router','ui.bootstrap', 'ngFileUpload']);

app.config([
'$stateProvider',
'$urlRouterProvider',
function($stateProvider, $urlRouterProvider) {

  $stateProvider
    .state('home', {
      url: '/home',
      templateUrl: 'views/home.ejs',
      controller: 'MainCtrl',
      onEnter: ['$state', 'auth', function ($state, auth) {
      	if (!auth.isLoggedIn()) {
      		$state.go('login');
      	};
      }]
    })
    .state('login', {
	  url: '/login',
	  templateUrl: 'views/login_login.ejs',
	  controller: 'AuthCtrl',
	  onEnter: ['$state', 'auth', function($state, auth){
	    if(auth.isLoggedIn()){
	      $state.go('home');
	    }
	  }]
	})
	.state('register', {
	  url: '/register',
	  templateUrl: 'views/login_register.ejs',
	  controller: 'AuthCtrl',
	  onEnter: ['$state', 'auth', function($state, auth){
	    if(auth.isLoggedIn()){
	      $state.go('home');
	    }
	  }]
	})
	.state('userslist', {
		url: '/users',
		templateUrl: 'views/users_list.ejs',
		controller: 'UserListCtrl',
		resolve: {
			userPromise : ['users', function (users) {
				console.log('list');
				return users.getAll();
			}]
		}
	})
	.state('usersedit', {
			url: '/users/:userId/edit',
			templateUrl: 'views/users_edit.ejs',
			controller: 'UserEditCtrl',
			resolve: {
				usersinfo: ['$stateParams', 'users', function($stateParams, users){
					console.log('edit: '+$stateParams.userId);
					return users.get($stateParams.userId);
				}]
			}
	})
	.state('stopslist', {
		url: '/stops',
		templateUrl: 'views/stops_list.ejs',
		controller: 'StopCtrl',
		resolve: {
			stopPromise : ['stops', function (stops) {
					console.log('stop list');
					return stops.getAll();
				}]
		}
	})
	.state('stopscreate', {
		url: '/stops/create',
		templateUrl: 'views/stops_create.ejs',
		controller: 'StopCtrl'
	})
	.state('stopsedit', {
		url: '/stops/:stopId/edit',
		templateUrl: 'views/stops_edit.ejs',
		controller: 'StopEditCtrl',
		resolve: {
			findStop: ['$stateParams', 'stops', function($stateParams, stops){
				console.log('edit: '+$stateParams.stopId);
				return stops.get($stateParams.stopId);
			}]
		}
	});

  $urlRouterProvider.otherwise('home');
}]);

app.factory('auth', ['$http', '$window', function($http, $window){
   	var auth = {};
   	auth.saveToken = function (token){
  		$window.localStorage['meanwebapp-token'] = token;
	};

	auth.getToken = function (){
  		return $window.localStorage['meanwebapp-token'];
	};

	auth.isLoggedIn = function(){
	  	var token = auth.getToken();

	  	if(token){
	    	var payload = JSON.parse($window.atob(token.split('.')[1]));
	    
	    	return payload.exp > Date.now() / 1000;
	  	} else {
	    	return false;
	  	}
	};

	auth.isAdmin = function(){
		var token = auth.getToken();

	  	if(token){
	  		if (auth.isLoggedIn()) {
	  			var payload = JSON.parse($window.atob(token.split('.')[1]));
	    		//console.log(payload.roles.indexOf('admin'));
	    		return payload.roles.indexOf('admin') != -1;
	  		}
	  		else {
	  			return false;
	  		}
	    	
	  	} else {
	    	return false;
	  	}
	};

	auth.isClient = function () {
		var token = auth.getToken();

	  	if(token){
	  		if (auth.isLoggedIn()) {
	  			var payload = JSON.parse($window.atob(token.split('.')[1]));
	    		//console.log(payload.roles.indexOf('admin'));
	    		return payload.roles.indexOf('client') != -1;
	  		}
	  		else {
	  			return false;
	  		}
	    	
	  	} else {
	    	return false;
	  	}	
	};

	auth.currentUser = function(){
		if(auth.isLoggedIn()){
		    var token = auth.getToken();
		    var payload = JSON.parse($window.atob(token.split('.')[1]));

		    return payload;
		}
	};

	auth.register = function(user){
	  	return $http.post('/register', user).success(function(data){
	    	auth.saveToken(data.token);
	  	});
	};

	auth.logIn = function(user){
  		return $http.post('/login', user).success(function(data){
    		auth.saveToken(data.token);
  		});
	};

	auth.logOut = function(){
  		$window.localStorage.removeItem('meanwebapp-token');
	};
  	return auth;
}])
.factory('users', ['$state', '$http', 'auth', function($state, $http, auth){
	var o = {
		users:[]
	};

	o.getAll = function () {
		return $http.get('/users').success(function (data) {
			// body...
			angular.copy(data, o.users);
		});
	};

	o.get = function (id) {
		// body...
		return $http.get('/users/'+id).then(function (res) {
			return res.data;
		})
	};

	o.update = function (usersinfo) {
		return $http.put('/users/'+usersinfo._id, usersinfo, {
			headers: {Authorization: 'Bearer '+auth.getToken()}
		})
		.then(function (res) {
			$state.go('userslist');
		});
	};

	o.remove = function (userId) {
		return $http.delete('/users/'+userId, {
			headers: {Authorization: 'Bearer '+auth.getToken()}
		})
		.success(function (data) {
			// body...
			userIndex = o.users.indexOf(data);
			o.users.splice(userIndex, 1);
		});
	};

	return o;
}])
.factory('regions', ['$state', '$http', 'auth', function ($state, $http, auth) {	
	var o = {

		regions: [
			{
				name: '澳門',
				subRegions: [ 
					{ 
					  	name:'澳門',
					  	subRegions: [
					  		'澳門東北區', '澳門市中心', '澳門西北區',
					  		'澳門新馬路區', '東望洋山(松山)及憲山區',
							'澳門南灣區', '西望洋山/媽閣區','新口岸及外港新填海區'
					  	]
					},
					{ 
					  	name:'氹仔',
					  	subRegions: [
					  		'氹仔市中心區', '氹仔西北區', '氹仔東北區',
					  		'聖母灣區', '路氹填海區',
							'機場區', '氹仔村','澳門大學新校區'
					  	]
					},

					{ 
					  	name:'路環',
					  	subRegions: [
					  		'九澳', '石排灣', '竹灣',
					  		'黑沙', '路環村', '聯生工業區'
					  	]
					}]
			},
			{
				name: '香港',
				subRegions:[]
			},
			{
				name: '中國',
				subRegions:[]
			},
			{
				name: '台灣',
				subRegions:[]
			}
		]
		

		
	}

	return o;
}])
.factory('types', ['$state', '$http', 'auth', function ($state, $http, auth) {	
	var o = {
		types: ["餐飲", "地產", "金融", "電商", "娛樂", "保險", "電器", "快消品", 
				"電子產品", "汽車交通", "日用百貨", "珠寶飾品", "家具家裝", "健康休閑", 
				"美容保健", "服飾紡織", "母嬰用品", "運動裝備", "寵物", "健康產品", 
				"玩具禮品", "廣告傳媒", "軟件應用", "其他"],
		missionTypes: ["login", "checkin", "share"]	
	}

	return o;
}])
.factory('stops', ['$state', '$http', 'auth', function ($state, $http, auth) {
	var oStops = {
		stops: []
	};

	oStops.get = function (id) {
		// body...
		return $http.get('/stops/'+id).then(function (res) {
			return res.data;
		})
	};
	oStops.getAll = function () {
		return $http.get('/stops').success(function (data) {
			// body...
			angular.copy(data, oStops.stops);
		});
	};
	oStops.create = function (stop) {
		return $http.post('/stops', stop).success(function (data) {
			$state.go('stopslist');
		});
	};
	oStops.update = function (stop) {
		return $http.put('/stops/'+stop._id, stop).success(function (data) {
			$state.go('stopslist');
		});
	};
	oStops.remove = function (stopId) {
		return $http.delete('/stops/'+stopId)
		.success(function (data) {
			// body...
			stopIndex = oStops.stops.indexOf(data);
			oStops.stops.splice(stopIndex, 1);
		});
	};

	return oStops;
}]);

app.controller('MainCtrl',[
	'$scope',
	function ($scope) {
		$scope.test = 'Hello world!';
	}])
.controller('AuthCtrl', [
	'$scope',
	'$state',
	'auth',
	function($scope, $state, auth){
	  $scope.user = {};

	  $scope.register = function(){
	    auth.register($scope.user).error(function(error){
	      $scope.error = error;
	    }).then(function(){
	      $state.go('home');
	    });
	  };

	  $scope.logIn = function(){
	    auth.logIn($scope.user).error(function(error){
	      $scope.error = error;
	    }).then(function(){
	      $state.go('home');
	    });
	  };
}])
.controller('NavCtrl', [
	'$scope',
	'auth',
	'users',
	function($scope, auth, users){
	  $scope.isLoggedIn = auth.isLoggedIn;
	  $scope.isAdmin = auth.isAdmin;
	  $scope.isClient = auth.isClient;
	  $scope.currentUser = auth.currentUser;
	  $scope.logOut = auth.logOut;
	  $scope.appTitle = 'MEAN Example Web';

	  
}])
.controller('UserListCtrl', [
	'$scope',
	'$state',
	'auth',
	'users',
	function ($scope, $state, auth, users) {
		$scope.users = users.users;
		$scope.isAdmin = function (roles) {
			//console.log(roles.roles);
			return roles.roles.indexOf('admin') != -1;
		};

		$scope.remove = function (userId) {
			console.log('remove: ' + userId);
			users.remove(userId);
		};
}])
.controller('UserEditCtrl', [
	'$scope',
	'auth',
	'users',
	'usersinfo',
	function ($scope, auth, users, usersinfo) {
		console.log(shops);
		$scope.usersinfo = usersinfo;
		$scope.update = function () {
			if ($scope.usersinfo.username === '' || !$scope.usersinfo.username) {return;}

			users.update($scope.usersinfo);

		}
	}])
.controller('StopCtrl', [
	'$scope',
	'$state',
	'auth',
	'regions',
	'stops',
	function ($scope, $state, auth, regions, stops) {
		$scope.regions = regions.regions;
		$scope.stops = stops.stops;
		$scope.create = function () {

			if (!$scope.stop || !$scope.stop.displayName ||
				$scope.stop.code === '' || !$scope.stop.code ||
				$scope.stop.subCode === '' || !$scope.stop.subCode ||
				!$scope.stop.region ||
				$scope.stop.subRegion === '' || !$scope.stop.subRegion) {
				$scope.error = {message: 'Please fill all blank field'};
				return;
			}
			var stopInfo = $scope.stop;
			var regionObj = $scope.stop.region;
			stopInfo.region = regionObj.name;
			stops.create(stopInfo).error(function (err) {
				$scope.error = err;
			});
		};
		$scope.remove = function (stopId) {
			console.log('remove: ' + stopId);
			stops.remove(stopId).error(function (err) {
				$scope.error = err;
			});
		};
}])
.controller('StopEditCtrl', [
	'$scope',
	'$state',
	'auth',
	'regions',
	'stops',
	'findStop',
	function ($scope, $state, auth, regions, stops, findStop) {
		$scope.regions = regions.regions;
		$scope.isAdmin = auth.isAdmin;
		var regionObj = regions.regions.filter(function (obj) {
			return obj.name == findStop.region;
		})
		$scope.findStop = findStop;
		$scope.findStop.region = regionObj[0];

		$scope.update = function () {
			console.log('update');
			if (!$scope.findStop || $scope.findStop.displayName === '' ||
				$scope.findStop.code === '' || !$scope.findStop.code ||
				$scope.findStop.subCode === '' || !$scope.findStop.subCode ||
				!$scope.findStop.region ||
				$scope.findStop.subRegion === '' || !$scope.findStop.subRegion) {
				$scope.error = {message: 'Please fill all blank field'};
				return;
			}
			var stopInfo = $scope.findStop;
			var regionObj = $scope.findStop.region;
			stopInfo.region = regionObj.name;
			stops.update(stopInfo).error(function (err) {
				$scope.error = err;
			});
		};

		
	}]);
