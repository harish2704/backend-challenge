var http = require('http'),
    async = require('async'),
    url = require('url');

exports.createServer = function () {
return new Server();
};


/*
 * var Router = function(){
 *     this.routes = [];
 * }
 * Router.prototype.add = function( pathname , fn ){
 *     this.routes[pathname] = fn;
 * }
 * Router.prototype.route = function( req, res ){
 *     var parsedUrl = url.parse( req.url );
 *     if ( this.routes.indexOf( parsedUrl.pathname ) != -1 )
 *         return this.routes[ parsedUrl.pathname ]( req, res );
 * }
 */

var MiddlewareManager = function(){
    this.middlewares = [];
}
MiddlewareManager.prototype.addMiddleware = function( fn ){
    this.middlewares.push( fn );
}

MiddlewareManager.prototype.addRoute = function( pathname, fn ){
    this.middlewares.push( function( req, res, next ){
        var parsedUrl = url.parse( req.url );
        if ( parsedUrl.pathname == pathname ) return fn( req, res, next );
        return next();
    });
};

MiddlewareManager.prototype.pass = function( req, res ){
    async.eachSeries( this.middlewares, function(mWare, cb){
        return mWare( req, res, cb);
    }, function(){
        res.writeHead(404, {"Content-Type": "text/plain"});
        res.write("404 Not found");
        res.end();
    });
}

var Server= function(){
    var middlewareManager = new MiddlewareManager();

    this.middlewareManager = middlewareManager;
    this._server = http.createServer( function(req, res){ return middlewareManager.pass( req, res) });
}

Server.prototype.use = function(){
    var pathname, fn;
    switch( arguments.length ){
        case 1:
            fn = arguments[0];
            this.middlewareManager.addMiddleware( fn );
            break;
        case 2:
            pathname = arguments[0];
            fn = arguments[1];
            this.middlewareManager.addRoute( pathname, fn );
            break;
        default:
            throw new Error('Not implemented!!');
    }
}

Server.prototype.listen = function(port, fn ){
    return this._server.listen(port, fn)
}


