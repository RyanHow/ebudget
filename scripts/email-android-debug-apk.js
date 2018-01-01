var mailgun = require("./mailgun.js");

var data = {
    from: 'Freedom Budget <noreply@app.freedombudgetapp.com>',
    to: 'ryan@bitworks.com.au',
    subject: 'New Android Build',
    text: 'New Android build attached',
    //attachment: "platforms/android/build/outputs/apk/debug/android-debug.apk"
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
