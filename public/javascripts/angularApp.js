var app = angular.module('meanWebApp',['ui.router']);

app.config([
'$stateProvider',
'$urlRouterProvider',
function($stateProvider, $urlRouterProvider) {

  $stateProvider
    .state('home', {
      url: '/home',
      templateUrl: '/home.html',
      controller: 'MainCtrl'
    })
    .state('login', {
	  url: '/login',
	  templateUrl: '/login.html',
	  controller: 'AuthCtrl',
	  onEnter: ['$state', 'auth', function($state, auth){
	    if(auth.isLoggedIn()){
	      $state.go('home');
	    }
	  }]
	})
	.state('register', {
	  url: '/register',
	  templateUrl: '/register.html',
	  controller: 'AuthCtrl',
	  onEnter: ['$state', 'auth', function($state, auth){
	    if(auth.isLoggedIn()){
	      $state.go('home');
	    }
	  }]
	})
	.state('userslist', {
		url: '/users',
		templateUrl: '/userslist.html',
		controller: 'UserListCtrl',
		resolve: {
			userPromise : ['users', function (users) {
				console.log('resolve');
				return users.getAll();
			}]
		}
	})
	.state('usersedit', {
			url: '/users/:userId/edit',
			templateUrl: '/usersedit.html',
			controller: 'UserEditCtrl',
			resolve: {
				usersinfo: ['$stateParams', 'users', function($stateParams, users){
					console.log('edit: '+$stateParams.userId);
					return users.get($stateParams.userId);
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

	auth.currentUser = function(){
		if(auth.isLoggedIn()){
		    var token = auth.getToken();
		    var payload = JSON.parse($window.atob(token.split('.')[1]));

		    return payload.username;
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
		return $http.put('/users/'+usersinfo._id, usersinfo)
		.then(function (res) {
			$state.go('userslist');
		});
	};

	return o;
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
	function($scope, auth){
	  $scope.isLoggedIn = auth.isLoggedIn;
	  $scope.isAdmin = auth.isAdmin;
	  $scope.currentUser = auth.currentUser;
	  $scope.logOut = auth.logOut;
}])
.controller('UserListCtrl', [
	'$scope',
	'auth',
	'users',
	function ($scope, auth, users) {
		$scope.users = users.users;
		$scope.isAdmin = function (roles) {
			//console.log(roles.roles);
			return roles.roles.indexOf('admin') != -1;
		};
}])
.controller('UserEditCtrl', [
	'$scope',
	'auth',
	'users',
	'usersinfo',
	function ($scope, auth, users, usersinfo) {
		$scope.usersinfo = usersinfo;

		$scope.update = function () {
			if ($scope.usersinfo.username === '' || !$scope.usersinfo.username) {return;}

			users.update(usersinfo);

		}
	}]);

