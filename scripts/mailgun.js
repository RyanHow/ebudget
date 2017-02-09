var mailgun_api_key = 'key-0a6b05e10e34d7685ef85a5bc0fd41f9';
var mailgun_domain = 'app.freedombudgetapp.com';
var mailgun = require('mailgun-js')({apiKey: mailgun_api_key, domain: mailgun_domain});

module.exports = mailgun;