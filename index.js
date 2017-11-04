const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer');
const program = require('commander');
const inquirer = require('inquirer');
const chalk = require('chalk');
const {URL} = require('url');

var command = program.command('start')
                    .description('爬取指定的url,保存为pdf,用来爬电子书不错')
                    .option('-u --url [url]', '需要爬取的url,多个url之间以'+path.delimiter+'分隔')
                    .option('-l --level [level]', '爬取层级，默认爬取当前层级')
                    .option('-t --target [target]', '文件保存目录')
                    .action(option => {
                        const promps = [];

                        if(!option.url){
                            promps.push({
                                type: 'input',
                                name: 'url',
                                message: '请输入爬取的url',
                                validate: function(input){
                                    if(!input){
                                        return 'url不能为空'
                                    }
                                    try{
                                        new URL(input)
                                    }catch(e){
                                        return 'url不合法'
                                    }
                                    return true;
                                }
                            })
                        }

                        if(!option.level){
                            promps.push({
                                type: 'input',
                                name: 'level',
                                message: '请输入爬取的层级',
                                default: 0,
                                validate: function(input){
                                    if(!/^\d+$/.test(input)){
                                        return '层级为数字'
                                    }
                                    return true;
                                }
                            })
                        }

                        if(!option.target){
                            promps.push({
                                type: 'input',
                                name: 'target',
                                message: '请输入存储目录',
                                default: process.cwd()
                            })
                        }

                        promps.push({
                            type: 'list',
                            name: 'format',
                            message: '保存文件格式',
                            default: 'pdf',
                            choices: ['pdf']
                        })

                        inquirer.prompt(promps).then(answers => {
                            start(answers)
                        })
                    })

start({
    url: 'http://www.baidu.com',
    level: 0,
    format: 'pdf',
    target: process.cwd()
})
async function start(config){
    var {urls, browser} = await init(config);
    work(config, urls, browser);
}


const strRegex = "^((https|http|ftp|rtsp|mms)?://)"
+ "?(([0-9a-z_!~*'().&=+$%-]+: )?[0-9a-z_!~*'().&=+$%-]+@)?" //ftp的user@ 
 + "(([0-9]{1,3}\.){3}[0-9]{1,3}" // IP形式的URL- 199.194.52.184 
 + "|" // 允许IP和DOMAIN（域名）
 + "([0-9a-z_!~*'()-]+\.)*" // 域名- www. 
 + "([0-9a-z][0-9a-z-]{0,61})?[0-9a-z]\." // 二级域名 
 + "[a-z]{2,6})" // first level domain- .com or .museum 
 + "(:[0-9]{1,4})?" // 端口- :80 
 + "((/?)|" // a slash isn't required if there is no file name 
 + "(/[0-9a-z_!~*'().;?:@&=+$,%#-]+)+/?)$"; 
const re=new RegExp(strRegex); 

async function work(config, urls, browser){
    while(true){
        var urlObj = urls.shift();
        if(!validate(urlObj)){
            continue;
        }

        var page = await browser.newPage();
        try{
            await page.goto(urlObj.url, {timeout: 3000});
        }catch(e){
            outputErrorMsg(formatMsg(urlObj, '网络请求超时'));
            page.close();
            continue;
        }
        
        if(!urlObj.name){
            urlObj.name = await page.evaluate(() => {
                return document.querySelector('title').text;
            })
            urlObj.filePath = path.join(urlObj.filePath, urlObj.name);
        }

        var links = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('a')).map(function($a){
                return {
                    url: $a.href.trim(),
                    name: $a.text
                }
            })
        });

        page.close();

        links.forEach(function(link){
            urls.push({
                url: link.url,
                level: urlObj.level + 1,
                name: link.name,
                filePath: path.join(urlObj.filePath, link.name)
            })
        })

    }


    function validate(urlObj, errorMsgHandler){
        if(!re.test(urlObj.url)){
            errorMsgHandler && errorMsgHandler(formatMsg(urlObj, '网址不合法')) || outputErrorMsg(formatMsg(urlObj, '网址不合法'));
        }
        return true;
    }
}

function formatMsg(urlObj, msg){
    return JSON.stringify({url: urlObj.url, errorMsg: msg});
}

function outputErrorMsg(msg){
    console.log(chalk.red(msg));
}

async function init(config){
    var browser = await puppeteer.launch({
        headless: false
    })


    var urls = config.url.split(path.delimiter);
    return {
        browser: browser,
        urls:urls.map(function(url){
            return {
                url: url,
                level: 0,
                name: '',
                filePath: config.target
            }
        }
    )}
}

//program.parse(process.argv);


function createPath(filePath){
    var sept = filePath.split(path.sep);
    for(var i = 1, len = sept.length; i < len; i++){
        sept[i] = path.join(sept[i-1], sept[i]);
        if(!fs.existsSync(sept[i])){
            fs.mkdirSync(sept[i]);
        }
    }
}


