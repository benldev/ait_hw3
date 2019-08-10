class Request{
  constructor(httpRequest){
    let lines = httpRequest.split('\r\n');
    let firstLine = lines[0].split(' ');
    this.path = firstLine[1];
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

module.exports = {
  Request: Request,
  Response: Response
};




const net = require('net');
const fs = require('fs');
const PORT = 8080;
const HOST = '127.0.0.1';

const server = net.createServer((sock) =>{
  sock.on('data', (binaryData) => {
    let req = new Request(binaryData + '');
    let response = new Response(sock);
    if(req.path === '/'){
      response.setHeader("Content-Type", "text/html");
      response.send(200, "<head><link rel='stylesheet' type='text/css' href='foo.css'></head><body><h2>req</h2></body>");
    } 
    else if(req.path === '/foo.css'){
      response.setHeader("Content-Type", "text/css"); 
      response.send(200, 'h2 {color: red;}');
    }
    else if(req.path === '/test'){
      response.sendFile('/html/test.html');
    }
    else if(req.path === '/bmo1.gif'){
      response.sendFile('/img/bmo1.gif');
    }
    else {
      response.setHeader("Content-Type", "text/plain");
      response.redirect(302, '/');
      response.send(404, '404 page not found!');
    }
  });
});

server.listen(PORT, HOST);
