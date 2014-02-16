(function () {

var ManageMediaItemsCtrl = function($scope, $mediaItemsService, $modalInstance) {
   $scope.model = {};

   var refreshMediaItems = function () {
      $mediaItemsService.retrieve().then(function (mediaItems) {
         $scope.mediaItems = mediaItems;
      })
   };

   $scope.addMediaItem = function () {
      if (!$scope.model.newMediaName) {
         alert ('Please enter the name.');
         return;
      }

      if (!$scope.model.newMediaUrl) {
         alert ('Please enter the URL.');
         return;
      }

      if (!$scope.model.newMediaType) {
         alert ('Please select the media type.');
         return;
      }

      $mediaItemsService.add({
         Name: $scope.model.newMediaName,
         MediaUrl: $scope.model.newMediaUrl,
         MediaType: $scope.model.newMediaType
      }).then(function () {
         $scope.model.newMediaName = null;
         $scope.model.newMediaUrl = null;
         $scope.model.newMediaType = null;

         refreshMediaItems();
      });
   };

   $scope.removeMediaItem = function (mediaItem) {
      $mediaItemsService.remove(mediaItem.Id)
         .then(function () {
            refreshMediaItems();
         });
   };

   $scope.cancel = function () {
      $modalInstance.close(null);
   };

   refreshMediaItems();
};

ManageMediaItemsCtrl.$inject = ['$scope', '$mediaItemsService', '$modalInstance'];

angular.module('gcast-media-player')
   .controller('ManageMediaItemsCtrl', ManageMediaItemsCtrl);

} ());