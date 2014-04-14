gumer-psn
=========

A Playstation Network API written in Node.js (maybe more languages in the future)

##About
This script uses the method found in Sony's official Android application that sends JSON in every response and NOT xml.
For now this script can get:
* Updated profile data. *(1 hour max)*
* Trophy data
	* by DLC too
	* It doesn't get hidden trophies (for now). *See known limitations below*
 
###Features planned

* Messaging (chat)
* Streams
* Real user integration (for now it uses only one account)

##Requierements
* A valid PSN account *(can be new)*
* Node.js >= 0.8.x
* JavaScript knowledge, lol

##Installing

You can install it by installing the package

		npm install gumer-psn
		
You can also clone this repository by doing

		git clone https://github.com/jhewt/gumer-psn.git
		cd gumer-psn/
		npm install
		
##Usage
###Init
```javascript
var gumerPSN 	= require('./psn');
	
	// Init the API
gumerPSN.init({		// Our PSN Module, we have to start it once. - irkinsander
	debug: 		true					// Let's set it true, it's still in early development. So, report everything that goes wrong please.
	,email: 	"your_account"			// A valid PSN/SCE account (can be new one) // TODO: Using the user's credentials to do this.
	,password: 	"your_password"			// Account's password, du'h
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
###Getting trophy data by ID
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
###Using the example
This example uses Express

    cd example/
    npm install express
    node index.js
		
Once it has started, you can start asking profile or trophy data by going to: 
*	http://localhost:3000/PSN/your_id
* http://localhost:3000/PSN/your_id/trophies

##Known Limitations
* It doesn't display **hidden trophies** *this is a server-side restriction*. If you do have another way to get them, please share it.


Contribute
=========
Contribute by cloning the repository and start making changes to make it better and better, other API has failed because of being very "Copyrighted" and closed source. This is different, I'm also planning on making a site using PSN profiles but I want everyone to join in order to make the perfect PSN API possible and FREE.

If you want to make a donation, feel free to do it to my paypal account: jose_sachs@hotmail.com.
It helps me to prioritaze this project... and a coffe while coding isn't bad hehe.
