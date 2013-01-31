
function noop() {}
var Stream = require('stream')
  , nullStream = new Stream()

var pliers = require('../..')(
  { logger:
    { debug: noop
    , info: noop
    , warn: noop
    , error: noop }
  , output: nullStream
  })

pliers.exec('node -v', function () {})