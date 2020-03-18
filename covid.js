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

function deleteWhen(when) {
  const data = JSON.parse(fs.readFileSync('_data.json', 'utf8'));
  for (let country of Object.keys(data)) {delete data[country].data[when]}
  fs.writeFile('_data.json', JSON.stringify(data), function () {console.log('deleteWhen done!')})
}

function data2graph(srcData) { // regroups data for use in graphs; move to front-end
  var gdata = {}
  gdata.datasets = []
  gdata.datasets.push({})
  gdata.datasets.push({})
  gdata.datasets.push({})
  gdata.datasets[0].label = "'Cases'"
  gdata.datasets[1].label = "'Deceased'"
  gdata.datasets[2].label = "'Recovered'"
  let cases = gdata.datasets[0].data = []
  let deceased = gdata.datasets[1].data = []
  let recovered = gdata.datasets[2].data = []

  for (let dataChunk of Object.keys(srcData)) {
    let c = {}
    let d = {}
    let r = {}
    c.x = "new Date('" + dataChunk + "')"
    d.x = c.x
    r.x = c.x
    c.y = srcData[dataChunk].cases
    d.y = srcData[dataChunk].deceased
    r.y = srcData[dataChunk].recovered
    cases.push(c)
    deceased.push(d)
    recovered.push(r)
  }
  
  gdata = JSON.stringify(gdata).replace(/"/g,"").replace(/'/g,"\"")
  console.log(gdata)
  console.log('data2graph done!')
}

async function covid(logFn) {
  const now = new Date()
  const data = JSON.parse(fs.readFileSync('_data.json', 'utf8'));
  const freshDataHTML = await getLiveURL(privateDataSources.src01.url);
  //const freshDataHTML = fs.readFileSync('_src.html', 'utf8')   
  const dataSelectors = privateDataSources.src01.selectors;

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
    }
  })
  logFn('EOF', 'covid.log')

  fs.writeFile('_data.json', JSON.stringify(data), function () {
    console.log('_data.json updated!')
  })
}

/*
var srcData = JSON.parse(fs.readFileSync('_data.json', 'utf8'));
srcData = srcData['United States'].data 
data2graph(srcData)
*/


var srcData = JSON.parse(fs.readFileSync('_data.json', 'utf8'));
recountData(srcData)
/**/

//deleteWhen()

//covid(log)