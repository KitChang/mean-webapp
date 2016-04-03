var event = angular.module('event',['ui.router','ui.bootstrap','ngFileUpload']);

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
	'Upload', '$timeout',
	function ($scope, $state, auth, events, Upload, $timeout) {
		$scope.events = events.events;
		$scope.event = {};
		$scope.event.imageUrl = [];
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
		$scope.removeImage = function (index) {
			$scope.event.imageUrl.splice(index, 1);
			console.log(index);
		}
		//datepicker
		$scope.today = function() {
			var today = new Date();
		    $scope.event.publishDate = today;
		    var exp = new Date();
		    $scope.event.invalidate = exp.setDate(exp.getDate()+365);
		  };
		  $scope.today();

		  $scope.clear = function() {
		    $scope.validate = null;
		    $scope.invalidate = null;
		  };

		  $scope.dateOptions = {
		    dateDisabled: disabled,
		    formatYear: 'yy',
		    maxDate: new Date(2020, 5, 22),
		    minDate: new Date(),
		    startingDay: 1
		  };

		  // Disable weekend selection
		  function disabled(data) {
		    var date = data.date,
		      mode = data.mode;
		    return mode === 'day' && (date.getDay() === 0 && date.getDay() === 6);
		  }

		  $scope.open1 = function() {
		    $scope.popup1.opened = true;
		  };

		  $scope.open2 = function() {
		    $scope.popup2.opened = true;
		  };

		  $scope.formats = ['dd-MMMM-yyyy', 'yyyy/MM/dd', 'dd.MM.yyyy', 'shortDate'];
		  $scope.format = $scope.formats[0];
		  $scope.altInputFormats = ['M!/d!/yyyy'];

		  $scope.popup1 = {
		    opened: false
		  };

		  $scope.popup2 = {
		    opened: false
		  };
		//datepicker
		//image upload
		$scope.$watch('files', function () {
	        $scope.upload($scope.files);
	    });
	    $scope.$watch('file', function () {
	        if ($scope.file != null) {
	            $scope.files = [$scope.file]; 
	        }
	    });
	    $scope.log = '';

	    $scope.upload = function (files) {
	        if (files && files.length) {
	            for (var i = 0; i < files.length; i++) {
	              var file = files[i];
	              if (!file.$error) {
	                Upload.upload({
	                    url: 'http://localhost/upload',
	                    data: {
	                    	channel: '123',
	                    	file: file  
	                    }
	                }).then(function (resp) {
	                    $timeout(function() {
	                        $scope.log = 'file: ' +
	                        resp.config.data.file.name +
	                        ', Response: ' + JSON.stringify(resp.data) +
	                        '\n' + $scope.log;
	                    });
	                    console.log(resp.data);
	                    $scope.event.imageUrl.push(resp.data.file.filename);
	                }, null, function (evt) {
	                    var progressPercentage = parseInt(100.0 *
	                    		evt.loaded / evt.total);
	                    $scope.log = 'progress: ' + progressPercentage + 
	                    	'% ' + evt.config.data.file.name + '\n' + 
	                      $scope.log;
	                });
	              }
	            }
	        }
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
