module.exports = getPliers

var noop = function () {}
  , Stream = require('stream')
  , nullStream = new Stream()
  , extend = require('lodash.assign')

nullStream.write = noop
nullStream.end = noop

function getPliers(options) {
  return require('../..')(
    extend(
      { output: null
      , logLevel: 'null'
      }, options))
}
