const http2 = require('http2');
const URL = require('url').URL;
const services = require('./services.json');
const args = require('./args.js');

const use_server = args['-u'] || services[args['-s'] || 'mozilla-cloudflare'];
let urlParsed;

let connected = false;

try {
  urlParsed = new URL(use_server);
}
catch(err){
  console.error('error while parsing URL:', err.message);
  process.exit(1);
}

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
    connected = true;
  });

  http2Client.on('error', err => {
    console.error(`HTTPS client error: ${err.message}`);
  });

  http2Client.on('goaway', () => {
    console.warn("HTTPS client received `goaway` event; destroying session");
    connected = false;
    http2Client.destroy();
  });

  http2Client.on('close', () => {
    console.error('Disconnected from upstream service');
    connected = false;
    connect();
  });
}

connect();

// http2Client.on('goaway', () => {
//   console.error('HTTPS client received goaway from server');
// });

function request(msg, callback) {
  if( !connected ){
    return callback(new Error('not connected to service'), Buffer.concat([]));
  }

  headers["content-length"] = msg.length;

  const req = http2Client.request(headers);
  const data = [];
  let err = null;

  req.on('data', chunk => {
    data.push(chunk);
  });

  req.on('response', headers => {
    if( headers[':status'] !== 200 ){
      err = new Error('non-200 status returned by upstream service');
    }
    else if( headers['content-type'] !== 'application/dns-message' ){
      err = new Error('upstream response content-type not DNS message');
    }
  });

  req.on('error', callback);

  req.on('end', () => {
    callback(err, Buffer.concat(data));
  });

  req.end(msg);
}

module.exports = request;