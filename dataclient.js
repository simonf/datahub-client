var DatahubClient = {
    token: null,
    metrics_query_body: {
	tenantId: '69b27e3d-4c49-4020-93b3-b6f81260afa5',
	granularity:'PT0.667S',
	timeout: 30000,
	metrics:['delayMax','jitterMax','packetsLost','packetsReceived','delayVarMax','bytesReceived'],
	directions:['1','2'],
	objectType:'twamp-sf'
    },
    login: function(credentials) {
	return new Promise((resolve, reject) => {
	    var xhr = new XMLHttpRequest();
	    xhr.open("POST", credentials.login_url, true);

	    //Send the proper header information along with the request
	    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

	    xhr.onreadystatechange = function() {//Call a function when the state changes.
		if(this.readyState == XMLHttpRequest.DONE) {
		    if(this.status == 200) {
			var token = xhr.getResponseHeader('authorization')
			if(token) resolve(token)
			else reject('No token')
		    } else {
			reject('Response code was '+this.status)
		    }
		}
	    }
	    xhr.send("username="+credentials.username+"&password="+credentials.password);
	})
    },
    getMetrics: function(credentials, monitored_object, interval_secs) {
	return new Promise((resolve, reject) => {
	    var until = new Date()
	    var from = new Date(until.getTime()-(interval_secs * 1000))
	    console.log(until + ' - ' + from)

	    var xhr = new XMLHttpRequest();
	    xhr.open("POST", credentials.rawmetrics_url, true);

	    //Send the proper header information along with the request
	    xhr.setRequestHeader("Authorization", credentials.token);
	    xhr.setRequestHeader("Content-Type", "application/json");
	    xhr.setRequestHeader("Cache-Control", "no-cache");

	    xhr.onreadystatechange = function() {//Call a function when the state changes.
		if(this.readyState == XMLHttpRequest.DONE) {
		    if(this.status == 200) {
			console.log(xhr.response.json)
			resolve(xhr.response.json.data[0].attributes.result[monitored_object])
		    } else {
			reject('Response code was '+this.status)
		    }
		}
	    }
	    
	    this.metrics_query_body.interval = from.toISOString()+'/'+until.toISOString()
	    xhr.send(this.metrics_query_body)
	})    
    }
    
}

if(typeof module !== 'undefined' && typeof module.exports !== 'undefined') 
    module.exports = DatahubClient
else
    window.DatahubClient = DatahubClient
    
