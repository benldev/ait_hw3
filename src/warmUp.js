const net = require('net');
const PORT = 8080;
const HOST = '127.0.0.1';

const server = net.createServer((sock) =>{
  sock.on('data', (binaryData) => {
    let str = "HTTP/1.1 200 OK\r\nContent-Type: text/html\r\n\r\n<i>Hello</i> <strong>World</strong>";
    sock.write(str);
    sock.end();
  });
});

server.listen(PORT, HOST);
