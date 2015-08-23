/*!
*
* Playstation Network API
* v0.2.0
* ---
* @desc 	This pulls information from SONY's PSN servers
* @author 	José A. Sachs (admin@jsachs.net / jose@animus.com.ar)
*
*/

"use strict";

var
	// Vars
	options = { // Default configuration
		debug: 		false
		// @TODO: Using user's account to login and use (it can be used in the browser meaning less server requests)
		,email: 	''
		,password: 	''
		,region: 	'us'
		,npLanguage : 'en'
	}
	,regions		= ["us","ca","mx","cl","pe","ar","co","br","gb","ie","be","lu","nl","fr","de","at","ch","it","pt","dk","fi","no","se","au","nz","es","ru","ae","za","pl","gr","sa","cz","bg","hr","ro","si","hu","sk","tr","bh","kw","lb","om","qa","il","mt","is","cy","in","ua","hk","tw","sg","my","id","th","jp","kr"] // Know SONY's servers
	,languages		= ["ja","en","en-GB","fr","es","es-MX","de","it","nl","pt","pt-BR","ru","pl","fi","da","no","sv","tr","ko","zh-CN","zh-TW"] // All languages SONY accepts as parameter
	,request 		= require('request').defaults({jar: true}) // We set jar to true to enable cookie saving (Only used for the login process)
	,cheerio		= require('cheerio') // Now required to extract the value of the input "brandingParams"
	,debug 			= function (message) {
		if (options.debug) console.log('gPSN | ' + message);
	}
	// Vars required to perform REQUESTS to Sony' servers
	,psnVars = {
		SENBaseURL: 	'https://auth.api.sonyentertainmentnetwork.com'
		,redirectURL_oauth: 'com.scee.psxandroid.scecompcall://redirect'	// Android Callback URL
		,client_id: 	'b0d0d7ad-bb99-4ab1-b25e-afa0c76577b0' 				// Client ID
		,scope: 		'sceapp' 				// SEN Scope
		,scope_psn: 	'psn:sceapp,user:account.get,user:account.settings.privacy.get,user:account.settings.privacy.update,user:account.realName.get,user:account.realName.update,kamaji:get_account_hash'	// PSN Scope, now edited with more scopes
		,csrfToken: 	''						// csrf Token
		,authCode : 	''						// authCode needed to ask for an access token
		,client_secret: 'Zo4y8eGIa3oazIEp' 		// Secret string, this is most likely to change overtime. If it changes, please contribute to this project.
		,duid: 			'00000005006401283335353338373035333434333134313a433635303220202020202020202020202020202020' 	// I still don't know what "duid" stands for... if you do, create an issue about it please!
		,state: 		'1156936032'
		,service_entity:'urn:service-entity:psn'
		,paramString: 	'c2VydmljZV9lbnRpdHk9cHNuJnJlcXVlc3RfdGhlbWU9bGlxdWlk' // This is extracted from the login page, however it's always the same. "service_entity=psn&request_theme=liquid" in Base64 but we extract it if it changes
	}

	// URL Vars used for login to PSN and pulling information
	,psnURL = {
		SignIN:  		psnVars.SENBaseURL + '/2.0/oauth/authorize?response_type=code&service_entity='+psnVars.service_entity+'&returnAuthCode=true&state='+psnVars.state+'&redirect_uri='+psnVars.redirectURL_oauth+'&client_id='+psnVars.client_id+'&scope='+psnVars.scope_psn // New SEN login page (no csrfToken this time)
		,SignINPOST: 	psnVars.SENBaseURL + '/login.do'		// POST DATA for login must be sended here
		,oauth: 		'https://auth.api.sonyentertainmentnetwork.com/2.0/oauth/token' 	// PSN's OAuth implementation Uri
		,profileData: 	'https://{{region}}-prof.np.community.playstation.net/userProfile/v1/users/{{id}}/profile?fields=%40default,relation,requestMessageFlag,presence,%40personalDetail,trophySummary'
		,trophyData: 	'https://{{region}}-tpy.np.community.playstation.net/trophy/v1/trophyTitles?fields=%40default&npLanguage={{lang}}&iconSize={{iconsize}}&platform=PS3%2CPSVITA%2CPS4&offset={{offset}}&limit={{limit}}&comparedUser={{id}}'	// NOTE: All server are in the US, the only change are market restrictions
		,trophyDataList:'https://{{region}}-tpy.np.community.playstation.net/trophy/v1/trophyTitles/{{npCommunicationId}}/trophyGroups/{{groupId}}/trophies?fields=%40default,trophyRare,trophyEarnedRate&npLanguage={{lang}}'
		,trophyGroupList:'https://{{region}}-tpy.np.community.playstation.net/trophy/v1/trophyTitles/{{npCommunicationId}}/trophyGroups/?npLanguage={{lang}}'
		,trophyInfo:	'https://{{region}}-tpy.np.community.playstation.net/trophy/v1/trophyTitles/{{npCommunicationId}}/trophyGroups/{{groupId}}/trophies/{{trophyID}}?fields=%40default,trophyRare,trophyEarnedRate&npLanguage={{lang}}'
	}
	,userAgent = 'Mozilla/5.0 (Linux; U; Android 4.3; '+options.npLanguage+'; C6502 Build/10.4.1.B.0.101) AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 Mobile Safari/534.30 PlayStation App/2.55.8/'+options.npLanguage+'/'+options.npLanguage
	,requestedWith = 'com.scee.psxandroid'
	,accessToken = ''
	,refreshToken = ''
	,refreshInterval
	,codeRegex = /redirect\?code=(.{6})/
