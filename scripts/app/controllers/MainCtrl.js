(function () {

var module = angular.module('gcast-media-player', ['ui.bootstrap']);

var MainCtrl = function($scope, $timeout, $modal, $mediaItemsService) {
   var gcastSession = null;
   var gcastMedia = null;
   var currentMediaId = null;

   $scope.errors = [];

   var init = function () {
      var sessionRequest = new chrome.cast.SessionRequest(chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID);
      var apiConfig = new chrome.cast.ApiConfig(sessionRequest, sessionListener, receiverListener);
      
      chrome.cast.initialize(apiConfig, function () {
         refreshMediaItems();
      });
   };

   var reportError = _.curry(function (message, error) {
      $scope.errors.push(message);
   });

   var refreshMediaItems = function () {
      $mediaItemsService.retrieve().then(function (mediaItems) {
         $scope.mediaItems = mediaItems;

         if ($scope.selectedMediaItem) {
            $scope.selectedMediaItem = _.find($scope.mediaItems, function (mediaItem) {
               return mediaItem.Id == $scope.selectedMediaItem.Id;
            });
         }
         else {
            $scope.selectedMediaItem = _($scope.mediaItems).sortBy('Name').first();
         }
      })
   };

   var sessionListener = function (e) {
      gcastSession = e;

      if (gcastSession.media.length !== 0) {
         gcastMedia = gcastSession.media[0];
      }
   };

   var receiverListener = function (e) { };

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
         },
         reportError('Unable to create Chromecast session'));
   };

   var retrieveMedia = function (media, onSuccess) {
      var retrieveMediaCore = function () {
         var mediaInfo = new chrome.cast.media.MediaInfo(media.MediaUrl);
         mediaInfo.contentType = media.MediaType;
        
         var request = new chrome.cast.media.LoadRequest(mediaInfo);
         
         gcastSession.loadMedia(request,
            function (m) {
               gcastMedia = m;
               currentMediaId = media.Id;
               
               onSuccess && onSuccess();
            },
            reportError('Unable to load media: ' + media.MediaUrl));
      };

      var retrieveMediaWithSession = function () {
         if (gcastMedia) {
            if (currentMediaId == media.Id) {
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

      if (!gcastSession) {
         createSession(retrieveMediaWithSession);
      }
      else {
         retrieveMediaWithSession();
      }
   };

   var playMedia = function (media, onSuccess) {
      var playMediaCore = function () {
         gcastMedia.play(null, angular.noop);
         onSuccess && onSuccess();
      };

      retrieveMedia(media, playMediaCore);
   };

   var pauseMedia = function (onSuccess) {
      if (!gcastMedia) {
         return;
      }

      gcastMedia.pause(null, function () {
         onSuccess && onSuccess();
      });
   };

   var seekMedia = function (delta, onSuccess) {
      if (!gcastMedia) {
         return;
      }

      var request = new chrome.cast.media.SeekRequest();
      request.currentTime = gcastMedia.currentTime + delta;
      
      gcastMedia.seek(request,
         function () {
            onSuccess && onSuccess();
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

   $scope.manageMediaItems = function () {
      $modal.open({
         templateUrl: 'scripts/app/templates/ManageMediaItems.ng',
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

      playMedia(mediaItem, function () {
         $scope.$digest();
      });
   };

   $scope.pause = function () {
      var mediaItem = $scope.selectedMediaItem;

      if (!mediaItem) {
         alert ('Please select a media item to cast.');
         return;
      }

      pauseMedia(function () {
         $scope.$digest();
      });
   };

   $scope.seekBackward = function () {
      seekMedia(-10, function () {
         $scope.$digest();
      });
   };

   $scope.seekForward = function () {
      seekMedia(10, function () {
         $scope.$digest();
      });
   };

   $scope.isPlaying = function () {
      if (!gcastMedia) {
         return false;
      }

      return gcastMedia.playerState == chrome.cast.media.PlayerState.PLAYING;
   };

   $timeout(init, 1500);
};

MainCtrl.$inject = ['$scope', '$timeout', '$modal', '$mediaItemsService'];

module.controller('MainCtrl', MainCtrl);

} ());