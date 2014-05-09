gumer-psn
=========

A Playstation Network API written in Node.js

**v0.1.2**

Another languages:

PHP: https://github.com/ilendemli/gumer-psn-php by @ilendemli

##About
This script uses the method found in Sony's official Android application that sends JSON in every response and NOT xml.
For now this script can get:
* Updated profile data. *(1 hour max)*
* Trophy data
	* Summary whithin all games owned (that supports trophies)
	* by gameID (npCommunicationID) 
	* by group *(DLC, Expansion)*
 
###Features planned
* Caching
* Friends
 	* Friends management (add, delete, block)
	* Messaging (chat) *Voice/Image support will be added someday, no way to test it without a PSVITA/PS3/PS4 system*
* Profile Feeds (depends on user's privacy) *(user just played Battlefield 4, "user" has started broadcasting, "user" has just become friends with "another user", etc...)*
* Stream Freed (Twitch, UStream)
* User's login for self management
* Notifications
* User friend list (depends on user's privacy)
* Gems (Pronuntiation for PS4, and a few console downloads) *NOTE: I will not share SONY's HmacSHA1 key here on GitHub*

##Requirements
* A valid PSN account *(can be new)*
* Node.js >= 0.8.x
* JavaScript knowledge, lol

##Known Limitations
* It doesn't display **hidden trophies** *this is a server-side restriction*. If you do have another way to get them please share it.

##Installing

You can install it with the package manager

		npm install gumer-psn
		
Or clone the repository and install the dependencies

		git clone https://github.com/jhewt/gumer-psn.git
		cd gumer-psn/
		npm install
		
##Usage

###Using the example
This example uses Express

    cp example/index.js ./
    npm install express
    node index.js
		
Once it has started, you can start asking profile or trophy data by going to: 
*	**Profile**: http://localhost:3000/PSN/**your_id**
*	**Trophies Summary**: http://localhost:3000/PSN/**your_id**/trophies
*	**Trophies by gameID**: http://localhost:3000/PSN/**your_id**/trophies/**gameID**
*	**Trophies groups**: http://localhost:3000/PSN/**your_id**/trophies/**gameID**/groups
*	**Trophies by groupID**: http://localhost:3000/PSN/**your_id**/trophies/**gameID**/groups/**groupID**
*	**Trophy info by tophyID**: http://localhost:3000/PSN/**your_id**/trophies/**gameID**/**tophyID**

###Init
```javascript
var gumerPSN 	= require('./psn');
	
	// Init the API
gumerPSN.init({		// Our PSN Module, we have to start it once. - irkinsander
	debug: 		true					// Let's set it true, it's still in early development. So, report everything that goes wrong please.
	,email: 	"your_account"			// A valid PSN/SCE account (can be new one) // TODO: Using the user's credentials to do this.
	,password: 	"your_password"			// Account's password, du'h
	,npLanguage:"en"					// The language the trophy's name and description will shown as
	,region: 	"us"					// The server region that will push data
});
```
###Getting profile data by ID
```javascript
// ID
gumerPSN.getProfile('JSachs13', function(error, profileData) { 
		console.log(profileData)
})
```
Output:
```json
{
	"onlineId":"JSachs13",
	"region":"ar",
	"npId":"SlNhY2hzMTNAZDIuYXI=",
	"avatarUrl":"http://static-resource.np.community.playstation.net/avatar/default/DefaultAvatar.png",
	"aboutMe":"",
	"languagesUsed":["en"],
	"plus":0,
	"trophySummary":{
		"level":1,"progress":0,"earnedTrophies":{"platinum":0,"gold":0,"silver":0,"bronze":0}
	},
	"relation":"me",
	"presence":{
		"primaryInfo":{"onlineStatus":"offline"}
	}
}
```
###Getting trophy summary by userID
```javascript
// ID, START, LIMIT
gumerPSN.getProfile('OSXelot', 0, 10, function(error, trophyData) { 
		console.log(trophyData)
})
```
It should output 10 trophies formatted like this:
```json
{
	"totalResults": 119,
	"offset": 0,
	"limit": 10,
	"trophyTitles": [{
			"npCommunicationId": "NPWR05738_00",
			"trophyTitleName": "Thief",
			"trophyTitleDetail": "Thief",
			"trophyTitleIconUrl": "http://trophy01.np.community.playstation.net/trophy/np/NPWR05738_00_005CF20744AFD7A6E1C94DEB60ADF92CE36B378190/AC656F00CF22AE504B0B976A5CDDED1C766835F0.PNG",
			"trophyTitlePlatfrom": "PS4",
			"hasTrophyGroups": false,
			"definedTrophies": {
					"bronze": 24,
					"silver": 8,
					"gold": 5,
					"platinum": 1
			},
			"comparedUser": {
					"onlineId": "OSXelot",
					"progress": 1,
					"earnedTrophies": {
							"bronze": 1,
							"silver": 0,
							"gold": 0,
							"platinum": 0
					},
					"lastUpdateDate": "2014-02-26T01:48:59Z"
			}
	}, 
	{
		"...":"..."
	}
	]
}
```
###Getting trophies list by GameID (npCommunicationID)
```javascript
// ID (optional, if blank it doesn't compare to that user), GAMEID, GROUPID (optional, if leave blank it displays every trophy (default + DLCs))
gumerPSN.getGameTrophies('OSXelot', 'NPWR05506_00', '', function(error, trophyData) {
		console.log(trophyData)
})
```
Output: (Killzone)
```JSON
{
	"trophies": [{
		"trophyId": 0,
		"trophyHidden": false,
		"trophyType": "platinum",
		"trophyName": "Hero",
		"trophyDetail": "Obtain all Killzone Shadow Fall trophies",
		"trophyIconUrl": "http://trophy01.np.community.playstation.net/trophy/np/NPWR05506_00_00484C26373EBD73895C66E4E5FD1F91432F176895/AE011855D3F4C4E7DFE868DAAD607FBBAB821094.PNG",
		"trophyRare": 0,
		"trophyEarnedRate": "0.1",
		"comparedUser": {
			"onlineId": "OSXelot",
			"earned": false
		}
	}, {
		"trophyId": 1,
		"trophyHidden": false,
		"trophyType": "bronze",
		"trophyName": "The Father",
		"trophyDetail": "Complete level 'The Father'",
		"trophyIconUrl": "http://trophy01.np.community.playstation.net/trophy/np/NPWR05506_00_00484C26373EBD73895C66E4E5FD1F91432F176895/CFD68018F0D838073C5D322534482B0E559CAA86.PNG",
		"trophyRare": 3,
		"trophyEarnedRate": "92.0",
		"comparedUser": {
			"onlineId": "OSXelot",
			"earned": true,
			"earnedDate": "2013-11-25T21:37:50Z"
		}
	},{
		"trophyId": 3,
		"trophyHidden": false,
		"trophyType": "bronze",
		"trophyName": "Deniable",
		"trophyDetail": "In 'The Shadow', operate without raising an alarm or disabling the security mainframe",
		"trophyIconUrl": "http://trophy01.np.community.playstation.net/trophy/np/NPWR05506_00_00484C26373EBD73895C66E4E5FD1F91432F176895/770E87B1A054B4232DC23331D1061E426CD37D14.PNG",
		"trophyRare": 0,
		"trophyEarnedRate": "1.5",
		"comparedUser": {
			"onlineId": "OSXelot",
			"earned": false
		}
	},	{"..."}]
}
```
###Getting trophies groups by GameID (npCommunicationID)
```javascript
// ID (optional, if not blank it displays the progression of each group), GAMEID
gumerPSN.getGameTrophyGroups('OSXelot', 'NPWR05506_00', function(error, trophyData) {
		console.log(trophyData)
})
```

Output:
```JSON
{
	"trophyTitleName": "Killzone Shadow Fall",
	"trophyTitleDetail": "Killzone Shadow Fall trophy set",
	"trophyTitleIconUrl": "http://trophy01.np.community.playstation.net/trophy/np/NPWR05506_00_00484C26373EBD73895C66E4E5FD1F91432F176895/CB728C2FC4AEF61F48C5C7866BF00D1931FF6C9D.PNG",
	"trophyTitlePlatfrom": "PS4",
	"definedTrophies": {
		"bronze": 23,
		"silver": 9,
		"gold": 7,
		"platinum": 1
	},
	"trophyGroups": [{
		"trophyGroupId": "default",
		"trophyGroupName": "Killzone Shadow Fall",
		"trophyGroupDetail": "Killzone Shadow Fall trophy set",
		"trophyGroupIconUrl": "http://trophy01.np.community.playstation.net/trophy/np/NPWR05506_00_00484C26373EBD73895C66E4E5FD1F91432F176895/CB728C2FC4AEF61F48C5C7866BF00D1931FF6C9D.PNG",
		"definedTrophies": {
			"bronze": 18,
			"silver": 8,
			"gold": 6,
			"platinum": 1
		},
		"comparedUser": {
			"onlineId": "OSXelot",
			"progress": 24,
			"earnedTrophies": {
				"bronze": 7,
				"silver": 2,
				"gold": 1,
				"platinum": 0
			},
			"lastUpdateDate": "2014-02-16T21:26:06Z"
		}
	}, {
		"trophyGroupId": "001",
		"trophyGroupName": "Insurgent Expansion",
		"trophyGroupDetail": "Insurgent Expansion trophies",
		"trophyGroupIconUrl": "http://trophy01.np.community.playstation.net/trophy/np/NPWR05506_00_00484C26373EBD73895C66E4E5FD1F91432F176895/F66077FD8249F105092B67B4932EC45AE4EB4811.PNG",
		"definedTrophies": {
			"bronze": 5,
			"silver": 1,
			"gold": 1,
			"platinum": 0
		},
		"comparedUser": {
			"onlineId": "OSXelot",
			"progress": 0,
			"earnedTrophies": {
				"bronze": 0,
				"silver": 0,
				"gold": 0,
				"platinum": 0
			},
			"lastUpdateDate": "2014-02-16T21:26:06Z"
		}
	}]
}
```
###Getting trophy info by trophyID
```javascript
// ID (optional, if not blank it displays if the user has earned it), GAMEID, GROUPID (Not really necessary here), TROPHYID
gumerPSN.getTrophy('OSXelot', 'NPWR05506_00', '', 33, function(error, trophyData) {
		console.log(trophyData)
})
```

Output:
```JSON
{
	"trophies": [{
		"trophyId": 33,
		"trophyHidden": false,
		"trophyType": "bronze",
		"trophyName": "Hacktivist",
		"trophyDetail": "Reach the maximum level for the Hacking Ability",
		"trophyIconUrl": "http://trophy01.np.community.playstation.net/trophy/np/NPWR05506_00_00484C26373EBD73895C66E4E5FD1F91432F176895/5BB2B6897302931F8157D26E87507A5AAD45CF10.PNG",
		"trophyRare": 0,
		"trophyEarnedRate": "0.1",
		"comparedUser": {
			"onlineId": "OSXelot",
			"earned": false
		}
	}]
}
```


Contribute
=========
Contribute by cloning the repository and start making changes to make it better and better, other API has failed because of being very "Copyrighted" and closed source. This is different, I'm also planning on making a site using PSN profiles but I want everyone to join in order to make the perfect PSN API possible and FREE.

NOTE: I do not own any PlayStation system, all this comes from checking the activity within my Android Device. So, I can not test social/ps4 related features such as Streaming, voice messages or archive messages. 
Those features are within PSN's app but I will not be able to see/test how is being received from those devices (PSVITA,PS3 or PS4), feel free to support the cause by donating so I can buy an used PS3/PS4, maybe?

If you want to make a donation, feel free to do it to my paypal account: jose_sachs@hotmail.com.
It helps me to mantain this project, and a coffe while coding isn't bad hehe.
