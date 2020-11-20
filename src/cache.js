const dnsPacket = require('dns-packet');
const cache = {};

function drainTTLs() {
  for (key in cache) {
    const res = cache[key];
    res.answers.forEach(ans => {
      ans.ttl--;
    });

    if (res.answers[0].ttl <= 0) {
      delete cache[key];
    }
  }
}

function tryItem(buf) {
  const packet = dnsPacket.decode(buf);
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
  const packet = dnsPacket.decode(buf);
  cache[packet.questions[0].name + packet.questions[0].type] = packet;
}

setInterval(drainTTLs, 1000);

module.exports = {
  tryItem,
  record
}