const fs = require('fs');

function reDo() {
  /*
  var countries = JSON.parse(fs.readFileSync('_dataLatest.json', 'utf8'));
  for (let country of Object.keys(countries)) {
let i = 0, yCases, len
len = Object.keys(countries[country].data).length
    for (let dataPoint of Object.keys(countries[country].data)) {
      if (i++ < len-1) {
        delete countries[country].data[dataPoint]
      }
    }
  }
  fs.writeFile('_dataLatestNew.json', JSON.stringify(countries), function () {
    console.log('reData() done!')
  })
  */


  var latest = JSON.parse(fs.readFileSync('./_data/_dataLatest.json', 'utf8'));
  var data = JSON.parse(fs.readFileSync('_data.json', 'utf8'));
  for (let country of Object.keys(latest)) {
    if (data[country].data['Wed Mar 25 2020 00:39:19 GMT+0100 (GMT+01:00)']) {
      latest[country].inc = data[country].data['Wed Mar 25 2020 00:39:19 GMT+0100 (GMT+01:00)'].inc
    }
  }
  fs.writeFile('./_data/_dataLatestNew.json', JSON.stringify(latest), function () {
    console.log('reData() done!')
  })
}

reDo()