/*!
*
* Gumer Playstation Network API
* v0.1 - initial release
* ---
* @desc 	A simple example of usage using Express, it returns the Raw object from Sony' servers
* @author 	José A. Sächs (admin@jsachs.net / admin@smartpixel.com.ar / jose@animus.com.ar)
*
*/

var 
	 gumerPSN 	= require('./psn')		// Gumer Playstation module
	,express 	= require('express')	// Express
	,app 		= express()				// Express application instance
	,idregex 	= /[A-Za-z0-9].{2,15}/ 	// A simple regex for PSN id's // TODO: Make it more accurate and fancy
;

console.log('Starting PSN');

gumerPSN.init({		// Our PSN Module, we have to start it once. - irkinsander
	debug: 		true					// Let's set it true, it's still in early development. So, report everything that goes wrong please.
	,email: 	"your_account"			// A valid PSN/SCE account (can be new one) // TODO: Using the user's credentials to do this.
	,password: 	"your_password"			// Account's password, du'h
});

app.param(function(name, fn){	// Taken from Express site, this takes /{{id}}/ parameter
	if (fn instanceof RegExp) {
		return function(req, res, next, val){
			var captures;
			if (captures = fn.exec(String(val))) {
				req.params[name] = captures;
				next();
			} 
			else {
				next('route');
			}
		}
	}
});

app.get('/PSN/:id', function(req, res){ // Gets the ID owner's profile information and returns the JSON object.
	gumerPSN.getProfile(req.params.id, function(error, profileData) {
		if (!error) {
			res.send(profileData)
		}
		else {
			if (profileData.error.code == 2105356) {	// User not found code
				res.send({
					error: true, message: "PSN ID not found"
				})
			}
			else {
				res.send({
					error: true, message: "Something went terribly wrong, submit an issue on GitHub please!"
				})
			}
		}
	})
})
app.get('/PSN/:id/trophies', function(req, res){ // Gets the ID owner's trophy (first 100) information and returns the JSON object.
	gumerPSN.getTrophies(req.params.id, 0, 100, function(error, trophyData) {
		if (!error) {
			res.send(trophyData)
		}
		else {
			if (trophyData.error.code == 2105356) {		// User not found code
				res.send({
					error: true, message: "PSN ID not found"
				})
			}
			else {
				res.send({
					error: true, message: "Something went terribly wrong, submit an issue on GitHub please!"
				})
			}
		}
	})
})

app.listen(3000); // We listen in the port 3000
console.log('gumerPSN Example running at http://localhost:3000/');