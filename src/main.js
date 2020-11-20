const dgram = require('dgram');
const pkg = require('../package.json');
const args = require('./args.js');
const services = require('./services.json');

if (args['--version']) {
  console.log(pkg.version);
  process.exit();
}

if (args['--help']) {
  console.log('usage:\n  dohp [-p <port>] [-i <bind IP>] [-s <DoH service>]');
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
  const resp = cache.tryItem(msg);

  if (resp !== null) {
    dnsServer.send(resp, rinfo.port, rinfo.address);
    return;
  }

  request(msg, (err, resp) => {
    if (err) {
      console.error(err);
      return;
    }

    cache.record(resp);
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