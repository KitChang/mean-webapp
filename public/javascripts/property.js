var property = angular.module('property',['ui.router']);

property.config([
'$stateProvider',
'$urlRouterProvider',
function($stateProvider, $urlRouterProvider) {

  $stateProvider
  	.state('propertyscreate', {
      url: '/propertys/create',
      templateUrl: 'views/propertys_create.ejs',
      controller: 'PropertyCtrl',
      onEnter: ['$state', 'auth', function ($state, auth) {
      	if (!auth.isLoggedIn()) {
      		$state.go('login');
      	};
      }]
    })
    .state('propertyslist', {
      url: '/propertys',
      templateUrl: 'views/propertys_list.ejs',
      controller: 'PropertyCtrl',
      onEnter: ['$state', 'auth', function ($state, auth) {
      	if (!auth.isLoggedIn()) {
      		$state.go('login');
      	};
      }],
      resolve: {
			propertyPromise : ['propertys', function (propertys) {

					return propertys.getAll();
				}]
		}
    })
    .state('propertysedit', {
			url: '/propertys/:propertyId/edit',
			templateUrl: 'views/propertys_edit.ejs',
			controller: 'PropertyEditCtrl',
			resolve: {
				propertyinfo: ['$stateParams', 'propertys', function($stateParams, propertys){
					console.log('edit: '+$stateParams.propertyId);
					return propertys.get($stateParams.propertyId);
				}]
			}
	});
}]);
property.factory('propertys', ['$state', '$http', 'auth', function ($state, $http, auth) {
	var oPropertys = {
		propertys: []
	};

	oPropertys.get = function (id) {
		// body...
		return $http.get('/propertys/'+id).then(function (res) {
			return res.data;
		});
	};
	oPropertys.getAll = function () {
		return $http.get('/propertys').success(function (data) {
			// body...
			angular.copy(data, oPropertys.propertys);
		});
	};
	oPropertys.create = function (property) {
		
		return $http.post('/propertys', property).success(function (data) {
			$state.go('propertyslist');
		});
	};
	oPropertys.update = function (property) {
		console.log(property);
		return $http.put('/propertys/'+property._id, property).success(function (data) {
			$state.go('propertyslist');
		});
	};
	oPropertys.remove = function (propertyId) {
		return $http.delete('/propertys/'+propertyId)
		.success(function (data) {
			// body...
			index = oPropertys.propertys.indexOf(data);
			oPropertys.propertys.splice(index, 1);
		});
	};

	return oPropertys;
}]);

property.controller('PropertyCtrl', [
	'$scope',
	'$state',
	'auth',
	'regions',
	'propertys',
	function ($scope, $state, auth, regions, propertys) {
		$scope.regions = regions.regions;
		$scope.propertys = propertys.propertys;
		$scope.create = function () {

			if (!$scope.property || !$scope.property.displayTitle ||
				!$scope.property.layout || !$scope.property.area ||
				!$scope.property.layer ||!$scope.property.region ||
				!$scope.property.street || !$scope.property.rent ||
				!$scope.property.latitude || !$scope.property.longitude ||
				$scope.property.subRegion == '' || !$scope.property.subRegion) {
				$scope.error = {message: 'Please fill all blank field'};
				return;
			}
			
			propertys.create($scope.property).error(function (err) {
				$scope.error = err;
			});
		};
		$scope.remove = function (propertyId) {
			console.log('remove: ' + propertyId);
			propertys.remove(propertyId).error(function (err) {
				$scope.error = err;
			});
		};
		$scope.populateSubRegion = function () {
			console.log($scope.property.region);
			if ($scope.property.region == null) {
				$scope.subRegions = [];
				return;
			};
			var selectedRegion = regions.regions.filter(function (obj) {
				return obj.name == $scope.property.region;
			})[0];
			$scope.subRegions = selectedRegion.subRegions;
			$scope.property.subRegion = '';
		};
}])
.controller('PropertyEditCtrl', [
	'$scope',
	'$state',
	'auth',
	'regions',
	'propertys',
	'propertyinfo',
	function ($scope, $state, auth, regions, propertys, propertyinfo) {
		$scope.property = propertyinfo;
		$scope.regions = regions.regions;
		var selectedRegion = regions.regions.filter(function (obj) {
				return obj.name == $scope.property.region;
			})[0];
			$scope.subRegions = selectedRegion.subRegions;

		$scope.populateSubRegion = function () {
			console.log($scope.property.region);
			if ($scope.property.region == null) {
				$scope.subRegions = [];
				return;
			};
			var selectedRegion = regions.regions.filter(function (obj) {
				return obj.name == $scope.property.region;
			})[0];
			$scope.subRegions = selectedRegion.subRegions;
			$scope.property.subRegion = '';
		};
		$scope.update = function () {

			if (!$scope.property || !$scope.property.displayTitle ||
				!$scope.property.layout || !$scope.property.area ||
				!$scope.property.layer ||!$scope.property.region ||
				!$scope.property.street || !$scope.property.rent ||
				!$scope.property.latitude || !$scope.property.longitude ||
				$scope.property.subRegion == '' || !$scope.property.subRegion) {
				$scope.error = {message: 'Please fill all blank field'};
				return;
			}
			
			propertys.update($scope.property).error(function (err) {
				$scope.error = err;
			});
		};
}]);

angular.module('meanWebApp').requires.push('property');
