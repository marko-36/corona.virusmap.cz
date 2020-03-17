const {localNames, dataSources} = require('./config');
const privateDataSources = require('./.iddqd1993/config_private');
const fs = require('fs');
const $ = require('cheerio');
const puppeteer = require('puppeteer');


var applog = {};
applog.message = ('\n'+ new Date() + '\u0009'+ new Date().getMilliseconds() +'\u0009--Beginning of log--');
applog.messageCount = 0;

function log(message, filename){
  applog.messages += ('\n'+ new Date() + '\u0009'+ new Date().getMilliseconds() +'\u0009' + message);
  applog.messageCount = ++applog.messageCount;  
  //console.log(applog.messages);
  if (filename) {
    fs.writeFileSync(filename, 'Lines: '+ applog.messageCount + applog.messages , function(){})
  }
}

async function getLiveURL(url){
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url);
  html = await page.content();
  browser.close();
  return html
};     

async function covid(logFn,deleteWhen) {
  const now = new Date()
  const data = JSON.parse(fs.readFileSync('_data.json', 'utf8'));
  const freshDataHTML = await getLiveURL(privateDataSources.src01.url);  
  const dataSelectors = privateDataSources.src01.selectors;    

  if (deleteWhen){
    for (let country of Object.keys(data)){
      delete data[country].data[deleteWhen]
    }
  } else {
    $(dataSelectors.rows, freshDataHTML).each(function() {
      currentRow = $(this);
      country = localNames[$(dataSelectors.countryName,currentRow).text().trim()]
      if (country == undefined) {
        log($(dataSelectors.countryName,currentRow).text().trim() + 'not matched')
      } else {
        data[country].data[now] = {}      
        freshData = data[country].data[now]
        freshData.when = new Date().getTime()
        freshData.cases = $(dataSelectors.cases, currentRow).text().trim()
        freshData.deceased = $(dataSelectors.deceased, currentRow).text().trim()
        freshData.recovered =  $(dataSelectors.recovered, currentRow).text().trim()
        if (freshData.cases == "") {freshData.cases = 0}
        if (freshData.deceased == "") {freshData.deceased = 0}
        if (freshData.recovered == "") {freshData.recovered = 0}
      }
    })
    logFn('EOF','covid.log')
  }
  fs.writeFile('_data.json', JSON.stringify(data), function(){console.log('done!')})       
}
covid(log)