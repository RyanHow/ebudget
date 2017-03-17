var KeyCDN = require('keycdn');
var keycdn = new KeyCDN('sk_prod_NjE4NDcwNGNkNTY5ZWE1ZWVk');
var zoneId = 56510;

console.log("Purging zone " + zoneId);

// purge zone cache
keycdn.get('zones/purge/' + zoneId + '.json', function(err, res) {
    console.log('GET zones/purge/' + zoneId + '.json');
    if (err) {
        console.trace(err);
    } else {
        console.dir(res);
    }
});