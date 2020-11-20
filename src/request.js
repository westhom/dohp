const http2 = require('http2');
const URL = require('url').URL;
const services = require('./services.json');
const args = require('./args.js');

const use_server = services[args['-s'] || 'mozilla-cloudflare'];
const urlParsed = new URL(use_server);

const headers = {
  ':path': urlParsed.pathname,
  ':method': 'POST',
  'content-type': 'application/dns-message',
  accept: 'application/dns-message',
  'content-length': 0
};

let http2Client;

function connect() {
  http2Client = http2.connect(use_server);

  http2Client.on('connect', () => {
    console.log('Connected to upstream service', use_server);
  });

  http2Client.on('error', err => {
    console.error(`HTTPS client error: ${err.message}`);
  });

  http2Client.on('close', () => {
    console.error('Disconnected from upstream service');
    connect();
  });
}

connect();

// http2Client.on('goaway', () => {
//   console.error('HTTPS client received goaway from server');
// });

function request(msg, callback) {
  headers["content-length"] = msg.length;

  const req = http2Client.request(headers);
  const data = [];

  req.on('data', chunk => {
    data.push(chunk);
  });

  req.on('error', callback);

  req.on('end', () => {
    callback(null, Buffer.concat(data));
  });

  req.end(msg);
}

module.exports = request;