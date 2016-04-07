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
		if (!shopId) {
			return $http.get('/events').success(function (data) {
			// body...
				angular.copy(data, oEvents.events);
			});
		} else {
			return $http.get('/events?business='+shopId).success(function (data) {
			// body...
			angular.copy(data, oEvents.events);
		});
		}
		
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
	oEvents.addComment = function (event, sender, message) {	
		return $http.post('/events/'+event._id+'/comments',{sender:sender, message:message});
	};
	oEvents.updateComment = function (event, comment) {
		return $http.put('/events/'+event._id+'/comments/'+comment._id, comment);
	}
	oEvents.removeComment = function (event, commentId) {
		return $http.delete('/events/'+event._id+'/comments/'+commentId);
	};

	return oEvents;
}]);

event.controller('EventCtrl', [
	'$scope',
	'$state',
	'auth',
	'events',
	'Upload', '$timeout', '$filter',
	function ($scope, $state, auth, events, Upload, $timeout, $filter) {
		$scope.events = events.events;
		$scope.event = {};
		$scope.event.imageUrl = [];
		$scope.event.rules = [];
		$scope.event.link = "http://";
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
		$scope.addRule = function () {
			// body...
			$scope.event.rules.push($scope.newRule);
			$scope.newRule = "";
		}
		$scope.removeRule = function (index) {
			$scope.event.rules.splice(index, 1);
			console.log(index);
		}
		$scope.convertToDate = function (stringDate){
		  var dateOut = new Date(stringDate);
		  return dateOut;
		};

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
	    $scope.removeImage = function (index) {
			$scope.event.imageUrl.splice(index, 1);
			console.log(index);
		}
		//Pagination Table
		$scope.currentPage = 0;
	    $scope.pageSize = 10;
    	$scope.allItems = events.events;
    	$scope.reverse = true;

    	$scope.init = function () {
    		$scope.sort('created');
    	}

    	$scope.search = function () {
    		console.log('search'); 
	        $scope.filteredList = $scope.allItems;
	        
	        if ($scope.searchText == '') {
	            $scope.filteredList = $scope.allItems;
	        }
	        $scope.pagination(); 
	    }

    	$scope.resetAll = function () {
	        $scope.filteredList = $scope.allItems;
	        $scope.searchText = '';
	        $scope.currentPage = 0;
	        $scope.Header = ['','',''];
	    }

	    $scope.pagination = function () {
	        $scope.ItemsByPage = paged( $scope.filteredList, $scope.pageSize );  
	        console.log($scope.ItemsByPage);       
	    };

	    $scope.setPage = function () {
	        $scope.currentPage = this.n;
	    };

	    $scope.firstPage = function () {
	        $scope.currentPage = 0;
	    };

	    $scope.lastPage = function () {
	        $scope.currentPage = $scope.ItemsByPage.length - 1;
	    };

	    $scope.range = function (input, total) {
	        var ret = [];
	        if (!total) {
	            total = input;
	            input = 0;
	        }
	        console.log("total:"+total);
	        for (var i = input; i < total; i++) {
	            if (i != 0 && i != total - 1) {
	                ret.push(i);
	            }
	        }
	        console.log("ret:"+ret);
	        return ret;
	    };

	    $scope.sort = function(sortBy){
	        $scope.resetAll();  
	        
	        $scope.columnToOrder = sortBy; 
	             
	        //$Filter - Standard Service
	        $scope.filteredList = $filter('orderBy')($scope.filteredList, $scope.columnToOrder, $scope.reverse); 

	        if($scope.reverse)
	             iconName = 'glyphicon glyphicon-chevron-up';
	         else
	             iconName = 'glyphicon glyphicon-chevron-down';
	              
	        if(sortBy === 'created')
	        {
	            $scope.Header[0] = iconName;
	        }
	        else if(sortBy === 'title')
	        {
	            $scope.Header[1] = iconName;
	        }
	         
	        $scope.reverse = !$scope.reverse;   
	        
	        $scope.pagination();    
	    };
	   
		//Pagination Table

}])
.controller('EventEditCtrl', [
	'$scope',
	'$state',
	'auth',
	'events',
	'eventinfo',
	'Upload', '$timeout', '$filter',
	function ($scope, $state, auth, events, eventinfo, Upload, $timeout, $filter) {
		console.log(eventinfo);
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
		$scope.addRule = function () {
			// body...
			$scope.event.rules.push($scope.newRule);
			$scope.newRule = "";
		};
		$scope.removeRule = function (index) {
			$scope.event.rules.splice(index, 1);
			console.log(index);
		};
		$scope.addComment = function () {
			// body...
			events.addComment($scope.event, auth.currentUser()._id, $scope.newComment).success(function (data) {
				var comment = {_id:data._id, sender:{_id:auth.currentUser()._id,username:auth.currentUser().username}, message:data.message, created: data.created};
				console.log(comment);
				$scope.event.comments.push(comment);
				$scope.search();
			}).error(function (err) {
				$scope.error = err;
			});
			
		};
		$scope.updateComment = function (comment) {
			console.log(comment);
			events.updateComment($scope.event, comment).success(function (data) {
				console.log(data);
				$scope.editingCommentId = undefined;
			}).error(function (err) {
				$scope.error = err;
				$scope.editingCommentId = undefined;
			});
		}
		$scope.removeComment = function (commentId) {
			console.log('remove: ' + commentId);
			events.removeComment($scope.event, commentId).success(function (data) {
				console.log(data);
				console.log($scope.event.comments);
				var index;
				$scope.event.comments.some(function( obj, idx ) {
				    if( obj._id === data._id ) {
				        index = idx;
				        return true;
				    }
				});
				$scope.event.comments.splice(index, 1);
				$scope.sort('created');
			}).error(function (err) {
				$scope.error = err;
			});
		};
		$scope.editComment = function (commentId) {
			console.log('edit: ' + commentId);
			if ($scope.editingCommentId) { $scope.editingCommentId = undefined;}
			else $scope.editingCommentId = commentId
		};
		$scope.isEditing = function (commentId) {
			return commentId == $scope.editingCommentId;
		}
		$scope.isSender = function (userId) {
			return userId._id == auth.currentUser()._id
		}
		$scope.convertToDate = function (stringDate){
		  var dateOut = new Date(stringDate);
		  return dateOut;
		};
		//datepicker
		$scope.today = function() {
		    $scope.event.publishDate = new Date($scope.event.publishDate);
		    $scope.event.invalidate = new Date($scope.event.invalidate);
		  };
		  $scope.today();
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
	    $scope.removeImage = function (index) {
			$scope.event.imageUrl.splice(index, 1);
			console.log(index);
		}
		//Pagination Table
		$scope.currentPage = 0;
	    $scope.pageSize = 10;
    	$scope.allItems = $scope.event.comments;
    	$scope.reverse = true;

    	$scope.init = function () {
    		$scope.sort('created');
    	}

    	$scope.search = function () {
    		console.log('search'); 
	        $scope.filteredList = $scope.allItems;
	        
	        if ($scope.searchText == '') {
	            $scope.filteredList = $scope.allItems;
	        }
	        $scope.pagination(); 
	    }

    	$scope.resetAll = function () {
	        $scope.filteredList = $scope.allItems;
	        $scope.searchText = '';
	        $scope.currentPage = 0;
	        $scope.Header = ['','',''];
	    }

	    $scope.pagination = function () {
	        $scope.ItemsByPage = paged( $scope.filteredList, $scope.pageSize );  
	        console.log($scope.ItemsByPage);       
	    };

	    $scope.setPage = function () {
	        $scope.currentPage = this.n;
	    };

	    $scope.firstPage = function () {
	        $scope.currentPage = 0;
	    };

	    $scope.lastPage = function () {
	        $scope.currentPage = $scope.ItemsByPage.length - 1;
	    };

	    $scope.range = function (input, total) {
	        var ret = [];
	        if (!total) {
	            total = input;
	            input = 0;
	        }
	        console.log("total:"+total);
	        for (var i = input; i < total; i++) {
	            if (i != 0 && i != total - 1) {
	                ret.push(i);
	            }
	        }
	        console.log("ret:"+ret);
	        return ret;
	    };

	    $scope.sort = function(sortBy){
	        $scope.resetAll();  
	        
	        $scope.columnToOrder = sortBy; 
	             
	        //$Filter - Standard Service
	        $scope.filteredList = $filter('orderBy')($scope.filteredList, $scope.columnToOrder, $scope.reverse); 

	        if($scope.reverse)
	             iconName = 'glyphicon glyphicon-chevron-up';
	         else
	             iconName = 'glyphicon glyphicon-chevron-down';
	         
	        $scope.reverse = !$scope.reverse;   
	        
	        $scope.pagination();    
	    };
		//Pagination Table
}]);

//Pagination table
function paged (valLists,pageSize)
{
    retVal = [];
    for (var i = 0; i < valLists.length; i++) {
        if (i % pageSize === 0) {
            retVal[Math.floor(i / pageSize)] = [valLists[i]];
        } else {
            retVal[Math.floor(i / pageSize)].push(valLists[i]);
        }
    }
    return retVal;
};

//Pagination table
angular.module('meanWebApp').requires.push('event');
