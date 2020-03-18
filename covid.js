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

function recountData(){  // move to front-end
  const data = JSON.parse(fs.readFileSync('_data.json', 'utf8'));
  for (let country of Object.keys(data)){
    for (let dataChunk of Object.keys(data[country].data)){
      dataPoint = data[country].data[dataChunk]
      dataPoint.p_cases = dataPoint.cases / data[country].pop
      dataPoint.p_dec = dataPoint.deceased / data[country].pop
      dataPoint.p_rec = dataPoint.recovered / data[country].pop
      dataPoint.a_cases = dataPoint.cases / data[country].area
      dataPoint.a_dec = dataPoint.deceased / data[country].area
      dataPoint.a_rec = dataPoint.recovered / data[country].area
    }
  }
  fs.writeFile('_data.json', JSON.stringify(data), function(){console.log('recountData() done!')})     
}
async function deleteWhen(when) {
  const data = JSON.parse(fs.readFileSync('_data.json', 'utf8'));
  //const freshDataHTML = await getLiveURL(privateDataSources.src01.url);  
  for (let country of Object.keys(data)) {delete data[country].data[when]}
  fs.writeFile('_data.json', JSON.stringify(data), function () {console.log('deleteWhen done!')})
}

function data2graph(data){  // regroups data for use in graphs; move to front-end

}

async function covid(logFn,deleteWhen) {
  const now = new Date()
  const data = JSON.parse(fs.readFileSync('_data.json', 'utf8'));
  //const freshDataHTML = await getLiveURL(privateDataSources.src01.url);  
  const freshDataHTML = fs.readFileSync('_src.json', 'utf8')   
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
        freshData.when = now.getTime()
        freshData.cases = parseInt($(dataSelectors.cases, currentRow).text().trim().replace(",", ""))
        freshData.deceased = parseInt($(dataSelectors.deceased, currentRow).text().trim().replace(",", ""))
        freshData.recovered =  parseInt($(dataSelectors.recovered, currentRow).text().trim().replace(",", ""))
        if (isNaN(freshData.cases)) {freshData.cases = 0}
        if (isNaN(freshData.deceased)) {freshData.deceased = 0}
        if (isNaN(freshData.recovered)) {freshData.recovered = 0}
      }
    })
    logFn('EOF','covid.log')
  }
  fs.writeFile('_data.json', JSON.stringify(data), function(){console.log('_data.json updated!')})       
}


//recountData()
//deleteWhen()
covid(log)