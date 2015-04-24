/*!
*
* Gumer Playstation Network API
* v0.1.2
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

console.log('Starting gPSN');

gumerPSN.init({		// Our PSN Module, we have to start it once. - irkinsander
	debug:		true				// Let's set it true, it's still in early development. So, report everything that goes wrong please.
	,email:		"{{username}}"		// A valid PSN/SCE account (can be new one) // TODO: Using the user's credentials to do this.
	,password:	"{{password}}"		// Account's password, du'h
	,npLanguage:	"en"			// The language the trophy's name and description will shown as
	,region: 		"us"			// The server region that will push data
});

// Taken from Express site, this takes /{{id}}/ parameter
app.param(function(name, fn){	
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

// Gets the ID owner's profile information and returns the JSON object.
app.get('/PSN/:id', function(req, res){ 
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
					error: true, message: "Something went terribly wrong, submit an issue on GitHub please!", response: profileData
				})
			}
		}
	})
})
// Gets the friends list of the PSN user. 
// The offset is needed as you can only request a limited amount of friends at a time.
// As a result, you must keep track of the offset to get the entire friend list.
app.get('/PSN/:id/friendList/:friendStatus/:offset', function(req, res){ 
	gumerPSN.getFriendsList(req.params.id, req.params.offset, req.params.friendStatus, function(error, friendData) {
		if (!error) {
			res.send(friendData)
		}
		else {
			if (friendData.error.code == 2105356) {		// User not found code
				res.send({
					error: true, message: "PSN ID not found"
				})
			}
			else {
				res.send({
					error: true, message: "Something went terribly wrong, submit an issue on GitHub please!", response: friendData
				})
			}
		}
	})
})
// Adds or removed a friend from your PSN friend list.
// "id" takes in the friend id.
// "addRemove" is a bool value for either adding or removing the friend.
app.get('/PSN/friendList/:id/:addRemove', function(req, res){ 
	gumerPSN.addRemoveFriend(req.params.id, req.params.addRemove, function(error, addRemoveFriendData) {
		if (!error) {
			res.send(addRemoveFriendData)
		}
		else {
			if (addRemoveFriendData.error.code == 2105356) {		// User not found code
				res.send({
					error: true, message: "PSN ID not found"
				})
			}
			else {
				res.send({
					error: true, message: "Something went terribly wrong, submit an issue on GitHub please!", response: addRemoveFriendData
				})
			}
		}
	})
})
// Sends a PSN Friend Request
app.get('/PSN/sendFriendRequest/:id', function(req, res){ 
	gumerPSN.sendFriendRequest(req.params.id, "test", function(error, sendFriendRequestData) {
		if (!error) {
			res.send(sendFriendRequestData)
		}
		else {
				res.send({
					error: true, message: "Something went terribly wrong, submit an issue on GitHub please!", response: sendFriendRequestData
				})
		}
	})
})
// Gets a short URL friend request
app.get('/PSN/friendMe/getLink', function(req, res){ 
	gumerPSN.getFriendRequestUrl("", function(error, friendRequestUrlData) {
		if (!error) {
			res.send(friendRequestUrlData)
		}
		else {
				res.send({
					error: true, message: "Something went terribly wrong, submit an issue on GitHub please!", response: friendRequestUrlData
				})
		}
	})
})
// Get a PSN users recent activity list list
app.get('/PSN/recentActivity/:id/:newsFeed/:pageNumber', function(req, res){ 
	gumerPSN.getRecentActivity(req.params.id, req.params.newsFeed, req.params.pageNumber, function(error, recentActivityData) {
		if (!error) {
			res.send(recentActivityData)
		}
		else {
				res.send({
					error: true, message: "Something went terribly wrong, submit an issue on GitHub please!", response: recentActivityData
				})
		}
	})
})
// Like or dislike a recent activity item
app.get('/PSN/likeDislikeRecentItem/:feedId/:isLiked', function(req, res){ 
	gumerPSN.likeRecentActivityItem(req.params.feedId, req.params.isLiked, function(error, recentActivityData) {
		if (!error) {
			res.send(recentActivityData)
		}
		else {
				res.send({
					error: true, message: "Something went terribly wrong, submit an issue on GitHub please!", response: recentActivityData
				})
		}
	})
})
// Get nico video live feed.
// For the example, we are using the hard coded value sony uses in their own app. You can override them though.
app.get('/PSN/nicovideo/getNicoNicoFeed', function(req, res){ 
	gumerPSN.getNicoNicoFeed("onair", "PS4", 0, 80, "view",  function(error, nicoData) {
		if (!error) {
			res.send(nicoData)
		}
		else {
				res.send({
					error: true, message: "Something went terribly wrong, submit an issue on GitHub please!", response: nicoData
				})
		}
	})
})
// Get Twitch.TV feed.
// For the example, we are using the hard coded value sony uses in their own app. You can override them though.
app.get('/PSN/twitch/getTwitchFeed', function(req, res){ 
	gumerPSN.getTwitchFeed(0, 80, "PS4", function(error, nicoData) {
		if (!error) {
			res.send(nicoData)
		}
		else {
				res.send({
					error: true, message: "Something went terribly wrong, submit an issue on GitHub please!", response: nicoData
				})
		}
	})
})
// Get a PSN users message groups
app.get('/PSN/messages/getMessageGroups/:id', function(req, res){ 
	gumerPSN.getMessageGroup(req.params.id, function(error, messageGroupData) {
		if (!error) {
			res.send(messageGroupData)
		}
		else {
				res.send({
					error: true, message: "Something went terribly wrong, submit an issue on GitHub please!", response: messageGroupData
				})
		}
	})
})
// Get a messages content
app.get('/PSN/messages/getMessageContent/:id/:messageUid/:contentKey', function(req, res){ 
	gumerPSN.getMessageContent(req.params.id, req.params.messageUid, req.params.contentKey, function(error, messageContent) {
		if (!error) {
			res.send(messageContent)
		}
		else {
				res.send({
					error: true, message: "Something went terribly wrong, submit an issue on GitHub please!", response: messageContent
				})
		}
	})
})
// Get a PSN users notification list
app.get('/PSN/notifications/getNotifications', function(req, res){ 
	gumerPSN.getNotifications(req.params.id, function(error, notificationData) {
		if (!error) {
			res.send(notificationData)
		}
		else {
				res.send({
					error: true, message: "Something went terribly wrong, submit an issue on GitHub please!", response: notificationData
				})
		}
	})
})
// Gets the ID owner's trophy (first 100) information and returns the JSON object.
app.get('/PSN/:id/trophies', function(req, res){ 
	gumerPSN.getTrophies(req.params.id, "m", 0, 100, function(error, trophyData) {
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
					error: true, message: "Something went terribly wrong, submit an issue on GitHub please!", response: trophyData
				})
			}
		}
	})
})
// Gets the ID owner's trophies for the given game title including all DLC's
app.get('/PSN/:id/trophies/:npCommID', function(req, res){ 
	gumerPSN.getGameTrophies(req.params.id, req.params.npCommID, '', function(error, trophyData) {
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
					error: true, message: "Something went terribly wrong, submit an issue on GitHub please!", response: trophyData
				})
			}
		}
	})
})
// Gets the ID owner's trophies for the given game title including all DLC's
app.get('/PSN/:id/trophies/:npCommID/groups', function(req, res){ 
	gumerPSN.getGameTrophyGroups(req.params.id, req.params.npCommID, function(error, trophyData) {
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
					error: true, message: "Something went terribly wrong, submit an issue on GitHub please!", response: trophyData
				})
			}
		}
	})
})
// Gets the ID owner's trophies for the given game title for the given group (DLC)
app.get('/PSN/:id/trophies/:npCommID/groups/:groupID', function(req, res){ 
	gumerPSN.getGameTrophies(req.params.id, req.params.npCommID, req.params.groupID, function(error, trophyData) {
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
					error: true, message: "Something went terribly wrong, submit an issue on GitHub please!", response: trophyData
				})
			}
		}
	})
})
// Gets the info for the given DLC or game's default trophy
app.get('/PSN/:id/trophies/:npCommID/:trophyID', function(req, res){ 
	gumerPSN.getTrophy(req.params.id, req.params.npCommID, '', req.params.trophyID, function(error, trophyData) {
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
					error: true, message: "Something went terribly wrong, submit an issue on GitHub please!", response: trophyData
				})
			}
		}
	})
})
// We listen in the port 3000
app.listen(3000); 
console.log('gumerPSN Example running at http://localhost:3000/');