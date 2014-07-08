module.exports = getPliers

var noop = function () {}
  , Stream = require('stream')
  , nullStream = new Stream()
  , _ = require('lodash')

nullStream.write = noop
nullStream.end = noop

function getPliers(options) {
  return require('../..')(
    _.extend({ logger:
      { debug: noop
      , info: noop
      , warn: noop
      , error: noop }
    , output: null
    }, options))
}
