module.exports = function(drudru){
	let self = this;
	drudru.routes = self;

	let http = require('http');
	let url = require('url');
	let contentType = require('content-type');
	let mime = require('mime');

	let routes = [];

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
			if(page == route.path)
			{
				route.method().then(function(retour){
					res.write(retour);
					res.end();
				});
				break;
			}
		}
	};

	self.get = function(path, method){
		routes.push({path: path, method: method})
	};
	
	var server = http.createServer(response);

	self.listen = function(port){
		server.listen(port);
	};

	return self;
};