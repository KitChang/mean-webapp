var chatroom = angular.module('chatroom',['ui.router','ui.bootstrap','ngFileUpload']);

chatroom.config([
'$stateProvider',
'$urlRouterProvider',
function($stateProvider, $urlRouterProvider) {

  $stateProvider
  	.state('chatroomscreate', {
      url: '/chatrooms/create',
      templateUrl: 'views/chatrooms_create.ejs',
      controller: 'ChatroomCtrl',
      onEnter: ['$state', 'auth', function ($state, auth) {
      	if (!auth.isLoggedIn()) {
      		$state.go('login');
      	};
      }]
    })
    .state('chatroomslist', {
      url: '/chatrooms',
      templateUrl: 'views/chatrooms_list.ejs',
      controller: 'ChatroomCtrl',
      onEnter: ['$state', 'auth', 'pageHeader', function ($state, auth, pageHeader) {
      	pageHeader.title = 'Chatroom List';
      	if (!auth.isLoggedIn()) {
      		$state.go('login');
      	};
      }],
      resolve: {
			chatroomPromise : ['auth', 'chatrooms', function (auth, chatrooms) {
				return chatrooms.getAll(auth.currentUser()._id);
			}],
			shopinfo: ['auth', 'chatrooms', function(auth, chatrooms){
				console.log('shopInfo: '+auth.currentUser().business);
				return chatrooms.getShop(auth.currentUser().business);
			}]
		}
    })
    .state('chatroomsedit', {
			url: '/chatrooms/:chatroomId/edit',
			templateUrl: 'views/chatrooms_edit.ejs',
			controller: 'ChatroomEditCtrl',
			resolve: {
				chatroominfo: ['$stateParams', 'chatrooms', function($stateParams, chatrooms){
					console.log('edit: '+$stateParams.chatroomId);
					return chatrooms.get($stateParams.chatroomId);
				}]
			}
	});
}]);
chatroom.factory('chatrooms', ['$state', '$http', 'auth', function ($state, $http, auth) {
	var oChatrooms = {
		chatrooms: []
	};

	oChatrooms.get = function (id) {
		// body...
		return $http.get('/chatrooms/'+id);
	};
	oChatrooms.getShop = function (id) {
		// body...
		return $http.get('/shops/'+id).then(function (res) {
			return res.data;
		});
	};
	oChatrooms.getAll = function (userId) {
		if (!userId) {
			return $http.get('/chatrooms').success(function (data) {
			// body...
				angular.copy(data, oChatrooms.chatrooms);
			});
		} else {
			return $http.get('/chatrooms?userId='+userId).success(function (data) {
			// body...
			angular.copy(data, oChatrooms.chatrooms);
		});
		}
		
	};
	oChatrooms.create = function (chatroom, sender) {
		
		return $http.post('/chatrooms', {chatroom:chatroom, sender:sender});
	};
	oChatrooms.update = function (chatroom) {
		console.log(chatroom);
		return $http.put('/chatrooms/'+chatroom._id, chatroom).success(function (data) {
			
		});
	};
	oChatrooms.remove = function (chatroomId) {
		return $http.delete('/chatrooms/'+chatroomId);
	};
	oChatrooms.createChat = function (chat) {
		return $http.post('/chatrooms/'+chat.chatroom+'/chats', chat);	
	};

	return oChatrooms;
}]);

