const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer');


var browser = puppeteer.launch({
    headless: false
})

function createPath(filePath){
    var sept = filePath.split(path.sep);
    for(var i = 1, len = sept.length; i < len; i++){
        sept[i] = path.join(sept[i-1], sept[i]);
        if(!fs.existsSync(sept[i])){
            fs.mkdirSync(sept[i]);
        }
    }
}
