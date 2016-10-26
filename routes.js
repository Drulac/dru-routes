module.exports = function(app){
	let self = this;
	app.routes = self;

	let http = require('http');
	let url = require('url');
	let contentType = require('content-type');
	let mime = require('mime');

	let routes = [];

	function isNumeric(n) {
		return !isNaN(parseFloat(n)) && isFinite(n);
	}

	let response = function(req, res) {

		let headerContentType = null;

		try{
			headerContentType = contentType.parse(req);
		}catch(e){
			headerContentType = {"Content-Type": "text/plain"};
		}

		res.writeHead(200, headerContentType);

		var page = url.parse(req.url).pathname;
		console.log(page);

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

				route.method(objArgs, req).then(function(retour){
					res.write(retour);
					res.end();
				});
				break;
			}
		}
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

		console.log({path: new RegExp(regex), method: method, args: args});

		routes.push({path: new RegExp(regex), method: method, args: args})
	};
	
	var server = http.createServer(response);

	self.listen = function(port){
		server.listen(port);
	};

	app.get = self.get;
	app.listen = self.listen;

	return self;
};