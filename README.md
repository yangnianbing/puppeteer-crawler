[github](https://github.com/yangnianbing/puppeteer-crawler)

安装
------
通过`npm`安装

```bash
$ npm install puppeteer-crawler -g
```  

示例
------
下面的例子爬取百度首页上面的链接，并保存为pdf格式。
```
puppeteer-crawler start --url http://www.baidu.com --level 1 --target ***
```
或者像下面这样，使用互动的方式输入
```bash
puppeteer-crawler start
? 请输入爬取的url http://www.baidu.com
? 请输入爬取的层级 1
? 请输入存储目录 E:\Users\code\puppeteer-crawler
? 保存文件格式 pdf
```

注意安装依赖`puppeteer`的时候会去谷歌下载chrome,需要自备梯子翻墙。
没有梯子的同学可以在环境变量中添加变量`PUPPETEER_SKIP_CHROMIUM_DOWNLOAD`值为`true`,然后手动从[这里](http://download.csdn.net/download/yangnianbing110/10049057)下载，在包`puppeteer`下面新建文件夹`.local-chromium/win64-version`,version的值可以在包`puppeteer`下面的`package.json`文件中找到。把下载的chrome包解压到该文件夹即可。


