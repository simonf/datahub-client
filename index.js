const util = require('util')
const request = require('request')
const express = require('express')
const credentials = require('./credentials')

var cors = require('cors')
var app = express()
app.use(cors())

var login_token = ''
var tenant_id = ''
var debug = false;
var monitored_object = 'GT-1-to-GT-2-EF-G280-0057'


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


var getRawMetrics = function(tenant_id, monitored_object) {
  return new Promise((resolve, reject) => {
	var until = new Date()
	var from = new Date(until.getTime()-(600000))
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


var postProcess = function(retval, element) {
    var directions = ['1','2']
    directions.forEach(function(item) {
	if(element.hasOwnProperty(item)) {
	    for (prop in element[item]) {
		var newElement = { x: new Date(element.timestamp), y: element[item][prop] }
		var newprop = prop.charAt(0).toUpperCase() + prop.slice(1)
		var newattribname = item == '1' ? 'fwd'+newprop : 'rev'+newprop
		retval[newattribname].push(newElement)
	    }
	}
    })
}


app.get('/', (req, resp) => {
    console.log('Received request')
    getRawMetrics(tenant_id,monitored_object).then((metricarray) => {
	if(metricarray && metricarray.length > 0) {
	    var processed_data = {
		'fwdDelayMax': [],
		'fwdJitterMax': [],
		'fwdPacketsLost': [],
		'fwdPacketsReceived': [],
		'fwdDelayVarMax': [],
		'fwdBytesReceived': [],
		'revDelayMax': [],
		'revJitterMax': [],
		'revPacketsLost': [],
		'revPacketsReceived': [],
		'revDelayVarMax': [],
		'revBytesReceived': []
	    }
	    metricarray.forEach(function(element) {
		postProcess(processed_data, element)
	    })
	    resp.status(200).json(processed_data)
	} else {
	    resp.status(404).json({error: 'No data for '+monitored_object})
	}
    }).catch((err) => {
	console.log('Error: ' + err)
	resp.status(500).json({error: err})
    })
})


login(credentials.username,credentials.password).then((token) => {
    login_token = token
    return getTenants(token)
}).then((tenant) => {
    tenant_id = tenant
    console.log('Tenant ID: ' + tenant_id)
    app.listen(9123, () => {console.log('Listening on 9123')})
}).catch((err) => { console.log('Dying') })

 
	  

