var tmi = require('tmi.js');
var request = require('request');
const express = require('express');
var http = require('http');

const app = express();
const userChannel = process.env.CHANNEL;

setInterval(function() {
		http.get(process.env.HEROKU_URL);
	}, 600000); //every 10 minutes

var ans = '';

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
	var u = message.split('@');
	if(u[1]){ // checking if someone is tagged
		var name = u[1].substring(0, (process.env.USERNAME).length);

		if(name === process.env.USERNAME){ // checking if SUSI is tagged

			// Setting options to make a successful call to SUSI API
			var options1 = {
				method: 'GET',
				url: 'http://api.susi.ai/susi/chat.json',
				qs:
				{
					timezoneOffset: '-300',
					q: u[1].substring((process.env.USERNAME).length + 1, u[1].length)
				}
			};

			request(options1, function(error, response, body) {
				if (error) throw new Error(error);

				if((JSON.parse(body)).answers[0]) {
					var data = JSON.parse(body);
					if(data.answers[0].actions[0].type === "table") {
						ans = userstate['display-name'];
						let colNames = data.answers[0].actions[0].columns;
						let lengthOfTable = data.answers[0].metadata.count;
						if(lengthOfTable > 4) {
							ans += " Due to message limit, only 4 results are shown:--- ";
						} else {
							ans += " Results are shown below:--- ";
						}
						for(let i=0; i<((lengthOfTable>4)?4:lengthOfTable); i++) {
							for(let colNo in colNames) {
								ans += `${colNames[colNo]} : `;
								ans += `${data.answers[0].data[i][colNo]}, `;
							}
							ans += " | ";
						}
					} else {
						ans = userstate['display-name'] + " " + data.answers[0].actions[0].expression;
					}
				} else {
					ans = userstate['display-name'] + " Sorry, I could not understand what you just said."
				}

				client.action(userChannel, ans);
			});
		}
	}
});

client.on('connected', function(address, port){
	client.action(userChannel, `Hi, I'm SUSI. Mention me using @${process.env.USERNAME} to chat with me.`);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
   console.log(`Listening on ${port}`);
});
