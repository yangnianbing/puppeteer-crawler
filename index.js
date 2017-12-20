#!/usr/bin/env node

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

                        if(!option.query){
                            promps.push({
                                type: 'input',
                                name: 'query',
                                message: '请输入下钻元素选取器',
                                default:'a'
                            })
                        }

                        if(!option.chrome){
                            promps.push({
                                type: 'input',
                                name: 'chrome',
                                message: '请输入chrome地址'
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
                            start(Object.assign(option, answers))
                        })
                    })

start({
    url: 'https://reactjs.org/docs/hello-world.html',
    level: 1,
    format: 'pdf',
    target: process.cwd(),
    query: 'div.css-3ao3zf a'
})
async function start(config){
    var {urls, browser} = await init(config);
    work(config, urls, browser);
}



async function work(config, urls, browser){
    var flag = true;
    while(flag){
        var urlObj = urls.shift();

        if(!urlObj){
            flag = false;
            browser.close();
            continue;
        }

        if(urlObj.level > config.level){
            continue;
        }

        var page = await browser.newPage();
        try{
            await page.goto(urlObj.url, {timeout: 100000});
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
        createPath(urlObj.filePath);
        var fullPath = path.join(urlObj.filePath, encodeFileName(urlObj.name)+'.pdf');
        page.pdf({path:fullPath, format:'A4'});
        outputMsg(formatMsg(urlObj, '生成文件:'+fullPath));
        var links = await page.evaluate((config) => {
            console.log(config)
            return Array.from(document.querySelectorAll(config.query)).map(function($a){
                return {
                    url: $a.href.trim(),
                    name: $a.text
                }
            })
        }, config);

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
}

function encodeFileName(str){
    return str.replace(/[\\:*?/"<>|]/g, '_');
}

function validate(urlObj, errorMsgHandler){
    return true;
}

function formatMsg(urlObj, msg){
    return JSON.stringify({url: urlObj.url, msg: msg});
}

function outputErrorMsg(msg){
    console.log(chalk.red(msg));
}

function outputMsg(msg){
    console.log(chalk.white(msg));
}

async function init(config){
    var launchConfig = {
        headless: true
    };
    if(config.chrome){
        launchConfig.executablePath = config.chrome;
    }
    var browser = await puppeteer.launch(launchConfig)


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

program.parse(process.argv);


function createPath(filePath){
    var sept = filePath.split(path.sep);
    for(var i = 1, len = sept.length; i < len; i++){
        sept[i] = path.join(sept[i-1], sept[i]);
        if(!fs.existsSync(sept[i])){
            fs.mkdirSync(sept[i]);
        }
    }
}


