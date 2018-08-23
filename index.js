const util = require('util')
const credentials = require('./credentials')
var request = require('request')

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

var getRawMetrics = function(token) {
}


// don't forget to url encode the username
login(credentials.username,credentials.password).then((token) => {
    console.log('Token: '+token)
    return getTenants(token)
}).then((tenant_id) => {
    console.log(tenant_id)
}).catch((err) => {
    console.log(err)
    console.log('Error')
})
