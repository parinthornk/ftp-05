
const express = require("express");
const app = express();
const port = 3000;

const https = require('http');

let fs = require('fs');

const crypto = require("crypto");

let envsCfg = [
	{
		"name": "dev",
		"endpointToken": "https://orapi-dev.orplc.com/oauth2/token",
		"endpointAPI": "https://orapigw-ex-dev.orplc.com/wtransfer/1.0.0",
		"basicAuth": "dng3alJaZldnbUQ3MUtmNWI2YWRrTHZJQzNnYTprb2o5TzhFNVVyemJfSUpXSEFWdGxrSXNiZllh",
		"backgroundColor": "#efefef"
	},
	{
		"name": "qas",
		"endpointToken": "https://orapi-dev.orplc.com/oauth2/token",
		"endpointAPI": "https://orapigw-ex-dev.orplc.com/wtransfer/1.0.0",
		"basicAuth": "SlZhVU9acTU5RkJtU1FrbEdsSV9lS2QzWWNzYTpDQ0RNOTNwSW1yRjRCTks1Z1Z5dEdFTG9RTm9h",
		"backgroundColor": "#ffffff"
	},
	{
		"name": "uat",
		"endpointToken": "https://orapi-dev.orplc.com/oauth2/token",
		"endpointAPI": "https://orapigw-ex-dev.orplc.com/wtransfer/1.0.0",
		"basicAuth": "xxxx",
		"backgroundColor": "#fcffef"
	},
	{
		"name": "prd",
		"endpointToken": "https://orapi-dev.orplc.com/oauth2/token",
		"endpointAPI": "https://orapigw-ex-dev.orplc.com/wtransfer/1.0.0",
		"basicAuth": "xxxx",
		"backgroundColor": "#ffffff"
	}
];

function env_get_basicAuth (env) {
	for (let i = 0; i < envsCfg.length; i++) {
		if (envsCfg[i]["name"] == env) {
			return envsCfg[i]["basicAuth"];
		}
	}
	return undefined;
}

function env_get_endpointToken (env) {
	for (let i = 0; i < envsCfg.length; i++) {
		if (envsCfg[i]["name"] == env) {
			return envsCfg[i]["endpointToken"];
		}
	}
	return undefined;
}

function env_get_endpointAPI (env) {
	for (let i = 0; i < envsCfg.length; i++) {
		if (envsCfg[i]["name"] == env) {
			return envsCfg[i]["endpointAPI"];
		}
	}
	return undefined;
}

function env_get_scope (env) {
	return "" + crypto.randomBytes(16).toString("hex");
}

function env_get_backgroundColor (env) {
	for (let i = 0; i < envsCfg.length; i++) {
		if (envsCfg[i]["name"] == env) {
			return envsCfg[i]["backgroundColor"];
		}
	}
	return undefined;
}

// ---------------------------------------------------------------------------------------- read host begin

let host = require("os").hostname();
if (host.startsWith("service-")) {
	url_ref = "https://squid-app-o8e56.ondigitalocean.app";
} else {
	url_ref = "http://localhost:3000/v20"
}

/*function replace_url_ref (env, _m) {
	let __m = _m;
	if (host.startsWith("service-")) {
		while (__m.includes("http://localhost:3000/v20/" + env)) {
			__m = __m.replace("http://localhost:3000/v20/" + env, "https://squid-app-o8e56.ondigitalocean.app/" + env);
		}
	}
	return __m;
}*/

function replace_url_ref (env, _m) {
	let __m = _m;
	if (host.startsWith("service-")) {
		while (__m.includes("http://localhost:3000/v20")) {
			__m = __m.replace("http://localhost:3000/v20", "https://squid-app-o8e56.ondigitalocean.app");
		}
	}
	__m = __m.replaceAll("{replace_with_bgcolor}", env_get_backgroundColor(env));
	return __m.replaceAll("http://localhost:3000/v20", "http://localhost:3000/v20/" + env).replaceAll("https://squid-app-o8e56.ondigitalocean.app", "https://squid-app-o8e56.ondigitalocean.app/" + env);
}

