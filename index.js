const util = require('util')
const credentials = require('./credentials')
var request = require('request')
var login_token = ''

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


var getRawMetrics = function(tenant_id, monitored_object) {
  return new Promise((resolve, reject) => {
      var options = {
	  url: credentials.rawmetrics_url,
	  headers: {
              'Authorization': login_token,
	      'Cache-Control': 'no-cache'
	  },
	  json: true,
	  body:{
	      tenantId:tenant_id,
	      interval:'2018-08-25T11:12:53-04:00/2018-08-29T11:12:53-04:00',
	      granularity:'PT1H',
	      timeout:30000,
	      metrics:['delayMin', 'packetsReceived'],
	      directions:['1'],
	      objectType:'twamp-sf'
	  }
      }
      console.log(' POST body: '+JSON.stringify(options.body))
      var req = request.post(options, function(error, response, body) {
	  if(error) reject(error)
	  else {
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
	console.log(util.inspect(data))
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
    login(credentials.username,credentials.password).then((token) => {
	//    console.log('Token: '+token)
	login_token = token
	return getTenants(token)
    }).then((tenant_id) => {
	return getRawMetrics(tenant_id,monitored_object)
//    }).then((data) => {
//	for(var item in data) {
//	    if(data.hasOwnProperty(item)) {
	}).then((metricarray) => {
//		var metricarray = data[item]
		if(metricarray.length > 0) {
		    console.log('---- Data for ' + monitored_object + ' ----')
		    metricarray.forEach((element) => {
			console.log(element)
		    })
		}
//	    }
//	}
    }).catch((err) => {
	console.log(err)
	console.log('Error')
    })
}

queryForMetrics('CSHBv-CSNC-G023-1365')
//queryForProfiles()
