var card = angular.module('card',['ui.router','datatables']);

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
	oCards.create = function (card) {
		
		return $http.post('/cards', card).success(function (data) {
			$state.go('cardslist');
		});
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

	return oCards;
}]);

card.controller('CardCtrl', [
	'$scope',
	'$state',
	'auth',
	'cards',
	function ($scope, $state, auth, cards) {
		$scope.types = types.types;
		$scope.cards = cards.cards;
		$scope.create = function () {

			if (!$scope.card || !$scope.card.business ||
				!$scope.card.type || !$scope.card.region || !$scope.card.serialNumber) {
				$scope.error = {message: 'Please fill all blank field'};
				return;
			}
			if (isNaN(parseInt($scope.card.serialNumber,10)) || parseInt($scope.card.serialNumber,10) > 100000 || parseInt($scope.card.serialNumber,10) <= 0) {
				$scope.error = {message: 'Serial Number should between 1 ~ 100000'};
				return;
			}
			
			cards.create($scope.card).error(function (err) {
				$scope.error = err;
			});
		};
		$scope.remove = function (cardId) {
			console.log('remove: ' + cardId);
			cards.remove(cardId).error(function (err) {
				$scope.error = err;
			});
		};
}])
.controller('CardEditCtrl', [
	'$scope',
	'$state',
	'auth',
	'cards',
	'cardinfo',
	function ($scope, $state, auth, cards, cardinfo) {
		$scope.card = cardinfo;
		$scope.logs = cards.logs;
		$scope.point = "0";
		$scope.showModal = false;
	    $scope.toggleModal = function(){
	        $scope.showModal = !$scope.showModal;
	    };

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
	        $scope.ItemsByPage = paged( $scope.allItems, $scope.pageSize );  
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
          '<div class="modal-dialog">' + 
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
