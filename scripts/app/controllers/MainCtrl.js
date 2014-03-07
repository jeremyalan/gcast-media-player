(function () {

var module = angular.module('gcast-media-player', ['ui.bootstrap']);

var MainCtrl = function($scope, $sce, $timeout, $modal, $mediaItemsService) {
   var gcastSession = null;
   var gcastMedia = null;
   var html5Video = null;
   var html5Audio = null;
   var currentMediaId = null;

   $scope.errors = [];

   var init = function () {
      var sessionRequest = new chrome.cast.SessionRequest(chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID);
      var apiConfig = new chrome.cast.ApiConfig(sessionRequest, sessionListener, receiverListener);
      
      refreshMediaItems();

      chrome.cast.initialize(apiConfig, angular.noop);
      
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
      });
   };

   var clearSession = function () {
      gcastSession = null;
      gcastMedia = null;
      currentMediaId = null;
   };

   var assignSession = function (session) {
      gcastSession = session;

      if (gcastSession) {
         gcastSession.addUpdateListener(function (isAlive) {
            if (!isAlive) {
               clearSession();
            }
         });

         if (gcastSession.media.length !== 0) {
            gcastMedia = gcastSession.media[0];
         }
      }
   };

   var sessionListener = function (s) {
      assignSession(s);
   };

   var receiverListener = function (e) {
      $scope.isAvailable = (e == 'available');
   };

   var createSession = function (onSuccess) {
      if (gcastSession) {
         onSuccess && onSuccess();
         return;
      }

      chrome.cast.requestSession(
         function (s) {
            assignSession(s);

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

               $scope.totalDuration = gcastMedia.media.duration;
               
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

   var seekMediaByPosition = function (positionInSeconds, onSuccess) {
      if (!gcastMedia) {
         return;
      }

      var request = new chrome.cast.media.SeekRequest();
      request.currentTime = positionInSeconds;
      
      gcastMedia.seek(request,
         function () {
            onSuccess && onSuccess();
         });
   };

   var seekMediaByOffset = function (delta, onSuccess) {
      if (!gcastMedia) {
         return;
      }

      seekMediaByPosition(gcastMedia.currentTime + delta, onSuccess);
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

   $scope.createSession = function () {
      createSession();
   }

   $scope.isSessionActive = function () {
      return !!gcastSession;
   }

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

      if (gcastSession) {
         playMedia(mediaItem, function () {
            $scope.$digest();
         });
      }
      else {
         if (mediaItem.MediaType == 'video/mp4') {
            $scope.html5Video = $sce.trustAsResourceUrl(mediaItem.MediaUrl);
         }
         else if (mediaItem.MediaType == 'audio/mp3') {
            $scope.html5Audio = $sce.trustAsResourceUrl(mediaItem.MediaUrl);
         }
      }
   };

   $scope.closeHtml5Media = function () {
      $scope.html5Video = null;
      $scope.html5Audio = null;
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
      seekMediaByOffset(-10, function () {
         $scope.$digest();
      });
   };

   $scope.seekForward = function () {
      seekMediaByOffset(10, function () {
         $scope.$digest();
      });
   };

   $scope.isPlaying = function () {
      if (!gcastMedia) {
         return false;
      }

      return gcastMedia.playerState == chrome.cast.media.PlayerState.PLAYING;
   };

   var suspendSeek = true;

   $scope.$watch('seekPosition', function (newValue) {
      if (!suspendSeek) {
         seekMediaByPosition(newValue);   
      }
   });

   var updateCurrentPosition = function () {
      if (gcastMedia) {
         suspendSeek = true;
         
         $scope.seekPosition = gcastMedia.currentTime;

         $timeout(function () {
            suspendSeek = false;
         }, 0);
      }

      $timeout(updateCurrentPosition, 1000);
   };

   updateCurrentPosition();

   suspendSeek = false;

   $timeout(init, 1500);
};

MainCtrl.$inject = ['$scope', '$sce', '$timeout', '$modal', '$mediaItemsService'];

module.controller('MainCtrl', MainCtrl);

} ());