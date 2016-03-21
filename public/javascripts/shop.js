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
				shopinfo: ['$stateParams', 'shops', function($stateParams, shops){
					console.log('edit: '+$stateParams.shopId);
					return shops.get($stateParams.shopId);
				}]
			}
	});
}]);
shop.factory('shops', ['$state', '$http', 'auth', function ($state, $http, auth) {
	var oShops = {
		shops: []
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
	oShops.create = function (shop) {
		
		return $http.post('/shops', shop).success(function (data) {
			$state.go('shopslist');
		});
	};
	oShops.update = function (shop) {
		console.log(shop);
		return $http.put('/shops/'+shop._id, shop).success(function (data) {
			$state.go('shopslist');
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
				!$scope.shop.type || !$scope.shop.region) {
				$scope.error = {message: 'Please fill all blank field'};
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
	function ($scope, $state, auth, regions, shops, shopinfo, types) {
		$scope.shop = shopinfo;
		$scope.types = types.types;
		$scope.regions = regions.regions;
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

angular.module('meanWebApp').requires.push('shop');
