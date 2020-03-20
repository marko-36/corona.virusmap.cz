function processECDCdata(ecdcData) {
  //split 
  for (i = 0; i < Object.keys(ecdcData).length; i++) {
    ecdcData[i] = ecdcData[i].split(",")
  }
  // objectify
  var outObj = {}
  var cCountry = ""
  for (let i of Object.keys(ecdcData)) {
    if (ecdcData[i][1] !== cCountry) {
      cCountry = ecdcData[i][1]
      outObj[cCountry] = {}
    }
    if (ecdcData[i][4] !== "0" || ecdcData[i][5] !== "0") {
      let chunkdate = new Date([ecdcData[i][0]]).toDateString() + ' 00:00:00 GMT+0100 (GMT+01:00)'
      let chunk = outObj[cCountry][chunkdate] = {}
      chunk.cases = ecdcData[i][4]
      chunk.deceased = ecdcData[i][5]
    }

  }

  fs.writeFile('_data-ecdc-out.json', JSON.stringify(outObj), function () {
    console.log('_data.json updated!')
  })
}

var ecdcData = JSON.parse(fs.readFileSync('_data-ecdc.json', 'utf8'));
processECDCdata(ecdcData);