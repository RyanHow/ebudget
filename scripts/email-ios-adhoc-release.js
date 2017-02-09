var mailgun = require("./mailgun.js");

var fs = require('fs');
var url = fs.readFileSync("tmp/appsendrUrl.txt");

if (!url) throw "No URL";

var data = {
    from: 'Freedom Budget <noreply@app.freedombudgetapp.com>',
    to: 'ryan@bitworks.com.au',
    subject: 'New iOS Build',
    text: 'New iOS build for download: ' + url
};

mailgun.messages().send(data, function (error, body) {
    console.log(body);
    if (error) {
        console.log(error);
        throw new Error(error);
    }
});
