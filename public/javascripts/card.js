var card = angular.module('card',['ui.router','ui.bootstrap']);

card.config([
'$stateProvider',
'$urlRouterProvider',
function($stateProvider, $urlRouterProvider) {

  $stateProvider
  	.state('cardscreate', {
      url: '/cards/create',
      templateUrl: 'views/cards_create.ejs',
      controller: 'CardCtrl',
      onEnter: ['$state', 'auth', function ($state, auth) {
      	if (!auth.isLoggedIn()) {
      		$state.go('login');
      	};
      }]
    })
    .state('cardslist', {
      url: '/cards',
      templateUrl: 'views/cards_list.ejs',
      controller: 'CardCtrl',
      onEnter: ['$state', 'auth', function ($state, auth) {
      	if (!auth.isLoggedIn()) {
      		$state.go('login');
      	};
      }],
      resolve: {
			cardPromise : ['cards', function (cards) {

					return cards.getAll();
				}]
		}
    })
    .state('cardsedit', {
			url: '/cards/:cardId/edit',
			templateUrl: 'views/cards_edit.ejs',
			controller: 'CardEditCtrl',
			resolve: {
				cardinfo: ['$stateParams', 'cards', function($stateParams, cards){
					console.log('edit: '+$stateParams.cardId);
					return cards.get($stateParams.cardId);
				}],
				cardPromise: ['$stateParams', 'cards', function($stateParams, cards){
					console.log('get logs: '+$stateParams.cardId);
					return cards.getLogs($stateParams.cardId);
				}]
			}
	});
}]);
card.factory('cards', ['$state', '$http', 'auth', function ($state, $http, auth) {
	var oCards = {
		cards: [],
		logs: []
	};

	oCards.get = function (id) {
		// body...
		return $http.get('/cards/'+id).then(function (res) {
			return res.data;
		});
	};
	oCards.getAll = function () {
		return $http.get('/cards',{
			headers: {Authorization: 'Bearer '+auth.getToken()}}).success(function (data) {
			// body...
			angular.copy(data, oCards.cards);
		});
	};
	oCards.getLogs = function (id) {
		return $http.get('/logs/cardLogs/'+id,{
			headers: {Authorization: 'Bearer '+auth.getToken()}}).success(function (data) {
			// body...
			console.log(data);
			angular.copy(data, oCards.logs);

		});
	};
	oCards.getAdmins = function () {
		return $http.get('/users',{
			headers: {Authorization: 'Bearer '+auth.getToken()}}).success(function (data) {
			// body...

			angular.copy(data, oCards.admins);
		});
	};
	oCards.create = function (user, businessId) {
		
		return $http.post('/cards', {user:user, business:businessId});
	};
	oCards.update = function (card) {
		console.log(card);
		return $http.put('/cards/'+card._id, card);
	};
	oCards.gainPoint = function (card) {
		console.log(card);
		return $http.put('/cards/'+card._id+'/gainPoint', card);
	};
	oCards.validCard = function (card) {
		console.log(card);
		return $http.put('/cards/'+card._id+'/validCard', card);
	};
	oCards.tierUp = function (card) {
		console.log(card);
		return $http.put('/cards/'+card._id+'/tierUp', card);
	};
	oCards.tierDown = function (card) {
		console.log(card);
		return $http.put('/cards/'+card._id+'/tierDown', card);
	};
	oCards.remove = function (cardId) {
		return $http.delete('/cards/'+cardId)
		.success(function (data) {
			// body...
			index = oCards.cards.indexOf(data);
			oCards.cards.splice(index, 1);
		});
	};
	oCards.qrGen = function (cardId, actionType, detail) {
		return $http.post('/cards/qrGen',{card: cardId, actionType:actionType, detail: detail, sender: auth.currentUser()._id});	
	};
	oCards.checkQRAuth = function (qrAuthId) {
		return $http.get('/cards/qrAuth/'+qrAuthId);	
	};
	return oCards;
}]);

