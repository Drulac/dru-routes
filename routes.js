module.exports = function(app){
	let self = this;
	app.routes = self;

	let http = require('http');
	let url = require('url');
	let contentType = require('content-type');
	let mime = require('mime');
	let fs = require("fs");

	let routes = [];
	let statics = [];
	let on = [];

	function isNumeric(n) {
		return !isNaN(parseFloat(n)) && isFinite(n);
	}

	fs.tryFile = function(path){
		try {
			stats = fs.lstatSync(path);

			if(stats.isFile())
			{
				return true;
			}else{
				return false;
			}
		}catch(e){
			return false;
		}
	};

	fs.tryDirectory = function(path){
		try {
			let stats = fs.lstatSync(path);

			if(stats.isDirectory())
			{
				return true;
			}else{
				return false;
			};
		}catch(e){
			return false;
		}
	};

	let response = function(req, res) {
		let timeStart = Date.now();

		var page = url.parse(req.url).pathname;

		for(let route of routes)
		{
			if(route.path.test(page))
			{
				let args = route.path.exec(page);
				delete args["index"];
				delete args["input"];

				let objArgs = {};

				for(let i = 0, ni = route.args.length; i < ni; i++)
				{
					if(isNumeric(args[i+1]))
					{
						objArgs[route.args[i]] = parseFloat(args[i+1]);
					}else{
						objArgs[route.args[i]] = args[i+1];
					}
				}

				req.args = objArgs;

				route.method(req, res, function(retour){

					let headerContentType = null;

					try{
						headerContentType = contentType.parse(req);
					}catch(e){
						headerContentType = {"Content-Type": "text/plain"};
					}

					res.writeHead(200, headerContentType);
					res.write(retour);
					res.end();

					console.log((Date.now() - timeStart)+"ms - "+page);

					return;
				});
			}
		}

		for(let dir of statics)
		{
			let filepath = require('path').dirname(require.main.filename)+"/"+dir + page;
			console.log(filepath);
			if(fs.tryFile(filepath))
			{

				let headerContentType = null;

				try{
					headerContentType = {"Content-Type": mime.lookup(filepath)};
				}catch(e){
					headerContentType = {"Content-Type": "text/plain"};
				}

				res.writeHead(200, headerContentType);

				var fileStream = fs.createReadStream(filepath);
				fileStream.on('data', function (data) {
					res.write(data);
				});
				fileStream.on('end', function() {
					res.end();
					console.log((Date.now() - timeStart)+"ms - "+page);
				});
				
				return;
			}
		}

		res.writeHead(404, {"Content-Type": "text/plain"});
		res.write("file not found");
		res.end();
	};

	self.get = function(path, method){
		let regex = "^";
		let args = [];

		if(path == "/")
		{
			regex = regex + "\\/";
		}else{
			let pathParts = path.split("/");
			for(let key in pathParts)
			{
				let pathPart = pathParts[key];

				if(pathPart == "")
				{
					regex = regex + "\\/";
				}else{
					if(pathPart[0] == ':')
					{
						regex = regex + "([^\\/]+)";
						args.push(pathPart.substr(1));
					}else{
						regex = regex + pathPart;
					}
					if(key != pathParts.length-1)
						regex = regex + "\\/";
				}
			}
		}

		regex = regex + "$";
		routes.push({path: new RegExp(regex), method: method, args: args})
	};

	self.static = function(path){
		if(path[path.length-1] == "/")
			delete path[path.length-1];
		statics.push(path);
	};
	
	var server = http.createServer(response);

	self.listen = function(port){
		server.listen(port);
	};

	app.get = self.get;
	app.listen = self.listen;
	app.static = self.static;

	return self;
};