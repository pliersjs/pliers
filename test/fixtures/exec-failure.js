function noop() {}

var pliers = require('../..')(
  { logger:
    { debug: noop
    , info: noop
    , warn: noop
    , error: noop }
  })

pliers.exec('ls NO', true, function () {})