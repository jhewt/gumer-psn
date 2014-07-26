/*!
*
* Gumer Playstation Network API
* v0.1.2
* ---
* @desc 	This pulls information from SONY's PSN servers
* @author 	José A. Sächs (admin@jsachs.net / admin@smartpixel.com.ar / jose@animus.com.ar)
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
		,psnId: ''
		,region: 	'us'
		,npLanguage : 'en'
		,accountId : ''
		,mAccountId: ''
	}
	,regions		= ["us","ca","mx","cl","pe","ar","co","br","gb","ie","be","lu","nl","fr","de","at","ch","it","pt","dk","fi","no","se","au","nz","es","ru","ae","za","pl","gr","sa","cz","bg","hr","ro","si","hu","sk","tr","bh","kw","lb","om","qa","il","mt","is","cy","in","ua","hk","tw","sg","my","id","th","jp","kr"] // Know SONY's servers
	,languages		= ["ja","en","en-GB","fr","es","es-MX","de","it","nl","pt","pt-BR","ru","pl","fi","da","no","sv","tr","ko","zh-CN","zh-TW"] // All languages SONY accepts as parameter
	,request 		= require('request').defaults({jar: true}) // We set jar to true to enable cookie saving (Only used for the login process)
	,debug 			= function (message) {
		if (options.debug) console.log('gPSN | ' + message);
	}
	// Vars required to perform REQUESTS to Sony' servers
	,psnVars = {
		SENBaseURL: 	'https://auth.api.sonyentertainmentnetwork.com'
		,redirectURL_oauth: 'com.scee.psxandroid.scecompcall://redirect'	// Android Callback URL
		,client_id: 	'b0d0d7ad-bb99-4ab1-b25e-afa0c76577b0' 				// Client ID
		,scope: 		'sceapp' 				// SEN Scope
		,scope_psn: 	'psn:sceapp' 			// PSN Scope
		,csrfToken: 	''						// csrf Token
		,authCode : 	''						// authCode needed to ask for an access token
		,client_secret: 'Zo4y8eGIa3oazIEp' 		// Secret string, this is most likely to change overtime. If it changes, please contribute to this project.
		,duid: 			'00000005006401283335353338373035333434333134313a433635303220202020202020202020202020202020' 	// I still don't know what "duid" stands for... if you do, create an issue about it please!
		,cltm: 			'1399637146935'
		,service_entity: 'urn:service-entity:psn'
	}
	,livestreamURL = {
		nicoNicoLiveUrl:'http://edn.live.nicovideo.jp/api/v1.0/programs?offset={{offset}}&limit={{limit}}&status={{status}}&sce_platform={{platform}}&sort={{sort}}'
		,ustreamUrl: 'https://ps4api.ustream.tv/media.json?'
		,twitchUrl: 'https://api.twitch.tv/api/orbis/streams?offset={{offset}}&limit={{limit}}&query={{query}}&'
		,twitchPlatformHeader: '54bd6377db3b48cba9ecc44bff5a410b'
	}

	// URL Vars used for login to PSN and pulling information
	,psnURL = {
		SignIN:  		psnVars.SENBaseURL + '/2.0/oauth/authorize?response_type=code&service_entity='+psnVars.service_entity+'&returnAuthCode=true&cltm='+psnVars.cltm+'&redirect_uri='+psnVars.redirectURL_oauth+'&client_id='+psnVars.client_id+'&scope='+psnVars.scope_psn // New SEN login page (no csrfToken this time)
		,SignINPOST: 	psnVars.SENBaseURL + '/login.do'		// POST DATA for login must be sended here
		,oauth: 		'https://auth.api.sonyentertainmentnetwork.com/2.0/oauth/token' 	// PSN's OAuth implementation Uri
		,profileData: 	'https://{{region}}-prof.np.community.playstation.net/userProfile/v1/users/{{id}}/profile?fields=%40default,relation,requestMessageFlag,presence,%40personalDetail,trophySummary'
		,addRemoveFriend: 'https://{{region}}-prof.np.community.playstation.net/userProfile/v1/users/{{id}}/friendList/{{friendId}}'
		,sendFriendRequest: 'https://{{region}}-prof.np.community.playstation.net/userProfile/v1/users/{{id}}/friendList/{{friendId}}?requestMessage={{requestMessage}}'
		,notificationsUrl: 'https://{{region}}-ntl.np.community.playstation.net/notificationList/v1/users/{{id}}/notifications?fields=@default%2Cmessage%2CactionUrl&npLanguage={{lang}}'
		,friendData:    'https://{{region}}-prof.np.community.playstation.net/userProfile/v1/users/{{id}}/friendList?fields=%40default,relation,onlineId,avatarUrl,plus,%40personalDetail,trophySummary&sort=onlineId&avatarSize=m&limit=32&offset={{offset}}&friendStatus={{friendStatus}}'
		,friendMe: 'https://friendme.sonyentertainmentnetwork.com/friendme/api/v1/c2s/users/me/friendrequest'
		,messageGroup: 'https://{{region}}-gmsg.np.community.playstation.net/groupMessaging/v1/users/{{id}}/messageGroups?fields=@default%2CmessageGroupId%2CmessageGroupDetail%2CtotalUnseenMessages%2CtotalMessages%2ClatestMessage&npLanguage=' + options.npLanguage
		,messageContent: 'https://{{region}}-gmsg.np.community.playstation.net/groupMessaging/v1/messageGroups/{{id}}/messages/{{messageUid}}?contentKey={{contentKey}}&npLanguage=' + options.npLanguage
		,trophyData: 	'https://{{region}}-tpy.np.community.playstation.net/trophy/v1/trophyTitles?fields=%40default&npLanguage={{lang}}&iconSize={{iconsize}}&platform=PS3%2CPSVITA%2CPS4&offset={{offset}}&limit={{limit}}&comparedUser={{id}}'	// NOTE: All server are in the US, the only change are market restrictions
		,trophyDataList:'https://{{region}}-tpy.np.community.playstation.net/trophy/v1/trophyTitles/{{npCommunicationId}}/trophyGroups/{{groupId}}/trophies?fields=%40default,trophyRare,trophyEarnedRate&npLanguage={{lang}}'
		,trophyGroupList:'https://{{region}}-tpy.np.community.playstation.net/trophy/v1/trophyTitles/{{npCommunicationId}}/trophyGroups/?npLanguage={{lang}}'
		,trophyInfo:	'https://{{region}}-tpy.np.community.playstation.net/trophy/v1/trophyTitles/{{npCommunicationId}}/trophyGroups/{{groupId}}/trophies/{{trophyID}}?fields=%40default,trophyRare,trophyEarnedRate&npLanguage={{lang}}'
		,recentActivityFeed: 'https://activity.api.np.km.playstation.net/activity/api/v1/users/{{id}}/{{newsFeed}}/{{pageNumber}}?filters=PURCHASED&filters=RATED&filters=VIDEO_UPLOAD&filters=SCREENSHOT_UPLOAD&filters=PLAYED_GAME&filters=STORE_PROMO&filters=WATCHED_VIDEO&filters=TROPHY&filters=BROADCASTING&filters=LIKED&filters=PROFILE_PIC&filters=FRIENDED&filters=CONTENT_SHARE'
		,recentActivityLikeItem: 'https://activity.api.np.km.playstation.net/activity/api/v1/users/{{id}}/set/{{likeDislike}}/story/{{feedId}}'
		,verifyUser: 'https://vl.api.np.km.playstation.net/vl/api/v1/mobile/users/me/info'
	}
	,accessToken = ''
	,refreshToken = ''
	,refreshInterval
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
				'User-Agent': 'Mozilla/5.0 (Linux; U; Android 4.3; '+options.npLanguage+'; C6502 Build/10.4.1.B.0.101) AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 Mobile Safari/534.30 PlayStation App/1.60.5/'+options.npLanguage+'/'+options.npLanguage
			}
		}
		, function (error, response, body) {
			(typeof callback === "function" ? getLogin(callback, psnVars.SENBaseURL + response.req.path) : getLogin(undefined, psnVars.SENBaseURL + response.req.path));
	})
}
/*
* @desc 	Login into PSN/SEN and creates a session with an auth code
* @param 	Function callback - Calls this function once the login is complete
*/
function getLogin(callback, url) {
	request.post(psnURL.SignINPOST
		,{
			headers: {
				'Origin':'https://auth.api.sonyentertainmentnetwork.com'
				,'Referer': url
			}
			,form:{
				'params' 		: 'service_entity=psn'
				,'j_username'	: options.email
				,'j_password'	: options.password
			}
		}, function (error, response, body) {
			request.get(response.headers.location, function (error, response, body) {
				if (!error) {
					var urlString = unescape(response.req.path);
					psnVars.authCode = urlString.substr(urlString.indexOf("authCode=") + 9, 6);
					debug('authCode obtained: ' + psnVars.authCode);
					getAccessToken(psnVars.authCode, callback);	
				}
				else {
					debug('ERROR: ' + error)
				}
			})
		}
	)
}
/*
* @desc 	Gets the access token
* @param 	String		authCode - The authCode obtained from the previous login request
* @param 	Function 	callback - Calls this function once the request is complete
*/
function getAccessToken(authCode, callback) {
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
						getUserInfo();
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
* @desc 	Creates PUT request
* @param 	String		url 		- The URL to ask data from
* @param 	Function 	callback 	- Calls this function once the request is complete
*/
function psnPUTRequest (url, callback) {
	var 
		reqOptions = {
			url: url
			,method : 'PUT'
			,headers: {
				'Access-Control-Request-Method': 'PUT'
				,'Origin': 'http://psapp.dl.playstation.net'
				,'Access-Control-Request-Headers': 'Origin, Accept-Language, Authorization, Content-Type, Cache-Control'
				,'Accept-Language': options.npLanguage +","+languages.join(',')
				,'Authorization': 'Bearer ' + accessToken
				,'Cache-Control': 'no-cache'
				,'X-Requested-With': 'com.scee.psxandroid'
				,'User-Agent': 'Mozilla/5.0 (Linux; U; Android 4.3; '+options.npLanguage+'; C6502 Build/10.4.1.B.0.101) AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 Mobile Safari/534.30 PlayStation App/1.60.5/'+options.npLanguage+'/'+options.npLanguage
			}
		}
	;
	request.put(reqOptions, function(error, response, body) {
		// Does not return json, unless it errors.
		var responseJSON;
		if(!error) {
			if (response.statusCode == 200) {
				callback(false, responseJSON) // Everything seems to be ok
			}
			else if(response.statusCode == 401) {
				responseJSON = JSON.parse(body);
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
				responseJSON = JSON.parse(body);
				callback(true, responseJSON) // TODO: Handle non 200 errors
			}
		}
		else {
			callback(true, error) // Return the error
		}
	})
}
/*
* @desc 	Creates DELETE request
* @param 	String		url 		- The URL to ask data from
* @param 	Function 	callback 	- Calls this function once the request is complete
*/
function psnDELETERequest (url, callback) {
	var 
		reqOptions = {
			url: url
			,method : 'DELETE'
			,headers: {
				'Access-Control-Request-Method': 'DELETE'
				,'Origin': 'http://psapp.dl.playstation.net'
				,'Access-Control-Request-Headers': 'Origin, Accept-Language, Authorization, Content-Type, Cache-Control'
				,'Accept-Language': options.npLanguage +","+languages.join(',')
				,'Authorization': 'Bearer ' + accessToken
				,'Cache-Control': 'no-cache'
				,'X-Requested-With': 'com.scee.psxandroid'
				,'User-Agent': 'Mozilla/5.0 (Linux; U; Android 4.3; '+options.npLanguage+'; C6502 Build/10.4.1.B.0.101) AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 Mobile Safari/534.30 PlayStation App/1.60.5/'+options.npLanguage+'/'+options.npLanguage
			}
		}
	;
	request.del(reqOptions, function(error, response, body) {
		var responseJSON;
		if(!error) {
			if (response.statusCode == 200) {
				callback(false, responseJSON) // Everything seems to be ok
			}
			else if(response.statusCode == 401) {
				responseJSON = JSON.parse(body);
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
				responseJSON = JSON.parse(body);
				callback(true, responseJSON) // TODO: Handle non 200 errors
			}
		}
		else {
			callback(true, error) // Return the error
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
				,'X-Requested-With': 'com.scee.psxandroid'
				,'platform': '54bd6377db3b48cba9ecc44bff5a410b'
				,'User-Agent': 'Mozilla/5.0 (Linux; U; Android 4.3; '+options.npLanguage+'; C6502 Build/10.4.1.B.0.101) AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 Mobile Safari/534.30 PlayStation App/1.60.5/'+options.npLanguage+'/'+options.npLanguage
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
				debug(responseJSON);
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
* @param 	String		content 	- The content to send along with the post, if any.
* @param 	Function 	callback 	- Calls this function once the request is complete
*/
function psnPOSTRequest (url, content, callback) {
	var 
		reqOptions = {
			 url: url
			 ,json: content
			,method : 'POST'
			,headers: {
				'Access-Control-Request-Method': 'POST'
				,'Origin': 'http://psapp.dl.playstation.net'
				,'Access-Control-Request-Headers': 'Origin, Accept-Language, Authorization, Content-Type, Cache-Control'
				,'Accept-Language': options.npLanguage +","+languages.join(',')
				,'Authorization': 'Bearer ' + accessToken
				,'Cache-Control': 'no-cache'
				,'X-Requested-With': 'com.scee.psxandroid'
				,'User-Agent': 'Mozilla/5.0 (Linux; U; Android 4.3; '+options.npLanguage+'; C6502 Build/10.4.1.B.0.101) AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 Mobile Safari/534.30 PlayStation App/1.60.5/'+options.npLanguage+'/'+options.npLanguage
			}
		}
	;
	request.post(reqOptions, function(error, response, body) {
		var responseJSON;
		// The body IS json, hence we directly set it.
		responseJSON = body;
		if(!error) {
			debug(response.statusCode);
			// 204: "no-content", does not return json.
			if (response.statusCode == 200 || response.statusCode == 201 || response.statusCode == 204) {
				callback(false, responseJSON) // Everything seems to be ok
			}
			else if(response.statusCode == 401) {
				if ('error' in responseJSON) {
					if (response.error.code && (responseJSON.error.code === 2105858 || responseJSON.error.code === 2138626)) {
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
* @desc 	Get the message group for the given PSN id.
* @param 	String 		psnid 		- User's PSN ID
* @param 	Function 	callback 	- Calls this function once the request is complete
*/
exports.getMessageGroup = function (psnid, callback) {
	if (accessToken.length > 1) {
		debug('Get the message group for: ' + psnid);
		psnGETRequest(psnURL.messageGroup.replace("{{id}}", psnid),callback);
	}
	else {
		debug('Asking for new token');
		getAccessToken('',function() {
			psnGETRequest(psnURL.messageGroup.replace("{{id}}", psnid),callback);
		})
	}
}
/*
* @desc 	Get the message count for a given message.
* @param 	String 		id 			- Message Id
* @param 	String 		messageUid	- Message Uid
* @param 	String 		contentKey	- The content key (example: image-data-0)
* @param 	Function 	callback 	- Calls this function once the request is complete
*/
exports.getMessageContent = function (id, messageUid, contentKey, callback) {
	if (accessToken.length > 1) {
		debug('Get the message content for: ' + contentKey);
		psnGETRequest(psnURL.messageContent.replace("{{id}}", id).replace("{{messageUid}}", messageUid).replace("{{contentKey}}", contentKey),callback);
	}
	else {
		debug('Asking for new token');
		getAccessToken('',function() {
			psnGETRequest(psnURL.messageContent.replace("{{id}}", id).replace("{{messageUid}}", messageUid).replace("{{contentKey}}", contentKey),callback);
		})
	}
}
/*
* @desc 	Get the recent activity list for the PSN user.
* @param 	String 		psnid 			- User's PSN ID.
* @param 	String 		newsFeed 		- Takes in "feed" or "news", returns different feeds.
* @param 	int 		pageNumber 		- The recent activity page number.
* @param 	Function 	callback 		- Calls this function once the request is complete
*/
exports.getRecentActivity = function (psnid, newsFeed, pageNumber, callback) {
	if (accessToken.length > 1) {
		debug('Getting recent activity feed for ' + psnid);
		psnGETRequest(psnURL.recentActivityFeed.replace("{{id}}", psnid).replace("{{newsFeed}}", newsFeed).replace("{{pageNumber}}", pageNumber),callback);
	}
	else {
		debug('Asking for new token');
		getAccessToken('',function() {
			psnGETRequest(psnURL.recentActivityFeed.replace("{{id}}", psnid).replace("{{newsFeed}}", newsFeed).replace("{{pageNumber}}", pageNumber),callback);
		})
	}
}
/*.
* @desc 	Like or dislike a recent activity item
* @param 	String 		feedId 			- The recent activity feed id.
* @param 	String 		isLiked 		- Set with "like" or "dislike".
* @param 	Function 	callback 		- Calls this function once the request is complete
*/
exports.likeRecentActivityItem = function (feedId, isLiked, callback) {
	if (accessToken.length > 1) {
		debug(isLiked + ' recent activity item ' + feedId);
		psnPOSTRequest(psnURL.recentActivityLikeItem.replace("{{id}}", options.psnId).replace("{{feedId}}", feedId).replace("{{likeDislike}}", isLiked), null, callback);
	}
	else {
		debug('Asking for new token');
		getAccessToken('',function() {
			psnPOSTRequest(psnURL.recentActivityLikeItem.replace("{{id}}", options.psnId).replace("{{feedId}}", feedId).replace("{{likeDislike}}", isLiked), null, callback);
		})
	}
}
/*
* @desc 	Get the notifications for the current user
* @param 	String 		psnid 		- User's PSN ID
* @param 	Function 	callback 	- Calls this function once the request is complete
*/
exports.getNotifications = function (psnid, callback) {
	if (accessToken.length > 1) {
		debug('Getting notifications for ' + options.psnId);
		psnGETRequest(psnURL.notificationsUrl.replace("{{id}}", options.psnId).replace("{{lang}}", options.npLanguage),callback);
	}
	else {
		debug('Asking for new token');
		getAccessToken('',function() {
			psnGETRequest(psnURL.notificationsUrl.replace("{{id}}", options.psnId).replace("{{lang}}", options.npLanguage),callback);
		})
	}
}
/*
* @desc 	Get Nico Nico video feed
* @param 	String 		status 		- The status of the feed.
* @param 	String 		platform 	- The selected platform.
* @param 	String 		offset 		- The offset of the list (Sony hardcodes this value at 0, but we can keep the offset going)
* @param 	String 		limit 		- The limit of results. (Sony hardcodes this at 80)
* @param 	String 		sort 		- Hardcoded to "view"
* @param 	Function 	callback 	- Calls this function once the request is complete
*/
exports.getNicoNicoFeed = function (status, platform, offset, limit, sort, callback) {
	if (accessToken.length > 1) {
		debug('Getting nicoVideo feed');
		psnGETRequest(livestreamURL.nicoNicoLiveUrl.replace("{{status}}", status).replace("{{platform}}", platform).replace("{{offset}}", offset).replace("{{limit}}", limit).replace("{{sort}}", sort),callback);
	}
	else {
		debug('Asking for new token');
		getAccessToken('',function() {
	psnGETRequest(livestreamURL.nicoNicoLiveUrl.replace("{{status}}", status).replace("{{platform}}", platform).replace("{{offset}}", offset).replace("{{limit}}", limit).replace("{{sort}}", sort),callback);
		})
	}
}
/*
* @desc 	Get Twitch.TV video feed
* @param 	String 		offset 		- The offset of the list (Sony hardcodes this value at 0, but we can keep the offset going)
* @param 	String 		limit 		- The limit of results. (Sony hardcodes this at 80)
* @param 	String 		query 		- The Query.
* @param 	Function 	callback 	- Calls this function once the request is complete
*/
exports.getTwitchFeed = function (offset, limit, query, callback) {
	if (accessToken.length > 1) {
		debug('Getting Twitch.TV feed');
		psnGETRequest(livestreamURL.twitchUrl.replace("{{offset}}", offset).replace("{{limit}}", limit).replace("{{query}}", query),callback);
	}
	else {
		debug('Asking for new token');
		getAccessToken('',function() {
		psnGETRequest(livestreamURL.twitchUrl.replace("{{offset}}", offset).replace("{{limit}}", limit).replace("{{query}}", query),callback);
		})
	}
}
/*
* @desc 	Add or remove a friend from the current PSN users friend list.
* @param 	String 		friendId 	- The ID the user wishes to either add or remove
* @param 	Bool 		addFriend   - If true, add the friend. If false, delete the friend.
* @param 	Function 	callback 	- Calls this function once the request is complete
*/
exports.addRemoveFriend = function (friendId, addFriend, callback) {
	
	if(addFriend)
	{
		if (accessToken.length > 1) {
		debug('Adding ' + friendId);
		psnPUTRequest(psnURL.addRemoveFriend.replace("{{id}}", options.psnId).replace("{{friendId}}", friendId),callback);
		
		}
		else {
		debug('Asking for new token');
		getAccessToken('',function() {
		psnPUTRequest(psnURL.addRemoveFriend.replace("{{id}}", options.psnId).replace("{{friendId}}", friendId),callback);
			})
		}
	}
	else
	{
		if (accessToken.length > 1) {
		debug('Removing ' + friendId + ' from the friend list of ' + options.psnId);
		psnDELETERequest(psnURL.addRemoveFriend.replace("{{id}}", options.psnId).replace("{{friendId}}", friendId),callback);
		
		}
		else {
		debug('Asking for new token');
		getAccessToken('',function() {
		psnDELETERequest(psnURL.addRemoveFriend.replace("{{id}}", options.psnId).replace("{{friendId}}", friendId),callback);
			})
		}
	}
}
/*
* @desc 	Send a friend request to a given PSN ID
* @param 	String 		psnid 			- The user PSN ID to send the request to.
* @param 	String 		requestMessage 	- The request message.
* @param 	Function 	callback 		- Calls this function once the request is complete
*/
exports.sendFriendRequest = function (psnid, requestMessage, callback) {
	if (accessToken.length > 1) {
		debug('Sending a friend request to ' + psnid);
		var content = {"requestMessage" : requestMessage}
		psnPOSTRequest(psnURL.sendFriendRequest.replace("{{id}}", options.psnId).replace("{{friendId}}", psnid).replace("{{requestMessage}}", requestMessage), content, callback);
	}
	else {
		debug('Asking for new token');
		getAccessToken('',function() {
			var content = {"requestMessage" : requestMessage}
			psnPOSTRequest(psnURL.sendFriendRequest.replace("{{id}}", options.psnId).replace("{{friendId}}", psnid).replace("{{requestMessage}}", requestMessage), content, callback);
		})
	}
}
/*
* @desc 	Get the friends list for the given PSNID
* @param 	String 		psnid 		- User's PSN ID
* @param 	int 		offset 		- The offset value, used to get the users friend list at the starting index.
* @param 	String 		friendStatus - Gets the requested friends list. Takes in "friend", "requesting", or "requested".
* @param 	Function 	callback 	- Calls this function once the request is complete
*/
exports.getFriendsList = function (psnid, offset, friendStatus, callback) {
	if (accessToken.length > 1) {
		debug('Asking for the friends (' + friendStatus + ') list of: ' + psnid + ' at ' + offset);
		psnGETRequest(psnURL.friendData.replace("{{id}}", psnid).replace("{{offset}}", offset).replace("{{friendStatus}}", friendStatus),callback);
	}
	else {
		debug('Asking for new token');
		getAccessToken('',function() {
			psnGETRequest(psnURL.friendData.replace("{{id}}", psnid).replace("{{offset}}", offset).replace("{{friendStatus}}", friendStatus),callback);
		})
	}
}
/*
* @desc 	Get SMS/Short URL friend request link
* @param 	Function 	callback 	- Calls this function once the request is complete
*/
exports.getFriendRequestUrl = function (test, callback) {
	var content = {"type" : "ONE"};
	if (accessToken.length > 1) {
		debug('Getting Short URL friend request');
		psnPOSTRequest(psnURL.friendMe,content,callback);
	}
	else {
		debug('Asking for new token');
		getAccessToken('',function() {
			psnPOSTRequest(psnURL.friendMe,content,callback);
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
* @desc 	Gets the current PSN users information. Users do not need to call this.
*/
function getUserInfo () {
	if (accessToken.length > 1) {
		debug('Getting the current users PSN information...');
		psnGETRequest(psnURL.verifyUser,saveUserInfo);
	}
	else {
		debug('Asking for new token');
		initLogin(function() {
			psnGETRequest(psnURL.verifyUser,saveUserInfo);
		})
	}
}

/*
* @desc 	Save the current PSN users information. Users do not need to call this.
*/
function saveUserInfo(error, responseJSON){
	// TODO: Save the rest of the users settings returned.
	debug(responseJSON.onlineId + ' is logged in.');
	options.psnId = responseJSON.onlineId;
	options.region = responseJSON.region;
	options.npLanguage = responseJSON.language;
	options.accountId = responseJSON.accountId;
	options.mAccountId = responseJSON.mAccountId;
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