const util = require('util')
var Client = require('node-rest-client').Client

var options = {
  mimetypes: {
    json: ["application/json", "application/vnd.api+json"]  
  }
}

var client = new Client(options);


const LOGIN_URL = 'https://colt.npavlabs.accedian.net/api/v1/auth/login'
const TENANT_URL = 'https://colt.npavlabs.accedian.net/api/v2/tenants'

var login = function(username, password) {
  return new Promise((resolve, reject) => {
    var args = {
      headers: {
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: 'username='+username+'&password='+password
    }
    var req = client.post(LOGIN_URL, args, function(data, response) {
      //console.log(data)
      resolve(response.headers.authorization)
    })
    req.on('error', function(err){
      console.log(util.inspect(err))
      reject(err)
    })
  })
}

var getTenants = function(token) {
  return new Promise((resolve, reject) => {
    var args = {
      headers: {
        'Authorization': token,
      }
    }
    var req = client.get(TENANT_URL, args, function(data, response) {
      console.log(data)
      resolve(data)
    })
    req.on('error', function(err){
      console.log(util.inspect(err))
      reject(err)
    })
  })
}

// don't forget to url encode the username
login().then((token) => {
  return getTenants(token)
}).then((data) => {
  console.log(data)
}).catch((err) => {
  console.log('Error')
})