var mailgun_api_key = 'key-0a6b05e10e34d7685ef85a5bc0fd41f9';
var mailgun_domain = 'app.freedombudgetapp.com';
var mailgun = require('mailgun-js')({apiKey: mailgun_api_key, domain: mailgun_domain});

var data = {
    from: 'Freedom Budget <noreply@app.freedombudgetapp.com>',
    to: 'ryan@bitworks.com.au',
    subject: 'New Android Build',
    text: 'New Android build attached',
    attachment: "platforms/android/build/outputs/apk/android-debug.apk"
};

console.log('Emailing android-debug.apk...');
mailgun.messages().send(data, function (error, body) {
    console.log(body);
    if (error) {
        console.log(error);
        process.exit(1);
    }
});