// ---------------------------------------------------------------------------------------- read host end

var generate_new_token = function (env, callback, error) {
	require('request').post(env_get_endpointToken(env), {
		headers: {
			"Authorization": "Basic " + env_get_basicAuth(env)
		},
		form: {
			"grant_type": "client_credentials",
			"scope": env_get_scope(env)
		}
	}, function (e, response, body) {
		if (!e) {
			if (response.statusCode == 200) {
				
				fs.writeFileSync("token" + env + ".txt", body);
				
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

var get_token = function(env, callback, error) {
	// read from token file
    let filePath = "token" + env + ".txt";
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
				generate_new_token(env, callback, error);
			}
		} else {
			// token not exist, get a new one an use it
			generate_new_token(env, callback, error);
		}
	});
};












// favicon
app.use(require('serve-favicon')(__dirname + '/favicon.ico'));

// get host
app.get('/host', (req, response) => {
	response.setHeader('Content-Type', 'application/json');
	response.status(200);
	response.end(JSON.stringify({
		"host": host,
		"url_ref": url_ref
	}));
});











function json2string(json) {
	return JSON.stringify(json, null, "  ");
}

app.get('/hello', (req, res) => {
	res.setHeader('Content-Type', 'application/json');
	res.status(200);
	res.end(json2string({
		"message": "Hello!"
	}));
});

app.all('/echo/*', echo);

app.all('/echo', echo);

function echo(req, res) {
	console.log("request.socket.remoteAddress: " + req.socket.remoteAddress);
	res.setHeader('Content-Type', 'application/json');
	res.status(200);
	var textres = json2string({
		"method": req.method,
		"headers": req.headers,
		"query": req.query,
		"path": req.path,
		"baseUrl": req.baseUrl,
		"originalUrl": req.originalUrl,
		"bodyRaw": String.fromCharCode.apply(null, req.body)
	});
	console.log("----------------------------------------------------");
	console.log(textres);
	console.log("----------------------------------------------------");
	res.end(textres);
}











// start
app.all('/:env/sites', (req, response) => {
	
	let requested_env = req.params.env;
	
	let filePath = "startbootstrap-sb-admin-2/sites.html";
	
	fs.readFile(filePath, {encoding: 'utf-8'}, function(err, data){
		if (!err) {
			get_token(requested_env, (token) => {
				let data_with_token = data.replace("{access_token}", token["access_token"]);
				data_with_token = replace_url_ref(requested_env, data_with_token);
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

app.all('/:env/schedules', (req, response) => {
	
	let requested_env = req.params.env;
	
	let filePath = "startbootstrap-sb-admin-2/schedules.html";
	
	fs.readFile(filePath, {encoding: 'utf-8'}, function(err, data){
		if (!err) {
			get_token(requested_env, (token) => {
				let data_with_token = data.replace("{access_token}", token["access_token"]);
				data_with_token = replace_url_ref(requested_env, data_with_token);
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

app.all('/:env/schedules-add', (req, response) => {
	
	let requested_env = req.params.env;
	
	let filePath = "startbootstrap-sb-admin-2/schedules-add.html";
	
	fs.readFile(filePath, {encoding: 'utf-8'}, function(err, data){
		if (!err) {
			get_token(requested_env, (token) => {
				let data_with_token = data.replace("{access_token}", token["access_token"]);
				data_with_token = replace_url_ref(requested_env, data_with_token);
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

app.all('/:env/schedules/:schedule/edit', (req, response) => {
	
	let requested_env = req.params.env;
	
	let filePath = "startbootstrap-sb-admin-2/schedules-edit.html";
	
	fs.readFile(filePath, {encoding: 'utf-8'}, function(err, data){
		if (!err) {
			get_token(requested_env, (token) => {
				let data_with_token = data.replace("{access_token}", token["access_token"]);
				data_with_token = replace_url_ref(requested_env, data_with_token);
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

app.all('/:env/schedules/:schedule', (req, response) => {
	
	let requested_env = req.params.env;
	
	let filePath = "startbootstrap-sb-admin-2/schedules-_.html";
	
	fs.readFile(filePath, {encoding: 'utf-8'}, function(err, data){
		if (!err) {
			get_token(requested_env, (token) => {
				let data_with_token = data.replace("{access_token}", token["access_token"]);
				data_with_token = replace_url_ref(requested_env, data_with_token);
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

app.all('/:env/schedules/:schedule/sessions', (req, response) => {
	
	let requested_env = req.params.env;
	
	let filePath = "startbootstrap-sb-admin-2/schedules-sessions.html";
	
	fs.readFile(filePath, {encoding: 'utf-8'}, function(err, data){
		if (!err) {
			get_token(requested_env, (token) => {
				let data_with_token = data.replace("{access_token}", token["access_token"]);
				data_with_token = replace_url_ref(requested_env, data_with_token);
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

app.all('/:env/events', (req, response) => {
	
	let requested_env = req.params.env;
	
	let filePath = "startbootstrap-sb-admin-2/events.html";
	
	fs.readFile(filePath, {encoding: 'utf-8'}, function(err, data){
		if (!err) {
			get_token(requested_env, (token) => {
				let data_with_token = data.replace("{access_token}", token["access_token"]);
				data_with_token = replace_url_ref(requested_env, data_with_token);
				
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

app.all('/:env/sessions/:session/items', (req, response) => {
	
	let requested_env = req.params.env;
	
	let filePath = "startbootstrap-sb-admin-2/sessions-items.html";
	
	fs.readFile(filePath, {encoding: 'utf-8'}, function(err, data){
		if (!err) {
			get_token(requested_env, (token) => {
				let data_with_token = data.replace("{access_token}", token["access_token"]);
				data_with_token = replace_url_ref(requested_env, data_with_token);
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

app.all('/:env/sessions/:session/items/:item', (req, response) => {
	
	let requested_env = req.params.env;
	
	let filePath = "startbootstrap-sb-admin-2/item-details.html";
	
	fs.readFile(filePath, {encoding: 'utf-8'}, function(err, data){
		if (!err) {
			get_token(requested_env, (token) => {
				let data_with_token = data.replace("{access_token}", token["access_token"]);
				data_with_token = replace_url_ref(requested_env, data_with_token);
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

app.all('/:env/items-summary', (req, response) => {
	
	let requested_env = req.params.env;
	
	let filePath = "startbootstrap-sb-admin-2/logs-items.html";
	
	fs.readFile(filePath, {encoding: 'utf-8'}, function(err, data){
		if (!err) {
			get_token(requested_env, (token) => {
				let data_with_token = data.replace("{access_token}", token["access_token"]);
				data_with_token = replace_url_ref(requested_env, data_with_token);
				
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

app.all('/:env/schedules/:schedule/sessions/:session', (req, response) => {
	
	let requested_env = req.params.env;
	
	let filePath = "startbootstrap-sb-admin-2/sessions-_.html";
	
	fs.readFile(filePath, {encoding: 'utf-8'}, function(err, data){
		if (!err) {
			get_token(requested_env, (token) => {
				let data_with_token = data.replace("{access_token}", token["access_token"]);
				data_with_token = replace_url_ref(requested_env, data_with_token);
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

// ---------------------------------------------------------------------------------------------------------------------------------------- UI modernized

let internal_links = [
	{
		"url": "/v20/:env/vendor/fontawesome-free/css/all.min.css",
		"file": "startbootstrap-sb-admin-2/vendor/fontawesome-free/css/all.min.css",
		"type": "text/css"
	},
	{
		"url": "/v20/:env/css/sb-admin-2.min.css",
		"file": "startbootstrap-sb-admin-2/css/sb-admin-2.min.css",
		"type": "text/css"
	},
	{
		"url": "/v20/:env/vendor/datatables/dataTables.bootstrap4.min.css",
		"file": "startbootstrap-sb-admin-2/vendor/datatables/dataTables.bootstrap4.min.css",
		"type": "text/css"
	},
	{
		"url": "/v20/:env/vendor/jquery/jquery.min.js",
		"file": "startbootstrap-sb-admin-2/vendor/jquery/jquery.min.js",
		"type": "text/javascript"
	},
	{
		"url": "/v20/:env/vendor/bootstrap/js/bootstrap.bundle.min.js",
		"file": "startbootstrap-sb-admin-2/vendor/bootstrap/js/bootstrap.bundle.min.js",
		"type": "text/javascript"
	},
	{
		"url": "/v20/:env/vendor/jquery-easing/jquery.easing.min.js",
		"file": "startbootstrap-sb-admin-2/vendor/jquery-easing/jquery.easing.min.js",
		"type": "text/javascript"
	},
	{
		"url": "/v20/:env/js/sb-admin-2.min.js",
		"file": "startbootstrap-sb-admin-2/js/sb-admin-2.min.js",
		"type": "text/javascript"
	},
	{
		"url": "/v20/:env/vendor/datatables/jquery.dataTables.min.js",
		"file": "startbootstrap-sb-admin-2/vendor/datatables/jquery.dataTables.min.js",
		"type": "text/javascript"
	},
	{
		"url": "/v20/:env/vendor/datatables/dataTables.bootstrap4.min.js",
		"file": "startbootstrap-sb-admin-2/vendor/datatables/dataTables.bootstrap4.min.js",
		"type": "text/javascript"
	},
	{
		"url": "/v20/:env/js/demo/datatables-demo.js",
		"file": "startbootstrap-sb-admin-2/js/demo/datatables-demo.js",
		"type": "text/javascript"
	},
	{
		"url": "/v20/:env/img/logo-or-white.png",
		"file": "startbootstrap-sb-admin-2/img/logo-or-white.png",
		"type": "image/png"
	},
	{
		"url": "/v20/:env/img/logo-wso2.png",
		"file": "startbootstrap-sb-admin-2/img/logo-wso2.png",
		"type": "image/png"
	},
	{
		"url": "/v20/:env/vendor/fontawesome-free/webfonts/fa-solid-900.woff2",
		"file": "startbootstrap-sb-admin-2/vendor/fontawesome-free/webfonts/fa-solid-900.woff2",
		"type": "text/plain"
	},
	{
		"url": "/v20/:env/vendor/fontawesome-free/webfonts/fa-solid-900.woff",
		"file": "startbootstrap-sb-admin-2/vendor/fontawesome-free/webfonts/fa-solid-900.woff",
		"type": "text/plain"
	},
	{
		"url": "/v20/:env/vendor/fontawesome-free/webfonts/fa-solid-900.ttf",
		"file": "startbootstrap-sb-admin-2/vendor/fontawesome-free/webfonts/fa-solid-900.ttf",
		"type": "text/plain"
	},
	{
		"url": "/libs/vendor/fontawesome-free/css/all.min.css",
		"file": "startbootstrap-sb-admin-2/vendor/fontawesome-free/css/all.min.css",
		"type": "text/css"
	},
	{
		"url": "/libs/css/sb-admin-2.min.css",
		"file": "startbootstrap-sb-admin-2/css/sb-admin-2.min.css",
		"type": "text/css"
	},
	{
		"url": "/libs/vendor/datatables/dataTables.bootstrap4.min.css",
		"file": "startbootstrap-sb-admin-2/vendor/datatables/dataTables.bootstrap4.min.css",
		"type": "text/css"
	},
	{
		"url": "/libs/vendor/jquery/jquery.min.js",
		"file": "startbootstrap-sb-admin-2/vendor/jquery/jquery.min.js",
		"type": "text/javascript"
	},
	{
		"url": "/libs/vendor/bootstrap/js/bootstrap.bundle.min.js",
		"file": "startbootstrap-sb-admin-2/vendor/bootstrap/js/bootstrap.bundle.min.js",
		"type": "text/javascript"
	},
	{
		"url": "/libs/vendor/jquery-easing/jquery.easing.min.js",
		"file": "startbootstrap-sb-admin-2/vendor/jquery-easing/jquery.easing.min.js",
		"type": "text/javascript"
	},
	{
		"url": "/libs/js/sb-admin-2.min.js",
		"file": "startbootstrap-sb-admin-2/js/sb-admin-2.min.js",
		"type": "text/javascript"
	},
	{
		"url": "/libs/vendor/datatables/jquery.dataTables.min.js",
		"file": "startbootstrap-sb-admin-2/vendor/datatables/jquery.dataTables.min.js",
		"type": "text/javascript"
	},
	{
		"url": "/libs/vendor/datatables/dataTables.bootstrap4.min.js",
		"file": "startbootstrap-sb-admin-2/vendor/datatables/dataTables.bootstrap4.min.js",
		"type": "text/javascript"
	},
	{
		"url": "/libs/js/demo/datatables-demo.js",
		"file": "startbootstrap-sb-admin-2/js/demo/datatables-demo.js",
		"type": "text/javascript"
	},
	{
		"url": "/libs/img/logo-or-white.png",
		"file": "startbootstrap-sb-admin-2/img/logo-or-white.png",
		"type": "image/png"
	},
	{
		"url": "/libs/img/logo-wso2.png",
		"file": "startbootstrap-sb-admin-2/img/logo-wso2.png",
		"type": "image/png"
	},
	{
		"url": "/libs/vendor/fontawesome-free/webfonts/fa-solid-900.woff2",
		"file": "startbootstrap-sb-admin-2/vendor/fontawesome-free/webfonts/fa-solid-900.woff2",
		"type": "text/plain"
	},
	{
		"url": "/libs/vendor/fontawesome-free/webfonts/fa-solid-900.woff",
		"file": "startbootstrap-sb-admin-2/vendor/fontawesome-free/webfonts/fa-solid-900.woff",
		"type": "text/plain"
	},
	{
		"url": "/libs/vendor/fontawesome-free/webfonts/fa-solid-900.ttf",
		"file": "startbootstrap-sb-admin-2/vendor/fontawesome-free/webfonts/fa-solid-900.ttf",
		"type": "text/plain"
	}
];

for (let i = 0; i < internal_links.length; i++) {
	app.get(internal_links[i]["url"], (req, response) => {
		fs.readFile(internal_links[i]["file"], function(err, data){
			if (!err) {
				response.setHeader('Content-Type', internal_links[i]["type"]);
				response.status(200);
				response.end(data);
			} else {
				response.writeHead(500, {'Content-Type': 'text/html'});
				response.write("error");
				response.end();
			}
		});
	});
}

app.get('/v20/:env/items-summary', (req, response) => {
	let requested_env = req.params.env;
	let filePath = "startbootstrap-sb-admin-2/logs-items.html";
	fs.readFile(filePath, {encoding: 'utf-8'}, function(err, data){
		if (!err) {
			get_token(requested_env, (token) => {
				let data_with_token = data.replace("{access_token}", token["access_token"]);
				data_with_token = replace_url_ref(requested_env, data_with_token);
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

app.get('/v20/:env/sites', (req, response) => {
	let requested_env = req.params.env;
	let filePath = "startbootstrap-sb-admin-2/sites.html";
	fs.readFile(filePath, {encoding: 'utf-8'}, function(err, data){
		if (!err) {
			get_token(requested_env, (token) => {
				let data_with_token = data.replace("{access_token}", token["access_token"]);
				data_with_token = replace_url_ref(requested_env, data_with_token);
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

app.get('/v20/:env/schedules', (req, response) => {
	let requested_env = req.params.env;
	let filePath = "startbootstrap-sb-admin-2/schedules.html";
	fs.readFile(filePath, {encoding: 'utf-8'}, function(err, data){
		if (!err) {
			get_token(requested_env, (token) => {
				let data_with_token = data.replace("{access_token}", token["access_token"]);
				data_with_token = replace_url_ref(requested_env, data_with_token);
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

app.get('/v20/:env/sessions/:session/items/:item', (req, response) => {
	let requested_env = req.params.env;
	let filePath = "startbootstrap-sb-admin-2/item-details.html";
	fs.readFile(filePath, {encoding: 'utf-8'}, function(err, data){
		if (!err) {
			get_token(requested_env, (token) => {
				let data_with_token = data.replace("{access_token}", token["access_token"]);
				data_with_token = replace_url_ref(requested_env, data_with_token);
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

app.all('/v20/:env/schedules/:schedule', (req, response) => {
	
	let requested_env = req.params.env;
	
	let filePath = "startbootstrap-sb-admin-2/schedules-_.html";
	
	fs.readFile(filePath, {encoding: 'utf-8'}, function(err, data){
		if (!err) {
			get_token(requested_env, (token) => {
				let data_with_token = data.replace("{access_token}", token["access_token"]);
				data_with_token = replace_url_ref(requested_env, data_with_token);
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

app.all('/v20/:env/schedules/:schedule/sessions', (req, response) => {
	
	let requested_env = req.params.env;
	
	let filePath = "startbootstrap-sb-admin-2/schedules-sessions.html";
	
	fs.readFile(filePath, {encoding: 'utf-8'}, function(err, data){
		if (!err) {
			get_token(requested_env, (token) => {
				let data_with_token = data.replace("{access_token}", token["access_token"]);
				data_with_token = replace_url_ref(requested_env, data_with_token);
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

app.all('/v20/:env/sessions/:session/items', (req, response) => {
	
	let requested_env = req.params.env;
	
	let filePath = "startbootstrap-sb-admin-2/sessions-items.html";
	
	fs.readFile(filePath, {encoding: 'utf-8'}, function(err, data){
		if (!err) {
			get_token(requested_env, (token) => {
				let data_with_token = data.replace("{access_token}", token["access_token"]);
				data_with_token = replace_url_ref(requested_env, data_with_token);
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

app.all('/v20/:env/schedules-add', (req, response) => {
	
	let requested_env = req.params.env;
	
	let filePath = "startbootstrap-sb-admin-2/schedules-add.html";
	
	fs.readFile(filePath, {encoding: 'utf-8'}, function(err, data){
		if (!err) {
			get_token(requested_env, (token) => {
				let data_with_token = data.replace("{access_token}", token["access_token"]);
				data_with_token = replace_url_ref(requested_env, data_with_token);
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

app.all('/v20/:env/schedules/:schedule/edit', (req, response) => {
	
	let requested_env = req.params.env;
	
	let filePath = "startbootstrap-sb-admin-2/schedules-edit.html";
	
	fs.readFile(filePath, {encoding: 'utf-8'}, function(err, data){
		if (!err) {
			get_token(requested_env, (token) => {
				let data_with_token = data.replace("{access_token}", token["access_token"]);
				data_with_token = replace_url_ref(requested_env, data_with_token);
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

app.all('/v20/:env/schedules/:schedule/sessions/:session', (req, response) => {
	
	let requested_env = req.params.env;
	
	let filePath = "startbootstrap-sb-admin-2/sessions-_.html";
	
	fs.readFile(filePath, {encoding: 'utf-8'}, function(err, data){
		if (!err) {
			get_token(requested_env, (token) => {
				let data_with_token = data.replace("{access_token}", token["access_token"]);
				data_with_token = replace_url_ref(requested_env, data_with_token);
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

app.all('/v20/:env/events', (req, response) => {
	
	let requested_env = req.params.env;
	
	let filePath = "startbootstrap-sb-admin-2/events.html";
	
	fs.readFile(filePath, {encoding: 'utf-8'}, function(err, data){
		if (!err) {
			get_token(requested_env, (token) => {
				let data_with_token = data.replace("{access_token}", token["access_token"]);
				data_with_token = replace_url_ref(requested_env, data_with_token);
				
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

// ---------------------------------------------------------------------------------------------------------------------------------------- UI modernized


app.listen(process.env.PORT || port, () => {
	console.log("Example app listening on port: " + port);
});