var shop = angular.module('shop',['ui.router']);

shop.config([
'$stateProvider',
'$urlRouterProvider',
function($stateProvider, $urlRouterProvider) {

  $stateProvider
  	.state('shopscreate', {
      url: '/shops/create',
      templateUrl: 'views/shops_create.ejs',
      controller: 'ShopCtrl',
      onEnter: ['$state', 'auth', function ($state, auth) {
      	if (!auth.isLoggedIn()) {
      		$state.go('login');
      	};
      }]
    })
    .state('shopslist', {
      url: '/shops',
      templateUrl: 'views/shops_list.ejs',
      controller: 'ShopCtrl',
      onEnter: ['$state', 'auth', function ($state, auth) {
      	if (!auth.isLoggedIn()) {
      		$state.go('login');
      	};
      }],
      resolve: {
			shopPromise : ['shops', function (shops) {

					return shops.getAll();
				}]
		}
    })
    .state('shopsedit', {
			url: '/shops/:shopId/edit',
			templateUrl: 'views/shops_edit.ejs',
			controller: 'ShopEditCtrl',
			resolve: {
				shopPromise : ['shops', function (shops) {
					console.log('getAdmins');
					return shops.getAdmins();
				}],
				shopinfo: ['$stateParams', 'shops', function($stateParams, shops){
					console.log('edit: '+$stateParams.shopId);
					return shops.get($stateParams.shopId);
				}]
			}
	})
}]);
shop.factory('shops', ['$state', '$http', 'auth', function ($state, $http, auth) {
	var oShops = {
		shops: [],
		admins: []
	};

	oShops.get = function (id) {
		// body...
		return $http.get('/shops/'+id).then(function (res) {
			return res.data;
		});
	};
	oShops.getAll = function () {
		return $http.get('/shops',{
			headers: {Authorization: 'Bearer '+auth.getToken()}}).success(function (data) {
			// body...
			angular.copy(data, oShops.shops);
		});
	};
	oShops.getAdmins = function () {
		return $http.get('/users',{
			headers: {Authorization: 'Bearer '+auth.getToken()}}).success(function (data) {
			// body...

			angular.copy(data, oShops.admins);
		});
	};
	oShops.create = function (shop) {
		
		return $http.post('/shops', shop).success(function (data) {
			$state.go('shopslist');
		});
	};
	oShops.update = function (shop) {
		console.log(shop);
		return $http.put('/shops/'+shop._id, shop).success(function (data) {
			alert("修改成功");
		});
	};
	oShops.remove = function (shopId) {
		return $http.delete('/shops/'+shopId)
		.success(function (data) {
			// body...
			index = oShops.shops.indexOf(data);
			oShops.shops.splice(index, 1);
		});
	};

	return oShops;
}]);

shop.controller('ShopCtrl', [
	'$scope',
	'$state',
	'auth',
	'regions',
	'shops',
	'types',
	function ($scope, $state, auth, regions, shops, types) {
		$scope.regions = regions.regions;
		$scope.types = types.types;
		$scope.shops = shops.shops;
		$scope.create = function () {

			if (!$scope.shop || !$scope.shop.business ||
				!$scope.shop.type || !$scope.shop.region || !$scope.shop.serialNumber) {
				$scope.error = {message: 'Please fill all blank field'};
				return;
			}
			if (isNaN(parseInt($scope.shop.serialNumber,10)) || parseInt($scope.shop.serialNumber,10) > 100000 || parseInt($scope.shop.serialNumber,10) <= 0) {
				$scope.error = {message: 'Serial Number should between 1 ~ 100000'};
				return;
			}
			
			shops.create($scope.shop).error(function (err) {
				$scope.error = err;
			});
		};
		$scope.remove = function (shopId) {
			console.log('remove: ' + shopId);
			shops.remove(shopId).error(function (err) {
				$scope.error = err;
			});
		};
}])
.controller('ShopEditCtrl', [
	'$scope',
	'$state',
	'auth',
	'regions',
	'shops',
	'shopinfo',
	'types',
	'$filter',
	function ($scope, $state, auth, regions, shops, shopinfo, types, $filter) {
		$scope.isAdmin = auth.isAdmin;
		$scope.shop = shopinfo;
		$scope.types = types.types;
		$scope.regions = regions.regions;
		$scope.admins = shops.admins;
		$scope.showModal = false;
	    $scope.toggleModal = function(){
	        $scope.showModal = !$scope.showModal;
	    };

	    //Pagination Table
		$scope.currentPage = 0;
	    $scope.pageSize = 10;
    	$scope.allItems = shopinfo.members;
    	$scope.reverse = false;

    	$scope.init = function () {
    		$scope.sort('owner.username');
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
	              
	        if(sortBy === 'owner.username')
	        {
	            $scope.Header[0] = iconName;
	        }
	        else if(sortBy === 'number')
	        {
	            $scope.Header[1] = iconName;
	        }else if(sortBy === 'tier'){
	            $scope.Header[2] = iconName;
	        } else if(sortBy === 'valid'){
	            $scope.Header[3] = iconName;
	        } else if(sortBy === 'point'){
	            $scope.Header[4] = iconName;
	        }
	         
	        $scope.reverse = !$scope.reverse;   
	        
	        $scope.pagination();    
	    };

	    $scope.filterExp = function (searchText) {
	    	return function(member, index) {
			    return (member.owner.username.indexOf(searchText) > -1 || member.number.indexOf(searchText) > -1)
			  };
	    }
		//Pagination Table

		console.log(shopinfo);
		var selectedRegion = regions.regions.filter(function (obj) {
				return obj.name == $scope.shop.region;
			})[0];
			$scope.subRegions = selectedRegion.subRegions;

		$scope.update = function () {

			if (!$scope.shop || !$scope.shop.business ||
				!$scope.shop.type || !$scope.shop.region) {
				$scope.error = {message: 'Please fill all blank field'};
				return;
			}
			
			shops.update($scope.shop).error(function (err) {
				$scope.error = err;
			});
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

function searchUtil(item, toSearch) {
    /* Search Text in all 3 fields */
    return (item.owner.username.toLowerCase().indexOf(toSearch.toLowerCase()) > -1) ? true : false;
}
//Pagination table

angular.module('meanWebApp').requires.push('shop');
