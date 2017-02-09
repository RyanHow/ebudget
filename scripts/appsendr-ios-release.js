var fs = require('fs');
var exec = require('child_process').exec;

exec('appsendr create "platforms\\ios\\build\\release\\eBudget.ipa" com.ebudgetapp.live resources/icon.png', function (err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);

    var url = ((/URL:\s(.+)\b/m).exec(stdout)[1]);

    console.log("URL: " + url);

    if (!url) throw "No URL in output";

    if (! fs.existsSync("tmp")) fs.mkdirSync("tmp");
    fs.writeFileSync("tmp\\appsendrUrl.txt", url);
});