;
/*
* @desc 	Gets/refresh the CSRF token // Issue #3
* @param 	Function callback - Calls this function once the login is complete
*/
function initLogin(callback) {
	debug('Getting login');
	request.get({ 
			url: psnURL.SignIN
			, headers : {
				'User-Agent': userAgent
				,'X-Requested-With': requestedWith
			}
		}
		, function (error, response, body) {
			//console.log(error);
			if (body) {
				var $ = cheerio.load(body);
				var new_paramString = $('#brandingParams').attr("value");
				getLogin(callback, psnURL.SignIN)
			}
			else {
				debug('ERROR: ' + error)
			}
	})
}
/*
* @desc 	Login into PSN/SEN and creates a session with an auth code
* @param 	Function callback - Calls this function once the login is complete
*/
function getLogin(callback, referer, params) {
	debug('Logging in, sending POST');
	request.post(psnURL.SignINPOST
		,{
			headers: {
				'User-Agent': userAgent
				,'X-Requested-With': requestedWith
				,'Origin':'https://auth.api.sonyentertainmentnetwork.com'
				,'Referer': referer
			}
			,form:{
				'params' 		: (params !== psnVars.paramString ? params : psnVars.paramString) // Now it's base64'd for some reason.
				,'j_username'	: options.email
				,'j_password'	: options.password
			}
		}, function (error, response, body) {
			if (!error) {
				followRedirect(null, response.headers.location, referer);
			}
			else {
				debug('ERROR: ' + error)
			}
		}
	)
}
function followRedirect(callback, url, referer) {
	debug('Logged in, following redirects');
	request.get(url
		,{
			headers: {
				'User-Agent': userAgent
				,'X-Requested-With': requestedWith
				,'Origin':'https://auth.api.sonyentertainmentnetwork.com'
				,'Referer': referer
			},
			followRedirect: false
		}, function (error, response, body) {
			if (!error) {
				var codeResult = codeRegex.exec(unescape(response.headers.location));
				getAccessToken(codeResult[1])
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
	debug('Getting access token');
	var responseJSON;
	if (refreshToken.length > 0) {
		request.post(psnURL.oauth, {form:{ // Refreshing the token with refresh_token to avoid login again
				 'grant_type'	: 'refresh_token'
				,'client_id'	: psnVars.client_id
				,'client_secret': psnVars.client_secret
				,'refresh_token': refreshToken
				,'redirect_uri'	: psnVars.redirectURL_oauth
				,'state' 		: 'x'
				,'scope'		: psnVars.scope_psn
				,'duid' 		: psnVars.duid
			}}, function (error, response, body) {
				responseJSON = JSON.parse(body);
				if (!error) {
					if ('access_token' in responseJSON && !('error' in responseJSON)) {
						accessToken = responseJSON.access_token;
						refreshToken = responseJSON.refresh_token;
						debug('access_token obtained by using refresh_token: ' + accessToken)
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
	else {
		debug('Login for the first time');
		request.post(psnURL.oauth, {form:{ // Firts time login
				 'grant_type'	: 'authorization_code'
				,'client_id'	: psnVars.client_id
				,'client_secret': psnVars.client_secret
				,'code' 		: authCode
				,'redirect_uri'	: psnVars.redirectURL_oauth
				,'state' 		: 'x'
				,'scope'		: psnVars.scope_psn
				,'duid' 		: psnVars.duid
			}}, function (error, response, body) {
				responseJSON = JSON.parse(body);
				if (!error) {
					if ('access_token' in responseJSON && !('error' in responseJSON)) {
						accessToken = responseJSON.access_token;
						refreshToken = responseJSON.refresh_token;
						clearInterval(refreshInterval);
						refreshInterval = setInterval(function() {
							getAccessToken('', function() {
								debug('access_token refreshed after 59 minutes')
							})
						}, (responseJSON.expires_in - 60) * 1000) // 59 minutes
						debug('access_token/refresh_token obtained: ' + body);
						if (typeof callback === "function") callback();
					}
					else {
						debug('ERROR: ' + JSON.stringify(responseJSON))
					}
				}
				else {
					debug('ERROR: ' + JSON.stringify(error))
				}
		})	
	}
}
/*
* @desc 	Creates GET request
* @param 	String		url 		- The URL to ask data from
* @param 	Function 	callback 	- Calls this function once the request is complete
*/
function psnGETRequest (url, callback) {
	var 
		reqOptions = {
			url: url
			,method : 'GET'
			,headers: {
				'Access-Control-Request-Method': 'GET'
				,'Origin': 'http://psapp.dl.playstation.net'
				,'Access-Control-Request-Headers': 'Origin, Accept-Language, Authorization, Content-Type, Cache-Control'
				,'Accept-Language': options.npLanguage +","+languages.join(',')
				,'Authorization': 'Bearer ' + accessToken
				,'Cache-Control': 'no-cache'
				,'X-Requested-With': requestedWith
				,'User-Agent': userAgent
			}
		}
	;
	request.get(reqOptions, function(error, response, body) {
		var responseJSON;
		responseJSON = JSON.parse(body);
		if(!error) {
			if (response.statusCode == 200) {
				callback(false, responseJSON) // Everything seems to be ok
			}
			else if(response.statusCode == 401) {
				if ('error' in responseJSON) {
					if (responseJSON.error.code === 2105858 || responseJSON.error.code === 2138626) {
						debug('Token has expired, asking for new one');
						initLogin(function() {
							psnGETRequest(url, callback)	
						});
					}
					else {
						callback(true, responseJSON) // Return the error
					}
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
* @desc 	Creates POST request (Not in use yet)
* @param 	String		url 		- The URL to send data to
* @param 	Function 	callback 	- Calls this function once the request is complete
*/
function psnPOSTRequest (url, callback) {
	var 
		reqOptions = {
			 url: url
			,method : 'POST'
			,headers: {
				'Access-Control-Request-Method': 'POST'
				,'Origin': 'http://psapp.dl.playstation.net'
				,'Access-Control-Request-Headers': 'Origin, Accept-Language, Authorization, Content-Type, Cache-Control'
				,'Accept-Language': options.npLanguage +","+languages.join(',')
				,'Authorization': 'Bearer ' + accessToken
				,'Cache-Control': 'no-cache'
				,'X-Requested-With': requestedWith
				,'User-Agent': userAgent
			}
		}
	;
	request.post(reqOptions, function(error, response, body) {
		var responseJSON;
		responseJSON = JSON.parse(body);
		if(!error) {
			if (response.statusCode == 200) {
				callback(false, responseJSON) // Everything seems to be ok
			}
			else if(response.statusCode == 401) {
				if ('error' in responseJSON) {
					if (responseJSON.error.code === 2105858 || responseJSON.error.code === 2138626) {
						debug('Token has expired, asking for new one');
						initLogin(function() {
							psnGETRequest(url, callback)	
						});
					}
					else {
						callback(true, responseJSON) // Return the error
					}
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
		if (params.debug) options.debug = true;
		// Setting up user and password
		options.email = params.email;
		options.password = params.password;
		// Setting up language for results
		if (languages.indexOf(params.npLanguage) >= 0)
			options.npLanguage = params.npLanguage
		else 
			debug('Invalid "'+params.npLanguage+'" npLanguage value, using "en" instead');
		// Setting up server region
		if (regions.indexOf(params.region) >= 0) 
			options.region = params.region
		else 
			debug('Invalid "'+params.region+'" region value, using "us" instead');
		// Update the language/region
		Object.keys(psnURL).forEach(function(key) {
			if (psnURL.hasOwnProperty(key)) {
				psnURL[key] = psnURL[key].replace("{{lang}}", options.npLanguage).replace("{{region}}", options.region);
			}
		});
		// Start signin to PlayStation Network
		initLogin(callback);
	}
	else {
		throw new Error('Cannot start without user or password');
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
		debug('Asking for new token');
		getAccessToken('',function() {
			psnGETRequest(psnURL.profileData.replace("{{id}}", psnid),callback);
		})
	}
}
/*
* @desc 	Get the detailed trophy title data by PSNID
* @param 	String 		psnid 		- User's PSN ID
* @param 	Integer		offset 		- Number to start the list from (must be equal or smaller than limit)
* @param 	Integer 	limit	 	- Limits the items per page
* @param 	Function 	callback 	- Calls this function once the request is complete
*/
exports.getTrophies = function (psnid, iconsize, offset, limit, callback) {
	if (accessToken.length > 1) {
		debug('Asking trophies info for: ' + psnid);
		psnGETRequest(psnURL.trophyData.replace("{{iconsize}}", iconsize).replace("{{id}}", psnid).replace("{{offset}}", offset).replace("{{limit}}", limit), callback);
	}
	else {
		debug('Asking for new token');
		initLogin(function() {
			psnGETRequest(psnURL.trophyData.replace("{{iconsize}}", iconsize).replace("{{id}}", psnid).replace("{{offset}}", offset).replace("{{limit}}", limit), callback);
		})
	}
}
/*
* @desc 	Get the title's trophy groups by npCommunicationId
* @param 	String 		psnid		- User's PSN ID (if not black it returns the user progression for each DLC, if black only returns the title's DLC and trophy count)
* @param 	String 		npCommID 	- The game's npCommunicationId
* @param 	Function 	callback 	- Calls this function once the request is complete
*/
exports.getGameTrophyGroups = function (psnid, npCommID, callback) {
	if (accessToken.length > 1) {
		debug('Asking trophy group for: ' + psnid);
		psnGETRequest(psnURL.trophyGroupList.replace("{{npCommunicationId}}", npCommID) + (psnid.length > 1 ? "&comparedUser="+psnid : ""), callback);
	}
	else {
		debug('Asking for new token');
		initLogin(function() {
			psnGETRequest(psnURL.trophyGroupList.replace("{{npCommunicationId}}", npCommID) + (psnid.length > 1 ? "&comparedUser="+psnid : ""), callback);
		})
	}
}
/*
* @desc 	Get the trophy list by npCommunicationId
* @param 	String 		psnid		- User's PSN ID (if not black it returns if the user has earned each trophy, if black only returns the title's trophy list)
* @param 	String 		npCommID 	- The game's npCommunicationId
* @param 	String 		groupId 	- Trophy group id (if blank gets all trophies including those from the game's DLC)
* @param 	Function 	callback 	- Calls this function once the request is complete
*/
exports.getGameTrophies = function (psnid, npCommID, groupId, callback) {
	if (accessToken.length > 1) {
		debug('Asking trophy list of: ' + npCommID);
		psnGETRequest(psnURL.trophyDataList.replace("{{npCommunicationId}}", npCommID).replace("{{groupId}}", (groupId.length > 1 ? groupId : "all")) + (psnid.length > 1 ? "&comparedUser="+psnid : ""), callback);
	}
	else {
		debug('Asking for new token');
		initLogin(function() {
			psnGETRequest(psnURL.trophyDataList.replace("{{npCommunicationId}}", npCommID).replace("{{groupId}}", (groupId.length > 1 ? groupId : "all")) + (psnid.length > 1 ? "&comparedUser="+psnid : ""), callback);
		})
	}
}
/*
* @desc 	Get the trophy list by npCommunicationId
* @param 	String 		psnid		- User's PSN ID (if not black it returns if the user has earned each trophy, if black only returns the title's trophy list)
* @param 	String 		npCommID 	- The game's npCommunicationId
* @param 	String 		groupId 	- Trophy group id (if blank gets all trophies including those from the game's DLC)
* @param 	Integer		trophyID 	- Trophy id
* @param 	Function 	callback 	- Calls this function once the request is complete
*/
exports.getTrophy = function (psnid, npCommID, groupId, trophyID, callback) {
	if (accessToken.length > 1) {
		debug('Asking trophy info for: ' + trophyID + ' for npCommID ' + npCommID);
		psnGETRequest(psnURL.trophyInfo.replace("{{npCommunicationId}}", npCommID).replace("{{trophyID}}", trophyID).replace("{{groupId}}", (groupId.length > 1 ? groupId : "all")) + (psnid.length > 1 ? "&comparedUser="+psnid : ""), callback);
	}
	else {
		debug('Asking for new token');
		initLogin(function() {
			psnGETRequest(psnURL.trophyInfo.replace("{{npCommunicationId}}", npCommID).replace("{{trophyID}}", trophyID).replace("{{groupId}}", (groupId.length > 1 ? groupId : "all")) + (psnid.length > 1 ? "&comparedUser="+psnid : ""), callback);
		})
	}
}
/*
* @desc 	Use this to experiment new URL's and function from SONY's app
* @param 	String url - The URL (with protocol/port/parameters)
*/
function psnGETRequestDEBUG (url, callback) {
	var 
		options = {
			url: url
			,method : 'GET'
			,headers: {
				'Authorization': 'Bearer ' + accessToken
			}
		}
	;
	console.log('GET '+ url)
	request.get(options, function(error, response, body) {
		callback(body)
	})
}
exports.GET = function (url, callback) {
	psnGETRequestDEBUG(url, callback);
}