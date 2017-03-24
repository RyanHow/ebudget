var replace = require('replace-in-file');

function formatDate(date) {
    var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
}

var version = process.env.npm_package_version;
var buildDate = formatDate(new Date());

console.log("Injecting version: " + version + ", build date:" + buildDate);

var result = replace.sync({
  files: ['www/build/main.js', 'www/service-worker.js', 'www/info.json'], 
  from: ['%BUILD_INFO_VERSION%', '%BUILD_INFO_BUILD_DATE_YYYYMMDD%'],
  to: [version, buildDate]
});

if (!result || !result.length) throw new Error("Build info not updated");

console.log("Injected in files: " + result);
