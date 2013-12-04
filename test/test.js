//
// use as: node test.js "your_regex_here" > output.txt

var echo = console.log;
var Analyzer = require('../build/regexanalyzer.js');
var regex = process.argv[2] || /^(?:[^\u0000-\u1234a-zA-Z\d\-\.\*\+\?\^\$\{\}\(\)\|\[\]\/\\]+)|abcdef\u1234{1,}/gmi;

var anal = new Analyzer(regex);

// test it
anal.analyze();

echo("Input: " + regex.toString());
echo();
echo("Regular Expression: " + anal.regex);
echo();
echo("Regular Expression Flags: ");
echo(anal.flags);
echo();
echo("Regular Expression Parts: ");
echo(JSON.stringify(anal.parts, null, 4));
    
