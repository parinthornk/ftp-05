
const express = require("express");
const app = express();
const port = 3000;

const https = require('http');

let fs = require('fs');

var generate_new_token = function (callback, error) {
	require('request').post("https://orapi-dev.orplc.com/oauth2/token", {
		headers: {
			"Authorization": "Basic dng3alJaZldnbUQ3MUtmNWI2YWRrTHZJQzNnYTprb2o5TzhFNVVyemJfSUpXSEFWdGxrSXNiZllh"
		},
		form: {
			"grant_type": "client_credentials",
			"scope": "simple"
		}
	}, function (e, response, body) {
		if (!e) {
			if (response.statusCode == 200) {
				
				
				fs.writeFileSync("token.txt", body);
				
				let exp = JSON.parse(Buffer.from(JSON.parse(body)["access_token"].split('.')[1], 'base64').toString())["exp"];
				let now = "" + require('microtime').now();while(now.length > 10){now = now.substr(0, now.length - 1);}now = parseInt(now);
				let secondsRemaining = exp - now;
				let x = JSON.parse(body);
				x["expires_in"] = secondsRemaining;
				callback(x);
			} else {
				error("Error generating new token: " + response.statusCode + ", " + body);
			}
		} else {
			console.log(e);
			error(e);
		}
	});
};

var get_token = function(callback, error) {
	// read from token file
    let filePath = "token.txt";
	fs.readFile(filePath, {encoding: 'utf-8'}, function(err, data){
		if (!err) {
			// token file exist, check if it still valid
			let exp = JSON.parse(Buffer.from(JSON.parse(data)["access_token"].split('.')[1], 'base64').toString())["exp"];
			let now = "" + require('microtime').now();while(now.length > 10){now = now.substr(0, now.length - 1);}now = parseInt(now);
			let secondsRemaining = exp - now;
			let isStillValid = secondsRemaining > 60;
			if (isStillValid) {
				// token is valid and ready
				
				let x = JSON.parse(data);
				x["expires_in"] = secondsRemaining;
				callback(x);
			} else {
				// token expired, get a new one
				generate_new_token(callback, error);
			}
		} else {
			// token not exist, get a new one an use it
			generate_new_token(callback, error);
		}
	});
};












// favicon
app.use(require('serve-favicon')(__dirname + '/favicon.ico'));


app.get('/host', (req, response) => {
	response.setHeader('Content-Type', 'application/json');
	response.status(200);
	response.end(JSON.stringify({
		"host": require("os").hostname()
	}));
});


// start
app.all('/sites', (req, response) => {
	
	let filePath = "sites.html";
	
	fs.readFile(filePath, {encoding: 'utf-8'}, function(err, data){
		if (!err) {
			get_token((token) => {
				let data_with_token = data.replace("{access_token}", token["access_token"]);
				console.log(data_with_token);
				response.setHeader('Content-Type', 'text/html');
				response.status(200);
				response.end(data_with_token);
			}, (e) => {
				response.writeHead(500, {'Content-Type': 'text/html'});
				response.write(e);
				response.end();
			});
		} else {
			response.writeHead(500, {'Content-Type': 'text/html'});
			response.write("error");
			response.end();
		}
	});
});

app.all('/schedules', (req, response) => {
	
	let filePath = "schedules.html";
	
	fs.readFile(filePath, {encoding: 'utf-8'}, function(err, data){
		if (!err) {
			get_token((token) => {
				let data_with_token = data.replace("{access_token}", token["access_token"]);
				console.log(data_with_token);
				response.setHeader('Content-Type', 'text/html');
				response.status(200);
				response.end(data_with_token);
			}, (e) => {
				response.writeHead(500, {'Content-Type': 'text/html'});
				response.write(e);
				response.end();
			});
		} else {
			response.writeHead(500, {'Content-Type': 'text/html'});
			response.write("error");
			response.end();
		}
	});
});

app.all('/schedules-add', (req, response) => {
	
	let filePath = "schedules-add.html";
	
	fs.readFile(filePath, {encoding: 'utf-8'}, function(err, data){
		if (!err) {
			get_token((token) => {
				let data_with_token = data.replace("{access_token}", token["access_token"]);
				console.log(data_with_token);
				response.setHeader('Content-Type', 'text/html');
				response.status(200);
				response.end(data_with_token);
			}, (e) => {
				response.writeHead(500, {'Content-Type': 'text/html'});
				response.write(e);
				response.end();
			});
		} else {
			response.writeHead(500, {'Content-Type': 'text/html'});
			response.write("error");
			response.end();
		}
	});
});

app.all('/schedules/:schedule/edit', (req, response) => {
	
	let filePath = "schedules-edit.html";
	
	fs.readFile(filePath, {encoding: 'utf-8'}, function(err, data){
		if (!err) {
			get_token((token) => {
				let data_with_token = data.replace("{access_token}", token["access_token"]);
				data_with_token = data_with_token.replace("{schedule}", req.params.schedule);
				
				console.log(data_with_token);
				response.setHeader('Content-Type', 'text/html');
				response.status(200);
				response.end(data_with_token);
			}, (e) => {
				response.writeHead(500, {'Content-Type': 'text/html'});
				response.write(e);
				response.end();
			});
		} else {
			response.writeHead(500, {'Content-Type': 'text/html'});
			response.write("error");
			response.end();
		}
	});
});

