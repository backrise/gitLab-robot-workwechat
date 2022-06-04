const http = require('http');
const url = require('url');
const querystring = require("querystring")
const cloudGitlab = require('./cloudGitLab')
const process = require('process')

const hostname= process.env.HOST || '0.0.0.0'
const port = process.env.PORT || 8300;

const server = http.createServer((req, res) => {
  const urlObj = url.parse(req.url)
  const query = urlObj.query
  const queryObj = querystring.parse(query)
  const id = queryObj['id']
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('{}');

  var body = ''
  req.on('data', function (chunk) {
      body += chunk;
  });

  req.on('end', function () {
      const bodyObj = JSON.parse(body);
      cloudGitlab.handler_entry({robotid: id, bodyObj: bodyObj})
  });
})

server.listen({hostname: hostname, port: port}, () => {
  console.log(`addr: http://${hostname}:${port}/`);
});