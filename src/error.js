// from: https://github.com/commonshost/dohnut/blob/a27afb50f12f63caf3a9ddfb81ae8b6d89badab0/source/worker.js#L40
function dnsErrorServFail (query) {
  const { questions, flags, id } = dnsPacket.decode(query)

  // http://www.faqs.org/rfcs/rfc2929.html
  //                                 1  1  1  1  1  1
  //   0  1  2  3  4  5  6  7  8  9  0  1  2  3  4  5
  // +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
  // |QR|   Opcode  |AA|TC|RD|RA| Z|AD|CD|   RCODE   |

  return dnsPacket.encode({
    id,
    type: 'response',
    flags:
      (0b0111100000000000 & flags) | // opcode copied from query
      (0b0000000100000000 & flags) | // rd copied from query
      (0b0000000010000000) | // ra always true
      (0b0000000000000010), // rcode always ServFail
    questions
  })
}

module.exports = dnsErrorServFail;