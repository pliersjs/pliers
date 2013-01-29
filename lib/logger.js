module.exports = logger

var util = require('util')
  , levels =
    { 'trace': { rank: 1, color: 'white' }
    , 'debug': { rank: 1, color: 'cyan' }
    , 'info': { rank: 2, color: 'green' }
    , 'warn': { rank: 3, color: 'yellow' }
    , 'error': { rank: 4, color: 'red' }
    , 'fatal': { rank: 4, color: 'inverse' }
    }

function logger(logLevel) {

  var log = {}

  // Default log level
  if (!logLevel) logLevel = 'info'

  // Create a function for each log level
  Object.keys(levels).forEach(function (level) {
    try {
      if (levels[level].rank < levels[logLevel].rank) {
        // loglevel is set higher than this, so let the
        // function be called, but don't output anything
        log[level] = function () {}
      } else {
        // Create a function that has this log level's desired color
        log[level] = writeLog.bind(null, levels[level].color)
      }
    } catch (e) {
      throw new Error('Unsupported log level `' + logLevel + '`')
    }
  })
  return log
}

function writeLog(color) {
  var args = Array.prototype.slice.call(arguments, 1)
  args.unshift((new Date()).toISOString()[color])
  process.stdout.write(util.format.apply(null, args) + '\n')
}