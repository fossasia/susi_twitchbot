var tmi = require('tmi.js');
var request = require('request');
const express = require('express');
var http = require('http');

const app = express();
const userChannel = process.env.CHANNEL;

setInterval(function() {
		http.get(process.env.HEROKU_URL);
	}, 600000); //every 10 minutes

var ans;

var options = {
	options: {
		debug: true
	},
	connection: {
		reconnect: true
	},
	identity: {
		username: process.env.USERNAME,
		password: process.env.OAUTH_TOKEN
	},
	channels: [userChannel]
};

var client = new tmi.client(options);
// Connect the client to the server
client.connect();

client.on('chat', function(channel, userstate, message, self){

	// Setting options to make a successful call to SUSI API
	var options1 = {
		method: 'GET',
		url: 'http://api.susi.ai/susi/chat.json',
		qs:
		{
			timezoneOffset: '-300',
			q: message
		}
	};

	request(options1, function(error, response, body) {
		if (error) throw new Error(error);

		if((JSON.parse(body)).answers[0])
			ans = (JSON.parse(body)).answers[0].actions[0].expression;
		else
			ans = "Sorry, I could not understand what you just said."
		
		client.action(userChannel, ans);
	});

});

client.on('connected', function(address, port){
	client.action(userChannel, "Welcome, I'm SUSI.");
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
   console.log(`Listening on ${port}`);
});
