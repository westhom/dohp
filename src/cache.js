const dnsPacket = require('dns-packet');
const cache = {};

function drainTTLs() {
  for (key in cache) {
    const res = cache[key];

    for (let i = 0; i < res.answers.length; i++) {
      res.answers[i].ttl--;

      // if any ttl in record drops below 0, delete from cache
      if (res.answers[i].ttl <= 0) {
        delete cache[key];
        break;
      }
    }
  }
}

function tryItem(buf) {
  let packet;

  try {
    packet = dnsPacket.decode(buf);
  }
  catch (err) {
    console.error('packet decode error:', err.message);
    throw new Error('packet decode failed');
  }

  const existing = cache[packet.questions[0].name + packet.questions[0].type];

  if (!existing) {
    return null;
  }
  else {
    existing.id = packet.id;
    return dnsPacket.encode(existing);
  }
}

function record(buf) {
  let packet;

  packet = dnsPacket.decode(buf);

  if (!packet.answers.length) {
    return;
  }

  cache[packet.questions[0].name + packet.questions[0].type] = packet;
}

setInterval(drainTTLs, 1000);

module.exports = {
  tryItem,
  record
}