var event = angular.module('event',['ui.router']);

event.config([
'$stateProvider',
'$urlRouterProvider',
function($stateProvider, $urlRouterProvider) {

  $stateProvider
  	.state('eventscreate', {
      url: '/events/create',
      templateUrl: 'views/events_create.ejs',
      controller: 'EventCtrl',
      onEnter: ['$state', 'auth', function ($state, auth) {
      	if (!auth.isLoggedIn()) {
      		$state.go('login');
      	};
      }]
    })
    .state('eventslist', {
      url: '/events',
      templateUrl: 'views/events_list.ejs',
      controller: 'EventCtrl',
      onEnter: ['$state', 'auth', function ($state, auth) {
      	if (!auth.isLoggedIn()) {
      		$state.go('login');
      	};
      }],
      resolve: {
			eventPromise : ['auth', 'events', function (auth, events) {
					
					return events.getAll(auth.currentUser().business);
				}]
		}
    })
    .state('eventsedit', {
			url: '/events/:eventId/edit',
			templateUrl: 'views/events_edit.ejs',
			controller: 'EventEditCtrl',
			resolve: {
				eventinfo: ['$stateParams', 'events', function($stateParams, events){
					console.log('edit: '+$stateParams.eventId);
					return events.get($stateParams.eventId);
				}]
			}
	});
}]);
event.factory('events', ['$state', '$http', 'auth', function ($state, $http, auth) {
	var oEvents = {
		events: []
	};

	oEvents.get = function (id) {
		// body...
		return $http.get('/events/'+id).then(function (res) {
			return res.data;
		});
	};
	oEvents.getAll = function (shopId) {
		return $http.get('/events?business='+shopId).success(function (data) {
			// body...
			angular.copy(data, oEvents.events);
		});
	};
	oEvents.create = function (event) {
		
		return $http.post('/events', event).success(function (data) {
			$state.go('eventslist');
		});
	};
	oEvents.update = function (event) {
		console.log(event);
		return $http.put('/events/'+event._id, event).success(function (data) {
			
		});
	};
	oEvents.remove = function (eventId) {
		return $http.delete('/events/'+eventId)
		.success(function (data) {
			// body...
			index = oEvents.events.indexOf(data);
			oEvents.events.splice(index, 1);
		});
	};

	return oEvents;
}]);

event.controller('EventCtrl', [
	'$scope',
	'$state',
	'auth',
	'events',
	function ($scope, $state, auth, events) {
		$scope.regions = regions.regions;
		$scope.events = events.events;
		$scope.create = function () {

			if (!$scope.event || !$scope.event.title ||
				!$scope.event.detail) {
				$scope.error = {message: 'Please fill all blank field'};
				return;
			}
			$scope.event.business = auth.currentUser().business;
			events.create($scope.event).error(function (err) {
				$scope.error = err;
			});
		};
		$scope.remove = function (eventId) {
			console.log('remove: ' + eventId);
			events.remove(eventId).error(function (err) {
				$scope.error = err;
			});
		};
		
}])
.controller('EventEditCtrl', [
	'$scope',
	'$state',
	'auth',
	'events',
	'eventinfo',
	function ($scope, $state, auth, events, eventinfo) {
		$scope.event = eventinfo;
		$scope.update = function () {
			console.log(event);
			if (!$scope.event || !$scope.event.title ||
				!$scope.event.detail) {
				$scope.error = {message: 'Please fill all blank field'};
				return;
			}
			
			events.update($scope.event).error(function (err) {
				$scope.error = err;
			});
		};
}]);

angular.module('meanWebApp').requires.push('event');
