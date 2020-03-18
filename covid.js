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

function recountData(srcData){  // add to-area and per-capita; move to front-end
  for (let country of Object.keys(srcData)){
    for (let dataChunk of Object.keys(srcData[country].data)){
      dataPoint = srcData[country].data[dataChunk]
      dataPoint.p_cases = dataPoint.cases / srcData[country].pop
      dataPoint.p_dec = dataPoint.deceased / srcData[country].pop
      dataPoint.p_rec = dataPoint.recovered / srcData[country].pop
      dataPoint.a_cases = dataPoint.cases / srcData[country].area
      dataPoint.a_dec = dataPoint.deceased / srcData[country].area
      dataPoint.a_rec = dataPoint.recovered / srcData[country].area
    }
  }
  return srcData
}

function splitData(srcData) {
  let countryList = {}
  let countryCount = 0
  for (let country of Object.keys(srcData)) {
    let countryShortName = country.replace(/ /g,"_").replace(/\./g,"_").toLowerCase()
    fs.writeFileSync('./_country/' + countryShortName + '.json', JSON.stringify(srcData[country]), function () {})
    countryList[country] = countryShortName;
    ++countryCount
  }
  fs.writeFileSync('_countrylist.json', JSON.stringify(countryList), function () {console.log('splitData() done! Countrycount: ' +countryCount)})  
}

function deleteWhen(when) {
  const data = JSON.parse(fs.readFileSync('_data.json', 'utf8'));
  for (let country of Object.keys(data)) {delete data[country].data[when]}
  fs.writeFile('_data.json', JSON.stringify(data), function () {console.log('deleteWhen() done!')})
}

async function covid(logFn) {
  const now = new Date()
  var data = JSON.parse(fs.readFileSync('_data.json', 'utf8'));
  const freshDataHTML = await getLiveURL(privateDataSources.src01.url);
  //const freshDataHTML = fs.readFileSync('_src.html', 'utf8')   
  const dataSelectors = privateDataSources.src01.selectors;
  var countryCount = 0

  $(dataSelectors.rows, freshDataHTML).each(function () {
    currentRow = $(this);
    country = localNames[$(dataSelectors.countryName, currentRow).text().trim()]
    if (country == undefined) {
      log($(dataSelectors.countryName, currentRow).text().trim() + 'not matched')
    } else {
      data[country].data[now] = {}
      freshData = data[country].data[now]
      freshData.when = now.getTime()
      freshData.cases = parseInt($(dataSelectors.cases, currentRow).text().trim().replace(",", ""))
      freshData.deceased = parseInt($(dataSelectors.deceased, currentRow).text().trim().replace(",", ""))
      freshData.recovered = parseInt($(dataSelectors.recovered, currentRow).text().trim().replace(",", ""))
      if (isNaN(freshData.cases)) {freshData.cases = 0}
      if (isNaN(freshData.deceased)) {freshData.deceased = 0}
      if (isNaN(freshData.recovered)) {freshData.recovered = 0}
      ++countryCount
    }
  })
  logFn(countryCount)  
  logFn('EOF', 'covid.log')
  fs.writeFile('_data.json', JSON.stringify(data), function () {
    console.log('_data.json updated! Countrycount: ' +countryCount)
    splitData(data);
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

//deleteWhen()

covid(log)