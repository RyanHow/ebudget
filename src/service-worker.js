/**
 * Check out https://googlechrome.github.io/sw-toolbox/docs/master/index.html for
 * more info on how to use sw-toolbox to custom configure your service worker.
 */


'use strict';
importScripts('./build/sw-toolbox.js');

self.version = '%BUILD_INFO_VERSION%';

self.toolbox.options.cache = {
  name: 'eBudget-cache-' + self.version
};

self.addEventListener('install', function(event){
  console.log('installed! ' + self.version);
  send_message_to_all_clients(self.version + 'installed');
});


self.addEventListener('message', function(event){
    console.log("SW Received Message: " + JSON.stringify(event.data));
    if (event.data.versionCheck) {
      console.log("SW posting version " + self.version);
      event.ports[0].postMessage({version: self.version});      
    }
});


// Delete old caches
this.addEventListener('activate', function(event) {
  console.log('activated! ' + self.version);
  send_message_to_all_clients(self.version + 'activated');
  event.waitUntil(
    caches.keys().then(function(keyList) {
      return Promise.all(keyList.map(function(key) {
        if (key !== self.toolbox.options.cache.name) {
          return caches.delete(key);
        }
      }));
    })
  );
});

// pre-cache our key assets
self.toolbox.precache(
  [
    './build/main.js',
    './build/main.css',
    './build/polyfills.js',
    'index.html',
    'manifest.json'
  ]
);

// dynamically cache any other local assets
self.toolbox.router.any('/*', self.toolbox.cacheFirst);

// for any other requests go to the network, cache,
// and then only use that cached resource if your user goes offline
//self.toolbox.router.default = self.toolbox.networkFirst;

function send_message_to_client(client, msg){
    return new Promise((resolve, reject) => {
        var msg_chan = new MessageChannel();
        msg_chan.port1.onmessage = function(event){
            if(event.data.error){
                reject(event.data.error);
            }else{
                resolve(event.data);
            }
        };

        client.postMessage("SW Says: '"+msg+"'", [msg_chan.port2]);
    });
}


function send_message_to_all_clients(msg){
    clients.matchAll().then(clients => {
        clients.forEach(client => {
            send_message_to_client(client, msg).then(m => console.log("SW Received Message: "+m));
        })
    })
}
