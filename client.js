const util = require('util')
const credentials = require('./credentials')
var request = require('request')
var login_token = ''
var debug = false;

var login = function(username, password) {
    return new Promise((resolve, reject) => {
	request.post(credentials.login_url,
		     {form: { username: username, password: password}},
		     function(error, response, body) {
			 if(error) {
			     console.log(util.inspect(err))
			     reject(err)
			 } else {
			     resolve(response.headers['authorization'])
			 }
		     })
    })
}

var getTenants = function(token) {
  return new Promise((resolve, reject) => {
      var options = {
	  url: credentials.tenant_url,
	  headers: {
              'Authorization': token,
	  }
      }
      var req = request.get(options, function(error, response, body) {
	  if(error) reject(error)
	  else resolve(JSON.parse(response.body).data.attributes.tenantId)
      })
  })
}

var getProfiles = function() {
  return new Promise((resolve, reject) => {
      var options = {
	  url: credentials.ingestionprofiles_url,
	  headers: {
              'Authorization': login_token,
	      'Cache-Control': 'no-cache'
	  }
      }
      var req = request.get(options, function(error, response, body) {
	  if(error) reject(error)
	  else resolve(response.body)
      })
  })
}

var dumpProperties = function(name, obj) {
    for (var property in obj) {
	if (obj.hasOwnProperty(property)) {
	    console.log(name+': '+property)
	}
    }
}


var getRawMetrics = function(tenant_id, monitored_object) {
  return new Promise((resolve, reject) => {
	var until = new Date()
	var from = new Date(until.getTime()-(3600000))
	console.log(until + ' - ' + from)

      var options = {
	  url: credentials.rawmetrics_url,
	  headers: {
              'Authorization': login_token,
	      'Cache-Control': 'no-cache'
	  },
	  json: true,
	  body:{
	      tenantId:tenant_id,
	      interval: from.toISOString()+'/'+until.toISOString(),
	      granularity:'PT0.667S',
	      timeout:30000,
	      metrics:['delayMax','jitterMax','packetsLost','packetsReceived','delayVarMax','bytesReceived'],
	      directions:['1','2'],
	      objectType:'twamp-pe'
	  }
      }
      console.log(' POST: '+JSON.stringify(options))
      var req = request.post(options, function(error, response, body) {
	  if(error) reject(error)
	  else {
	      if(debug) console.log(JSON.stringify(body.data[0]))
	      resolve(response.body.data[0].attributes.result[monitored_object])
	  }
      })
  })    
}


var queryForProfiles = function() {
    console.log('Time now: '+new Date().toString())
    // don't forget to url encode the username
    login(credentials.username,credentials.password).then((token) => {
	//    console.log('Token: '+token)
	login_token = token
	return getProfiles()
    }).then((response) => {
	data = JSON.parse(response).data
//	console.log(util.inspect(data))
	data[0].attributes.metricList.forEach((element) => {
	    console.log(element.metric + ': ' + element.monitoredObjectType)
	})
	console.log('-------\nMetrics\n------'+util.inspect(data[0].attributes.metrics))
    }).catch((err) => {
	console.log(err)
	console.log('Error')
    })
}

var queryForMetrics = function(monitored_object) {
    console.log('Time now: '+new Date().toString())
    // don't forget to url encode the username
    return login(credentials.username,credentials.password).then((token) => {
	login_token = token
	return getTenants(token)
    }).then((tenant_id) => {
	console.log('Tenant ID: ' + tenant_id)
	return getRawMetrics(tenant_id,monitored_object)
    }).then((metricarray) => {
	if(metricarray && metricarray.length > 0) {
//	    console.log('---- Data for ' + monitored_object + ' ----')
	    var processed_data = metricarray.map(postProcess)
	    return processed_data
	} else {
	    console.log('No data for '+monitored_object)
	    return null
	}
    }).catch((err) => {
	console.log(err)
	console.log('Error')
    })
}



var postProcess = function(element) {
    var directions = ['1','2']
//    console.log(util.inspect(element))
//    console.log('=======>>>>>>')
    var newElement = {}
    newElement.timestamp = new Date(element.timestamp)
    directions.forEach(function(item) {
	if(element.hasOwnProperty(item)) {
	    for (prop in element[item]) {
		var newprop = prop.charAt(0).toUpperCase() + prop.slice(1)
		newattribname = item == '1' ? 'fwd'+newprop : 'rev'+newprop
		newElement[newattribname] = element[item][prop]
	    }
	}
    })
//    console.log(util.inspect(newElement))
//    console.log('\n\n')
    return newElement
}

queryForMetrics('GT-1-to-GT-2-EF-G280-0057').then((data)=>{
    console.log(util.inspect(data))
})

//queryForProfiles()







/* AVailable metrics:
//	      delayMax,delayP95,delayPHi,delayVarP95,delayVarPHi,jitterMax,jitterP95,jitterPHi,lostBurstMax,packetsLost,packetsLostPct,packetsReceived,delayMin,delayAvg,delayStdDevAvg,delayVarMin,delayVarMax,delayVarAvg,packetsMisordered,packetsDuplicated,packetsTooLate,periodsLost,lostBurstMin,bytesReceived,ipTOSMin,ipTOSMax,ttlMin,ttlMax,vlanPBitMin
	    
*/
