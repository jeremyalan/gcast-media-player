(function () {

var s4 = function() {
  return Math.floor((1 + Math.random()) * 0x10000)
             .toString(16)
             .substring(1);
};

var guid = function() {
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
         s4() + '-' + s4() + s4() + s4();
};

var GCastMediaPlayerDbProvider = function () {
   this.$get = ['$q', function ($q) {
      return {
         getDatabase: function () {
            var deferred = $q.defer();

            var request = indexedDB.open('gcast-media-player', 2);

            request.onerror = function(event) {
               // Handle errors.
            };

            request.onsuccess = function (event) {
               deferred.resolve(request.result);
            };

            request.onupgradeneeded = function(event) {
               var db = event.target.result;

               // Create an objectStore to hold media items. We're going to use 
               // "Id" as our key path because it's designed to be unique.
               var store = db.createObjectStore('gcast-media-items', { keyPath: 'Id' });

               // Use transaction oncomplete to make sure the objectStore creation is 
               // finished before adding data into it.
               store.transaction.oncomplete = function(event) {
                  deferred.resolve(db);
               };
            };

            return deferred.promise;
         }
      };
   }];
};

var MediaItemsService = function ($q, $gcastMediaPlayerDb) {
   this.retrieve = function () {
      var deferred = $q.defer();
      
      $gcastMediaPlayerDb.getDatabase().then(function (db) {
         var items = [];

         var transaction = db.transaction('gcast-media-items');

         transaction.oncomplete = function () {
            deferred.resolve(items);
         };

         transaction.objectStore('gcast-media-items').openCursor().onsuccess = function (event) {
            var cursor = event.target.result;

            if (cursor) {
               items.push(cursor.value);
               cursor.continue();
            }
         }
      });

      return deferred.promise;
   }

   this.add = function(info) {
      var deferred = $q.defer();

      var newItem = {
         Id: guid(),
         Name: info.Name,
         MediaUrl: info.MediaUrl,
         MediaType: info.MediaType
      };

      $gcastMediaPlayerDb.getDatabase().then(function (db) {
         var transaction = db.transaction(['gcast-media-items'], 'readwrite');
         var result;

         transaction.oncomplete = function () {
            deferred.resolve(result);
         };

         var request = transaction.objectStore('gcast-media-items')
            .add(newItem);

         request.onsuccess = function (event) {
            result = event.target.result;
         };
      });

      return deferred.promise;
   };

   this.remove = function (id) {
      var deferred = $q.defer();

      $gcastMediaPlayerDb.getDatabase().then(function (db) {
         var transaction = db.transaction(['gcast-media-items'], 'readwrite');

         transaction.oncomplete = function () {
            deferred.resolve(null);
         };

         var request = transaction.objectStore('gcast-media-items')
            .delete(id);
      })

      return deferred.promise;
   }
};

MediaItemsService.$inject = ['$q', '$gcastMediaPlayerDb'];

angular.module('gcast-media-player')
   .provider('$gcastMediaPlayerDb', GCastMediaPlayerDbProvider)
   .service('$mediaItemsService', MediaItemsService);

} ());