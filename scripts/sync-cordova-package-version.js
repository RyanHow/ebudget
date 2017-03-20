var xmlpoke = require('xmlpoke');
var packageJson = require('../package.json');


var xml = xmlpoke('config.xml', function(xml) { 
//    console.log(xml.toString());
    xml.addNamespace('w', 'http://www.w3.org/ns/widgets');
    xml.errorOnNoMatches();
    xml.ensure("w:widget/@version");
    xml.set('w:widget/@version', packageJson.version);
});