card.controller('CardCtrl', [
	'$scope',
	'$state',
	'auth',
	'cards',
	function ($scope, $state, auth, cards) {
		$scope.cards = cards.cards;
		$scope.create = function () {

			if (!$scope.user || !$scope.user.username || !$scope.user.password) {
				$scope.error = {message: 'Please fill all blank field'};
				return;
			}

			cards.create($scope.user, auth.currentUser().business).success(function (data) {
				console.log(data);
				$state.go('shopsedit({shopId:auth.currentUser().business})');
			}).error(function (err) {
				$scope.error = err;
			});
		};
		$scope.remove = function (cardId) {
			console.log('remove: ' + cardId);
			cards.remove(cardId).error(function (err) {
				$scope.error = err;
			});
		};
		//datepicker

		  $scope.clear = function() {
		    $scope.publishDate = null;
		  };

		  $scope.dateOptions = {
		    dateDisabled: disabled,
		    formatYear: 'yy',
		    maxDate: new Date(),
		    minDate: new Date(1916, 1, 11),
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

		  $scope.formats = ['dd-MMMM-yyyy', 'yyyy/MM/dd', 'dd.MM.yyyy', 'shortDate'];
		  $scope.format = $scope.formats[0];
		  $scope.altInputFormats = ['M!/d!/yyyy'];

		  $scope.popup1 = {
		    opened: false
		  };

		//datepicker
}])
.controller('CardEditCtrl', [
	'$scope',
	'$state',
	'$interval',
	'auth',
	'cards',
	'cardinfo',
	function ($scope, $state, $interval, auth, cards, cardinfo) {
		var checkPromise;
		$scope.card = cardinfo;
		$scope.logs = cards.logs;
		$scope.point = "0";
		$scope.showGain = false;
	    $scope.plusModal = function(){
	        $scope.showGain = !$scope.showGain;
	    };
	    $scope.showRedeem = false;
	    $scope.redeemModal = function(){
	    	$scope.qr = undefined;
	    	$scope.qrExpire = false;
	    	$scope.point = "0";
	    	$scope.showRedeem = !$scope.showRedeem;
	        
	    };
	    $scope.checkQRAuth = function (qrId) {
	    	cards.checkQRAuth(qrId).success(function (data) {
	    		console.log(data);
	    		
	    		if (data.authroized == false && $scope.showRedeem == true) {
	    			//$interval.cancel(checkPromise);
	    			
	    			var created = new Date(data.created);
					if (Date.now() > created.getTime()+data.timelife) { 
						console.log('exp');
						$scope.qrExpire = true; 
					}	
					else {
						console.log('alife');
						$scope.qrExpire = false;
						$scope.checkQRAuth(qrId);
					}
	    		} else if (data.authroized == true) {
	    			$scope.qr = data;
	    			$scope.card.point -= parseInt(data.detail);
	    			cards.logs.unshift({created:new Date(), action:'redeemPoint', detail:parseInt(data.detail) });
	    			$scope.search();
	    		}
	    	}).error(function (err) {
	    		//$interval.cancel(checkPromise);
	    		$scope.error = err;
	    	});
	    };

	    $scope.$on('$destroy', function() {
	    	$interval.cancel(checkPromise);
	    });
	    $scope.$watch(function () {
	    	return $scope.showRedeem;
	    }, function (newValue, old) {
	    	if (old == true && newValue == false) {
	    		$interval.cancel(checkPromise);

	    	}
	    });
	    //Pagination Table
		$scope.currentPage = 0;
	    $scope.pageSize = 10;
    	$scope.allItems = cards.logs;
    	$scope.reverse = false;

    	$scope.init = function () {
    		$scope.search();
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

	   
		//Pagination Table

		console.log(cardinfo);
		$scope.gainPoint = function (point) {
			console.log(point);
			if (isNaN(point) || parseInt(point) <= 0) {
				$scope.error = {message: 'Please fill number > 0'};
				return;
			}

			$scope.card.gainPoint = parseInt(point);
			cards.gainPoint($scope.card).success(function (data) {
				$scope.card.point += parseInt(point);
				$scope.showModal = false;
				cards.logs.unshift({created:new Date(), action:'gainPoint', detail:parseInt(point) });
			}).error(function (err) {
				$scope.error = err;
			});
		}

		$scope.redeemPoint = function (point) {
			if (isNaN(point)) {
				$scope.showRedeem = false;
				$scope.error = {message: '請輸入數值'};
			}
			else if (parseInt(point) <= 0) {
				$scope.showRedeem = false;
				$scope.error = {message: '數值需為正數'};
			}
			else if (parseInt($scope.card.point) < parseInt(point)) {
				$scope.showRedeem = false;
				$scope.error = {message: '積分不足'};
			}
	    	else {
	    		cards.qrGen($scope.card._id, 'redeemPoint', point).success(function (data) {
		    		
		    		$scope.qr = data;
		    		// checkPromise = $interval(function () {
		    		// 	$scope.checkQRAuth($scope.qr._id);
		    		// }, 3000);
		    		$scope.checkQRAuth($scope.qr._id);
		    	}).error(function (err) {
		    		$scope.showRedeem = false;
		    		$scope.error = err;
		    	});
		    }
		}

		$scope.validCard = function () {
			$scope.card.valid = true;
			cards.validCard($scope.card).success(function (data) {
				$scope.showModal = false;
				cards.logs.unshift({created:new Date(), action:'validCard', detail:true });
			}).error(function (err) {
				$scope.error = err;
				$scope.card.valid = false;
			});
		}

		$scope.tierUp = function () {
			cards.tierUp($scope.card).success(function (data) {
				$scope.card = data;
				cards.logs.unshift({created:new Date(), action:'tierUp', detail:data.tier });
			}).error(function (err) {
				$scope.error = err;
			});
		}

		$scope.tierDown = function () {
			cards.tierDown($scope.card).success(function (data) {
				$scope.card = data;
				cards.logs.unshift({created:new Date(), action:'tierDown', detail:data.tier });
			}).error(function (err) {
				$scope.error = err;
			});
		}

		$scope.update = function () {

			if (!$scope.card || !$scope.card.business ||
				!$scope.card.type || !$scope.card.region) {
				$scope.error = {message: 'Please fill all blank field'};
				return;
			}
			
			cards.update($scope.card).error(function (err) {
				$scope.error = err;
			});
		};

		$scope.convertToDate = function (stringDate){
		  var dateOut = new Date(stringDate);
		  return dateOut;
		};

		$scope.convertToAction = function (action){
		  if (action == 'gainPoint') {
		  	$scope.actionStyle = {color:'#00EC00'};
		  	return '獲得積分';
		  } else if (action == 'redeemPoint') {
		  	$scope.actionStyle = {color:'red'};
		  	return '兌換積分';
		  } else if (action == 'validCard') {
		  	$scope.actionStyle = {color:'blue'};
		  	return '驗證會員';
		  } else if (action == 'tierUp') {
		  	$scope.actionStyle = {color:'#EAC100'};
		  	return '會員升級';
		  } else if (action == 'tierDown') {
		  	$scope.actionStyle = {color:'#7B7B7B'};
		  	return '會員降級';
		  } else {
		  	return action;
		  }
		};

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
card.directive('modal', function () {
    return {
      template: '<div class="modal fade">' + 
          '<div class="modal-dialog modal-sm">' + 
            '<div class="modal-content">' + 
              '<div class="modal-header">' + 
                '<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>' + 
                '<h4 class="modal-title">{{ title }}</h4>' + 
              '</div>' + 
              '<div class="modal-body" ng-transclude></div>' + 
            '</div>' + 
          '</div>' + 
        '</div>',
      restrict: 'E',
      transclude: true,
      replace:true,
      scope:true,
      link: function postLink(scope, element, attrs) {
        scope.title = attrs.title;

        scope.$watch(attrs.visible, function(value){
          if(value == true)
            $(element).modal('show');
          else
            $(element).modal('hide');
        });

        $(element).on('shown.bs.modal', function(){
          scope.$apply(function(){
            scope.$parent[attrs.visible] = true;
          });
        });

        $(element).on('hidden.bs.modal', function(){
          scope.$apply(function(){
            scope.$parent[attrs.visible] = false;
          });
        });
      }
    };
});

angular.module('meanWebApp').requires.push('card');
