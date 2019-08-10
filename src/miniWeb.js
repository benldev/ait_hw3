const fs = require('fs');
const net = require('net');

class Request{
  constructor(httpRequest){
    let lines = httpRequest.split('\r\n');
    let firstLine = lines[0].split(' ');
    this.path = firstLine[1];
    if(this.path !== '/' && this.path[this.path.length - 1] === '/'){
      this.path = this.path.substring(0, this.path.length - 1);
    }
    this.method = firstLine[0];
    this.headers = {};
    lines.slice(1, -2).forEach((x)=>{this.headers[x.split(": ")[0]] = x.split(": ")[1];});
    this.body = lines[lines.length - 1];
  }

  toString(){
    let ret = '';
    ret += this.method + ' ' + this.path + ' ' + 'HTTP/1.1\r\n';
    Object.entries(this.headers).forEach((arr) => {ret += arr[0] + ': ' + arr[1] + '\r\n';});
    ret += '\r\n';
    if(this.body !== undefined){ret += this.body};
    return ret;
  }
}

class Response{
  constructor(socket){
    this.sock = socket;
    this.headers = {};
    this.body = '';
    this.statusCode = "200";
    this.ended = false;
    this.phrases = {"200": "OK", "404": "Not Found", "301":"Moved Permanently", "500": "Internal Server Error", "400": "Bad Request", "302": "Found", "303": "See Other"};
    this.types = {"jpeg":"image/jpeg", "jpg":"image/jpeg", "png":"image/png", "gif":"image/gif", "html":"text/html", "css": "text/css", "txt":"text/plain"};
  }
  setHeader(name, value){
    this.headers[name] = value;
  }
  write(data){
    this.sock.write(data);
  }
  end(s){
    if(!this.ended){
      if(s){this.sock.end(s);}
      else{this.sock.end();}
      this.ended = true;
    }
  }
  send(statusCode, body){
    this.statusCode = statusCode;
    this.body = body;
    this.end(this.toString());
  }
  writeHead(statusCode){
    this.statusCode = statusCode;
    let s = 'HTTP/1.1 ' + statusCode + ' ' + this.phrases[statusCode] + '\r\n';
    Object.entries(this.headers).forEach((arr) => {s += arr[0] + ': ' + arr[1] + '\r\n'});
    this.write(s + '\r\n');
  }
  redirect(statusCode, url){
    if(url === undefined){
      url = statusCode;
      statusCode = 301;
    }
    this.statusCode = statusCode;
    this.setHeader("Location", url);
    this.end(this.toString());
  }
  toString(){
    let s = 'HTTP/1.1 ' + this.statusCode + ' ' + this.phrases[this.statusCode] + '\r\n';
    Object.entries(this.headers).forEach((arr) => {s += arr[0] + ': ' + arr[1] + '\r\n'});
    s += '\r\n' + this.body;
    return s;
  }
  sendFile(fileName){
    const publicRoot = __dirname + '/../public';
    const filePath = publicRoot + fileName;
    let split = fileName.split('.');
    const type = this.types[split[split.length - 1]];
    let param = {};
    if(type.split('/')[0] === 'text') {param["encoding"] = 'utf8';}
    fs.readFile(filePath, param, this.handleRead.bind(this, type));
  }
  handleRead(contentType, err, data){
    if(err) {this.writeHead(500);}
    else{
    this.setHeader("Content-Type", contentType);
    this.writeHead(200);
    this.write(data);
    }
    this.end();
  }
}

class App{
  constructor(){
    this.server = net.createServer(this.handleConnection.bind(this));
    this.routes = {};
  }
  get(path, cb){
    this.routes[path] = cb;
  }
  listen(port, host){
    this.server.listen(port, host);
  }
  handleConnection(sock){
    sock.on('data', this.handleRequestData.bind(this, sock));
  }
  handleRequestData(sock, binaryData){
    let data = binaryData + '';
    let req = new Request(data);
    let res = new Response(sock);
    sock.on('close', this.logResponse.bind(this, req, res));
    if(req.headers.Host !== 'localhost:' + sock.localPort){
       res.send(400);
    }
    else{
       let cb = this.routes[req.path];
       if(cb){cb(req, res);}
       else{res.send(404);}
    }
  }
  logResponse(req, res){
    console.log("Request method:", req.method);
    console.log("Request path:", req.path);
    console.log("Response status code:", res.statusCode);
    console.log("Response message:", res.phrases[res.statusCode]);
  }

}

module.exports = {
  Request: Request,
  Response: Response,
  App: App
};

