var exec = require('child_process').exec;

function checkwait() {
    exec('ionic package info', function (err, stdout, stderr) {
        process.stdout.write(".");
        
        if (stdout.indexOf("FAILED") > 0 || stderr.indexOf("FAILED") > 0) {
            console.log(stdout);
            console.log(stderr);
            throw "Build Error";
        }
        else if ((/BUILDING/m).test(stdout) || (/BUILDING/m).test(stderr)) {
            checkwait();
        }
        else if (stdout.indexOf("SUCCESS") > 0 || stderr.indexOf("SUCCESS") > 0) {
            console.log(stdout);
            console.log(stderr);
            // Exit Gracefully
        }
        else {
            console.log(stdout);
            console.log(stderr);
            throw "Invalid Output";
        }
    });
}

checkwait();