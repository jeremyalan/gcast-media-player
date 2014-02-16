(function () {

var module = angular.module('gcast-media-player', ['ui.bootstrap']);

var MainCtrl = function($scope, $modal, $mediaItemsService) {
   var gcastSession = null;
   var gcastMedia = null;
   var currentMediaId = null;

   var refreshMediaItems = function () {
      $mediaItemsService.retrieve().then(function (mediaItems) {
         $scope.mediaItems = mediaItems;
      })
   };

   var sessionListener = function (e) {
      gcastSession = e;

      if (gcastSession.media.length !== 0) {
         gcastMedia = gcastSession.media[0];
      }
   };

   var receiverListener = function (e) { };

   var initializeCast = function (onSuccess) {
      var sessionRequest = new chrome.cast.SessionRequest(chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID);
      var apiConfig = new chrome.cast.ApiConfig(sessionRequest, sessionListener, receiverListener);
      
      chrome.cast.initialize(apiConfig, 
         function () {
            onSuccess && onSuccess();
         });
   };

   var createSession = function (onSuccess) {
      if (gcastSession) {
         onSuccess && onSuccess();
         return;
      }

      chrome.cast.requestSession(
         function (s) {
            gcastSession = s;

            if (gcastSession.media.length !== 0) {
               gcastMedia = gcastSession.media[0];
            }

            onSuccess && onSuccess();
         });
   };

   var retrieveMedia = function (media) {
      var retrieveMediaCore = function () {
         var mediaInfo = new chrome.cast.media.MediaInfo(media.MediaUrl);
         mediaInfo.contentType = media.MediaType;
        
         var request = new chrome.cast.media.LoadRequest(mediaInfo);
         
         gcastSession.loadMedia(request,
            function (m) {
               gcastMedia = m;
               onSuccess && onSuccess();
            });
      };

      var retrieveMediaWithSession = function () {
         if (gcastMedia) {
            if (currentMediaId == mediaItem.Id) {
               onSuccess && onSuccess();
            }
            else {
               stopMedia(retrieveMediaCore);
            }
         }
         else {
            retrieveMediaCore();
         }
      };

      if (gcastSession === null) {
         createSession(retrieveMediaWithSession);
      }
      else {
         retrieveMediaWithSession();
      }
   };

   var playMedia = function (media, onSuccess) {
      var playMediaCore = function () {
         gcastMedia.play(null);
         onSuccess && onSuccess();
      };

      
   };

   var pauseMedia = function () {
      if (media === null) {
         log('Unable to pause, media has not been loaded.');
         return;
      }

      log('Pausing media...');

      gcastMedia.pause(null,
         function () {
            log('Pause succeeded.');
         },
         function () {
            log('Pause failed.');
         });
   };

   var stopMedia = function (onSuccess) {
      if (gcastMedia == null) {
         onSuccess && onSuccess();
         return;
      }

      gcastMedia.stop(null,
         function () {
            gcastMedia = null;
            onSuccess && onSuccess();
         });
   };

   var seekMedia = function (delta) {
      if (media === null) {
         log('Unable to seek, media has not been loaded.');
         return;
      }

      log('Seeking media...');

      var request = new chrome.cast.media.SeekRequest();
      request.currentTime = gcastMedia.currentTime + delta;
      
      gcastMedia.seek(request,
         function () {
            log('Seek succeeded.');
         },
         function () {
            log('Seek failed.');
         }
      );
   };

   $scope.manageMediaItems = function () {
      $modal.open({
         templateUrl: '/scripts/app/templates/ManageMediaItems.ng',
         controller: 'ManageMediaItemsCtrl'
      }).result.then(function () {
         refreshMediaItems();
      });
   };

   $scope.play = function () {
      var mediaItem = $scope.selectedMediaItem;

      if (!mediaItem) {
         alert ('Please select a media item to cast.');
         return;
      }

      playMedia(mediaItem);
   };

   $scope.seekBackward = function () {

   };

   $scope.seekForward = function () {

   };

   refreshMediaItems();
};

MainCtrl.$inject = ['$scope', '$modal', '$mediaItemsService'];

module.controller('MainCtrl', MainCtrl);

} ());