(function () {

var module = angular.module('gcast-media-player', ['ui.bootstrap']);

var MainCtrl = function($scope, $modal, $mediaItemsService) {
   var refreshMediaItems = function () {
      $mediaItemsService.retrieve().then(function (mediaItems) {
         $scope.mediaItems = mediaItems;
      })
   };

   $scope.manageMediaItems = function () {
      $modal.open({
         templateUrl: '/scripts/app/templates/ManageMediaItems.ng',
         controller: 'ManageMediaItemsCtrl'
      }).result.then(function () {
         refreshMediaItems();
      });
   };

   refreshMediaItems();
};

MainCtrl.$inject = ['$scope', '$modal', '$mediaItemsService'];

module.controller('MainCtrl', MainCtrl);

} ());