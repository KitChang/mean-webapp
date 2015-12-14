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
	.state('user', {
		url: '/user',
		templateUrl: '/user.html',
		controller: 'UserCtrl',
		resolve: {
			userPromise : ['users', function (users) {
				console.log('resolve')
				return users.getAll();
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
	    		console.log(payload.roles.indexOf('admin'));
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
.factory('users', ['$http', 'auth', function($http, auth){
	var o = {
		users:[]
	};

	o.getAll = function () {
		return $http.get('/users').success(function (data) {
			// body...
			angular.copy(data, o.users);
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
.controller('UserCtrl', [
	'$scope',
	'auth',
	'users',
	function ($scope, auth, users) {
		$scope.users = users.users;
	}]);

