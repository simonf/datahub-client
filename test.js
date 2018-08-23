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
			     console.log(util.inspect(response.headers))
			     console.log(util.inspect(body))
			     resolve(response.headers)
			 }
		     })
    })
}


// don't forget to url encode the username
login(credentials.username,credentials.password).then((token) => {
    console.log('Token: '+token)
}).catch((err) => {
    console.log(err)
    console.log('Error')
})
