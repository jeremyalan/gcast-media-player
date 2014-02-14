var log = function (message) {
   var item = $('<li></li>');
   item.html(message);

   $('ul.log').append(item);
};

var session = null;
var media = null;

sessionListener = function (e) {
   log('Resuming current session');

   session = e;

   if (session.media.length !== 0) {
      log('Retrieving current media');
      media = session.media[0];
   }
};

receiverListener = function (e) {
   log('Listener status: ' + e);
};

var initializeCast = function () {
   log('Initializing...');

   var sessionRequest = new chrome.cast.SessionRequest(chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID);
   var apiConfig = new chrome.cast.ApiConfig(sessionRequest, sessionListener, receiverListener);
   
   chrome.cast.initialize(apiConfig, 
      function () {
         log('Initialization has completed successfully');
      },
      function () {
         log('Unable to initialize');
      });
};

var createSession = function () {
   log('Attempting to create session...');
   
   chrome.cast.requestSession(
      function (s) {
         log('Session created');
         session = s;

         if (session.media.length !== 0) {
            media = session.media[0];
         }
      },
      function () {
         log('Unable to create session');
      });
};

var retrieveMedia = function (url) {
   if (session === null) {
      log('Unable to retrieve media, no active session');
      return;
   }

   var mediaInfo = new chrome.cast.media.MediaInfo(url);
   mediaInfo.contentType = 'text/html';
  
   var request = new chrome.cast.media.LoadRequest(mediaInfo);
   
   session.loadMedia(request,
      function (m) {
         log('Media retrieved');
         media = m;
      },
      function () {
         log('Unable to retrieve media');
      }
   );
};

var playMedia = function () {
   if (media === null) {
      log('Unable to play, media has not been loaded.');
      return;
   }

   log('Playing media...');

   media.play(null,
      function () {
         log('Play succeeded.');
      },
      function () {
         log('Play failed.');
      }
   );
};

var pauseMedia = function () {
   if (media === null) {
      log('Unable to pause, media has not been loaded.');
      return;
   }

   log('Pausing media...');

   media.pause(null,
      function () {
         log('Pause succeeded.');
      },
      function () {
         log('Pause failed.');
      });
};

var stopMedia = function () {
   if (media === null) {
      log('Unable to stop, media has not been loaded.');
      return;
   }

   log('Stopping media...');

   media.stop(null,
      function () {
         log('Stop succeeded.');
         media = null;
      },
      function () {
         log('Stop failed.');
      });
};

var seekMedia = function (delta) {
   if (media === null) {
      log('Unable to seek, media has not been loaded.');
      return;
   }

   log('Seeking media...');

   var request = new chrome.cast.media.SeekRequest();
   request.currentTime = media.currentTime + delta;
   
   media.seek(request,
      function () {
         log('Seek succeeded.');
      },
      function () {
         log('Seek failed.');
      }
   );
};

$(function () {
   $('.initialize').click(function (e) {
      e.preventDefault();
      initializeCast();
   });

   $('.connect-to-cast').click(function (e) {
      e.preventDefault();
      createSession();
   });

   $('.retrieve-media').click(function (e) {
      e.preventDefault();
      
      var url = $('input.media-url').val();
      retrieveMedia(url);
   });

   $('.play-media').click(function (e) {
      e.preventDefault();

      playMedia();
   });

   $('.pause-media').click(function (e) {
      e.preventDefault();

      pauseMedia();
   });

   $('.stop-media').click(function (e) {
      e.preventDefault();

      stopMedia();
   });

   $('.seek-back-10').click(function (e) {
      e.preventDefault();

      seekMedia(-10);
   });

   $('.seek-forward-10').click(function (e) {
      e.preventDefault();

      seekMedia(10);
   });
});