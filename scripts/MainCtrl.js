(function () {

var Controller = function($scope, $mediaItemService) {
   $scope.mediaItems = [];

   $scope.addMediaItem = function () {
      if (!$scope.newMediaName) {
         alert ('Please enter the name.');
      }

      if (!$scope.newMediaUrl) {
         alert ('Please enter the Media URL.');
      }

      if (!$scope.newMediaType) {
         alert ('Please select the media type.');
      }

      $scope.mediaItems.push({
         Name: $scope.newMediaName,
         MediaUrl: $scope.newMediaUrl,
         MediaType: $scope.newMediaType
      });
   };
};

angular.module('gcast-media-player')
   .controller('MainCtrl', Controller);

} ());