/*!
*
* Gumer Playstation Network API
* v0.1 - initial release
* ---
* @desc 	This pulls information from SONY's PSN servers
* @author 	José A. Sächs (admin@jsachs.net / admin@smartpixel.com.ar / jose@animus.com.ar)
*
*/

"use strict";

var
	// Vars
	options = {
		debug: 		false
		// @TODO: Using user's account to login and use (it can be used in the browser meaning less server requests)
		,email: 	''
		,password: 	''
	}
	,request 		= require('request')
	,htmlparser 	= require("htmlparser2")
	,debug 			= function (message) {
		if (debug) console.log('gPSN | ' + message);
	}
	// Vars required to perform REQUESTS to Sony' servers
	,psnVars = {
		redirectURL: 	'com.scee.psxandroid.scecompcall%3A%2F%2Fredirect' 	// Android URL
		,redirectURL_oauth: 'com.scee.psxandroid.scecompcall://redirect'	// Android Callback URL
		,client_id: 	'b0d0d7ad-bb99-4ab1-b25e-afa0c76577b0' 				// Client ID
		,scope: 		'sceapp' 				// SEN Scope
		,scope_psn: 	'psn:sceapp' 			// PSN Scope
		,csrfToken: 	''						// csrf Token
		,authCode : 	''						// authCode needed to ask for an access token
		,client_secret: 'Zo4y8eGIa3oazIEp' 		// Secret string, this is most likely to change overtime. If it changes, please contribute to this project.
		,duid: 			'00000005006401283335353338373035333434333134313a433635303220202020202020202020202020202020' 	// I still don't know what "duid" stands for... if you do, create an issue about it please!
	}

	// URL Vars used for login to PSN and pulling information
	,psnURL = {
		 SignIN: 		'https://reg.api.km.playstation.net/regcam/mobile/sign-in.html?redirectURL='+psnVars.redirectURL+'&client_id='+psnVars.redirectURL+'&scope='+psnVars.scope 	// Initial login (here PSN creates the session and the csrf token)
		,SignINPOST: 	'https://reg.api.km.playstation.net/regcam/mobile/signin'		// POST DATA for login must be sended here
		,oauth: 		'https://auth.api.sonyentertainmentnetwork.com/2.0/oauth/token' 	// PSN's OAuth implementation Uri
		,profileData: 	'https://ar-prof.np.community.playstation.net/userProfile/v1/users/{{id}}/profile?fields=%40default%2Crelation%2CrequestMessageFlag%2Cpresence%2C%40personalDetail%2CtrophySummary' 					// TODO: Create an Array with all PSN country server names. (for now is Argentina)
		,trophyData: 	'https://ar-tpy.np.community.playstation.net/trophy/v1/trophyTitles?fields=%40default&npLanguage=es-MX&iconSize=s&platform=PS3%2CPSVITA%2CPS4&offset={{offset}}&limit={{limit}}&comparedUser={{id}}'	// NOTE: All server are in the US, the only change are market restrictions
	}
	,authCodeRegex = /authCode\=([0-9A-Za-z]*)(?=[\'])/i 	// We use this regex to get the authCode (the response is a HTML)
	,loginParser = function(body, callback) { // Parsing HTML for getting the csrf token
		var parser = new htmlparser.Parser({ 
			onopentag: function(name, attribs){
				if (name === "input" && attribs.name === "csrfToken"){
					debug('csrf token obtained: ' + attribs.value);
					psnVars.csrfToken = attribs.value;
					callback();
				}
			}
		})
		parser.write(body)
		parser.end();
	}
	,accessToken = '' // Access Token necessary to pull trophie/user information
;
/*
* @desc 	Login into PSN/SEN and creates a session with an auth code
* @param 	Function callback - Calls this function once the login is complete
*/
function getLogin(callback) {
	request.post(psnURL.SignINPOST, {form:{
			 'email'		: options.email
			,'password'		: options.password
			,'csrfToken'	: psnVars.csrfToken
			,'client_id'	: psnVars.client_id
			,'scope'		: psnVars.scope
			,'redirectURL'	: psnVars.redirectURL
			,'locale' 		: ''
		}}, function (error, response, body) {
			if (!error) {
				if(authCodeRegex.test(body)) {
					psnVars.authCode = authCodeRegex.exec(body)[1];
					debug('authCode obtenido: ' + psnVars.authCode);
					getAccessToken(psnVars.authCode, callback)
				}
			}
			else {
				debug('ERROR: ' + error)
			}
		}
	)
}
/*
* @desc 	Gets the access token
* @param 	String		authCode - The authCode obtained from the previous login request
* @param 	Function 	callback - Calls this function once the request is complete
*/
function getAccessToken(authCode, callback) {
	request.post(psnURL.oauth, {form:{
			 'grant_type'	: 'authorization_code'
			,'client_id'	: psnVars.client_id
			,'client_secret': psnVars.client_secret
			,'code' 		: authCode
			,'redirect_uri'	: psnVars.redirectURL_oauth
			,'state' 		: 'x'
			,'scope'		: psnVars.scope_psn
			,'duid' 		: psnVars.duid
		}}, function (error, response, body) {
			var responseJSON;
			responseJSON = JSON.parse(body);
			if (!error) {
				if ('access_token' in responseJSON && !('error' in responseJSON)) {
					accessToken = responseJSON.access_token;
					debug('access_token obtained: ' + accessToken)
					if (typeof callback === "function") callback();
				}
				else {
					debug('ERROR: ' + responseJSON)
				}
			}
			else {
				debug('ERROR: ' + error)
			}
	})
}
/*
* @desc 	Creates GET request
* @param 	String		url 		- The URL to ask data from
* @param 	Function 	callback 	- Calls this function once the request is complete
*/
function psnGETRequest (url, callback) {
	var 
		options = {
			url: url
			,method : 'GET'
			,headers: {
				'Authorization': 'Bearer ' + accessToken
			}
		}
	;
	request.get(options, function(error, response, body) {
		var responseJSON;
		responseJSON = JSON.parse(body);
		if(!error) {
			if (response.statusCode == 200) {
				if ('error' in responseJSON) {
					if (responseJSON.error.code == 2105858) {
						debug('Token has expired, asking for new one');
						doLogin(function() {
							psnGETRequest(url, callback)	
						});
					}
					else {
						callback(true, responseJSON) // Return the error
					}
				}
				else {

					callback(false, responseJSON) // Everything seems to be ok
				}
			}
			else {
				callback(true, responseJSON) // TODO: Handle non 200 errors
			}
		}
		else {
			callback(true, error) // Return the error
		}
	})
}
/*
* @desc 	Creates POST request
* @param 	String		url 		- The URL to send data to
* @param 	Function 	callback 	- Calls this function once the request is complete
*/
function psnPOSTRequest (url, callback) {
	var 
		options = {
			 url: url
			,method : 'GET'
			,headers: {
				'Authorization': 'Bearer ' + accessToken
			}
		}
	;
	request.post(options, function(error, response, body) {
		var responseJSON;
		responseJSON = JSON.parse(body);
		if(!error) {
		if (response.statusCode !== 404) {
				if ('error' in responseJSON) {
					if (responseJSON.error.code == 2105858) {
						debug('Token has expired, asking for new one');
						doLogin(function() {
							recursiveGET(url, callback)	
						});
					}
					else {
						callback(true, responseJSON) // Return the error
					}
				}
				else {

					callback(false, responseJSON) // Everything seems to be ok
				}
			}
			else {
				callback(true, responseJSON) // TODO: Handle non 200 errors
			}
		}
		else {
			callback(true, error) // Return the error
		}
	})
}

/*
* @desc 	Initial login
* @param 	Function callback - Calls this function once the login is complete
*/
exports.init = function(params, callback) {
	if (typeof params === 'object' && ('email' in params && 'password' in params)) {
		options = params;
		request.get(psnURL.SignIN, function (error, response, body) {
			if (!error && response.statusCode == 200) {
				loginParser(body, function() {
					(typeof callback === "function" ? getLogin(callback) : getLogin());
				})
			}
		})
	}
	else {
		debug('Cannot start without user or password');
	}
}
/*
* @desc 	Get the profile data for the given PSNID
* @param 	String 		psnid 		- User's PSN ID
* @param 	Function 	callback 	- Calls this function once the request is complete
*/
exports.getProfile = function (psnid, callback) {
	if (accessToken.length > 1) {
		debug('Asking profile data for: ' + psnid);
		psnGETRequest(psnURL.profileData.replace("{{id}}", psnid),callback);
	}
	else {
		debug('Token has expired, asking for new one');
		getLogin(function() {
			psnGETRequest(psnURL.profileData.replace("{{id}}", psnid),callback);
		})
	}
}
/*
* @desc 	Get the trophies data for the given PSNID
* @param 	String 		psnid 		- User's PSN ID
* @param 	Integer		offset 		- Number to start the list from (must be equal or smaller than limit)
* @param 	Integer 	limit	 	- Limits the items per page
* @param 	Function 	callback 	- Calls this function once the request is complete
*/
exports.getTrophies = function (psnid, offset, limit, callback) {
	if (accessToken.length > 1) {
		debug('Asking trophy data for: ' + psnid);
		psnGETRequest(psnURL.trophyData.replace("{{id}}", psnid).replace("{{offset}}", offset).replace("{{limit}}", limit), callback);
	}
	else {
		debug('Token has expired, asking for new one');
		getLogin(function() {
			psnGETRequest(psnURL.trophyData.replace("{{id}}", psnid).replace("{{offset}}", offset).replace("{{limit}}", limit), callback);
		})
	}
}