app.all('/schedules/:schedule', (req, response) => {
	
	let filePath = "schedules-_.html";
	
	fs.readFile(filePath, {encoding: 'utf-8'}, function(err, data){
		if (!err) {
			get_token((token) => {
				let data_with_token = data.replace("{access_token}", token["access_token"]);
				data_with_token = data_with_token.replace("{schedule}", req.params.schedule);
				
				
				console.log(data_with_token);
				response.setHeader('Content-Type', 'text/html');
				response.status(200);
				response.end(data_with_token);
			}, (e) => {
				response.writeHead(500, {'Content-Type': 'text/html'});
				response.write(e);
				response.end();
			});
		} else {
			response.writeHead(500, {'Content-Type': 'text/html'});
			response.write("error");
			response.end();
		}
	});
});

app.all('/schedules/:schedule/sessions', (req, response) => {
	
	let filePath = "schedules-sessions.html";
	
	fs.readFile(filePath, {encoding: 'utf-8'}, function(err, data){
		if (!err) {
			get_token((token) => {
				let data_with_token = data.replace("{access_token}", token["access_token"]);
				data_with_token = data_with_token.replace("{schedule}", req.params.schedule);
				
				
				console.log(data_with_token);
				response.setHeader('Content-Type', 'text/html');
				response.status(200);
				response.end(data_with_token);
			}, (e) => {
				response.writeHead(500, {'Content-Type': 'text/html'});
				response.write(e);
				response.end();
			});
		} else {
			response.writeHead(500, {'Content-Type': 'text/html'});
			response.write("error");
			response.end();
		}
	});
});

app.all('/events', (req, response) => {
	
	let filePath = "events.html";
	
	fs.readFile(filePath, {encoding: 'utf-8'}, function(err, data){
		if (!err) {
			get_token((token) => {
				let data_with_token = data.replace("{access_token}", token["access_token"]);
				
				console.log(data_with_token);
				response.setHeader('Content-Type', 'text/html');
				response.status(200);
				response.end(data_with_token);
			}, (e) => {
				response.writeHead(500, {'Content-Type': 'text/html'});
				response.write(e);
				response.end();
			});
		} else {
			response.writeHead(500, {'Content-Type': 'text/html'});
			response.write("error");
			response.end();
		}
	});
});

app.all('/sessions/:session/items', (req, response) => {
	
	let filePath = "sessions-items.html";
	
	fs.readFile(filePath, {encoding: 'utf-8'}, function(err, data){
		if (!err) {
			get_token((token) => {
				let data_with_token = data.replace("{access_token}", token["access_token"]);
				data_with_token = data_with_token.replace("{session}", req.params.session);
				
				
				console.log(data_with_token);
				response.setHeader('Content-Type', 'text/html');
				response.status(200);
				response.end(data_with_token);
			}, (e) => {
				response.writeHead(500, {'Content-Type': 'text/html'});
				response.write(e);
				response.end();
			});
		} else {
			response.writeHead(500, {'Content-Type': 'text/html'});
			response.write("error");
			response.end();
		}
	});
});

app.all('/sessions/:session/items/:item', (req, response) => {
	
	let filePath = "items-_.html";
	
	fs.readFile(filePath, {encoding: 'utf-8'}, function(err, data){
		if (!err) {
			get_token((token) => {
				let data_with_token = data.replace("{access_token}", token["access_token"]);
				data_with_token = data_with_token.replace("{session}", req.params.session);
				data_with_token = data_with_token.replace("{item}", req.params.item);
				
				
				console.log(data_with_token);
				response.setHeader('Content-Type', 'text/html');
				response.status(200);
				response.end(data_with_token);
			}, (e) => {
				response.writeHead(500, {'Content-Type': 'text/html'});
				response.write(e);
				response.end();
			});
		} else {
			response.writeHead(500, {'Content-Type': 'text/html'});
			response.write("error");
			response.end();
		}
	});
});

app.all('/items-summary', (req, response) => {
	
	let filePath = "items-summary.html";
	
	fs.readFile(filePath, {encoding: 'utf-8'}, function(err, data){
		if (!err) {
			get_token((token) => {
				let data_with_token = data.replace("{access_token}", token["access_token"]);
				
				console.log(data_with_token);
				response.setHeader('Content-Type', 'text/html');
				response.status(200);
				response.end(data_with_token);
			}, (e) => {
				response.writeHead(500, {'Content-Type': 'text/html'});
				response.write(e);
				response.end();
			});
		} else {
			response.writeHead(500, {'Content-Type': 'text/html'});
			response.write("error");
			response.end();
		}
	});
});

app.all('/schedules/:schedule/sessions/:session', (req, response) => {
	
	let filePath = "sessions-_.html";
	
	fs.readFile(filePath, {encoding: 'utf-8'}, function(err, data){
		if (!err) {
			get_token((token) => {
				let data_with_token = data.replace("{access_token}", token["access_token"]);
				data_with_token = data_with_token.replace("{schedule}", req.params.schedule);
				data_with_token = data_with_token.replace("{session}", req.params.session);
				
				
				console.log(data_with_token);
				response.setHeader('Content-Type', 'text/html');
				response.status(200);
				response.end(data_with_token);
			}, (e) => {
				response.writeHead(500, {'Content-Type': 'text/html'});
				response.write(e);
				response.end();
			});
		} else {
			response.writeHead(500, {'Content-Type': 'text/html'});
			response.write("error");
			response.end();
		}
	});
});

app.listen(process.env.PORT || port, () => {
	console.log("Example app listening on port: " + port);
});