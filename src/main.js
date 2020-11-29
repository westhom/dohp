const dgram = require('dgram');
const pkg = require('../package.json');
const args = require('./args.js');
const services = require('./services.json');
const servFailError = require('./error.js');

if (args['--version']) {
  console.log(pkg.version);
  process.exit();
}

if (args['--help']) {
  console.log('usage:\n  dohp [-p <port>] [-i <bind IP>] [-s <DoH service>]');
  console.log('  dohp [-p <port>] [-i <bind IP>] [-u <DoH custom service URL>]')
  console.log();
  console.log('service options:\n  ' + Object.keys(services).join('\n  '));
  process.exit();
}

const request = require('./request.js');
const cache = require('./cache.js');

const dnsServer = dgram.createSocket('udp4');

const PORT = args['-p'] || 53535;
const IP = args['-i'] || '0.0.0.0';

dnsServer.on('message', (msg, rinfo) => {
  let resp;

  try {
    resp = cache.tryItem(msg);
  }
  catch (err) {
    console.error(err);
    return;
  }

  // send cached response if available
  if (resp !== null) {
    dnsServer.send(resp, rinfo.port, rinfo.address);
    return;
  }

  // make DoH request through upstream service
  request(msg, (err, resp) => {
    let sendError = false;

    if (err ) {
      console.error('HTTP request error:', err.message);
      sendError = true;
    }
    else {
      try {
        cache.record(resp);
      }
      catch(err){
        console.error('caught error while recording response:', err.message);
        sendError = true;
      }
    }

    if( sendError ){
      const epacket = servFailError(msg);
      return dnsServer.send(epacket, rinfo.port, rinfo.address);
    }

    dnsServer.send(resp, rinfo.port, rinfo.address);
  });
});

dnsServer.on('error', (err) => {
  console.error(`UDP server error: ${err.message}`);
  process.exit();
});

dnsServer.on('listening', () => {
  console.log(`DNS server listening on ${IP}:${PORT}`);
});

dnsServer.bind(PORT, IP);