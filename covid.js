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

function splitData(srcData) {//split data.json to country files
  let countryList = {}
  let countryCount = 0
  for (let country of Object.keys(srcData)) {
    let countryShortName = country.replace(/ /g,"_").replace(/\./g,"_").toLowerCase()
    let cases = srcData[country].cases
    let countryData = {}
    countryData[countryShortName] = srcData[country]
    fs.writeFileSync('./_data/' + countryShortName + '.json', JSON.stringify(countryData), function () {})
    countryList[country+' ('+ cases +')'] = countryShortName;
    ++countryCount
  }
  fs.writeFileSync('./_data/_countrylist.json', JSON.stringify(countryList), function () {console.log('splitData() done! Countrycount: ' +countryCount)})  
}

function deleteWhen(when) {
  const data = JSON.parse(fs.readFileSync('_data.json', 'utf8'));
  for (let country of Object.keys(data)) {delete data[country].data[when]}
  fs.writeFile('_data.json', JSON.stringify(data), function () {console.log('deleteWhen() done!')})
}

async function covid(logFn) {
  const now = new Date()
  var data = JSON.parse(fs.readFileSync('_data.json', 'utf8'));
  var dataLatest = {} 
  var dataTop10 = {}   
  var lastDayCases   
  const freshDataHTML = await getLiveURL(privateDataSources.src01.url);
 
  const dataSelectors = privateDataSources.src01.selectors;
  var countryCount = 0

  $(dataSelectors.rows, freshDataHTML).each(function () {
    currentRow = $(this);
    country = localNames[$(dataSelectors.countryName, currentRow).text().trim()]
    if (country == undefined) {
      log($(dataSelectors.countryName, currentRow).text().trim() + 'not matched')
    } else {
      for (let lastDay of Object.keys(data[country].data)){
        lastDayCases = data[country].data[lastDay].cases
      }
      data[country].data[now] = {}     
      let freshData = data[country].data[now]
      freshData.cases = parseInt($(dataSelectors.cases, currentRow).text().trim().replace(",", ""))
      let inc = freshData.cases - lastDayCases
      freshData.inc = inc
      freshData.dec = parseInt($(dataSelectors.dec, currentRow).text().trim().replace(",", ""))
      freshData.rec = parseInt($(dataSelectors.rec, currentRow).text().trim().replace(",", ""))
      data[country].cases = freshData.cases
      if (isNaN(freshData.cases)) {freshData.cases = 0}
      if (isNaN(freshData.dec)) {freshData.dec = 0}
      if (isNaN(freshData.rec)) {freshData.rec = 0}

      dataLatest[country] = {}
      dataLatest[country].data = {}
      dataLatest[country].data[now] = {}
      dataLatest[country].pop = data[country].pop
      dataLatest[country].area = data[country].area
      dataLatest[country].data[now].cases = freshData.cases
      dataLatest[country].data[now].inc = freshData.inc      
      dataLatest[country].data[now].dec = freshData.dec
      dataLatest[country].data[now].rec = freshData.rec
   

      if (++countryCount<11) {
        dataTop10[country] = data[country]
      }
    }
  })
  logFn(countryCount)  
  logFn('EOF', 'covid.log')
  fs.writeFile('_data.json', JSON.stringify(data), function () {
    console.log('_data.json updated! Countrycount: ' +countryCount)
    splitData(data);    
  })
  fs.writeFile('./_data/_dataLatest.json', JSON.stringify(dataLatest), function () {
    console.log('_dataLatest.json updated! Countrycount: ' +countryCount)
  })
  fs.writeFile('./_data/_dataTop10.json', JSON.stringify(dataTop10), function () {
    console.log('_dataTop10.json updated! Countrycount: ' +countryCount)   
  })      
}


/*
var srcData = JSON.parse(fs.readFileSync('_data.json', 'utf8'));
srcData = srcData['United States'].data 
data2graph(srcData)
*/

/*
var srcData = JSON.parse(fs.readFileSync('_data.json', 'utf8'));
recountData(srcData)
*/

/*
var srcData = JSON.parse(fs.readFileSync('_data.json', 'utf8'));
splitData(srcData)
 */

//deleteWhen('Tue Mar 24 2020 23:49:27 GMT+0100 (GMT+01:00)')


covid(log)