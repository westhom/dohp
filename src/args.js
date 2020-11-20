const arg = require('arg');

module.exports = arg({
  '--help': Boolean,
  '--version': Boolean,
  '-p': Number,
  '-i': String,
  '-s': String
});