chatroom.controller('ChatroomCtrl', [
	'$scope',
	'$state',
	'auth',
	'chatrooms',
	'$filter', 'shopinfo',
	function ($scope, $state, auth, chatrooms, $filter, shopinfo) {
		$scope.shop = shopinfo;
		console.log(shopinfo);
		$scope.chatrooms = chatrooms.chatrooms;
		$scope.showModal = false;
	    $scope.showMembers = function(){
	    
	    	$scope.showModal = !$scope.showModal;
	    	
	    };
	    $scope.getChatroom = function (chatroomId) {
	    	chatrooms.get(chatroomId).success(function (data) {
	    		console.log(data);
	    		$scope.chatroom = data;
	    	}).error(function (err) {
	    		$scope.error = err;
	    	})
	    };
		$scope.create = function (userId) {

			if (!userId) {
				$scope.error = {message: 'Please fill all blank field'};
				return;
			}
			chatroom.users = [auth.currentUser()._id, userId];
			console.log(chatroom);
			chatrooms.create(chatroom, auth.currentUser()._id).success(function (data) {
				$scope.chatrooms.push(data);
				console.log($scope.chatrooms);
				$scope.reverse = true;
				$scope.sort('updated');
			}).error(function (err) {
				$scope.error = err;
			});
		};
		$scope.showOrCreate = function (memberId) {
			var index = -1;
			$scope.chatrooms.some(function( obj, idx ) {
				obj.users.some(function (user, userIndex) {
					if( user._id == memberId ) {
				    	console.log(idx);
				        index = idx;
				        return true;
				    }
				});
			    
			});
			if (index == -1) {
				console.log('create chatroom:' + index);
				$scope.create(memberId);

			} else {
				console.log('show chatroom' + index);
				$scope.getChatroom($scope.chatrooms[index]._id);
				$scope.showModal = false;
			}
		};
		$scope.remove = function (chatroomId) {
			console.log('remove: ' + chatroomId);
			chatrooms.remove(chatroomId).success(function (data) {
			// body...
				var index;
				$scope.chatrooms.some(function( obj, idx ) {
				    if( obj._id === data._id ) {
				        index = idx;
				        return true;
				    }
				});
				$scope.chatrooms.splice(index, 1);
				$scope.reverse = !$scope.reverse; 
				$scope.sort('created');
			}).error(function (err) {
				$scope.error = err;
			});
		};
		$scope.createChat = function () {
			if (!$scope.newChat) {return;}
			var chat = {};
			chat.sender = auth.currentUser()._id;
			chat.messageType = 'text';
			chat.content = $scope.newChat;
			chat.chatroom = $scope.chatroom._id;
			chatrooms.createChat(chat).success(function (data) {
				$scope.chatroom.conversations.push(data);
				$scope.newChat = '';
			}).error(function (err) {
				$scope.error = err;
			});

		};
		$scope.convertToDate = function (stringDate){
		  var dateOut = new Date(stringDate);
		  return dateOut;
		};
		$scope.convertToUsername = function (userId) {
			var index;
			$scope.chatroom.users.some(function( obj, idx ) {
			    if( obj._id == userId ) {
			        index = idx;
			        return true;
			    }
			});	
			return $scope.chatroom.users[index].username;
		};
		$scope.showChatroomTitle = function (chatroom) {
			var index;
			chatroom.users.some(function( obj, idx ) {
			    if( obj._id !== auth.currentUser()._id ) {
			        index = idx;
			        return true;
			    }
			});
			return chatroom.users[index].username;
		};
		$scope.isSender = function (chat) {
			if (chat.sender == auth.currentUser()._id) {
				return 'direct-chat-msg right';
			} else return 'direct-chat-msg';
		}

		//Pagination Table
		$scope.currentPage = 0;
	    $scope.pageSize = 10;
    	$scope.allItems = chatrooms.chatrooms;
    	$scope.reverse = true;

    	$scope.init = function () {
    		$scope.sort('updated');
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
	        for (var i = input; i < total; i++) {
	            if (i != 0 && i != total - 1) {
	                ret.push(i);
	            }
	        }
	        return ret;
	    };

	    $scope.sort = function(sortBy){
	        $scope.resetAll();  
	        
	        $scope.columnToOrder = sortBy; 
	             
	        //$Filter - Standard Service
	        $scope.filteredList = $filter('orderBy')($scope.filteredList, $scope.columnToOrder, $scope.reverse); 
	         
	        $scope.reverse = !$scope.reverse;   
	        
	        $scope.pagination();    
	    };
	   
		//Pagination Table

}])
.controller('ChatroomEditCtrl', [
	'$scope',
	'$state',
	'auth',
	'chatrooms',
	'chatroominfo',
	'Upload', '$timeout', '$filter', 'types',
	function ($scope, $state, auth, chatrooms, chatroominfo, Upload, $timeout, $filter, types) {
		console.log(chatroominfo);
		$scope.chatroom = chatroominfo;
		$scope.missionTypes = types.missionTypes;
		$scope.newCoupon = {};
		$scope.newCoupon.missions = [];
		$scope.mission = {};
		$scope.showModal = false;
		$scope.showEditModal = false;
	    $scope.toggleModal = function(){
	        $scope.showModal = !$scope.showModal;
	    };
	    $scope.showMissionRepeat = function (missionType) {
	    	return missionType != undefined;
	    }
		$scope.update = function () {
			console.log(chatroom);
			if (!$scope.chatroom || !$scope.chatroom.title ||
				!$scope.chatroom.detail) {
				$scope.error = {message: 'Please fill all blank field'};
				return;
			}
			
			chatrooms.update($scope.chatroom).error(function (err) {
				$scope.error = err;
			});
		};
		$scope.addRule = function () {
			// body...
			$scope.chatroom.rules.push($scope.newRule);
			$scope.newRule = "";
		};
		$scope.removeRule = function (index) {
			$scope.chatroom.rules.splice(index, 1);
			console.log(index);
		};
		$scope.addComment = function () {
			// body...
			chatrooms.addComment($scope.chatroom, auth.currentUser()._id, $scope.newComment).success(function (data) {
				var comment = {_id:data._id, sender:{_id:auth.currentUser()._id,username:auth.currentUser().username}, message:data.message, created: data.created};
				console.log(comment);
				$scope.chatroom.comments.push(comment);
				$scope.search();
			}).error(function (err) {
				$scope.error = err;
			});
			
		};
		$scope.updateComment = function (comment) {
			console.log(comment);
			chatrooms.updateComment($scope.chatroom, comment).success(function (data) {
				console.log(data);
				$scope.editingCommentId = undefined;
			}).error(function (err) {
				$scope.error = err;
				$scope.editingCommentId = undefined;
			});
		}
		$scope.removeComment = function (commentId) {
			console.log('remove: ' + commentId);
			chatrooms.removeComment($scope.chatroom, commentId).success(function (data) {
				console.log(data);
				console.log($scope.chatroom.comments);
				var index;
				$scope.chatroom.comments.some(function( obj, idx ) {
				    if( obj._id === data._id ) {
				        index = idx;
				        return true;
				    }
				});
				$scope.chatroom.comments.splice(index, 1);
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
		$scope.createCoupon = function () {
			console.log($scope.mission);
			if ($scope.mission.missionType != undefined) {
				$scope.newCoupon.missions[0] = $scope.mission;
			}
			$scope.newCoupon.chatroom = $scope.chatroom._id;
			$scope.newCoupon.invalidate = $scope.chatroom.invalidate;
			console.log($scope.newCoupon);
			chatrooms.createCoupon($scope.newCoupon).success(function (data) {
				// body...
				console.log(data);
				$scope.chatroom.coupons.push(data);
				$scope.showModal = false;
			}).error(function (err) {
				$scope.error = err;
			});
		}
		$scope.editCoupon = function (couponId) {
			
			chatrooms.getCoupon($scope.chatroom, couponId).success(function (data) {
				$scope.coupon = data;
				$scope.showEditModal = true;
			}).error(function (err) {
				$scope.error = err;
			});
		};
		$scope.updateCoupon = function () {
			console.log($scope.coupon);
			chatrooms.updateCoupon($scope.coupon).success(function (data) {
				var index;
				$scope.chatroom.coupons.some(function( obj, idx ) {
				    if( obj._id === data._id ) {
				        index = idx;
				        return true;
				    }
				});
				$scope.chatroom.coupons[index] = data;
				$scope.showEditModal = false;
			}).error(function (err) {
				$scope.error = err;
				$scope.showEditModal = false;
			});
		};
		$scope.removeCoupon = function (couponId) {
			chatrooms.removeCoupon($scope.chatroom, couponId).success(function (data) {
				var index;
				$scope.chatroom.coupons.some(function( obj, idx ) {
				    if( obj._id === data._id ) {
				        index = idx;
				        return true;
				    }
				});
				$scope.chatroom.coupons.splice(index, 1);
			}).error(function (err) {
				$scope.error = err;
			});
		}
		$scope.convertToDate = function (stringDate){
		  var dateOut = new Date(stringDate);
		  return dateOut;
		};
		//datepicker
		$scope.today = function() {
		    $scope.chatroom.publishDate = new Date($scope.chatroom.publishDate);
		    $scope.chatroom.invalidate = new Date($scope.chatroom.invalidate);
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
	                    $scope.chatroom.imageUrl.push(resp.data.file.filename);
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
			$scope.chatroom.imageUrl.splice(index, 1);
			console.log(index);
		}
		//Pagination Table
		$scope.currentPage = 0;
	    $scope.pageSize = 10;
    	$scope.allItems = $scope.chatroom.comments;
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
	        for (var i = input; i < total; i++) {
	            if (i != 0 && i != total - 1) {
	                ret.push(i);
	            }
	        }
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
angular.module('meanWebApp').requires.push('chatroom');
